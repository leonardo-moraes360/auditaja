/** Extraido de packages/core/src/privacy.ts (R3). Versao propositalmente quebrada. */

export function soDigitos(v) {
  return String(v ?? "").replace(/\D/g, "");
}

/**
 * BUG: mascara parcial no estilo da Receita/Camara (***.456.789-**).
 * Viola R3: trechos de fontes diferentes remontam o CPF.
 */
export function mascararCpfsNoTexto(texto) {
  return String(texto).replace(
    /(?<!\d)\d{3}[-./\s]{0,3}(\d{3})[-./\s]{0,3}(\d{3})[-./\s]{0,3}\d{2}(?!\d)/g,
    "***.$1.$2-**",
  );
}

export function nomeFornecedorPublicavel(nome, classe) {
  if (classe === "terceiro_pf") return "Prestador pessoa fisica";
  return mascararCpfsNoTexto(String(nome).trim());
}
