import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createDb } from "@/db/client";
import { migrateToLatest } from "@/db/migrate";
import { SEED, semear } from "@/db/seed";

/**
 * Integração contra o banco de teste (docker compose). Pula se ele não estiver no ar.
 * TEST_DATABASE_URL padrão: auditaja_test na porta 5436.
 */
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
  // Devolve o banco ao seed puro para a suíte e2e.
  if (disponivel) await semear(db);
  await db.destroy();
  const { getDb } = await import("@/db/client");
  await getDb().destroy();
});

describe("perfilParlamentar (Postgres)", () => {
  it("CEAP-01/02: total líquido do ano e tipos em ordem decrescente", async (ctx) => {
    if (!disponivel) ctx.skip();
    const { perfilParlamentar } = await import("@/data/perfil");
    const p = (await perfilParlamentar(SEED.deputada))!;
    expect(p.ano).toBe(2026);
    expect(p.ceap.totalAno).toBe(44100);
    expect(p.ceap.porTipo.map((t) => t.total)).toEqual([30000, 9600, 4500]);
    expect(p.ceap.porTipo[0].tipo).toBe("DIVULGAÇÃO DA ATIVIDADE PARLAMENTAR.");
  });

  it("CEAP-04: ano sem despesas cai no ano mais recente", async (ctx) => {
    if (!disponivel) ctx.skip();
    const { perfilParlamentar } = await import("@/data/perfil");
    const p = (await perfilParlamentar(SEED.deputada, 2019))!;
    expect(p.ano).toBe(2026);
    expect(p.anosDisponiveis).toEqual([2026]);
  });

  it("CEAP-05: sem teto verificado para a UF, não há comparação", async (ctx) => {
    if (!disponivel) ctx.skip();
    const { perfilParlamentar } = await import("@/data/perfil");
    const p = (await perfilParlamentar(SEED.deputada))!;
    expect(p.ceap.teto).toBeNull();
    expect(p.ceap.tetoAcumulado).toBeNull();
  });

  it("CEAP-03: no máximo 8 fornecedores, ordenados pelo total", async (ctx) => {
    if (!disponivel) ctx.skip();
    const coleta = (await db.selectFrom("coleta").select("id").executeTakeFirstOrThrow()).id;
    await db
      .insertInto("despesa_ceap")
      .values(
        Array.from({ length: 9 }, (_, i) => ({
          parlamentar_id: SEED.deputado,
          ano: 2026,
          mes: 1,
          tipo_despesa: "TELEFONIA",
          fornecedor_nome: `Fornecedor ${i + 1}`,
          fornecedor_doc: `11.111.111/0001-${String(i + 10)}`,
          fornecedor_classe: "pessoa_juridica" as const,
          data_emissao: "2026-01-05",
          valor_documento: (i + 1) * 100,
          valor_glosa: 0,
          valor_liquido: (i + 1) * 100,
          valor_restituicao: 0,
          url_documento: null,
          ide_documento: `f${i}`,
          coleta_id: coleta,
        })),
      )
      .execute();
    const { perfilParlamentar } = await import("@/data/perfil");
    const p = (await perfilParlamentar(SEED.deputado))!;
    expect(p.ceap.fornecedores).toHaveLength(8);
    expect(p.ceap.fornecedores[0]).toMatchObject({ fornecedor_nome: "Fornecedor 9", total: 900 });
    expect(p.ceap.fornecedores.at(-1)).toMatchObject({ fornecedor_nome: "Fornecedor 2", total: 200 });
    await db.deleteFrom("despesa_ceap").where("parlamentar_id", "=", SEED.deputado).execute();
  });

  it("VOTO-01/03: presença 2 de 3 e alinhamento 1 de 2; sem voto vira null", async (ctx) => {
    if (!disponivel) ctx.skip();
    const { perfilParlamentar } = await import("@/data/perfil");
    const p = (await perfilParlamentar(SEED.deputada))!;
    expect(p.votacoes.totalPlenario).toBe(3);
    expect(p.votacoes.presentes).toBe(2);
    expect(p.votacoes.alinhamento).toEqual({ comparaveis: 2, iguais: 1, divergencias: 1 });
    expect(p.votacoes.lista[0]).toMatchObject({ id: "seed-3", voto: null, orientacao: "Sim" });
  });

  it("BENS-01: total por eleição casada", async (ctx) => {
    if (!disponivel) ctx.skip();
    const { perfilParlamentar } = await import("@/data/perfil");
    const p = (await perfilParlamentar(SEED.deputada))!;
    const total = (ano: number) => p.bens.filter((b) => b.ano_eleicao === ano).reduce((s, b) => s + Number(b.total), 0);
    expect(total(2022)).toBe(890000);
    expect(total(2026)).toBe(1050000);
  });

  it("PROV-02: coletas recentes por fonte para as notas de fonte", async (ctx) => {
    if (!disponivel) ctx.skip();
    const { perfilParlamentar } = await import("@/data/perfil");
    const p = (await perfilParlamentar(SEED.deputada))!;
    expect(Object.keys(p.coletas).sort()).toEqual([
      "camara_api_deputados",
      "camara_ceap",
      "camara_lote_votos",
      "tse_bem_candidato",
    ]);
  });

  it("EDGE-01: perfil inexistente devolve null", async (ctx) => {
    if (!disponivel) ctx.skip();
    const { perfilParlamentar } = await import("@/data/perfil");
    expect(await perfilParlamentar(1)).toBeNull();
  });
});

