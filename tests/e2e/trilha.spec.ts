import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator } from "@playwright/test";
import { createDb } from "@/db/client";
import { CNPJ, EMENDA, RITA, semearTrilha } from "../fixtures/trilha";

// Dados fictícios: tests/fixtures/trilha.ts (6 emendas Pix, 2 recém-abertas, 2 ciclos fechados).
const URL_TESTE = process.env.TEST_DATABASE_URL ?? "postgres://auditaja:auditaja@127.0.0.1:5436/auditaja_test";
const SEM_PIX = 900000002; // João Ilustrativo: nenhuma emenda

test.describe.configure({ mode: "serial" });

// Mesmo padrão do atípico: semeia uma vez (dados fora de exercício) e não apaga no fim.
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

const API = "https://api-publica.transferegov.gestao.gov.br/especiais";
const celular = (nome: string) => nome === "celular";
/** Texto visível no projeto atual (o DOM tem as versões de desktop e de celular; uma fica escondida). */
async function visivel(onde: Locator, texto: string | RegExp) {
  await expect(onde.getByText(texto).filter({ visible: true }).first()).toBeVisible();
}

test("TRUI-01, LING-01, LING-02, LING-07: avisos com regra, limiar, taxa de base, frase e links", async ({
  page,
}, info) => {
  await page.goto(`/parlamentares/${RITA}`);
  const s = page.locator("section#trilha");
  await expect(s.getByRole("heading", { level: 2, name: "Para onde foi o dinheiro das emendas Pix" })).toBeVisible();
  await visivel(s.locator("[data-indicador]").first(), "R$ 8,1 mi");
  const avisos = s.locator("[data-indicio]");
  await expect(avisos).toHaveCount(4);
  for (let i = 0; i < 4; i++) {
    await visivel(avisos.nth(i), "Indício não é prova de irregularidade.");
    // LING-01: só "indício" ou "padrão atípico"; nada de termo de acusação.
    expect(await avisos.nth(i).textContent()).not.toMatch(/fraude|corrup|desvi|suspeit|ilegal|crime/i);
  }

  const recem = s.locator('[data-indicio="recem-aberta"]').first();
  if (celular(info.project.name)) {
    await visivel(recem, "Indício · empresa recém-aberta");
    await visivel(recem, "Aberta 41 dias antes do primeiro pagamento");
    await visivel(recem, "abriu em 12/02/2025 (Receita, base de 10/2026)");
    await visivel(recem, "matriz aberta menos de 180 dias antes");
    await visivel(recem, "3 de 10 (30,0%) empresas pagas com emendas Pix");
  } else {
    await visivel(recem, "Indício: empresa aberta 41 dias antes do primeiro pagamento");
    await visivel(recem, "começou a funcionar em 12/02/2025, segundo a Receita Federal (base de 10/2026)");
    await visivel(recem, "em 25/03/2025");
    await visivel(recem, "menos de 180 dias antes do primeiro pagamento");
    await visivel(recem, "3 de 10 (30,0%) empresas pagas com emendas Pix na base, com data de abertura conhecida");
  }
  await expect(recem.getByRole("link", { name: /Como calculamos/ })).toHaveAttribute(
    "href",
    "/metodologia#recem-aberta",
  );
  await expect(recem.getByRole("link", { name: "Contestar" })).toHaveAttribute(
    "href",
    `/parlamentares/${RITA}/contestar?secao=trilha`,
  );
  await expect(recem.getByRole("link", { name: "Ver a trilha" })).toHaveAttribute("href", `#trilha-${EMENDA.sorocaba}`);

  const ciclo = s.locator('[data-indicio="ciclo-fechado"]').first();
  if (celular(info.project.name)) {
    await visivel(ciclo, "Empresa da emenda também vendeu para a campanha");
    await visivel(ciclo, "campanha de 2022 desta deputada (TSE)");
  } else {
    await visivel(ciclo, "Indício: ciclo fechado entre emenda e campanha");
    await visivel(ciclo, "campanha de 2022 desta deputada, com R$ 32 mil em despesas declaradas ao TSE em 09/2022");
  }
  await visivel(ciclo, "2 de 5 (40,0%) parlamentares com emenda Pix na base");
  await expect(ciclo.getByRole("link", { name: /Como calculamos/ })).toHaveAttribute(
    "href",
    "/metodologia#ciclo-fechado",
  );
});

test("LING-09: cada aviso cita os arquivos de cada elo com data e SHA-256", async ({ page }, info) => {
  await page.goto(`/parlamentares/${RITA}`);
  const recem = page.locator('section#trilha [data-indicio="recem-aberta"]').first();
  const ciclo = page.locator('section#trilha [data-indicio="ciclo-fechado"]').first();
  if (celular(info.project.name)) {
    await visivel(recem, "Receita, base de 10/2026 · Transferegov, coletado em 12/11/2026");
    await recem.getByText("ver arquivos e SHA-256").click();
  }
  await visivel(recem, "Receita Federal, Estabelecimentos, base de 10/2026");
  await visivel(recem, "Transferegov, emendas Pix, coletado em 12/11/2026");
  await visivel(recem, "SHA-256 3f9a…0000");
  await visivel(recem, "SHA-256 b71d…0000");
  if (celular(info.project.name)) await ciclo.getByText("ver arquivos e SHA-256").click();
  await visivel(ciclo, "TSE, prestação de contas de candidatos 2022");
});

