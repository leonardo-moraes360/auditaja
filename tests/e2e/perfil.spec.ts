import { expect, test, type Page } from "@playwright/test";

/** No celular, menu e busca do topo ficam atrás dos botões de ícone (protótipo, Mobile.dc.html). */
async function abrirTopo(page: Page, isMobile: boolean, painel: "Menu" | "Buscar") {
  if (isMobile) await page.getByRole("button", { name: painel }).click();
}

// Dados fictícios de src/db/seed.ts
const ID = 900000001; // Maria Exemplo: despesas, votos e bens
const SEM_DADOS = 900000002; // João Ilustrativo: sem despesas, votos ou bens

test("BUSCA-03: busca leva ao perfil", async ({ page }) => {
  await page.goto("/parlamentares?q=maria");
  await page.getByRole("link", { name: /Maria Exemplo/ }).click();
  await expect(page).toHaveURL(new RegExp(`/parlamentares/${ID}$`));
  await expect(page.getByRole("heading", { level: 1, name: "Maria Exemplo" })).toBeVisible();
});

test("indicadores do perfil", async ({ page, isMobile }) => {
  await page.goto(`/parlamentares/${ID}`);
  const ind = page.locator("[data-indicador]");
  await expect(ind.getByText("50%", { exact: true }).filter({ visible: true })).toHaveCount(2); // VOTO-01 (2 de 4) e VOTO-03 (1 de 2)
  if (isMobile) {
    // Rótulos curtos do celular (Mobile.dc.html:46-49).
    await expect(ind.getByText("Cota em 2026")).toBeVisible();
    await expect(ind.getByText(/^R\$\s44 mil$/)).toBeVisible();
    await expect(ind.getByText("2 de 4 em exercício", { exact: true })).toBeVisible(); // PRES-02
    await expect(ind.getByText("1 divergência", { exact: true })).toBeVisible();
    await expect(ind.getByText("30% do teto", { exact: true })).toBeVisible();
    await expect(ind.getByText("+18% sobre 2022", { exact: true })).toBeVisible();
  } else {
    await expect(ind.getByText("Cota parlamentar usada em 2026")).toBeVisible();
    await expect(ind.getByText(/^R\$\s44\.\d{3}$/)).toBeVisible(); // valor por extenso no desktop
    await expect(ind.getByText("2 de 4 em exercício em 2026 · média da Câmara 50%")).toBeVisible(); // VOTO-01, PRES-02
    await expect(ind.getByText("1 votação em licença não conta · ver períodos")).toBeVisible(); // PRES-04
    await expect(ind.getByText("Divergiu em 1 de 2 votações")).toBeVisible();
    await expect(ind.getByText(/^30% do teto acumulado até mar \(R\$\s[\d.]+\)$/)).toBeVisible(); // CEAP-05
    await expect(ind.getByText("+18% sobre 2022, em valor nominal")).toBeVisible(); // BENS-02
  }
});

test("CEAP-05: gráfico mensal mostra a linha do teto mensal da UF", async ({ page, isMobile }) => {
  await page.goto(`/parlamentares/${ID}`);
  const grafico = page.locator("section#gastos figure");
  if (isMobile) await expect(grafico.getByText("Tracejado: teto mensal de SP")).toBeVisible();
  else await expect(grafico.locator("figcaption")).toContainText("Linha tracejada: teto mensal para SP (R$ 48.727)");
  const linha = grafico.locator("[data-teto]");
  await expect(linha).toHaveCount(1);
  // Teto (48.727,46) acima do maior mês do seed (30.000): a escala é o teto + 8% de folga.
  await expect(linha).toHaveAttribute("style", /bottom:\s*92\.59\d*%/);
});

test("PROV-02: cada seção mostra fonte, data de coleta e link para o original", async ({ page, isMobile }) => {
  await page.goto(`/parlamentares/${ID}`);
  for (const secao of ["gastos", "votacoes", "bens"]) {
    const s = page.locator(`section#${secao}`);
    await expect(s.getByText(/^Fonte: .+ · coletado em \d{2}\/\d{2}\/\d{4}/).filter({ visible: true })).toBeVisible();
    if (isMobile) {
      // Celular: linha curta com "ver original" (Mobile.dc.html).
      await expect(s.getByRole("link", { name: "ver original" })).toBeVisible();
      continue;
    }
    await expect(s.getByRole("link", { name: secao === "bens" ? "Ver na DivulgaCand" : "Ver na fonte" })).toBeVisible();
  }
});

