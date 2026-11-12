import { createHash } from "node:crypto";
import { sql } from "kysely";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createDb } from "@/db/client";
import { migrateToLatest } from "@/db/migrate";
import { SEED, semear } from "@/db/seed";
import { ClienteEducado, ColetaBloqueada } from "@/ingest/http";
import { API_TRANSFEREGOV, coletarTransferegovPix, LICENCA_TRANSFEREGOV } from "@/ingest/transferegov";

/** TRI-01..TRI-07, EDGE-01, EDGE-02: API falsa do Transferegov → banco real. */
const URL_TESTE = process.env.TEST_DATABASE_URL ?? "postgres://auditaja:auditaja@127.0.0.1:5436/auditaja_trilha_test";
const db = createDb(URL_TESTE);
let disponivel = true;

/** Emenda Pix da deputada no seed. */
const PIX = "202690000002";

const PLANOS = [
  {
    id_plano_acao: 501,
    codigo_plano_acao: "0903-000501",
    numero_emenda_parlamentar_plano_acao: Number(PIX),
    ano_emenda_parlamentar_plano_acao: 2026,
    data_aceite_plano_acao: "2026-02-10",
    valor_custeio_plano_acao: 1_500_000.0,
    valor_investimento_plano_acao: 500_000.0,
    id_beneficiario: 7001,
    // R2: nunca gravados.
    nome_banco_plano_acao: "Banco do Brasil",
    numero_agencia_plano_acao: "1428",
    numero_conta_plano_acao: "34782",
    nome_parlamentar_emenda_plano_acao: "Maria Exemplo",
  },
  // EDGE-01: sem código de emenda.
  {
    id_plano_acao: 502,
    codigo_plano_acao: "0903-000502",
    numero_emenda_parlamentar_plano_acao: null,
    ano_emenda_parlamentar_plano_acao: 2026,
    data_aceite_plano_acao: null,
    valor_custeio_plano_acao: 1.0,
    valor_investimento_plano_acao: 0,
    id_beneficiario: 7002,
    nome_parlamentar_emenda_plano_acao: "Maria Exemplo",
  },
  // Código que não é de emenda Pix de parlamentar da base, mesmo com o nome igual.
  {
    id_plano_acao: 503,
    codigo_plano_acao: "0903-000503",
    numero_emenda_parlamentar_plano_acao: 202699999999,
    ano_emenda_parlamentar_plano_acao: 2026,
    data_aceite_plano_acao: null,
    valor_custeio_plano_acao: 9.0,
    valor_investimento_plano_acao: 0,
    id_beneficiario: 7002,
    nome_parlamentar_emenda_plano_acao: "Maria Exemplo",
  },
];
const BENEFICIARIOS = [
  {
    id_beneficiario: 7001,
    uf_beneficiario: "SP",
    nome_beneficiario: "MUNICIPIO DE SAO PAULO",
    cnpj_beneficiario: "46395000000139",
  },
  { id_beneficiario: 7002, uf_beneficiario: "SP", nome_beneficiario: "OUTRO", cnpj_beneficiario: "11854334000149" },
];
const RELATORIOS = [
  { id_relatorio_gestao_novo: 9001, id_plano_acao: 501 },
  { id_relatorio_gestao_novo: 9002, id_plano_acao: 503 },
];
const dl = (
  id: number,
  rel: number,
  tp: string,
  doc: string,
  nome: string,
  valor: number | null,
  data: string | null,
) => ({
  id_relatorio_gestao_dl: id,
  id_relatorio_gestao_novo: rel,
  tx_descricao_relatorio_gestao_dl: "Nota Fiscal",
  tp_doc_recebedor_relatorio_gestao_dl: tp,
  tx_identificacao_recebedor_mascarado_relatorio_gestao_dl: doc,
  tx_nome_recebedor_relatorio_gestao_dl: nome,
  vl_pagamento_relatorio_gestao_dl: valor,
  dt_pagamento_relatorio_gestao_dl: data,
  tx_natureza_relatorio_gestao_dl: "INVESTIMENTO",
});
const LIQUIDACOES = [
  dl(1, 9001, "CNPJ", "19681377000181", "SAFRA EQUIPAMENTOS LTDA", 587900.0, "2026-04-01"),
  dl(2, 9001, "CNPJ", "19681377000181", "SAFRA EQUIPAMENTOS LTDA", 100.1, "2026-05-01"),
  // EDGE-02: dígito verificador errado.
  dl(3, 9001, "CNPJ", "19681377000182", "EMPRESA COM DV ERRADO", 50.0, "2026-04-02"),
  // TRI-07: pessoa física.
  dl(4, 9001, "CPF", "***823135**", "LUCIANY APARECIDA ALVES SANTOS", 3500.96, "2026-04-03"),
  dl(5, 9002, "CNPJ", "11854334000149", "DE OUTRO PLANO", 10.0, "2026-04-04"),
  dl(6, 9001, "CNPJ", "11854334000149", "SEM DATA", 10.0, null),
];

