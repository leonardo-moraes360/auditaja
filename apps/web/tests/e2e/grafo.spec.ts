import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { createDb } from "@auditaja/db/client";
import { CNPJ, EMENDA, QUINTO, RITA, semearTrilha } from "../fixtures/trilha";

// Grafo do caminho do dinheiro (artboards GrafoDinheiro*, aprovados em 13/11/2026). Dados: tests/fixtures/trilha.ts.
const URL_TESTE = process.env.TEST_DATABASE_URL ?? "postgres://auditaja:auditaja@127.0.0.1:5436/auditaja_test";
const SEM_PIX = 900000002;
const NAO_PROVA = "Indício não é prova de irregularidade.";
const celular = (nome: string) => nome === "celular";
const grafo = (id: number) => `/parlamentares/${id}/trilha/grafo`;
const no = (id: string) => `[data-no="${id}"]`;

test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  const db = createDb(URL_TESTE);
  try {
    const ja = await db.selectFrom("parlamentar").select("id").where("id", "=", RITA).executeTakeFirst();
    if (!ja) await semearTrilha(db);
  } catch {
    // semeado por outro worker
  } finally {
    await db.destroy();
  }
});

test('perfil: "Abrir o grafo" na seção da trilha leva à página do grafo', async ({ page }) => {
  await page.goto(`/parlamentares/${RITA}`);
  const link = page.locator("section#trilha [data-chamada-grafo]").getByRole("link", { name: "Abrir o grafo" });
  await expect(link).toHaveAttribute("href", grafo(RITA));
  await link.click();
  await expect(page.getByRole("heading", { level: 1, name: "Caminho do dinheiro das emendas Pix" })).toBeVisible();
  await expect(page.getByRole("note").filter({ hasText: "não que houve irregularidade" })).toContainText(NAO_PROVA);
});

test("desktop: abre na emenda com indício, com recebedores com indício e o ciclo da campanha", async ({
  page,
}, info) => {
  test.skip(celular(info.project.name), "grafo em colunas só no desktop");
  await page.goto(grafo(RITA));
  const status = page.locator("[data-status]");
  await expect(status).toHaveText(
    `Emenda ${EMENDA.campinas} aberta: 1 município ou estado, todos à vista; dos recebedores, só os com indício à vista.`,
  );
  const g = page.locator("[data-grafo]");
  await expect(g.locator(no(`e:${EMENDA.campinas}`))).toHaveAttribute("aria-pressed", "true");
  await expect(g.locator(no(`e:${EMENDA.campinas}`))).toContainText("2 indícios");
  await expect(g.locator(`[data-no^="r:"]`)).toHaveCount(2);
  await expect(g.locator(`[data-no$=":${CNPJ.grafica}"]`)).toContainText("também na campanha");
  await expect(g.locator(no("campanha"))).toContainText("Campanha de 2022");
  await expect(g.locator("[data-ciclo]")).toHaveCount(1);
  await expect(g.getByText("Volta à campanha de 2022 desta deputada")).toBeVisible();
  // Painel: a emenda aberta.
  await expect(page.locator("[data-detalhe]")).toContainText(`${EMENDA.campinas} · Urbanismo`);
});

test("desktop: município abre quem ele pagou; empresa mostra o indício; Esc volta um nível", async ({ page }, info) => {
  test.skip(celular(info.project.name), "grafo em colunas só no desktop");
  await page.goto(grafo(RITA));
  const g = page.locator("[data-grafo]");
  await g.locator(`[data-no^="m:"]`).first().click();
  await expect(page.locator("[data-status]")).toContainText(
    `Mostrando quem Campinas pagou com a emenda ${EMENDA.campinas}`,
  );
  await expect(page.getByRole("navigation", { name: "Caminho aberto no grafo" })).toContainText("Campinas");
  const recem = g.locator(`[data-no$=":${CNPJ.limiar179}"]`);
  await recem.click();
  const det = page.locator("[data-detalhe]");
  const aviso = det.locator('[data-indicio-grafo="recem-aberta"]');
  await expect(aviso).toContainText("Indício: empresa aberta pouco antes de receber");
  await expect(aviso).toContainText(
    "Aberta 179 dias antes do 1º pagamento de Campinas com esta emenda (regra: menos de 180 dias).",
  );
  await expect(aviso).toContainText(NAO_PROVA);
  await expect(aviso.getByRole("link", { name: "Como calculamos" })).toHaveAttribute(
    "href",
    "/metodologia#recem-aberta",
  );
  await expect(aviso.getByRole("link", { name: "Contestar" })).toHaveAttribute(
    "href",
    `/parlamentares/${RITA}/contestar?secao=trilha`,
  );
  await recem.press("Escape");
  await expect(page.locator("[data-status]")).toContainText(`Emenda ${EMENDA.campinas} aberta`);
  await g.locator(no(`e:${EMENDA.campinas}`)).press("Escape");
  await expect(page.locator("[data-status]")).toHaveText(
    "Mostrando 6 emendas Pix. Escolha uma para abrir os municípios.",
  );
});