test("PRIV-01/05: CPF mascarado e responsáveis no rodapé", async ({ page, isMobile }) => {
  // No celular a tabela de fornecedores fica no resumo completo ("Ver todas as notas e fornecedores").
  await page.goto(`/parlamentares/${ID}${isMobile ? "?lista=completa" : ""}`);
  await expect(page.getByText("***.456.789-**")).toBeVisible();
  const rodape = page.locator("footer");
  await expect(rodape.getByText(/^Controlador: /).filter({ visible: true })).toBeVisible();
  await expect(rodape.getByText(/Encarregado \(LGPD\): /).filter({ visible: true })).toBeVisible();
  // UI-02: rodapé escuro no desktop; no celular, nota clara no fim do conteúdo, como no protótipo.
  await expect(rodape).toHaveCSS("background-color", isMobile ? "rgb(246, 246, 243)" : "rgb(21, 24, 30)");
});

test("PRIV-06: política de privacidade pelo rodapé, com os mesmos responsáveis", async ({ page, isMobile }) => {
  test.skip(isMobile, "no celular o rodapé junta controlador e encarregado numa linha; o conteúdo é o mesmo");
  await page.goto(`/parlamentares/${ID}`);
  const rodape = page.locator("footer");
  const controlador = await rodape
    .getByText(/^Controlador: /)
    .filter({ visible: true })
    .textContent();
  const encarregado = (
    await rodape
      .getByText(/^Encarregado \(LGPD\): /)
      .filter({ visible: true })
      .textContent()
  )?.replace(/^.*?: /, "");
  await rodape.getByRole("link", { name: "Política de privacidade" }).click();
  await expect(page).toHaveURL(/\/privacidade$/);
  await expect(page).toHaveTitle("Política de privacidade · Auditaja");
  await expect(page.getByRole("heading", { level: 1, name: "Política de privacidade" })).toBeVisible();
  await expect(page.getByText(/^Atualizada em \d{2}\/\d{2}\/\d{4}\./)).toBeVisible();
  const conteudo = page.locator("main");
  await expect(conteudo.getByText(controlador!, { exact: true })).toBeVisible();
  await expect(
    conteudo.getByText(`Encarregado pelo tratamento de dados pessoais (LGPD): ${encarregado}`),
  ).toBeVisible();
  for (const secao of ["Quais dados pessoais tratamos", "Seus direitos e como exercê-los", "Cookies"]) {
    await expect(page.getByRole("heading", { level: 2, name: secao })).toBeVisible();
  }
});

test("VOTO-05: filtro de divergência", async ({ page }) => {
  await page.goto(`/parlamentares/${ID}?votos=divergiu`);
  await expect(page.getByRole("link", { name: "PEC 12/2026" })).toBeVisible();
  await expect(page.getByRole("link", { name: "PL 1234/2026" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "MPV 1300/2026" })).toHaveCount(0);
});

test("VOTO-06/07: votação sem voto mostra 'sem registro' e o filtro de ausências só lista votações sem voto", async ({
  page,
}) => {
  await page.goto(`/parlamentares/${ID}?votos=ausencias`);
  await expect(page.getByRole("link", { name: "MPV 1300/2026" })).toBeVisible();
  await expect(page.getByText("Mantido o veto fictício 9/2026")).toBeVisible(); // voto vazio também é ausência
  await expect(page.getByText("Votou: sem registro")).toHaveCount(2);
  await expect(page.getByRole("link", { name: "PLP 45/2026" })).toHaveCount(0); // PRES-03: licença não é ausência
  await expect(page.getByRole("link", { name: "PEC 12/2026" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "PL 1234/2026" })).toHaveCount(0);
});

test("MAND-01: lateral lista só órgãos com cargo atual, com o cargo", async ({ page }) => {
  await page.goto(`/parlamentares/${ID}`);
  const mandato = page.locator("section#mandato");
  await expect(mandato.getByRole("heading", { name: "Comissões como titular" })).toBeVisible();
  await expect(mandato.getByRole("listitem").filter({ hasText: "Comissão de Finanças e Tributação" })).toHaveText(
    "Comissão de Finanças e Tributação",
  );
  await expect(page.getByText("Comissão de Educação")).toHaveCount(0);
});

for (const [caminho, item, outro] of [
  [`/parlamentares/${ID}`, "Parlamentares", "Metodologia"],
  ["/parlamentares", "Parlamentares", "Sobre"],
  ["/metodologia", "Metodologia", "Parlamentares"],
] as const) {
  test(`NAV-01: em ${caminho} o item ${item} fica ativo com sublinhado de 2 px na cor da marca`, async ({
    page,
    isMobile,
  }) => {
    await page.goto(caminho);
    await abrirTopo(page, isMobile, "Menu");
    const nav = page.getByRole("navigation", { name: "Principal" });
    const ativo = nav.getByRole("link", { name: item });
    await expect(ativo).toHaveAttribute("aria-current", "page");
    await expect(ativo).toHaveCSS("border-bottom-color", "rgb(31, 79, 209)");
    await expect(ativo).toHaveCSS("border-bottom-width", "2px");
    await expect(nav.getByRole("link", { name: outro })).not.toHaveAttribute("aria-current", "page");
  });
}

