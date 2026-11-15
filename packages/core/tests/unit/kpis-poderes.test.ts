import { describe, expect, it } from "vitest";
import {
  concentracaoFornecedor,
  concordanciaMaioria,
  kpisExecutivo,
  kpisJudiciario,
  kpisLegislativo,
  mediaMensalGastos,
  presencaSessoes,
  taxaUsoVerba,
} from "../../src/kpis-poderes";

describe("KPIs compartilhados", () => {
  it("taxaUsoVerba", () => {
    expect(taxaUsoVerba(50, 100)).toBe(0.5);
    expect(taxaUsoVerba(10, null)).toBeNull();
    expect(taxaUsoVerba(10, 0)).toBeNull();
  });

  it("mediaMensalGastos", () => {
    expect(mediaMensalGastos(900, 3)).toBe(300);
    expect(mediaMensalGastos(100, 0)).toBeNull();
  });

  it("concentracaoFornecedor", () => {
    expect(concentracaoFornecedor([70, 20, 10])).toEqual({ maior: 70, total: 100, fracao: 0.7 });
    expect(concentracaoFornecedor([])).toEqual({ maior: 0, total: 0, fracao: null });
  });

  it("presencaSessoes", () => {
    expect(presencaSessoes(8, 10)).toEqual({ comparecimentos: 8, sessoes: 10, taxa: 0.8 });
    expect(presencaSessoes(0, 0).taxa).toBeNull();
  });
});

describe("concordanciaMaioria (análogo ao alinhamento)", () => {
  it("conta só votos presentes com maioria conhecida", () => {
    const r = concordanciaMaioria([
      { voto: "Acompanhou", presente: true, maioria: "Acompanhou" },
      { voto: "Divergiu", presente: true, maioria: "Acompanhou" },
      { voto: "", presente: false, maioria: "Acompanhou" },
      { voto: "Acompanhou", presente: true, maioria: null },
    ]);
    expect(r).toEqual({ comparaveis: 2, iguais: 1, divergencias: 1, taxa: 0.5 });
  });
});

describe("resumos por poder", () => {
  it("kpisExecutivo", () => {
    const k = kpisExecutivo({
      gastoAno: 1000,
      tetoAno: 2000,
      mesesComLancamento: 4,
      valoresPorFornecedor: [600, 400],
      bensAnterior: 100,
      bensAtual: 150,
    });
    expect(k.taxaUso).toBe(0.5);
    expect(k.mediaMensal).toBe(250);
    expect(k.concentracao.fracao).toBe(0.6);
    expect(k.variacaoBens).toBe(50);
  });

  it("kpisJudiciario", () => {
    const k = kpisJudiciario({
      comparecimentos: 9,
      sessoes: 10,
      votos: [
        { voto: "Acompanhou", presente: true, maioria: "Acompanhou" },
        { voto: "Divergiu", presente: true, maioria: "Acompanhou" },
      ],
      gastoAno: 500,
      mesesComLancamento: 2,
    });
    expect(k.presenca.taxa).toBe(0.9);
    expect(k.concordancia.taxa).toBe(0.5);
    expect(k.mediaMensal).toBe(250);
  });

  it("kpisLegislativo reutiliza as mesmas peças", () => {
    const k = kpisLegislativo({
      gastoAno: 400,
      tetoAno: 800,
      mesesComLancamento: 2,
      bensAnterior: 200,
      bensAtual: 100,
      alinhamentoIguais: 8,
      alinhamentoComparaveis: 10,
      presencaComparecimentos: 7,
      presencaSessoes: 10,
    });
    expect(k.taxaUso).toBe(0.5);
    expect(k.alinhamento.taxa).toBe(0.8);
    expect(k.presenca.taxa).toBe(0.7);
    expect(k.variacaoBens).toBe(-50);
  });
});