const paginado = (data: unknown[]) => ({
  data,
  total_pages: 1,
  total_items: data.length,
  page_number: 1,
  page_size: 200,
});

/** Corpos servidos, na ordem, para conferir o SHA-256 da coleta. */
let servidos: string[] = [];
const pedidos: URL[] = [];
function cliente(falharEm?: string) {
  return new ClienteEducado({
    intervaloMinMs: 0,
    dormir: async () => {},
    log: () => {},
    fetchImpl: (async (input: URL | string) => {
      const u = new URL(input.toString());
      if (u.pathname === "/robots.txt") return new Response("Not Found", { status: 404 });
      pedidos.push(u);
      const recurso = u.pathname.split("/").at(-1)!;
      if (recurso === falharEm) return new Response("erro", { status: 500 });
      let corpo: unknown;
      if (recurso === "data-atualizacao") corpo = { data_ultima_atualizacao: "2026-11-12T00:00:00" };
      else if (recurso === "planos-acao-especiais")
        corpo = paginado(
          PLANOS.filter(
            (p) =>
              String(p.ano_emenda_parlamentar_plano_acao) === u.searchParams.get("ano_emenda_parlamentar_plano_acao"),
          ),
        );
      else if (recurso === "beneficiarios-especiais") corpo = paginado(BENEFICIARIOS);
      else if (recurso === "relatorios-gestao-novos-especiais") corpo = paginado(RELATORIOS);
      else if (recurso === "relatorios-gestao-documento-liquidacao-especiais") corpo = paginado(LIQUIDACOES);
      else return new Response("Not Found", { status: 404 });
      const texto = JSON.stringify(corpo);
      servidos.push(texto);
      return new Response(texto, { status: 200, headers: { "content-type": "application/json" } });
    }) as typeof fetch,
  });
}

const contar = async (t: "transf_plano" | "transf_pagamento") =>
  Number((await db.selectFrom(t).select(db.fn.countAll<string>().as("n")).executeTakeFirstOrThrow()).n);

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

