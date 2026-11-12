import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import type { Readable } from "node:stream";
import { parse as parseStream } from "csv-parse";
import iconv from "iconv-lite";
import type { Insertable, Kysely } from "kysely";
import yauzl from "yauzl";
import type { CnpjAberturaTable, Database } from "@/db/types";
import { soDigitos } from "@/lib/privacy";
import { registrarColeta } from "./coleta";

/**
 * Lote "Estabelecimentos" do Cadastro Nacional da Pessoa Jurídica (Receita Federal).
 *
 * CNPJ-07, R7, D1: `arquivos.receitafederal.gov.br/robots.txt` responde `Disallow: /`. Este módulo
 * nunca faz requisição: só lê um ZIP que uma pessoa baixou à mão pelo navegador
 * (https://dados.gov.br/dados/conjuntos-dados/cadastro-nacional-da-pessoa-juridica---cnpj).
 *
 * CNPJ-02, R2/R3: do layout só lemos CNPJ, matriz/filial, início de atividade e CNAE principal.
 * Nome fantasia, endereço, telefone, e-mail e o arquivo de sócios nunca entram no banco.
 * Só grava CNPJs que já estão no banco (favorecido, recebedor ou fornecedor) e a matriz deles (D12).
 */
export const LICENCA_RECEITA = "Dados abertos do CNPJ (Receita Federal); dados abertos, Decreto 8.777/2016";
export const PAGINA_RECEITA = "https://dados.gov.br/dados/conjuntos-dados/cadastro-nacional-da-pessoa-juridica---cnpj";

/** Posições (0-based) no CSV sem cabeçalho do layout "Estabelecimentos". */
const COL = { basico: 0, ordem: 1, dv: 2, matriz: 3, inicio: 10, cnae: 11 } as const;

/**
 * EDGE-06: "AAAA-MM" do lote. Primeiro pela pasta do download (".../2026-10/Estabelecimentos0.zip"),
 * depois pelo nome da entrada do ZIP ("K3241.K03200Y0.D61010.ESTABELE" → gerado em 2026-10).
 */
export function mesDoLote(caminho: string, entrada?: string): string {
  const daPasta = /(?:^|[^\d])(20\d{2})-(0[1-9]|1[0-2])(?:[^\d]|$)/.exec(caminho);
  if (daPasta) return `${daPasta[1]}-${daPasta[2]}`;
  const daEntrada = /\.D(\d)(0[1-9]|1[0-2])(\d{2})\./.exec(entrada ?? "");
  if (daEntrada) return `202${daEntrada[1]}-${daEntrada[2]}`;
  throw new Error(
    `não consegui saber o mês do lote em "${caminho}": deixe o ZIP numa pasta com o mês (ex.: 2026-10/Estabelecimentos0.zip)`,
  );
}

/** "2026-10" → "10/2026". */
export function mesBr(mes: string): string {
  return `${mes.slice(5, 7)}/${mes.slice(0, 4)}`;
}

function abrirPrimeiraEntrada(caminho: string): Promise<{ nome: string; stream: Readable }> {
  return new Promise((resolve, reject) => {
    yauzl.open(caminho, { lazyEntries: true }, (err, z) => {
      if (err || !z) return reject(err ?? new Error("zip inválido"));
      let achou = false;
      z.on("entry", (e: yauzl.Entry) => {
        if (e.fileName.endsWith("/")) return z.readEntry();
        achou = true;
        z.openReadStream(e, (err2, s) => {
          if (err2 || !s) return reject(err2);
          s.on("end", () => z.close());
          resolve({ nome: e.fileName, stream: s });
        });
      });
      z.on("end", () => {
        if (!achou) reject(new Error("ZIP sem arquivo de estabelecimentos"));
      });
      z.readEntry();
    });
  });
}

async function sha256DoArquivo(caminho: string): Promise<string> {
  const h = createHash("sha256");
  for await (const parte of createReadStream(caminho)) h.update(parte as Buffer);
  return h.digest("hex");
}

function dataReceita(s: string | undefined): string | null {
  const m = /^(\d{4})(\d{2})(\d{2})$/.exec((s ?? "").trim());
  if (!m || m[1] === "0000") return null;
  return `${m[1]}-${m[2]}-${m[3]}`;
}

