import { describe, expect, it } from "vitest";
import { cargoDeputado, partidoPorExtenso, periodoLegislatura, ufPorExtenso } from "@/lib/rotulos";
import { dataHoraBr } from "@/lib/format";

describe("rótulos do perfil", () => {
  it("UF e partido por extenso, com a sigla", () => {
    expect(ufPorExtenso("SP")).toBe("São Paulo (SP)");
    expect(ufPorExtenso(null)).toBe("UF não informada");
    expect(partidoPorExtenso("PT")).toBe("Partido dos Trabalhadores (PT)");
    expect(partidoPorExtenso("XYZ")).toBe("XYZ");
    expect(partidoPorExtenso(null)).toBeNull();
  });

  it("cargo pelo sexo informado pela Câmara", () => {
    expect(cargoDeputado("F")).toBe("Deputada federal");
    expect(cargoDeputado("M")).toBe("Deputado federal");
    expect(cargoDeputado(null)).toBe("Deputado(a) federal");
  });

  it("período da legislatura", () => {
    expect(periodoLegislatura(57)).toBe("2023–2027");
    expect(periodoLegislatura(null)).toBeNull();
  });

  it("data e hora da coleta sem vírgula", () => {
    expect(dataHoraBr("2026-11-10T11:12:00Z")).toBe("10/11/2026 08:12");
  });
});
