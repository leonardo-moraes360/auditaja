import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// A11Y-01: varredura automática WCAG 2.1/2.2 A/AA + boas práticas com axe-core em todas as páginas, com dados fictícios do seed.
const PAGINAS = [
  "/",
  "/parlamentares",
  "/parlamentares?q=maria",
  "/parlamentares/900000001",
  "/parlamentares/900000001?votos=divergiu",
  "/parlamentares/900000002",
  "/parlamentares/900000001/contestar",
  "/parlamentares/900000001/contestar?enviado=1",
  "/parlamentares/900000001/acompanhar",
  "/parlamentares/900000001?ano=mandato",
  "/parlamentares/900000001?lista=completa",
  "/sobre",
  "/metodologia",
  "/fontes",
  "/privacidade",
  "/parlamentares/abc",
  // Senado (perfil do senador): senador titular, suplente em exercício, filtros e lista por Casa.
  "/parlamentares?casa=senado",
  "/parlamentares/10009001",
  "/parlamentares/10009001?votos=ausencias",
  "/parlamentares/10009001?lista=completa",
  "/parlamentares/10009002",
];

for (const caminho of PAGINAS) {
  test(`axe WCAG 2.1 AA: ${caminho}`, async ({ page }) => {
    await page.goto(caminho);
    await page.waitForLoadState("networkidle");
    const r = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"])
      .analyze();
    const resumo = r.violations.map((v) => ({
      id: v.id,
      impacto: v.impact,
      alvos: v.nodes.slice(0, 5).map((n) => n.target.join(" ")),
      exemplo: v.nodes[0]?.failureSummary,
    }));
    expect(resumo).toEqual([]);
  });
}

test("A11Y-02: perfil não rola na horizontal a 320 px (reflow, 1.4.10)", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  for (const caminho of [
    "/parlamentares/900000001",
    "/parlamentares",
    "/fontes",
    "/privacidade",
    "/parlamentares/900000001/contestar",
    "/parlamentares/10009001",
    "/parlamentares?casa=senado",
  ]) {
    await page.goto(caminho);
    await page.waitForLoadState("networkidle");
    expect(await page.evaluate(() => document.documentElement.scrollWidth), caminho).toBeLessThanOrEqual(320);
  }
});

test("A11Y-03: foco visível com contorno sólido de 2 px (2.4.7)", async ({ page, isMobile }) => {
  await page.goto("/parlamentares/900000001");
  await page.keyboard.press("Tab"); // pular para o conteúdo
  await page.keyboard.press("Tab"); // logo
  const logo = page.getByRole("link", { name: "Auditaja" });
  await expect(logo).toBeFocused();
  await expect(logo).toHaveCSS("outline-style", "solid");
  await expect(logo).toHaveCSS("outline-width", "2px");
  await expect(logo).toHaveCSS("outline-color", "rgb(31, 79, 209)");
  const linkRodape = page.locator("footer").getByRole("link", { name: "Metodologia" });
  await linkRodape.focus();
  // Rodapé escuro no desktop: contorno branco. No celular o rodapé é claro (protótipo): contorno da marca.
  await expect(linkRodape).toHaveCSS("outline-color", isMobile ? "rgb(31, 79, 209)" : "rgb(255, 255, 255)");
});

test("A11Y-04: erro do formulário fica ligado ao campo (3.3.1)", async ({ page }) => {
  await page.goto("/parlamentares/900000001/contestar");
  const campo = page.getByLabel("O que está errado");
  // Remove o minlength do HTML para exercitar a validação do servidor.
  await campo.evaluate((c) => c.removeAttribute("minlength"));
  await campo.fill("curto");
  await page.getByRole("button", { name: "Enviar pedido" }).click();
  await expect(page.locator("#erro-pedido")).toHaveText("Descreva o erro com pelo menos 20 caracteres.");
  await expect(campo).toHaveAttribute("aria-invalid", "true");
  await expect(campo).toHaveAttribute("aria-describedby", /erro-pedido/);
});

test("A11Y-05: divergência não depende só da cor", async ({ page }) => {
  await page.goto("/parlamentares/900000001?votos=divergiu");
  await expect(page.getByText("(divergiu da orientação)")).toHaveCount(1);
});

test("A11Y-06: borda dos campos com contraste ≥ 3:1 (1.4.11)", async ({ page }) => {
  await page.goto("/parlamentares");
  await expect(page.getByLabel("Nome ou UF")).toHaveCSS("border-top-color", "rgb(128, 133, 142)");
});
