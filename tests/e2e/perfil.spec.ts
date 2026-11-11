import { expect, test } from "@playwright/test";

// Dados fictícios de src/db/seed.ts
const ID = 900000001; // Maria Exemplo: despesas, votos e bens
const SEM_DADOS = 900000002; // João Ilustrativo: sem despesas, votos ou bens

test("BUSCA-03: busca leva ao perfil", async ({ page }) => {
  await page.goto("/parlamentares?q=maria");
  await page.getByRole("link", { name: /Maria Exemplo/ }).click();
  await expect(page).toHaveURL(new RegExp(`/parlamentares/${ID}$`));
  await expect(page.getByRole("heading", { level: 1, name: "Maria Exemplo" })).toBeVisible();
});

test("indicadores do perfil", async ({ page }) => {
  await page.goto(`/parlamentares/${ID}`);
  await expect(page.getByText("Cota parlamentar usada em 2026")).toBeVisible();
  await expect(page.getByText("R$ 44 mil")).toBeVisible();
  await expect(page.getByText("2 de 4 em 2026")).toBeVisible(); // VOTO-01: voto vazio não conta
  await expect(page.getByText("50%")).toHaveCount(2); // VOTO-01 (2 de 4) e VOTO-03 (1 de 2)
  await expect(page.getByText("Divergiu em 1 de 2 votações")).toBeVisible();
  await expect(page.getByText("30% do teto acumulado até mar")).toBeVisible(); // CEAP-05
  await expect(page.getByText("+18% sobre 2022, em valor nominal")).toBeVisible(); // BENS-02
});

test("CEAP-05: gráfico mensal mostra a linha do teto mensal da UF", async ({ page }) => {
  await page.goto(`/parlamentares/${ID}`);
  const grafico = page.locator("section#gastos figure");
  await expect(grafico.locator("figcaption")).toContainText("Teto mensal para SP: R$ 48.727");
  const linha = grafico.locator("[data-teto]");
  await expect(linha).toHaveCount(1);
  // Teto (48.727,46) acima do maior mês do seed (30.000): a escala é o teto, linha no topo.
  await expect(linha).toHaveAttribute("style", /bottom:\s*100%/);
});

test("PROV-02: cada seção mostra fonte, data de coleta e link para o original", async ({ page }) => {
  await page.goto(`/parlamentares/${ID}`);
  for (const secao of ["gastos", "votacoes", "bens"]) {
    const s = page.locator(`section#${secao}`);
    await expect(s.getByText(/^Fonte: .+ · coletado em \d{2}\/\d{2}\/\d{4}/)).toBeVisible();
    await expect(s.getByRole("link", { name: "Ver na fonte" })).toBeVisible();
  }
});

test("PRIV-01/05: CPF mascarado e responsáveis no rodapé", async ({ page }) => {
  await page.goto(`/parlamentares/${ID}`);
  await expect(page.getByText("***.456.789-**")).toBeVisible();
  const rodape = page.locator("footer");
  await expect(rodape.getByText(/^Controlador: /)).toBeVisible();
  await expect(rodape.getByText(/^Encarregado \(LGPD\): /)).toBeVisible();
  // UI-02: rodapé escuro como no protótipo.
  await expect(rodape).toHaveCSS("background-color", "rgb(21, 24, 30)");
});

test("PRIV-06: política de privacidade pelo rodapé, com os mesmos responsáveis", async ({ page }) => {
  await page.goto(`/parlamentares/${ID}`);
  const rodape = page.locator("footer");
  const controlador = await rodape.getByText(/^Controlador: /).textContent();
  const encarregado = (await rodape.getByText(/^Encarregado \(LGPD\): /).textContent())?.replace(/^.*?: /, "");
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
  await expect(page.getByText("Rejeitada a PEC fictícia 12/2026")).toBeVisible();
  await expect(page.getByText("Aprovado o PL fictício 1.234/2026")).toHaveCount(0);
  await expect(page.getByText("Aprovada a MPV fictícia 1.300/2026")).toHaveCount(0);
});

