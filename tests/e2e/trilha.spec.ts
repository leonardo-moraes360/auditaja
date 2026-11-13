import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { createDb } from "@/db/client";
import { EMENDA, RITA, semearTrilha } from "../fixtures/trilha";

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

test("TRUI-01, LING-01, LING-02, LING-07: avisos com regra, limiar, taxa de base, frase e links", async ({ page }) => {
  await page.goto(`/parlamentares/${RITA}`);
  const s = page.locator("section#trilha");
  await expect(s.getByRole("heading", { level: 2, name: "Para onde foi o dinheiro das emendas Pix" })).toBeVisible();
  await expect(s.locator("[data-indicador]").first()).toContainText("R$ 8,1 mi");
  const avisos = s.locator("[data-indicio]");
  await expect(avisos).toHaveCount(4);
  for (let i = 0; i < 4; i++) await expect(avisos.nth(i)).toContainText("Indício não é prova de irregularidade.");

  const recem = s.locator('[data-indicio="recem-aberta"]').first();
  await expect(recem).toContainText("Indício: empresa aberta 41 dias antes do primeiro pagamento");
  await expect(recem).toContainText("começou a funcionar em 12/02/2025");
  await expect(recem).toContainText("em 25/03/2025");
  await expect(recem).toContainText("menos de 180 dias antes do primeiro pagamento");
  await expect(recem).toContainText("2 de 8 (25,0%)");
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
  await expect(ciclo).toContainText("Indício: ciclo fechado entre emenda e campanha");
  await expect(ciclo).toContainText("campanha de 2022 desta deputada");
  await expect(ciclo).toContainText("2 de 3 (66,7%) parlamentares com emenda Pix na base");
  await expect(ciclo.getByRole("link", { name: /Como calculamos/ })).toHaveAttribute(
    "href",
    "/metodologia#ciclo-fechado",
  );
});

test("LING-09: cada aviso cita os arquivos de cada elo com data e SHA-256", async ({ page }) => {
  await page.goto(`/parlamentares/${RITA}`);
  const recem = page.locator('section#trilha [data-indicio="recem-aberta"]').first();
  await expect(recem).toContainText("Receita Federal, Estabelecimentos, base de 10/2026");
  await expect(recem).toContainText("Transferegov, emendas Pix, coletado em 12/11/2026");
  await expect(recem).toContainText("SHA-256 3f9a…0000");
  await expect(recem).toContainText("SHA-256 b71d…0000");
  const ciclo = page.locator('section#trilha [data-indicio="ciclo-fechado"]').first();
  await expect(ciclo).toContainText("TSE, prestação de contas de candidatos 2022");
});

test("TRI-04, TRI-05, TRI-07, CNPJ-05, EDGE-05: trilha da emenda com empresas, PF somadas e saldo", async ({
  page,
}) => {
  await page.goto(`/parlamentares/${RITA}`);
  const t = page.locator(`[data-trilha-emenda="${EMENDA.sorocaba}"]`);
  await expect(t).toHaveAttribute("open", "");
  await expect(t).toContainText(`Emenda ${EMENDA.sorocaba} · Saúde`);
  await expect(t).toContainText("Município de Sorocaba (SP)");
  await expect(t).toContainText("R$ 1,61 mi a 7 empresas e 3 pessoas");
  await expect(t).toContainText("Construtora Ilustrativa Ltda");
  await expect(t).toContainText("Pessoas físicas (3)");
  await expect(t).toContainText("R$ 12 mil");
  await expect(t).not.toContainText("LUCIANY");
  await expect(t.locator("[data-saldo]").first()).toHaveText(/Sem pagamento registrado:\s*R\$ 391 mil/);
  await expect(t).toContainText("Data de abertura não encontrada na base da Receita de 10/2026");
  await expect(t).toContainText("05/05/2010 (data da filial; matriz não encontrada)");
  // Filial nova de distribuidora antiga: vale a data da matriz.
  await expect(t).toContainText("08/06/2009");
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
