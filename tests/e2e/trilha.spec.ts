import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator } from "@playwright/test";
import { createDb } from "@/db/client";
import { nomeLegivel } from "@/lib/trilha";
import {
  CNPJ,
  EMENDA,
  MUNICIPIOS_QUINTO,
  ORDEM_PAGO_QUINTO,
  OUTRO,
  QUINTO,
  RITA,
  semearTrilha,
} from "../fixtures/trilha";

// Dados fictícios: tests/fixtures/trilha.ts (Rita: 6 emendas Pix com 5 indícios; Quinto: 15 municípios, sem base).
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

test("DENS-08, DENS-05, LING-01, LING-02, LING-07: CSV e Contestar no topo; indícios agrupados por sinal", async ({
  page,
}, info) => {
  await page.goto(`/parlamentares/${RITA}`);
  const s = page.locator("section#trilha");
  await expect(s.getByRole("heading", { level: 2, name: "Para onde foi o dinheiro das emendas Pix" })).toBeVisible();
  const topo = s.locator("[data-acoes-topo]");
  await expect(topo.getByRole("link", { name: "Baixar CSV" })).toHaveAttribute(
    "href",
    `/parlamentares/${RITA}/trilha.csv`,
  );
  await expect(topo.getByRole("link", { name: "Contestar" })).toHaveAttribute(
    "href",
    `/parlamentares/${RITA}/contestar?secao=trilha`,
  );
  await visivel(s.locator('[data-indicador="transferido"]'), "R$ 8,1 mi");
  // DENS-07: CSV e Contestar acima dos indicadores.
  const yTopo = (await topo.boundingBox())!.y;
  expect(yTopo).toBeLessThan((await s.locator('[data-indicador="transferido"]').boundingBox())!.y);

  if (celular(info.project.name)) {
    const c = s.locator("[data-indicios-celular]");
    await expect(c).toBeVisible();
    await expect(c.getByRole("heading", { name: "5 indícios para conferir" })).toBeVisible();
    await visivel(c, "Indício não é prova de irregularidade.");
    await visivel(c, "Aberta 41 dias antes do 1º pagamento de Sorocaba (Receita, base de 10/2026).");
    await visivel(c, "Nas despesas declaradas da campanha de 2022: R$ 32 mil.");
    // LING-02, LING-07 também no celular: regra com o limiar, taxa de base e metodologia de cada sinal.
    const gr = c.locator('[data-grupo-celular="recem-aberta"]');
    const gc = c.locator('[data-grupo-celular="ciclo-fechado"]');
    await expect(
      gr.getByText(
        "Regra: matriz aberta menos de 180 dias antes do 1º pagamento. 3 de 10 (30,0%) das empresas pagas com emendas Pix caem nesta regra.",
      ),
    ).toBeVisible();
    await expect(
      gc.getByText(
        "Regra: despesa de campanha com data até o pagamento. 2 de 6 (33,3%) dos parlamentares com emenda Pix têm um caso assim.",
      ),
    ).toBeVisible();
    await expect(gr.getByRole("link", { name: "Como calculamos" })).toHaveAttribute(
      "href",
      "/metodologia#recem-aberta",
    );
    await expect(gc.getByRole("link", { name: "Como calculamos" })).toHaveAttribute(
      "href",
      "/metodologia#ciclo-fechado",
    );
    await expect(s.locator("[data-indicio]").first()).toBeHidden();
    expect(await c.textContent()).not.toMatch(/fraude|corrup|desvi|suspeit|ilegal|crime/i);
    return;
  }

  await visivel(s.locator('[data-indicador="indicios"]'), "5");
  const recem = s.locator('[data-indicio="recem-aberta"]');
  const ciclo = s.locator('[data-indicio="ciclo-fechado"]');
  await expect(recem).toHaveCount(1);
  await expect(ciclo).toHaveCount(1);
  await expect(
    recem.getByRole("heading", { name: "Indício: empresa aberta pouco antes de receber · 2 casos" }),
  ).toBeVisible();
  await expect(recem.locator("[data-taxa]")).toBeVisible();
  await expect(ciclo.locator("[data-taxa]")).toBeVisible();
  await expect(recem.locator("[data-taxa]")).toHaveText(
    "3 de 10 (30,0%) das empresas pagas com emendas Pix na base, com data de abertura conhecida, caem nesta regra",
  );
  await visivel(recem, "A matriz da empresa abriu menos de 180 dias antes do primeiro pagamento ligado à emenda.");
  // A frase de não imputação aparece uma vez por cartão (DENS-05), não por caso.
  expect((await recem.textContent())!.split("Indício não é prova de irregularidade.").length - 1).toBe(1);
  const construtora = recem.locator(`[data-caso="${CNPJ.construtora}"]`);
  await expect(construtora).toContainText("Construtora Ilustrativa Ltda");
  await expect(construtora).toContainText("R$ 1,2 mi");
  await expect(construtora).toContainText(
    `Aberta em 12/02/2025 (Receita, base de 10/2026), 41 dias antes do 1º pagamento de Sorocaba com a emenda ${EMENDA.sorocaba}.`,
  );
  await expect(construtora.getByRole("link", { name: "Ver na trilha" })).toHaveAttribute(
    "href",
    `#trilha-${EMENDA.sorocaba}-97001-pagos`,
  );

  await expect(
    ciclo.getByRole("heading", { name: "Indício: empresa da emenda também na campanha · 3 casos" }),
  ).toBeVisible();
  await expect(ciclo.locator("[data-taxa]")).toHaveText(
    "2 de 6 (33,3%) dos parlamentares com emenda Pix na base têm um caso assim",
  );
  await visivel(ciclo, "aparece nas despesas declaradas da campanha de 2022 desta deputada, com data até o pagamento.");
  await expect(ciclo.locator(`[data-caso="${CNPJ.grafica}"]`)).toContainText(
    `Recebeu de Campinas com a emenda ${EMENDA.campinas} entre 04/2024 e 09/2024. Na campanha de 2022: R$ 32 mil em despesas declaradas ao TSE em 09/2022.`,
  );
  for (const c of [recem, ciclo]) {
    expect(await c.textContent()).not.toMatch(/fraude|corrup|desvi|suspeit|ilegal|crime|vendeu/i);
    await expect(c.getByRole("link", { name: "Contestar" })).toHaveAttribute(
      "href",
      `/parlamentares/${RITA}/contestar?secao=trilha`,
    );
  }
  await expect(recem.getByRole("link", { name: /Como calculamos \(metodologia 1\.11\)/ })).toHaveAttribute(
    "href",
    "/metodologia#recem-aberta",
  );
  await expect(ciclo.getByRole("link", { name: /Como calculamos/ })).toHaveAttribute(
    "href",
    "/metodologia#ciclo-fechado",
  );
});

