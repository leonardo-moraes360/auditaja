import type { Readable } from "node:stream";
import { parse as parseStream } from "csv-parse";
import { parse } from "csv-parse/sync";
import iconv from "iconv-lite";
import yauzl from "yauzl";

export type Linha = Record<string, string>;

/** CSV com `;` e aspas, como publicam Câmara e TSE. */
export function lerCsv(buf: Buffer, encoding: "utf8" | "latin1" = "utf8"): Linha[] {
  const texto = encoding === "utf8" ? buf.toString("utf8") : iconv.decode(buf, "latin1");
  return parse(texto, {
    columns: true,
    delimiter: ";",
    bom: true,
    skip_empty_lines: true,
    relax_quotes: true,
    relax_column_count: true,
    trim: true,
  }) as Linha[];
}

/** Extrai uma entrada de um ZIP em memória. `nome` pode ser um predicado. */
export function extrairDoZip(zip: Buffer, nome: string | ((n: string) => boolean)): Promise<Buffer> {
  const casa = typeof nome === "string" ? (n: string) => n === nome : nome;
  return new Promise((resolve, reject) => {
    yauzl.fromBuffer(zip, { lazyEntries: true }, (err, z) => {
      if (err || !z) return reject(err ?? new Error("zip inválido"));
      let achou = false;
      z.on("entry", (e: yauzl.Entry) => {
        if (!casa(e.fileName)) return z.readEntry();
        achou = true;
        z.openReadStream(e, (err2, s) => {
          if (err2 || !s) return reject(err2);
          const partes: Buffer[] = [];
          s.on("data", (c: Buffer) => partes.push(c));
          s.on("end", () => {
            z.close();
            resolve(Buffer.concat(partes));
          });
          s.on("error", reject);
        });
      });
      z.on("end", () => {
        if (!achou) reject(new Error("entrada não encontrada no zip"));
      });
      z.readEntry();
    });
  });
}

/** Abre uma entrada de um ZIP em memória como stream, sem descompactá-la inteira. */
function abrirEntrada(zip: Buffer, casa: (n: string) => boolean): Promise<Readable> {
  return new Promise((resolve, reject) => {
    yauzl.fromBuffer(zip, { lazyEntries: true }, (err, z) => {
      if (err || !z) return reject(err ?? new Error("zip inválido"));
      let achou = false;
      z.on("entry", (e: yauzl.Entry) => {
        if (!casa(e.fileName)) return z.readEntry();
        achou = true;
        z.openReadStream(e, (err2, s) => {
          if (err2 || !s) return reject(err2);
          s.on("end", () => z.close());
          resolve(s);
        });
      });
      z.on("end", () => {
        if (!achou) reject(new Error("entrada não encontrada no zip"));
      });
      z.readEntry();
    });
  });
}

/**
 * Lê um CSV de dentro de um ZIP linha a linha (`;`, aspas, cabeçalho), decodificando em stream.
 * Serve para arquivos grandes, como os 183 MB de favorecidos de emendas do Portal da Transparência.
 */
export async function* linhasCsvDoZip(
  zip: Buffer,
  nome: string | ((n: string) => boolean),
  encoding: "utf8" | "latin1" = "latin1",
): AsyncGenerator<Linha> {
  const entrada = await abrirEntrada(zip, typeof nome === "string" ? (n) => n === nome : nome);
  const parser = entrada.pipe(iconv.decodeStream(encoding)).pipe(
    parseStream({
      columns: true,
      delimiter: ";",
      bom: true,
      skip_empty_lines: true,
      relax_quotes: true,
      relax_column_count: true,
      trim: true,
    }),
  );
  for await (const linha of parser) yield linha as Linha;
}

/** Data de modificação de uma entrada do ZIP (a data em que o órgão gerou o arquivo). */
export function dataDaEntrada(zip: Buffer, nome: string): Promise<Date> {
  return new Promise((resolve, reject) => {
    yauzl.fromBuffer(zip, { lazyEntries: true }, (err, z) => {
      if (err || !z) return reject(err ?? new Error("zip inválido"));
      let achou = false;
      z.on("entry", (e: yauzl.Entry) => {
        if (e.fileName !== nome) return z.readEntry();
        achou = true;
        z.close();
        resolve(e.getLastModDate());
      });
      z.on("end", () => {
        if (!achou) reject(new Error("entrada não encontrada no zip"));
      });
      z.readEntry();
    });
  });
}

// Mora no núcleo porque o domínio (emendas) também casa nomes; reexportado para os coletores.
export { normalizarNome } from "@auditaja/core/nomes";

/** "dd/mm/aaaa" → "aaaa-mm-dd"; devolve null para valores ausentes ou mascarados. */
export function dataBrParaIso(s: string | null | undefined): string | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec((s ?? "").trim());
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
}

export function idDaUri(uri: string): number | null {
  const m = /\/(\d+)\/?$/.exec(uri ?? "");
  return m ? Number(m[1]) : null;
}
