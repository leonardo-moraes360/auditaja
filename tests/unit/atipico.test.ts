import { describe, expect, it } from "vitest";
import {
  acimaDosColegas,
  cercaExterna,
  MINIMO_COLEGAS,
  percentil,
  quartis,
  saltoAnual,
  type TotalTipo,
} from "@/lib/atipico";

const T = "HOSPEDAGEM";

/** n colegas com média mensal 100..(100+n-1) em 10 meses, mais linhas extras. */
function colegas(n: number, tipo = T, meses = 10, base = 100): TotalTipo[] {
  return Array.from({ length: n }, (_, i) => ({ parlamentarId: i + 1, tipo, total: (base + i) * meses, meses }));
}

describe("percentil (igual a percentile_cont)", () => {
  it("interpola entre vizinhos", () => {
    expect(percentil([1, 2, 3, 4], 0.25)).toBeCloseTo(1.75);
    expect(percentil([1, 2, 3, 4], 0.5)).toBeCloseTo(2.5);
    expect(percentil([1, 2, 3, 4], 0.75)).toBeCloseTo(3.25);
    expect(percentil([7], 0.75)).toBe(7);
  });
  it("cerca externa = Q3 + 3 × IQR", () => {
    const q = quartis([4, 1, 3, 2]);
    expect(cercaExterna(q)).toBeCloseTo(3.25 + 3 * 1.5);
  });
});

describe("acimaDosColegas", () => {
  const base = colegas(29); // médias 100..128: Q1=107, Q3=121, limite = 121 + 42 = 163
  it("sinaliza média mensal acima do limite com excesso acima de R$ 5 mil", () => {
    const linhas = [...base, { parlamentarId: 99, tipo: T, total: 1000 * 10, meses: 10 }];
    const [a] = acimaDosColegas(linhas, 99);
    expect(a.tipo).toBe(T);
    expect(a.colegas).toBe(30);
    expect(a.mediaMensal).toBe(1000);
    expect(a.limiteMensal).toBeCloseTo(cercaExterna(quartis(linhas.map((l) => l.total / l.meses))));
    expect(a.excessoAno).toBeCloseTo(10000 - a.limiteMensal * 10);
  });
  it("não sinaliza quando o excesso do ano não passa de R$ 5 mil", () => {
    const linhas = [...base, { parlamentarId: 99, tipo: T, total: 600 * 10, meses: 10 }];
    expect(acimaDosColegas(linhas, 99)).toEqual([]);
  });
  it("usa a média mensal: poucos meses com nota não escondem o padrão", () => {
    const linhas = [...base, { parlamentarId: 99, tipo: T, total: 3000 * 3, meses: 3 }];
    expect(acimaDosColegas(linhas, 99)).toHaveLength(1);
  });
  it("exige pelo menos 20 parlamentares no tipo", () => {
    const poucos = [...colegas(MINIMO_COLEGAS - 2), { parlamentarId: 99, tipo: T, total: 1e6, meses: 10 }];
    expect(acimaDosColegas(poucos, 99)).toEqual([]);
  });
  it("ignora totais zerados ou negativos e quem não usou o tipo", () => {
    const linhas = [...base, { parlamentarId: 99, tipo: T, total: -500, meses: 10 }];
    expect(acimaDosColegas(linhas, 99)).toEqual([]);
    expect(acimaDosColegas(base, 12345)).toEqual([]);
  });
  it("ordena pelo maior excesso", () => {
    const linhas = [
      ...base,
      ...colegas(29, "POSTAIS"),
      { parlamentarId: 99, tipo: T, total: 1000 * 10, meses: 10 },
      { parlamentarId: 99, tipo: "POSTAIS", total: 3000 * 10, meses: 10 },
    ];
    expect(acimaDosColegas(linhas, 99).map((a) => a.tipo)).toEqual(["POSTAIS", T]);
  });
});

describe("saltoAnual", () => {
  // 30 colegas que crescem de 0% a 29%: o limite fica perto de 2 vezes.
  const anterior = colegas(30, T, 12, 1000);
  const atual = anterior.map((l, i) => ({ ...l, total: l.total * (1 + i / 100) }));
  it("sinaliza razão acima da cerca externa (em log) com aumento acima de R$ 5 mil", () => {
    const ant = [...anterior, { parlamentarId: 99, tipo: T, total: 3000, meses: 12 }];
    const at = [...atual, { parlamentarId: 99, tipo: T, total: 40000, meses: 12 }];
    const [s] = saltoAnual(at, ant, 99);
    expect(s.razao).toBeCloseTo(40000 / 3000);
    expect(s.aumento).toBe(37000);
    expect(s.colegas).toBe(31);
    expect(s.limiteRazao).toBeGreaterThan(1);
    expect(s.limiteRazao).toBeLessThan(s.razao);
  });
  it("não sinaliza aumento de até R$ 5 mil, mesmo com razão alta", () => {
    const ant = [...anterior, { parlamentarId: 99, tipo: T, total: 100, meses: 12 }];
    const at = [...atual, { parlamentarId: 99, tipo: T, total: 5000, meses: 12 }];
    expect(saltoAnual(at, ant, 99)).toEqual([]);
  });
  it("exige 10 meses com nota nos dois anos", () => {
    const ant = [...anterior, { parlamentarId: 99, tipo: T, total: 3000, meses: 9 }];
    const at = [...atual, { parlamentarId: 99, tipo: T, total: 40000, meses: 12 }];
    expect(saltoAnual(at, ant, 99)).toEqual([]);
  });
  it("sem o tipo no ano anterior não há comparação", () => {
    const at = [...atual, { parlamentarId: 99, tipo: T, total: 40000, meses: 12 }];
    expect(saltoAnual(at, anterior, 99)).toEqual([]);
  });
});
