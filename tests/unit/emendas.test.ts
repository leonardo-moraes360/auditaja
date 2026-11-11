import { describe, expect, it } from "vitest";
import {
  ANO_INICIAL_EMENDAS,
  baseDaColeta,
  brlMi,
  dataLocalBr,
  frasesNotas,
  periodoDaSancao,
  autorDoNome,
  ehEmendaIndividual,
  ehTransferenciaEspecial,
  favorecidoPublicavel,
  indiceDeAutores,
  periodoEmendas,
  rotuloLocalidade,
  valorBr,
} from "@/lib/emendas";

describe("EMD-06 e EDGE-03: valores monetários do Portal", () => {
  it("converte milhar com ponto e decimal com vírgula", () => {
    expect(valorBr("1.234,56")).toBe("1234.56");
    expect(valorBr("12.345.678,90")).toBe("12345678.90");
  });
  it("aceita o formato sem separador de milhar que o arquivo usa", () => {
    expect(valorBr("390244,00")).toBe("390244.00");
  });
  it("grava vazio como 0", () => {
    expect(valorBr("")).toBe("0");
    expect(valorBr("   ")).toBe("0");
    expect(valorBr(undefined)).toBe("0");
  });
  it("preserva o sinal negativo", () => {
    expect(valorBr("-1.000,50")).toBe("-1000.50");
  });
});

describe("EMD-04 e EMD-05: ligação do autor ao deputado", () => {
  const indice = indiceDeAutores([
    { id: 1, nome: "Maria Exemplo" },
    { id: 2, nome: "José da Silva" },
    { id: 3, nome: "JOSE DA SILVA" },
    { id: 4, nome: "Capitão Fábio" },
  ]);
  it("casa o nome do autor normalizado com exatamente um deputado", () => {
    expect(autorDoNome(indice, "MARIA EXEMPLO")).toBe(1);
    expect(autorDoNome(indice, "CAPITAO FABIO")).toBe(4);
  });
  it("devolve null para homônimo", () => {
    expect(autorDoNome(indice, "JOSÉ DA SILVA")).toBeNull();
  });
  it("devolve null quando nenhum deputado casa", () => {
    expect(autorDoNome(indice, "ALVARO DIAS")).toBeNull();
  });
});

describe("EMD-03 e EMDUI-07: tipos de emenda", () => {
  it("reconhece só emendas individuais", () => {
    expect(ehEmendaIndividual("Emenda Individual - Transferências com Finalidade Definida")).toBe(true);
    expect(ehEmendaIndividual("Emenda Individual - Transferências Especiais")).toBe(true);
    expect(ehEmendaIndividual("Emenda de Bancada")).toBe(false);
    expect(ehEmendaIndividual("Emenda de Comissão")).toBe(false);
  });
  it("reconhece transferência especial pelo nome oficial", () => {
    expect(ehTransferenciaEspecial("Emenda Individual - Transferências Especiais")).toBe(true);
    expect(ehTransferenciaEspecial("Emenda Individual - Transferências com Finalidade Definida")).toBe(false);
  });
  it("o mandato começa no orçamento de 2024", () => {
    expect(ANO_INICIAL_EMENDAS).toBe(2024);
  });
});

describe("EMD-08 e EMD-09: favorecido publicável (R3)", () => {
  it("troca o nome de PF e mantém só o CPF já mascarado", () => {
    expect(favorecidoPublicavel("Pessoa Fisica", "***.113.861-**", "ACACIA GONCALVES")).toEqual({
      nome: "Beneficiário pessoa física",
      doc: "***.113.861-**",
    });
  });
  it("nunca grava CPF completo de PF", () => {
    expect(favorecidoPublicavel("Pessoa Fisica", "12345678901", "FULANO")).toEqual({
      nome: "Beneficiário pessoa física",
      doc: null,
    });
  });
  it("formata CNPJ de 14 dígitos", () => {
    expect(favorecidoPublicavel("Pessoa Jurídica", "11854334000149", "EMPRESA X")).toEqual({
      nome: "EMPRESA X",
      doc: "11.854.334/0001-49",
    });
  });
  it("mantém o nome e grava documento nulo sem documento válido", () => {
    expect(favorecidoPublicavel("Sem informação", "-11", " PREFEITURA X ")).toEqual({
      nome: "PREFEITURA X",
      doc: null,
    });
  });
});

