import { expect, test } from "@playwright/test";

// Senador fictício de src/db/seed.ts: Otávio Modelo, MG, PFX, código 9001.
const SENADOR = 10009001;

test("SUI-01: trilha leva ao Senado Federal", async ({ page, isMobile }) => {
  test.skip(isMobile, "a trilha só aparece no desktop, como no protótipo");
  await page.goto(`/parlamentares/${SENADOR}`);
  const trilha = page.getByRole("navigation", { name: "Trilha" });
  await expect(trilha).toContainText("Parlamentares / Senado Federal / Otávio Modelo");
  await expect(trilha.getByRole("link", { name: "Senado Federal" })).toHaveAttribute(
    "href",
    "/parlamentares?casa=senado",
  );
});

test("SUI-02/03: cabeçalho com cargo, UF, partido, bloco, mandato e participação", async ({ page, isMobile }) => {
  await page.goto(`/parlamentares/${SENADOR}`);
  await expect(page.getByRole("heading", { level: 1, name: "Otávio Modelo" })).toBeVisible();
  if (isMobile) {
    await expect(page.getByText("Senador · MG · PFX", { exact: true })).toBeVisible();
    await expect(page.getByText("Em exercício · 2023–2031")).toBeVisible();
  } else {
    await expect(page.getByText("Senador por Minas Gerais (MG) · PFX · Bloco Parlamentar Exemplo")).toBeVisible();
    await expect(page.getByText("Mandato 2023–2031 · 57ª e 58ª legislaturas")).toBeVisible();
    await expect(page.getByText("Titular", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Nome civil, cargo, UF, partido e bloco conforme o Senado Federal.")).toBeVisible();
  }
});

test("SUI-03: suplente em exercício e senadora", async ({ page, isMobile }) => {
  test.skip(isMobile, "o selo de participação só aparece no desktop");
  await page.goto(`/parlamentares/10009002`);
  await expect(page.getByText("1º Suplente em exercício", { exact: true })).toBeVisible();
  await expect(page.getByText(/^Senadora por Acre \(AC\)/)).toBeVisible();
});

test("indicadores do senador (SCEAPS-05, SPRES-03/04, SALI-02)", async ({ page, isMobile }) => {
  await page.goto(`/parlamentares/${SENADOR}`);
  const ind = page.locator("[data-indicador]");
  if (isMobile) {
    await expect(ind.getByText("Cota em 2026")).toBeVisible();
    await expect(ind.getByText(/^R\$\s5 mil\/mês$/)).toBeVisible();
    await expect(ind.getByText("3 de 4", { exact: true })).toBeVisible();
    await expect(ind.getByText("Seguiu a liderança")).toBeVisible();
    await expect(ind.getByText("1 divergência", { exact: true })).toBeVisible();
  } else {
    await expect(ind.getByText("Cota do senador (CEAPS) em 2026")).toBeVisible();
    await expect(ind.getByText(/^R\$\s15\.000$/)).toBeVisible();
    await expect(ind.getByText(/^Média de R\$\s5\.000 por mês, jan a abr$/)).toBeVisible();
    await expect(ind.getByText("3 de 4 em 2026 · média do Senado 88%")).toBeVisible();
    await expect(ind.getByText("Votou como a liderança orientou")).toBeVisible();
    await expect(ind.getByText("Divergiu em 1 de 2 votações abertas")).toBeVisible();
  }
  await expect(ind.getByText("75%", { exact: true }).filter({ visible: true })).toBeVisible();
  await expect(ind.getByText("50%", { exact: true }).filter({ visible: true })).toBeVisible();
  // SCEAPS-06: nenhuma barra de teto.
  await expect(page.locator("[data-indicador] [role=img]")).toHaveCount(0);
});

test("SCEAPS-06: gastos sem teto e com o aviso do Senado", async ({ page, isMobile }) => {
  await page.goto(`/parlamentares/${SENADOR}`);
  const gastos = page.locator("section#gastos");
  await expect(
    gastos
      .getByRole("heading", { level: 2 })
      .getByText(isMobile ? "Gastos da cota (CEAPS) · 2026" : "Gastos da cota do senador (CEAPS)", { exact: true }),
  ).toBeVisible();
  await expect(gastos.locator("[data-teto]")).toHaveCount(0);
  await expect(
    gastos.getByText(isMobile ? /^Valor reembolsado pelo Senado\. Sem teto/ : /^O Senado publica o valor reembolsado/),
  ).toBeVisible();
  await expect(gastos.getByText(/teto mensal/)).toHaveCount(0);
  if (!isMobile) {
    await expect(gastos.getByRole("link", { name: "Mandato todo" })).toHaveCount(0);
    await expect(
      gastos.getByText(/^Fonte: Senado Federal, Dados Abertos administrativos \(CEAPS\) · coletado em/),
    ).toBeVisible();
  }
});

test("SVOT-06/07/08: voto secreto, ausência com motivo e filtro de divergência", async ({ page, isMobile }) => {
  await page.goto(`/parlamentares/${SENADOR}?lista=completa`);
  const vot = page.locator("section#votacoes");
  await expect(vot.getByText("Votou (voto secreto)")).toBeVisible();
  await expect(vot.getByText("Orientação: não se aplica")).toBeVisible();
  await expect(vot.getByText("Ausente: missão oficial")).toBeVisible();
  await expect(vot.getByText("Em licença ou afastado")).toBeVisible();
  await expect(vot.getByText("Liderança do PFX: Sim").first()).toBeVisible();
  if (!isMobile) {
    await expect(
      vot.getByRole("heading", { level: 2 }).getByText("Votações nominais no Plenário", { exact: true }),
    ).toBeVisible();
    await vot.getByRole("link", { name: "Divergiu da liderança" }).click();
    await expect(page).toHaveURL(/votos=divergiu/);
    await expect(page.locator("section#votacoes li")).toHaveCount(1);
    await expect(page.locator("section#votacoes li")).toContainText("PEC 8/2026");
    await page.locator("section#votacoes").getByRole("link", { name: "Ausências" }).click();
    await expect(page.locator("section#votacoes li")).toHaveCount(1);
    await expect(page.locator("section#votacoes li")).toContainText("Ausente: missão oficial");
  }
});

test("SUI-04: bloco Mandato com Casa, período, situação, bloco e suplentes", async ({ page }) => {
  await page.goto(`/parlamentares/${SENADOR}`);
  const m = page.locator("section#mandato");
  await expect(m.getByText("Senado Federal", { exact: true })).toBeVisible();
  await expect(m.getByText("01/02/2023")).toBeVisible();
  await expect(m.getByText("31/01/2031")).toBeVisible();
  await expect(m.getByText("Titular, em exercício")).toBeVisible();
  await expect(m.getByText("Bloco Parlamentar Exemplo")).toBeVisible();
  await expect(m.getByText("Beatriz Suplente Fictícia")).toBeVisible();
  await expect(m.getByText("2º suplente")).toBeVisible();
  await expect(m.getByText("Comissão de Assuntos Econômicos")).toBeVisible();
  await expect(m.getByText("Posse para o mandato 2023–2031")).toBeVisible();
});

test("SUI-05: fontes do Senado, sem as da Câmara", async ({ page, isMobile }) => {
  await page.goto(`/parlamentares/${SENADOR}`);
  const f = page.locator("section#fontes");
  await expect(f.getByRole("link", { name: "Senado Federal · Dados Abertos" })).toBeVisible();
  await expect(f.getByRole("link", { name: "Senado Federal · CEAPS (dados administrativos)" })).toBeVisible();
  await expect(f.getByText(/Câmara/)).toHaveCount(0);
  for (const secao of ["gastos", "votacoes"]) {
    const s = page.locator(`section#${secao}`);
    await expect(
      s.getByText(/^Fonte: Senado.+ · coletado em \d{2}\/\d{2}\/\d{4}/).filter({ visible: true }),
    ).toBeVisible();
    await expect(s.getByRole("link", { name: isMobile ? "ver original" : "Ver na fonte" })).toBeVisible();
  }
});

test("SUI-10: acompanhar, contestar e CSV funcionam pelo id do senador", async ({ page, request }) => {
  const feed = await request.get(`/parlamentares/${SENADOR}/feed.xml`);
  expect(feed.ok()).toBe(true);
  expect(await feed.text()).toContain("Otávio Modelo");
  const csv = await request.get(`/parlamentares/${SENADOR}/gastos.csv?ano=2026`);
  expect(csv.ok()).toBe(true);
  expect(await csv.text()).toContain("Imobiliária Exemplo Ltda");
  await page.goto(`/parlamentares/${SENADOR}/contestar`);
  await expect(page.getByText(/Otávio Modelo/).first()).toBeVisible();
  await page.goto(`/parlamentares/${SENADOR}/acompanhar`);
  await expect(page.getByText(/Otávio Modelo/).first()).toBeVisible();
});
