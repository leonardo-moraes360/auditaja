import { readFileSync } from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createDb } from "@auditaja/db/client";
import { migrateToLatest } from "@auditaja/db/migrate";
import { SEED, semear } from "@auditaja/db/seed";
import { ColetaBloqueada, ClienteEducado } from "../../src/http";
import yazl from "yazl";
import { coletarCeap, coletarOrgaos, coletarVotacoes, urlCeap } from "../../src/camara";
import { coletarCeaps, coletarSenadores, coletarVotacoesSenado } from "../../src/senado";

/** SCAD-05/06, SCEAPS-07, SVOT-04 e SERR-01 de ponta a ponta: respostas gravadas → banco real. */
const URL_TESTE = process.env.TEST_DATABASE_URL ?? "postgres://auditaja:auditaja@127.0.0.1:5436/auditaja_test";
const db = createDb(URL_TESTE);
let disponivel = true;

const fixture = (nome: string) => readFileSync(path.join(import.meta.dirname, "../fixtures/senado", nome), "utf8");

function cliente(opts: { bloquear?: RegExp } = {}) {
  const pedidos: string[] = [];
  const cli = new ClienteEducado({
    intervaloMinMs: 0,
    dormir: async () => {},
    log: () => {},
    fetchImpl: (async (input: URL | string) => {
      const url = input.toString();
      pedidos.push(url);
      const json = (nome: string) =>
        new Response(fixture(nome), { status: 200, headers: { "content-type": "application/json" } });
      if (url.endsWith("/robots.txt")) return new Response("forbidden", { status: 403 });
      if (opts.bloquear?.test(url)) return new Response("", { status: 403 });
      if (url.endsWith("/senador/lista/legislatura/57.json")) return json("lista-legislatura-57.json");
      if (url.endsWith("/senador/lista/atual.json")) return json("lista-atual.json");
      if (/\/senador\/\d+\/comissoes\.json$/.test(url)) return json("comissoes-5672.json");
      if (/\/senador\/\d+\.json$/.test(url)) return json("senador-5672.json");
      if (url.endsWith("/senadores/despesas_ceaps/2026")) return json("ceaps-2026.json");
      if (url.includes("/dadosabertos/votacao?dataInicio=2026-01-01")) return json("votacao-2026.json");
      if (url.includes("/orientacaoBancada/20260101/20261231.json")) return json("orientacao-20261014.json");
      return new Response("", { status: 404 });
    }) as typeof fetch,
  });
  return { cli, pedidos };
}

const contar = async (tabela: "parlamentar" | "suplente" | "despesa_ceap" | "votacao" | "voto" | "orientacao") =>
  Number((await db.selectFrom(tabela).select(db.fn.countAll<string>().as("n")).executeTakeFirstOrThrow()).n);

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
});

