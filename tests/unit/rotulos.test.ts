import { describe, expect, it } from "vitest";
import {
  cargoDeputado,
  cargoParlamentar,
  cargoSenador,
  partidoPorExtenso,
  periodoLegislatura,
  periodoMandato,
  seloParticipacao,
  ufPorExtenso,
} from "@/lib/rotulos";
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

describe("rótulos do Senado (SUI-02, SUI-03)", () => {
  it("cargo pelo sexo", () => {
    expect(cargoSenador("F")).toBe("Senadora");
    expect(cargoSenador("M")).toBe("Senador");
    expect(cargoSenador(null)).toBe("Senador(a)");
    expect(cargoParlamentar("senado", "F")).toBe("Senadora");
    expect(cargoParlamentar("camara", "F")).toBe("Deputada federal");
  });
  it("mandato e legislaturas", () => {
    expect(periodoMandato("2023-02-01", "2031-01-31")).toEqual({
      anos: "2023–2031",
      legislaturas: "57ª e 58ª legislaturas",
    });
    expect(periodoMandato("2019-02-01", "2027-01-31")).toEqual({
      anos: "2019–2027",
      legislaturas: "56ª e 57ª legislaturas",
    });
    expect(periodoMandato(null, "2031-01-31")).toBeNull();
  });
  it("selo da participação", () => {
    expect(seloParticipacao("Titular")).toBe("Titular");
    expect(seloParticipacao("1º Suplente")).toBe("1º Suplente em exercício");
    expect(seloParticipacao(null)).toBeNull();
  });
});