test("VOTO-06/07: votação sem voto mostra 'sem registro' e o filtro de ausências só lista votações sem voto", async ({
  page,
}) => {
  await page.goto(`/parlamentares/${ID}?votos=ausencias`);
  await expect(page.getByText("Aprovada a MPV fictícia 1.300/2026")).toBeVisible();
  await expect(page.getByText("Mantido o veto fictício 9/2026")).toBeVisible(); // voto vazio também é ausência
  await expect(page.getByText("Votou: sem registro")).toHaveCount(2);
  await expect(page.getByText("Rejeitada a PEC fictícia 12/2026")).toHaveCount(0);
  await expect(page.getByText("Aprovado o PL fictício 1.234/2026")).toHaveCount(0);
});

test("MAND-01: lateral lista só órgãos com cargo atual, com o cargo", async ({ page }) => {
  await page.goto(`/parlamentares/${ID}`);
  const item = page.getByRole("listitem").filter({ hasText: "Comissão de Finanças e Tributação" });
  await expect(item).toHaveText("Comissão de Finanças e Tributação · Titular");
  await expect(page.getByText("Comissão de Educação")).toHaveCount(0);
});

for (const [caminho, item, outro] of [
  [`/parlamentares/${ID}`, "Parlamentares", "Metodologia"],
  ["/parlamentares", "Parlamentares", "Fontes"],
  ["/metodologia", "Metodologia", "Parlamentares"],
] as const) {
  test(`NAV-01: em ${caminho} o item ${item} fica ativo com sublinhado de 2 px na cor da marca`, async ({ page }) => {
    await page.goto(caminho);
    const nav = page.getByRole("navigation", { name: "Principal" });
    const ativo = nav.getByRole("link", { name: item });
    await expect(ativo).toHaveAttribute("aria-current", "page");
    await expect(ativo).toHaveCSS("border-bottom-color", "rgb(31, 79, 209)");
    await expect(ativo).toHaveCSS("border-bottom-width", "2px");
    await expect(nav.getByRole("link", { name: outro })).not.toHaveAttribute("aria-current", "page");
  });
}

test("BUSCA-05: campos de busca indicam por onde buscar", async ({ page }) => {
  await page.goto("/parlamentares");
  await expect(page.getByRole("searchbox", { name: "Buscar parlamentar" })).toHaveAttribute(
    "placeholder",
    "Buscar deputado por nome ou UF",
  );
  await expect(page.getByLabel("Nome ou UF")).toHaveAttribute("placeholder", "Ex.: Maria, Silva ou SP");
});

test("BUSCA-04: buscar pela UF no topo lista os deputados da UF", async ({ page }) => {
  await page.goto("/metodologia");
  await page.getByRole("searchbox", { name: "Buscar parlamentar" }).fill("rj");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("link", { name: /João Ilustrativo/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Maria Exemplo/ })).toHaveCount(0);
});

test("METOD-01: metodologia publica a versão", async ({ page }) => {
  await page.goto("/metodologia");
  await expect(page.getByRole("heading", { level: 1, name: "Metodologia" })).toBeVisible();
  await expect(page.getByText(/^Versão 1\.3\./)).toBeVisible();
});

test("CORR-03 e CORR-01: Contestar pré-seleciona a seção e o pedido é registrado", async ({ page }) => {
  await page.goto(`/parlamentares/${ID}`);
  await page.locator("section#gastos").getByRole("link", { name: "Contestar" }).click();
  await expect(page.getByLabel("Qual parte do perfil?")).toHaveValue("gastos");
  await page.getByLabel("O que está errado").fill("O valor de janeiro está duplicado segundo a nota original.");
  await page.getByRole("button", { name: "Enviar pedido" }).click();
  await expect(page.getByText("Pedido recebido.")).toBeVisible();
});

test("EDGE-02/03: deputado sem despesas nem bens", async ({ page }) => {
  await page.goto(`/parlamentares/${SEM_DADOS}`);
  await expect(page.getByText(/^Nenhuma despesa publicada para \d{4}\.$/)).toBeVisible();
  await expect(page.getByText(/Não encontramos declarações de bens/)).toBeVisible();
  const indicadorBens = page.locator("div.rounded-lg").filter({ hasText: "Bens declarados ao TSE" });
  await expect(indicadorBens.getByText("—", { exact: true })).toBeVisible();
  await expect(indicadorBens.getByText("nenhuma declaração encontrada")).toBeVisible();
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
