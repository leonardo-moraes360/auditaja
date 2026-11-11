import { sql, type Kysely } from "kysely";

/** Busca por nome sem diferenciar acentos ("Acacio" encontra "Acácio"). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function up(db: Kysely<any>): Promise<void> {
  await sql`create extension if not exists unaccent`.execute(db);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function down(db: Kysely<any>): Promise<void> {
  await sql`drop extension if exists unaccent`.execute(db);
}
