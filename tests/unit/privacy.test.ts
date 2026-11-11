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

describe("CPF dentro do nome do fornecedor (R3, verificação 2 do senador)", () => {
  it("mascara CPF solto na razão social de MEI, com ou sem pontuação", () => {
    expect(nomeFornecedorPublicavel("FULANO DE TAL 12345678901", "pessoa_juridica")).toBe(
      "FULANO DE TAL ***.***.***-**",
    );
    expect(nomeFornecedorPublicavel("12.345.678 FULANO DE TAL 123.456.789-01", "pessoa_juridica")).toBe(
      "12.345.678 FULANO DE TAL ***.***.***-**",
    );
    expect(nomeFornecedorPublicavel("Fulano 123 456 789 01 ME", "pessoa_juridica")).toBe("Fulano ***.***.***-** ME");
  });
  it("mascara CPF com hífens ou separadores duplos", () => {
    expect(nomeFornecedorPublicavel("Fulano 123-456-789-01", "pessoa_juridica")).toBe("Fulano ***.***.***-**");
    expect(nomeFornecedorPublicavel("Fulano 123  456.789-01", "pessoa_juridica")).toBe("Fulano ***.***.***-**");
  });
  it("mascara CPF com separadores espaçados ou barras", () => {
    expect(nomeFornecedorPublicavel("Fulano 123 - 456 - 789 - 01", "pessoa_juridica")).toBe("Fulano ***.***.***-**");
    expect(nomeFornecedorPublicavel("Fulano 123/456/789-01", "pessoa_juridica")).toBe("Fulano ***.***.***-**");
  });
  it("não confunde CNPJ formatado com CPF", () => {
    expect(nomeFornecedorPublicavel("Loja 12.345.678/0001-90", "pessoa_juridica")).toBe("Loja 12.345.678/0001-90");
  });
  it("não mexe em CNPJ nem em números curtos", () => {
    expect(nomeFornecedorPublicavel("Loja 12345678000190", "pessoa_juridica")).toBe("Loja 12345678000190");
    expect(nomeFornecedorPublicavel("Posto 24 Horas Ltda", "pessoa_juridica")).toBe("Posto 24 Horas Ltda");
  });
});
