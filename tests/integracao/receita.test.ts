import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import iconv from "iconv-lite";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import yazl from "yazl";
import { createDb } from "@/db/client";
import { migrateToLatest } from "@/db/migrate";
import { SEED, semear } from "@/db/seed";
import { importarEstabelecimentos, LICENCA_RECEITA, mesDoLote } from "@/ingest/receita";
import { comDv } from "../fixtures/cnpj";

/** CNPJ-01, CNPJ-02, CNPJ-06, CNPJ-07, EDGE-05, EDGE-06: ZIP local falso → banco real. */
const URL_TESTE = process.env.TEST_DATABASE_URL ?? "postgres://auditaja:auditaja@127.0.0.1:5436/auditaja_trilha_test";
const db = createDb(URL_TESTE);
let disponivel = true;
let dir = "";

/** Matriz paga pelo município (conhecida). */
const PAGA = comDv("196813770001");
/** Filial nova de empresa antiga: só a filial é conhecida; a matriz entra pelo CNPJ básico (D12). */
const FILIAL = comDv("118543340002");
const MATRIZ_DA_FILIAL = comDv("118543340001");
/** Outra filial do mesmo CNPJ básico, desconhecida: não entra. */
const OUTRA_FILIAL = comDv("118543340003");
/** Empresa que não está no banco. */
const ESTRANHA = comDv("999888770001");

/** Linha do layout "Estabelecimentos" (30 colunas, sem cabeçalho), com endereço e contato. */
const linha = (cnpj: string, matriz: "1" | "2", inicio: string, cnae: string) =>
  [
    cnpj.slice(0, 8),
    cnpj.slice(8, 12),
    cnpj.slice(12),
    matriz,
    "NOME FANTASIA SECRETO",
    "02",
    "20200101",
    "00",
    "",
    "",
    inicio,
    cnae,
    "4744099,4789099",
    "RUA",
    "DAS FLORES SECRETA",
    "123",
    "SALA 4",
    "BAIRRO SECRETO",
    "01000000",
    "SP",
    "7107",
    "11",
    "55554444",
    "",
    "",
    "",
    "",
    "contato.secreto@example.com",
    "",
    "",
  ]
    .map((c) => `"${c}"`)
    .join(";");

function zipar(entrada: string, csv: string): Promise<Buffer> {
  return new Promise((resolve) => {
    const z = new yazl.ZipFile();
    z.addBuffer(iconv.encode(csv, "latin1"), entrada);
    z.end();
    const partes: Buffer[] = [];
    z.outputStream.on("data", (c: Buffer) => partes.push(c));
    z.outputStream.on("end", () => resolve(Buffer.concat(partes)));
  });
}

async function lote(mes: string, linhas: string[]) {
  await mkdir(path.join(dir, mes), { recursive: true });
  const arq = path.join(dir, mes, "Estabelecimentos0.zip");
  await writeFile(arq, await zipar("K3241.K03200Y0.D61010.ESTABELE", linhas.join("\n")));
  return arq;
}

beforeAll(async () => {
  try {
    await migrateToLatest(db);
    await semear(db);
    dir = await mkdtemp(path.join(tmpdir(), "auditaja-receita-"));
    const { coleta_id } = await db
      .selectFrom("parlamentar")
      .select("coleta_id")
      .where("id", "=", SEED.deputada)
      .executeTakeFirstOrThrow();
    await db
      .insertInto("transf_plano")
      .values({
        id_plano_acao: 1,
        codigo_emenda: "202690000002",
        codigo_plano: "0903-000001",
        parlamentar_id: SEED.deputada,
        beneficiario_cnpj: null,
        beneficiario_nome: null,
        beneficiario_uf: null,
        valor: 10,
        data_aceite: null,
        coleta_id,
      })
      .execute();
    await db
      .insertInto("transf_pagamento")
      .values(
        [PAGA, FILIAL].map((cnpj, i) => ({
          id: i + 1,
          id_plano_acao: 1,
          tipo: "pj" as const,
          recebedor_cnpj: cnpj,
          recebedor_nome: "X",
          valor: 1,
          data_pagamento: "2026-04-01",
          coleta_id,
        })),
      )
      .execute();
  } catch {
    disponivel = false;
  }
});
afterAll(async () => {
  if (disponivel) await semear(db);
  if (dir) await rm(dir, { recursive: true, force: true });
  await db.destroy();
});

const LINHAS = [
  linha(PAGA, "1", "20250212", "4120400"),
  linha(MATRIZ_DA_FILIAL, "1", "19940921", "4645101"),
  linha(FILIAL, "2", "20260301", "4645101"),
  linha(OUTRA_FILIAL, "2", "20260301", "4645101"),
  linha(ESTRANHA, "1", "20260301", "4120400"),
];

describe("mesDoLote (EDGE-06)", () => {
  it("lê o mês da pasta do download", () => {
    expect(mesDoLote("/home/x/receita/2026-10/Estabelecimentos3.zip")).toBe("2026-10");
  });
  it("sem pasta com mês, usa a data de geração no nome da entrada", () => {
    expect(mesDoLote("/home/x/Estabelecimentos3.zip", "K3241.K03200Y0.D60913.ESTABELE")).toBe("2026-09");
  });
  it("sem nenhum dos dois, recusa", () => {
    expect(() => mesDoLote("/home/x/Estabelecimentos3.zip", "ESTABELE")).toThrow(/mês do lote/);
  });
});

