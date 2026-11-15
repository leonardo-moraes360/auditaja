/**
 * Escopo e rótulos dos três poderes. Esfera federal no MVP, no mesmo espírito do Legislativo.
 */

export type Poder = "legislativo" | "executivo" | "judiciario";

export const ESFERA_MVP = "federal" as const;

export const ESCOPO_EXECUTIVO = {
  esfera: ESFERA_MVP,
  cargos: ["presidente", "vice_presidente", "ministro"] as const,
  descricao:
    "Presidente e Vice-Presidente da República e Ministros de Estado em exercício. Governadores, prefeitos e secretários ficam fora deste recorte.",
} as const;

export const ESCOPO_JUDICIARIO = {
  esfera: ESFERA_MVP,
  cargos: ["ministro_stf"] as const,
  tribunais: ["STF"] as const,
  descricao:
    "Ministros do Supremo Tribunal Federal em exercício. Demais tribunais superiores, justiça estadual e juízes de primeiro grau ficam fora deste recorte.",
} as const;

export const ESCOPO_LEGISLATIVO = {
  esfera: ESFERA_MVP,
  cargos: ["deputado_federal", "senador"] as const,
  descricao: "Deputados federais e senadores (já cobertos pelo Auditaja).",
} as const;

/** Deslocamento de id sintético do Executivo (evita colidir com Câmara e Senado). */
export const DESLOCAMENTO_EXECUTIVO = 20_000_000;
/** Deslocamento de id sintético do Judiciário. */
export const DESLOCAMENTO_JUDICIARIO = 30_000_000;

export function cargoExecutivo(cargo: string, sexo: string | null): string {
  if (cargo === "presidente") return sexo === "F" ? "Presidenta da República" : "Presidente da República";
  if (cargo === "vice_presidente") {
    return sexo === "F" ? "Vice-Presidenta da República" : "Vice-Presidente da República";
  }
  if (cargo === "ministro") return sexo === "F" ? "Ministra de Estado" : "Ministro de Estado";
  return "Agente do Executivo";
}

export function cargoJudiciario(cargo: string, sexo: string | null): string {
  if (cargo === "ministro_stf") return sexo === "F" ? "Ministra do STF" : "Ministro do STF";
  return "Agente do Judiciário";
}

export function nomeDoPoder(poder: Poder): string {
  if (poder === "legislativo") return "Poder Legislativo";
  if (poder === "executivo") return "Poder Executivo";
  return "Poder Judiciário";
}
