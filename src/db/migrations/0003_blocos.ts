import type { Kysely } from "kysely";

/**
 * Blocos parlamentares e seus partidos (API v2 da Câmara, /blocos e /blocos/{id}/partidos).
 * A Câmara publica a orientação de bloco com o nome truncado ("Bl UniPpPsd..."); esta
 * tabela diz quais partidos o bloco reúne, inclusive os que ficaram fora da abreviação.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("bloco")
    .addColumn("id", "integer", (c) => c.primaryKey())
    .addColumn("nome", "text", (c) => c.notNull())
    .addColumn("id_legislatura", "integer", (c) => c.notNull())
    .addColumn("federacao", "boolean", (c) => c.notNull())
    .addColumn("coleta_id", "integer", (c) => c.notNull().references("coleta.id"))
    .execute();

  await db.schema
    .createTable("bloco_partido")
    .addColumn("bloco_id", "integer", (c) => c.notNull().references("bloco.id").onDelete("cascade"))
    .addColumn("sigla_partido", "text", (c) => c.notNull())
    // "api": /blocos/{id}/partidos; "nome": a API veio vazia e a lista saiu do nome do bloco.
    .addColumn("origem", "text", (c) => c.notNull())
    .addColumn("coleta_id", "integer", (c) => c.notNull().references("coleta.id"))
    .addPrimaryKeyConstraint("bloco_partido_pk", ["bloco_id", "sigla_partido"])
    .execute();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("bloco_partido").ifExists().execute();
  await db.schema.dropTable("bloco").ifExists().execute();
}
