import type { Insertable, Kysely } from "kysely";
import type {
  Database,
  DespesaCeapTable,
  OrgaoMembroTable,
  OrientacaoTable,
  ParlamentarTable,
  SuplenteTable,
  VotacaoTable,
  VotoTable,
} from "@/db/types";
import { documentoPublicavel, nomeFornecedorPublicavel } from "@/lib/privacy";
import { comoLista, idSenador, normalizarOrientacao, ORGAO_PLENARIO_SENADO, sexoDoSenado } from "@/lib/senado";
import { inserirEmBlocos, LICENCA_SENADO, registrarColeta } from "./coleta";
import { sha256De, type ClienteEducado } from "./http";

/**
 * Senado Federal: API de dados abertos (legislativo) e API administrativa (CEAPS).
 * Nenhuma das duas pede chave. Toda requisição passa pelo ClienteEducado (R7).
 */
export const API_SENADO = "https://legis.senado.leg.br/dadosabertos";
export const API_ADM_SENADO = "https://adm.senado.gov.br/adm-dadosabertos/api/v1";
export const LEGISLATURA_SENADO = 57;
export const urlCeaps = (ano: number) => `${API_ADM_SENADO}/senadores/despesas_ceaps/${ano}`;
export const urlFotoSenador = (codigo: string | number) =>
  `https://www.senado.leg.br/senadores/img/fotos-oficiais/senador${codigo}.jpg`;

// ---------- formatos da API (só os campos usados) ----------

type Ref = { DescricaoParticipacao?: string; CodigoParlamentar?: string; NomeParlamentar?: string };
type Legislatura = { NumeroLegislatura: string; DataInicio: string; DataFim: string };
export type MandatoApi = {
  UfParlamentar?: string;
  PrimeiraLegislaturaDoMandato?: Legislatura;
  SegundaLegislaturaDoMandato?: Legislatura;
  DescricaoParticipacao?: string;
  Suplentes?: { Suplente?: Ref | Ref[] };
};
export type SenadorApi = {
  IdentificacaoParlamentar: {
    CodigoParlamentar: string;
    NomeParlamentar: string;
    NomeCompletoParlamentar?: string;
    SexoParlamentar?: string;
    UrlFotoParlamentar?: string;
    SiglaPartidoParlamentar?: string;
    UfParlamentar?: string;
    Bloco?: { NomeBloco?: string };
  };
  Mandato?: MandatoApi;
  Mandatos?: { Mandato?: MandatoApi | MandatoApi[] };
};
export type ListaAtualApi = {
  ListaParlamentarEmExercicio: { Parlamentares?: { Parlamentar?: SenadorApi | SenadorApi[] } };
};
export type ListaLegislaturaApi = {
  ListaParlamentarLegislatura: { Parlamentares?: { Parlamentar?: SenadorApi | SenadorApi[] } };
};
export type DetalheApi = {
  DetalheParlamentar: { Parlamentar: { DadosBasicosParlamentar?: { DataNascimento?: string } } };
};
type ComissaoApi = {
  IdentificacaoComissao: { SiglaComissao: string; NomeComissao: string; SiglaCasaComissao?: string };
  DescricaoParticipacao: string;
  DataInicio?: string;
  DataFim?: string;
};
export type ComissoesApi = {
  MembroComissaoParlamentar: { Parlamentar?: { MembroComissoes?: { Comissao?: ComissaoApi | ComissaoApi[] } } };
};

// ---------- transformações puras (testadas em tests/unit/senado-ingest.test.ts) ----------

/** Mandato que inclui a legislatura pedida (um ex-senador pode ter mais de um mandato na lista). */
function mandatoDaLegislatura(s: SenadorApi, legislatura: number): MandatoApi | undefined {
  const lista = s.Mandato ? [s.Mandato] : comoLista(s.Mandatos?.Mandato);
  const n = String(legislatura);
  return (
    lista.find(
      (m) =>
        m.PrimeiraLegislaturaDoMandato?.NumeroLegislatura === n ||
        m.SegundaLegislaturaDoMandato?.NumeroLegislatura === n,
    ) ?? lista[0]
  );
}

export type DadosSenadores = {
  parlamentares: Insertable<ParlamentarTable>[];
  suplentes: Insertable<SuplenteTable>[];
};

/**
 * Senadores da legislatura (SCAD-01) com a situação de hoje (SCAD-02).
 * Partido, bloco, foto e participação vêm da lista atual; quem saiu fica sem partido.
 */
