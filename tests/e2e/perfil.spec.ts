import { expect, test } from "@playwright/test";

const ID = 900000001; // dados fictícios de src/db/seed.ts

test("busca leva ao perfil", async ({ page }) => {
  await page.goto("/parlamentares?q=maria");
  await page.getByRole("link", { name: /Maria Exemplo/ }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Maria Exemplo" })).toBeVisible();
});

test("perfil mostra indicadores, fontes e regras de privacidade", async ({ page }) => {
  await page.goto(`/parlamentares/${ID}`);
  await expect(page.getByText("Cota parlamentar usada em 2026")).toBeVisible();
  await expect(page.getByText("67%").first()).toBeVisible(); // 2 de 3 votações
  await expect(page.getByText("50%").first()).toBeVisible(); // 1 de 2 com orientação
  await expect(page.getByText("***.456.789-**")).toBeVisible();
  await expect(page.getByText(/Fonte: Câmara dos Deputados, Dados Abertos \(CEAP/)).toBeVisible();
  await expect(page.getByText(/Encarregado \(LGPD\)/)).toBeVisible();
  const largura = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(largura).toBeLessThanOrEqual(page.viewportSize()!.width);
});

test("filtro de divergência", async ({ page }) => {
  await page.goto(`/parlamentares/${ID}?votos=divergiu`);
  await expect(page.getByText("Rejeitada a PEC fictícia 12/2026")).toBeVisible();
  await expect(page.getByText("Aprovado o PL fictício 1.234/2026")).toHaveCount(0);
});

test("pedido de correção é registrado", async ({ page }) => {
  await page.goto(`/parlamentares/${ID}/contestar?secao=gastos`);
  await page.getByLabel("O que está errado").fill("O valor de janeiro está duplicado segundo a nota original.");
  await page.getByRole("button", { name: "Enviar pedido" }).click();
  await expect(page.getByText("Pedido recebido.")).toBeVisible();
});

test("id inexistente mostra página não encontrada", async ({ page }) => {
  // Com streaming (loading.tsx) o status HTTP já saiu como 200; o Next marca a página como noindex.
  await page.goto("/parlamentares/1");
  await expect(page.getByRole("heading", { name: "Página não encontrada" })).toBeVisible();
  expect(await page.locator('meta[name="robots"][content*="noindex"]').count()).toBeGreaterThan(0);
});