describe("coletarTransferegovPix", () => {
  it("EDGE-01, EDGE-02, TRI-07: resume ligados, sem código, fora da base, CNPJ inválido e PF", async (ctx) => {
    if (!disponivel) ctx.skip();
    servidos = [];
    pedidos.length = 0;
    const r = await coletarTransferegovPix(db, cliente());
    expect(r).toEqual({
      planos: 1,
      pagamentos: 3,
      semCodigo: 1,
      foraDaBase: 1,
      cnpjInvalido: 1,
      pf: 1,
      incompletos: 1,
    });
    // Só os anos de orçamento que a base tem.
    expect(
      pedidos
        .filter((u) => u.pathname.endsWith("planos-acao-especiais"))
        .map((u) => u.searchParams.get("ano_emenda_parlamentar_plano_acao")),
    ).toEqual(["2026"]);
    expect(pedidos.every((u) => u.origin === new URL(API_TRANSFEREGOV).origin)).toBe(true);
  });

  it("TRI-01, TRI-02: grava o plano ligado à emenda pelo código, com ente, valor e coleta", async (ctx) => {
    if (!disponivel) ctx.skip();
    const c = await db
      .selectFrom("coleta")
      .selectAll()
      .where("fonte", "=", "transferegov_especiais")
      .orderBy("id", "desc")
      .executeTakeFirstOrThrow();
    const sha = createHash("sha256");
    for (const s of servidos) sha.update(s);
    expect(c).toMatchObject({
      url: API_TRANSFEREGOV,
      sha256: sha.digest("hex"),
      bytes: servidos.reduce((t, s) => t + Buffer.byteLength(s), 0),
      licenca: LICENCA_TRANSFEREGOV,
      observacao: "base de 12/11/2026 (data-atualizacao do Transferegov)",
    });
    const planos = await db.selectFrom("transf_plano").selectAll().execute();
    expect(planos).toEqual([
      {
        id_plano_acao: 501,
        codigo_emenda: PIX,
        codigo_plano: "0903-000501",
        parlamentar_id: SEED.deputada,
        beneficiario_cnpj: "46395000000139",
        beneficiario_nome: "MUNICIPIO DE SAO PAULO",
        beneficiario_uf: "SP",
        valor: "2000000.00",
        data_aceite: "2026-02-10",
        coleta_id: c.id,
      },
    ]);
  });

  it("TRI-01, TRI-03, TRI-07: grava os pagamentos com CNPJ, valor e data; PF sem nome nem documento", async (ctx) => {
    if (!disponivel) ctx.skip();
    const pg = await db.selectFrom("transf_pagamento").selectAll().orderBy("id").execute();
    expect(
      pg.map((p) => [p.id, p.id_plano_acao, p.tipo, p.recebedor_cnpj, p.recebedor_nome, p.valor, p.data_pagamento]),
    ).toEqual([
      [1, 501, "pj", "19681377000181", "SAFRA EQUIPAMENTOS LTDA", "587900.00", "2026-04-01"],
      [2, 501, "pj", "19681377000181", "SAFRA EQUIPAMENTOS LTDA", "100.10", "2026-05-01"],
      [4, 501, "pf", null, null, "3500.96", "2026-04-03"],
    ]);
    const tudo = JSON.stringify(await db.selectFrom("transf_plano").selectAll().execute()) + JSON.stringify(pg);
    for (const proibido of ["LUCIANY", "823135", "1428", "34782", "Banco do Brasil", "DV ERRADO"]) {
      expect(tudo).not.toContain(proibido);
    }
  });

  it("TRI-03: nenhuma coluna para banco, agência, conta, nome de PF ou CPF nas tabelas novas", async (ctx) => {
    if (!disponivel) ctx.skip();
    const colunas = await sql<{ table_name: string; column_name: string }>`
      select table_name, column_name from information_schema.columns
      where table_name in ('transf_plano', 'transf_pagamento', 'cnpj_abertura', 'campanha_despesa')`.execute(db);
    expect(colunas.rows.length).toBeGreaterThan(20);
    const proibidas = colunas.rows.filter((c) =>
      /banco|agencia|conta|cpf|socio|endereco|logradouro|telefone|email|ddd|cep/.test(c.column_name),
    );
    expect(proibidas).toEqual([]);
  });

  it("TRI-06: falha no meio mantém a coleta anterior intacta", async (ctx) => {
    if (!disponivel) ctx.skip();
    const antes = await db.selectFrom("transf_pagamento").selectAll().orderBy("id").execute();
    const coletas = await db.selectFrom("coleta").select("id").where("fonte", "=", "transferegov_especiais").execute();
    await expect(
      coletarTransferegovPix(db, cliente("relatorios-gestao-documento-liquidacao-especiais")),
    ).rejects.toBeInstanceOf(ColetaBloqueada);
    expect(await db.selectFrom("transf_pagamento").selectAll().orderBy("id").execute()).toEqual(antes);
    expect(await contar("transf_plano")).toBe(1);
    // Nenhuma coleta registrada pela tentativa que falhou.
    expect(await db.selectFrom("coleta").select("id").where("fonte", "=", "transferegov_especiais").execute()).toEqual(
      coletas,
    );
  });

  it("coletar de novo substitui, sem duplicar", async (ctx) => {
    if (!disponivel) ctx.skip();
    await coletarTransferegovPix(db, cliente());
    expect(await contar("transf_plano")).toBe(1);
    expect(await contar("transf_pagamento")).toBe(3);
  });
});
