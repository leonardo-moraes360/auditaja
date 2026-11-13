import { expect, test, type APIRequestContext } from "@playwright/test";

const DEPUTADA = 900000001;

async function dominio(request: APIRequestContext) {
  const robots = await (await request.get("/robots.txt")).text();
  return robots.match(/^Sitemap: (.+)\/sitemap\.xml$/m)![1];
}

test("rodapé exibe links para Política de privacidade, Termos de uso e fontes oficiais", async ({ page, isMobile }) => {
  await page.goto(`/parlamentares/${DEPUTADA}`);
  const rodape = page.locator("footer");
  await expect(rodape.getByRole("link", { name: "Política de privacidade" }).filter({ visible: true })).toBeVisible();
  await expect(rodape.getByRole("link", { name: "Termos de uso" }).filter({ visible: true })).toBeVisible();
  await expect(rodape.getByRole("link", { name: "fontes oficiais" }).filter({ visible: true })).toBeVisible();
  await expect(rodape.getByText("Os dados exibidos são públicos").filter({ visible: true })).toBeVisible();

  if (!isMobile) {
    await expect(rodape.getByRole("link", { name: "AGPL-3.0" }).filter({ visible: true })).toHaveAttribute(
      "href",
      "https://www.gnu.org/licenses/agpl-3.0.html",
    );
    await expect(rodape.getByRole("link", { name: "CC BY 4.0" }).filter({ visible: true })).toHaveAttribute(
      "href",
      /LICENSE-DATA$/,
    );
  }
});

test("rodapé exibe controlador e encarregado (LGPD art. 18)", async ({ page }) => {
  await page.goto("/");
  const rodape = page.locator("footer");
  await expect(rodape.getByText(/^Controlador:/).filter({ visible: true })).toBeVisible();
  await expect(rodape.getByText(/Encarregado \(LGPD\):/).filter({ visible: true })).toBeVisible();
});

test("página /termos renderiza sem JavaScript (SSG)", async ({ request }) => {
  const r = await request.get("/termos");
  expect(r.status()).toBe(200);
  const html = await r.text();
  expect(html).toContain("<title>Termos de uso · Auditaja</title>");
  expect(html).toContain("Termos de uso");
  expect(html).toContain("AGPL-3.0");
  expect(html).toContain("CC BY 4.0");
  expect(html).toContain("GNU AGPL-3.0");
});

test("/termos: conteúdo acessível e links funcionais", async ({ page }) => {
  await page.goto("/termos");
  await expect(page.getByRole("heading", { level: 1, name: "Termos de uso" })).toBeVisible();
  await expect(page.getByText(/^Atualizado em \d{2}\/\d{2}\/\d{4}\./)).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "O que é o Auditaja" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Licença do código-fonte" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Licença dos dados e textos" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Uso permitido" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Uso proibido" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Privacidade" })).toBeVisible();

  const conteudo = page.locator("main");
  await expect(conteudo.getByText(/Controlador:/).filter({ visible: true })).toBeVisible();
  await expect(conteudo.getByText(/Encarregado pelo tratamento/).filter({ visible: true })).toBeVisible();

  const linkPrivacidade = conteudo.getByRole("link", { name: "política de privacidade" });
  await expect(linkPrivacidade.first()).toHaveAttribute("href", "/privacidade");

  const linkFontes = conteudo.getByRole("link", { name: "fontes e licenças" });
  await expect(linkFontes.first()).toHaveAttribute("href", "/fontes");

  const linkMetodologia = conteudo.getByRole("link", { name: "metodologia" });
  await expect(linkMetodologia.first()).toHaveAttribute("href", "/metodologia");
});

test("sitemap inclui /termos", async ({ request }) => {
  const base = await dominio(request);
  const xml = await (await request.get("/sitemap.xml")).text();
  expect(xml).toContain(`<loc>${base}/termos</loc>`);
});

test("navegação rodapé: link Termos de uso leva a /termos", async ({ page }) => {
  await page.goto("/sobre");
  await page.locator("footer").getByRole("link", { name: "Termos de uso" }).filter({ visible: true }).click();
  await expect(page).toHaveURL(/\/termos$/);
  await expect(page.getByRole("heading", { level: 1, name: "Termos de uso" })).toBeVisible();
});

test("navegação rodapé: link fontes oficiais leva a /fontes", async ({ page }) => {
  await page.goto("/sobre");
  await page.locator("footer").getByRole("link", { name: "fontes oficiais" }).filter({ visible: true }).click();
  await expect(page).toHaveURL(/\/fontes$/);
});

test.skip(({ isMobile }) => isMobile, "testes de SEO HTTP não dependem da largura");

test("/termos: SEO e metadata", async ({ request }) => {
  const base = await dominio(request);
  const r = await request.get("/termos", {
    headers: {
      "User-Agent":
        "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    },
  });
  expect(r.status()).toBe(200);
  const html = await r.text();
  const head = html.split("</head>")[0];
  expect(head).toContain(`<link rel="canonical" href="${base}/termos"`);
  expect(head).toContain('property="og:title" content="Termos de uso');
  expect(head).toContain('name="description" content="');
});
