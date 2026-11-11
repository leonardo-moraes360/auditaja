import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createDb } from "@/db/client";
import { migrateToLatest } from "@/db/migrate";
import { SEED, semear } from "@/db/seed";

/** Perfil do senador fictício do seed (Otávio Modelo, MG) contra o banco de teste. */
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

const perfil = async (id = SEED.senador) => {
  const { perfilParlamentar } = await import("@/data/perfil");
  return (await perfilParlamentar(id))!;
};

describe("perfil do senador (Postgres)", () => {
  it("SCEAPS-05: total do ano e média mensal pelos meses com notas", async (ctx) => {
    if (!disponivel) ctx.skip();
    const p = await perfil();
    expect(p.parlamentar.casa).toBe("senado");
    expect(p.ano).toBe(2026);
    expect(p.ceap.totalAno).toBe(15000);
    expect(p.ceap.mediaMensal).toBe(5000);
  });

  it("SCEAPS-06: sem teto para senador", async (ctx) => {
    if (!disponivel) ctx.skip();
    const p = await perfil();
    expect(p.ceap.teto).toBeNull();
    expect(p.ceap.tetoAcumulado).toBeNull();
  });

  it("SVOT-05: lista as votações do PLEN-SF do ano, mais recentes primeiro", async (ctx) => {
    if (!disponivel) ctx.skip();
    const p = await perfil();
    expect(p.votacoes.ano).toBe(2026);
    expect(p.votacoes.lista.map((v) => v.id)).toEqual([
      "SF-seed-5",
      "SF-seed-4",
      "SF-seed-3",
      "SF-seed-2",
      "SF-seed-1",
    ]);
    const secreta = p.votacoes.lista.find((v) => v.id === "SF-seed-3")!;
    expect(secreta).toMatchObject({ secreta: true, voto: "Votou", orientacao: null });
  });

  it("SPRES-03: presença = presentes ÷ (registros − licenças)", async (ctx) => {
    if (!disponivel) ctx.skip();
    const p = await perfil();
    expect(p.votacoes.presentes).toBe(3);
    expect(p.votacoes.denominadorPresenca).toBe(4);
  });

  it("SPRES-04: média do Senado = média simples dos senadores em exercício", async (ctx) => {
    if (!disponivel) ctx.skip();
    // Otávio 3/4 = 75%; Lúcia 5/5 = 100%.
    expect((await perfil()).votacoes.mediaPresenca).toBe(88);
  });

  it("SALI-01/02/03: só a liderança do partido conta; Governo e Liberado ficam fora", async (ctx) => {
    if (!disponivel) ctx.skip();
    const p = await perfil();
    expect(p.votacoes.alinhamento).toEqual({ comparaveis: 2, iguais: 1, divergencias: 1 });
    expect(p.votacoes.lista.find((v) => v.id === "SF-seed-2")!.orientacao).toBe("Sim");
    expect(p.votacoes.lista.find((v) => v.id === "SF-seed-4")!.orientacao).toBe("Liberado");
    expect(p.votacoes.lista.find((v) => v.id === "SF-seed-5")!.orientacao).toBeNull();
  });

  it("SUI-04: mandato, participação, bloco e suplentes", async (ctx) => {
    if (!disponivel) ctx.skip();
    const p = await perfil();
    expect(p.parlamentar).toMatchObject({
      mandato_inicio: "2023-02-01",
      mandato_fim: "2031-01-31",
      participacao: "Titular",
      bloco: "Bloco Parlamentar Exemplo",
    });
    expect(p.suplentes).toEqual([
      { ordem: 1, nome: "Beatriz Suplente Fictícia" },
      { ordem: 2, nome: "Carlos Suplente Fictício" },
    ]);
  });

  it("SUI-05: fontes do Senado e do TSE, sem as da Câmara", async (ctx) => {
    if (!disponivel) ctx.skip();
    expect(Object.keys((await perfil()).coletas).sort()).toEqual([
      "senado_api_senadores",
      "senado_ceaps",
      "senado_orientacoes",
      "senado_votacoes",
      "tse_bem_candidato",
    ]);
  });

  it("SBENS-02: bens do TSE do senador", async (ctx) => {
    if (!disponivel) ctx.skip();
    const p = await perfil();
    expect(p.bens.map((b) => [b.ano_eleicao, b.cargo, Number(b.total)])).toEqual([
      [2022, "SENADOR", 1900000],
      [2022, "SENADOR", 780000],
    ]);
  });

  it("SERR-03: senador sem votações no ano", async (ctx) => {
    if (!disponivel) ctx.skip();
    await db.deleteFrom("voto").where("parlamentar_id", "=", SEED.senadora).execute();
    const p = await perfil(SEED.senadora);
    expect(p.votacoes.denominadorPresenca).toBe(0);
    expect(p.votacoes.presentes).toBe(0);
    await semear(db);
  });

  it("SERR-04: senador sem notas da CEAPS", async (ctx) => {
    if (!disponivel) ctx.skip();
    const p = await perfil(SEED.senadora);
    expect(p.ceap.totalAno).toBe(0);
    expect(p.ceap.mediaMensal).toBeNull();
    expect(p.ceap.porTipo).toEqual([]);
  });
});

describe("busca por Casa (Postgres)", () => {
  it("SUI-06: casa=senado só devolve senadores; casa=camara só deputados", async (ctx) => {
    if (!disponivel) ctx.skip();
    const { buscarParlamentares } = await import("@/data/perfil");
    expect((await buscarParlamentares({ casa: "senado" })).map((r) => r.id)).toEqual([SEED.senadora, SEED.senador]);
    const camara = await buscarParlamentares({ casa: "camara" });
    expect(camara.length).toBeGreaterThan(0);
    expect(camara.every((r) => r.casa === "camara")).toBe(true);
    const todos = await buscarParlamentares({});
    expect(todos.map((r) => r.casa)).toContain("senado");
    expect(todos.map((r) => r.casa)).toContain("camara");
  });

  it("SUI-06: contagem de parlamentares em exercício por Casa", async (ctx) => {
    if (!disponivel) ctx.skip();
    const { contarPorCasa } = await import("@/data/perfil");
    expect(await contarPorCasa()).toEqual({ camara: 2, senado: 2 });
  });

  it("SUI-09: valor desconhecido em ?casa= vira Todos", async () => {
    const { casaDoFiltro } = await import("@/data/perfil");
    expect(casaDoFiltro("senado")).toBe("senado");
    expect(casaDoFiltro("camara")).toBe("camara");
    expect(casaDoFiltro("stf")).toBeNull();
    expect(casaDoFiltro(["senado"])).toBeNull();
    expect(casaDoFiltro(undefined)).toBeNull();
  });

  it("busca por nome e UF também acha senadores", async (ctx) => {
    if (!disponivel) ctx.skip();
    const { buscarParlamentares } = await import("@/data/perfil");
    expect((await buscarParlamentares({ q: "otavio" })).map((r) => r.id)).toEqual([SEED.senador]);
    expect((await buscarParlamentares({ q: "MG" })).map((r) => r.id)).toEqual([SEED.senador]);
  });
});
