import { defineConfig, devices } from "@playwright/test";

/**
 * Smoke test sobre o banco de teste com dados fictícios.
 * Pré-requisitos: `pnpm db:up`, `pnpm db:seed:test` e `pnpm build`.
 * Se o Chromium do Playwright não estiver instalado na versão certa, aponte
 * PW_CHROME para um executável do Chrome/Chromium.
 */
/** Porta do servidor de teste; outra porta permite rodar worktrees em paralelo. */
const PORTA = process.env.E2E_PORT ?? "3212";
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL ?? "postgres://auditaja:auditaja@127.0.0.1:5436/auditaja_test";

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  reporter: "list",
  use: {
    baseURL: `http://127.0.0.1:${PORTA}`,
    launchOptions: process.env.PW_CHROME ? { executablePath: process.env.PW_CHROME } : {},
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    // EDGE-04: 390 px de largura, como no protótipo de celular.
    { name: "celular", use: { ...devices["Pixel 7"], viewport: { width: 390, height: 844 } } },
  ],
  webServer: {
    command: `pnpm start --port ${PORTA}`,
    url: `http://127.0.0.1:${PORTA}/metodologia`,
    reuseExistingServer: false,
    env: { DATABASE_URL: TEST_DATABASE_URL },
  },
});
