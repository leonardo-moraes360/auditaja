/**
 * Três poderes (esfera federal). Funções puras: ids, rótulos e classificação de cargo.
 * KPIs específicos ficam em metrics-poderes.ts; aqui só o modelo de pessoa.
 */

export type CasaLegislativo = "camara" | "senado";
export type CasaExecutivo = "executivo";
export type CasaJudiciario = "stf" | "stj";
export type CasaTitular = CasaLegislativo | CasaExecutivo | CasaJudiciario;

export type Poder = "legislativo" | "executivo" | "judiciario";

/** Deslocamentos que separam ids das Casas (deputados ≤ ~240 mil; senado = 10e6 + código). */
export const DESLOCAMENTO_EXECUTIVO = 20_000_000;
export const DESLOCAMENTO_STF = 30_000_000;
export const DESLOCAMENTO_STJ = 31_000_000;

export const CASAS_LEGISLATIVO: readonly CasaLegislativo[] = ["camara", "senado"];
export const CASAS_JUDICIARIO: readonly CasaJudiciario[] = ["stf", "stj"];
export const CASAS_TITULAR: readonly CasaTitular[] = ["camara", "senado", "executivo", "stf", "stj"];

export function ehCasaLegislativo(casa: string): casa is CasaLegislativo {
  return casa === "camara" || casa === "senado";
}

export function ehCasaJudiciario(casa: string): casa is CasaJudiciario {
  return casa === "stf" || casa === "stj";
}

export function ehCasaTitular(casa: string): casa is CasaTitular {
  return (CASAS_TITULAR as readonly string[]).includes(casa);
}

export function poderDaCasa(casa: string): Poder | null {
  if (ehCasaLegislativo(casa)) return "legislativo";
  if (casa === "executivo") return "executivo";
  if (ehCasaJudiciario(casa)) return "judiciario";
  return null;
}

export function idExecutivo(codigo: number | string): number {
  return DESLOCAMENTO_EXECUTIVO + Number(codigo);
}

export function idStf(codigo: number | string): number {
  return DESLOCAMENTO_STF + Number(codigo);
}

export function idStj(codigo: number | string): number {
  return DESLOCAMENTO_STJ + Number(codigo);
}

export type CargoExecutivo = "presidente" | "vice_presidente" | "ministro";

export function cargoExecutivo(tipo: CargoExecutivo, sexo: string | null, pasta?: string | null): string {
  if (tipo === "presidente") {
    if (sexo === "F") return "Presidenta da República";
    if (sexo === "M") return "Presidente da República";
    return "Presidente(a) da República";
  }
  if (tipo === "vice_presidente") {
    if (sexo === "F") return "Vice-presidenta da República";
    if (sexo === "M") return "Vice-presidente da República";
    return "Vice-presidente(a) da República";
  }
  const base = sexo === "F" ? "Ministra" : sexo === "M" ? "Ministro" : "Ministro(a)";
  const p = (pasta ?? "").trim();
  return p ? `${base} de ${p}` : `${base} de Estado`;
}

export function cargoJudiciario(casa: CasaJudiciario, sexo: string | null): string {
  if (casa === "stf") {
    if (sexo === "F") return "Ministra do STF";
    if (sexo === "M") return "Ministro do STF";
    return "Ministro(a) do STF";
  }
  if (sexo === "F") return "Ministra do STJ";
  if (sexo === "M") return "Ministro do STJ";
  return "Ministro(a) do STJ";
}

/** Rótulo de cargo para qualquer Casa; Legislativo mantém o comportamento anterior. */
export function cargoTitular(
  casa: string,
  sexo: string | null,
  opts?: { cargo?: string | null; orgao?: string | null },
): string {
  if (casa === "camara") {
    if (sexo === "F") return "Deputada federal";
    if (sexo === "M") return "Deputado federal";
    return "Deputado(a) federal";
  }
  if (casa === "senado") {
    if (sexo === "F") return "Senadora";
    if (sexo === "M") return "Senador";
    return "Senador(a)";
  }
  if (casa === "executivo") {
    const c = (opts?.cargo ?? "").toLowerCase();
    if (c === "presidente") return cargoExecutivo("presidente", sexo);
    if (c === "vice_presidente" || c === "vice-presidente") return cargoExecutivo("vice_presidente", sexo);
    return cargoExecutivo("ministro", sexo, opts?.orgao);
  }
  if (casa === "stf" || casa === "stj") return cargoJudiciario(casa, sexo);
  return "Titular";
}

export function nomeDoPoder(poder: Poder): string {
  if (poder === "legislativo") return "Poder Legislativo";
  if (poder === "executivo") return "Poder Executivo";
  return "Poder Judiciário";
}

export function nomeDaCasa(casa: CasaTitular): string {
  if (casa === "camara") return "Câmara dos Deputados";
  if (casa === "senado") return "Senado Federal";
  if (casa === "executivo") return "Poder Executivo Federal";
  if (casa === "stf") return "Supremo Tribunal Federal";
  return "Superior Tribunal de Justiça";
}

/**
 * Escopo documentado da rodada: esfera federal; cargos cobertos.
 * Usado em docs e na landing; a coleta só inclui estes.
 */
export const ESCOPO_TRES_PODERES = {
  esfera: "federal" as const,
  legislativo: ["Deputado(a) federal", "Senador(a)"] as const,
  executivo: ["Presidente da República", "Vice-presidente da República", "Ministros de Estado"] as const,
  judiciario: ["Ministros do STF", "Ministros do STJ"] as const,
  fontes: {
    legislativo: ["Câmara dos Deputados", "Senado Federal", "TSE", "Portal da Transparência (CGU)"],
    executivo: ["Portal da Transparência (CGU)", "gov.br / composição ministerial"],
    judiciario: ["Portal do STF", "Portal do STJ", "Portal da Transparência (CGU)"],
  },
} as const;
