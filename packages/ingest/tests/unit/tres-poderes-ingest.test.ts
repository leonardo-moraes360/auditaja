import { describe, expect, it } from "vitest";
import { montarDespesasExecutivo, montarExecutivo } from "../../src/executivo";
import { montarDespesasJudiciario, montarJudiciario } from "../../src/judiciario";

describe("ingest Executivo/Judiciário: privacidade R2/R3", () => {
  it("não grava CPF do titular e mascara fornecedor PF", () => {
    const titulares = montarExecutivo(
      [
        {
          codigo: 10,
          nome: "Ministra Exemplo",
          cargo: "ministro",
          orgao: "Fazenda",
          sexo: "F",
        },
      ],
      1,
    );
    expect(titulares[0]).toMatchObject({
      id: 20_000_010,
      casa: "executivo",
      cargo: "ministro",
      orgao: "Fazenda",
      data_nascimento: null,
    });
    expect(JSON.stringify(titulares)).not.toMatch(/\d{11}/);

    const despesas = montarDespesasExecutivo(
      [
        {
          codigoTitular: 10,
          ano: 2026,
          mes: 1,
          tipoDespesa: "Diárias",
          fornecedorNome: "Fulano de Tal",
          fornecedorDoc: "123.456.789-01",
          valorLiquido: 1000,
        },
        {
          codigoTitular: 10,
          ano: 2026,
          mes: 1,
          tipoDespesa: "Passagens",
          fornecedorNome: "Cia Aérea X",
          fornecedorDoc: "12.345.678/0001-90",
          valorLiquido: 2000,
        },
      ],
      1,
    );
    expect(despesas[0]).toMatchObject({
      fornecedor_nome: "Prestador pessoa física",
      fornecedor_doc: null,
      fornecedor_classe: "terceiro_pf",
    });
    expect(despesas[1].fornecedor_classe).toBe("pessoa_juridica");
    expect(despesas[1].fornecedor_doc).toBe("12.345.678/0001-90");
  });

  it("monta ministros STF/STJ com ids e órgãos corretos", () => {
    const rows = montarJudiciario(
      [
        { codigo: 3, casa: "stf", nome: "Ministro A", sexo: "M" },
        { codigo: 4, casa: "stj", nome: "Ministra B", sexo: "F" },
      ],
      9,
    );
    expect(rows.map((r) => r.id)).toEqual([30_000_003, 31_000_004]);
    expect(rows[0].orgao).toBe("STF");
    expect(rows[1].casa).toBe("stj");

    const desp = montarDespesasJudiciario(
      [
        {
          casa: "stf",
          codigoTitular: 3,
          ano: 2026,
          mes: 2,
          tipoDespesa: "Auxílio",
          fornecedorNome: "MEI 12345678901",
          fornecedorDoc: "11.222.333/0001-81",
          valorLiquido: 50,
        },
      ],
      9,
    );
    expect(desp[0].fornecedor_nome).toBe("MEI ***.***.***-**");
  });
});
