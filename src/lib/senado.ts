/**
 * Regras do Senado Federal. Funções puras para teste e auditoria da metodologia:
 * a seção do Senado em /metodologia descreve exatamente este arquivo.
 */

/** Deslocamento que separa os ids de senadores dos ids de deputados (que vão até ~240 mil). */
export const DESLOCAMENTO_SENADO = 10_000_000;

/** Órgão das votações nominais do Plenário do Senado. */
export const ORGAO_PLENARIO_SENADO = "PLEN-SF";

export const idSenador = (codigo: number | string) => DESLOCAMENTO_SENADO + Number(codigo);
export const codigoSenado = (id: number) => id - DESLOCAMENTO_SENADO;
export const ehIdSenador = (id: number) => id > DESLOCAMENTO_SENADO;

/** A API do Senado devolve objeto único em vez de lista quando há um só item. */
export function comoLista<T>(v: T | T[] | null | undefined): T[] {
  if (v === null || v === undefined) return [];
  return Array.isArray(v) ? v : [v];
}

/** "Feminino" → "F", "Masculino" → "M"; qualquer outro valor → null. */
export function sexoDoSenado(s: string | null | undefined): "F" | "M" | null {
  const t = (s ?? "").trim().toLowerCase();
  if (t.startsWith("fem")) return "F";
  if (t.startsWith("masc")) return "M";
  return null;
}

function norm(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

/** Orientação de liderança: SIM → Sim, NÃO → Não, LIVRE → Liberado, OBSTRUÇÃO → Obstrução. */
export function normalizarOrientacao(v: string): string {
  const t = norm(v);
  if (t === "SIM") return "Sim";
  if (t === "NAO") return "Não";
  if (t === "LIVRE" || t === "LIBERADO") return "Liberado";
  if (t === "OBSTRUCAO") return "Obstrução";
  if (t === "ABSTENCAO") return "Abstenção";
  return v.trim();
}

/** Lideranças que não são de partido: não contam para o alinhamento (SALI-03). */
const LIDERANCAS_NAO_PARTIDARIAS = new Set(["GOVERNO", "MAIORIA", "MINORIA", "OPOSICAO", "BFEMININA"]);

/** Nome da liderança no Senado → sigla do partido. */
const NOME_PARA_SIGLA: Record<string, string> = {
  PROGRESSISTAS: "PP",
  PODEMOS: "PODE",
  REPUBLICANOS: "REPUBLICANOS",
  UNIAO: "UNIAO",
  UNIAOBRASIL: "UNIAO",
  CIDADANIA: "CIDADANIA",
  SOLIDARIEDADE: "SOLIDARIEDADE",
};

/** Sigla do partido de uma liderança ("Progressistas" → "PP"); null para Governo, Maioria, blocos… */
export function partidoDaLideranca(nome: string): string | null {
  const t = norm(nome);
  if (!t || LIDERANCAS_NAO_PARTIDARIAS.has(t) || t.startsWith("BLOCO") || t.startsWith("BL")) return null;
  return NOME_PARA_SIGLA[t] ?? t;
}

/** Orientação aplicável ao senador: só a da liderança do próprio partido (SALI-01). */
export function orientacaoDaLideranca(
  siglaPartido: string | null,
  orientacoes: { siglaBancada: string; orientacao: string }[],
): string | null {
  if (!siglaPartido) return null;
  const partido = norm(siglaPartido);
  const achou = orientacoes.find((o) => partidoDaLideranca(o.siglaBancada) === partido);
  return achou?.orientacao ?? null;
}

const PRESENTES = new Set(["Sim", "Não", "Abstenção", "Votou", "P-NRV", "Obstrução", "Presidente (art. 51 RISF)"]);

/** Licenças e afastamentos: saem do denominador da presença (SPRES-02). */
export const LICENCAS_SENADO = new Set(
  "AFO DJ EP EPR LL LS LP LPA LSP LAP LAF LA LG LGA LN LCS LEG LC L2 L3 L5".split(" "),
);

export type ClasseVotoSenado = "presente" | "licenca" | "ausente";

export function classificarVotoSenado(sigla: string): ClasseVotoSenado {
  if (PRESENTES.has(sigla)) return "presente";
  if (LICENCAS_SENADO.has(sigla)) return "licenca";
  return "ausente";
}

/** Presença: presentes ÷ (votações com registro − licenças e afastamentos), em % (SPRES-03). */
export function presencaSenado(votos: string[]) {
  let presentes = 0;
  let licencas = 0;
  for (const v of votos) {
    const c = classificarVotoSenado(v);
    if (c === "presente") presentes++;
    else if (c === "licenca") licencas++;
  }
  const denominador = votos.length - licencas;
  return {
    presentes,
    denominador,
    licencas,
    percentual: denominador > 0 ? Math.round((presentes / denominador) * 100) : null,
  };
}

const MOTIVOS_AUSENCIA: Record<string, string> = {
  AP: "atividade parlamentar",
  MIS: "missão oficial",
  MER: "Parlamento do Mercosul",
  AUS: "ausência comunicada",
};

/** Texto do voto do senador na lista de votações (SVOT-06, SVOT-07). */
export function rotuloVotoSenado(sigla: string | null, secreta: boolean): string {
  if (!sigla) return "Sem registro";
  if (sigla === "Votou") return secreta ? "Votou (voto secreto)" : "Votou";
  if (sigla === "NCom") return "Não compareceu";
  if (sigla === "P-NRV") return "Presente, não registrou voto";
  if (sigla === "Presidente (art. 51 RISF)") return "Presidiu a sessão";
  if (MOTIVOS_AUSENCIA[sigla]) return `Ausente: ${MOTIVOS_AUSENCIA[sigla]}`;
  if (LICENCAS_SENADO.has(sigla)) return "Em licença ou afastado";
  if (PRESENTES.has(sigla)) return `Votou: ${sigla}`;
  return `Ausente (${sigla})`;
}
