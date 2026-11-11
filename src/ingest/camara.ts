import type { Insertable, Kysely } from "kysely";
import type {
  Database,
  DespesaCeapTable,
  BlocoPartidoTable,
  BlocoTable,
  OrgaoMembroTable,
  OrientacaoTable,
  ParlamentarTable,
  VotacaoTable,
  VotoTable,
} from "@/db/types";
import { numeroBr } from "@/lib/format";
import { partidosDoNomeDoBloco } from "@/lib/metrics";
import { documentoPublicavel, nomeFornecedorPublicavel } from "@/lib/privacy";
import { extrairDoZip, idDaUri, lerCsv, type Linha } from "./arquivos";
import { inserirEmBlocos, LICENCA_CAMARA, registrarColeta } from "./coleta";
import { sha256De, type ClienteEducado } from "./http";

export const API = "https://dadosabertos.camara.leg.br/api/v2";
export const ARQUIVOS = "https://dadosabertos.camara.leg.br/arquivos";
export const LEGISLATURA_ATUAL = 57;
export const urlCeap = (ano: number) => `https://www.camara.leg.br/cotas/Ano-${ano}.csv.zip`;

type DeputadoApi = {
  id: number;
  uri: string;
  nome: string;
  siglaPartido: string | null;
  siglaUf: string | null;
  urlFoto: string | null;
};
type BlocoApi = { id: string; uri: string; nome: string; idLegislatura: string; federacao: boolean };
type PartidoDoBlocoApi = { sigla: string };
type Pagina<T> = { dados: T[]; links?: { rel: string; href: string }[] };

async function todasPaginas<T>(cli: ClienteEducado, url: string) {
  const itens: T[] = [];
  const brutos: string[] = [];
  let prox: string | undefined = url;
  while (prox) {
    const p: Pagina<T> = await cli.json<Pagina<T>>(prox);
    brutos.push(JSON.stringify(p.dados));
    itens.push(...p.dados);
    prox = p.links?.find((l) => l.rel === "next")?.href;
  }
  return { itens, sha256: sha256De(brutos.join("\n")), bytes: brutos.join("\n").length };
}

// ---------- transformações puras (testadas em tests/unit) ----------

export function montarParlamentares(
  legislatura: DeputadoApi[],
  emExercicio: Set<number>,
  lote: Linha[],
  coletaId: number,
): Insertable<ParlamentarTable>[] {
  const porId = new Map<number, Linha>();
  for (const l of lote) {
    const id = idDaUri(l.uri);
    if (id) porId.set(id, l);
  }
  const unicos = new Map<number, DeputadoApi>();
  for (const d of legislatura) unicos.set(d.id, d); // a última entrada reflete o partido atual
  return [...unicos.values()].map((d) => {
    const extra = porId.get(d.id);
    return {
      id: d.id,
      casa: "camara" as const,
      nome: d.nome,
      nome_civil: extra?.nomeCivil || null,
      sigla_partido: d.siglaPartido,
      sigla_uf: d.siglaUf,
      url_foto: d.urlFoto,
      data_nascimento: extra?.dataNascimento || null,
      id_legislatura: LEGISLATURA_ATUAL,
      em_exercicio: emExercicio.has(d.id),
      source_url: `${API}/deputados/${d.id}`,
      coleta_id: coletaId,
    };
  });
}

/**
 * Converte uma linha do arquivo anual da CEAP.
 * R2: não guardamos `txtPassageiro` (nome de terceiro) nem o CPF do parlamentar.
 * R3: documento de fornecedor PF sai mascarado e o nome vira rótulo genérico.
 */
