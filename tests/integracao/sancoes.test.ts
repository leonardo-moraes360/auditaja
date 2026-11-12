import iconv from "iconv-lite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import yazl from "yazl";
import { createDb } from "@/db/client";
import { migrateToLatest } from "@/db/migrate";
import { semear } from "@/db/seed";
import { ClienteEducado, ColetaBloqueada } from "@/ingest/http";
import { coletarSancoes, dataDoArquivo, LICENCA_CGU, urlSancoes } from "@/ingest/transparencia";

/** SAN-01..03 e EDGE-02: ZIPs CEIS/CNEP falsos → banco real. */
const URL_TESTE = process.env.TEST_DATABASE_URL ?? "postgres://auditaja:auditaja@127.0.0.1:5436/auditaja_test";
const db = createDb(URL_TESTE);
let disponivel = true;

// 12h UTC = 9h em Brasília: "hoje" é 11/11/2026 nos dois fusos.
const HOJE = new Date("2026-11-11T12:00:00Z");
const CAB =
  '"CADASTRO";"CÓDIGO DA SANÇÃO";"TIPO DE PESSOA";"CPF OU CNPJ DO SANCIONADO";"NOME DO SANCIONADO";"CATEGORIA DA SANÇÃO";"DATA INÍCIO SANÇÃO";"DATA FINAL SANÇÃO";"ÓRGÃO SANCIONADOR"';
const lin = (
  cad: string,
  cod: string,
  tipo: string,
  doc: string,
  nome: string,
  cat: string,
  ini: string,
  fim: string,
) => `"${cad}";"${cod}";"${tipo}";"${doc}";"${nome}";"${cat}";"${ini}";"${fim}";"MINISTÉRIO EXEMPLO"`;

const CEIS = [
  CAB,
  // PJ que forneceu à cota da deputada do seed (55.666.777/0001-88).
  lin(
    "CEIS",
    "101",
    "J",
    "55666777000188",
    "POSTO ILUSTRATIVO LTDA 12345678901",
    "Impedimento/proibição de contratar",
    "03/02/2026",
    "03/02/2027",
  ),
  // PJ sem despesa na cota: fora (R2).
  lin("CEIS", "102", "J", "99888777000166", "EMPRESA ALHEIA LTDA", "Suspensão", "01/01/2025", ""),
  // PF: nunca gravada.
  lin("CEIS", "103", "F", "12345678901", "FULANO SANCIONADO", "Impedimento", "01/01/2025", ""),
  // Tipo F com 14 dígitos de um CNPJ da cota: o tipo de pessoa decide, não o tamanho do documento.
  lin("CEIS", "104", "F", "55666777000188", "REGISTRO TIPO F", "Impedimento", "01/01/2025", ""),
].join("\r\n");
const CNEP = [
  CAB,
  lin("CNEP", "201", "J", "12.345.678/0001-90", "GRÁFICA EXEMPLO LTDA", "Multa", "10/05/2026", ""),
].join("\r\n");

function zipar(nome: string, conteudo: string): Promise<Buffer> {
  return new Promise((resolve) => {
    const z = new yazl.ZipFile();
    z.addBuffer(iconv.encode(conteudo, "latin1"), nome);
    z.end();
    const partes: Buffer[] = [];
    z.outputStream.on("data", (c: Buffer) => partes.push(c));
    z.outputStream.on("end", () => resolve(Buffer.concat(partes)));
  });
}

const pedidos: string[] = [];
let arquivos: Record<string, Buffer> = {};
const cliente = () =>
  new ClienteEducado({
    intervaloMinMs: 0,
    dormir: async () => {},
    log: () => {},
    fetchImpl: (async (input: URL | string) => {
      const url = input.toString();
      pedidos.push(url);
      if (url.endsWith("/robots.txt")) return new Response("<Error/>", { status: 403 });
      const buf = arquivos[url];
      return buf ? new Response(new Uint8Array(buf), { status: 200 }) : new Response("", { status: 404 });
    }) as typeof fetch,
  });

const sancoes = () => db.selectFrom("sancao").selectAll().orderBy("codigo").execute();

beforeAll(async () => {
  try {
    await migrateToLatest(db);
    await semear(db);
    arquivos = {
      // CEIS de hoje ainda não saiu: só o de ontem existe.
      [urlSancoes("CEIS", "20261110")]: await zipar("20261110_CEIS.csv", CEIS),
      [urlSancoes("CNEP", "20261111")]: await zipar("20261111_CNEP.csv", CNEP),
    };
  } catch {
    disponivel = false;
  }
});
afterAll(async () => {
  if (disponivel) await semear(db);
  await db.destroy();
});

