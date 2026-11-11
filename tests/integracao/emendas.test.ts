import iconv from "iconv-lite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import yazl from "yazl";
import { createDb } from "@/db/client";
import { migrateToLatest } from "@/db/migrate";
import { SEED, semear } from "@/db/seed";
import { linhasCsvDoZip } from "@/ingest/arquivos";
import { ClienteEducado, ColetaBloqueada, sha256De } from "@/ingest/http";
import { coletarEmendas, LICENCA_CGU, URL_EMENDAS } from "@/ingest/transparencia";

/** EMD-01..11, EDGE-01 e EDGE-03: ZIP latin1 falso → banco real. */
const URL_TESTE = process.env.TEST_DATABASE_URL ?? "postgres://auditaja:auditaja@127.0.0.1:5436/auditaja_test";
const db = createDb(URL_TESTE);
let disponivel = true;

const HOMONIMOS = [900000091, 900000092];

const CAB_BASE =
  '"Código da Emenda";"Ano da Emenda";"Tipo de Emenda";"Código do Autor da Emenda";"Nome do Autor da Emenda";"Número da emenda";"Localidade de aplicação do recurso";"Código Município IBGE";"Município";"Código UF IBGE";"UF";"Região";"Código Função";"Nome Função";"Código Subfunção";"Nome Subfunção";"Código Programa";"Nome Programa";"Código Ação";"Nome Ação";"Código Plano Orçamentário";"Nome Plano Orçamentário";"Valor Empenhado";"Valor Liquidado";"Valor Pago";"Valor Restos A Pagar Inscritos";"Valor Restos A Pagar Cancelados";"Valor Restos A Pagar Pagos"';
const base = (
  codigo: string,
  ano: number,
  tipo: string,
  autor: string,
  local: string,
  funcao: string,
  emp: string,
  liq: string,
  pago: string,
  rp: string,
) =>
  `"${codigo}";"${ano}";"${tipo}";"1";"${autor}";"0001";"${local}";"";"";"";"SÃO PAULO";"Sudeste";"10";"${funcao}";"";"";"";"";"";"";"";"";"${emp}";"${liq}";"${pago}";"0,00";"0,00";"${rp}"`;
const FD = "Emenda Individual - Transferências com Finalidade Definida";
const ESP = "Emenda Individual - Transferências Especiais";
const CSV_BASE = [
  CAB_BASE,
  base("202500010001", 2025, FD, "MARIA EXEMPLO", "CAMPINAS - SP", "Saúde", "1.000,00", "800,00", "500,00", "100,00"),
  base("202400010002", 2024, ESP, "MARIA EXEMPLO", "SÃO PAULO (UF)", "Encargos especiais", "2.000,50", "", "", ""),
  base("202300010003", 2023, FD, "MARIA EXEMPLO", "CAMPINAS - SP", "Saúde", "9.999,00", "0,00", "0,00", "0,00"),
  base("202500010004", 2025, "Emenda de Bancada", "MARIA EXEMPLO", "CAMPINAS - SP", "Saúde", "7.777,00", "0", "0", "0"),
  base("202500020005", 2025, FD, "HOMÔNIMO TESTE", "CAMPINAS - SP", "Saúde", "5.555,00", "0", "0", "0"),
  base("202500030006", 2025, FD, "ALVARO DIAS", "CAMPINAS - SP", "Saúde", "4.444,00", "0", "0", "0"),
].join("\r\n");

const CAB_FAV =
  '"Código da Emenda";"Código do Autor da Emenda";"Nome do Autor da Emenda";"Número da emenda";"Tipo de Emenda";"Ano/Mês";"Código do Favorecido";"Favorecido";"Natureza Jurídica";"Tipo Favorecido";"UF Favorecido";"Município Favorecido";"Valor Recebido"';
const fav = (codigo: string, doc: string, nome: string, tipo: string, valor: string) =>
  `"${codigo}";"1";"MARIA EXEMPLO";"0001";"${FD}";"202605";"${doc}";"${nome}";"Sem informação";"${tipo}";"SP";"CAMPINAS";"${valor}"`;
