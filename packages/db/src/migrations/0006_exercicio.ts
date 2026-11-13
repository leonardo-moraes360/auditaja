import type { Kysely } from "kysely";

/**
 * Períodos fora do exercício do mandato (licença, afastamento, antes da posse), montados a partir
 * de /deputados/{id}/historico da API v2 da Câmara. A presença deixa de contar votações nesses dias.
 * - parlamentar.historico_coleta_id: coleta do histórico do deputado; null = ainda não coletado
 *   (a presença cai na conta antiga e a página avisa).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("parlamentar")
    .addColumn("historico_coleta_id", "integer", (c) => c.references("coleta.id"))
    .execute();
  await db.schema
    .createTable("periodo_fora_exercicio")
    .addColumn("id", "serial", (c) => c.primaryKey())
    .addColumn("parlamentar_id", "integer", (c) => c.notNull().references("parlamentar.id").onDelete("cascade"))
    .addColumn("inicio", "date", (c) => c.notNull())
    .addColumn("fim", "date")
    .addColumn("situacao", "text", (c) => c.notNull())
    .addColumn("motivo", "text", (c) => c.notNull())
    .addColumn("source_url", "text", (c) => c.notNull())
    .addColumn("coleta_id", "integer", (c) => c.notNull().references("coleta.id"))
    .execute();
  await db.schema
    .createIndex("periodo_fora_exercicio_parlamentar")
    .on("periodo_fora_exercicio")
    .columns(["parlamentar_id", "inicio"])
    .execute();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("periodo_fora_exercicio").execute();
  await db.schema.alterTable("parlamentar").dropColumn("historico_coleta_id").execute();
}