describe("coletarSancoes", () => {
  it("monta a data do arquivo no fuso de Brasília", () => {
    expect(dataDoArquivo(new Date("2026-11-11T02:00:00Z"), 0)).toBe("20261110");
    expect(dataDoArquivo(HOJE, 7)).toBe("20261104");
  });

  it("SAN-01: baixa o arquivo mais recente de cada cadastro, recuando só no 404", async (ctx) => {
    if (!disponivel) ctx.skip();
    pedidos.length = 0;
    expect(await coletarSancoes(db, cliente(), HOJE)).toEqual({ CEIS: 1, CNEP: 1 });
    const zips = pedidos.filter((u) => u.endsWith(".zip"));
    expect(zips).toEqual([
      urlSancoes("CEIS", "20261111"),
      urlSancoes("CEIS", "20261110"),
      urlSancoes("CNEP", "20261111"),
    ]);
    const coletas = await db
      .selectFrom("coleta")
      .select(["fonte", "url", "licenca", "observacao"])
      .where("fonte", "in", ["cgu_ceis", "cgu_cnep"])
      .where("observacao", "not like", "seed%")
      .orderBy("fonte")
      .execute();
    expect(coletas).toEqual([
      {
        fonte: "cgu_ceis",
        url: urlSancoes("CEIS", "20261110"),
        licenca: LICENCA_CGU,
        observacao: "base de 10/11/2026",
      },
      {
        fonte: "cgu_cnep",
        url: urlSancoes("CNEP", "20261111"),
        licenca: LICENCA_CGU,
        observacao: "base de 11/11/2026",
      },
    ]);
  });

  it("SAN-02: grava só PJ com CNPJ presente na cota, com datas ISO e fim nulo sem prazo", async (ctx) => {
    if (!disponivel) ctx.skip();
    const rows = await sancoes();
    expect(rows.map((r) => ({ ...r, id: 0, coleta_id: 0 }))).toEqual([
      {
        id: 0,
        coleta_id: 0,
        cadastro: "CEIS",
        codigo: "101",
        cnpj: "55666777000188",
        nome: "POSTO ILUSTRATIVO LTDA ***.***.***-**", // R3: CPF de MEI no nome sai mascarado
        categoria: "Impedimento/proibição de contratar",
        data_inicio: "2026-02-03",
        data_fim: "2027-02-03",
        orgao: "MINISTÉRIO EXEMPLO",
      },
      {
        id: 0,
        coleta_id: 0,
        cadastro: "CNEP",
        codigo: "201",
        cnpj: "12345678000190",
        nome: "GRÁFICA EXEMPLO LTDA",
        categoria: "Multa",
        data_inicio: "2026-05-10",
        data_fim: null,
        orgao: "MINISTÉRIO EXEMPLO",
      },
    ]);
    expect(JSON.stringify(rows)).not.toContain("12345678901");
  });

  it("SAN-03: coletar de novo substitui cada cadastro, sem duplicar", async (ctx) => {
    if (!disponivel) ctx.skip();
    await coletarSancoes(db, cliente(), HOJE);
    expect((await sancoes()).map((r) => r.codigo)).toEqual(["101", "201"]);
  });

  it("SAN-01: só o 404 recua um dia; 403 encerra sem tentar a data anterior", async (ctx) => {
    if (!disponivel) ctx.skip();
    const salvos = arquivos;
    pedidos.length = 0;
    const cli = new ClienteEducado({
      intervaloMinMs: 0,
      dormir: async () => {},
      log: () => {},
      fetchImpl: (async (input: URL | string) => {
        const url = input.toString();
        pedidos.push(url);
        if (url.endsWith("/robots.txt")) return new Response("<Error/>", { status: 403 });
        if (url === urlSancoes("CEIS", "20261111")) return new Response("", { status: 403 });
        return new Response("", { status: 404 });
      }) as typeof fetch,
    });
    await expect(coletarSancoes(db, cli, HOJE)).rejects.toBeInstanceOf(ColetaBloqueada);
    expect(pedidos.filter((u) => u.endsWith(".zip"))).toEqual([urlSancoes("CEIS", "20261111")]);
    expect((await sancoes()).map((r) => r.codigo)).toEqual(["101", "201"]);
    arquivos = salvos;
  });

  it("EDGE-02: sem arquivo nos últimos 7 dias, falha e mantém as sanções anteriores", async (ctx) => {
    if (!disponivel) ctx.skip();
    const salvos = arquivos;
    arquivos = {};
    pedidos.length = 0;
    await expect(coletarSancoes(db, cliente(), HOJE)).rejects.toThrow("nenhum arquivo do CEIS nos últimos 7 dias");
    expect(pedidos.filter((u) => u.endsWith(".zip"))).toHaveLength(8);
    expect((await sancoes()).map((r) => r.codigo)).toEqual(["101", "201"]);
    arquivos = salvos;
  });
});
