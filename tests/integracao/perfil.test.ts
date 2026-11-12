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

  it("CEAP-05: com teto conferido para a UF e o ano, compara com o teto acumulado", async (ctx) => {
    if (!disponivel) ctx.skip();
    const { perfilParlamentar } = await import("@/data/perfil");
    const p = (await perfilParlamentar(SEED.deputada))!;
    expect(p.ano).toBe(2026);
    expect(p.ceap.teto).toEqual({ mensal: 48727.46, verificado: true }); // SP
    expect(p.ceap.ultimoMes).toBe(3);
    expect(p.ceap.tetoAcumulado).toBeCloseTo(48727.46 * 3, 2);
  });

  it("CEAP-03: no máximo 5 fornecedores, ordenados pelo total", async (ctx) => {
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
    expect(p.ceap.fornecedores).toHaveLength(5);
    expect(p.ceap.fornecedores[0]).toMatchObject({ fornecedor_nome: "Fornecedor 9", total: 900 });
    expect(p.ceap.fornecedores.at(-1)).toMatchObject({ fornecedor_nome: "Fornecedor 5", total: 500 });
    await db.deleteFrom("despesa_ceap").where("parlamentar_id", "=", SEED.deputado).execute();
  });

  it("VOTO-08: orientação de bloco vale para partido fora da abreviação, pela composição da API", async (ctx) => {
    if (!disponivel) ctx.skip();
    const coleta = (await db.selectFrom("coleta").select("id").executeTakeFirstOrThrow()).id;
    await db
      .insertInto("bloco")
      .values({ id: 999001, nome: "PFZ, PFW, PFY", id_legislatura: 57, federacao: false, coleta_id: coleta })
      .execute();
    await db
      .insertInto("bloco_partido")
      .values(
        ["PFZ", "PFW", "PFY"].map((sigla) => ({
          bloco_id: 999001,
          sigla_partido: sigla,
          origem: "api" as const,
          coleta_id: coleta,
        })),
      )
      .execute();
    await db
      .insertInto("voto")
      .values([
        { votacao_id: "seed-1", parlamentar_id: SEED.deputado, voto: "Sim", sigla_partido: "PFY", coleta_id: coleta },
        { votacao_id: "seed-2", parlamentar_id: SEED.deputado, voto: "Sim", sigla_partido: "PFY", coleta_id: coleta },
      ])
      .execute();
    await db
      .insertInto("orientacao")
      .values([
        { votacao_id: "seed-1", sigla_bancada: "Bl PfzPfw...", orientacao: "Sim", coleta_id: coleta },
        { votacao_id: "seed-2", sigla_bancada: "Bl PfzPfw...", orientacao: "Não", coleta_id: coleta },
      ])
      .execute();
    try {
      const { perfilParlamentar } = await import("@/data/perfil");
      const p = (await perfilParlamentar(SEED.deputado))!;
      expect(p.votacoes.alinhamento).toEqual({ comparaveis: 2, iguais: 1, divergencias: 1 });
      expect(p.votacoes.lista.find((v) => v.id === "seed-1")).toMatchObject({
        orientacao: "Sim",
        tipoOrientacao: "bloco",
      });
    } finally {
      await db.deleteFrom("orientacao").where("sigla_bancada", "=", "Bl PfzPfw...").execute();
      await db.deleteFrom("voto").where("parlamentar_id", "=", SEED.deputado).execute();
      await db.deleteFrom("bloco").where("id", "=", 999001).execute();
    }
  });

  it("VOTO-01/03: presença 2 de 4 (voto vazio não conta) e alinhamento 1 de 2; sem voto vira null", async (ctx) => {
    if (!disponivel) ctx.skip();
    const { perfilParlamentar } = await import("@/data/perfil");
    const p = (await perfilParlamentar(SEED.deputada))!;
    expect(p.votacoes.totalPlenario).toBe(5);
    expect(p.votacoes.presentes).toBe(2);
    expect(p.votacoes.elegiveis).toBe(4); // seed-5 cai na licença de julho
    expect(p.votacoes.alinhamento).toEqual({ comparaveis: 2, iguais: 1, divergencias: 1 });
    expect(p.votacoes.lista[0]).toMatchObject({ id: "seed-3", voto: null, orientacao: "Sim" });
    expect(p.votacoes.lista.find((v) => v.id === "seed-4")).toMatchObject({ voto: null });
  });

  it("PRES-02: votação em licença sai da presença, aparece marcada e entra nos períodos do ano", async (ctx) => {
    if (!disponivel) ctx.skip();
    const { perfilParlamentar } = await import("@/data/perfil");
    const p = (await perfilParlamentar(SEED.deputada))!;
    expect(p.votacoes).toMatchObject({
      historicoDisponivel: true,
      foraDoExercicio: 1,
      tipoFora: "licenca",
      mediaPresenca: 50, // só a deputada tem votos no seed: 2 de 4
    });
    expect(p.votacoes.lista.find((v) => v.id === "seed-5")).toMatchObject({ voto: null, foraDoExercicio: "licenca" });
    expect(p.votacoes.lista.find((v) => v.id === "seed-3")).toMatchObject({ foraDoExercicio: null });
    expect(p.votacoes.periodosFora).toEqual([
      {
        inicio: "2026-07-01",
        fim: "2026-07-31",
        situacao: "Licença",
        motivo: "Licença para Tratamento de Saúde",
        tipo: "licenca",
        votacoes: 1,
      },
    ]);
  });

  it("PRES-02: voto registrado dentro da licença conta; média da Câmara usa a mesma regra", async (ctx) => {
    if (!disponivel) ctx.skip();
    const { perfilParlamentar } = await import("@/data/perfil");
    const cVot = (
      await db.selectFrom("coleta").select("id").where("fonte", "=", "camara_lote_votos").executeTakeFirstOrThrow()
    ).id;
    // Deputado sem histórico coletado: tudo conta, como antes (1 de 5 = 20%).
    await db
      .insertInto("voto")
      .values({
        votacao_id: "seed-5",
        parlamentar_id: SEED.deputado,
        voto: "Sim",
        sigla_partido: "PFY",
        coleta_id: cVot,
      })
      .execute();
    try {
      const joao = (await perfilParlamentar(SEED.deputado))!;
      expect(joao.votacoes).toMatchObject({
        historicoDisponivel: false,
        presentes: 1,
        elegiveis: 5,
        foraDoExercicio: 0,
      });
      expect(joao.votacoes.periodosFora).toEqual([]);
      expect(joao.votacoes.mediaPresenca).toBe(35); // (50% + 20%) / 2

      await db
        .insertInto("voto")
        .values({
          votacao_id: "seed-5",
          parlamentar_id: SEED.deputada,
          voto: "Sim",
          sigla_partido: "PFX",
          coleta_id: cVot,
        })
        .execute();
      const maria = (await perfilParlamentar(SEED.deputada))!;
      expect(maria.votacoes).toMatchObject({ presentes: 3, elegiveis: 5, foraDoExercicio: 0, tipoFora: null });
      expect(maria.votacoes.periodosFora[0].votacoes).toBe(0);
      expect(maria.votacoes.mediaPresenca).toBe(40); // (60% + 20%) / 2
    } finally {
      await db.deleteFrom("voto").where("votacao_id", "=", "seed-5").execute();
    }
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
      "camara_api_historico",
      "camara_ceap",
      "camara_lote_votos",
      "cgu_ceis",
      "cgu_cnep",
      "cgu_emendas",
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

  it("BUSCA-04: sigla de UF também busca pela UF, sem perder o nome", async (ctx) => {
    if (!disponivel) ctx.skip();
    const { buscarParlamentares, ufDaBusca } = await import("@/data/perfil");
    expect((await buscarParlamentares({ q: "sp" })).map((r) => r.id)).toEqual([SEED.deputada]);
    expect((await buscarParlamentares({ q: "RJ" })).map((r) => r.id)).toEqual([SEED.deputado]);
    // "MA" é UF sem deputado no seed, mas "Maria" casa pelo nome: a UF soma, não substitui.
    expect((await buscarParlamentares({ q: "ma" })).map((r) => r.id)).toEqual([SEED.deputada]);
    expect(ufDaBusca(" mg ")).toBe("MG");
    expect(ufDaBusca("XX")).toBeNull();
    expect(ufDaBusca("maria")).toBeNull();
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
