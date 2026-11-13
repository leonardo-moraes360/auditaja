import type { Teto } from "@auditaja/core/metrics";

/**
 * Limite mensal da CEAP por UF.
 *
 * Valores: página oficial da Câmara "Cota Parlamentar" (Guia para jornalistas), conferida em
 * 11/11/2026 (SHA-256 do HTML: 6d2bf16e76922e0d20c55c1c0439729f23b3bfe276f663c023f8915cd006a41a).
 * São os valores do Anexo Único do Ato da Mesa nº 43/2009 atualizados pelo Ato da Mesa
 * nº 244/2026 (IPCA de fev/2023 a dez/2025, vigência em 20/02/2026): os extremos
 * (DF R$ 41.612,55 e RR R$ 58.474,70) coincidem com os valores de 2026 noticiados após o ato.
 *
 * Só valem para `TETO_CEAP_ANO`. Outros anos ficam sem teto até alguém conferir os valores
 * vigentes e acrescentá-los aqui.
 */
export const TETO_CEAP_FONTE =
  "https://www2.camara.leg.br/comunicacao/assessoria-de-imprensa/guia-para-jornalistas/cota-parlamentar";

export const TETO_CEAP_ATO =
  "https://www2.camara.leg.br/legin/int/atomes/2026/atodamesa-244-20-fevereiro-2026-798720-publicacaooriginal-178157-cd-mesa.html";

export const TETO_CEAP_CONFERIDO_EM = "11/11/2026";

export const TETO_CEAP_ANO = 2026;

const VALORES: Record<string, number> = {
  AC: 57359.87,
  AL: 53164.36,
  AM: 56151.46,
  AP: 55929.26,
  BA: 50965.29,
  CE: 54879.34,
  DF: 41612.55,
  ES: 49160.15,
  GO: 46979.73,
  MA: 54537.99,
  MG: 47645.91,
  MS: 52707.93,
  MT: 51439.83,
  PA: 54624.17,
  PB: 54402.48,
  PE: 53997.81,
  PI: 53195.84,
  PR: 50807.19,
  RJ: 47267.41,
  RN: 55198.09,
  RO: 56267.9,
  RR: 58474.7,
  RS: 53086.78,
  SC: 51951.42,
  SE: 52248.86,
  SP: 48727.46,
  TO: 51525.8,
};

export const TETO_CEAP_MENSAL: Partial<Record<string, Teto>> = Object.fromEntries(
  Object.entries(VALORES).map(([uf, mensal]) => [uf, { mensal, verificado: true }]),
);

export function tetoDaUf(uf: string | null | undefined, ano: number): Teto | null {
  if (!uf || ano !== TETO_CEAP_ANO) return null;
  const t = TETO_CEAP_MENSAL[uf];
  return t?.verificado ? t : null;
}