test("filtro: só caminhos com indício", async ({ page }, info) => {
  test.skip(celular(info.project.name), "grafo em colunas só no desktop");
  await page.goto(grafo(RITA));
  await page.getByLabel("Só caminhos com indício").check();
  const g = page.locator("[data-grafo]");
  await expect(page.locator("[data-status]")).toContainText("Filtro ligado: só os caminhos com indício.");
  await expect(g.locator(`[data-no^="e:"]`)).toHaveCount(2);
  await expect(g.locator(`[data-no^="ro:"], [data-no^="mo:"], [data-no^="ms:"]`)).toHaveCount(0);
});

test("filtro numa emenda sem indício não quebra a página e não mostra recebedores", async ({ page }, info) => {
  test.skip(celular(info.project.name), "grafo em colunas só no desktop");
  const erros: string[] = [];
  page.on("pageerror", (e) => erros.push(e.message));
  await page.goto(grafo(RITA));
  await page.locator(`[data-grafo] ${no(`e:${EMENDA.itu}`)}`).click();
  await page.getByLabel("Só caminhos com indício").check();
  await expect(page.locator("[data-status]")).toContainText("Filtro ligado");
  await expect(page.locator(`[data-grafo] [data-no^="r:"]`)).toHaveCount(0);
  expect(erros).toEqual([]);
});

test("Esc com o foco num recebedor que some leva o foco à emenda aberta", async ({ page }, info) => {
  test.skip(celular(info.project.name), "grafo em colunas só no desktop");
  await page.goto(grafo(RITA));
  await page.locator(`[data-grafo] [data-no^="m:"]`).first().click();
  const r = page.locator(`[data-grafo] [data-no^="r:"]`).last();
  await r.focus();
  await r.press("Escape");
  await expect(page.locator(`[data-grafo] ${no(`e:${EMENDA.campinas}`)}`)).toBeFocused();
});

test("cartão de indício leva aos arquivos usados na seção da trilha", async ({ page }, info) => {
  test.skip(celular(info.project.name), "painel lateral só no desktop");
  await page.goto(grafo(RITA));
  await page.locator(`[data-grafo] [data-no$=":${CNPJ.grafica}"]`).click();
  await expect(
    page.locator('[data-detalhe] [data-indicio-grafo="ciclo-fechado"]').getByRole("link", { name: "Arquivos usados" }),
  ).toHaveAttribute("href", `/parlamentares/${RITA}#trilha`);
});

test("lista: os mesmos nós em tabelas, e abrir um município mostra quem ele pagou", async ({ page }) => {
  await page.goto(grafo(RITA));
  await page.getByRole("button", { name: "Lista", exact: true, pressed: false }).click();
  const l = page.locator("[data-lista-grafo]");
  await expect(l.getByRole("table")).toHaveCount(4);
  await expect(l.locator("caption").first()).toHaveText("Emendas Pix (6)");
  await l.getByRole("button", { name: "Abrir Campinas" }).click();
  const quem = l.getByRole("table").filter({ has: page.locator("caption", { hasText: "Quem Campinas pagou" }) });
  await expect(quem.getByRole("rowheader", { name: /Gráfica Exemplo Ltda/ })).toBeVisible();
  await expect(quem.getByText("também na campanha")).toBeVisible();
  await quem.getByRole("button", { name: "Detalhes de Gráfica Exemplo Ltda" }).click();
  await expect(page.locator('[data-detalhe] [data-indicio-grafo="ciclo-fechado"]')).toContainText(
    "O mesmo CNPJ aparece nas despesas declaradas da campanha de 2022 desta deputada",
  );
  // Esc na lista sobe um nível sem perder o foco: vai para o título da lista.
  await l.getByRole("button", { name: "Abrir Campinas" }).focus();
  await page.keyboard.press("Escape");
  await expect(l.getByRole("heading", { name: "O mesmo caminho em lista" })).toBeFocused();
  await expect(quem).toHaveCount(0);
});

