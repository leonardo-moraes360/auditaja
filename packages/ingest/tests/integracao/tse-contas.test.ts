import iconv from "iconv-lite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import yazl from "yazl";
import { createDb } from "@auditaja/db/client";
import { migrateToLatest } from "@auditaja/db/migrate";
import { SEED, semear } from "@auditaja/db/seed";
import { ClienteEducado } from "../../src/http";
import { coletarDespesasCampanha, urlContas } from "../../src/tse";
import { comDv } from "@auditaja/core/fixtures/cnpj";

/** CICLO-01, CICLO-02: ZIP falso da prestação de contas do TSE → banco real. */
const URL_TESTE = process.env.TEST_DATABASE_URL ?? "postgres://auditaja:auditaja@127.0.0.1:5436/auditaja_trilha_test";
const db = createDb(URL_TESTE);
let disponivel = true;

/** Cabeçalho real de despesas_contratadas_candidatos_2022_BRASIL.csv (conferido no ZIP de 08/11/2026). */
const CAB = [
  "DT_GERACAO",
  "HH_GERACAO",
  "AA_ELEICAO",
  "CD_TIPO_ELEICAO",
  "NM_TIPO_ELEICAO",
  "CD_ELEICAO",
  "DS_ELEICAO",
  "DT_ELEICAO",
  "ST_TURNO",
  "TP_PRESTACAO_CONTAS",
  "DT_PRESTACAO_CONTAS",
  "SQ_PRESTADOR_CONTAS",
  "SG_UF",
  "SG_UE",
  "NM_UE",
  "NR_CNPJ_PRESTADOR_CONTA",
  "CD_CARGO",
  "DS_CARGO",
  "SQ_CANDIDATO",
  "NR_CANDIDATO",
  "NM_CANDIDATO",
  "NR_CPF_CANDIDATO",
  "NR_CPF_VICE_CANDIDATO",
  "NR_PARTIDO",
  "SG_PARTIDO",
  "NM_PARTIDO",
  "CD_TIPO_FORNECEDOR",
  "DS_TIPO_FORNECEDOR",
  "CD_CNAE_FORNECEDOR",
  "DS_CNAE_FORNECEDOR",
  "NR_CPF_CNPJ_FORNECEDOR",
  "NM_FORNECEDOR",
  "NM_FORNECEDOR_RFB",
  "CD_ESFERA_PART_FORNECEDOR",
  "DS_ESFERA_PART_FORNECEDOR",
  "SG_UF_FORNECEDOR",
  "CD_MUNICIPIO_FORNECEDOR",
  "NM_MUNICIPIO_FORNECEDOR",
  "SQ_CANDIDATO_FORNECEDOR",
  "NR_CANDIDATO_FORNECEDOR",
  "CD_CARGO_FORNECEDOR",
  "DS_CARGO_FORNECEDOR",
  "NR_PARTIDO_FORNECEDOR",
  "SG_PARTIDO_FORNECEDOR",
  "NM_PARTIDO_FORNECEDOR",
  "DS_TIPO_DOCUMENTO",
  "NR_DOCUMENTO",
  "CD_ORIGEM_DESPESA",
  "DS_ORIGEM_DESPESA",
  "SQ_DESPESA",
  "DT_DESPESA",
  "DS_DESPESA",
  "VR_DESPESA_CONTRATADA",
];
const GRAFICA = comDv("123456780001");

function despesa(
  sq: string,
  tipo: string,
  doc: string,
  nome: string,
  data: string,
  valor: string,
  cpfCand = "94331049515",
) {
  const v: Record<string, string> = Object.fromEntries(CAB.map((c) => [c, "#NULO"]));
  Object.assign(v, {
    AA_ELEICAO: "2022",
    SQ_CANDIDATO: sq,
    NM_CANDIDATO: "MARIA EXEMPLO DA SILVA",
    NR_CPF_CANDIDATO: cpfCand,
    DS_CARGO: "Deputado Federal",
    CD_TIPO_FORNECEDOR: tipo === "PESSOA JURÍDICA" ? "1" : "2",
    DS_TIPO_FORNECEDOR: tipo,
    NR_CPF_CNPJ_FORNECEDOR: doc,
    NM_FORNECEDOR: nome,
    NM_FORNECEDOR_RFB: nome,
    DT_DESPESA: data,
    DS_DESPESA: "IMPRESSOS",
    VR_DESPESA_CONTRATADA: valor,
  });
  return CAB.map((c) => `"${v[c]}"`).join(";");
}

const CSV = [
  CAB.map((c) => `"${c}"`).join(";"),
  despesa("seed-22", "PESSOA JURÍDICA", GRAFICA, "GRÁFICA EXEMPLO LTDA", "15/09/2022", "20.000,00"),
  despesa("seed-22", "PESSOA JURÍDICA", GRAFICA, "GRÁFICA EXEMPLO LTDA", "20/09/2022", "12.000,50"),
  // CICLO-02: fornecedor pessoa física.
  despesa("seed-22", "PESSOA FÍSICA", "12345678909", "JOANA CABO ELEITORAL", "16/09/2022", "800,00"),
  // CNPJ com dígito verificador errado.
  despesa("seed-22", "PESSOA JURÍDICA", "12345678000100", "DV ERRADO LTDA", "16/09/2022", "1,00"),
  // Candidatura de outra eleição (2026) da mesma parlamentar: não vale para 2022.
  despesa("seed-26", "PESSOA JURÍDICA", GRAFICA, "GRÁFICA EXEMPLO LTDA", "16/09/2022", "7,00"),
  // Candidato fora de `candidatura`.
  despesa("99999999999", "PESSOA JURÍDICA", GRAFICA, "GRÁFICA EXEMPLO LTDA", "16/09/2022", "5,00"),
].join("\r\n");