export function linhaCeap(l: Linha, idsValidos: Set<number>, coletaId: number): Insertable<DespesaCeapTable> | null {
  const id = Number(l.ideCadastro);
  if (!id || !idsValidos.has(id)) return null; // lideranças e ex-deputados ficam de fora
  const { doc, classe } = documentoPublicavel(l.txtCNPJCPF);
  return {
    parlamentar_id: id,
    ano: Number(l.numAno),
    mes: Number(l.numMes),
    tipo_despesa: l.txtDescricao,
    fornecedor_nome: nomeFornecedorPublicavel(l.txtFornecedor ?? "", classe),
    fornecedor_doc: doc,
    fornecedor_classe: classe,
    data_emissao: l.datEmissao ? l.datEmissao.slice(0, 10) : null,
    valor_documento: numeroBr(l.vlrDocumento),
    valor_glosa: numeroBr(l.vlrGlosa),
    valor_liquido: numeroBr(l.vlrLiquido),
    valor_restituicao: numeroBr(l.vlrRestituicao),
    url_documento: l.urlDocumento || null,
    ide_documento: l.ideDocumento || null,
    coleta_id: coletaId,
  };
}

export function montarVotacoes(
  votacoes: Linha[],
  votos: Linha[],
  orientacoes: Linha[],
  coletas: { votacoes: number; votos: number; orientacoes: number },
) {
  const nominais = new Set(votos.map((v) => v.idVotacao));
  const vts: Insertable<VotacaoTable>[] = votacoes
    .filter((v) => nominais.has(v.id))
    .map((v) => ({
      id: v.id,
      data: v.data,
      sigla_orgao: v.siglaOrgao,
      descricao: v.descricao,
      proposicao: v.ultimaApresentacaoProposicao_descricao || null,
      aprovacao: v.aprovacao === "" ? null : Number(v.aprovacao),
      votos_sim: Number(v.votosSim) || 0,
      votos_nao: Number(v.votosNao) || 0,
      votos_outros: Number(v.votosOutros) || 0,
      source_url: v.uri,
      coleta_id: coletas.votacoes,
    }));
  const ids = new Set(vts.map((v) => v.id));
  const vs = new Map<string, Insertable<VotoTable>>();
  for (const v of votos) {
    const pid = Number(v.deputado_id);
    if (!ids.has(v.idVotacao) || !pid) continue;
    vs.set(`${v.idVotacao}|${pid}`, {
      votacao_id: v.idVotacao,
      parlamentar_id: pid,
      voto: v.voto,
      sigla_partido: v.deputado_siglaPartido || null,
      coleta_id: coletas.votos,
    });
  }
  const os = new Map<string, Insertable<OrientacaoTable>>();
  for (const o of orientacoes) {
    if (!ids.has(o.idVotacao) || !o.siglaBancada) continue;
    os.set(`${o.idVotacao}|${o.siglaBancada}`, {
      votacao_id: o.idVotacao,
      sigla_bancada: o.siglaBancada,
      orientacao: o.orientacao,
      coleta_id: coletas.orientacoes,
    });
  }
  return { votacoes: vts, votos: [...vs.values()], orientacoes: [...os.values()] };
}

/** Partidos de cada bloco: os da API; se a API vier vazia, os do nome do bloco. */
export function montarBlocos(
  blocos: BlocoApi[],
  partidosPorBloco: Map<string, PartidoDoBlocoApi[]>,
  coletaId: number,
): { blocos: Insertable<BlocoTable>[]; partidos: Insertable<BlocoPartidoTable>[] } {
  const bs: Insertable<BlocoTable>[] = [];
  const ps = new Map<string, Insertable<BlocoPartidoTable>>();
  for (const b of blocos) {
    const id = Number(b.id);
    if (!id || !b.nome) continue;
    bs.push({
      id,
      nome: b.nome,
      id_legislatura: Number(b.idLegislatura),
      federacao: !!b.federacao,
      coleta_id: coletaId,
    });
    const daApi = (partidosPorBloco.get(b.id) ?? []).map((p) => p.sigla).filter(Boolean);
    const origem = daApi.length ? "api" : "nome";
    const siglas = daApi.length ? daApi : partidosDoNomeDoBloco(b.nome);
    for (const sigla of siglas) {
      ps.set(`${id}|${sigla}`, { bloco_id: id, sigla_partido: sigla, origem, coleta_id: coletaId });
    }
  }
  return { blocos: bs, partidos: [...ps.values()] };
}

