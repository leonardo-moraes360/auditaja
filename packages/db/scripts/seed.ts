import { createDb } from "../src/client";
import { migrateToLatest } from "../src/migrate";
import { semear } from "../src/seed";

/** Recria o banco apontado por DATABASE_URL só com dados fictícios. Apaga os dados existentes. */
const url = process.env.DATABASE_URL ?? "";
if (!/\/[a-z0-9_]+_test(\?|$)/.test(url)) {
  console.error("Seed recusado: só roda em banco cujo nome termina em _test.");
  process.exit(1);
}
const db = createDb(url);
migrateToLatest(db)
  .then(() => semear(db))
  .then(() => console.log("Seed fictício aplicado."))
  .finally(() => db.destroy());
