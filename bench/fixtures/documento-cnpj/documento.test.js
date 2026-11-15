import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { documentoPublicavel, formatarCnpj } from "./documento.js";

describe("documentoPublicavel", () => {
  it("formata CNPJ mesmo com pontuacao irregular", () => {
    assert.deepEqual(documentoPublicavel("085.324.290/0013-1"), {
      doc: "08.532.429/0001-31",
      classe: "pessoa_juridica",
    });
  });

  it("CPF vira terceiro_pf sem digitos", () => {
    assert.deepEqual(documentoPublicavel("123.456.789-01"), {
      doc: null,
      classe: "terceiro_pf",
    });
  });

  it("formatarCnpj padroniza 14 digitos", () => {
    assert.equal(formatarCnpj("8532429000131"), "08.532.429/0001-31");
  });
});
