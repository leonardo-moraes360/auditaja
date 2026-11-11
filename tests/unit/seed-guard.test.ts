import { spawnSync } from "node:child_process";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("EDGE-05: seed só roda em banco _test", () => {
  it("recusa banco de desenvolvimento e sai com código 1", () => {
    const raiz = path.resolve(import.meta.dirname, "../..");
    const r = spawnSync(path.join(raiz, "node_modules/.bin/tsx"), ["scripts/seed.ts"], {
      cwd: raiz,
      env: { ...process.env, DATABASE_URL: "postgres://u:p@127.0.0.1:1/auditaja" },
      encoding: "utf8",
      timeout: 30_000,
    });
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("Seed recusado");
  });
});
