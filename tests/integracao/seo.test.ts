import { sql } from "kysely";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createDb } from "@/db/client";
import { migrateToLatest } from "@/db/migrate";
import { SEED, semear } from "@/db/seed";

/** Leitura para SEO e agentes contra o banco de teste. Pula se o Postgres não estiver no ar. */
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

describe("dados de SEO (Postgres)", () => {
  it("índice traz todos os perfis, em exercício primeiro", async (ctx) => {
    if (!disponivel) ctx.skip();
    const { indiceDeParlamentares } = await import("@/data/seo");
    const lista = await indiceDeParlamentares();
    const total = await db
      .selectFrom("parlamentar")
      .select(sql<string>`count(*)`.as("n"))
      .executeTakeFirstOrThrow();
    expect(lista).toHaveLength(Number(total.n));
    const primeiroFora = lista.findIndex((p) => !p.em_exercicio);
    expect(lista.slice(primeiroFora).every((p) => !p.em_exercicio)).toBe(true);
    expect(lista.map((p) => p.id)).toContain(SEED.foraDeExercicio);
    // R2: o índice não carrega data de nascimento nem nome civil.
    expect(Object.keys(lista[0]).sort()).toEqual(
      ["casa", "em_exercicio", "id", "nome", "sexo", "sigla_partido", "sigla_uf"].sort(),
    );
  });

  it("resumo leve: total e documentos da cota no ano mais recente", async (ctx) => {
    if (!disponivel) ctx.skip();
    const { resumoDoParlamentar } = await import("@/data/seo");
    const r = (await resumoDoParlamentar(SEED.deputada))!;
    expect(r.cota).toEqual({ ano: 2026, total: 44100, documentos: 3 });
    expect(r).not.toHaveProperty("data_nascimento");
    expect(r).not.toHaveProperty("nome_civil");
    expect((await resumoDoParlamentar(SEED.senadoraSemRegistro))!.cota).toBeNull();
    expect(await resumoDoParlamentar(1)).toBeNull();
  });

  it("última coleta por Casa conta as fontes comuns", async (ctx) => {
    if (!disponivel) ctx.skip();
    const { ultimaColetaPorCasa } = await import("@/data/seo");
    await db
      .updateTable("coleta")
      .set({ coletado_em: new Date("2030-01-02T03:04:05Z") })
      .where("fonte", "=", "cgu_ceis")
      .execute();
    const c = await ultimaColetaPorCasa();
    expect(c.camara?.toISOString()).toBe("2030-01-02T03:04:05.000Z");
    expect(c.senado?.toISOString()).toBe("2030-01-02T03:04:05.000Z");
    expect(c.geral?.toISOString()).toBe("2030-01-02T03:04:05.000Z");
    await semear(db);
  });
});

describe("perfil em Markdown (Postgres)", () => {
  it("mesmos números do perfil e pessoa física sem nome, mesmo se a fonte trouxer o nome", async (ctx) => {
    if (!disponivel) ctx.skip();
    // L-006: o seed já guarda o rótulo genérico; aqui a linha PF recebe um nome real para provar que o
    // Markdown não depende da coleta para esconder o nome.
    await db
      .updateTable("despesa_ceap")
      .set({ fornecedor_nome: "JOSE DA SILVA PRESTADOR" })
      .where("parlamentar_id", "=", SEED.deputada)
      .where("fornecedor_classe", "=", "terceiro_pf")
      .execute();
    await db
      .updateTable("emenda_favorecido")
      .set({ favorecido_nome: "ANA BENEFICIARIA SOUZA" })
      .where("tipo_favorecido", "=", "Pessoa Fisica")
      .execute();
    const { perfilParlamentar } = await import("@/data/perfil");
    const { emendasDoParlamentar } = await import("@/data/emendas");
    const { markdownDoPerfil } = await import("@/lib/markdown-perfil");
    const perfil = (await perfilParlamentar(SEED.deputada))!;
    const md = markdownDoPerfil(perfil, await emendasDoParlamentar(SEED.deputada, undefined), "https://a.br").replace(
      / /g,
      " ",
    );
    expect(md.startsWith("# Maria Exemplo (PFX-SP), deputada federal\n")).toBe(true);
    expect(md).toContain("- Total: R$ 44.100 em 3 documentos");
    expect(md).toContain("| Gráfica Exemplo Ltda | 12.345.678/0001-90 | 1 | R$ 30.000 |");
    expect(md).toContain("| Prestadores pessoa física (somados) | não exibido | 1 | R$ 9.600 |");
    expect(md).not.toContain("JOSE DA SILVA");
    expect(md).not.toContain("ANA BENEFICIARIA");
    expect(md).not.toContain("1975-04-10");
    expect(md).not.toContain("MARIA EXEMPLO DA SILVA");
    expect(md).toContain("https://a.br/parlamentares/900000001/gastos.csv?ano=2026");
    expect(md).toContain("https://a.br/llms.txt");
    expect(md).toContain("Licença deste resumo e dos CSVs: CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/)");
    expect(md).toContain("https://a.br/sobre#licenca");
    await semear(db);
  });

  it("senador sem registro: estados vazios, sem quebrar", async (ctx) => {
    if (!disponivel) ctx.skip();
    const { perfilParlamentar } = await import("@/data/perfil");
    const { emendasDoParlamentar } = await import("@/data/emendas");
    const { markdownDoPerfil } = await import("@/lib/markdown-perfil");
    const perfil = (await perfilParlamentar(SEED.senadoraSemRegistro))!;
    const md = markdownDoPerfil(
      perfil,
      await emendasDoParlamentar(SEED.senadoraSemRegistro, undefined),
      "https://a.br",
    );
    expect(md).toContain("Sem notas publicadas no período.");
    expect(md).toContain("## Votações nominais no Plenário em 2026");
    expect(md).toContain("| Sem registro |");
    expect(md).toContain("Sem emendas coletadas.");
    expect(md).toContain("Sem declaração de bens encontrada.");
    expect(md).toContain("https://www25.senado.leg.br/web/senadores/senador/-/perfil/9004");
    expect(md).toContain("- Casa: Senado Federal");
  });
});
