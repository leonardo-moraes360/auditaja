import { expect, test } from "@playwright/test";

// Dados fictícios de src/db/seed.ts
const ID = 900000001; // Maria Exemplo: despesas, votos e bens
const SEM_DADOS = 900000002; // João Ilustrativo: sem despesas, votos ou bens

test("BUSCA-03: busca leva ao perfil", async ({ page }) => {
  await page.goto("/parlamentares?q=maria");
  await page.getByRole("link", { name: /Maria Exemplo/ }).click();
  await expect(page).toHaveURL(new RegExp(`/parlamentares/${ID}$`));
  await expect(page.getByRole("heading", { level: 1, name: "Maria Exemplo" })).toBeVisible();
});

test("indicadores do perfil", async ({ page }) => {
  await page.goto(`/parlamentares/${ID}`);
  await expect(page.getByText("Cota parlamentar usada em 2026")).toBeVisible();
  await expect(page.getByText("R$ 44 mil")).toBeVisible();
  await expect(page.getByText("67%").first()).toBeVisible(); // VOTO-01: 2 de 3
  await expect(page.getByText("2 de 3 em 2026")).toBeVisible();
  await expect(page.getByText("50%").first()).toBeVisible(); // VOTO-03: 1 de 2
  await expect(page.getByText("Divergiu em 1 de 2 votações")).toBeVisible();
  await expect(page.getByText("teto por UF em verificação")).toBeVisible(); // CEAP-05
  await expect(page.getByText("+18% sobre 2022, em valor nominal")).toBeVisible(); // BENS-02
});

test("PROV-02: cada seção mostra fonte, data de coleta e link para o original", async ({ page }) => {
  await page.goto(`/parlamentares/${ID}`);
  for (const secao of ["gastos", "votacoes", "bens"]) {
    const s = page.locator(`section#${secao}`);
    await expect(s.getByText(/^Fonte: .+ · coletado em \d{2}\/\d{2}\/\d{4}/)).toBeVisible();
    await expect(s.getByRole("link", { name: "Ver na fonte" })).toBeVisible();
  }
});

test("PRIV-01/05: CPF mascarado e responsáveis no rodapé", async ({ page }) => {
  await page.goto(`/parlamentares/${ID}`);
  await expect(page.getByText("***.456.789-**")).toBeVisible();
  const rodape = page.locator("footer");
  await expect(rodape.getByText(/^Controlador: /)).toBeVisible();
  await expect(rodape.getByText(/^Encarregado \(LGPD\): /)).toBeVisible();
  // UI-02: rodapé escuro como no protótipo.
  await expect(rodape).toHaveCSS("background-color", "rgb(21, 24, 30)");
});

test("VOTO-05: filtro de divergência", async ({ page }) => {
  await page.goto(`/parlamentares/${ID}?votos=divergiu`);
  await expect(page.getByText("Rejeitada a PEC fictícia 12/2026")).toBeVisible();
  await expect(page.getByText("Aprovado o PL fictício 1.234/2026")).toHaveCount(0);
  await expect(page.getByText("Aprovada a MPV fictícia 1.300/2026")).toHaveCount(0);
});

test("VOTO-06/07: votação sem voto mostra 'sem registro' e o filtro de ausências só lista ela", async ({ page }) => {
  await page.goto(`/parlamentares/${ID}?votos=ausencias`);
  await expect(page.getByText("Aprovada a MPV fictícia 1.300/2026")).toBeVisible();
  await expect(page.getByText("Votou: sem registro")).toBeVisible();
  await expect(page.getByText("Rejeitada a PEC fictícia 12/2026")).toHaveCount(0);
  await expect(page.getByText("Aprovado o PL fictício 1.234/2026")).toHaveCount(0);
});

test("MAND-01: lateral lista órgãos com cargo atual", async ({ page }) => {
  await page.goto(`/parlamentares/${ID}`);
  await expect(page.getByText("Comissão de Finanças e Tributação")).toBeVisible();
});

test("NAV-01: item ativo do menu tem aria-current e sublinhado na cor da marca", async ({ page }) => {
  await page.goto(`/parlamentares/${ID}`);
  const nav = page.getByRole("navigation", { name: "Principal" });
  const ativo = nav.getByRole("link", { name: "Parlamentares" });
  await expect(ativo).toHaveAttribute("aria-current", "page");
  await expect(ativo).toHaveCSS("border-bottom-color", "rgb(31, 79, 209)");
  await expect(nav.getByRole("link", { name: "Metodologia" })).not.toHaveAttribute("aria-current", "page");
});

test("METOD-01: metodologia publica a versão", async ({ page }) => {
  await page.goto("/metodologia");
  await expect(page.getByRole("heading", { level: 1, name: "Metodologia" })).toBeVisible();
  await expect(page.getByText(/^Versão 1\.0\./)).toBeVisible();
});

test("CORR-03 e CORR-01: Contestar pré-seleciona a seção e o pedido é registrado", async ({ page }) => {
  await page.goto(`/parlamentares/${ID}`);
  await page.locator("section#gastos").getByRole("link", { name: "Contestar" }).click();
  await expect(page.getByLabel("Qual parte do perfil?")).toHaveValue("gastos");
  await page.getByLabel("O que está errado").fill("O valor de janeiro está duplicado segundo a nota original.");
  await page.getByRole("button", { name: "Enviar pedido" }).click();
  await expect(page.getByText("Pedido recebido.")).toBeVisible();
});

test("EDGE-02/03: deputado sem despesas nem bens", async ({ page }) => {
  await page.goto(`/parlamentares/${SEM_DADOS}`);
  await expect(page.getByText(/^Nenhuma despesa publicada para \d{4}\.$/)).toBeVisible();
  await expect(page.getByText(/Não encontramos declarações de bens/)).toBeVisible();
  await expect(page.getByText("nenhuma declaração encontrada")).toBeVisible();
});

test("EDGE-04: sem rolagem horizontal", async ({ page }) => {
  await page.goto(`/parlamentares/${ID}`);
  const largura = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(largura).toBeLessThanOrEqual(page.viewportSize()!.width);
});

for (const caminho of ["/parlamentares/1", "/parlamentares/abc"]) {
  test(`EDGE-01: ${caminho} mostra página não encontrada`, async ({ page }) => {
    // Com streaming (loading.tsx) o status HTTP já saiu como 200; o Next marca a página como noindex.
    await page.goto(caminho);
    await expect(page.getByRole("heading", { name: "Página não encontrada" })).toBeVisible();
    expect(await page.locator('meta[name="robots"][content*="noindex"]').count()).toBeGreaterThan(0);
  });
}
