import { Kysely, PostgresDialect } from "kysely";
import pg from "pg";
import type { Database } from "./types";

// numeric (1700) e int8 (20) chegam como string; mantemos assim para não perder precisão.
// date (1082) fica como string ISO "YYYY-MM-DD" para evitar deslocamento de fuso.
pg.types.setTypeParser(1082, (v) => v);

export function createDb(connectionString = process.env.DATABASE_URL) {
  if (!connectionString) {
    throw new Error("DATABASE_URL não definido. Veja .env.example.");
  }
  return new Kysely<Database>({
    dialect: new PostgresDialect({
      pool: new pg.Pool({ connectionString, max: 5 }),
    }),
  });
}

const globalForDb = globalThis as unknown as { __auditajaDb?: Kysely<Database> };

/** Instância única para o app Next.js (evita vários pools no hot reload). */
export function getDb(): Kysely<Database> {
  if (!globalForDb.__auditajaDb) globalForDb.__auditajaDb = createDb();
  return globalForDb.__auditajaDb;
}