test("LING-09: arquivos de cada elo com data e SHA-256, ao abrir", async ({ page }, info) => {
  await page.goto(`/parlamentares/${RITA}`);
  const cartao = celular(info.project.name)
    ? page.locator("section#trilha [data-indicios-celular]")
    : page.locator('section#trilha [data-indicio="recem-aberta"]');
  const arquivos = cartao.locator("[data-arquivos]");
  await expect(arquivos.getByText("Receita Federal, Estabelecimentos, base de 10/2026")).toBeHidden();
  await arquivos.locator("summary").click();
  await visivel(arquivos, "Receita Federal, Estabelecimentos, base de 10/2026");
  await visivel(arquivos, "Transferegov, emendas Pix, coletado em 12/11/2026");
  await visivel(arquivos, "SHA-256 3f9a…0000");
  await visivel(arquivos, "SHA-256 b71d…0000");
});

test("DENS-01, DENS-02, TRI-04, TRI-05: emendas em linhas; a com indício abre com os três elos uma vez", async ({
  page,
}, info) => {
  await page.goto(`/parlamentares/${RITA}`);
  const s = page.locator("section#trilha");
  await expect(s.locator("[data-trilha-emenda]")).toHaveCount(6);
  // Só as emendas com indício vêm abertas, e primeiro.
  const abertas = await s
    .locator("[data-trilha-emenda][open]")
    .evaluateAll((d) => d.map((e) => e.getAttribute("data-trilha-emenda")));
  expect(abertas).toEqual([EMENDA.campinas, EMENDA.sorocaba]);
  const fechada = s.locator(`[data-trilha-emenda="${EMENDA.fundo}"]`);
  await expect(fechada).not.toHaveAttribute("open", "");
  if (celular(info.project.name)) await visivel(fechada, "1 município (SP) · R$ 1,8 mi · 0% pago");
  else {
    await visivel(fechada, "1 (SP)");
    await visivel(fechada, "R$ 1,8 mi");
  }

  const t = s.locator(`[data-trilha-emenda="${EMENDA.sorocaba}"]`);
  const elos = t.locator('ol[aria-label="Elos da trilha"]');
  await expect(elos).toHaveCount(1);
  await expect(elos.locator("li").nth(0)).toContainText("1 · Reservado no OrçamentoR$ 2,0 mi");
  await expect(elos.locator("li").nth(1)).toContainText("2 · Transferido a 1 município ou estadoR$ 2,0 mi");
  await expect(elos.locator("li").nth(2)).toContainText(
    "R$ 1,61 mi a 7 empresas e entidades e 3 pagamentos a pessoas físicas",
  );
  await expect(elos.locator("[data-saldo-emenda]")).toHaveText("Sem pagamento registrado: R$ 391 mil");
  expect(await elos.locator("a").evaluateAll((as) => as.map((a) => a.getAttribute("href")))).toEqual([
    "https://portaldatransparencia.gov.br/download-de-dados/emendas-parlamentares",
    `${API}/planos-acao-especiais?numero_emenda_parlamentar_plano_acao=${EMENDA.sorocaba}`,
    `${API}/relatorios-gestao-documento-liquidacao-especiais`,
  ]);
  // Fecha e abre pelo resumo (teclado e clique).
  await t.locator(":scope > summary").click();
  await expect(t).not.toHaveAttribute("open", "");
});

