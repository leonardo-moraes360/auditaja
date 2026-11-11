import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// Dados fictícios de src/db/seed.ts
const ID = 900000001; // Maria Exemplo: 9 emendas (2024–2026), favorecidos e sanções de dois fornecedores
const SEM_EMENDAS = 900000002; // João Ilustrativo

test("EMDUI-01: aba Emendas entre Gastos da cota e Votações", async ({ page }) => {
  await page.goto(`/parlamentares/${ID}`);
  const abas = page.getByRole("navigation", { name: "Seções do perfil" }).getByRole("link");
  await expect(abas).toHaveCount(6);
  const hrefs = await abas.evaluateAll((as) => as.map((a) => a.getAttribute("href")));
  expect(hrefs.slice(0, 3)).toEqual(["#gastos", "#emendas", "#votacoes"]);
  await expect(abas.nth(1).locator("span").filter({ visible: true })).toHaveText("Emendas");
});

test("EMDUI-02: seção depois de gastos e antes de votações", async ({ page }) => {
  await page.goto(`/parlamentares/${ID}`);
  const secao = page.locator("section#emendas");
  await expect(secao.getByRole("heading", { level: 2, name: "Emendas parlamentares individuais" })).toBeVisible();
  const ordem = await page
    .locator("section[id]")
    .evaluateAll((ss) => ss.map((s) => s.id).filter((id) => ["gastos", "emendas", "votacoes"].includes(id)));
  expect(ordem).toEqual(["gastos", "emendas", "votacoes"]);
});

test("EMDUI-03, EMDUI-05..08: mandato todo por padrão, com indicadores e série por ano", async ({ page }) => {
  await page.goto(`/parlamentares/${ID}`);
  const secao = page.locator("section#emendas");
  const periodo = secao.getByRole("navigation", { name: "Período das emendas" });
  await expect(periodo.getByRole("link")).toHaveText(["2026", "2025", "Mandato todo"]);
  await expect(periodo.getByRole("link", { name: "Mandato todo" })).toHaveAttribute("aria-current", "page");
  const ind = secao.locator("[data-indicador]");
  await expect(ind.nth(0)).toContainText("Empenhado no mandato");
  await expect(ind.nth(0)).toContainText(/R\$\s11,1 mi/);
  await expect(ind.nth(0)).toContainText("9 emendas, orçamentos de 2024 a 2026");
  await expect(ind.nth(1)).toContainText("Pago até agora");
  await expect(ind.nth(1)).toContainText(/R\$\s7 mi/);
  await expect(ind.nth(1)).toContainText("63% do empenhado, incluindo restos a pagar");
  await expect(ind.nth(1).getByRole("img")).toHaveAttribute("aria-label", "63% do valor empenhado já foi pago");
  await expect(ind.nth(2)).toContainText("Transferências especiais (“emendas Pix”)");
  await expect(ind.nth(2)).toContainText(/R\$\s2 mi/);
  await expect(ind.nth(2)).toContainText("18% do empenhado");
  await expect(secao.getByRole("img", { name: /^Gráfico de barras/ })).toHaveAttribute(
    "aria-label",
    "Gráfico de barras: valor empenhado e pago por ano do orçamento, de 2024 a 2026",
  );
  await expect(secao.locator(".sr-only table tbody tr")).toHaveText([
    /2024\s*R\$\s1\.100\.000\s*R\$\s1\.000\.000/,
    /2025\s*R\$\s4\.000\.000\s*R\$\s3\.000\.000/,
    /2026\s*R\$\s6\.000\.000\s*R\$\s3\.000\.000/,
  ]);
});

test("EMDUI-09..11: áreas, locais sem Múltiplo e favorecidos", async ({ page, isMobile }) => {
  await page.goto(`/parlamentares/${ID}`);
  const secao = page.locator("section#emendas");
  const areas = secao.locator("h3:text-is('Por área do governo') + ul li");
  await expect(areas).toHaveCount(5);
  await expect(areas.first()).toContainText(/Saúde\s*R\$\s6 mi · 54%/);
  const locais = secao.locator("h3:text-is('Onde o recurso foi aplicado') + ul li");
  await expect(locais.locator("span.min-w-0")).toHaveText([
    "Campinas (SP)",
    "São Paulo (UF)",
    "Sorocaba (SP)",
    "Ribeirão Preto (SP)",
    "Jundiaí (SP)",
  ]);
  await expect(secao).toContainText("R$ 1 mi (9% do empenhado) estão marcados como “Múltiplo” no Orçamento");
  const linhas = secao.locator("h3:text-is('Quem recebeu os pagamentos') ~ div table tbody tr");
  await expect(linhas).toHaveCount(5);
  await expect(linhas.first()).toContainText("Município de São Paulo");
  await expect(linhas.first()).toContainText("22.222.222/0001-22");
  await expect(linhas.first()).toContainText("São Paulo (SP)");
  await expect(linhas.first()).toContainText(/R\$\s2 mi/);
  if (!isMobile) await expect(linhas.first()).toContainText("Município");
});

