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
  await expect(ind.nth(0)).toContainText("Reservado (empenhado) no mandato");
  await expect(ind.nth(0)).toContainText(/R\$\s11,1 mi/);
  await expect(ind.nth(0)).toContainText("9 emendas, orçamentos de 2024 a 2026");
  await expect(ind.nth(1)).toContainText("Já pago");
  await expect(ind.nth(1)).toContainText(/R\$\s7,0 mi/);
  await expect(ind.nth(1)).toContainText("63% do reservado, inclui pagamentos de anos anteriores");
  await expect(ind.nth(1).getByRole("img")).toHaveAttribute("aria-label", "63% do valor empenhado já foi pago");
  await expect(ind.nth(2)).toContainText("Emendas Pix (transferências especiais)");
  await expect(ind.nth(2)).toContainText(/R\$\s2,0 mi/);
  await expect(ind.nth(2)).toContainText("18% do reservado");
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
  await expect(areas.first()).toContainText(/Saúde\s*R\$\s6,0 mi · 54%/);
  const locais = secao.locator("h3:text-is('Onde o dinheiro foi aplicado') ~ ul li");
  await expect(locais.locator("span.min-w-0")).toHaveText([
    "Campinas (SP)",
    "São Paulo (UF)",
    "Sorocaba (SP)",
    "Ribeirão Preto (SP)",
    "Jundiaí (SP)",
  ]);
  await expect(secao).toContainText("Sem local definido no Orçamento: R$ 1,0 mi (9%)");
  if (isMobile) {
    // Celular: cartões com o valor à vista no lugar da tabela.
    const cartoes = secao.locator("[data-favorecidos-cartoes] li");
    await expect(cartoes).toHaveCount(5);
    await expect(cartoes.first()).toContainText("Município de São Paulo");
    await expect(cartoes.first()).toContainText("São Paulo (SP) · Município");
    await expect(cartoes.first()).toContainText(/R\$\s2,0 mi/);
    return;
  }
  const linhas = secao.locator("h3:text-is('Quem recebeu os pagamentos') ~ div table tbody tr");
  await expect(linhas).toHaveCount(5);
  await expect(linhas.first()).toContainText("Município de São Paulo");
  await expect(linhas.first()).toContainText("22.222.222/0001-22");
  await expect(linhas.first()).toContainText("São Paulo (SP)");
  await expect(linhas.first()).toContainText(/R\$\s2,0 mi/);
  await expect(linhas.first().locator("td").nth(2)).toHaveText("Município");
  await expect(secao.getByRole("columnheader", { name: "Tipo" })).toBeVisible();
  await expect(secao).toContainText("“Estado (UF)” e “Nacional” indicam emendas sem município definido no Orçamento.");
  await expect(secao).toContainText(
    "Prefeituras e fundos municipais aparecem pelo nome. Pessoas físicas aparecem somadas, sem nome e sem CPF: a máscara do Portal da Transparência, junto com a de outras fontes, remontaria o número.",
  );
  await expect(secao.locator("figure > span")).toHaveText(
    "Em 2026 o ano ainda está em curso: boa parte do empenhado só é paga no ano seguinte, como restos a pagar.",
  );
  await expect(linhas.first().locator("td").nth(2)).toBeVisible();
});