export function montarSenadores(
  legislatura: ListaLegislaturaApi,
  atual: ListaAtualApi,
  nascimentos: Map<string, string>,
  coletaId: number,
  coletaAtualId: number = coletaId,
): DadosSenadores {
  const atuais = new Map(
    comoLista(atual.ListaParlamentarEmExercicio.Parlamentares?.Parlamentar).map((s) => [
      s.IdentificacaoParlamentar.CodigoParlamentar,
      s,
    ]),
  );
  const todos = new Map<string, SenadorApi>();
  for (const s of comoLista(legislatura.ListaParlamentarLegislatura.Parlamentares?.Parlamentar)) {
    todos.set(s.IdentificacaoParlamentar.CodigoParlamentar, s);
  }
  for (const [cod, s] of atuais) if (!todos.has(cod)) todos.set(cod, s);

  const parlamentares: Insertable<ParlamentarTable>[] = [];
  const suplentes: Insertable<SuplenteTable>[] = [];
  for (const [cod, s] of todos) {
    const hoje = atuais.get(cod);
    const fonte = hoje ?? s;
    const ident = fonte.IdentificacaoParlamentar;
    const mandato =
      (hoje && mandatoDaLegislatura(hoje, LEGISLATURA_SENADO)) ?? mandatoDaLegislatura(s, LEGISLATURA_SENADO);
    const id = idSenador(cod);
    parlamentares.push({
      id,
      casa: "senado",
      nome: ident.NomeParlamentar,
      nome_civil: ident.NomeCompletoParlamentar || s.IdentificacaoParlamentar.NomeCompletoParlamentar || null,
      sigla_partido: hoje ? hoje.IdentificacaoParlamentar.SiglaPartidoParlamentar || null : null,
      sigla_uf: mandato?.UfParlamentar || ident.UfParlamentar || null,
      url_foto: urlFotoSenador(cod),
      data_nascimento: nascimentos.get(cod) ?? null,
      sexo: sexoDoSenado(ident.SexoParlamentar ?? s.IdentificacaoParlamentar.SexoParlamentar),
      id_legislatura: LEGISLATURA_SENADO,
      em_exercicio: Boolean(hoje),
      mandato_inicio: mandato?.PrimeiraLegislaturaDoMandato?.DataInicio ?? null,
      mandato_fim:
        mandato?.SegundaLegislaturaDoMandato?.DataFim ?? mandato?.PrimeiraLegislaturaDoMandato?.DataFim ?? null,
      participacao: mandato?.DescricaoParticipacao?.trim() || null,
      bloco: hoje?.IdentificacaoParlamentar.Bloco?.NomeBloco || null,
      source_url: `${API_SENADO}/senador/${cod}`,
      coleta_id: coletaId,
    });
    if (hoje) {
      comoLista(mandato?.Suplentes?.Suplente).forEach((sup, i) => {
        if (!sup.NomeParlamentar) return;
        const ordem = Number(/^(\d+)/.exec(sup.DescricaoParticipacao ?? "")?.[1]) || i + 1;
        suplentes.push({
          parlamentar_id: id,
          ordem,
          nome: sup.NomeParlamentar,
          codigo: sup.CodigoParlamentar ? Number(sup.CodigoParlamentar) : null,
          coleta_id: coletaAtualId,
        });
      });
    }
  }
  return { parlamentares, suplentes };
}

/** Data de nascimento do detalhe do senador (`/senador/{codigo}`), para casar com o TSE (SCAD-04). */
export function nascimentoDoDetalhe(d: DetalheApi): string | null {
  const v = d.DetalheParlamentar?.Parlamentar?.DadosBasicosParlamentar?.DataNascimento;
  return v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null;
}

/** Comissões atuais do Senado (sem data de fim, Casa SF). */
export function montarComissoes(codigo: string, r: ComissoesApi, coletaId: number): Insertable<OrgaoMembroTable>[] {
  return comoLista(r.MembroComissaoParlamentar.Parlamentar?.MembroComissoes?.Comissao)
    .filter((c) => !c.DataFim && (c.IdentificacaoComissao.SiglaCasaComissao ?? "SF") === "SF")
    .map((c) => ({
      parlamentar_id: idSenador(codigo),
      sigla_orgao: c.IdentificacaoComissao.SiglaComissao,
      nome_orgao: c.IdentificacaoComissao.NomeComissao,
      cargo: c.DescricaoParticipacao,
      data_inicio: c.DataInicio ?? null,
      data_fim: null,
      coleta_id: coletaId,
    }));
}

