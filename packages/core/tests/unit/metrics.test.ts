import { describe, expect, it } from "vitest";
import {
  alinhamento,
  blocoDaBancada,
  orientacaoDoPartido,
  partidosDoNomeDoBloco,
  tipoBancadaParaPartido,
  variacaoNominal,
} from "../../src/metrics";
import { numeroBr, dataBr } from "../../src/format";

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

  it("partido direto tem precedência sobre bloco", () => {
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

  it("partido tem precedência sobre federação, mesmo listada antes", () => {
    const o = orientacaoDoPartido({
      voto: "Sim",
      siglaPartido: "PSDB",
      orientacoes: [
        { siglaBancada: "Fdr PSDB-CIDADAN", orientacao: "Não" },
        { siglaBancada: "PSDB", orientacao: "Sim" },
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

// Composição publicada pela API v2 da Câmara (/blocos?idLegislatura=57 e /blocos/{id}/partidos), 11/11/2026.
const BLOCOS_57 = [
  {
    nome: "UNIÃO, PP, PSD, REPUBLICANOS, MDB, Federação PSDB CIDADANIA, PODE",
    partidos: ["PSDB", "CIDADANIA", "UNIÃO", "PP", "REPUBLICANOS", "PSD", "MDB", "PODE"],
  },
  // A API devolve /partidos vazio para este bloco: a lista sai do nome.
  { nome: "AVANTE, SOLIDARIEDADE, PRD", partidos: ["AVANTE", "SOLIDARIEDADE", "PRD"] },
  { nome: "REPUBLICANOS", partidos: ["REPUBLICANOS"] },
  { nome: "UNIÃO", partidos: ["UNIÃO"] },
];

describe("orientação de bloco com a composição da API", () => {
  it.each([
    ["Bl UniPpPsd...", "Uni"],
    ["Bl AvanSolidPrd...", "AVANTE"],
  ])("identifica o bloco de %s", (bancada, inicio) => {
    expect(blocoDaBancada(bancada, BLOCOS_57)?.nome.startsWith(inicio.toUpperCase())).toBe(true);
  });

  it.each(["REPUBLICANOS", "PSDB", "CIDADANIA", "MDB", "PODE", "UNIÃO", "PSD", "PP"])(
    "Bl UniPpPsd... vale para %s, inclusive fora da abreviação",
    (partido) => {
      expect(tipoBancadaParaPartido("Bl UniPpPsd...", partido, BLOCOS_57)).toBe("bloco");
    },
  );

  it.each([
    ["Bl UniPpPsd...", "PL"],
    ["Bl UniPpPsd...", "AVANTE"],
    ["Bl AvanSolidPrd...", "PSDB"],
  ])("%s não vale para %s, que não é do bloco", (bancada, partido) => {
    expect(tipoBancadaParaPartido(bancada, partido, BLOCOS_57)).toBeNull();
  });

  it("sem bloco identificado, cai na abreviação", () => {
    expect(blocoDaBancada("Bl XyzAbc...", BLOCOS_57)).toBeNull();
    expect(tipoBancadaParaPartido("Bl UniPpPsd...", "REPUBLICANOS")).toBeNull();
    expect(tipoBancadaParaPartido("Bl UniPpPsd...", "PP")).toBe("bloco");
  });

  it("dois blocos que casam a mesma abreviação não identificam nenhum", () => {
    const ambiguos = [
      { nome: "PP, PSD", partidos: ["PP", "PSD"] },
      { nome: "PP, PSD, MDB", partidos: ["PP", "PSD", "MDB"] },
    ];
    expect(blocoDaBancada("Bl PpPsd...", ambiguos)).toBeNull();
  });

  it("PSDB e Republicanos passam a ter orientação e alinhamento", () => {
    const votos = [
      { voto: "Sim", siglaPartido: "PSDB", orientacoes: [{ siglaBancada: "Bl UniPpPsd...", orientacao: "Sim" }] },
      {
        voto: "Sim",
        siglaPartido: "REPUBLICANOS",
        orientacoes: [{ siglaBancada: "Bl UniPpPsd...", orientacao: "Não" }],
      },
    ];
    expect(orientacaoDoPartido(votos[0], BLOCOS_57)).toEqual({ orientacao: "Sim", tipo: "bloco" });
    expect(alinhamento(votos)).toEqual({ comparaveis: 0, iguais: 0, divergencias: 0 });
    expect(alinhamento(votos, BLOCOS_57)).toEqual({ comparaveis: 2, iguais: 1, divergencias: 1 });
  });

  it("federação ainda tem precedência sobre o bloco", () => {
    const o = orientacaoDoPartido(
      {
        voto: "Sim",
        siglaPartido: "PSDB",
        orientacoes: [
          { siglaBancada: "Bl UniPpPsd...", orientacao: "Não" },
          { siglaBancada: "Fdr PSDB-CIDADAN", orientacao: "Sim" },
        ],
      },
      BLOCOS_57,
    );
    expect(o).toEqual({ orientacao: "Sim", tipo: "federacao" });
  });

  it("lê partidos do nome do bloco, abrindo federações", () => {
    expect(partidosDoNomeDoBloco("AVANTE, SOLIDARIEDADE, PRD")).toEqual(["AVANTE", "SOLIDARIEDADE", "PRD"]);
    expect(partidosDoNomeDoBloco("MDB, Federação PSDB CIDADANIA")).toEqual(["MDB", "PSDB", "CIDADANIA"]);
    expect(partidosDoNomeDoBloco("UNIÃO")).toEqual(["UNIÃO"]);
  });
});
