import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createDb } from "@/db/client";
import { migrateToLatest } from "@/db/migrate";
import { SEED, semear } from "@/db/seed";

/** EMDUI-03..11, SAN-05 e EDGE-04 na camada de leitura, sobre o seed fictício. */
const URL_TESTE = process.env.TEST_DATABASE_URL ?? "postgres://auditaja:auditaja@127.0.0.1:5436/auditaja_test";
process.env.DATABASE_URL = URL_TESTE;

const db = createDb(URL_TESTE);
let disponivel = true;

beforeAll(async () => {
  try {
    await migrateToLatest(db);
    await semear(db);
  } catch {
    disponivel = false;
  }
});
afterAll(async () => {
  if (disponivel) await semear(db);
  await db.destroy();
  const { getDb } = await import("@/db/client");
  await getDb().destroy();
});

const carregar = async () => (await import("@/data/emendas")).emendasDoParlamentar;

describe("emendasDoParlamentar", () => {
  it("EMDUI-03, EMDUI-05..07: mandato soma todas as emendas, conta códigos distintos e separa as especiais", async (ctx) => {
    if (!disponivel) ctx.skip();
    const r = await (await carregar())(SEED.deputada);
    if (r.vazio) throw new Error("seed sem emendas");
    expect(r.periodo).toBe("mandato");
    expect(r.anos).toEqual([2026, 2025, 2024]);
    expect(r.totais).toEqual({
      empenhado: 11_100_000,
      pago: 7_000_000,
      especiais: 2_000_000,
      emendas: 9,
      multiplo: 1_000_000,
    });
  });

  it("EMDUI-08: série por ano com empenhado e pago (pago + restos pagos)", async (ctx) => {
    if (!disponivel) ctx.skip();
    const r = await (await carregar())(SEED.deputada);
    if (r.vazio) throw new Error("seed sem emendas");
    expect(r.porAno).toEqual([
      { ano: 2024, empenhado: 1_100_000, pago: 1_000_000 },
      { ano: 2025, empenhado: 4_000_000, pago: 3_000_000 },
      { ano: 2026, empenhado: 6_000_000, pago: 3_000_000 },
    ]);
  });

  it("EMDUI-09, EMDUI-10: cinco áreas e cinco locais de maior empenhado (sem MÚLTIPLO), com rótulo formatado", async (ctx) => {
    if (!disponivel) ctx.skip();
    const r = await (await carregar())(SEED.deputada);
    if (r.vazio) throw new Error("seed sem emendas");
    expect(r.areas).toEqual([
      { nome: "Saúde", valor: 6_000_000 },
      { nome: "Encargos especiais", valor: 2_000_000 },
      { nome: "Urbanismo", valor: 1_200_000 },
      { nome: "Educação", valor: 800_000 },
      { nome: "Agricultura", valor: 600_000 },
    ]);
    expect(r.locais).toEqual([
      { nome: "Campinas (SP)", valor: 3_000_000 },
      { nome: "São Paulo (UF)", valor: 2_000_000 },
      { nome: "Sorocaba (SP)", valor: 1_500_000 },
      { nome: "Ribeirão Preto (SP)", valor: 1_200_000 },
      { nome: "Jundiaí (SP)", valor: 800_000 },
    ]);
  });

  it("EMDUI-11: cinco favorecidos de maior valor, somando meses, com natureza jurídica e município", async (ctx) => {
    if (!disponivel) ctx.skip();
    const r = await (await carregar())(SEED.deputada);
    if (r.vazio) throw new Error("seed sem emendas");
    expect(r.favorecidos).toEqual([
      {
        nome: "Município de São Paulo",
        doc: "22.222.222/0001-22",
        tipo: "Município",
        municipio: "São Paulo (SP)",
        valor: 2_000_000,
      },
      {
        nome: "Santa Casa Exemplo",
        doc: "33.333.333/0001-33",
        tipo: "Associação Privada",
        municipio: "Sorocaba (SP)",
        valor: 1_200_000,
      },
      {
        nome: "Construtora Ilustrativa Ltda",
        doc: "44.444.444/0001-44",
        tipo: "Sociedade Empresária Limitada",
        municipio: "Ribeirão Preto (SP)",
        valor: 1_000_000,
      },
      {
        nome: "Fundo Municipal de Saúde de Campinas",
        doc: "11.111.111/0001-11",
        tipo: "Fundo Público da Administração Direta Municipal",
        municipio: "Campinas (SP)",
        valor: 1_000_000,
      },
      {
        nome: "Município de Jundiaí",
        doc: "55.555.555/0001-55",
        tipo: "Município",
        municipio: "Jundiaí (SP)",
        valor: 800_000,
      },
    ]);
  });

  it("EMDUI-04: um ano soma só as emendas daquele ano do orçamento", async (ctx) => {
    if (!disponivel) ctx.skip();
    const r = await (await carregar())(SEED.deputada, "2025");
    if (r.vazio) throw new Error("seed sem emendas");
    expect(r.periodo).toBe(2025);
    expect(r.totais).toEqual({ empenhado: 4_000_000, pago: 3_000_000, especiais: 0, emendas: 3, multiplo: 0 });
    expect(r.favorecidos.map((f) => f.nome)).toEqual([
      "Santa Casa Exemplo",
      "Construtora Ilustrativa Ltda",
      "Município de Jundiaí",
    ]);
  });

  it("PF aparece com rótulo genérico e tipo legível", async (ctx) => {
    if (!disponivel) ctx.skip();
    const r = await (await carregar())(SEED.deputada, "2024");
    if (r.vazio) throw new Error("seed sem emendas");
    expect(r.favorecidos[0]).toEqual({
      nome: "Beneficiário pessoa física",
      doc: "***.456.789-**",
      tipo: "Pessoa física",
      municipio: "Santos (SP)",
      valor: 18_000,
    });
  });

  it("EMDUI-14: ano sem emenda cai no mandato", async (ctx) => {
    if (!disponivel) ctx.skip();
    const r = await (await carregar())(SEED.deputada, "2019");
    expect(r.periodo).toBe("mandato");
  });

  it("EMDUI-13: deputado sem emendas devolve vazio com a coleta", async (ctx) => {
    if (!disponivel) ctx.skip();
    const r = await (await carregar())(SEED.deputado);
    expect(r.vazio).toBe(true);
    expect(r.anos).toEqual([]);
    expect(r.coleta?.url).toContain("EmendasParlamentares.zip");
  });
});