export type DespesaCeapsApi = {
  id: number;
  ano: number;
  mes: number;
  codSenador: number;
  tipoDespesa: string | null;
  cpfCnpj: string | null;
  fornecedor: string | null;
  documento: string | null;
  data: string | null;
  valorReembolsado: number;
};

export const TIPO_NAO_INFORMADO = "Não informado pelo Senado";

/**
 * Notas da CEAPS. O Senado publica só o valor reembolsado (sem glosa), que vira o valor líquido.
 * R3: CPF não é gravado, nem completo nem na máscara do Senado ("000.***.***-00"), porque máscaras
 * de fontes diferentes juntas remontariam o número. Documento
 * malformado ou ausente é tratado como de pessoa física: sem documento e sem nome.
 */
export function montarDespesasCeaps(notas: DespesaCeapsApi[], idsValidos: Set<number>, coletaId: number) {
  const linhas: Insertable<DespesaCeapTable>[] = [];
  let descartadas = 0;
  for (const n of notas) {
    const id = idSenador(n.codSenador);
    if (!idsValidos.has(id)) {
      descartadas++;
      continue;
    }
    const bruto = (n.cpfCnpj ?? "").trim();
    const pub = documentoPublicavel(bruto);
    // Só CNPJ válido mantém nome e documento. CPF mascarado na fonte, documento malformado ou ausente
    // podem ser de pessoa física: sem documento e com o rótulo genérico (R3).
    const { doc, classe } =
      pub.classe === "pessoa_juridica" || pub.classe === "terceiro_pf"
        ? pub
        : { doc: null, classe: "terceiro_pf" as const };
    const valor = Number(n.valorReembolsado) || 0;
    linhas.push({
      parlamentar_id: id,
      ano: n.ano,
      mes: n.mes,
      tipo_despesa: n.tipoDespesa?.trim() || TIPO_NAO_INFORMADO,
      fornecedor_nome: nomeFornecedorPublicavel(n.fornecedor ?? "", classe) || "Não informado",
      fornecedor_doc: doc,
      fornecedor_classe: classe,
      data_emissao: n.data ? n.data.slice(0, 10) : null,
      valor_documento: valor,
      valor_glosa: 0,
      valor_liquido: valor,
      valor_restituicao: 0,
      url_documento: null,
      ide_documento: String(n.id),
      coleta_id: coletaId,
    });
  }
  return { linhas, descartadas };
}

export type VotacaoSenadoApi = {
  codigoMateria: number | null;
  dataSessao: string;
  descricaoVotacao: string | null;
  ementa: string | null;
  identificacao: string | null;
  resultadoVotacao: string | null;
  sequencialVotacao: number;
  votacaoSecreta: string | null;
  totalVotosSim: number | null;
  totalVotosNao: number | null;
  totalVotosAbstencao: number | null;
  votos: { codigoParlamentar: number; siglaPartidoParlamentar: string | null; siglaVotoParlamentar: string }[];
};
export type OrientacoesSenadoApi = {
  votacoes: { sequencialVotacao: number; orientacoesLideranca?: { partido: string; voto: string }[] }[];
};

export const idVotacaoSenado = (sequencial: number | string) => `SF-${sequencial}`;
export const urlMateriaSenado = (codigo: number) =>
  `https://www25.senado.leg.br/web/atividade/materias/-/materia/${codigo}`;

/** Votações nominais do Plenário do Senado com o voto de cada senador cadastrado (SVOT-01, SVOT-02). */
export function montarVotacoesSenado(lista: VotacaoSenadoApi[], idsValidos: Set<number>, coletaId: number) {
  const votacoes = new Map<string, Insertable<VotacaoTable>>();
  const votos: Insertable<VotoTable>[] = [];
  for (const v of lista) {
    const id = idVotacaoSenado(v.sequencialVotacao);
    if (votacoes.has(id)) continue;
    const conta = (s: string) => v.votos.filter((x) => x.siglaVotoParlamentar === s).length;
    const sim = v.totalVotosSim ?? conta("Sim");
    const nao = v.totalVotosNao ?? conta("Não");
    const abst = v.totalVotosAbstencao ?? conta("Abstenção");
    votacoes.set(id, {
      id,
      data: v.dataSessao.slice(0, 10),
      sigla_orgao: ORGAO_PLENARIO_SENADO,
      descricao: v.descricaoVotacao?.trim() || v.identificacao || id,
      proposicao: v.identificacao,
      proposicao_sigla: v.identificacao,
      proposicao_ementa: v.ementa?.trim() || null,
      aprovacao: v.resultadoVotacao === "A" ? 1 : v.resultadoVotacao === "R" ? 0 : null,
      votos_sim: sim,
      votos_nao: nao,
      votos_outros: abst,
      secreta: v.votacaoSecreta === "S",
      source_url: v.codigoMateria ? urlMateriaSenado(v.codigoMateria) : `${API_SENADO}/votacao`,
      coleta_id: coletaId,
    });
    for (const x of v.votos) {
      const pid = idSenador(x.codigoParlamentar);
      if (!idsValidos.has(pid)) continue;
      votos.push({
        votacao_id: id,
        parlamentar_id: pid,
        voto: x.siglaVotoParlamentar,
        sigla_partido: x.siglaPartidoParlamentar || null,
        coleta_id: coletaId,
      });
    }
  }
  return { votacoes: [...votacoes.values()], votos };
}

