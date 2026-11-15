/** Extraido de packages/core/src/format.ts (fraseCase). Versao quebrada. */

/** BUG: nao normaliza "HOSPEDAGEM ,EXCETO" (virgula colada da Camara). */
export function fraseCase(s) {
  const l = String(s)
    .toLowerCase()
    .replace(/\.$/, "");
  return l.charAt(0).toUpperCase() + l.slice(1);
}
