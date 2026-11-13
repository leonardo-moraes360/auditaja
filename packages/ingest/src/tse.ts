import type { Insertable, Kysely } from "kysely";
import type { BemDeclaradoTable, CampanhaDespesaTable, CandidaturaTable, Database } from "@auditaja/db/types";
import { valorBr } from "@auditaja/core/emendas";
import { numeroBr } from "@auditaja/core/format";
import { soDigitos } from "@auditaja/core/privacy";
import { cnpjValido } from "@auditaja/core/trilha";
import { dataBrParaIso, extrairDoZip, lerCsv, linhasCsvDoZip, normalizarNome, type Linha } from "./arquivos";
import { inserirEmBlocos, LICENCA_TSE, registrarColeta } from "./coleta";
import type { ClienteEducado } from "./http";

/**
 * TSE por download em lote (o robots.txt do CKAN proíbe /api/).
 * R2/R10: não guardamos CPF, título, e-mail, cor/raça, estado civil nem a descrição
 * livre dos bens (pode conter endereço). Só o tipo e o valor de cada bem.
 */
const CDN = "https://cdn.tse.jus.br/estatistica/sead/odsele";
export const urlCandidatos = (ano: number) => `${CDN}/consulta_cand/consulta_cand_${ano}.zip`;
export const urlBens = (ano: number) => `${CDN}/bem_candidato/bem_candidato_${ano}.zip`;
export const urlContas = (ano: number) =>
  `${CDN}/prestacao_contas/prestacao_de_contas_eleitorais_candidatos_${ano}.zip`;

export type ParlamentarParaCasar = {
  id: number;
  nome_civil: string | null;
  data_nascimento: string | null;
  sigla_uf: string | null;
};

/**
 * Casa candidaturas do TSE com deputados da Câmara.
 * Chave: nome civil normalizado. Desempate: data de nascimento quando os dois lados
 * a publicam; senão, exige UF igual. Casamentos ambíguos são descartados.
 */
export function casarCandidaturas(
  candidatos: Linha[],
  parlamentares: ParlamentarParaCasar[],
  ano: number,
  coletaId: number,
): Insertable<CandidaturaTable>[] {
  const porNome = new Map<string, ParlamentarParaCasar[]>();
  for (const p of parlamentares) {
    const k = normalizarNome(p.nome_civil);
    if (!k) continue;
    porNome.set(k, [...(porNome.get(k) ?? []), p]);
  }
  const vistos = new Map<string, Insertable<CandidaturaTable>>();
  for (const c of candidatos) {
    const ps = porNome.get(normalizarNome(c.NM_CANDIDATO));
    if (!ps) continue;
    const nasc = dataBrParaIso(c.DT_NASCIMENTO);
    const alvo = ps.filter((p) => (nasc && p.data_nascimento ? p.data_nascimento === nasc : p.sigla_uf === c.SG_UF));
    if (alvo.length !== 1) continue;
    // Mesmo candidato pode aparecer em mais de um turno: fica a última linha.
    vistos.set(c.SQ_CANDIDATO, {
      ano_eleicao: ano,
      sq_candidato: c.SQ_CANDIDATO,
      parlamentar_id: alvo[0].id,
      cargo: c.DS_CARGO,
      sigla_uf: c.SG_UF,
      sigla_partido: c.SG_PARTIDO || null,
      situacao: c.DS_SIT_TOT_TURNO && !c.DS_SIT_TOT_TURNO.startsWith("#") ? c.DS_SIT_TOT_TURNO : null,
      coleta_id: coletaId,
    });
  }
  return [...vistos.values()];
}

export function montarBens(
  bens: Linha[],
  candidaturas: Insertable<CandidaturaTable>[],
  ano: number,
  coletaId: number,
): Insertable<BemDeclaradoTable>[] {
  const porSq = new Map(candidaturas.map((c) => [c.sq_candidato, c.parlamentar_id]));
  return bens.flatMap((b) => {
    const pid = porSq.get(b.SQ_CANDIDATO);
    if (!pid) return [];
    return [
      {
        ano_eleicao: ano,
        sq_candidato: b.SQ_CANDIDATO,
        parlamentar_id: pid,
        ordem: Number(b.NR_ORDEM_BEM_CANDIDATO) || 0,
        tipo: b.DS_TIPO_BEM_CANDIDATO,
        valor: numeroBr(b.VR_BEM_CANDIDATO),
        coleta_id: coletaId,
      },
    ];
  });
}

async function lerCsvNacional(zip: Buffer, prefixo: string): Promise<Linha[]> {
  try {
    return lerCsv(await extrairDoZip(zip, `${prefixo}_BRASIL.csv`), "latin1");
  } catch {
    // Anos antigos podem não ter o arquivo nacional; junta os arquivos por UF.
    const ufs = "AC AL AM AP BA CE DF ES GO MA MG MS MT PA PB PE PI PR RJ RN RO RR RS SC SE SP TO BR".split(" ");
    const linhas: Linha[] = [];
    for (const uf of ufs) {
      try {
        linhas.push(...lerCsv(await extrairDoZip(zip, `${prefixo}_${uf}.csv`), "latin1"));
      } catch {
        /* UF ausente no pacote */
      }
    }
    return linhas;
  }
}

