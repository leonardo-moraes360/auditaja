import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const invPath = join(root, ".toolbelt", "invariants.yaml");

if (!existsSync(invPath)) {
  console.error("suite oculta: .toolbelt/invariants.yaml ausente");
  process.exit(1);
}

const text = readFileSync(invPath, "utf8");
const need = ["R3", "Prestador pessoa fisica", "mascara"];
for (const needle of need) {
  if (!text.includes(needle)) {
    console.error(`suite oculta: invariante R3 incompleta (faltou ${needle})`);
    process.exit(1);
  }
}

console.log("suite oculta: invariantes R3 ok");
