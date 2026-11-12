import type { Kysely } from "kysely";
import type { Database } from "@/db/types";

export const LICENCA_CAMARA = "Dados abertos da Câmara dos Deputados; licença não declarada pela fonte";
export const LICENCA_SENADO = "Dados abertos do Senado Federal; uso com atribuição da fonte";
export const LICENCA_TSE = "Portal de Dados Abertos do TSE; licença não declarada pela fonte";

/** R1: registra a origem de um lote coletado e devolve o id para os registros. */
export async function registrarColeta(
  db: Kysely<Database>,
  c: { fonte: string; url: string; sha256: string; bytes: number; licenca: string; observacao?: string },
): Promise<number> {
  const { id } = await db
    .insertInto("coleta")
    .values({ ...c, observacao: c.observacao ?? null, coletado_em: new Date() })
    .returning("id")
    .executeTakeFirstOrThrow();
  return id;
}

/** Insere em blocos para não estourar o limite de parâmetros do Postgres. */
export async function inserirEmBlocos(db: Kysely<Database>, tabela: keyof Database, linhas: object[], tamanho = 1000) {
  for (let i = 0; i < linhas.length; i += tamanho) {
    const bloco = linhas.slice(i, i + tamanho) as Parameters<ReturnType<typeof db.insertInto>["values"]>[0];
    await db.insertInto(tabela).values(bloco).execute();
  }
}
