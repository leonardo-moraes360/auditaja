import type { Kysely } from "kysely";
import { Migrator, type Migration, type MigrationProvider } from "kysely/migration";
import * as m0001 from "./migrations/0001_init";
import * as m0002 from "./migrations/0002_busca";
import * as m0003 from "./migrations/0003_blocos";
import * as m0004 from "./migrations/0004_paridade";
import * as m0006 from "./migrations/0006_exercicio";
import * as m0007 from "./migrations/0007_emendas";
import * as m0008 from "./migrations/0008_senado";
import * as m0011 from "./migrations/0011_cpf_oculto";
import * as m0012 from "./migrations/0012_trilha";
import * as m0013 from "./migrations/0013_busca_parecidos";

/** Lista explícita: funciona igual em scripts, testes e build. */
const provider: MigrationProvider = {
  async getMigrations(): Promise<Record<string, Migration>> {
    return {
      "0001_init": m0001,
      "0002_busca": m0002,
      "0003_blocos": m0003,
      "0004_paridade": m0004,
      "0006_exercicio": m0006,
      "0007_emendas": m0007,
      "0008_senado": m0008,
      "0011_cpf_oculto": m0011,
      "0012_trilha": m0012,
      "0013_busca_parecidos": m0013,
    };
  },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function migrateToLatest(db: Kysely<any>) {
  // 0005 e 0006 (Senado, presença) podem entrar depois da 0007 em bancos já migrados.
  const migrator = new Migrator({ db, provider, allowUnorderedMigrations: true });
  const { error, results } = await migrator.migrateToLatest();
  for (const r of results ?? []) {
    if (r.status === "Error") console.error(`migração ${r.migrationName} falhou`);
  }
  if (error) throw error;
  return results ?? [];
}