test("TRI-04, TRI-05, TRI-07, CNPJ-05, CNPJ-06, EDGE-05: trilha da emenda com empresas, PF somadas e saldo", async ({
  page,
}, info) => {
  await page.goto(`/parlamentares/${RITA}`);
  const t = page.locator(`[data-trilha-emenda="${EMENDA.sorocaba}"]`);
  await expect(t).toHaveAttribute("open", "");
  await expect(t.getByRole("heading", { name: `Emenda ${EMENDA.sorocaba} · Saúde` })).toBeVisible();
  await visivel(t, "Município de Sorocaba (SP)");
  await visivel(t, "R$ 1,61 mi a 7 empresas e 3 pessoas");
  // TRI-04: link para a fonte de cada elo.
  expect(
    await t.locator('ol[aria-label="Elos da trilha"] a').evaluateAll((as) => as.map((a) => a.getAttribute("href"))),
  ).toEqual([
    "https://portaldatransparencia.gov.br/download-de-dados/emendas-parlamentares",
    `${API}/planos-acao-especiais?id_plano_acao=97001`,
    `${API}/relatorios-gestao-novos-especiais?id_plano_acao=97001`,
  ]);
  await expect(t).not.toContainText("LUCIANY");
  if (celular(info.project.name)) {
    const c = t.locator("[data-recebedores-cartoes]");
    await visivel(c, "Construtora Ilustrativa Ltda");
    await visivel(c, "abriu em 12/02/2025 (base de 10/2026)");
    await visivel(c, "abriu em 08/06/2009 (base de 10/2026)");
    await visivel(c, "abriu em 05/05/2010 (data da filial; matriz não encontrada; base de 10/2026)");
    await visivel(c, "Data de abertura não encontrada na base da Receita de 10/2026");
    await visivel(c, "Pessoas físicas (3)");
    await expect(c.locator("[data-saldo]")).toHaveText(/Sem pagamento registrado:\s*R\$ 391 mil/);
    await expect(c.locator("[data-saldo]")).toBeVisible();
  } else {
    const tabela = t.locator("table");
    await expect(tabela.locator("th").nth(2)).toHaveText("Abertura da matriz (base de 10/2026)");
    const ab = (cnpj: string) => tabela.locator(`[data-recebedor="${cnpj}"] [data-abertura]`);
    await expect(ab(CNPJ.construtora)).toHaveText("12/02/2025");
    // Filial nova de distribuidora antiga: vale a data da matriz.
    await expect(ab(CNPJ.distribuidoraFilial)).toHaveText("08/06/2009");
    await expect(ab(CNPJ.soFilial)).toHaveText("05/05/2010 (data da filial; matriz não encontrada)");
    await expect(ab(CNPJ.semAbertura)).toHaveText("Data de abertura não encontrada na base da Receita de 10/2026");
    await expect(tabela.locator("[data-pf]")).toBeVisible();
    await expect(tabela.locator("[data-pf]")).toHaveText(/Pessoas físicas \(3\).*R\$ 12 mil/);
    await expect(tabela.locator("[data-saldo]")).toBeVisible();
    await expect(tabela.locator("[data-saldo]")).toHaveText(/Sem pagamento registrado:\s*R\$ 391 mil/);
    // A tabela cabe no cartão (sem rolagem interna) como no artboard.
    for (const r of await page.locator("section#trilha details[open] [role=region]").all()) {
      const [sw, cw] = await r.evaluate((el) => [el.scrollWidth, el.clientWidth]);
      expect(sw).toBeLessThanOrEqual(cw + 1);
    }
  }
  await visivel(t, "base da Receita de 10/2026");
});

test("L-003: só 3 trilhas à vista; as outras 3 atrás de um botão", async ({ page }) => {
  await page.goto(`/parlamentares/${RITA}`);
  const s = page.locator("section#trilha");
  const outras = s.locator("[data-outras-emendas]");
  await expect(outras.locator(":scope > summary")).toContainText("outras 3 emendas Pix");
  await expect(outras.locator("[data-trilha-emenda]")).toHaveCount(3);
  await expect(s.locator("[data-trilha-emenda]")).toHaveCount(6);
});

test("EDGE-04: sem emenda Pix, frase de vazio e sem trilha", async ({ page }) => {
  await page.goto(`/parlamentares/${SEM_PIX}`);
  const s = page.locator("section#trilha");
  await expect(s.locator("[data-trilha-vazio]")).toHaveText(
    "Este parlamentar não indicou transferências especiais no período",
  );
  await expect(s.locator("[data-trilha-emenda]")).toHaveCount(0);
  await expect(s.locator("[data-indicio]")).toHaveCount(0);
});