test("DENS-04, TRI-07, CNPJ-05, CNPJ-06, EDGE-05: município abre quem ele pagou, com selos e PF somadas", async ({
  page,
}, info) => {
  await page.goto(`/parlamentares/${RITA}`);
  const m = page.locator(`#trilha-${EMENDA.sorocaba}-97001`);
  await expect(m).toHaveAttribute("open", "");
  await expect(m).not.toContainText("LUCIANY");
  if (celular(info.project.name)) {
    const c = m.locator("[data-recebedores-cartoes]");
    await visivel(c, "Construtora Ilustrativa Ltda");
    await visivel(c, "Indício: recém-aberta");
    await visivel(c, "aberta em 12/02/2025 (base de 10/2026)");
    await visivel(c, "aberta em 05/05/2010 (data da filial; matriz não encontrada; base de 10/2026)");
    await visivel(c, "Data de abertura não encontrada na base da Receita de 10/2026");
    await expect(c.locator("[data-pf]")).toHaveText(/3 pagamentos a pessoas físicas\s*R\$ 12 mil/);
    return;
  }
  const tabela = m.locator("table");
  await expect(tabela.locator("th").nth(2)).toHaveText("Aberta em (base de 10/2026)");
  const linha = (cnpj: string) => tabela.locator(`[data-recebedor="${cnpj}"]`);
  await expect(linha(CNPJ.construtora).locator("[data-selo]")).toHaveText("Indício: recém-aberta");
  await expect(linha(CNPJ.construtora).locator("[data-abertura]")).toHaveText("12/02/2025");
  await expect(linha(CNPJ.distribuidoraFilial).locator("[data-abertura]")).toHaveText("08/06/2009");
  await expect(linha(CNPJ.distribuidoraFilial).locator("[data-selo]")).toHaveCount(0);
  await expect(linha(CNPJ.soFilial).locator("[data-abertura]")).toHaveText(
    "05/05/2010 (data da filial; matriz não encontrada)",
  );
  await expect(linha(CNPJ.semAbertura).locator("[data-abertura]")).toHaveText(
    "Data de abertura não encontrada na base da Receita de 10/2026",
  );
  await expect(tabela.locator("[data-pf]")).toHaveText(/3 pagamentos a pessoas físicas.*R\$ 12 mil/);
  // Ciclo fechado também tem selo, na linha da gráfica em Campinas.
  const campinas = page.locator(`#trilha-${EMENDA.campinas}-97002 table`);
  await expect(campinas.locator(`[data-recebedor="${CNPJ.grafica}"] [data-selo]`)).toHaveText(
    "Indício: também na campanha",
  );
  await expect(campinas.locator(`[data-recebedor="${CNPJ.limiar180}"] [data-selo]`)).toHaveCount(0);
  for (const r of await page.locator("section#trilha details[open] table").all()) {
    const [sw, cw] = await r.evaluate((el) => [el.scrollWidth, el.parentElement!.clientWidth]);
    expect(sw).toBeLessThanOrEqual(cw + 1);
  }
});