test("EMDUI-04: escolher um ano soma só aquele orçamento", async ({ page }) => {
  await page.goto(`/parlamentares/${ID}`);
  const secao = page.locator("section#emendas");
  await secao.getByRole("link", { name: "2025", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/parlamentares/${ID}\\?emendas=2025#emendas$`));
  await expect(secao.getByRole("link", { name: "2025", exact: true })).toHaveAttribute("aria-current", "page");
  const ind = secao.locator("[data-indicador]");
  await expect(ind.nth(0)).toContainText("Reservado (empenhado) em 2025");
  await expect(ind.nth(0)).toContainText(/R\$\s4,0 mi/);
  await expect(ind.nth(0)).toContainText("3 emendas do orçamento de 2025");
  await expect(ind.nth(1)).toContainText("75% do reservado");
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
    "Fonte: Portal da Transparência (CGU), Emendas Parlamentares, download em lote · base de 09/11/2026 · coletado em 10/11/2026 05:12",
  );
  await expect(secao.getByRole("link", { name: "Ver no Portal" })).toHaveAttribute(
    "href",
    "https://portaldatransparencia.gov.br/download-de-dados/emendas-parlamentares",
  );
  await expect(secao.getByRole("link", { name: "Baixar CSV" })).toHaveAttribute(
    "href",
    `/parlamentares/${ID}/emendas.csv?emendas=mandato`,
  );
  await expect(secao.getByRole("link", { name: "Pedir correção" })).toHaveAttribute(
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
    await expect(secao.locator("[data-indicador]").first()).toContainText("Reservado (empenhado) no mandato");
  }
});

test("EDGE-05: a 320 px a página não rola na horizontal; favorecidos viram cartões e a tabela rola na própria caixa", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto(`/parlamentares/${ID}`);
  await page.waitForLoadState("networkidle");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await expect(page.locator("section#emendas [data-favorecidos-cartoes]")).toBeVisible();
  await page.setViewportSize({ width: 700, height: 800 });
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

test("SAN-04: selo de sanção ao lado do fornecedor na tabela", async ({ page }) => {
  await page.goto(`/parlamentares/${ID}?lista=completa`);
  const linhas = page.locator("section#gastos table tbody tr");
  await expect(linhas.filter({ hasText: "Posto Ilustrativo Ltda" })).toContainText("Sanção no CEIS");
  await expect(linhas.filter({ hasText: "Gráfica Exemplo Ltda" })).toContainText("Sanção no CNEP");
  await expect(linhas.filter({ hasText: "Prestadores pessoa física" })).not.toContainText("Sanção");
});

test("SAN-05..07: aviso factual com período, órgão, notas e ressalva", async ({ page }) => {
  await page.goto(`/parlamentares/${ID}`);
  const avisos = page.locator("section#gastos [data-sancao]");
  await expect(avisos).toHaveCount(2);
  const posto = avisos.filter({ hasText: "Posto Ilustrativo Ltda" });
  await expect(posto.getByRole("heading", { level: 3 })).toHaveText(
    "Posto Ilustrativo Ltda tem sanção registrada no CEIS",
  );
  await expect(posto).toContainText(
    "Impedimento/proibição de contratar com prazo determinado de 01/02/2026 a 01/02/2027. Órgão sancionador: Ministério Exemplo. A única nota paga a essa empresa em 2026 tem data dentro desse período.",
  );
  const grafica = avisos.filter({ hasText: "Gráfica Exemplo Ltda" });
  await expect(grafica.getByRole("heading", { level: 3 })).toHaveText(
    "Gráfica Exemplo Ltda tem sanção registrada no CNEP",
  );
  await expect(grafica).toContainText(
    "Multa desde 01/05/2026, sem data final. Órgão sancionador: Controladoria Exemplo. A única nota paga a essa empresa em 2026 não tem data dentro desse período.",
  );
  for (const a of [posto, grafica]) {
    await expect(a).toContainText(
      "O registro é do cadastro oficial da CGU e não indica irregularidade do parlamentar: a cota é reembolso de despesa, não contrato público.",
    );
  }
  await expect(posto.getByRole("link", { name: "Ver a nota" })).toHaveAttribute(
    "href",
    `/parlamentares/${ID}/gastos.csv?ano=2026&doc=${encodeURIComponent("55.666.777/0001-88")}&de=2026-02-01&ate=2027-02-01`,
  );
  // Sem nota dentro do período, não há link de notas.
  await expect(grafica.getByRole("link", { name: /^Ver (a nota|as \d+ notas)$/ })).toHaveCount(0);
  await expect(posto.getByRole("link", { name: "Ver a base do CEIS no Portal" })).toHaveAttribute(
    "href",
    "https://portaldatransparencia.gov.br/download-de-dados/ceis",
  );
});

test("SAN-05: deputado sem fornecedor sancionado não vê aviso", async ({ page }) => {
  await page.goto(`/parlamentares/${SEM_EMENDAS}`);
  await expect(page.locator("[data-sancao]")).toHaveCount(0);
});

test("EMDUI-15: CSV com uma linha por emenda do período", async ({ request }) => {
  const r = await request.get(`/parlamentares/${ID}/emendas.csv?emendas=2025`);
  expect(r.status()).toBe(200);
  expect(r.headers()["content-type"]).toBe("text/csv; charset=utf-8");
  expect(r.headers()["content-disposition"]).toBe(`attachment; filename="emendas-${ID}-2025.csv"`);
  const linhas = (await r.text()).replace(/^﻿/, "").trim().split("\r\n");
  expect(linhas[0]).toBe("codigo_emenda;ano;tipo;local;area;empenhado;liquidado;pago;restos_a_pagar_pagos");
  expect(linhas.slice(1)).toEqual([
    "202590000003;2025;Emenda Individual - Transferências com Finalidade Definida;ITU - SP;Saúde;500000.00;0.00;0.00;0.00",
    "202590000003;2025;Emenda Individual - Transferências com Finalidade Definida;SOROCABA - SP;Saúde;1500000.00;900000.00;900000.00;300000.00",
    "202590000004;2025;Emenda Individual - Transferências com Finalidade Definida;RIBEIRÃO PRETO - SP;Urbanismo;1200000.00;600000.00;600000.00;400000.00",
    "202590000005;2025;Emenda Individual - Transferências com Finalidade Definida;JUNDIAÍ - SP;Educação;800000.00;800000.00;800000.00;0.00",
  ]);
  const mandato = (await (await request.get(`/parlamentares/${ID}/emendas.csv?emendas=mandato`)).text()).trim();
  expect(mandato.split("\r\n")).toHaveLength(1 + 10);
});

test("MET-01..03: metodologia com emendas e sanções (desde a 1.5)", async ({ page }) => {
  await page.goto("/metodologia");
  await expect(page.getByText("Versão 1.10. Toda mudança gera nova versão.")).toBeVisible();
  const emendas = page.locator("section#emendas");
  await expect(emendas.getByRole("heading", { level: 2 })).toHaveText("Emendas parlamentares");
  await expect(emendas).toContainText("orçamento de 2024 em diante");
  await expect(emendas).toContainText("exatamente um deputado");
  await expect(emendas).toContainText("Pago é a soma do valor pago no ano com os restos a pagar pagos depois.");
  const sancoes = page.locator("section#sancoes");
  await expect(sancoes.getByRole("heading", { level: 2 })).toHaveText("Sanções de fornecedores");
  await expect(sancoes).toContainText("A comparação é pelo CNPJ");
  await expect(sancoes).toContainText("dentro do período da sanção");
});

test("MET-04, MET-05: fontes e regra de ligação na lateral do perfil", async ({ page }) => {
  await page.goto(`/parlamentares/${ID}`);
  const fontes = page.locator("section#fontes");
  await expect(fontes.getByRole("link", { name: "Portal da Transparência · Emendas (lote)" })).toBeVisible();
  await expect(fontes.getByRole("link", { name: "Portal da Transparência · CEIS e CNEP (lote)" })).toBeVisible();
  await expect(fontes.getByRole("link", { name: "Metodologia v1.10" })).toBeVisible();
  const bloco = page.getByRole("region", { name: "Como ligamos a emenda ao deputado" });
  await expect(bloco).toContainText("Quando dois deputados têm o mesmo nome, a emenda fica de fora.");
});

test("EDGE-04: empenhado zero mostra — no lugar dos percentuais", async ({ page }) => {
  await page.goto("/parlamentares/900000003");
  const ind = page.locator("section#emendas [data-indicador]");
  await expect(ind.nth(1)).toContainText("Já pago");
  await expect(ind.nth(1).locator("p").last()).toHaveText("—");
  await expect(ind.nth(1).getByRole("img")).toHaveCount(0);
  await expect(ind.nth(2).locator("p").last()).toHaveText(
    "— do reservado · caem direto no caixa da prefeitura ou do estado, sem dizer em quê serão usadas",
  );
});

test("C24: nota do cruzamento com a data da base", async ({ page }) => {
  await page.goto(`/parlamentares/${ID}`);
  await expect(page.locator("section#gastos")).toContainText(
    "Fonte do cruzamento: Portal da Transparência (CGU), CEIS e CNEP, download em lote · base de 10/11/2026 · comparação pelo CNPJ.",
  );
});

test("C22: CSV de notas filtra pelo período da sanção", async ({ request }) => {
  const doc = encodeURIComponent("55.666.777/0001-88");
  const dentro = await (
    await request.get(`/parlamentares/${ID}/gastos.csv?ano=2026&doc=${doc}&de=2026-02-01&ate=2027-02-01`)
  ).text();
  expect(dentro.trim().split("\r\n")).toHaveLength(2);
  expect(dentro).toContain("2026-02-10");
  const fora = await (
    await request.get(`/parlamentares/${ID}/gastos.csv?ano=2026&doc=${doc}&de=2026-02-11&ate=2027-02-01`)
  ).text();
  expect(fora.trim().split("\r\n")).toHaveLength(1);
  const ate = await (await request.get(`/parlamentares/${ID}/gastos.csv?ano=2026&doc=${doc}&ate=2026-02-09`)).text();
  expect(ate.trim().split("\r\n")).toHaveLength(1);
});

test("C22: limites inclusive de de/ate e data inexistente ignorada", async ({ request }) => {
  const doc = encodeURIComponent("55.666.777/0001-88");
  const linhas = async (q: string) =>
    (await (await request.get(`/parlamentares/${ID}/gastos.csv?ano=2026&doc=${doc}${q}`)).text()).trim().split("\r\n")
      .length - 1;
  // A única nota é de 10/02/2026.
  expect(await linhas("&de=2026-02-10")).toBe(1);
  expect(await linhas("&ate=2026-02-10")).toBe(1);
  expect(await linhas("&de=2026-02-11")).toBe(0);
  expect(await linhas("&ate=2026-02-09")).toBe(0);
  // Datas que não existem ou mal formadas são ignoradas, sem erro 500.
  for (const q of ["&de=2026-02-30", "&de=abc", "&de=2026-2-1", "&ate=2026-02-30"]) {
    const x = await request.get(`/parlamentares/${ID}/gastos.csv?ano=2026&doc=${doc}${q}`);
    expect(x.status(), q).toBe(200);
    expect((await x.text()).trim().split("\r\n"), q).toHaveLength(2);
  }
  const r = await request.get(`/parlamentares/${ID}/gastos.csv?ano=2026&doc=${doc}&ate=2026-13-99`);
  expect(r.status()).toBe(200);
  expect((await r.text()).trim().split("\r\n")).toHaveLength(2);
});

test("AJ-14: CSV de quem recebeu os pagamentos, sem documento de pessoa física", async ({ page }) => {
  const r = await page.request.get(`/parlamentares/${ID}/emendas.csv?emendas=mandato&tabela=favorecidos`);
  expect(r.headers()["content-type"]).toContain("text/csv");
  const linhas = (await r.text()).replace(/^﻿/, "").trim().split("\r\n");
  expect(linhas[0]).toBe(
    "codigo_emenda;ano_emenda;mes_pagamento;favorecido;cnpj_ou_codigo;tipo;natureza_juridica;municipio;uf;valor_recebido",
  );
  expect(linhas.some((l) => l.includes("22.222.222/0001-22"))).toBe(true);
  for (const l of linhas.filter((x) => x.includes("Pessoa Fisica"))) expect(l.split(";")[4]).toBe("");
  await page.goto(`/parlamentares/${ID}`);
  await expect(
    page.locator("section#emendas").getByRole("link", { name: "Baixar quem recebeu (CSV)" }),
  ).toHaveAttribute("href", `/parlamentares/${ID}/emendas.csv?emendas=mandato&tabela=favorecidos`);
});
