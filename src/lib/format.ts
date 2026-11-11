const brlFmt = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});
const brlCentsFmt = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function brl(v: number | string, centavos = false): string {
  const n = typeof v === "string" ? Number(v) : v;
  return (centavos ? brlCentsFmt : brlFmt).format(n);
}

/** "R$ 2,31 mi" / "R$ 357 mil" para indicadores. */
export function brlCompacto(v: number): string {
  if (Math.abs(v) >= 1_000_000) {
    return `R$ ${(v / 1_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} mi`;
  }
  if (Math.abs(v) >= 10_000) {
    return `R$ ${Math.round(v / 1000).toLocaleString("pt-BR")} mil`;
  }
  return brl(v);
}

export function pct(parte: number, total: number): number | null {
  return total > 0 ? Math.round((parte / total) * 100) : null;
}

/** "2026-11-05" → "05/11/2026" sem passar por Date (sem fuso). */
export function dataBr(iso: string | null | undefined): string {
  if (!iso) return "";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

/** "10/11/2026 08:12" (sem a vírgula que o Intl põe entre data e hora). */
export function dataHoraBr(d: Date | string): string {
  const dt = typeof d === "string" ? new Date(d) : d;
  return dt
    .toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
    .replace(", ", " ");
}

export const INICIAIS_MESES = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

export const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

/** "1.234,56" (TSE) ou "1234.56" (Câmara) → número. */
export function numeroBr(v: string | null | undefined): number {
  if (!v) return 0;
  const s = v.trim();
  if (s === "") return 0;
  const norm = s.includes(",") ? s.replace(/\./g, "").replace(",", ".") : s;
  const n = Number(norm);
  return Number.isFinite(n) ? n : 0;
}
