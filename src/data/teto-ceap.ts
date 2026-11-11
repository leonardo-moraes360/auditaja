import type { Teto } from "@/lib/metrics";

/**
 * Limite mensal da CEAP por UF.
 *
 * Fonte: Anexo Único do Ato da Mesa nº 43/2009, atualizado pelo Ato da Mesa
 * nº 244/2026 (IPCA de fev/2023 a dez/2025, vigência em 20/02/2026).
 * https://www2.camara.leg.br/legin/int/atomes/2026/atodamesa-244-20-fevereiro-2026-798720-publicacaooriginal-178157-cd-mesa.html
 *
 * PENDENTE: o anexo com os valores não está na página do ato. Só preencha uma UF
 * com valor conferido no Diário da Câmara de 20/02/2026 (p. 2216) e marque
 * `verificado: true`. Sem valor verificado, a interface não mostra teto.
 */
export const TETO_CEAP_FONTE =
  "https://www2.camara.leg.br/legin/int/atomes/2026/atodamesa-244-20-fevereiro-2026-798720-publicacaooriginal-178157-cd-mesa.html";

export const TETO_CEAP_MENSAL: Partial<Record<string, Teto>> = {};

export function tetoDaUf(uf: string | null | undefined): Teto | null {
  if (!uf) return null;
  const t = TETO_CEAP_MENSAL[uf];
  return t?.verificado ? t : null;
}
