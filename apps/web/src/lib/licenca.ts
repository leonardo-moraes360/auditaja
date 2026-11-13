/**
 * Licenças do Auditaja. Código: GNU AGPL-3.0 ou posterior (LICENSE). Dados e textos que o Auditaja
 * produz (CSVs, perfis, trilha, metodologia): CC BY 4.0 (LICENSE-DATA). Os dados de origem seguem a
 * licença de cada órgão, listada em /fontes. Nome e logo ficam fora das duas licenças.
 */
export const LICENCA_CODIGO = {
  spdx: "AGPL-3.0-or-later",
  nome: "GNU AGPL-3.0",
  curto: "AGPL-3.0",
  url: "https://www.gnu.org/licenses/agpl-3.0.html",
} as const;

export const LICENCA_DADOS = {
  spdx: "CC-BY-4.0",
  nome: "CC BY 4.0",
  /** URL canônica, a que buscadores reconhecem no campo `license` do schema.org. */
  url: "https://creativecommons.org/licenses/by/4.0/",
  resumo: "https://creativecommons.org/licenses/by/4.0/deed.pt-br",
} as const;

/** Código-fonte público (exigência da AGPL para quem usa o site pela rede). */
export const REPOSITORIO_URL = "https://github.com/leonardo-moraes360/auditaja";

/** Âncora da seção de licença na página Sobre. */
export const CAMINHO_LICENCA = "/sobre#licenca";
