import { describe, expect, it } from "vitest";
import {
  cargoExecutivo,
  cargoJudiciario,
  ESCOPO_EXECUTIVO,
  ESCOPO_JUDICIARIO,
  ESFERA_MVP,
  nomeDoPoder,
} from "../../src/poderes";

describe("escopo dos três poderes", () => {
  it("MVP é federal", () => {
    expect(ESFERA_MVP).toBe("federal");
    expect(ESCOPO_EXECUTIVO.cargos).toEqual(["presidente", "vice_presidente", "ministro"]);
    expect(ESCOPO_JUDICIARIO.tribunais).toEqual(["STF"]);
  });

  it("rótulos de cargo", () => {
    expect(cargoExecutivo("presidente", "F")).toBe("Presidenta da República");
    expect(cargoExecutivo("ministro", "M")).toBe("Ministro de Estado");
    expect(cargoJudiciario("ministro_stf", "F")).toBe("Ministra do STF");
    expect(nomeDoPoder("legislativo")).toBe("Poder Legislativo");
  });
});