test("DENS-03, DENS-06: 10 municípios à vista em ordem de valor pago, os outros atrás de um botão; não avaliados", async ({
  page,
}, info) => {
  await page.goto(`/parlamentares/${QUINTO}`);
  const s = page.locator("section#trilha");
  const e = s.locator(`[data-trilha-emenda="${EMENDA.doQuinto}"]`);
  await expect(e).not.toHaveAttribute("open", "");
  // Toda emenda Pix vem do Portal como "Encargos especiais": a área sai da linha.
  await expect(e.locator(":scope > summary")).not.toContainText("Encargos");
  await e.locator(":scope > summary").click();
  const mun = e.locator("[data-municipios]");
  const visiveis = mun.locator(":scope > [data-municipio]");
  await expect(visiveis).toHaveCount(10);
  const nomes = ORDEM_PAGO_QUINTO.map((i) => nomeLegivel(MUNICIPIOS_QUINTO[i]));
  expect(await visiveis.locator(":scope > summary > span:first-child").allTextContents()).toEqual(nomes.slice(0, 10));
  await expect(visiveis.first()).toContainText("R$ 600 mil");
  const outros = mun.locator("[data-outros-municipios]");
  await expect(outros.locator(":scope > summary")).toHaveText("Ver os outros 2 municípios com pagamento");
  await expect(outros.locator("[data-municipio]").first()).toBeHidden();
  await outros.locator(":scope > summary").click();
  expect(await outros.locator("[data-municipio] > summary > span:first-child").allTextContents()).toEqual(
    nomes.slice(10),
  );
  await expect(outros.locator("[data-municipio]").first()).toBeVisible();
  await expect(mun.locator("[data-sem-pagamento]")).toHaveText("3 municípios sem pagamento registrado · R$ 3,4 mi");

  // Chevron do município acompanha o próprio município, não a emenda.
  const primeiro = visiveis.first();
  const giro = () => primeiro.locator(":scope > summary [data-chevron]").evaluate((el) => getComputedStyle(el).rotate);
  await expect(primeiro).not.toHaveAttribute("open", "");
  expect(await giro()).toBe("none");
  await primeiro.locator(":scope > summary").click();
  await expect.poll(giro).toBe("180deg");
  // Razão social com "PARA" não vira "Pará" (DENS-10).
  await visivel(primeiro, "Fornecedora 1 Para Obras Ltda");

  // DENS-06: Receita e TSE de 2018 importados, mas sem dado deste perfil: não é "ainda não importamos".
  const nota = s.locator("[data-nao-avaliado]");
  await expect(nota).toContainText(
    "Nenhuma empresa paga com estas emendas está na base da Receita de 10/2026: empresa recém-aberta não foi avaliada.",
  );
  await expect(nota).toContainText(
    "O TSE não tem despesas de campanha de 2018 com fornecedor pessoa jurídica neste perfil: ciclo com a campanha não foi avaliado.",
  );
  await expect(nota).toContainText("Isso não quer dizer que não haja indício.");
  await expect(nota).not.toContainText("Ainda não importamos");
  await expect(s.locator("[data-indicio]")).toHaveCount(0);
  if (!celular(info.project.name)) await visivel(s.locator('[data-indicador="indicios"]'), "Não avaliados");
  else await visivel(nota, "Indícios não avaliados.");
});

test("DENS-08: notas de pessoa física, matriz e fontes uma vez por seção", async ({ page }) => {
  await page.goto(`/parlamentares/${RITA}`);
  const s = page.locator("section#trilha");
  await s.waitFor();
  await page.evaluate(() =>
    document.querySelectorAll("section#trilha details").forEach((d) => d.setAttribute("open", "")),
  );
  const texto = (await s.textContent())!;
  expect(texto.split("Pagamentos a pessoas físicas aparecem somados").length - 1).toBe(1);
  expect(texto.split("A data de abertura é a da matriz").length - 1).toBe(1);
});

test("DENS-09: Ver na trilha leva ao município da empresa e o abre, mesmo se foi fechado", async ({ page }, info) => {
  await page.goto(`/parlamentares/${RITA}`);
  const alvo = page.locator(`#trilha-${EMENDA.campinas}-97002`);
  await expect(alvo).toHaveAttribute("open", "");
  await alvo.locator(":scope > summary").click();
  await expect(alvo).not.toHaveAttribute("open", "");
  const href = `#trilha-${EMENDA.campinas}-97002-pagos`;
  const link = celular(info.project.name)
    ? page.locator(`section#trilha [data-indicios-celular] a[href="${href}"]`).first()
    : page.locator(`section#trilha [data-caso="${CNPJ.grafica}"]`).getByRole("link", { name: "Ver na trilha" });
  await link.click();
  await expect(page).toHaveURL(new RegExp(`${href}$`));
  await expect(alvo).toHaveAttribute("open", "");
  await expect(page.locator(href)).toBeInViewport();
});

