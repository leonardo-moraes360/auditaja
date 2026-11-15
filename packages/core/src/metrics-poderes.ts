/**
 * KPIs dos três poderes (esfera federal). Funções puras, no mesmo espírito de metrics.ts.
 * Indicadores são pontos de partida para verificação (R4), não acusações.
 */

import type { Poder } from "./poderes";
import { alinhamento, variacaoNominal, type VotoComOrientacoes, type BlocoParlamentar } from "./metrics";

export const METODOLOGIA_PODERES_VERSAO = "1.0";

export type LinhaGasto = {
  mes: number;
  valor: number;
  tipo?: string;
  fornecedor?: string;
};

/** Total do ano, meses com gasto e média mensal (só meses com nota), como na CEAP do Legislativo. */
export function resumoGastos(linhas: LinhaGasto[]) {
  const porMes = new Map<number, number>();
  let total = 0;
  for (const l of linhas) {
    total += l.valor;
    porMes.set(l.mes, (porMes.get(l.mes) ?? 0) + l.valor);
  }
  const mesesComGasto = porMes.size;
  return {
    total,
    mesesComGasto,
    mediaMensal: mesesComGasto > 0 ? total / mesesComGasto : null,
  };
}

/** Participação de cada tipo de despesa no total (0–100). */
export function participacaoPorTipo(linhas: LinhaGasto[]): { tipo: string; valor: number; pct: number }[] {
  const porTipo = new Map<string, number>();
  let total = 0;
  for (const l of linhas) {
    const tipo = (l.tipo ?? "Não classificado").trim() || "Não classificado";
    porTipo.set(tipo, (porTipo.get(tipo) ?? 0) + l.valor);
    total += l.valor;
  }
  if (total <= 0) return [];
  return [...porTipo.entries()]
    .map(([tipo, valor]) => ({ tipo, valor, pct: Math.round((valor / total) * 100) }))
    .sort((a, b) => b.valor - a.valor);
}

/**
 * Concentração no maior fornecedor (0–100). Ponto de partida: valores altos merecem checagem
 * na fonte, sem implicar irregularidade (R4).
 */
export function concentracaoFornecedor(linhas: LinhaGasto[]): number | null {
  const por = new Map<string, number>();
  let total = 0;
  for (const l of linhas) {
    const k = (l.fornecedor ?? "").trim();
    if (!k) continue;
    por.set(k, (por.get(k) ?? 0) + l.valor);
    total += l.valor;
  }
  if (total <= 0 || por.size === 0) return null;
  const maior = Math.max(...por.values());
  return Math.round((maior / total) * 100);
}

export type KpiLegislativo = {
  poder: "legislativo";
  gastos: ReturnType<typeof resumoGastos>;
  tipos: ReturnType<typeof participacaoPorTipo>;
  concentracaoFornecedorPct: number | null;
  presencaPct: number | null;
  alinhamento: { comparaveis: number; iguais: number; divergencias: number; pct: number | null };
  variacaoBensPct: number | null;
};

export type KpiExecutivo = {
  poder: "executivo";
  gastos: ReturnType<typeof resumoGastos>;
  tipos: ReturnType<typeof participacaoPorTipo>;
  concentracaoFornecedorPct: number | null;
  variacaoBensPct: number | null;
};

export type KpiJudiciario = {
  poder: "judiciario";
  gastos: ReturnType<typeof resumoGastos>;
  tipos: ReturnType<typeof participacaoPorTipo>;
  concentracaoFornecedorPct: number | null;
};

export type KpiPoder = KpiLegislativo | KpiExecutivo | KpiJudiciario;

export function kpiLegislativo(opts: {
  gastos: LinhaGasto[];
  presencaPct: number | null;
  votos?: VotoComOrientacoes[];
  blocos?: BlocoParlamentar[];
  bensAnterior?: number;
  bensAtual?: number;
}): KpiLegislativo {
  const a = alinhamento(opts.votos ?? [], opts.blocos ?? []);
  return {
    poder: "legislativo",
    gastos: resumoGastos(opts.gastos),
    tipos: participacaoPorTipo(opts.gastos),
    concentracaoFornecedorPct: concentracaoFornecedor(opts.gastos),
    presencaPct: opts.presencaPct,
    alinhamento: {
      ...a,
      pct: a.comparaveis > 0 ? Math.round((a.iguais / a.comparaveis) * 100) : null,
    },
    variacaoBensPct:
      opts.bensAnterior !== undefined && opts.bensAtual !== undefined
        ? variacaoNominal(opts.bensAnterior, opts.bensAtual)
        : null,
  };
}

export function kpiExecutivo(opts: {
  gastos: LinhaGasto[];
  bensAnterior?: number;
  bensAtual?: number;
}): KpiExecutivo {
  return {
    poder: "executivo",
    gastos: resumoGastos(opts.gastos),
    tipos: participacaoPorTipo(opts.gastos),
    concentracaoFornecedorPct: concentracaoFornecedor(opts.gastos),
    variacaoBensPct:
      opts.bensAnterior !== undefined && opts.bensAtual !== undefined
        ? variacaoNominal(opts.bensAnterior, opts.bensAtual)
        : null,
  };
}

export function kpiJudiciario(opts: { gastos: LinhaGasto[] }): KpiJudiciario {
  return {
    poder: "judiciario",
    gastos: resumoGastos(opts.gastos),
    tipos: participacaoPorTipo(opts.gastos),
    concentracaoFornecedorPct: concentracaoFornecedor(opts.gastos),
  };
}

/** Agregado por poder para a landing: totais e média por titular. */
export function painelTresPoderes(
  porPoder: { poder: Poder; titulares: number; totalGastos: number }[],
): { poder: Poder; titulares: number; totalGastos: number; mediaPorTitular: number | null }[] {
  return porPoder.map((p) => ({
    ...p,
    mediaPorTitular: p.titulares > 0 ? p.totalGastos / p.titulares : null,
  }));
}

/** Rótulos curtos dos KPIs (UI/landing), sem juízo de valor (R4). */
export const ROTULOS_KPI: Record<string, string> = {
  gastos: "Gastos no período",
  mediaMensal: "Média mensal",
  concentracao: "Maior fornecedor no total",
  presenca: "Presença em votações",
  alinhamento: "Alinhamento com a orientação",
  variacaoBens: "Variação nominal de bens",
  tipos: "Composição por tipo de despesa",
};
