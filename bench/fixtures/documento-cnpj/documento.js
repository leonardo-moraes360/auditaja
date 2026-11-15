/** Extraido de packages/core/src/privacy.ts (documentoPublicavel / formatarCnpj). */

export function soDigitos(v) {
  return String(v ?? "").replace(/\D/g, "");
}

/** BUG: fatia errado e nao padroniza 14 digitos. */
export function formatarCnpj(cnpj) {
  const d = soDigitos(cnpj);
  return d;
}

export function documentoPublicavel(raw) {
  const d = soDigitos(raw);
  if (d.length === 14) return { doc: formatarCnpj(d), classe: "pessoa_juridica" };
  if (d.length === 11) return { doc: null, classe: "terceiro_pf" };
  return { doc: null, classe: "desconhecido" };
}