describe("Rótulo de localidade", () => {
  it("município com UF", () => {
    expect(rotuloLocalidade("FRANCISCO SANTOS - PI")).toBe("Francisco Santos (PI)");
    expect(rotuloLocalidade("SÃO JOÃO DO RIO DAS PEDRAS - SP")).toBe("São João do Rio das Pedras (SP)");
  });
  it("estado inteiro", () => {
    expect(rotuloLocalidade("SÃO PAULO (UF)")).toBe("São Paulo (UF)");
  });
  it("demais em caixa de título", () => {
    expect(rotuloLocalidade("NACIONAL")).toBe("Nacional");
    expect(rotuloLocalidade("REGIÃO NORDESTE")).toBe("Região Nordeste");
  });
});

describe("EMDUI-14: período da seção", () => {
  const anos = [2024, 2025, 2026];
  it("aceita um ano com emenda", () => {
    expect(periodoEmendas("2025", anos)).toBe(2025);
  });
  it("usa o mandato para ano sem emenda, texto inválido, lista ou ausência", () => {
    expect(periodoEmendas("2019", anos)).toBe("mandato");
    expect(periodoEmendas("abc", anos)).toBe("mandato");
    expect(periodoEmendas(["2025", "2026"], anos)).toBe("mandato");
    expect(periodoEmendas(undefined, anos)).toBe("mandato");
    expect(periodoEmendas("mandato", anos)).toBe("mandato");
  });
});

describe("SAN-05, SAN-07: textos do aviso de sanção", () => {
  it("período com e sem data final", () => {
    expect(periodoDaSancao({ data_inicio: "2026-02-01", data_fim: "2027-02-01" })).toBe("de 01/02/2026 a 01/02/2027");
    expect(periodoDaSancao({ data_inicio: "2026-05-01", data_fim: null })).toBe("desde 01/05/2026, sem data final");
    expect(periodoDaSancao({ data_inicio: null, data_fim: null })).toBe("desde data não informada, sem data final");
  });
  it("contagem de notas com concordância", () => {
    expect(frasesNotas(1, 1, "em 2026")).toBe(
      "A única nota paga a essa empresa em 2026 tem data dentro desse período.",
    );
    expect(frasesNotas(0, 1, "em 2026")).toBe(
      "A única nota paga a essa empresa em 2026 não tem data dentro desse período.",
    );
    expect(frasesNotas(0, 9, "no mandato")).toBe(
      "Nenhuma das 9 notas pagas a essa empresa no mandato tem data dentro desse período.",
    );
    expect(frasesNotas(1, 9, "no mandato")).toBe(
      "1 das 9 notas pagas a essa empresa no mandato tem data dentro desse período.",
    );
    expect(frasesNotas(4, 9, "no mandato")).toBe(
      "4 das 9 notas pagas a essa empresa no mandato têm data dentro desse período.",
    );
  });
});

describe("C06, C17: formatos da seção", () => {
  it("milhões com uma casa; abaixo de 1 milhão, formato compacto", () => {
    expect(brlMi(74_200_000)).toMatch(/^R\$\s74,2 mi$/);
    expect(brlMi(110_580_000)).toMatch(/^R\$\s110,6 mi$/);
    expect(brlMi(7_000_000)).toMatch(/^R\$\s7 mi$/);
    expect(brlMi(399_000)).toMatch(/^R\$\s399 mil$/);
  });
  it("lê a data da base guardada na coleta", () => {
    expect(baseDaColeta("base de 10/11/2026")).toBe("10/11/2026");
    expect(baseDaColeta("seed · base de 09/11/2026")).toBe("09/11/2026");
    expect(baseDaColeta("seed")).toBeNull();
    expect(baseDaColeta(null)).toBeNull();
  });
  it("data local em DD/MM/AAAA", () => {
    expect(dataLocalBr(new Date(2026, 10, 10, 14, 2))).toBe("10/11/2026");
    expect(dataLocalBr(new Date(2026, 0, 5))).toBe("05/01/2026");
  });
});
