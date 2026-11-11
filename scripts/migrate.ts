import { createDb } from "../src/db/client";
import { migrateToLatest } from "../src/db/migrate";

const db = createDb();
migrateToLatest(db)
  .then((r) => {
    console.log(r.length ? r.map((x) => `${x.migrationName}: ${x.status}`).join("\n") : "Banco já atualizado.");
  })
  .finally(() => db.destroy());