test("BUSCA-05: campos de busca indicam por onde buscar", async ({ page, isMobile }) => {
  await page.goto("/parlamentares");
  await abrirTopo(page, isMobile, "Buscar");
  await expect(page.getByRole("searchbox", { name: "Buscar parlamentar" })).toHaveAttribute(
    "placeholder",
    "Buscar deputado por nome ou UF",
  );
  await expect(page.getByLabel("Nome ou UF")).toHaveAttribute("placeholder", "Ex.: Maria, Silva ou SP");
});

test("BUSCA-04: buscar pela UF no topo lista os deputados da UF", async ({ page, isMobile }) => {
  await page.goto("/metodologia");
  await abrirTopo(page, isMobile, "Buscar");
  await page.getByRole("searchbox", { name: "Buscar parlamentar" }).fill("rj");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("link", { name: /João Ilustrativo/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Maria Exemplo/ })).toHaveCount(0);
});

test("METOD-01: metodologia publica a versão", async ({ page }) => {
  await page.goto("/metodologia");
  await expect(page.getByRole("heading", { level: 1, name: "Metodologia" })).toBeVisible();
  await expect(page.getByText(/^Versão 1\.6\./)).toBeVisible();
});

test("CORR-03 e CORR-01: Contestar pré-seleciona a seção e o pedido é registrado", async ({ page, isMobile }) => {
  if (isMobile) {
    // No celular o protótipo só tem o "Contestar dado" do topo.
    await page.goto(`/parlamentares/${ID}`);
    await page.getByRole("link", { name: "Contestar dado" }).click();
    await expect(page.getByLabel("Qual parte do perfil?")).toHaveValue("outro");
    await page.goto(`/parlamentares/${ID}/contestar?secao=gastos`);
  } else {
    await page.goto(`/parlamentares/${ID}`);
    await page.locator("section#gastos").getByRole("link", { name: "Contestar" }).click();
  }
  await expect(page.getByLabel("Qual parte do perfil?")).toHaveValue("gastos");
  await page.getByLabel("O que está errado").fill("O valor de janeiro está duplicado segundo a nota original.");
  await page.getByRole("button", { name: "Enviar pedido" }).click();
  await expect(page.getByText("Pedido recebido.")).toBeVisible();
});

test("EDGE-02/03: deputado sem despesas nem bens", async ({ page }) => {
  await page.goto(`/parlamentares/${SEM_DADOS}`);
  await expect(page.getByText(/^Nenhuma despesa publicada para \d{4}\.$/)).toBeVisible();
  await expect(page.getByText(/Não encontramos declarações de bens/)).toBeVisible();
  const indicadorBens = page.locator("[data-indicador]").filter({ hasText: /Bens (declarados ao TSE|\(TSE\))/ });
  await expect(indicadorBens.getByText("—", { exact: true }).filter({ visible: true })).toBeVisible();
  await expect(indicadorBens.getByText("nenhuma declaração encontrada").filter({ visible: true })).toBeVisible();
});

test("EDGE-04: sem rolagem horizontal", async ({ page }) => {
  await page.goto(`/parlamentares/${ID}`);
  const largura = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(largura).toBeLessThanOrEqual(page.viewportSize()!.width);
});

for (const caminho of ["/parlamentares/1", "/parlamentares/abc"]) {
  test(`EDGE-01: ${caminho} mostra página não encontrada`, async ({ page }) => {
    // Com streaming (loading.tsx) o status HTTP já saiu como 200; o Next marca a página como noindex.
    await page.goto(caminho);
    await expect(page.getByRole("heading", { name: "Página não encontrada" })).toBeVisible();
    expect(await page.locator('meta[name="robots"][content*="noindex"]').count()).toBeGreaterThan(0);
  });
}

test("UI-04: botões usam cursor de clique e, desabilitados, cursor de bloqueio", async ({ page }) => {
  await page.goto("/parlamentares");
  const botao = page.getByRole("button", { name: "Filtrar" });
  await expect(botao).toHaveCSS("cursor", "pointer");
  await botao.evaluate((b) => b.setAttribute("disabled", ""));
  await expect(botao).toHaveCSS("cursor", "not-allowed");
});

test("Baixar CSV: notas da CEAP do ano, com CPF de terceiro mascarado", async ({ page, isMobile }) => {
  test.skip(isMobile, "Baixar CSV fica no desktop, como no protótipo");
  await page.goto(`/parlamentares/${ID}`);
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.locator("section#gastos").getByRole("link", { name: "Baixar CSV" }).click(),
  ]);
  expect(download.suggestedFilename()).toBe(`ceap-${ID}-2026.csv`);
  const corpo = await (await page.request.get(`/parlamentares/${ID}/gastos.csv?ano=2026`)).text();
  expect(corpo.split("\r\n")[0]).toBe(
    "\uFEFFano;mes;data_emissao;tipo_despesa;fornecedor;cnpj_cpf;valor_documento;valor_glosa;valor_liquido;url_documento",
  );
  expect(corpo).toContain("***.456.789-**");
  expect(corpo).not.toMatch(/\d{3}\.\d{3}\.\d{3}-\d{2}/);
});

