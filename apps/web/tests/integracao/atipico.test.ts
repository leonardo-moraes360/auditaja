import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createDb } from "@auditaja/db/client";
import { migrateToLatest } from "@auditaja/db/migrate";
import { SEED, semear } from "@auditaja/db/seed";
import { ID_ATIPICO, limparAtipico, semearAtipico, TIPO_ACIMA, TIPO_SALTO } from "../fixtures/atipico";

const URL_TESTE = process.env.TEST_DATABASE_URL ?? "postgres://auditaja:auditaja@127.0.0.1:5436/auditaja_test";
process.env.DATABASE_URL = URL_TESTE;

const db = createDb(URL_TESTE);
let disponivel = true;

beforeAll(async () => {
  try {
    await migrateToLatest(db);
    await semear(db);
    await semearAtipico(db);
  } catch {
    disponivel = false;
  }
});
afterAll(async () => {
  if (disponivel) {
    await limparAtipico(db);
    await semear(db);
  }
  await db.destroy();
  const { getDb } = await import("@auditaja/db/client");
  await getDb().destroy();
});

describe("padrão atípico no perfil (Postgres)", () => {
  it("ATP-01/02: ano exibido traz os dois avisos com os números do cálculo", async (ctx) => {
    if (!disponivel) ctx.skip();
    const { perfilParlamentar } = await import("@/data/perfil");
    const p = (await perfilParlamentar(ID_ATIPICO))!;
    expect(p.ano).toBe(2025);
    const [r] = p.atipico;
    expect(r.ano).toBe(2025);
    expect(r.anoAnteriorDisponivel).toBe(true);
    expect(r.acima.map((a) => a.tipo)).toEqual([TIPO_ACIMA]);
    expect(r.acima[0].colegas).toBe(26);
    expect(r.acima[0].mediaMensal).toBe(5000);
    expect(r.salto.map((a) => a.tipo)).toEqual([TIPO_SALTO]);
    expect(r.salto[0].totalAnterior).toBe(3000);
    expect(r.salto[0].total).toBe(40000);
  });

  it("ATP-03: no mandato, um resultado por ano", async (ctx) => {
    if (!disponivel) ctx.skip();
    const { perfilParlamentar } = await import("@/data/perfil");
    const p = (await perfilParlamentar(ID_ATIPICO, "mandato"))!;
    expect(p.atipico.map((r) => r.ano)).toEqual([2025, 2024]);
    expect(p.atipico[1].anoAnteriorDisponivel).toBe(false);
    expect(p.atipico[1].salto).toEqual([]);
  });

  it("ATP-04: tipo com menos de 20 parlamentares não gera aviso", async (ctx) => {
    if (!disponivel) ctx.skip();
    const { perfilParlamentar } = await import("@/data/perfil");
    const p = (await perfilParlamentar(SEED.deputada))!;
    expect(p.ano).toBe(2026);
    expect(p.atipico[0].acima).toEqual([]);
    expect(p.atipico[0].salto).toEqual([]);
  });
});