describe("sancoesDosFornecedores", () => {
  const ceap = ["12.345.678/0001-90", "55.666.777/0001-88", "***.456.789-**"];

  it("SAN-05: conta notas do período exibido com data dentro da sanção; fim nulo é sem prazo", async (ctx) => {
    if (!disponivel) ctx.skip();
    const { sancoesDosFornecedores } = await import("@/data/emendas");
    const r = await sancoesDosFornecedores(SEED.deputada, ceap, [2026]);
    expect(r.map((s) => [s.cadastro, s.cnpj, s.data_inicio, s.data_fim, s.notas])).toEqual([
      // Gráfica: nota de 10/01/2026, sanção desde 01/05/2026 → 0.
      ["CNEP", "12345678000190", "2026-05-01", null, 0],
      // Posto: nota de 10/02/2026, sanção de 01/02/2026 a 01/02/2027 → 1.
      ["CEIS", "55666777000188", "2026-02-01", "2027-02-01", 1],
    ]);
    expect(r[1]).toMatchObject({
      nome: "POSTO ILUSTRATIVO LTDA",
      categoria: "Impedimento/proibição de contratar com prazo determinado",
      orgao: "Ministério Exemplo",
      base: "10/11/2026",
    });
  });

  it("SAN-05: limites inclusive e fim nulo sem prazo", async (ctx) => {
    if (!disponivel) ctx.skip();
    const { sancoesDosFornecedores } = await import("@/data/emendas");
    const { coleta_id } = await db
      .selectFrom("sancao")
      .select("coleta_id")
      .where("codigo", "=", "seed-ceis-1")
      .executeTakeFirstOrThrow();
    const doc = "77.888.999/0001-00";
    const nota = (data: string, i: number) => ({
      parlamentar_id: SEED.deputada,
      ano: 2026,
      mes: Number(data.slice(5, 7)),
      tipo_despesa: "TESTE",
      fornecedor_nome: "Limite Ltda",
      fornecedor_doc: doc,
      fornecedor_classe: "pessoa_juridica" as const,
      data_emissao: data,
      valor_documento: 1,
      valor_glosa: 0,
      valor_liquido: 1,
      valor_restituicao: 0,
      url_documento: null,
      ide_documento: `limite-${i}`,
      coleta_id,
    });
    await db
      .insertInto("despesa_ceap")
      .values(["2026-03-09", "2026-03-10", "2026-06-20", "2026-06-21", "2026-12-31"].map(nota))
      .execute();
    const sancao = (codigo: string, cadastro: "CEIS" | "CNEP", inicio: string, fim: string | null) => ({
      cadastro,
      codigo,
      cnpj: "77888999000100",
      nome: "LIMITE LTDA",
      categoria: "Teste",
      data_inicio: inicio,
      data_fim: fim,
      orgao: "Órgão",
      coleta_id,
    });
    await db
      .insertInto("sancao")
      .values([sancao("lim-1", "CEIS", "2026-03-10", "2026-06-20"), sancao("lim-2", "CNEP", "2026-06-21", null)])
      .execute();
    try {
      const r = await sancoesDosFornecedores(SEED.deputada, [doc], [2026]);
      // CEIS: 10/03 e 20/06 (limites) dentro; 09/03 e 21/06 fora. CNEP sem fim: 21/06 e 31/12.
      expect(r.map((s) => [s.cadastro, s.notas])).toEqual([
        ["CEIS", 2],
        ["CNEP", 2],
      ]);
    } finally {
      await db.deleteFrom("sancao").where("codigo", "in", ["lim-1", "lim-2"]).execute();
      await db.deleteFrom("despesa_ceap").where("fornecedor_doc", "=", doc).execute();
    }
  });

  it("SAN-05: período da cota sem notas no intervalo dá zero", async (ctx) => {
    if (!disponivel) ctx.skip();
    const { sancoesDosFornecedores } = await import("@/data/emendas");
    const r = await sancoesDosFornecedores(SEED.deputada, ceap, [2025]);
    expect(r.map((s) => s.notas)).toEqual([0, 0]);
  });

  it("ignora CPF mascarado e lista vazia", async (ctx) => {
    if (!disponivel) ctx.skip();
    const { sancoesDosFornecedores } = await import("@/data/emendas");
    expect(await sancoesDosFornecedores(SEED.deputada, ["***.456.789-**"], [2026])).toEqual([]);
  });
});