const CSV_FAV = [
  CAB_FAV,
  fav("202500010001", "***.113.861-**", "ACÁCIA GONÇALVES", "Pessoa Fisica", "300,00"),
  fav("202500010001", "12345678901", "FULANO COMPLETO", "Pessoa Fisica", "50,00"),
  fav("202500010001", "11854334000149", "EMPRESA ÚNICA LTDA", "Pessoa Jurídica", "1.200,00"),
  fav("202400010002", "-11", "MUNICÍPIO DE SÃO PAULO", "Sem informação", "2.000,50"),
  fav("202300010003", "22222222000122", "EMPRESA DE 2023", "Pessoa Jurídica", "10,00"),
  fav("202500020005", "33333333000133", "EMPRESA DO HOMÔNIMO", "Pessoa Jurídica", "10,00"),
].join("\r\n");

function zipar(arquivos: Record<string, string>): Promise<Buffer> {
  return new Promise((resolve) => {
    const z = new yazl.ZipFile();
    for (const [nome, conteudo] of Object.entries(arquivos)) z.addBuffer(iconv.encode(conteudo, "latin1"), nome);
    z.end();
    const partes: Buffer[] = [];
    z.outputStream.on("data", (c: Buffer) => partes.push(c));
    z.outputStream.on("end", () => resolve(Buffer.concat(partes)));
  });
}

let zip: Buffer;
const pedidos: string[] = [];
const cliente = (status = 200) =>
  new ClienteEducado({
    intervaloMinMs: 0,
    dormir: async () => {},
    log: () => {},
    fetchImpl: (async (input: URL | string) => {
      const url = input.toString();
      pedidos.push(url);
      // O S3 da CGU responde 403 ao robots.txt: arquivo ausente.
      if (url.endsWith("/robots.txt")) return new Response("<Error/>", { status: 403 });
      if (url === URL_EMENDAS) return new Response(status === 200 ? new Uint8Array(zip) : "", { status });
      return new Response("", { status: 404 });
    }) as typeof fetch,
  });

const contar = async (t: "emenda" | "emenda_favorecido") =>
  Number((await db.selectFrom(t).select(db.fn.countAll<string>().as("n")).executeTakeFirstOrThrow()).n);

beforeAll(async () => {
  try {
    await migrateToLatest(db);
    await semear(db);
    const { coleta_id } = await db
      .selectFrom("parlamentar")
      .select("coleta_id")
      .where("id", "=", SEED.deputada)
      .executeTakeFirstOrThrow();
    for (const id of HOMONIMOS) {
      await db
        .insertInto("parlamentar")
        .values({
          id,
          casa: "camara",
          nome: "Homônimo Teste",
          nome_civil: null,
          sigla_partido: null,
          sigla_uf: "SP",
          url_foto: null,
          data_nascimento: null,
          sexo: null,
          id_legislatura: 57,
          em_exercicio: true,
          source_url: "https://example.test",
          coleta_id,
        })
        .execute();
    }
    zip = await zipar({ "EmendasParlamentares.csv": CSV_BASE, "EmendasParlamentares_PorFavorecido.csv": CSV_FAV });
  } catch {
    disponivel = false;
  }
});
afterAll(async () => {
  if (disponivel) {
    await semear(db);
    await db.deleteFrom("parlamentar").where("id", "in", HOMONIMOS).execute();
  }
  await db.destroy();
});