/** Orientações das lideranças, ligadas à votação pelo sequencial (SVOT-03). */
export function montarOrientacoesSenado(
  r: OrientacoesSenadoApi,
  idsVotacoes: Set<string>,
  coletaId: number,
): Insertable<OrientacaoTable>[] {
  const linhas = new Map<string, Insertable<OrientacaoTable>>();
  for (const v of r.votacoes ?? []) {
    const id = idVotacaoSenado(v.sequencialVotacao);
    if (!idsVotacoes.has(id)) continue;
    for (const o of v.orientacoesLideranca ?? []) {
      if (!o.partido || !o.voto) continue;
      linhas.set(`${id}|${o.partido}`, {
        votacao_id: id,
        sigla_bancada: o.partido.trim(),
        orientacao: normalizarOrientacao(o.voto),
        coleta_id: coletaId,
      });
    }
  }
  return [...linhas.values()];
}

// ---------- carregadores (rede + banco) ----------

/** Subconsulta dos ids de senadores: as trocas da coleta do Senado nunca tocam deputados. */
const doSenado = (q: Kysely<Database>) => q.selectFrom("parlamentar").select("id").where("casa", "=", "senado");

/** Baixa JSON e devolve também o texto, para o hash da proveniência (R1). */
async function baixarJson<T>(cli: ClienteEducado, url: string) {
  const texto = await (await cli.get(url)).text();
  return { dado: JSON.parse(texto) as T, sha256: sha256De(texto), bytes: Buffer.byteLength(texto) };
}

/**
 * Cadastro: lista da legislatura + lista atual + 1 detalhe e 1 lista de comissões por senador
 * em exercício (~165 requisições a 1 req/s). Tudo é baixado antes de gravar.
 */
export async function coletarSenadores(db: Kysely<Database>, cli: ClienteEducado) {
  const urlLeg = `${API_SENADO}/senador/lista/legislatura/${LEGISLATURA_SENADO}.json`;
  const urlAtual = `${API_SENADO}/senador/lista/atual.json`;
  const leg = await baixarJson<ListaLegislaturaApi>(cli, urlLeg);
  const atual = await baixarJson<ListaAtualApi>(cli, urlAtual);
  const codigos = comoLista(atual.dado.ListaParlamentarEmExercicio.Parlamentares?.Parlamentar).map(
    (s) => s.IdentificacaoParlamentar.CodigoParlamentar,
  );
  const detalhes: { cod: string; url: string; r: Awaited<ReturnType<typeof baixarJson<DetalheApi>>> }[] = [];
  const comissoes: { cod: string; url: string; r: Awaited<ReturnType<typeof baixarJson<ComissoesApi>>> }[] = [];
  for (const cod of codigos) {
    const urlDet = `${API_SENADO}/senador/${cod}.json`;
    detalhes.push({ cod, url: urlDet, r: await baixarJson<DetalheApi>(cli, urlDet) });
    const urlCom = `${API_SENADO}/senador/${cod}/comissoes.json`;
    comissoes.push({ cod, url: urlCom, r: await baixarJson<ComissoesApi>(cli, urlCom) });
  }

  // R1/SCAD-05: uma linha em `coleta` por resposta baixada.
  const registrar = (fonte: string, url: string, r: { sha256: string; bytes: number }) =>
    registrarColeta(db, { fonte, url, sha256: r.sha256, bytes: r.bytes, licenca: LICENCA_SENADO });
  const cCadastro = await registrar("senado_api_senadores", urlLeg, leg);
  const cAtual = await registrar("senado_api_senadores_atual", urlAtual, atual);
  const nascimentos = new Map<string, string>();
  for (const d of detalhes) {
    await registrar("senado_api_detalhe", d.url, d.r);
    const nasc = nascimentoDoDetalhe(d.r.dado);
    if (nasc) nascimentos.set(d.cod, nasc);
  }
  const orgaos: Insertable<OrgaoMembroTable>[] = [];
  for (const c of comissoes) {
    const id = await registrar("senado_api_comissoes", c.url, c.r);
    orgaos.push(...montarComissoes(c.cod, c.r.dado, id));
  }
  const m = montarSenadores(leg.dado, atual.dado, nascimentos, cCadastro, cAtual);

  await db.transaction().execute(async (trx) => {
    for (const r of m.parlamentares) {
      await trx
        .insertInto("parlamentar")
        .values(r)
        .onConflict((oc) => oc.column("id").doUpdateSet(r))
        .execute();
    }
    await trx.deleteFrom("suplente").where("parlamentar_id", "in", doSenado(trx)).execute();
    await inserirEmBlocos(trx, "suplente", m.suplentes);
    await trx.deleteFrom("orgao_membro").where("parlamentar_id", "in", doSenado(trx)).execute();
    await inserirEmBlocos(trx, "orgao_membro", orgaos);
  });
  return { senadores: m.parlamentares.length, suplentes: m.suplentes.length, comissoes: orgaos.length };
}

