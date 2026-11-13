import { describe, expect, it } from "vitest";
import {
  aberturaConsiderada,
  cicloFechado,
  cnpjValido,
  dataDoAnoMes,
  eleicaoDoMandato,
  DIAS_RECEM_ABERTA,
  ehEntePublico,
  nomeLegivel,
  recebedorPublicavel,
  recemAberta,
  taxaDeBase,
} from "@/lib/trilha";

/** Soma dias a uma data ISO, em UTC. */
function mais(iso: string, dias: number): string {
  return new Date(Date.parse(`${iso}T00:00:00Z`) + dias * 86_400_000).toISOString().slice(0, 10);
}

describe("recemAberta (CNPJ-03, CNPJ-04, D4 = 180 dias)", () => {
  it("D4 é 180 dias", () => {
    expect(DIAS_RECEM_ABERTA).toBe(180);
  });
  it("179 dias antes do primeiro pagamento marca o indício", () => {
    expect(recemAberta("2025-01-01", mais("2025-01-01", 179))).toEqual({ dias: 179, indicio: true });
  });
  it("180 dias antes não marca", () => {
    expect(recemAberta("2025-01-01", mais("2025-01-01", 180))).toEqual({ dias: 180, indicio: false });
  });
  it("aberta no mesmo dia do pagamento marca, com 0 dias", () => {
    expect(recemAberta("2025-03-25", "2025-03-25")).toEqual({ dias: 0, indicio: true });
  });
  it("LING-06: abertura depois do pagamento não é fato conhecido na data do pagamento e não marca", () => {
    expect(recemAberta("2025-03-26", "2025-03-25")).toEqual({ dias: -1, indicio: false });
  });
  it("atravessa o horário de verão sem perder um dia", () => {
    expect(recemAberta("2018-10-01", "2019-03-30").dias).toBe(180);
  });
});

describe("aberturaConsiderada (D12, EDGE-05)", () => {
  it("usa a data da matriz quando ela está no lote", () => {
    expect(aberturaConsiderada({ inicio: "1999-05-01" }, { inicio: "2025-02-12" })).toEqual({
      data: "1999-05-01",
      origem: "matriz",
    });
  });
  it("sem a matriz, usa a data do próprio estabelecimento e marca como filial", () => {
    expect(aberturaConsiderada(null, { inicio: "2025-02-12" })).toEqual({ data: "2025-02-12", origem: "filial" });
  });
  it("sem nenhum dos dois, não há data", () => {
    expect(aberturaConsiderada(null, null)).toEqual({ data: null, origem: null });
  });
});

describe("cicloFechado (CICLO-03, CICLO-04, LING-06)", () => {
  const P = 1;
  const OUTRO = 2;
  const receb = [
    { cnpj: "12345678000190", parlamentarId: P, data: "2024-04-10", valor: 50_000 },
    { cnpj: "12345678000190", parlamentarId: P, data: "2024-09-02", valor: 36_000 },
  ];
  it("CNPJ pago com a emenda e fornecedor da campanha do mesmo parlamentar fecha o ciclo com valores e datas", () => {
    const c = cicloFechado(receb, [
      { cnpj: "12345678000190", parlamentarId: P, data: "2022-09-15", valor: 20_000 },
      { cnpj: "12345678000190", parlamentarId: P, data: "2022-09-20", valor: 12_000 },
    ]);
    expect(c).toEqual([
      {
        cnpj: "12345678000190",
        recebido: 86_000,
        primeiroRecebimento: "2024-04-10",
        ultimoRecebimento: "2024-09-02",
        despesaCampanha: 32_000,
        primeiraDespesa: "2022-09-15",
        ultimaDespesa: "2022-09-20",
      },
    ]);
  });
  it("CICLO-04: CNPJ na campanha de outro parlamentar não fecha ciclo", () => {
    expect(
      cicloFechado(receb, [{ cnpj: "12345678000190", parlamentarId: OUTRO, data: "2022-09-15", valor: 1 }]),
    ).toEqual([]);
  });
  it("LING-06: despesa de campanha com data depois do pagamento não fecha ciclo", () => {
    const so = [{ cnpj: "12345678000190", parlamentarId: P, data: "2024-04-10", valor: 50_000 }];
    expect(cicloFechado(so, [{ cnpj: "12345678000190", parlamentarId: P, data: "2024-04-11", valor: 1 }])).toEqual([]);
  });
  it("LING-06: despesa no mesmo dia do pagamento conta", () => {
    const so = [{ cnpj: "12345678000190", parlamentarId: P, data: "2024-04-10", valor: 50_000 }];
    expect(cicloFechado(so, [{ cnpj: "12345678000190", parlamentarId: P, data: "2024-04-10", valor: 1 }])).toHaveLength(
      1,
    );
  });
  it("LING-06: só os pagamentos posteriores à despesa entram no valor recebido", () => {
    const c = cicloFechado(receb, [{ cnpj: "12345678000190", parlamentarId: P, data: "2024-05-01", valor: 7 }]);
    expect(c.map((x) => [x.recebido, x.primeiroRecebimento])).toEqual([[36_000, "2024-09-02"]]);
  });
  it("LING-06: no valor e nas datas da campanha só entram despesas até a data do pagamento", () => {
    const so = [{ cnpj: "12345678000190", parlamentarId: P, data: "2024-04-10", valor: 50_000 }];
    const c = cicloFechado(so, [
      { cnpj: "12345678000190", parlamentarId: P, data: "2022-09-15", valor: 20 },
      { cnpj: "12345678000190", parlamentarId: P, data: "2024-06-01", valor: 7 },
    ]);
    expect(c.map((x) => [x.despesaCampanha, x.primeiraDespesa, x.ultimaDespesa])).toEqual([
      [20, "2022-09-15", "2022-09-15"],
    ]);
  });
  it("despesa sem data não é avaliada", () => {
    expect(cicloFechado(receb, [{ cnpj: "12345678000190", parlamentarId: P, data: null, valor: 1 }])).toEqual([]);
  });
  it("CNPJ diferente não fecha ciclo", () => {
    expect(cicloFechado(receb, [{ cnpj: "99999999000199", parlamentarId: P, data: "2022-09-15", valor: 1 }])).toEqual(
      [],
    );
  });
});

