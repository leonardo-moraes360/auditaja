import { describe, expect, it } from "vitest";
import {
  concentracaoFornecedor,
  kpiExecutivo,
  kpiJudiciario,
  kpiLegislativo,
  painelTresPoderes,
  participacaoPorTipo,
  resumoGastos,
} from "../../src/metrics-poderes";

const gastos = [
  { mes: 1, valor: 1000, tipo: "Diárias", fornecedor: "Prestador pessoa física" },
  { mes: 1, valor: 2000, tipo: "Passagens", fornecedor: "Cia Aérea X" },
  { mes: 2, valor: 3000, tipo: "Passagens", fornecedor: "Cia Aérea X" },
];

describe("KPIs compartilhados entre poderes", () => {
  it("resume gastos como a média mensal da CEAP (só meses com nota)", () => {
    expect(resumoGastos(gastos)).toEqual({ total: 6000, mesesComGasto: 2, mediaMensal: 3000 });
    expect(resumoGastos([])).toEqual({ total: 0, mesesComGasto: 0, mediaMensal: null });
  });

  it("participação por tipo soma 100% (arredondado)", () => {
    const tipos = participacaoPorTipo(gastos);
    expect(tipos[0]).toMatchObject({ tipo: "Passagens", valor: 5000, pct: 83 });
    expect(tipos[1]).toMatchObject({ tipo: "Diárias", valor: 1000, pct: 17 });
  });

  it("concentração no maior fornecedor é ponto de partida (R4)", () => {
    expect(concentracaoFornecedor(gastos)).toBe(83);
    expect(concentracaoFornecedor([{ mes: 1, valor: 10 }])).toBeNull();
  });
});

describe("KPIs por poder", () => {
  it("Legislativo reutiliza alinhamento e variação de bens", () => {
    const k = kpiLegislativo({
      gastos,
      presencaPct: 90,
      votos: [
        { voto: "Sim", siglaPartido: "PT", orientacoes: [{ siglaBancada: "PT", orientacao: "Sim" }] },
        { voto: "Não", siglaPartido: "PT", orientacoes: [{ siglaBancada: "PT", orientacao: "Sim" }] },
      ],
      bensAnterior: 100,
      bensAtual: 150,
    });
    expect(k.poder).toBe("legislativo");
    expect(k.presencaPct).toBe(90);
    expect(k.alinhamento).toEqual({ comparaveis: 2, iguais: 1, divergencias: 1, pct: 50 });
    expect(k.variacaoBensPct).toBe(50);
    expect(k.gastos.total).toBe(6000);
  });

  it("Executivo cobre gastos, concentração e bens; sem alinhamento partidário", () => {
    const k = kpiExecutivo({ gastos, bensAnterior: 200, bensAtual: 100 });
    expect(k.poder).toBe("executivo");
    expect(k.concentracaoFornecedorPct).toBe(83);
    expect(k.variacaoBensPct).toBe(-50);
    expect(k).not.toHaveProperty("alinhamento");
  });

  it("Judiciário cobre gastos e composição; sem bens/alinhamento no MVP", () => {
    const k = kpiJudiciario({ gastos });
    expect(k.poder).toBe("judiciario");
    expect(k.tipos[0].tipo).toBe("Passagens");
    expect(k).not.toHaveProperty("variacaoBensPct");
  });

  it("painel agrega média por titular para a landing", () => {
    expect(
      painelTresPoderes([
        { poder: "legislativo", titulares: 2, totalGastos: 1000 },
        { poder: "executivo", titulares: 0, totalGastos: 0 },
      ]),
    ).toEqual([
      { poder: "legislativo", titulares: 2, totalGastos: 1000, mediaPorTitular: 500 },
      { poder: "executivo", titulares: 0, totalGastos: 0, mediaPorTitular: null },
    ]);
  });
});
