/**
 * Padrão atípico nos gastos da cota (metodologia v1.9). Funções puras, para teste e auditoria:
 * /metodologia#atipico deve descrever exatamente o que está aqui.
 *
 * Dois avisos, que enxergam coisas diferentes:
 * - "acima dos colegas": média mensal do parlamentar num tipo de despesa contra a dos colegas da
 *   mesma Casa no mesmo ano (cerca externa de Tukey);
 * - "salto": crescimento do total de um tipo de despesa em relação ao ano anterior contra o
 *   crescimento dos colegas (cerca externa de Tukey sobre o logaritmo da razão).
 * Indicadores são pontos de partida para verificação, nunca acusação (R4).
 */

/** Mínimo de parlamentares no tipo de despesa para calcular um limite. */
export const MINIMO_COLEGAS = 20;
/** Multiplicador do intervalo interquartil: 3 = cerca externa de Tukey. */
export const FATOR_TUKEY = 3;
/** Piso em reais: excesso anual sobre o limite (colegas) ou aumento em relação ao ano anterior (salto). */
export const PISO_REAIS = 5000;
/** Meses com nota exigidos nos dois anos para comparar um ano com o anterior. */
export const MESES_MINIMOS_SALTO = 10;

/** Total de um parlamentar num tipo de despesa num ano, e os meses do ano em que ele teve qualquer nota. */
export type TotalTipo = { parlamentarId: number; tipo: string; total: number; meses: number; notas?: number };

export type Quartis = { q1: number; mediana: number; q3: number };

/** Percentil com interpolação linear entre vizinhos (igual a `percentile_cont` do Postgres). */
export function percentil(ordenados: number[], p: number): number {
  if (ordenados.length === 0) return NaN;
  const pos = (ordenados.length - 1) * p;
  const base = Math.floor(pos);
  const resto = pos - base;
  const prox = ordenados[base + 1];
  return prox === undefined ? ordenados[base] : ordenados[base] + resto * (prox - ordenados[base]);
}

export function quartis(valores: number[]): Quartis {
  const o = valores.toSorted((a, b) => a - b);
  return { q1: percentil(o, 0.25), mediana: percentil(o, 0.5), q3: percentil(o, 0.75) };
}

/** Q3 + 3 × (Q3 − Q1). */
export function cercaExterna({ q1, q3 }: Quartis): number {
  return q3 + FATOR_TUKEY * (q3 - q1);
}

function porTipo(linhas: TotalTipo[]) {
  const m = new Map<string, TotalTipo[]>();
  for (const l of linhas) {
    if (!(l.total > 0) || !(l.meses > 0)) continue;
    const lista = m.get(l.tipo);
    if (lista) lista.push(l);
    else m.set(l.tipo, [l]);
  }
  return m;
}

export type AlertaColegas = {
  tipo: string;
  total: number;
  /** Notas do parlamentar nesse tipo no ano (link de download). */
  notas: number;
  meses: number;
  mediaMensal: number;
  colegas: number;
  /** Quartis da média mensal dos colegas que usaram o tipo no ano (o próprio parlamentar incluído). */
  q1: number;
  mediana: number;
  q3: number;
  limiteMensal: number;
  /** Quanto o total do ano passa do limite (limite mensal × meses do parlamentar). */
  excessoAno: number;
};

/**
 * Aviso "acima dos colegas": para cada tipo de despesa usado por pelo menos 20 parlamentares da
 * mesma Casa no ano, a média mensal (total do tipo ÷ meses com qualquer nota no ano) acima da
 * cerca externa, com o total do ano passando do limite em mais de R$ 5 mil.
 * `linhas` traz todos os parlamentares da Casa no ano. Ordem: maior excesso primeiro.
 */
export function acimaDosColegas(linhas: TotalTipo[], parlamentarId: number): AlertaColegas[] {
  const alertas: AlertaColegas[] = [];
  for (const [tipo, lista] of porTipo(linhas)) {
    if (lista.length < MINIMO_COLEGAS) continue;
    const eu = lista.find((l) => l.parlamentarId === parlamentarId);
    if (!eu) continue;
    const q = quartis(lista.map((l) => l.total / l.meses));
    const limiteMensal = cercaExterna(q);
    const mediaMensal = eu.total / eu.meses;
    const excessoAno = eu.total - limiteMensal * eu.meses;
    if (mediaMensal > limiteMensal && excessoAno > PISO_REAIS) {
      alertas.push({ tipo, total: eu.total, notas: eu.notas ?? 0, meses: eu.meses, mediaMensal, colegas: lista.length, ...q, limiteMensal, excessoAno });
    }
  }
  return alertas.sort((a, b) => b.excessoAno - a.excessoAno);
}

export type AlertaSalto = {
  tipo: string;
  total: number;
  notas: number;
  totalAnterior: number;
  /** total ÷ totalAnterior */
  razao: number;
  colegas: number;
  /** Quartis da razão entre os colegas (na escala original, de volta do logaritmo). */
  q1Razao: number;
  medianaRazao: number;
  q3Razao: number;
  limiteRazao: number;
  aumento: number;
  /** Quanto o total do ano passa do limite de salto (limite × total do ano anterior). */
  excessoAno: number;
};

/**
 * Aviso "salto": entre os parlamentares que usaram o tipo nos dois anos e tiveram nota em pelo
 * menos 10 meses de cada ano, a razão total do ano ÷ total do ano anterior acima da cerca externa
 * calculada sobre o logaritmo das razões, com aumento acima de R$ 5 mil. Pelo menos 20 parlamentares.
 * Ordem: maior excesso sobre o limite primeiro.
 */
export function saltoAnual(atual: TotalTipo[], anterior: TotalTipo[], parlamentarId: number): AlertaSalto[] {
  const antes = new Map<string, TotalTipo>();
  for (const l of anterior) if (l.total > 0 && l.meses >= MESES_MINIMOS_SALTO) antes.set(`${l.parlamentarId}|${l.tipo}`, l);
  const pares = new Map<string, { id: number; total: number; totalAnterior: number; notas: number }[]>();
  for (const l of atual) {
    if (!(l.total > 0) || l.meses < MESES_MINIMOS_SALTO) continue;
    const a = antes.get(`${l.parlamentarId}|${l.tipo}`);
    if (!a) continue;
    const lista = pares.get(l.tipo) ?? [];
    lista.push({ id: l.parlamentarId, total: l.total, totalAnterior: a.total, notas: l.notas ?? 0 });
    pares.set(l.tipo, lista);
  }
  const alertas: AlertaSalto[] = [];
  for (const [tipo, lista] of pares) {
    if (lista.length < MINIMO_COLEGAS) continue;
    const eu = lista.find((l) => l.id === parlamentarId);
    if (!eu) continue;
    const q = quartis(lista.map((l) => Math.log(l.total / l.totalAnterior)));
    const limiteLog = cercaExterna(q);
    const razao = eu.total / eu.totalAnterior;
    const aumento = eu.total - eu.totalAnterior;
    if (Math.log(razao) > limiteLog && aumento > PISO_REAIS) {
      alertas.push({
        tipo,
        total: eu.total,
        notas: eu.notas,
        totalAnterior: eu.totalAnterior,
        razao,
        colegas: lista.length,
        q1Razao: Math.exp(q.q1),
        medianaRazao: Math.exp(q.mediana),
        q3Razao: Math.exp(q.q3),
        limiteRazao: Math.exp(limiteLog),
        aumento,
        excessoAno: eu.total - Math.exp(limiteLog) * eu.totalAnterior,
      });
    }
  }
  return alertas.sort((a, b) => b.excessoAno - a.excessoAno);
}
