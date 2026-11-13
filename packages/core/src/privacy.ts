import type { ClasseTitular } from "@auditaja/db/types";

export function soDigitos(v: string | null | undefined): string {
  return (v ?? "").replace(/\D/g, "");
}

export function formatarCnpj(cnpj: string): string {
  const d = soDigitos(cnpj).padStart(14, "0").slice(-14);
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

/**
 * Classifica o documento de um fornecedor e devolve a forma publicável.
 * 11 dígitos = CPF (terceiro PF): não guardamos nenhum dígito. Cada fonte mascara um trecho diferente
 * (Câmara e Portal da Transparência mostram os 6 do meio; o Senado, os 3 primeiros e os 2 últimos) e
 * duas máscaras do mesmo CPF juntas remontam o número (R3). 14 = CNPJ (público).
 * Qualquer outra coisa não é exibida.
 */
export function documentoPublicavel(raw: string | null | undefined): {
  doc: string | null;
  classe: ClasseTitular;
} {
  const d = soDigitos(raw);
  if (d.length === 14) return { doc: formatarCnpj(d), classe: "pessoa_juridica" };
  if (d.length === 11) return { doc: null, classe: "terceiro_pf" };
  return { doc: null, classe: "desconhecido" };
}

/**
 * R3: nome de fornecedor pessoa física também é dado de terceiro.
 * Exibimos um rótulo genérico, sem documento.
 */
export function nomeFornecedorPublicavel(nome: string, classe: ClasseTitular): string {
  return classe === "terceiro_pf" ? "Prestador pessoa física" : mascararCpfsNoTexto(nome.trim());
}

/** CPF solto no texto: 11 dígitos, com até três separadores (ponto, hífen, barra ou espaço) entre os grupos, sem outros dígitos colados. Na dúvida, mascara. */
const CPF_NO_TEXTO = /(?<!\d)\d{3}[-./\s]{0,3}\d{3}[-./\s]{0,3}\d{3}[-./\s]{0,3}\d{2}(?!\d)/g;
/** CPF já mascarado pela fonte, com dígitos à mostra: Receita/Câmara ("***.456.789-**") ou Senado ("123.***.***-01"). */
const CPF_MASCARADO_NO_TEXTO =
  /(?<![\d*])(?:\*{3}[-./\s]{0,3}\d{3}[-./\s]{0,3}\d{3}[-./\s]{0,3}\*{2}|\d{3}[-./\s]{0,3}\*{3}[-./\s]{0,3}\*{3}[-./\s]{0,3}\d{2})(?![\d*])/g;

/**
 * R3: a razão social de MEI costuma trazer o CPF do dono ("FULANO DE TAL 12345678901").
 * Todo CPF solto no nome vira "***.***.***-**", sem nenhum dígito: qualquer máscara parcial poderia ser
 * combinada com outra (a da Receita mostra os 6 do meio; a do Senado, os 3 primeiros e os 2 últimos)
 * e remontar o número. Máscara parcial que já venha da fonte também perde os dígitos. CNPJ (14 dígitos) não é afetado.
 */
export function mascararCpfsNoTexto(texto: string): string {
  return texto.replace(CPF_NO_TEXTO, "***.***.***-**").replace(CPF_MASCARADO_NO_TEXTO, "***.***.***-**");
}