test("320 px: sem rolagem horizontal na página", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto(`/parlamentares/${RITA}`);
  await page.locator("section#trilha").scrollIntoViewIfNeeded();
  const largura = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(largura).toBeLessThanOrEqual(320);
});

test("axe: seção da trilha sem violações", async ({ page }) => {
  await page.goto(`/parlamentares/${RITA}`);
  await page.locator("[data-outras-emendas] > summary").click();
  const r = await new AxeBuilder({ page })
    .include("section#trilha")
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"])
    .analyze();
  expect(r.violations.map((v) => ({ id: v.id, alvos: v.nodes.map((n) => n.target.join(" ")) }))).toEqual([]);
});

test("LING-04: Contestar leva ao formulário de correção existente", async ({ page }) => {
  await page.goto(`/parlamentares/${RITA}`);
  await page
    .locator('section#trilha [data-indicio="recem-aberta"]')
    .first()
    .getByRole("link", { name: "Contestar" })
    .click();
  await expect(page).toHaveURL(new RegExp(`/parlamentares/${RITA}/contestar\\?secao=trilha`));
  await expect(page.locator("select#secao")).toHaveValue("trilha");
  await expect(page.locator("select#secao option:checked")).toHaveText(
    "Para onde foi o dinheiro (indícios das emendas Pix)",
  );
});

test("LING-05: CSV da trilha com elos, indício e versão da metodologia, sem PF", async ({ request }) => {
  const r = await request.get(`/parlamentares/${RITA}/trilha.csv`);
  expect(r.ok()).toBe(true);
  expect(r.headers()["content-type"]).toContain("text/csv");
  const [cab, ...linhas] = (await r.text()).replace(/^﻿/, "").trim().split("\r\n");
  const col = cab.split(";");
  expect(col).toContain("indicio");
  expect(col).toContain("versao_metodologia");
  // Nenhuma coluna de nome ou documento de pessoa física.
  expect(col.filter((c) => /cpf|pessoa_fisica|nome_pf/.test(c))).toEqual([]);
  const linha = (pred: (c: string[]) => boolean) => linhas.map((l) => l.split(";")).find(pred)!;
  const ix = (n: string) => col.indexOf(n);
  const construtora = linha(
    (c) => c[ix("recebedor")] === "CONSTRUTORA ILUSTRATIVA LTDA" && c[ix("codigo_emenda")] === EMENDA.sorocaba,
  );
  expect(construtora[ix("indicio")]).toBe("recem-aberta");
  expect(construtora[ix("valor")]).toBe("1200000.00");
  expect(construtora[ix("versao_metodologia")]).toMatch(/^1\.\d+$/);
  const pf = linha((c) => c[ix("elo")] === "pessoas_fisicas");
  expect([pf[ix("recebedor")], pf[ix("recebedor_cnpj")], pf[ix("valor")]]).toEqual(["", "", "12000.00"]);
  expect(
    linha((c) => c[ix("elo")] === "sem_pagamento_registrado" && c[ix("codigo_emenda")] === EMENDA.sorocaba)[
      ix("valor")
    ],
  ).toBe("391000.00");
  expect(linha((c) => c[ix("elo")] === "favorecido_direto")[ix("indicio")]).toBe("ciclo-fechado");
});

test("LING-03, LING-08: metodologia 1.11 com uma seção por sinal e as âncoras dos avisos", async ({ page }) => {
  await page.goto("/metodologia#recem-aberta");
  await expect(page.getByText("Versão 1.11. Toda mudança gera nova versão.")).toBeVisible();
  const recem = page.locator("section#recem-aberta");
  await expect(recem.getByRole("heading", { name: "Indício: empresa recém-aberta" })).toBeVisible();
  for (const t of [
    "Fonte:",
    "Regra e limiar:",
    "menos de 180 dias",
    "Exemplo:",
    "Causas conhecidas de falso positivo:",
    "MEI",
  ])
    await expect(recem).toContainText(t);
  const ciclo = page.locator("section#ciclo-fechado");
  await expect(ciclo.getByRole("heading", { name: "Indício: ciclo fechado entre emenda e campanha" })).toBeVisible();
  for (const t of ["Fonte:", "Regra:", "Exemplo:", "Causas conhecidas de falso positivo:", "gráficas"])
    await expect(ciclo).toContainText(t);
  // Os links "Como calculamos" dos avisos apontam para essas âncoras.
  await page.goto(`/parlamentares/${RITA}`);
  const links = page.locator("section#trilha [data-indicio]").getByRole("link", { name: /Como calculamos/ });
  await expect(links).toHaveCount(4);
  const hrefs = await links.evaluateAll((as) => [...new Set(as.map((a) => a.getAttribute("href")))].sort());
  expect(hrefs).toEqual(["/metodologia#ciclo-fechado", "/metodologia#recem-aberta"]);
  await expect(links.first()).toContainText("metodologia 1.11");
});
