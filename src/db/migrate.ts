import type { Kysely } from "kysely";
import { Migrator, type Migration, type MigrationProvider } from "kysely/migration";
import * as m0001 from "./migrations/0001_init";
import * as m0002 from "./migrations/0002_busca";
import * as m0003 from "./migrations/0003_blocos";

/** Lista explícita: funciona igual em scripts, testes e build. */
const provider: MigrationProvider = {
  async getMigrations(): Promise<Record<string, Migration>> {
    return { "0001_init": m0001, "0002_busca": m0002, "0003_blocos": m0003 };
  },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function migrateToLatest(db: Kysely<any>) {
  const migrator = new Migrator({ db, provider });
  const { error, results } = await migrator.migrateToLatest();
  for (const r of results ?? []) {
    if (r.status === "Error") console.error(`migração ${r.migrationName} falhou`);
  }
  if (error) throw error;
  return results ?? [];
}