describe("importarEstabelecimentos", () => {
  it("CNPJ-01, D12: grava só CNPJs do banco e a matriz deles, com início de atividade, CNAE e mês", async (ctx) => {
    if (!disponivel) ctx.skip();
    const arq = await lote("2026-10", LINHAS);
    const r = await importarEstabelecimentos(db, arq);
    expect(r).toEqual({ mes: "2026-10", linhas: 5, gravados: 3, matrizes: 2 });
    const rows = await db
      .selectFrom("cnpj_abertura")
      .select(["cnpj", "cnpj_basico", "matriz", "inicio_atividade", "cnae_principal", "base_mes"])
      .orderBy("cnpj")
      .execute();
    expect(rows).toEqual([
      {
        cnpj: MATRIZ_DA_FILIAL,
        cnpj_basico: "11854334",
        matriz: true,
        inicio_atividade: "1994-09-21",
        cnae_principal: "4645101",
        base_mes: "2026-10",
      },
      {
        cnpj: FILIAL,
        cnpj_basico: "11854334",
        matriz: false,
        inicio_atividade: "2026-03-01",
        cnae_principal: "4645101",
        base_mes: "2026-10",
      },
      {
        cnpj: PAGA,
        cnpj_basico: "19681377",
        matriz: true,
        inicio_atividade: "2025-02-12",
        cnae_principal: "4120400",
        base_mes: "2026-10",
      },
    ]);
    // CNPJ que não está no banco não é gravado, nem filial desconhecida de empresa conhecida.
    expect(rows.map((x) => x.cnpj)).not.toContain(ESTRANHA);
    expect(rows.map((x) => x.cnpj)).not.toContain(OUTRA_FILIAL);
  });

  it("CNPJ-01, CNPJ-06: registra a coleta com o arquivo local, SHA-256 do ZIP e a base do lote", async (ctx) => {
    if (!disponivel) ctx.skip();
    const c = await db
      .selectFrom("coleta")
      .selectAll()
      .where("fonte", "=", "receita_estabelecimentos")
      .orderBy("id", "desc")
      .executeTakeFirstOrThrow();
    const zip = await readFile(path.join(dir, "2026-10", "Estabelecimentos0.zip"));
    expect(c).toMatchObject({
      url: "file://Estabelecimentos0.zip",
      sha256: createHash("sha256").update(zip).digest("hex"),
      bytes: zip.length,
      licenca: LICENCA_RECEITA,
    });
    expect(c.observacao).toMatch(/^base de 10\/2026 · Estabelecimentos0\.zip/);
    const ids = await db.selectFrom("cnpj_abertura").select("coleta_id").distinct().execute();
    expect(ids).toEqual([{ coleta_id: c.id }]);
  });

  it("CNPJ-02: nenhum nome fantasia, endereço, telefone ou e-mail gravado", async (ctx) => {
    if (!disponivel) ctx.skip();
    const tudo = JSON.stringify(await db.selectFrom("cnpj_abertura").selectAll().execute());
    for (const proibido of ["SECRET", "FLORES", "01000000", "55554444", "@example.com", "4744099"]) {
      expect(tudo).not.toContain(proibido);
    }
  });

  it("repetir o mesmo arquivo não duplica", async (ctx) => {
    if (!disponivel) ctx.skip();
    await importarEstabelecimentos(db, path.join(dir, "2026-10", "Estabelecimentos0.zip"));
    expect(await db.selectFrom("cnpj_abertura").select("cnpj").execute()).toHaveLength(3);
  });

  it("EDGE-06: lote de mês anterior é recusado com mensagem que cita os dois meses, sem mexer no banco", async (ctx) => {
    if (!disponivel) ctx.skip();
    const antes = await db.selectFrom("cnpj_abertura").selectAll().orderBy("cnpj").execute();
    const arq = await lote("2026-09", [linha(PAGA, "1", "20000101", "4120400")]);
    await expect(importarEstabelecimentos(db, arq)).rejects.toThrow(
      "lote de 09/2026 é anterior ao lote vigente de 10/2026",
    );
    expect(await db.selectFrom("cnpj_abertura").selectAll().orderBy("cnpj").execute()).toEqual(antes);
  });

  it("lote de mês mais novo substitui o vigente", async (ctx) => {
    if (!disponivel) ctx.skip();
    const arq = await lote("2026-11", [linha(PAGA, "1", "20250213", "4120400")]);
    await importarEstabelecimentos(db, arq);
    const rows = await db.selectFrom("cnpj_abertura").select(["cnpj", "inicio_atividade", "base_mes"]).execute();
    expect(rows).toEqual([{ cnpj: PAGA, inicio_atividade: "2025-02-13", base_mes: "2026-11" }]);
  });

  it("CNPJ-07: não faz nenhuma requisição de rede", async (ctx) => {
    if (!disponivel) ctx.skip();
    const espiao = vi.spyOn(globalThis, "fetch");
    await importarEstabelecimentos(db, path.join(dir, "2026-11", "Estabelecimentos0.zip"));
    expect(espiao).not.toHaveBeenCalled();
    espiao.mockRestore();
  });
});

describe("CNPJ-07: o importador não tem caminho de rede", () => {
  it("o módulo não importa ClienteEducado, http nem fetch", async () => {
    const fonte = await readFile(path.resolve(import.meta.dirname, "../../src/ingest/receita.ts"), "utf8");
    expect(fonte).not.toMatch(
      /ClienteEducado|from "\.\/http"|from "node:https?"|\bfetch\(|https?:\/\/[^"\s]*receitafederal/,
    );
  });
});
