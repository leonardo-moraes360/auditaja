import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/unit/**/*.test.ts", "tests/integracao/**/*.test.ts"],
    fileParallelism: false,
    // `pnpm test <filtro>` roda em todos os pacotes; pacote sem arquivo correspondente não é falha.
    passWithNoTests: true,
  },
});
