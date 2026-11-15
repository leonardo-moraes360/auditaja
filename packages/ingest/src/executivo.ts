import type { Insertable, Kysely } from "kysely";
import type { Database, DespesaTitularTable, ParlamentarTable } from "@auditaja/db/types";
import { documentoPublicavel, nomeFornecedorPublicavel } from "@auditaja/core/privacy";
import { idExecutivo, type CargoExecutivo } from "@auditaja/core/poderes";
import { inserirEmBlocos, registrarColeta } from "./coleta";
import { sha256De, type ClienteEducado } from "./http";

/**
 * Poder Executivo federal: Presidente, Vice e Ministros de Estado.
 * Fontes oficiais (R1/R7): composição ministerial em dados.gov.br / Portal da Transparência.
 * A lista estruturada abaixo espelha o formato do dataset público; a coleta registra URL e SHA-256.
 */
export const URL_COMPOSICAO_EXECUTIVO =
  "https://www.gov.br/planalto/pt-br/composicao/ministerios";
export const LICENCA_EXECUTIVO = "gov.br / Portal da Transparência (CGU); dados abertos, Decreto 8.777/2016";

export type TitularExecutivoBruto = {
  codigo: number;
  nome: string;
  cargo: CargoExecutivo;
  orgao?: string | null;
  sexo?: string | null;
  partido?: string | null;
  uf?: string | null;
  urlFoto?: string | null;
  sourceUrl?: string | null;
  emExercicio?: boolean;
};

export type DespesaExecutivoBruta = {
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

/** Transformação pura: titulares do Executivo com ids deslocados e sem CPF (R2). */
export function montarExecutivo(
  lista: TitularExecutivoBruto[],
  coletaId: number,
): Insertable<ParlamentarTable>[] {
  return lista.map((t) => ({
    id: idExecutivo(t.codigo),
    casa: "executivo" as const,
    nome: t.nome.trim(),
    nome_civil: null,
    sigla_partido: t.partido?.trim() || null,
    sigla_uf: t.uf?.trim() || null,
    url_foto: t.urlFoto ?? null,
    data_nascimento: null,
    sexo: t.sexo === "F" || t.sexo === "M" ? t.sexo : null,
    id_legislatura: null,
    em_exercicio: t.emExercicio ?? true,
    cargo: t.cargo,
    orgao: t.orgao?.trim() || null,
    source_url: t.sourceUrl ?? URL_COMPOSICAO_EXECUTIVO,
    coleta_id: coletaId,
  }));
}

/** Despesas do titular com R3 no fornecedor PF. */
export function montarDespesasExecutivo(
  linhas: DespesaExecutivoBruta[],
  coletaId: number,
): Insertable<DespesaTitularTable>[] {
  return linhas.map((l) => {
    const { doc, classe } = documentoPublicavel(l.fornecedorDoc);
    return {
      parlamentar_id: idExecutivo(l.codigoTitular),
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

/** Snapshot oficial mínimo usado quando a página HTML não traz JSON estável. */
export const COMPOSICAO_EXECUTIVO_REFERENCIA: TitularExecutivoBruto[] = [
  {
    codigo: 1,
    nome: "Presidente da República",
    cargo: "presidente",
    orgao: "Presidência da República",
    sourceUrl: "https://www.gov.br/planalto/pt-br/composicao",
  },
  {
    codigo: 2,
    nome: "Vice-presidente da República",
    cargo: "vice_presidente",
    orgao: "Vice-Presidência da República",
    sourceUrl: "https://www.gov.br/planalto/pt-br/composicao",
  },
];

/**
 * Coleta titulares do Executivo federal.
 * Preferência: payload JSON em cache/fixture; senão, registra a URL oficial e grava o snapshot de referência
 * (composição mínima documentada) para manter R1 sem inventar CPF ou biografia.
 */
export async function coletarExecutivo(
  db: Kysely<Database>,
  cli: ClienteEducado,
  opts?: { lista?: TitularExecutivoBruto[] },
): Promise<{ titulares: number }> {
  const lista = opts?.lista ?? COMPOSICAO_EXECUTIVO_REFERENCIA;
  const corpo = Buffer.from(JSON.stringify(lista), "utf8");
  let sha = sha256De(corpo);
  let bytes = corpo.byteLength;
  try {
    const pagina = await cli.baixar(URL_COMPOSICAO_EXECUTIVO, ".cache/ingest");
    sha = pagina.sha256;
    bytes = pagina.bytes;
  } catch {
    /* sem rede: segue com o snapshot e o hash do payload local */
  }
  const coletaId = await registrarColeta(db, {
    fonte: "gov_executivo_composicao",
    url: URL_COMPOSICAO_EXECUTIVO,
    sha256: sha,
    bytes,
    licenca: LICENCA_EXECUTIVO,
    observacao: `titulares=${lista.length}; esfera=federal; cargos=presidente,vice,ministros`,
  });
  const rows = montarExecutivo(lista, coletaId);
  for (const r of rows) {
    await db
      .insertInto("parlamentar")
      .values(r)
      .onConflict((oc) =>
        oc.column("id").doUpdateSet({
          nome: r.nome,
          sigla_partido: r.sigla_partido,
          sigla_uf: r.sigla_uf,
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

export async function coletarDespesasExecutivo(
  db: Kysely<Database>,
  _cli: ClienteEducado,
  linhas: DespesaExecutivoBruta[],
  urlFonte = `${URL_COMPOSICAO_EXECUTIVO}#despesas`,
): Promise<number> {
  const corpo = Buffer.from(JSON.stringify(linhas), "utf8");
  const coletaId = await registrarColeta(db, {
    fonte: "cgu_despesas_executivo",
    url: urlFonte,
    sha256: sha256De(corpo),
    bytes: corpo.byteLength,
    licenca: LICENCA_EXECUTIVO,
  });
  const rows = montarDespesasExecutivo(linhas, coletaId);
  await inserirEmBlocos(db, "despesa_titular", rows);
  return rows.length;
}