export async function coletarBens(db: Kysely<Database>, cli: ClienteEducado, ano: number) {
  const zCand = await cli.baixar(urlCandidatos(ano), ".cache/ingest");
  const zBens = await cli.baixar(urlBens(ano), ".cache/ingest");
  const cCand = await registrarColeta(db, {
    fonte: "tse_consulta_cand",
    url: urlCandidatos(ano),
    sha256: zCand.sha256,
    bytes: zCand.bytes,
    licenca: LICENCA_TSE,
  });
  const cBens = await registrarColeta(db, {
    fonte: "tse_bem_candidato",
    url: urlBens(ano),
    sha256: zBens.sha256,
    bytes: zBens.bytes,
    licenca: LICENCA_TSE,
  });
  const parlamentares = await db
    .selectFrom("parlamentar")
    .select(["id", "nome_civil", "data_nascimento", "sigla_uf"])
    .execute();
  const candidaturas = casarCandidaturas(
    await lerCsvNacional(zCand.buf, `consulta_cand_${ano}`),
    parlamentares,
    ano,
    cCand,
  );
  const bens = montarBens(await lerCsvNacional(zBens.buf, `bem_candidato_${ano}`), candidaturas, ano, cBens);
  await db.transaction().execute(async (trx) => {
    await trx.deleteFrom("bem_declarado").where("ano_eleicao", "=", ano).execute();
    await trx.deleteFrom("candidatura").where("ano_eleicao", "=", ano).execute();
    await inserirEmBlocos(trx, "candidatura", candidaturas);
    await inserirEmBlocos(trx, "bem_declarado", bens);
  });
  return { candidaturas: candidaturas.length, bens: bens.length };
}

const UFS = "AC AL AM AP BA CE DF ES GO MA MG MS MT PA PB PE PI PR RJ RN RO RR RS SC SE SP TO".split(" ");

/** Linhas das despesas contratadas: o arquivo nacional, ou os arquivos por UF quando ele não existe. */
async function* despesasContratadas(zip: Buffer, ano: number): AsyncGenerator<Linha> {
  const prefixo = `despesas_contratadas_candidatos_${ano}`;
  try {
    yield* linhasCsvDoZip(zip, `${prefixo}_BRASIL.csv`);
    return;
  } catch (e) {
    if (!(e instanceof Error) || !e.message.includes("entrada não encontrada")) throw e;
  }
  for (const uf of UFS) {
    try {
      yield* linhasCsvDoZip(zip, `${prefixo}_${uf}.csv`);
    } catch (e) {
      if (!(e instanceof Error) || !e.message.includes("entrada não encontrada")) throw e;
    }
  }
}

export type ResumoCampanha = {
  despesas: number;
  /** CICLO-02: fornecedor pessoa física, nunca gravado. */
  fornecedorPf: number;
  /** Candidato que não está em `candidatura` (não é parlamentar da base). */
  foraDaBase: number;
  /** Fornecedor PJ com CNPJ de dígito verificador inválido. */
  cnpjInvalido: number;
};

/**
 * CICLO-01, CICLO-02: despesas de campanha com fornecedor pessoa jurídica dos candidatos já casados
 * em `candidatura`, ligadas por SQ_CANDIDATO. Fonte: "despesas_contratadas_candidatos_{ano}_BRASIL.csv"
 * da prestação de contas (colunas conferidas no ZIP de 2022: SQ_CANDIDATO, DS_TIPO_FORNECEDOR,
 * NR_CPF_CNPJ_FORNECEDOR, SQ_DESPESA, DT_DESPESA, VR_DESPESA_CONTRATADA). Nome e CPF do candidato,
 * do vice e de fornecedor PF nunca são lidos para o banco; de fornecedor PJ só o CNPJ.
 */
export async function coletarDespesasCampanha(
  db: Kysely<Database>,
  cli: ClienteEducado,
  ano: number,
): Promise<ResumoCampanha> {
  const zip = await cli.baixar(urlContas(ano), ".cache/ingest");
  const coletaId = await registrarColeta(db, {
    fonte: "tse_prestacao_contas",
    url: urlContas(ano),
    sha256: zip.sha256,
    bytes: zip.bytes,
    licenca: LICENCA_TSE,
    observacao: `despesas contratadas de candidatos, eleição de ${ano}`,
  });
  const candidaturas = await db
    .selectFrom("candidatura")
    .select(["sq_candidato", "parlamentar_id"])
    .where("ano_eleicao", "=", ano)
    .execute();
  const porSq = new Map(candidaturas.map((c) => [c.sq_candidato, c.parlamentar_id]));
  const resumo: ResumoCampanha = { despesas: 0, fornecedorPf: 0, foraDaBase: 0, cnpjInvalido: 0 };
  const linhas: Insertable<CampanhaDespesaTable>[] = [];
  for await (const l of despesasContratadas(zip.buf, ano)) {
    const pid = porSq.get(l.SQ_CANDIDATO);
    if (pid === undefined) {
      resumo.foraDaBase++;
      continue;
    }
    const doc = soDigitos(l.NR_CPF_CNPJ_FORNECEDOR);
    if (!/JUR[IÍ]DICA/i.test(l.DS_TIPO_FORNECEDOR ?? "") || doc.length !== 14) {
      resumo.fornecedorPf++;
      continue;
    }
    if (!cnpjValido(doc)) {
      resumo.cnpjInvalido++;
      continue;
    }
    linhas.push({
      ano_eleicao: ano,
      sq_candidato: l.SQ_CANDIDATO,
      parlamentar_id: pid,
      fornecedor_cnpj: doc,
      valor: valorBr(l.VR_DESPESA_CONTRATADA),
      data_despesa: dataBrParaIso(l.DT_DESPESA),
      coleta_id: coletaId,
    });
  }
  await db.transaction().execute(async (trx) => {
    await trx.deleteFrom("campanha_despesa").where("ano_eleicao", "=", ano).execute();
    await inserirEmBlocos(trx, "campanha_despesa", linhas);
  });
  resumo.despesas = linhas.length;
  return resumo;
}