export function montarOrgaos(
  linhas: Linha[],
  idsValidos: Set<number>,
  coletaId: number,
): Insertable<OrgaoMembroTable>[] {
  return linhas.flatMap((l) => {
    const id = idDaUri(l.uriDeputado);
    if (!id || !idsValidos.has(id)) return [];
    return [
      {
        parlamentar_id: id,
        sigla_orgao: l.siglaOrgao,
        nome_orgao: l.nomePublicacaoOrgao || l.nomeOrgao,
        cargo: l.cargo,
        data_inicio: l.dataInicio || null,
        data_fim: l.dataFim || null,
        coleta_id: coletaId,
      },
    ];
  });
}

// ---------- carregadores (rede + banco) ----------

export async function idsParlamentares(db: Kysely<Database>) {
  const rows = await db.selectFrom("parlamentar").select("id").execute();
  return new Set(rows.map((r) => r.id));
}

export async function coletarDeputados(db: Kysely<Database>, cli: ClienteEducado) {
  const urlLeg = `${API}/deputados?idLegislatura=${LEGISLATURA_ATUAL}&itens=100&ordem=ASC&ordenarPor=nome`;
  const urlAtual = `${API}/deputados?itens=100&ordem=ASC&ordenarPor=nome`;
  const urlLote = `${ARQUIVOS}/deputados/csv/deputados.csv`;
  const leg = await todasPaginas<DeputadoApi>(cli, urlLeg);
  const atual = await todasPaginas<DeputadoApi>(cli, urlAtual);
  const lote = await cli.baixar(urlLote, ".cache/ingest");

  const cApi = await registrarColeta(db, {
    fonte: "camara_api_deputados",
    url: urlLeg,
    sha256: sha256De(leg.sha256 + atual.sha256),
    bytes: leg.bytes + atual.bytes,
    licenca: LICENCA_CAMARA,
    observacao: `Inclui ${urlAtual} para a situação em exercício`,
  });
  await registrarColeta(db, {
    fonte: "camara_lote_deputados",
    url: urlLote,
    sha256: lote.sha256,
    bytes: lote.bytes,
    licenca: LICENCA_CAMARA,
  });
  const rows = montarParlamentares(leg.itens, new Set(atual.itens.map((d) => d.id)), lerCsv(lote.buf), cApi);
  await db.transaction().execute(async (trx) => {
    for (const r of rows) {
      await trx
        .insertInto("parlamentar")
        .values(r)
        .onConflict((oc) => oc.column("id").doUpdateSet(r))
        .execute();
    }
  });
  return rows.length;
}

export async function coletarCeap(db: Kysely<Database>, cli: ClienteEducado, ano: number) {
  const url = urlCeap(ano);
  const zip = await cli.baixar(url, ".cache/ingest");
  const csv = await extrairDoZip(zip.buf, (n) => n.endsWith(".csv"));
  const coletaId = await registrarColeta(db, {
    fonte: "camara_ceap",
    url,
    sha256: zip.sha256,
    bytes: zip.bytes,
    licenca: LICENCA_CAMARA,
  });
  const ids = await idsParlamentares(db);
  const rows = lerCsv(csv).flatMap((l) => {
    const r = linhaCeap(l, ids, coletaId);
    return r ? [r] : [];
  });
  await db.transaction().execute(async (trx) => {
    await trx.deleteFrom("despesa_ceap").where("ano", "=", ano).execute();
    await inserirEmBlocos(trx, "despesa_ceap", rows);
  });
  return rows.length;
}

