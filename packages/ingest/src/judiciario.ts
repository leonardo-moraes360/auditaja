import type { Insertable, Kysely } from "kysely";
import type { Database, DespesaTitularTable, ParlamentarTable } from "@auditaja/db/types";
import { documentoPublicavel, nomeFornecedorPublicavel } from "@auditaja/core/privacy";
import { idStf, idStj, type CasaJudiciario } from "@auditaja/core/poderes";
import { inserirEmBlocos, registrarColeta } from "./coleta";
import { sha256De, type ClienteEducado } from "./http";

/** Portais oficiais dos tribunais superiores (composição pública). */
export const URL_COMPOSICAO_STF = "https://portal.stf.jus.br/composicao/";
export const URL_COMPOSICAO_STJ = "https://www.stj.jus.br/sites/portalp/Institucional/Ministros";
export const LICENCA_JUDICIARIO = "STF/STJ — composição pública; Portal da Transparência (CGU) para despesas";

export type TitularJudiciarioBruto = {
  codigo: number;
  casa: CasaJudiciario;
  nome: string;
  sexo?: string | null;
  urlFoto?: string | null;
  sourceUrl?: string | null;
  emExercicio?: boolean;
};

export type DespesaJudiciarioBruta = {
  casa: CasaJudiciario;
  codigoTitular: number;
  ano: number;
  mes: number;
  tipoDespesa: string;
  fornecedorNome: string;
  fornecedorDoc?: string | null;
  dataEmissao?: string | null;
  valorLiquido: number | string;
  urlDocumento?: string | null;
};

function idDaCasa(casa: CasaJudiciario, codigo: number): number {
  return casa === "stf" ? idStf(codigo) : idStj(codigo);
}

function urlDaCasa(casa: CasaJudiciario): string {
  return casa === "stf" ? URL_COMPOSICAO_STF : URL_COMPOSICAO_STJ;
}

/** Transformação pura: ministros STF/STJ com ids deslocados (sem CPF, R2). */
export function montarJudiciario(lista: TitularJudiciarioBruto[], coletaId: number): Insertable<ParlamentarTable>[] {
  return lista.map((t) => ({
    id: idDaCasa(t.casa, t.codigo),
    casa: t.casa,
    nome: t.nome.trim(),
    nome_civil: null,
    sigla_partido: null,
    sigla_uf: null,
    url_foto: t.urlFoto ?? null,
    data_nascimento: null,
    sexo: t.sexo === "F" || t.sexo === "M" ? t.sexo : null,
    id_legislatura: null,
    em_exercicio: t.emExercicio ?? true,
    cargo: "ministro",
    orgao: t.casa.toUpperCase(),
    source_url: t.sourceUrl ?? urlDaCasa(t.casa),
    coleta_id: coletaId,
  }));
}

export function montarDespesasJudiciario(
  linhas: DespesaJudiciarioBruta[],
  coletaId: number,
): Insertable<DespesaTitularTable>[] {
  return linhas.map((l) => {
    const { doc, classe } = documentoPublicavel(l.fornecedorDoc);
    return {
      parlamentar_id: idDaCasa(l.casa, l.codigoTitular),
      ano: l.ano,
      mes: l.mes,
      tipo_despesa: l.tipoDespesa.trim(),
      fornecedor_nome: nomeFornecedorPublicavel(l.fornecedorNome, classe),
      fornecedor_doc: doc,
      fornecedor_classe: classe,
      data_emissao: l.dataEmissao ?? null,
      valor_liquido: l.valorLiquido,
      url_documento: l.urlDocumento ?? null,
      coleta_id: coletaId,
    };
  });
}

/** Referência mínima de composição (estrutura); nomes reais vêm da coleta oficial. */
export const COMPOSICAO_JUDICIARIO_REFERENCIA: TitularJudiciarioBruto[] = [
  { codigo: 1, casa: "stf", nome: "Ministro do STF (composição pública)", sourceUrl: URL_COMPOSICAO_STF },
  { codigo: 1, casa: "stj", nome: "Ministro do STJ (composição pública)", sourceUrl: URL_COMPOSICAO_STJ },
];

export async function coletarJudiciario(
  db: Kysely<Database>,
  cli: ClienteEducado,
  opts?: { lista?: TitularJudiciarioBruto[] },
): Promise<{ titulares: number }> {
  const lista = opts?.lista ?? COMPOSICAO_JUDICIARIO_REFERENCIA;
  const corpo = Buffer.from(JSON.stringify(lista), "utf8");
  let sha = sha256De(corpo);
  let bytes = corpo.byteLength;
  const url = URL_COMPOSICAO_STF;
  try {
    const pagina = await cli.baixar(url, ".cache/ingest");
    sha = pagina.sha256;
    bytes = pagina.bytes;
  } catch {
    /* offline: snapshot local */
  }
  const coletaId = await registrarColeta(db, {
    fonte: "judiciario_composicao",
    url,
    sha256: sha,
    bytes,
    licenca: LICENCA_JUDICIARIO,
    observacao: `titulares=${lista.length}; esfera=federal; tribunais=STF,STJ`,
  });
  const rows = montarJudiciario(lista, coletaId);
  for (const r of rows) {
    await db
      .insertInto("parlamentar")
      .values(r)
      .onConflict((oc) =>
        oc.column("id").doUpdateSet({
          nome: r.nome,
          url_foto: r.url_foto,
          sexo: r.sexo,
          em_exercicio: r.em_exercicio,
          cargo: r.cargo,
          orgao: r.orgao,
          source_url: r.source_url,
          coleta_id: r.coleta_id,
        }),
      )
      .execute();
  }
  return { titulares: rows.length };
}

export async function coletarDespesasJudiciario(
  db: Kysely<Database>,
  _cli: ClienteEducado,
  linhas: DespesaJudiciarioBruta[],
): Promise<number> {
  const corpo = Buffer.from(JSON.stringify(linhas), "utf8");
  const coletaId = await registrarColeta(db, {
    fonte: "cgu_despesas_judiciario",
    url: "https://portaldatransparencia.gov.br/",
    sha256: sha256De(corpo),
    bytes: corpo.byteLength,
    licenca: LICENCA_JUDICIARIO,
  });
  const rows = montarDespesasJudiciario(linhas, coletaId);
  await inserirEmBlocos(db, "despesa_titular", rows);
  return rows.length;
}
