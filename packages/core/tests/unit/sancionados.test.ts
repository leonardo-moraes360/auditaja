import { describe, expect, it } from "vitest";
import { juntarSancionados } from "../../src/emendas";

const f = (doc: string | null, nome = "X") => ({ fornecedor_nome: nome, fornecedor_doc: doc, documentos: 3 });
const s = (cnpj: string, notas: number) => ({ cnpj, notas });

describe("juntarSancionados", () => {
  it("acrescenta o sancionado de fora dos maiores e mantém os maiores na ordem", () => {
    const maiores = [f("11.111.111/0001-11", "A"), f(null, "PF")];
    const r = juntarSancionados(maiores, [f("22.222.222/0001-22", "B")], [s("22222222000122", 1)]);
    expect(r.fornecedores.map((x) => x.fornecedor_nome)).toEqual(["A", "PF", "B"]);
    expect(r.sancoes).toEqual([s("22222222000122", 1)]);
  });

  it("não duplica quem já está entre os maiores, mesmo com outra grafia do CNPJ", () => {
    const r = juntarSancionados([f("11.111.111/0001-11")], [f("11111111000111")], [s("11111111000111", 2)]);
    expect(r.fornecedores).toHaveLength(1);
  });

  it("dos maiores mantém sanção sem nota no período; dos extras, só com nota", () => {
    const r = juntarSancionados(
      [f("11.111.111/0001-11")],
      [f("22.222.222/0001-22")],
      [s("11111111000111", 0), s("22222222000122", 0), s("22222222000122", 4)],
    );
    expect(r.sancoes).toEqual([s("11111111000111", 0), s("22222222000122", 4)]);
  });
});