/** CNPJs (14 dígitos) que a trilha e as outras seções podem precisar datar. */
async function cnpjsConhecidos(db: Kysely<Database>): Promise<Set<string>> {
  const [pag, fav, ceap, camp] = await Promise.all([
    db.selectFrom("transf_pagamento").select("recebedor_cnpj as d").distinct().where("tipo", "=", "pj").execute(),
    db
      .selectFrom("emenda_favorecido")
      .select("favorecido_doc as d")
      .distinct()
      .where("tipo_favorecido", "<>", "Pessoa Fisica")
      .execute(),
    db
      .selectFrom("despesa_ceap")
      .select("fornecedor_doc as d")
      .distinct()
      .where("fornecedor_classe", "=", "pessoa_juridica")
      .execute(),
    db.selectFrom("campanha_despesa").select("fornecedor_cnpj as d").distinct().execute(),
  ]);
  return new Set([...pag, ...fav, ...ceap, ...camp].map((r) => soDigitos(r.d)).filter((d) => d.length === 14));
}

export type ResumoReceita = { mes: string; linhas: number; gravados: number; matrizes: number };

/**
 * CNPJ-01, CNPJ-02, CNPJ-06, CNPJ-07, EDGE-05, EDGE-06. Repetir para Estabelecimentos0..9.zip do
 * mesmo mês acumula; um lote de mês mais novo substitui os meses anteriores; um mais antigo é recusado.
 */
export async function importarEstabelecimentos(db: Kysely<Database>, caminho: string): Promise<ResumoReceita> {
  const { nome, stream } = await abrirPrimeiraEntrada(caminho);
  const mes = mesDoLote(caminho, nome);
  const vigente =
    (
      await db
        .selectFrom("cnpj_abertura")
        .select((eb) => eb.fn.max("base_mes").as("m"))
        .executeTakeFirst()
    )?.m ?? null;
  if (vigente && mes < vigente) {
    stream.destroy();
    throw new Error(`lote de ${mesBr(mes)} é anterior ao lote vigente de ${mesBr(vigente)}; baixe o lote mais recente`);
  }

  const conhecidos = await cnpjsConhecidos(db);
  const basicos = new Set([...conhecidos].map((c) => c.slice(0, 8)));
  const linhas: Omit<Insertable<CnpjAberturaTable>, "coleta_id">[] = [];
  let lidas = 0;
  const parser = stream
    .pipe(iconv.decodeStream("latin1"))
    .pipe(parseStream({ delimiter: ";", relax_quotes: true, relax_column_count: true, skip_empty_lines: true }));
  for await (const l of parser as AsyncIterable<string[]>) {
    lidas++;
    const basico = soDigitos(l[COL.basico]).padStart(8, "0");
    if (!basicos.has(basico)) continue;
    const cnpj = basico + soDigitos(l[COL.ordem]).padStart(4, "0") + soDigitos(l[COL.dv]).padStart(2, "0");
    const matriz = (l[COL.matriz] ?? "").trim() === "1";
    if (!conhecidos.has(cnpj) && !matriz) continue;
    linhas.push({
      cnpj,
      cnpj_basico: basico,
      matriz,
      inicio_atividade: dataReceita(l[COL.inicio]),
      cnae_principal: soDigitos(l[COL.cnae]) || null,
      base_mes: mes,
    });
  }

  const sha256 = await sha256DoArquivo(caminho);
  const bytes = (await stat(caminho)).size;
  await db.transaction().execute(async (trx) => {
    const coletaId = await registrarColeta(trx, {
      fonte: "receita_estabelecimentos",
      url: `file://${path.basename(caminho)}`,
      sha256,
      bytes,
      licenca: LICENCA_RECEITA,
      observacao: `base de ${mesBr(mes)} · ${path.basename(caminho)} (${nome}), baixado à mão de ${PAGINA_RECEITA}`,
    });
    if (vigente && mes > vigente) await trx.deleteFrom("cnpj_abertura").where("base_mes", "<", mes).execute();
    const comColeta = linhas.map((l) => ({ ...l, coleta_id: coletaId }));
    for (let i = 0; i < comColeta.length; i += 1000) {
      await trx
        .insertInto("cnpj_abertura")
        .values(comColeta.slice(i, i + 1000))
        .onConflict((oc) =>
          oc.column("cnpj").doUpdateSet((eb) => ({
            cnpj_basico: eb.ref("excluded.cnpj_basico"),
            matriz: eb.ref("excluded.matriz"),
            inicio_atividade: eb.ref("excluded.inicio_atividade"),
            cnae_principal: eb.ref("excluded.cnae_principal"),
            base_mes: eb.ref("excluded.base_mes"),
            coleta_id: eb.ref("excluded.coleta_id"),
          })),
        )
        .execute();
    }
  });
  return { mes, linhas: lidas, gravados: linhas.length, matrizes: linhas.filter((l) => l.matriz).length };
}