describe("coleta do Senado", () => {
  it("SCAD-05: grava senadores com proveniência e sem tocar deputados", async (ctx) => {
    if (!disponivel) ctx.skip();
    const deputadosAntes = await db.selectFrom("parlamentar").selectAll().where("casa", "=", "camara").execute();
    const r = await coletarSenadores(db, cliente().cli);
    expect(r).toEqual({ senadores: 3, suplentes: 3, comissoes: 4 });
    const alan = await db.selectFrom("parlamentar").selectAll().where("id", "=", 10005672).executeTakeFirstOrThrow();
    const coleta = await db.selectFrom("coleta").selectAll().where("id", "=", alan.coleta_id).executeTakeFirstOrThrow();
    expect(coleta).toMatchObject({
      fonte: "senado_api_senadores",
      url: "https://legis.senado.leg.br/dadosabertos/senador/lista/legislatura/57.json",
    });
    expect(coleta.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(coleta.licenca).toContain("Senado Federal");
    // SCAD-04: nascimento do detalhe /senador/{codigo} chega ao banco.
    expect(alan.data_nascimento).toBe("1976-10-23");
    expect(await db.selectFrom("parlamentar").selectAll().where("casa", "=", "camara").execute()).toEqual(
      deputadosAntes,
    );
  });

  it("SCAD-05: uma linha em coleta por resposta baixada, e cada registro aponta para a sua", async (ctx) => {
    if (!disponivel) ctx.skip();
    const n = async () =>
      Number((await db.selectFrom("coleta").select(db.fn.countAll<string>().as("n")).executeTakeFirstOrThrow()).n);
    const antes = await n();
    const { cli, pedidos } = cliente();
    await coletarSenadores(db, cli);
    const dados = pedidos.filter((u) => !u.endsWith("/robots.txt"));
    expect(dados).toHaveLength(6); // 2 listas + detalhe e comissões dos 2 senadores em exercício
    expect((await n()) - antes).toBe(dados.length);
    const urls = await db.selectFrom("coleta").select(["id", "url", "fonte"]).where("id", ">", 0).execute();
    for (const u of dados) expect(urls.map((c) => c.url)).toContain(u);
    const com = await db
      .selectFrom("orgao_membro")
      .innerJoin("coleta", "coleta.id", "orgao_membro.coleta_id")
      .select(["coleta.url", "orgao_membro.parlamentar_id"])
      .where("orgao_membro.parlamentar_id", "=", 10006358)
      .execute();
    expect(com.length).toBeGreaterThan(0);
    expect(com.every((c) => c.url.endsWith("/senador/6358/comissoes.json"))).toBe(true);
    const sup = await db
      .selectFrom("suplente")
      .innerJoin("coleta", "coleta.id", "suplente.coleta_id")
      .select("coleta.url")
      .where("suplente.parlamentar_id", "=", 10005672)
      .execute();
    expect(sup.every((c) => c.url.endsWith("/senador/lista/atual.json"))).toBe(true);
  });

  it("SCAD-06: coletar de novo não duplica", async (ctx) => {
    if (!disponivel) ctx.skip();
    const antes = [await contar("parlamentar"), await contar("suplente")];
    await coletarSenadores(db, cliente().cli);
    expect([await contar("parlamentar"), await contar("suplente")]).toEqual(antes);
  });

  it("SCEAPS-07: recoleta da CEAPS substitui só as notas de senadores do ano", async (ctx) => {
    if (!disponivel) ctx.skip();
    const deputado = () =>
      db.selectFrom("despesa_ceap").selectAll().where("parlamentar_id", "=", SEED.deputada).orderBy("id").execute();
    const antes = await deputado();
    expect(await coletarCeaps(db, cliente().cli, 2026)).toEqual({ notas: 3, descartadas: 1 });
    const n = await contar("despesa_ceap");
    expect(await coletarCeaps(db, cliente().cli, 2026)).toEqual({ notas: 3, descartadas: 1 });
    expect(await contar("despesa_ceap")).toBe(n);
    expect(await deputado()).toEqual(antes);
    // As notas fictícias do seed (senador 9001) também são do Senado em 2026: foram trocadas.
    const seedSen = await db
      .selectFrom("despesa_ceap")
      .select("id")
      .where("parlamentar_id", "=", SEED.senador)
      .execute();
    expect(seedSen).toHaveLength(0);
  });

  it("SVOT-04: votações do ano com no máximo 2 requisições e sem tocar a Câmara", async (ctx) => {
    if (!disponivel) ctx.skip();
    const camara = () =>
      db.selectFrom("votacao").select("id").where("sigla_orgao", "<>", "PLEN-SF").orderBy("id").execute();
    const antes = await camara();
    const { cli, pedidos } = cliente();
    expect(await coletarVotacoesSenado(db, cli, 2026)).toEqual({ votacoes: 2, votos: 4, orientacoes: 13 });
    expect(pedidos.filter((u) => !u.endsWith("/robots.txt"))).toHaveLength(2);
    expect(await camara()).toEqual(antes);
    const n = [await contar("votacao"), await contar("voto"), await contar("orientacao")];
    await coletarVotacoesSenado(db, cliente().cli, 2026);
    expect([await contar("votacao"), await contar("voto"), await contar("orientacao")]).toEqual(n);
  });

  it("SERR-01: 403 numa URL de dados encerra a coleta sem gravar", async (ctx) => {
    if (!disponivel) ctx.skip();
    const antes = await contar("despesa_ceap");
    await expect(coletarCeaps(db, cliente({ bloquear: /despesas_ceaps/ }).cli, 2026)).rejects.toBeInstanceOf(
      ColetaBloqueada,
    );
    await expect(coletarSenadores(db, cliente({ bloquear: /comissoes/ }).cli)).rejects.toBeInstanceOf(ColetaBloqueada);
    expect(await contar("despesa_ceap")).toBe(antes);
  });

  it("AD-005: as coletas da Câmara não tocam notas nem votações do Senado", async (ctx) => {
    if (!disponivel) ctx.skip();
    await semear(db);
    const senado = async () => ({
      notas: await db.selectFrom("despesa_ceap").select("id").where("parlamentar_id", "=", SEED.senador).execute(),
      votacoes: await db
        .selectFrom("votacao")
        .select("id")
        .where("sigla_orgao", "=", "PLEN-SF")
        .orderBy("id")
        .execute(),
      votos: await db.selectFrom("voto").select("votacao_id").where("parlamentar_id", "=", SEED.senador).execute(),
      orgaos: await db
        .selectFrom("orgao_membro")
        .select("sigla_orgao")
        .where("parlamentar_id", "=", SEED.senador)
        .execute(),
    });
    const antes = await senado();
    expect(antes.notas.length).toBeGreaterThan(0);
    expect(antes.votacoes.length).toBeGreaterThan(0);
    expect(antes.orgaos.length).toBeGreaterThan(0);
    const zipCeap = await new Promise<Buffer>((resolve) => {
      const z = new yazl.ZipFile();
      z.addBuffer(
        Buffer.from(
          '"ideCadastro";"txtDescricao";"txtFornecedor";"txtCNPJCPF";"datEmissao";"vlrDocumento";"vlrGlosa";"vlrLiquido";"numMes";"numAno";"vlrRestituicao";"ideDocumento";"urlDocumento"\n' +
            `"${SEED.deputada}";"PASSAGEM AÉREA";"Aérea";"12.345.678/0001-90";"2026-03-10T00:00:00";"10";"0";"10";"3";"2026";"";"x1";""`,
          "utf8",
        ),
        "Ano-2026.csv",
      );
      z.end();
      const partes: Buffer[] = [];
      z.outputStream.on("data", (c: Buffer) => partes.push(c));
      z.outputStream.on("end", () => resolve(Buffer.concat(partes)));
    });
    const cliCamara = new ClienteEducado({
      intervaloMinMs: 0,
      dormir: async () => {},
      log: () => {},
      fetchImpl: (async (input: URL | string) => {
        const url = input.toString();
        if (url.endsWith("/robots.txt")) return new Response("", { status: 404 });
        if (url === urlCeap(2026)) return new Response(new Uint8Array(zipCeap), { status: 200 });
        if (url.includes("/arquivos/votacoes")) return new Response("id\n", { status: 200 });
        if (url.includes("/arquivos/orgaosDeputados")) return new Response("uriDeputado\n", { status: 200 });
        return new Response("", { status: 404 });
      }) as typeof fetch,
    });
    expect(await coletarCeap(db, cliCamara, 2026)).toBe(1);
    await coletarVotacoes(db, cliCamara, 2026);
    await coletarOrgaos(db, cliCamara);
    expect(await senado()).toEqual(antes);
    await semear(db);
  });
});