test("TRI-05: emenda sem nenhum pagamento mostra o saldo no elo 3", async ({ page }) => {
  await page.goto(`/parlamentares/${RITA}`);
  const e = page.locator(`[data-trilha-emenda="${EMENDA.fundo}"]`);
  await e.locator(":scope > summary").click();
  await expect(e.locator("[data-saldo-emenda]")).toHaveText("Sem pagamento registrado: R$ 1,8 mi");
  await expect(e.locator("[data-saldo-emenda]")).toBeVisible();
});

test("DENS-01: emenda em duas UFs mostra a UF de cada município", async ({ page }) => {
  await page.goto(`/parlamentares/${OUTRO}`);
  const e = page.locator(`[data-trilha-emenda="${EMENDA.doOutro}"]`);
  await expect(e).toHaveAttribute("open", "");
  const nomes = e.locator("[data-municipio] > summary > span:first-child");
  await expect(nomes).toHaveText(["Sorocaba (SP)", "Uberaba (MG)"]);
});

test("celular estreito: nome longo de município não cobre o valor pago", async ({ page }) => {
  for (const largura of [320, 390]) {
    await page.setViewportSize({ width: largura, height: 800 });
    await page.goto(`/parlamentares/${QUINTO}`);
    await page.locator("section#trilha").waitFor();
    await page.evaluate(() =>
      document.querySelectorAll("section#trilha details").forEach((d) => d.setAttribute("open", "")),
    );
    const transbordando = await page
      .locator("[data-municipio] > summary > span")
      .evaluateAll((els) => els.filter((el) => el.scrollWidth > el.clientWidth + 1).map((el) => el.textContent));
    expect(transbordando).toEqual([]);
    // O nome longo quebra em mais de uma linha e o valor fica inteiro ao lado.
    await expect(page.getByText("Santo Antonio das Missoes e Vale do Taquari Superior").first()).toBeVisible();
  }
});

test("EDGE-04: sem emenda Pix, frase de vazio com gênero e sem trilha", async ({ page }) => {
  await page.goto(`/parlamentares/${SEM_PIX}`);
  const s = page.locator("section#trilha");
  await expect(s.locator("[data-trilha-vazio]")).toHaveText(
    "Este deputado não indicou transferências especiais no período",
  );
  await expect(s.locator("[data-trilha-emenda]")).toHaveCount(0);
  await expect(s.locator("[data-indicio]")).toHaveCount(0);
});

test("densidade: seção do perfil com 15 municípios cabe em poucas telas", async ({ page }) => {
  await page.goto(`/parlamentares/${QUINTO}`);
  const s = page.locator("section#trilha");
  await expect(s).toBeVisible();
  const altura = (await s.boundingBox())!.height;
  expect(altura).toBeLessThan(2 * page.viewportSize()!.height);
});

test("320 px: sem rolagem horizontal, com tudo aberto", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto(`/parlamentares/${RITA}`);
  await page.locator("section#trilha").scrollIntoViewIfNeeded();
  await page.evaluate(() =>
    document.querySelectorAll("section#trilha details").forEach((d) => d.setAttribute("open", "")),
  );
  const largura = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(largura).toBeLessThanOrEqual(320);
});

for (const id of [RITA, QUINTO]) {
  test(`axe: seção da trilha sem violações, tudo aberto (${id})`, async ({ page }) => {
    await page.goto(`/parlamentares/${id}`);
    await page.locator("section#trilha").waitFor();
    await page.evaluate(() =>
      document.querySelectorAll("section#trilha details").forEach((d) => d.setAttribute("open", "")),
    );
    const r = await new AxeBuilder({ page })
      .include("section#trilha")
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"])
      .analyze();
    expect(r.violations.map((v) => ({ id: v.id, alvos: v.nodes.map((n) => n.target.join(" ")) }))).toEqual([]);
  });
}

test("LING-04: Contestar leva ao formulário de correção existente", async ({ page }) => {
  await page.goto(`/parlamentares/${RITA}`);
  await page.locator("section#trilha [data-acoes-topo]").getByRole("link", { name: "Contestar" }).click();
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
  // Cartões do desktop (no celular ficam escondidos, mas os links são os mesmos).
  const links = page.locator('section#trilha [data-indicio] a[href^="/metodologia#"]');
  await expect(links).toHaveCount(2);
  const hrefs = await links.evaluateAll((as) => [...new Set(as.map((a) => a.getAttribute("href")))].sort());
  expect(hrefs).toEqual(["/metodologia#ciclo-fechado", "/metodologia#recem-aberta"]);
  await expect(links.first()).toContainText("metodologia 1.11");
});
