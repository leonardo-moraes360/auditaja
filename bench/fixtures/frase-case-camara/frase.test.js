import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { fraseCase } from "./frase.js";

describe("fraseCase Camara", () => {
  it("title-case basico", () => {
    assert.equal(fraseCase("LOCACAO OU FRETAMENTO"), "Locacao ou fretamento");
  });

  it("corrige virgula colada publicada pela Camara", () => {
    assert.equal(fraseCase("HOSPEDAGEM ,EXCETO DO ACORDO"), "Hospedagem, exceto do acordo");
  });
});
