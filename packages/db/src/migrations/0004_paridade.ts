import type { Kysely } from "kysely";

/**
 * Campos que o protótipo aprovado exibe e o MVP ainda não guardava:
 * - parlamentar.sexo: `siglaSexo` do deputados.csv da Câmara ("F"/"M"), para "Deputada"/"Deputado".
 * - votacao.proposicao_sigla e proposicao_ementa: proposição principal votada, do arquivo
 *   votacoesObjetos-AAAA.csv (ex.: "PL 1234/2026" e a ementa dela).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema.alterTable("parlamentar").addColumn("sexo", "text").execute();
  await db.schema.alterTable("votacao").addColumn("proposicao_sigla", "text").execute();
  await db.schema.alterTable("votacao").addColumn("proposicao_ementa", "text").execute();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.alterTable("votacao").dropColumn("proposicao_ementa").execute();
  await db.schema.alterTable("votacao").dropColumn("proposicao_sigla").execute();
  await db.schema.alterTable("parlamentar").dropColumn("sexo").execute();
}
