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

/** Normaliza nomes para casamento entre bases: sem acento, maiúsculo, espaços simples. */
export function normalizarNome(s: string | null | undefined): string {
  return (s ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toUpperCase()
    .replace(/[^A-Z ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** "dd/mm/aaaa" → "aaaa-mm-dd"; devolve null para valores ausentes ou mascarados. */
export function dataBrParaIso(s: string | null | undefined): string | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec((s ?? "").trim());
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
}

export function idDaUri(uri: string): number | null {
  const m = /\/(\d+)\/?$/.exec(uri ?? "");
  return m ? Number(m[1]) : null;
}
