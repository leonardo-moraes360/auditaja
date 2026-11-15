import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { numeroBr, pct } from "./format.js";

describe("numeroBr (TSE/Camara)", () => {
  it("aceita formato brasileiro com milhar e virgula", () => {
    assert.equal(numeroBr("1.234,56"), 1234.56);
  });

  it("aceita formato da Camara com ponto decimal", () => {
    assert.equal(numeroBr("1234.56"), 1234.56);
  });

  it("vazio vira 0", () => {
    assert.equal(numeroBr(""), 0);
    assert.equal(numeroBr(null), 0);
  });
});

describe("pct", () => {
  it("retorna null quando total e 0", () => {
    assert.equal(pct(10, 0), null);
  });

  it("arredonda percentual", () => {
    assert.equal(pct(1, 3), 33);
  });
});