/** CEAPS de um ano: uma requisição à API administrativa do Senado. Só troca as notas de senadores. */
export async function coletarCeaps(db: Kysely<Database>, cli: ClienteEducado, ano: number) {
  const url = urlCeaps(ano);
  const r = await baixarJson<DespesaCeapsApi[]>(cli, url);
  const coletaId = await registrarColeta(db, {
    fonte: "senado_ceaps",
    url,
    sha256: r.sha256,
    bytes: r.bytes,
    licenca: LICENCA_SENADO,
  });
  const ids = await db.selectFrom("parlamentar").select("id").where("casa", "=", "senado").execute();
  const m = montarDespesasCeaps(r.dado, new Set(ids.map((i) => i.id)), coletaId);
  await db.transaction().execute(async (trx) => {
    await trx.deleteFrom("despesa_ceap").where("ano", "=", ano).where("parlamentar_id", "in", doSenado(trx)).execute();
    await inserirEmBlocos(trx, "despesa_ceap", m.linhas);
  });
  return { notas: m.linhas.length, descartadas: m.descartadas };
}

const aaaammdd = (d: string) => d.replaceAll("-", "");

/** Votações do ano: uma requisição de votações (com os votos) e uma de orientações (SVOT-04). */
export async function coletarVotacoesSenado(db: Kysely<Database>, cli: ClienteEducado, ano: number) {
  const ini = `${ano}-01-01`;
  const fim = `${ano}-12-31`;
  const urlVot = `${API_SENADO}/votacao?dataInicio=${ini}&dataFim=${fim}`;
  const urlOri = `${API_SENADO}/plenario/votacao/orientacaoBancada/${aaaammdd(ini)}/${aaaammdd(fim)}.json`;
  const vot = await baixarJson<VotacaoSenadoApi[]>(cli, urlVot);
  const ori = await baixarJson<OrientacoesSenadoApi>(cli, urlOri);
  const cVot = await registrarColeta(db, {
    fonte: "senado_votacoes",
    url: urlVot,
    sha256: vot.sha256,
    bytes: vot.bytes,
    licenca: LICENCA_SENADO,
  });
  const cOri = await registrarColeta(db, {
    fonte: "senado_orientacoes",
    url: urlOri,
    sha256: ori.sha256,
    bytes: ori.bytes,
    licenca: LICENCA_SENADO,
  });
  const ids = await db.selectFrom("parlamentar").select("id").where("casa", "=", "senado").execute();
  const m = montarVotacoesSenado(comoLista(vot.dado), new Set(ids.map((i) => i.id)), cVot);
  const orientacoes = montarOrientacoesSenado(ori.dado, new Set(m.votacoes.map((v) => v.id)), cOri);
  await db.transaction().execute(async (trx) => {
    await trx
      .deleteFrom("votacao")
      .where("sigla_orgao", "=", ORGAO_PLENARIO_SENADO)
      .where("data", ">=", ini)
      .where("data", "<=", fim)
      .execute();
    await inserirEmBlocos(trx, "votacao", m.votacoes);
    await inserirEmBlocos(trx, "voto", m.votos);
    await inserirEmBlocos(trx, "orientacao", orientacoes);
  });
  return { votacoes: m.votacoes.length, votos: m.votos.length, orientacoes: orientacoes.length };
}
