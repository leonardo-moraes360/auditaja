import { sql, type Kysely } from "kysely";

/**
 * Executivo e Judiciário no mesmo esquema de pessoa (parlamentar):
 * - casa aceita 'executivo', 'stf' e 'stj' além de 'camara' e 'senado';
 * - cargo: presidente | vice_presidente | ministro | … (texto livre curto);
 * - orgao: pasta ministerial ou tribunal (ex.: "Fazenda", "STF");
 * - despesa_titular: gastos públicos do titular (cartão/diárias/auxílios), com R3.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function up(db: Kysely<any>): Promise<void> {
  await sql`alter table parlamentar drop constraint if exists parlamentar_casa_check`.execute(db);
  await sql`
    alter table parlamentar
    add constraint parlamentar_casa_check
    check (casa in ('camara', 'senado', 'executivo', 'stf', 'stj'))
  `.execute(db);
  await db.schema.alterTable("parlamentar").addColumn("cargo", "text").addColumn("orgao", "text").execute();
  await db.schema
    .createTable("despesa_titular")
    .addColumn("id", "bigserial", (c) => c.primaryKey())
    .addColumn("parlamentar_id", "integer", (c) => c.notNull().references("parlamentar.id").onDelete("cascade"))
    .addColumn("ano", "integer", (c) => c.notNull())
    .addColumn("mes", "integer", (c) => c.notNull())
    .addColumn("tipo_despesa", "text", (c) => c.notNull())
    .addColumn("fornecedor_nome", "text", (c) => c.notNull())
    .addColumn("fornecedor_doc", "text")
    .addColumn("fornecedor_classe", "text", (c) => c.notNull())
    .addColumn("data_emissao", "date")
    .addColumn("valor_liquido", "decimal(14, 2)", (c) => c.notNull())
    .addColumn("url_documento", "text")
    .addColumn("coleta_id", "integer", (c) => c.notNull().references("coleta.id"))
    .execute();
  await db.schema
    .createIndex("despesa_titular_titular_ano_idx")
    .on("despesa_titular")
    .columns(["parlamentar_id", "ano"])
    .execute();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("despesa_titular").ifExists().execute();
  await db.schema.alterTable("parlamentar").dropColumn("orgao").dropColumn("cargo").execute();
  await sql`delete from parlamentar where casa in ('executivo', 'stf', 'stj')`.execute(db);
  await sql`alter table parlamentar drop constraint if exists parlamentar_casa_check`.execute(db);
  await sql`alter table parlamentar add constraint parlamentar_casa_check check (casa in ('camara', 'senado'))`.execute(
    db,
  );
}
