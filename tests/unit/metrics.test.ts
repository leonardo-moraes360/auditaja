import { describe, expect, it } from "vitest";
import { alinhamento, orientacaoDoPartido, tipoBancadaParaPartido, variacaoNominal } from "@/lib/metrics";
import { numeroBr, dataBr } from "@/lib/format";

describe("orientação aplicável ao partido", () => {
  it.each([
    ["PL", "PL", "partido"],
    ["Solidaried", "SOLIDARIEDADE", "partido"],
    ["Fdr PSDB-CIDADAN", "CIDADANIA", "federacao"],
    ["Fdr PSDB-CIDADAN", "PSDB", "federacao"],
    ["Fdr PT-PCdoB-PV", "PCdoB", "federacao"],
    ["Bl UniPpPsd...", "UNIÃO", "bloco"],
    ["Bl UniPpPsd...", "PSD", "bloco"],
    ["Bl AvanSolidPrd...", "PRD", "bloco"],
  ])("%s vale para %s (%s)", (bancada, partido, tipo) => {
    expect(tipoBancadaParaPartido(bancada, partido)).toBe(tipo);
  });

  it.each([
    ["Bl UniPpPsd...", "PSDB"], // PSD é sigla completa: não é prefixo de PSDB
    ["PL", "PLURAL"],
    ["Governo", "PT"],
    ["Maioria", "PL"],
    ["Fdr PSOL-REDE", "PT"],
  ])("%s não vale para %s", (bancada, partido) => {
    expect(tipoBancadaParaPartido(bancada, partido)).toBeNull();
  });

  it("partido direto tem precedência sobre federação e bloco", () => {
    const o = orientacaoDoPartido({
      voto: "Sim",
      siglaPartido: "PSD",
      orientacoes: [
        { siglaBancada: "Bl UniPpPsd...", orientacao: "Não" },
        { siglaBancada: "PSD", orientacao: "Sim" },
      ],
    });
    expect(o).toEqual({ orientacao: "Sim", tipo: "partido" });
  });

  it("federação tem precedência sobre bloco", () => {
    const o = orientacaoDoPartido({
      voto: "Sim",
      siglaPartido: "PSDB",
      orientacoes: [
        { siglaBancada: "Bl PsdbMdb...", orientacao: "Não" },
        { siglaBancada: "Fdr PSDB-CIDADAN", orientacao: "Sim" },
      ],
    });
    expect(o).toEqual({ orientacao: "Sim", tipo: "federacao" });
  });

  it("sem orientação de partido ou federação, usa a do bloco", () => {
    const o = orientacaoDoPartido({
      voto: "Sim",
      siglaPartido: "UNIÃO",
      orientacoes: [
        { siglaBancada: "Governo", orientacao: "Sim" },
        { siglaBancada: "Bl UniPpPsd...", orientacao: "Não" },
      ],
    });
    expect(o).toEqual({ orientacao: "Não", tipo: "bloco" });
  });

  it("ignora orientação vazia", () => {
    expect(
      orientacaoDoPartido({ voto: "Sim", siglaPartido: "PL", orientacoes: [{ siglaBancada: "PL", orientacao: "" }] }),
    ).toBeNull();
  });
});

describe("alinhamento", () => {
  it("conta só Sim/Não contra Sim/Não", () => {
    const or = (o: string) => [{ siglaBancada: "PT", orientacao: o }];
    const r = alinhamento([
      { voto: "Sim", siglaPartido: "PT", orientacoes: or("Sim") },
      { voto: "Não", siglaPartido: "PT", orientacoes: or("Sim") },
      { voto: "Abstenção", siglaPartido: "PT", orientacoes: or("Sim") },
      { voto: "Sim", siglaPartido: "PT", orientacoes: or("Liberado") },
      { voto: "Sim", siglaPartido: "PT", orientacoes: [] },
    ]);
    expect(r).toEqual({ comparaveis: 2, iguais: 1, divergencias: 1 });
  });
});

describe("formatação", () => {
  it("lê números nos formatos do TSE e da Câmara", () => {
    expect(numeroBr("1.234,56")).toBe(1234.56);
    expect(numeroBr("20000,00")).toBe(20000);
    expect(numeroBr("1467.5")).toBe(1467.5);
    expect(numeroBr("")).toBe(0);
  });
  it("formata data ISO sem fuso", () => {
    expect(dataBr("2026-01-01")).toBe("01/01/2026");
  });
  it("variação nominal", () => {
    expect(variacaoNominal(100, 122)).toBe(22);
    expect(variacaoNominal(0, 10)).toBeNull();
  });
});