describe("taxaDeBase (LING-07)", () => {
  it('38 de 4.120 vira "38 de 4.120 (0,9%)"', () => {
    expect(taxaDeBase(38, 4120)).toBe("38 de 4.120 (0,9%)");
  });
  it("27 de 410 com uma casa decimal", () => {
    expect(taxaDeBase(27, 410)).toBe("27 de 410 (6,6%)");
  });
  it("universo vazio não divide por zero", () => {
    expect(taxaDeBase(0, 0)).toBe("0 de 0");
  });
});

describe("cnpjValido e recebedorPublicavel (TRI-03, TRI-07, EDGE-02)", () => {
  it("aceita CNPJ com dígitos verificadores corretos", () => {
    expect(cnpjValido("19681377000181")).toBe(true);
    expect(cnpjValido("11.222.333/0001-81")).toBe(true);
  });
  it("recusa dígito verificador errado, tamanho errado e sequência repetida", () => {
    expect(cnpjValido("19681377000182")).toBe(false);
    expect(cnpjValido("1968137700018")).toBe(false);
    expect(cnpjValido("11111111111111")).toBe(false);
  });
  it("PJ com CNPJ válido guarda CNPJ de 14 dígitos e nome", () => {
    expect(recebedorPublicavel("CNPJ", "19.681.377/0001-81", " SAFRA EQUIPAMENTOS LTDA ")).toEqual({
      tipo: "pj",
      cnpj: "19681377000181",
      nome: "SAFRA EQUIPAMENTOS LTDA",
    });
  });
  it("CNPJ com dígito inválido é descartado", () => {
    expect(recebedorPublicavel("CNPJ", "19681377000182", "X LTDA")).toEqual({ tipo: "invalido" });
  });
  it("PF vira agregado sem nome nem documento", () => {
    expect(recebedorPublicavel("CPF", "***823135**", "LUCIANY APARECIDA ALVES SANTOS")).toEqual({ tipo: "pf" });
  });
  it("documento de 11 dígitos rotulado como CNPJ também é tratado como PF", () => {
    expect(recebedorPublicavel("CNPJ", "12345678901", "FULANO")).toEqual({ tipo: "pf" });
  });
  it("MEI: CPF solto na razão social sai mascarado", () => {
    expect(recebedorPublicavel("CNPJ", "19681377000181", "FULANO DE TAL 12345678901")).toEqual({
      tipo: "pj",
      cnpj: "19681377000181",
      nome: "FULANO DE TAL ***.***.***-**",
    });
  });
});

describe("ehEntePublico (EDGE-03)", () => {
  it("CNAE da divisão 84 (administração pública) é ente público", () => {
    expect(ehEntePublico("8411600")).toBe(true);
    expect(ehEntePublico("8412400")).toBe(true);
  });
  it("outros CNAE e ausência de CNAE não são", () => {
    expect(ehEntePublico("4120400")).toBe(false);
    expect(ehEntePublico(null)).toBe(false);
  });
});

describe("eleicaoDoMandato (D8)", () => {
  it("deputado da 57ª legislatura: eleição de 2022; 58ª: 2026", () => {
    expect(eleicaoDoMandato({ casa: "camara", id_legislatura: 57, mandato_inicio: null })).toBe(2022);
    expect(eleicaoDoMandato({ casa: "camara", id_legislatura: 58, mandato_inicio: null })).toBe(2026);
  });
  it("senador: ano anterior à posse", () => {
    expect(eleicaoDoMandato({ casa: "senado", id_legislatura: 57, mandato_inicio: "2019-02-01" })).toBe(2018);
    expect(eleicaoDoMandato({ casa: "senado", id_legislatura: 57, mandato_inicio: "2023-02-01" })).toBe(2022);
  });
  it("sem dado do mandato, sem eleição", () => {
    expect(eleicaoDoMandato({ casa: "camara", id_legislatura: null, mandato_inicio: null })).toBeNull();
    expect(eleicaoDoMandato({ casa: "senado", id_legislatura: 57, mandato_inicio: null })).toBeNull();
  });
});

describe("dataDoAnoMes", () => {
  it("ano/mês vira o primeiro dia do mês; formato inválido vira null", () => {
    expect(dataDoAnoMes("202603")).toBe("2026-03-01");
    expect(dataDoAnoMes("202613")).toBeNull();
    expect(dataDoAnoMes("")).toBeNull();
  });
});

describe("nomeLegivel (DENS-10)", () => {
  it("põe em caixa de título com acentos de palavras sem ambiguidade", () => {
    expect(nomeLegivel("MUNICIPIO DE SAO PAULO")).toBe("Município de São Paulo");
  });
  it('não troca "para" por "Pará" na razão social', () => {
    expect(nomeLegivel("SHARK MAQUINAS PARA CONSTRUCAO LTDA")).toBe("Shark Maquinas Para Construcao Ltda");
  });
  it("mantém siglas societárias", () => {
    expect(nomeLegivel("DISTRIBUIDORA MODELO S.A.")).toBe("Distribuidora Modelo S.A.");
  });
});