describe("coletarEmendas", () => {
  it("EMD-01, EMD-05: baixa o ZIP uma vez e conta autores descartados (homônimo e sem casamento)", async (ctx) => {
    if (!disponivel) ctx.skip();
    pedidos.length = 0;
    const r = await coletarEmendas(db, cliente());
    expect(pedidos.filter((u) => u === URL_EMENDAS)).toHaveLength(1);
    expect(pedidos.every((u) => u.startsWith("https://dadosabertos-download.cgu.gov.br/"))).toBe(true);
    expect(r).toEqual({ emendas: 2, favorecidos: 4, autoresDescartados: 2 });
  });

  it("EMD-02: registra a coleta com fonte, URL, SHA-256, bytes e licença", async (ctx) => {
    if (!disponivel) ctx.skip();
    const c = await db
      .selectFrom("coleta")
      .selectAll()
      .where("fonte", "=", "cgu_emendas")
      .orderBy("id", "desc")
      .executeTakeFirstOrThrow();
    expect(c).toMatchObject({ url: URL_EMENDAS, sha256: sha256De(zip), bytes: zip.length, licenca: LICENCA_CGU });
    const ids = await db.selectFrom("emenda").select("coleta_id").execute();
    expect(ids.map((x) => x.coleta_id)).toEqual([c.id, c.id]);
  });

  it("EMD-03, EMD-04, EMD-06, EDGE-03: grava só individuais de 2024 em diante, ligadas à deputada, com valores exatos", async (ctx) => {
    if (!disponivel) ctx.skip();
    const rows = await db.selectFrom("emenda").selectAll().orderBy("codigo").execute();
    expect(rows.map((r) => r.codigo)).toEqual(["202400010002", "202500010001"]);
    expect(rows.every((r) => r.parlamentar_id === SEED.deputada)).toBe(true);
    expect(rows[1]).toMatchObject({
      ano: 2025,
      tipo: FD,
      localidade: "CAMPINAS - SP",
      funcao: "Saúde",
      empenhado: "1000.00",
      liquidado: "800.00",
      pago: "500.00",
      rp_pagos: "100.00",
    });
    expect(rows[0]).toMatchObject({
      ano: 2024,
      tipo: ESP,
      empenhado: "2000.50",
      liquidado: "0.00",
      pago: "0.00",
      rp_pagos: "0.00",
    });
  });

  it("EMD-07, EMD-08, EMD-09: grava favorecidos das emendas gravadas, com PF mascarada e CNPJ formatado", async (ctx) => {
    if (!disponivel) ctx.skip();
    const rows = await db.selectFrom("emenda_favorecido").selectAll().orderBy("valor").execute();
    expect(rows.map((r) => [r.codigo_emenda, r.favorecido_nome, r.favorecido_doc, r.valor])).toEqual([
      ["202500010001", "Beneficiário pessoa física", null, "50.00"],
      ["202500010001", "Beneficiário pessoa física", "***.113.861-**", "300.00"],
      ["202500010001", "EMPRESA ÚNICA LTDA", "11.854.334/0001-49", "1200.00"],
      ["202400010002", "MUNICÍPIO DE SÃO PAULO", null, "2000.50"],
    ]);
    expect(rows[2]).toMatchObject({
      parlamentar_id: SEED.deputada,
      ano_emenda: 2025,
      ano_mes: "202605",
      tipo_favorecido: "Pessoa Jurídica",
      uf: "SP",
      municipio: "CAMPINAS",
    });
    expect(rows[3].ano_emenda).toBe(2024);
    const tudo = JSON.stringify(rows);
    expect(tudo).not.toContain("ACÁCIA");
    expect(tudo).not.toContain("FULANO");
    expect(tudo).not.toContain("12345678901");
  });

  it("EMD-10: coletar de novo substitui, sem duplicar", async (ctx) => {
    if (!disponivel) ctx.skip();
    await coletarEmendas(db, cliente());
    expect(await contar("emenda")).toBe(2);
    expect(await contar("emenda_favorecido")).toBe(4);
  });

  it("EDGE-01: 403 no arquivo encerra com ColetaBloqueada e não toca no banco", async (ctx) => {
    if (!disponivel) ctx.skip();
    const coletas = await contar("emenda");
    await expect(coletarEmendas(db, cliente(403))).rejects.toBeInstanceOf(ColetaBloqueada);
    expect(await contar("emenda")).toBe(coletas);
    expect(await contar("emenda_favorecido")).toBe(4);
  });

  it("EMD-11: lê o CSV do ZIP como iterador assíncrono, linha a linha", async (ctx) => {
    if (!disponivel) ctx.skip();
    const it = linhasCsvDoZip(zip, "EmendasParlamentares_PorFavorecido.csv");
    expect(typeof it[Symbol.asyncIterator]).toBe("function");
    const primeira = await it.next();
    expect(primeira.value?.["Favorecido"]).toBe("ACÁCIA GONÇALVES");
    await it.return(undefined);
  });
});
