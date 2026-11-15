import type { Insertable, Kysely } from "kysely";
import type { Database, DespesaExecutivoTable, ExecutivoTable } from "@auditaja/db/types";
import { DESLOCAMENTO_EXECUTIVO } from "@auditaja/core/poderes";
import { documentoPublicavel, nomeFornecedorPublicavel } from "@auditaja/core/privacy";
import { inserirEmBlocos, registrarColeta } from "./coleta";
import { type ClienteEducado } from "./http";
import { LICENCA_CGU } from "./transparencia";

/**
 * Poder Executivo federal. Fontes alinhadas às já usadas no projeto:
 * - composição (Presidente, Vice, Ministros): JSON público do Portal da Transparência / Planalto
 *   espelhado em dados abertos da CGU (sem chave);
 * - despesas (viagens a serviço e cartão): lotes do Portal da Transparência (CGU), mesmo host
 *   de arquivos já usado para emendas e sanções.
 *
 * R7: toda rede passa pelo ClienteEducado. R2/R3: CPF de terceiro não é gravado; nome de PF vira
 * "Prestador pessoa física".
 */
export const URL_COMPOSICAO_EXECUTIVO = "https://www.gov.br/planalto/pt-br/composicao/composicao-do-governo.json";
export const LICENCA_PLANALTO = "Portal gov.br / Presidência da República; dados públicos de composição";

/** Linha tipificada da composição publicada (campos usados). */
export type LinhaComposicaoExecutivo = {
  id?: number | string;
  cargo: "presidente" | "vice_presidente" | "ministro";
  orgao: string;
  nome: string;
  nome_civil?: string;
  sigla_partido?: string;
  sigla_uf?: string;
  url_foto?: string;
  sexo?: string;
  em_exercicio?: boolean;
  mandato_inicio?: string;
  mandato_fim?: string;
  source_url?: string;
};

export type LinhaDespesaExecutivo = {
  executivo_id: number;
  ano: number;
  mes: number;
  tipo: "viagem" | "cartao" | "diaria";
  descricao: string;
  fornecedor_nome: string;
  fornecedor_doc?: string | null;
  data_emissao?: string | null;
  valor_liquido: number | string;
  url_documento?: string | null;
};

/** Id estável a partir do id da fonte, ou hash simples do cargo+órgão+nome. */
export function idExecutivo(linha: LinhaComposicaoExecutivo): number {
  if (linha.id !== undefined && Number.isFinite(Number(linha.id))) {
    const n = Number(linha.id);
    return n >= DESLOCAMENTO_EXECUTIVO ? n : DESLOCAMENTO_EXECUTIVO + n;
  }
  const chave = `${linha.cargo}|${linha.orgao}|${linha.nome}`.toLowerCase();
  let h = 0;
  for (let i = 0; i < chave.length; i++) h = (h * 31 + chave.charCodeAt(i)) >>> 0;
  return DESLOCAMENTO_EXECUTIVO + (h % 9_000_000);
}

export function montarExecutivo(linhas: LinhaComposicaoExecutivo[], coletaId: number): Insertable<ExecutivoTable>[] {
  return linhas.map((l) => ({
    id: idExecutivo(l),
    cargo: l.cargo,
    orgao: l.orgao.trim(),
    nome: l.nome.trim(),
    nome_civil: l.nome_civil?.trim() || null,
    sigla_partido: l.sigla_partido?.trim() || null,
    sigla_uf: l.sigla_uf?.trim() || null,
    url_foto: l.url_foto?.trim() || null,
    data_nascimento: null,
    sexo: l.sexo === "F" || l.sexo === "M" ? l.sexo : null,
    em_exercicio: l.em_exercicio !== false,
    mandato_inicio: l.mandato_inicio ?? null,
    mandato_fim: l.mandato_fim ?? null,
    source_url: l.source_url?.trim() || URL_COMPOSICAO_EXECUTIVO,
    coleta_id: coletaId,
  }));
}

export function montarDespesasExecutivo(
  linhas: LinhaDespesaExecutivo[],
  coletaId: number,
): Insertable<DespesaExecutivoTable>[] {
  return linhas.map((l) => {
    const { doc, classe } = documentoPublicavel(l.fornecedor_doc);
    return {
      executivo_id: l.executivo_id,
      ano: l.ano,
      mes: l.mes,
      tipo: l.tipo,
      descricao: l.descricao.trim(),
      fornecedor_nome: nomeFornecedorPublicavel(l.fornecedor_nome, classe),
      fornecedor_doc: doc,
      fornecedor_classe: classe,
      data_emissao: l.data_emissao ?? null,
      valor_liquido: l.valor_liquido,
      url_documento: l.url_documento ?? null,
      coleta_id: coletaId,
    };
  });
}

export async function coletarExecutivo(db: Kysely<Database>, cli: ClienteEducado): Promise<{ titulares: number }> {
  const res = await cli.baixar(URL_COMPOSICAO_EXECUTIVO, ".cache/ingest");
  const texto = res.buf.toString("utf8");
  const json = JSON.parse(texto) as { titulares?: LinhaComposicaoExecutivo[] } | LinhaComposicaoExecutivo[];
  const linhas = Array.isArray(json) ? json : (json.titulares ?? []);
  const coletaId = await registrarColeta(db, {
    fonte: "planalto_composicao_executivo",
    url: URL_COMPOSICAO_EXECUTIVO,
    sha256: res.sha256,
    bytes: res.bytes,
    licenca: LICENCA_PLANALTO,
    observacao: `${linhas.length} titulares`,
  });
  const titulares = montarExecutivo(linhas, coletaId);
  if (titulares.length === 0) return { titulares: 0 };
  await db.deleteFrom("executivo").execute();
  await inserirEmBlocos(db, "executivo", titulares);
  return { titulares: titulares.length };
}

/** Reexport da licença CGU para despesas do Executivo (mesmo lote de arquivos). */
export { LICENCA_CGU };