test("Acompanhar: página explica o feed Atom, que lista votos e meses de gasto", async ({ page, isMobile }) => {
  await page.goto(`/parlamentares/${ID}`);
  await page.getByRole("link", { name: isMobile ? "Acompanhar" : "Acompanhar atualizações", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Acompanhar atualizações" })).toBeVisible();
  const r = await page.request.get(`/parlamentares/${ID}/feed.xml`);
  expect(r.headers()["content-type"]).toContain("application/atom+xml");
  const xml = await r.text();
  expect(xml).toContain("<title>Votou: Sim · PL 1234/2026</title>");
  expect(xml).toMatch(/Cota parlamentar em [a-z]{3}\/2026: R\$/);
});

test("abas de seção levam às seções, inclusive Mandato e Fontes da lateral", async ({ page, isMobile }) => {
  await page.goto(`/parlamentares/${ID}`);
  const abas = page.getByRole("navigation", { name: "Seções do perfil" });
  await expect(abas.getByRole("link", { name: isMobile ? "Gastos" : "Gastos da cota" })).toHaveAttribute(
    "aria-current",
    "location",
  );
  await abas.getByRole("link", { name: "Fontes" }).click();
  await expect(page).toHaveURL(/#fontes$/);
  await expect(page.getByRole("heading", { name: "De onde vêm os dados" })).toBeInViewport();
});

test("filtro de período: ano e mandato todo", async ({ page, isMobile }) => {
  test.skip(isMobile, "o filtro de período só existe no desktop, como no protótipo");
  await page.goto(`/parlamentares/${ID}`);
  const filtro = page.getByRole("navigation", { name: "Período dos gastos" });
  await filtro.getByRole("link", { name: "Mandato todo" }).click();
  await expect(page).toHaveURL(/ano=mandato/);
  await expect(filtro.getByRole("link", { name: "Mandato todo" })).toHaveAttribute("aria-current", "page");
  await expect(page.locator("[data-indicador]").getByText("Cota parlamentar usada no mandato")).toBeVisible();
});

test("celular: votações resumidas em 3, com link para todas", async ({ page, isMobile }) => {
  test.skip(!isMobile, "resumo só no celular");
  await page.goto(`/parlamentares/${ID}`);
  const s = page.locator("section#votacoes");
  await expect(
    s
      .getByRole("listitem")
      .filter({ visible: true })
      .filter({ has: page.getByRole("link") }),
  ).toHaveCount(3);
  await s.getByRole("link", { name: "Ver as 5 votações" }).click();
  await expect(
    s
      .getByRole("listitem")
      .filter({ visible: true })
      .filter({ has: page.getByRole("link") }),
  ).toHaveCount(5);
});

test("PRES-03/04: votação em licença marcada, fora das ausências, e quadro dos períodos do ano", async ({
  page,
  isMobile,
}) => {
  await page.goto(`/parlamentares/${ID}?lista=completa#votacoes`);
  const s = page.locator("section#votacoes");
  const linha = s.getByRole("listitem").filter({ has: page.getByRole("link", { name: "PLP 45/2026" }) });
  await expect(linha.getByText("Em licença · não conta")).toBeVisible();
  await expect(linha.getByText(/Votou:/)).toHaveCount(0);
  const quadro = s.locator("#periodos");
  await expect(
    quadro.getByRole("heading", {
      name: isMobile ? "Fora do exercício em 2026" : "Períodos fora do exercício em 2026",
    }),
  ).toBeVisible();
  await expect(quadro.getByText("01/07 a 31/07")).toBeVisible();
  await expect(quadro.getByText("Licença para Tratamento de Saúde · 1 votação")).toBeVisible();
  await expect(quadro.getByRole("link", { name: "Como calculamos" })).toHaveAttribute("href", "/metodologia#presenca");
});

test("PRES-05: sem histórico coletado, a presença avisa que pode incluir licenças", async ({ page, isMobile }) => {
  await page.goto(`/parlamentares/${SEM_DADOS}`);
  const ind = page.locator("[data-indicador]");
  if (isMobile) await expect(ind.getByText("0 de 5 · pode incluir licenças", { exact: true })).toBeVisible();
  else await expect(ind.getByText("Pode incluir períodos de licença", { exact: true })).toBeVisible();
  await expect(page.locator("#periodos")).toHaveCount(0);
});
