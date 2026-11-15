import type { Insertable, Kysely } from "kysely";
import type { Database, JudiciarioTable, SessaoJudiciarioTable, VotoJudiciarioTable } from "@auditaja/db/types";
import { DESLOCAMENTO_JUDICIARIO } from "@auditaja/core/poderes";
import { documentoPublicavel, nomeFornecedorPublicavel } from "@auditaja/core/privacy";
import { inserirEmBlocos, registrarColeta } from "./coleta";
import { type ClienteEducado } from "./http";

/**
 * Poder Judiciário federal (MVP: STF). Fontes públicas oficiais:
 * - composição atual da Corte: portal de dados / transparência do STF;
 * - sessões e votos do Plenário quando publicados em lote ou API aberta.
 *
 * R7: ClienteEducado. R2/R3: mesmas regras de documento e nome de terceiro do Legislativo.
 */
export const URL_COMPOSICAO_STF = "https://portal.stf.jus.br/texto/verTexto.asp?idConteudo=551723&tip=JSON";
export const LICENCA_STF = "Supremo Tribunal Federal; dados públicos de composição e transparência";

export type LinhaComposicaoStf = {
  id?: number | string;
  nome: string;
  nome_civil?: string;
  url_foto?: string;
  sexo?: string;
  em_exercicio?: boolean;
  posse?: string;
  source_url?: string;
};

export type LinhaSessaoStf = {
  id: string;
  data: string;
  tipo: string;
  descricao: string;
  source_url?: string;
};

export type LinhaVotoStf = {
  sessao_id: string;
  judiciario_id: number;
  voto: string;
  presente?: boolean;
};

export function idJudiciario(linha: LinhaComposicaoStf): number {
  if (linha.id !== undefined && Number.isFinite(Number(linha.id))) {
    const n = Number(linha.id);
    return n >= DESLOCAMENTO_JUDICIARIO ? n : DESLOCAMENTO_JUDICIARIO + n;
  }
  const chave = linha.nome.toLowerCase();
  let h = 0;
  for (let i = 0; i < chave.length; i++) h = (h * 31 + chave.charCodeAt(i)) >>> 0;
  return DESLOCAMENTO_JUDICIARIO + (h % 9_000_000);
}

export function montarJudiciario(linhas: LinhaComposicaoStf[], coletaId: number): Insertable<JudiciarioTable>[] {
  return linhas.map((l) => ({
    id: idJudiciario(l),
    cargo: "ministro_stf" as const,
    tribunal: "STF" as const,
    nome: l.nome.trim(),
    nome_civil: l.nome_civil?.trim() || null,
    url_foto: l.url_foto?.trim() || null,
    data_nascimento: null,
    sexo: l.sexo === "F" || l.sexo === "M" ? l.sexo : null,
    em_exercicio: l.em_exercicio !== false,
    posse: l.posse ?? null,
    source_url: l.source_url?.trim() || URL_COMPOSICAO_STF,
    coleta_id: coletaId,
  }));
}

export function montarSessoes(linhas: LinhaSessaoStf[], coletaId: number): Insertable<SessaoJudiciarioTable>[] {
  return linhas.map((l) => ({
    id: l.id,
    data: l.data,
    tribunal: "STF" as const,
    tipo: l.tipo.trim(),
    descricao: l.descricao.trim(),
    source_url: l.source_url?.trim() || URL_COMPOSICAO_STF,
    coleta_id: coletaId,
  }));
}

export function montarVotos(linhas: LinhaVotoStf[], coletaId: number): Insertable<VotoJudiciarioTable>[] {
  return linhas.map((l) => ({
    sessao_id: l.sessao_id,
    judiciario_id: l.judiciario_id,
    voto: l.voto.trim(),
    presente: l.presente !== false,
    coleta_id: coletaId,
  }));
}

export function despesaJudiciarioPublicavel(raw: {
  judiciario_id: number;
  ano: number;
  mes: number;
  tipo: "diaria" | "auxilio" | "passagem";
  descricao: string;
  fornecedor_nome: string;
  fornecedor_doc?: string | null;
  data_emissao?: string | null;
  valor_liquido: number | string;
  url_documento?: string | null;
  coleta_id: number;
}) {
  const { doc, classe } = documentoPublicavel(raw.fornecedor_doc);
  return {
    judiciario_id: raw.judiciario_id,
    ano: raw.ano,
    mes: raw.mes,
    tipo: raw.tipo,
    descricao: raw.descricao.trim(),
    fornecedor_nome: nomeFornecedorPublicavel(raw.fornecedor_nome, classe),
    fornecedor_doc: doc,
    fornecedor_classe: classe,
    data_emissao: raw.data_emissao ?? null,
    valor_liquido: raw.valor_liquido,
    url_documento: raw.url_documento ?? null,
    coleta_id: raw.coleta_id,
  };
}

export async function coletarJudiciario(db: Kysely<Database>, cli: ClienteEducado): Promise<{ titulares: number }> {
  const res = await cli.baixar(URL_COMPOSICAO_STF, ".cache/ingest");
  const texto = res.buf.toString("utf8");
  const json = JSON.parse(texto) as { ministros?: LinhaComposicaoStf[] } | LinhaComposicaoStf[];
  const linhas = Array.isArray(json) ? json : (json.ministros ?? []);
  const coletaId = await registrarColeta(db, {
    fonte: "stf_composicao",
    url: URL_COMPOSICAO_STF,
    sha256: res.sha256,
    bytes: res.bytes,
    licenca: LICENCA_STF,
    observacao: `${linhas.length} ministros`,
  });
  const titulares = montarJudiciario(linhas, coletaId);
  if (titulares.length === 0) return { titulares: 0 };
  await db.deleteFrom("judiciario").execute();
  await inserirEmBlocos(db, "judiciario", titulares);
  return { titulares: titulares.length };
}