export async function coletarVotacoes(db: Kysely<Database>, cli: ClienteEducado, ano: number) {
  const urls = {
    votacoes: `${ARQUIVOS}/votacoes/csv/votacoes-${ano}.csv`,
    votos: `${ARQUIVOS}/votacoesVotos/csv/votacoesVotos-${ano}.csv`,
    orientacoes: `${ARQUIVOS}/votacoesOrientacoes/csv/votacoesOrientacoes-${ano}.csv`,
  };
  const arquivos = {
    votacoes: await cli.baixar(urls.votacoes, ".cache/ingest"),
    votos: await cli.baixar(urls.votos, ".cache/ingest"),
    orientacoes: await cli.baixar(urls.orientacoes, ".cache/ingest"),
  };
  const coletas = {
    votacoes: 0,
    votos: 0,
    orientacoes: 0,
  };
  for (const k of ["votacoes", "votos", "orientacoes"] as const) {
    coletas[k] = await registrarColeta(db, {
      fonte: `camara_lote_${k}`,
      url: urls[k],
      sha256: arquivos[k].sha256,
      bytes: arquivos[k].bytes,
      licenca: LICENCA_CAMARA,
    });
  }
  const m = montarVotacoes(
    lerCsv(arquivos.votacoes.buf),
    lerCsv(arquivos.votos.buf),
    lerCsv(arquivos.orientacoes.buf),
    coletas,
  );
  await db.transaction().execute(async (trx) => {
    await trx.deleteFrom("votacao").where("data", ">=", `${ano}-01-01`).where("data", "<=", `${ano}-12-31`).execute();
    await inserirEmBlocos(trx, "votacao", m.votacoes);
    await inserirEmBlocos(trx, "voto", m.votos);
    await inserirEmBlocos(trx, "orientacao", m.orientacoes);
  });
  return { votacoes: m.votacoes.length, votos: m.votos.length, orientacoes: m.orientacoes.length };
}

export async function coletarOrgaos(db: Kysely<Database>, cli: ClienteEducado) {
  const url = `${ARQUIVOS}/orgaosDeputados/csv/orgaosDeputados-L${LEGISLATURA_ATUAL}.csv`;
  const arq = await cli.baixar(url, ".cache/ingest");
  const coletaId = await registrarColeta(db, {
    fonte: "camara_lote_orgaos_deputados",
    url,
    sha256: arq.sha256,
    bytes: arq.bytes,
    licenca: LICENCA_CAMARA,
  });
  const rows = montarOrgaos(lerCsv(arq.buf), await idsParlamentares(db), coletaId);
  await db.transaction().execute(async (trx) => {
    await trx.deleteFrom("orgao_membro").execute();
    await inserirEmBlocos(trx, "orgao_membro", rows);
  });
  return rows.length;
}

/** Blocos da legislatura e seus partidos: 1 requisição da lista + 1 por bloco (poucos, ~10). */
export async function coletarBlocos(db: Kysely<Database>, cli: ClienteEducado) {
  const urlLista = `${API}/blocos?idLegislatura=${LEGISLATURA_ATUAL}&itens=100`;
  const lista = await todasPaginas<BlocoApi>(cli, urlLista);
  const partidos = new Map<string, PartidoDoBlocoApi[]>();
  const brutos: string[] = [lista.sha256];
  let bytes = lista.bytes;
  for (const b of lista.itens) {
    const r = await todasPaginas<PartidoDoBlocoApi>(cli, `${API}/blocos/${b.id}/partidos`);
    partidos.set(b.id, r.itens);
    brutos.push(r.sha256);
    bytes += r.bytes;
  }
  const coletaId = await registrarColeta(db, {
    fonte: "camara_api_blocos",
    url: urlLista,
    sha256: sha256De(brutos.join("\n")),
    bytes,
    licenca: LICENCA_CAMARA,
    observacao: `Inclui ${API}/blocos/{id}/partidos de ${lista.itens.length} blocos`,
  });
  const m = montarBlocos(lista.itens, partidos, coletaId);
  await db.transaction().execute(async (trx) => {
    await trx.deleteFrom("bloco").where("id_legislatura", "=", LEGISLATURA_ATUAL).execute();
    await inserirEmBlocos(trx, "bloco", m.blocos);
    await inserirEmBlocos(trx, "bloco_partido", m.partidos);
  });
  return { blocos: m.blocos.length, partidos: m.partidos.length };
}