function zipar(arquivos: Record<string, string>): Promise<Buffer> {
  return new Promise((resolve) => {
    const z = new yazl.ZipFile();
    for (const [n, c] of Object.entries(arquivos)) z.addBuffer(iconv.encode(c, "latin1"), n);
    z.end();
    const partes: Buffer[] = [];
    z.outputStream.on("data", (c: Buffer) => partes.push(c));
    z.outputStream.on("end", () => resolve(Buffer.concat(partes)));
  });
}

let zip: Buffer;
const pedidos: string[] = [];
const cliente = () =>
  new ClienteEducado({
    intervaloMinMs: 0,
    dormir: async () => {},
    log: () => {},
    fetchImpl: (async (input: URL | string) => {
      const url = input.toString();
      pedidos.push(url);
      if (url.endsWith("/robots.txt")) return new Response("Not Found", { status: 404 });
      if (url === urlContas(2022)) return new Response(new Uint8Array(zip), { status: 200 });
      return new Response("", { status: 404 });
    }) as typeof fetch,
  });

beforeAll(async () => {
  try {
    await migrateToLatest(db);
    await semear(db);
    zip = await zipar({
      "receitas_candidatos_2022_BRASIL.csv": "x",
      "despesas_contratadas_candidatos_2022_BRASIL.csv": CSV,
      "despesas_pagas_candidatos_2022_BRASIL.csv": "x",
    });
  } catch {
    disponivel = false;
  }
});
afterAll(async () => {
  if (disponivel) await semear(db);
  await db.destroy();
});

describe("coletarDespesasCampanha", () => {
  it("CICLO-01: grava só fornecedor PJ dos candidatos casados, ligado por sq_candidato, com CNPJ, valor e data", async (ctx) => {
    if (!disponivel) ctx.skip();
    const r = await coletarDespesasCampanha(db, cliente(), 2022);
    expect(r).toEqual({ despesas: 2, fornecedorPf: 1, foraDaBase: 2, cnpjInvalido: 1 });
    expect(pedidos.filter((u) => u === urlContas(2022))).toHaveLength(1);
    const c = await db
      .selectFrom("coleta")
      .select(["id", "url", "fonte"])
      .where("fonte", "=", "tse_prestacao_contas")
      .executeTakeFirstOrThrow();
    const rows = await db
      .selectFrom("campanha_despesa")
      .select([
        "ano_eleicao",
        "sq_candidato",
        "parlamentar_id",
        "fornecedor_cnpj",
        "valor",
        "data_despesa",
        "coleta_id",
      ])
      .orderBy("data_despesa")
      .execute();
    expect(rows).toEqual([
      {
        ano_eleicao: 2022,
        sq_candidato: "seed-22",
        parlamentar_id: SEED.deputada,
        fornecedor_cnpj: GRAFICA,
        valor: "20000.00",
        data_despesa: "2022-09-15",
        coleta_id: c.id,
      },
      {
        ano_eleicao: 2022,
        sq_candidato: "seed-22",
        parlamentar_id: SEED.deputada,
        fornecedor_cnpj: GRAFICA,
        valor: "12000.50",
        data_despesa: "2022-09-20",
        coleta_id: c.id,
      },
    ]);
  });

  it("CICLO-02: nada de nome ou CPF de fornecedor PF, nem do candidato", async (ctx) => {
    if (!disponivel) ctx.skip();
    const tudo = JSON.stringify(await db.selectFrom("campanha_despesa").selectAll().execute());
    for (const proibido of ["JOANA", "12345678909", "94331049515", "MARIA EXEMPLO", "GRÁFICA"]) {
      expect(tudo).not.toContain(proibido);
    }
  });

  it("coletar de novo substitui o ano, sem duplicar", async (ctx) => {
    if (!disponivel) ctx.skip();
    await coletarDespesasCampanha(db, cliente(), 2022);
    expect(await db.selectFrom("campanha_despesa").select("id").execute()).toHaveLength(2);
  });

  it("sem o arquivo nacional, junta os arquivos por UF", async (ctx) => {
    if (!disponivel) ctx.skip();
    const [cab, a, b] = CSV.split("\r\n");
    zip = await zipar({
      "despesas_contratadas_candidatos_2022_BA.csv": [cab, a].join("\r\n"),
      "despesas_contratadas_candidatos_2022_SP.csv": [cab, b].join("\r\n"),
    });
    const r = await coletarDespesasCampanha(db, cliente(), 2022);
    expect(r.despesas).toBe(2);
  });
});