test("indícios não avaliados (Quinto): filtro desligado, sem selos e com a nota", async ({ page }, info) => {
  await page.goto(grafo(QUINTO));
  await expect(page.getByLabel("Só caminhos com indício")).toBeDisabled();
  await expect(page.locator("[data-status]")).toHaveText(
    "Mostrando 1 emenda Pix. Escolha uma para abrir os municípios.",
  );
  const onde = celular(info.project.name) ? page.locator("[data-arvore]") : page.locator("[data-grafo]");
  await expect(onde.getByText(/indício/)).toHaveCount(0);
  if (!celular(info.project.name)) {
    await page.locator(`[data-grafo] [data-no^="e:"]`).click();
    await expect(page.locator(`[data-grafo] [data-no^="m:"]`)).toHaveCount(5);
    await expect(page.locator(`[data-grafo] [data-no^="mo:"]`)).toContainText("Outros 7 municípios");
    await expect(page.locator(`[data-grafo] [data-no^="ms:"]`)).toContainText("3 sem pagamento");
  }
  await expect(
    page
      .locator("[data-detalhe], [data-arvore]")
      .getByText(/recém-aberta não foi avaliada/)
      .filter({ visible: true })
      .first(),
  ).toBeVisible();
});

test("celular: árvore um nível por vez, com o indício e o ciclo no cartão da empresa", async ({ page }, info) => {
  test.skip(!celular(info.project.name), "árvore só no celular");
  await page.goto(grafo(RITA));
  const a = page.locator("[data-arvore]");
  await expect(a).toBeVisible();
  await expect(page.locator("[data-grafo]")).toBeHidden();
  await expect(a.getByRole("heading", { level: 2, name: EMENDA.campinas, exact: true })).toBeVisible();
  await expect(a.getByText("Emenda Pix · Urbanismo")).toBeVisible();
  await a.getByRole("button", { name: /^Campinas, / }).click();
  await expect(a.getByRole("heading", { level: 2, name: "Campinas (SP)" })).toBeFocused();
  const grafica = a.getByRole("button", { name: /^Gráfica Exemplo Ltda/ });
  await expect(grafica).toHaveAttribute("aria-expanded", "false");
  await grafica.click();
  await expect(grafica).toHaveAttribute("aria-expanded", "true");
  const cartao = a.locator(`[data-filho$=":${CNPJ.grafica}"]`);
  await expect(cartao.locator('[data-indicio-grafo="ciclo-fechado"]')).toContainText(NAO_PROVA);
  await expect(cartao.getByRole("list", { name: "O ciclo, passo a passo" })).toContainText("Campanha 2022");
  // Voltar pelo caminho aberto.
  await a
    .getByRole("navigation", { name: "Caminho aberto" })
    .getByRole("button", { name: /Rita Trilha Fictícia/ })
    .click();
  await expect(a.getByRole("heading", { level: 2, name: "Rita Trilha Fictícia" })).toBeVisible();
});

test("perfil sem emenda Pix: frase da seção e volta ao perfil", async ({ page }) => {
  await page.goto(grafo(SEM_PIX));
  await expect(page.locator("[data-trilha-vazio]")).toContainText("não indicou transferências especiais no período");
});

// Como no perfil (EDGE-01): com streaming o status fica 200; vale a página "não encontrada".
for (const caminho of [grafo(999999999), "/parlamentares/abc/trilha/grafo"])
  test(`${caminho} mostra página não encontrada`, async ({ page }) => {
    await page.goto(caminho);
    await expect(page.getByRole("heading", { name: "Página não encontrada" })).toBeVisible();
  });

for (const visao of ["Grafo", "Lista"] as const)
  test(`320 px: sem rolagem horizontal (${visao})`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto(grafo(RITA));
    await page
      .locator("[data-arvore]")
      .getByRole("button", { name: /^Campinas, / })
      .click();
    if (visao === "Lista") await page.getByRole("button", { name: "Lista", exact: true }).click();
    const largura = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(largura).toBeLessThanOrEqual(320);
  });

for (const visao of ["Grafo", "Lista"] as const)
  test(`axe: sem violações (${visao})`, async ({ page }) => {
    await page.goto(grafo(RITA));
    if (visao === "Lista") await page.getByRole("button", { name: "Lista", exact: true, pressed: false }).click();
    const r = await new AxeBuilder({ page }).include("main").analyze();
    expect(r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(", ")}`)).toEqual([]);
  });
