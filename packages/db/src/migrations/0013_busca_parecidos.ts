import { sql, type Kysely } from "kysely";

/** Busca tolerante a erro de digitação ("nicolas" encontra "Nikolas"): similaridade por trigramas. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function up(db: Kysely<any>): Promise<void> {
  await sql`create extension if not exists pg_trgm`.execute(db);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function down(db: Kysely<any>): Promise<void> {
  await sql`drop extension if exists pg_trgm`.execute(db);
}
