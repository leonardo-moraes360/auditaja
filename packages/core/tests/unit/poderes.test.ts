import { describe, expect, it } from "vitest";
import {
  cargoExecutivo,
  cargoJudiciario,
  cargoTitular,
  DESLOCAMENTO_EXECUTIVO,
  DESLOCAMENTO_STF,
  ehCasaLegislativo,
  ESCOPO_TRES_PODERES,
  idExecutivo,
  idStf,
  poderDaCasa,
} from "../../src/poderes";

describe("poderes: ids e classificação", () => {
  it("desloca ids do Executivo e do STF sem colidir com Senado", () => {
    expect(idExecutivo(10)).toBe(DESLOCAMENTO_EXECUTIVO + 10);
    expect(idStf(1)).toBe(DESLOCAMENTO_STF + 1);
    expect(ehCasaLegislativo("camara")).toBe(true);
    expect(ehCasaLegislativo("executivo")).toBe(false);
    expect(poderDaCasa("stj")).toBe("judiciario");
    expect(poderDaCasa("executivo")).toBe("executivo");
  });

  it("rótulos de cargo respeitam sexo e pasta (R4: descritivo, sem juízo)", () => {
    expect(cargoExecutivo("presidente", "F")).toBe("Presidenta da República");
    expect(cargoExecutivo("ministro", "M", "Fazenda")).toBe("Ministro de Fazenda");
    expect(cargoJudiciario("stf", "F")).toBe("Ministra do STF");
    expect(cargoTitular("executivo", "F", { cargo: "ministro", orgao: "Saúde" })).toBe("Ministra de Saúde");
    expect(cargoTitular("camara", "M")).toBe("Deputado federal");
  });

  it("documenta escopo federal dos três poderes", () => {
    expect(ESCOPO_TRES_PODERES.esfera).toBe("federal");
    expect(ESCOPO_TRES_PODERES.executivo).toContain("Ministros de Estado");
    expect(ESCOPO_TRES_PODERES.judiciario).toContain("Ministros do STF");
  });
});
