import { afterAll, beforeAll, describe, expect, it } from "vitest";
import yazl from "yazl";
import { createDb } from "@/db/client";
import { migrateToLatest } from "@/db/migrate";
import { SEED, semear } from "@/db/seed";
import { coletarCeap, urlCeap } from "@/ingest/camara";
import { LICENCA_CAMARA } from "@/ingest/coleta";
import { ClienteEducado, sha256De } from "@/ingest/http";

/** COLETA-07, PROV-01 e PRIV-01..03 de ponta a ponta: zip falso → banco real. */
const URL_TESTE = process.env.TEST_DATABASE_URL ?? "postgres://auditaja:auditaja@127.0.0.1:5436/auditaja_test";
const db = createDb(URL_TESTE);
const ANO = 2015;
let disponivel = true;

const CABECALHO =
  '"txNomeParlamentar";"cpf";"ideCadastro";"sgUF";"txtDescricao";"txtFornecedor";"txtCNPJCPF";"datEmissao";"vlrDocumento";"vlrGlosa";"vlrLiquido";"numMes";"numAno";"txtPassageiro";"vlrRestituicao";"ideDocumento";"urlDocumento"';
const linha = (doc: string, fornecedor: string, valor: string, ide: string) =>
  `"Maria Exemplo";"11122233344";"${SEED.deputada}";"SP";"PASSAGEM AÉREA";"${fornecedor}";"${doc}";"${ANO}-03-10T00:00:00";"${valor}";"0";"${valor}";"3";"${ANO}";"Pessoa Passageira";"";"${ide}";"https://www.camara.leg.br/doc/${ide}.pdf"`;
const CSV = [
  CABECALHO,
  linha("123.456.789-01", "Fulano Prestador", "300", "1"),
  linha("12.345.678/0001-90", "Aérea Exemplo S.A.", "700", "2"),
  // liderança sem ideCadastro: deve ser ignorada
  `"LID.GOV-CD";"";"";"NA";"TELEFONIA";"Operadora";"12.345.678/0001-90";"${ANO}-03-10T00:00:00";"50";"0";"50";"3";"${ANO}";"";"";"3";""`,
].join("\n");

function zipar(conteudo: string): Promise<Buffer> {
  return new Promise((resolve) => {
    const z = new yazl.ZipFile();
    z.addBuffer(Buffer.from("﻿" + conteudo, "utf8"), `Ano-${ANO}.csv`);
    z.end();
    const partes: Buffer[] = [];
    z.outputStream.on("data", (c: Buffer) => partes.push(c));
    z.outputStream.on("end", () => resolve(Buffer.concat(partes)));
  });
}

let zip: Buffer;
let zipQuebrado: Buffer;
const cliente = (servir: () => Buffer = () => zip) =>
  new ClienteEducado({
    intervaloMinMs: 0,
    dormir: async () => {},
    log: () => {},
    fetchImpl: (async (input: URL | string) => {
      const url = input.toString();
      if (url.endsWith("/robots.txt")) return new Response("", { status: 404 });
      if (url === urlCeap(ANO)) return new Response(new Uint8Array(servir()), { status: 200 });
      return new Response("", { status: 404 });
    }) as typeof fetch,
  });

beforeAll(async () => {
  try {
    await migrateToLatest(db);
    await semear(db);
    zip = await zipar(CSV);
    // Segunda linha com mês inválido: o insert falha depois do delete.
    zipQuebrado = await zipar(
      [CABECALHO, linha("12.345.678/0001-90", "Aérea", "10", "9").replace(`"3";"${ANO}"`, `"x";"${ANO}"`)].join("\n"),
    );
  } catch {
    disponivel = false;
  }
});
afterAll(async () => {
  if (disponivel) await semear(db);
  await db.destroy();
});

describe("coletarCeap", () => {
  it("PROV-01: registra o lote com URL, SHA-256, bytes e licença e liga as despesas a ele", async (ctx) => {
    if (!disponivel) ctx.skip();
    expect(await coletarCeap(db, cliente(), ANO)).toBe(2);
    const coleta = await db
      .selectFrom("coleta")
      .selectAll()
      .where("fonte", "=", "camara_ceap")
      .orderBy("id", "desc")
      .executeTakeFirstOrThrow();
    expect(coleta).toMatchObject({
      url: urlCeap(ANO),
      sha256: sha256De(zip),
      bytes: zip.length,
      licenca: LICENCA_CAMARA,
    });
    const ids = await db.selectFrom("despesa_ceap").select("coleta_id").where("ano", "=", ANO).execute();
    expect(ids.map((r) => r.coleta_id)).toEqual([coleta.id, coleta.id]);
  });

  it("PRIV-01..03: grava CPF mascarado, rótulo genérico e nada do passageiro ou do CPF do parlamentar", async (ctx) => {
    if (!disponivel) ctx.skip();
    const rows = await db
      .selectFrom("despesa_ceap")
      .selectAll()
      .where("ano", "=", ANO)
      .orderBy("ide_documento")
      .execute();
    expect(rows[0]).toMatchObject({
      fornecedor_doc: "***.456.789-**",
      fornecedor_nome: "Prestador pessoa física",
      fornecedor_classe: "terceiro_pf",
    });
    expect(rows[1]).toMatchObject({ fornecedor_doc: "12.345.678/0001-90", fornecedor_classe: "pessoa_juridica" });
    const tudo = JSON.stringify(rows);
    expect(tudo).not.toContain("12345678901");
    expect(tudo).not.toContain("123.456.789-01");
    expect(tudo).not.toContain("Passageira");
    expect(tudo).not.toContain("11122233344");
  });

  it("COLETA-07: coletar o mesmo ano de novo substitui, sem duplicar", async (ctx) => {
    if (!disponivel) ctx.skip();
    expect(await coletarCeap(db, cliente(), ANO)).toBe(2);
    const n = await db
      .selectFrom("despesa_ceap")
      .select(db.fn.countAll<string>().as("n"))
      .where("ano", "=", ANO)
      .executeTakeFirstOrThrow();
    expect(Number(n.n)).toBe(2);
    // Outros anos não são tocados.
    const outros = await db
      .selectFrom("despesa_ceap")
      .select(db.fn.countAll<string>().as("n"))
      .where("ano", "=", 2026)
      .executeTakeFirstOrThrow();
    expect(Number(outros.n)).toBe(3);
  });

  it("COLETA-07: se a recoleta falha no meio, a transação desfaz e o ano anterior continua", async (ctx) => {
    if (!disponivel) ctx.skip();
    await expect(
      coletarCeap(
        db,
        cliente(() => zipQuebrado),
        ANO,
      ),
    ).rejects.toThrow();
    const n = await db
      .selectFrom("despesa_ceap")
      .select(db.fn.countAll<string>().as("n"))
      .where("ano", "=", ANO)
      .executeTakeFirstOrThrow();
    expect(Number(n.n)).toBe(2);
  });
});
