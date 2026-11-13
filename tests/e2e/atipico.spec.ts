import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { createDb } from "@/db/client";
import { ID_ATIPICO, semearAtipico } from "../fixtures/atipico";

// Dados fictícios: 25 colegas e um deputado com os dois avisos (tests/fixtures/atipico.ts).
const URL_TESTE = process.env.TEST_DATABASE_URL ?? "postgres://auditaja:auditaja@127.0.0.1:5436/auditaja_test";
const SEM_AVISO = 900000001; // Maria Exemplo: tipos com menos de 20 parlamentares

test.describe.configure({ mode: "serial" });

// Os projetos desktop e celular rodam em paralelo: semeia uma vez só e não apaga no fim (os dados
// ficam fora de exercício e não mudam lista nem médias). Outro worker semeando ao mesmo tempo esbarra
// na chave primária, o que também serve.
test.beforeAll(async () => {
  const db = createDb(URL_TESTE);
  try {
    const ja = await db.selectFrom("parlamentar").select("id").where("id", "=", ID_ATIPICO).executeTakeFirst();
    if (!ja) await semearAtipico(db);
  } catch {
    // semeado por outro worker
  } finally {
    await db.destroy();
  }
});

test("ATPUI-01: dois avisos no bloco de gastos, com números, notas e metodologia", async ({ page }) => {
  await page.goto(`/parlamentares/${ID_ATIPICO}`);
  const gastos = page.locator("section#gastos");
  const avisos = gastos.locator("[data-atipico]");
  await expect(avisos).toHaveCount(2);
  await expect(
    gastos.getByRole("heading", {
      name: /Manutenção de escritório.*13 vezes (maior que no ano anterior|mais que em 2024)/,
    }),
  ).toBeVisible();
  await expect(
    gastos.getByRole("heading", { name: /Hospedagem.*muito acima do comum entre os deputados/ }),
  ).toBeVisible();
  await expect(avisos.first()).toContainText("Entre os 26 deputados");
  const notas = avisos.first().getByRole("link", { name: /^Baixar as 10 notas/ });
  await expect(notas).toHaveAttribute("href", /gastos\.csv\?ano=2025&tipo=MANUTEN/);
  await expect(avisos.first().getByRole("link", { name: /Como calculamos/ })).toHaveAttribute(
    "href",
    "/metodologia#atipico",
  );
  await expect(gastos.getByText("Atípico", { exact: true }).first()).toBeVisible();
});

test("ATPUI-02: CSV filtrado pelo tipo do aviso", async ({ request }) => {
  const tipo = encodeURIComponent("MANUTENÇÃO DE ESCRITÓRIO DE APOIO À ATIVIDADE PARLAMENTAR");
  const r = await request.get(`/parlamentares/${ID_ATIPICO}/gastos.csv?ano=2025&tipo=${tipo}`);
  expect(r.ok()).toBe(true);
  const linhas = (await r.text()).trim().split("\n");
  expect(linhas).toHaveLength(11); // cabeçalho + 10 notas
  expect(linhas.slice(1).every((l) => l.includes("MANUTENÇÃO DE ESCRITÓRIO"))).toBe(true);
});

test("ATPUI-03: sem aviso, uma linha diz que a checagem foi feita", async ({ page }) => {
  await page.goto(`/parlamentares/${SEM_AVISO}`);
  const resumo = page.locator("section#gastos [data-atipico-resumo]");
  await expect(resumo).toContainText("Nenhum tipo de despesa ficou acima do limite de atipicidade em 2026.");
  await expect(page.locator("section#gastos [data-atipico]")).toHaveCount(0);
});

test("ATPUI-04: mandato todo lista os anos com aviso", async ({ page }) => {
  await page.goto(`/parlamentares/${ID_ATIPICO}?ano=mandato#gastos`);
  const resumo = page.locator("section#gastos [data-atipico-resumo]");
  await expect(resumo.getByRole("link", { name: /2025 \(2 avisos\)/ })).toHaveAttribute("href", /ano=2025#gastos/);
});

test("ATPUI-05: metodologia descreve os dois avisos", async ({ page }) => {
  await page.goto("/metodologia#atipico");
  await expect(page.getByText("Versão 1.11.")).toBeVisible();
  const s = page.locator("section#atipico");
  await expect(s.getByRole("heading", { name: "Acima dos colegas" })).toBeVisible();
  await expect(s.getByRole("heading", { name: "Salto em relação ao ano anterior" })).toBeVisible();
  await expect(s).toContainText("Q3 + 3 × (Q3 − Q1)");
});

test("ATPUI-06: avisos sem violações de acessibilidade (axe)", async ({ page }) => {
  await page.goto(`/parlamentares/${ID_ATIPICO}`);
  const r = await new AxeBuilder({ page }).include("section#gastos").analyze();
  expect(r.violations).toEqual([]);
});
