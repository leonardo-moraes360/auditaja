import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mascararCpfsNoTexto, nomeFornecedorPublicavel } from "./privacy.js";

describe("R3 mascaramento total", () => {
  it("remove todos os digitos do CPF no texto", () => {
    assert.equal(mascararCpfsNoTexto("FULANO 12345678901"), "FULANO ***.***.***-**");
    assert.equal(mascararCpfsNoTexto("Fulano 123.456.789-01"), "Fulano ***.***.***-**");
  });

  it("rotulo generico para fornecedor PF", () => {
    assert.equal(nomeFornecedorPublicavel("Fulano", "terceiro_pf"), "Prestador pessoa fisica");
  });

  it("nao deixa digitos na mascara", () => {
    const out = mascararCpfsNoTexto("MEI 987.654.321-00");
    assert.equal(/\d/.test(out), false);
  });
});