test("EMDUI-04: escolher um ano soma só aquele orçamento", async ({ page }) => {
  await page.goto(`/parlamentares/${ID}`);
  const secao = page.locator("section#emendas");
  await secao.getByRole("link", { name: "2025", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/parlamentares/${ID}\\?emendas=2025#emendas$`));
  await expect(secao.getByRole("link", { name: "2025", exact: true })).toHaveAttribute("aria-current", "page");
  const ind = secao.locator("[data-indicador]");
  await expect(ind.nth(0)).toContainText("Empenhado em 2025");
  await expect(ind.nth(0)).toContainText(/R\$\s4 mi/);
  await expect(ind.nth(0)).toContainText("3 emendas do orçamento de 2025");
  await expect(ind.nth(1)).toContainText("75% do empenhado");
  await expect(secao.getByRole("img", { name: /^Gráfico de barras/ })).toHaveCount(0);
});

test("EMDUI-12: rodapé com fonte, data da coleta e links", async ({ page, isMobile }) => {
  await page.goto(`/parlamentares/${ID}`);
  const secao = page.locator("section#emendas");
  if (isMobile) {
    await expect(secao).toContainText("Fonte: Portal da Transparência, emendas · coletado em 10/11/2026");
    return;
  }
  await expect(secao).toContainText(
    "Fonte: Portal da Transparência (CGU), Emendas Parlamentares, download em lote · coletado em 10/11/2026 05:12",
  );
  await expect(secao.getByRole("link", { name: "Ver no Portal" })).toHaveAttribute(
    "href",
    "https://portaldatransparencia.gov.br/download-de-dados/emendas-parlamentares",
  );
  await expect(secao.getByRole("link", { name: "Baixar CSV" })).toHaveAttribute(
    "href",
    `/parlamentares/${ID}/emendas.csv?emendas=mandato`,
  );
  await expect(secao.getByRole("link", { name: "Contestar" })).toHaveAttribute(
    "href",
    `/parlamentares/${ID}/contestar?secao=emendas`,
  );
});

test("EMDUI-13: deputado sem emenda vê a frase de vazio, sem indicadores", async ({ page }) => {
  await page.goto(`/parlamentares/${SEM_EMENDAS}`);
  const secao = page.locator("section#emendas");
  await expect(secao).toContainText(
    "Nenhuma emenda individual deste deputado foi encontrada no Portal da Transparência a partir do orçamento de 2024.",
  );
  await expect(secao.locator("[data-indicador]")).toHaveCount(0);
  await expect(secao.getByRole("navigation", { name: "Período das emendas" })).toHaveCount(0);
  await expect(secao.locator("table")).toHaveCount(0);
});

test("EMDUI-14: período inválido cai no mandato todo", async ({ page }) => {
  for (const q of ["2019", "abc"]) {
    await page.goto(`/parlamentares/${ID}?emendas=${q}`);
    const secao = page.locator("section#emendas");
    await expect(secao.getByRole("link", { name: "Mandato todo" })).toHaveAttribute("aria-current", "page");
    await expect(secao.locator("[data-indicador]").first()).toContainText("Empenhado no mandato");
  }
});

test("EDGE-05: a 320 px a página não rola na horizontal; a tabela rola na própria caixa", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto(`/parlamentares/${ID}`);
  await page.waitForLoadState("networkidle");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  const caixa = page.getByRole("region", { name: "Quem recebeu os pagamentos" });
  await expect(caixa).toHaveClass(/overflow-x-auto/);
  await expect(caixa.locator("table")).toHaveCount(1);
});

for (const caminho of [`/parlamentares/${ID}?emendas=2025`, `/parlamentares/${SEM_EMENDAS}`]) {
  test(`axe WCAG 2.1 AA na seção de emendas: ${caminho}`, async ({ page }) => {
    await page.goto(caminho);
    await page.waitForLoadState("networkidle");
    const r = await new AxeBuilder({ page })
      .include("section#emendas")
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"])
      .analyze();
    expect(r.violations.map((v) => v.id)).toEqual([]);
  });
}
