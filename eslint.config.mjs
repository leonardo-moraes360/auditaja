import { readFileSync } from "node:fs";
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// O React só é instalado em apps/web; o "detect" do eslint-plugin-react não o acha a partir da raiz.
const { dependencies } = JSON.parse(readFileSync(new URL("./apps/web/package.json", import.meta.url), "utf8"));

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // O app Next mora em apps/web (monorepo).
  { settings: { next: { rootDir: "apps/web/" }, react: { version: dependencies.react } } },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next, em qualquer pacote:
    "**/.next/**",
    "**/out/**",
    "**/build/**",
    "**/next-env.d.ts",
  ]),
]);

export default eslintConfig;