describe("buscarParlamentares (Postgres)", () => {
  it("BUSCA-01: ignora acento e caixa e busca também pelo nome civil", async (ctx) => {
    if (!disponivel) ctx.skip();
    const { buscarParlamentares } = await import("@/data/perfil");
    expect((await buscarParlamentares({ q: "joao" })).map((r) => r.id)).toEqual([SEED.deputado]);
    expect((await buscarParlamentares({ q: "EXEMPLO DA SILVA" })).map((r) => r.id)).toEqual([SEED.deputada]);
  });

  it("BUSCA-01: só deputados em exercício", async (ctx) => {
    if (!disponivel) ctx.skip();
    const { buscarParlamentares } = await import("@/data/perfil");
    expect(await buscarParlamentares({ q: "joana" })).toEqual([]);
    expect((await buscarParlamentares({ q: "joana", todos: true })).map((r) => r.id)).toEqual([SEED.foraDeExercicio]);
  });

  it("BUSCA-02: % e _ são literais", async (ctx) => {
    if (!disponivel) ctx.skip();
    const { buscarParlamentares } = await import("@/data/perfil");
    expect(await buscarParlamentares({ q: "%" })).toEqual([]);
    expect(await buscarParlamentares({ q: "_" })).toEqual([]);
  });
});

describe("enviarPedido (Server Action)", () => {
  const form = (descricao: string, secao = "gastos") => {
    const f = new FormData();
    f.set("parlamentarId", String(SEED.deputada));
    f.set("secao", secao);
    f.set("descricao", descricao);
    return f;
  };

  it("CORR-02: descrição curta não grava e devolve a mensagem", async (ctx) => {
    if (!disponivel) ctx.skip();
    const { enviarPedido } = await import("@/app/parlamentares/[id]/contestar/actions");
    const antes = await db.selectFrom("pedido_correcao").selectAll().execute();
    expect(await enviarPedido({}, form("curto demais"))).toEqual({
      erro: "Descreva o erro com pelo menos 20 caracteres.",
    });
    expect(await db.selectFrom("pedido_correcao").selectAll().execute()).toHaveLength(antes.length);
  });

  it("CORR-01: descrição válida grava com status recebido e redireciona", async (ctx) => {
    if (!disponivel) ctx.skip();
    const { enviarPedido } = await import("@/app/parlamentares/[id]/contestar/actions");
    const texto = "O valor de janeiro está duplicado segundo a nota original.";
    await expect(enviarPedido({}, form(texto))).rejects.toMatchObject({
      digest: expect.stringContaining(`/parlamentares/${SEED.deputada}/contestar?enviado=1`),
    });
    const row = await db
      .selectFrom("pedido_correcao")
      .selectAll()
      .where("descricao", "=", texto)
      .executeTakeFirstOrThrow();
    expect(row).toMatchObject({ parlamentar_id: SEED.deputada, secao: "gastos", status: "recebido" });
  });

  it("CORR-01: descrição acima de 4000 caracteres é recusada", async (ctx) => {
    if (!disponivel) ctx.skip();
    const { enviarPedido } = await import("@/app/parlamentares/[id]/contestar/actions");
    const r = await enviarPedido({}, form("x".repeat(4001)));
    expect(r.erro).toBeTruthy();
  });
});
