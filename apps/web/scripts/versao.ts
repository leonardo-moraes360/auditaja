/**
 * Sobe a versão do site (semver): `pnpm versao patch|minor|major`.
 * Atualiza package.json e fecha a seção "Não publicado" do CHANGELOG.md com a data de hoje.
 * Não faz commit nem tag: mostra os comandos para você revisar antes.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fecharChangelog, subirVersao, type TipoVersao } from "../src/lib/semver";

const tipo = process.argv[2] as TipoVersao;
if (!["patch", "minor", "major"].includes(tipo)) {
  console.error("Uso: pnpm versao patch|minor|major");
  process.exit(1);
}

const raiz = process.cwd();
const caminhoPkg = join(raiz, "package.json");
// O CHANGELOG fica na raiz do monorepo; o package.json com a versão do site, em apps/web.
const caminhoLog = join(raiz, "../../CHANGELOG.md");
const pkgTexto = readFileSync(caminhoPkg, "utf8");
const pkg = JSON.parse(pkgTexto) as { version: string };
const nova = subirVersao(pkg.version, tipo);
const hoje = new Date().toISOString().slice(0, 10);

const changelog = fecharChangelog(readFileSync(caminhoLog, "utf8"), nova, hoje);
writeFileSync(caminhoPkg, pkgTexto.replace(`"version": "${pkg.version}"`, `"version": "${nova}"`));
writeFileSync(caminhoLog, changelog);

console.log(`${pkg.version} -> ${nova}. Revise e registre:`);
console.log(`  git commit -am "chore(versao): ${nova}" && git tag v${nova}`);
