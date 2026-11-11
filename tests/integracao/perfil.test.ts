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
  await db.destroy();
  const { getDb } = await import("@/db/client");
  await getDb().destroy();
});

describe("perfilParlamentar (Postgres)", () => {
  it("agrega gastos, presença, alinhamento e bens", async (ctx) => {
    if (!disponivel) ctx.skip();
    const { perfilParlamentar } = await import("@/data/perfil");
    const p = (await perfilParlamentar(SEED.deputada))!;
    expect(p.ano).toBe(2026);
    expect(p.ceap.totalAno).toBe(44100);
    expect(p.ceap.porTipo[0].tipo).toMatch(/DIVULGAÇÃO/);
    expect(p.ceap.fornecedores.find((f) => f.fornecedor_classe === "terceiro_pf")?.fornecedor_doc).toBe(
      "***.456.789-**",
    );
    expect(p.votacoes.totalPlenario).toBe(3);
    expect(p.votacoes.presentes).toBe(2);
    expect(p.votacoes.alinhamento).toEqual({ comparaveis: 2, iguais: 1, divergencias: 1 });
    expect(p.votacoes.lista[0]).toMatchObject({ id: "seed-3", voto: null, orientacao: "Sim" });
    expect(new Set(p.bens.map((b) => b.ano_eleicao))).toEqual(new Set([2022, 2026]));
    expect(p.coletas.camara_ceap?.url).toContain("camara.leg.br");
  });

  it("busca ignora acento e caixa", async (ctx) => {
    if (!disponivel) ctx.skip();
    const { buscarParlamentares } = await import("@/data/perfil");
    expect((await buscarParlamentares({ q: "joao" })).map((r) => r.id)).toEqual([SEED.deputado]);
    expect((await buscarParlamentares({ q: "%" })).length).toBe(0);
  });

  it("perfil inexistente devolve null", async (ctx) => {
    if (!disponivel) ctx.skip();
    const { perfilParlamentar } = await import("@/data/perfil");
    expect(await perfilParlamentar(1)).toBeNull();
  });
});
