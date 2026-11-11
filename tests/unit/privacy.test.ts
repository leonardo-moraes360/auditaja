import { describe, expect, it } from "vitest";
import { documentoPublicavel, mascararCpf, nomeFornecedorPublicavel } from "@/lib/privacy";

describe("R3: mascaramento", () => {
  it("mascara CPF no padrão da Receita, sem expor os extremos", () => {
    expect(mascararCpf("123.456.789-01")).toBe("***.456.789-**");
    expect(mascararCpf("12345678901")).toBe("***.456.789-**");
  });

  it("classifica CPF como terceiro_pf e nunca devolve os 11 dígitos", () => {
    const r = documentoPublicavel("123.456.789-01");
    expect(r.classe).toBe("terceiro_pf");
    expect(r.doc).toBe("***.456.789-**");
    expect(r.doc).not.toContain("123");
  });

  it("formata CNPJ mesmo com pontuação irregular da fonte", () => {
    expect(documentoPublicavel("085.324.290/0013-1")).toEqual({
      doc: "08.532.429/0001-31",
      classe: "pessoa_juridica",
    });
  });

  it("não publica documento inválido", () => {
    expect(documentoPublicavel("")).toEqual({ doc: null, classe: "desconhecido" });
    expect(documentoPublicavel("123")).toEqual({ doc: null, classe: "desconhecido" });
  });

  it("troca o nome de fornecedor PF por rótulo genérico", () => {
    expect(nomeFornecedorPublicavel("Fulano de Tal", "terceiro_pf")).toBe("Prestador pessoa física");
    expect(nomeFornecedorPublicavel(" Gráfica X Ltda ", "pessoa_juridica")).toBe("Gráfica X Ltda");
  });
});
