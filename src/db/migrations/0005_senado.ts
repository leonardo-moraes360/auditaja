import { sql, type Kysely } from "kysely";

/**
 * Senado Federal no mesmo esquema do deputado:
 * - parlamentar.casa aceita 'senado'; mandato, participação ("Titular", "1º Suplente") e bloco;
 * - suplente: suplentes atuais de cada senador, na ordem publicada pelo Senado;
 * - votacao.secreta: o Senado não publica o voto em votação secreta, só que o senador votou.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function up(db: Kysely<any>): Promise<void> {
  await sql`alter table parlamentar drop constraint if exists parlamentar_casa_check`.execute(db);
  await sql`alter table parlamentar add constraint parlamentar_casa_check check (casa in ('camara', 'senado'))`.execute(
    db,
  );
  await db.schema
    .alterTable("parlamentar")
    .addColumn("mandato_inicio", "date")
    .addColumn("mandato_fim", "date")
    .addColumn("participacao", "text")
    .addColumn("bloco", "text")
    .execute();
  await db.schema
    .createTable("suplente")
    .addColumn("parlamentar_id", "integer", (c) => c.notNull().references("parlamentar.id").onDelete("cascade"))
    .addColumn("ordem", "integer", (c) => c.notNull())
    .addColumn("nome", "text", (c) => c.notNull())
    .addColumn("codigo", "integer")
    .addColumn("coleta_id", "integer", (c) => c.notNull().references("coleta.id"))
    .addPrimaryKeyConstraint("suplente_pk", ["parlamentar_id", "ordem"])
    .execute();
  await db.schema
    .alterTable("votacao")
    .addColumn("secreta", "boolean", (c) => c.notNull().defaultTo(false))
    .execute();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.alterTable("votacao").dropColumn("secreta").execute();
  await db.schema.dropTable("suplente").ifExists().execute();
  await db.schema
    .alterTable("parlamentar")
    .dropColumn("bloco")
    .dropColumn("participacao")
    .dropColumn("mandato_fim")
    .dropColumn("mandato_inicio")
    .execute();
  await sql`delete from parlamentar where casa = 'senado'`.execute(db);
  await sql`alter table parlamentar drop constraint if exists parlamentar_casa_check`.execute(db);
  await sql`alter table parlamentar add constraint parlamentar_casa_check check (casa in ('camara'))`.execute(db);
}
