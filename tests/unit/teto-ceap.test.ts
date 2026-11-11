import { describe, expect, it } from "vitest";
import { TETO_CEAP_ANO, TETO_CEAP_MENSAL, tetoDaUf } from "@/data/teto-ceap";
import { tetoAcumulado } from "@/lib/metrics";

const UFS = "AC AL AM AP BA CE DF ES GO MA MG MS MT PA PB PE PI PR RJ RN RO RR RS SC SE SP TO".split(" ");

describe("teto da CEAP por UF", () => {
  it("CEAP-05: tem valor conferido para as 27 UFs", () => {
    expect(Object.keys(TETO_CEAP_MENSAL).sort()).toEqual(UFS);
    for (const uf of UFS) expect(tetoDaUf(uf, TETO_CEAP_ANO)?.verificado).toBe(true);
  });

  it("CEAP-05: valores da página da Câmara, do menor (DF) ao maior (RR)", () => {
    expect(tetoDaUf("DF", 2026)?.mensal).toBe(41612.55);
    expect(tetoDaUf("SP", 2026)?.mensal).toBe(48727.46);
    expect(tetoDaUf("RR", 2026)?.mensal).toBe(58474.7);
    const valores = UFS.map((uf) => tetoDaUf(uf, 2026)!.mensal);
    expect(Math.min(...valores)).toBe(41612.55);
    expect(Math.max(...valores)).toBe(58474.7);
  });

  it("CEAP-06: sem teto para ano sem valores conferidos ou UF desconhecida", () => {
    expect(tetoDaUf("SP", 2025)).toBeNull();
    expect(tetoDaUf("SP", 2027)).toBeNull();
    expect(tetoDaUf("XX", 2026)).toBeNull();
    expect(tetoDaUf(null, 2026)).toBeNull();
  });

  it("teto acumulado é o mensal vezes os meses", () => {
    expect(tetoAcumulado(tetoDaUf("SP", 2026), 3)).toBeCloseTo(146182.38, 2);
    expect(tetoAcumulado(tetoDaUf("SP", 2026), 0)).toBeNull();
    expect(tetoAcumulado(null, 3)).toBeNull();
  });
});
