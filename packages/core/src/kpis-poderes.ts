/**
 * KPIs dos três poderes. Funções puras, no mesmo espírito de `metrics.ts` (Legislativo):
 * pontos de partida para verificação (R4), testáveis e auditáveis.
 *
 * - Legislativo: presença e alinhamento já vivem em `metrics` + `exercicio`; aqui só
 *   reutilizamos a variação patrimonial e o uso de verba.
 * - Executivo: uso de verba publicada (viagens/cartão/diárias), concentração em fornecedor,
 *   média mensal e variação de bens.
 * - Judiciário: presença em sessões, concordância com a maioria do colegiado (análogo ao
 *   alinhamento partidário) e média mensal de despesas publicadas.
 */

import { variacaoNominal } from "./metrics";

export { variacaoNominal };

/** Fração do teto/orçamento de referência já gasta (0–1). Sem teto, null. */
export function taxaUsoVerba(gasto: number, teto: number | null): number | null {
  if (teto === null || teto <= 0) return null;
  return gasto / teto;
}

/** Média mensal a partir do total e dos meses com lançamento. */
export function mediaMensalGastos(total: number, mesesComLancamento: number): number | null {
  if (mesesComLancamento <= 0) return null;
  return total / mesesComLancamento;
}

/**
 * Participação do maior fornecedor no total (0–1). Espelha a leitura de concentração
 * que o perfil legislativo já faz sobre a cota, sem acusar irregularidade.
 */
export function concentracaoFornecedor(valoresPorFornecedor: number[]): {
  maior: number;
  total: number;
  fracao: number | null;
} {
  const total = valoresPorFornecedor.reduce((a, b) => a + b, 0);
  const maior = valoresPorFornecedor.reduce((a, b) => Math.max(a, b), 0);
  return { maior, total, fracao: total > 0 ? maior / total : null };
}

/** Presença em sessões/votações: comparecimentos / total de sessões do período. */
export function presencaSessoes(
  comparecimentos: number,
  sessoes: number,
): {
  comparecimentos: number;
  sessoes: number;
  taxa: number | null;
} {
  return {
    comparecimentos,
    sessoes,
    taxa: sessoes > 0 ? comparecimentos / sessoes : null,
  };
}

export type VotoColegiado = {
  /** Voto do titular ("Acompanhou", "Divergiu", "Sim", "Não"…). */
  voto: string;
  presente: boolean;
  /** Voto majoritário da sessão, quando conhecido. */
  maioria: string | null;
};

/**
 * Concordância com a maioria do colegiado: análogo ao alinhamento partidário do Legislativo,
 * trocando a orientação do partido pela posição majoritária da sessão.
 */
export function concordanciaMaioria(votos: VotoColegiado[]): {
  comparaveis: number;
  iguais: number;
  divergencias: number;
  taxa: number | null;
} {
  let comparaveis = 0;
  let iguais = 0;
  for (const v of votos) {
    if (!v.presente || !v.voto || !v.maioria) continue;
    comparaveis++;
    if (v.voto === v.maioria) iguais++;
  }
  return {
    comparaveis,
    iguais,
    divergencias: comparaveis - iguais,
    taxa: comparaveis > 0 ? iguais / comparaveis : null,
  };
}

/** Resumo de KPIs do Executivo a partir de totais já agregados pela camada de dados. */
export function kpisExecutivo(entrada: {
  gastoAno: number;
  tetoAno: number | null;
  mesesComLancamento: number;
  valoresPorFornecedor: number[];
  bensAnterior: number | null;
  bensAtual: number | null;
}) {
  return {
    taxaUso: taxaUsoVerba(entrada.gastoAno, entrada.tetoAno),
    mediaMensal: mediaMensalGastos(entrada.gastoAno, entrada.mesesComLancamento),
    concentracao: concentracaoFornecedor(entrada.valoresPorFornecedor),
    variacaoBens:
      entrada.bensAnterior !== null && entrada.bensAtual !== null
        ? variacaoNominal(entrada.bensAnterior, entrada.bensAtual)
        : null,
  };
}

/** Resumo de KPIs do Judiciário. */
export function kpisJudiciario(entrada: {
  comparecimentos: number;
  sessoes: number;
  votos: VotoColegiado[];
  gastoAno: number;
  mesesComLancamento: number;
}) {
  return {
    presenca: presencaSessoes(entrada.comparecimentos, entrada.sessoes),
    concordancia: concordanciaMaioria(entrada.votos),
    mediaMensal: mediaMensalGastos(entrada.gastoAno, entrada.mesesComLancamento),
  };
}

/** Resumo mínimo do Legislativo reutilizando as mesmas peças (uso de cota + bens). */
export function kpisLegislativo(entrada: {
  gastoAno: number;
  tetoAno: number | null;
  mesesComLancamento: number;
  bensAnterior: number | null;
  bensAtual: number | null;
  alinhamentoIguais: number;
  alinhamentoComparaveis: number;
  presencaComparecimentos: number;
  presencaSessoes: number;
}) {
  return {
    taxaUso: taxaUsoVerba(entrada.gastoAno, entrada.tetoAno),
    mediaMensal: mediaMensalGastos(entrada.gastoAno, entrada.mesesComLancamento),
    variacaoBens:
      entrada.bensAnterior !== null && entrada.bensAtual !== null
        ? variacaoNominal(entrada.bensAnterior, entrada.bensAtual)
        : null,
    alinhamento: {
      iguais: entrada.alinhamentoIguais,
      comparaveis: entrada.alinhamentoComparaveis,
      taxa: entrada.alinhamentoComparaveis > 0 ? entrada.alinhamentoIguais / entrada.alinhamentoComparaveis : null,
    },
    presenca: presencaSessoes(entrada.presencaComparecimentos, entrada.presencaSessoes),
  };
}
