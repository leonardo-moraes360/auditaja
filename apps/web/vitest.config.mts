import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "server-only": path.resolve(import.meta.dirname, "tests/stubs/server-only.ts"),
    },
  },
  test: {
    include: ["tests/unit/**/*.test.ts", "tests/integracao/**/*.test.ts"],
    fileParallelism: false,
    // `pnpm test <filtro>` roda em todos os pacotes; pacote sem arquivo correspondente não é falha.
    passWithNoTests: true,
  },
});
