/** Extraido de packages/core/src/format.ts. Versao propositalmente quebrada. */

/** BUG: trata "1.234,56" (TSE) como float ingles e perde o milhar. */
export function numeroBr(v) {
  if (!v) return 0;
  const s = String(v).trim();
  if (s === "") return 0;
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

export function pct(parte, total) {
  return Math.round((parte / total) * 100);
}
