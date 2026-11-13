import { expect, test, type APIRequestContext } from "@playwright/test";

// Dados fictícios de packages/db/src/seed.ts. O domínio vem de NEXT_PUBLIC_SITE_URL no build; os testes leem
// o domínio do próprio robots.txt para não depender dele.
const DEPUTADA = 900000001;
const SENADOR = 10009001;
const GPTBOT = "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.2; +https://openai.com/gptbot)";
const GOOGLEBOT =
  "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Googlebot/2.1; +http://www.google.com/bot.html) Chrome/130.0.0.0 Safari/537.36";
const CLAUDEBOT =
  "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ClaudeBot/1.0; +claudebot@anthropic.com)";

test.skip(({ isMobile }) => isMobile, "respostas HTTP não dependem da largura da tela");

async function dominio(request: APIRequestContext) {
  const robots = await (await request.get("/robots.txt")).text();
  return robots.match(/^Sitemap: (.+)\/sitemap\.xml$/m)![1];
}

/** <head> como um robô sem JavaScript recebe (metadata sem streaming). */
async function cabecalho(request: APIRequestContext, caminho: string, ua = GPTBOT) {
  const r = await request.get(caminho, { headers: { "User-Agent": ua } });
  expect(r.status()).toBe(200);
  const html = await r.text();
  return { html, head: html.split("</head>")[0] };
}

const meta = (head: string, chave: string) =>
  head.match(new RegExp(`<meta (?:name|property)="${chave}" content="([^"]*)"`))?.[1] ?? null;
const canonical = (head: string) => head.match(/<link rel="canonical" href="([^"]+)"/)?.[1] ?? null;

test("robots.txt libera todos os robôs e aponta o sitemap; formulários usam noindex", async ({ request }) => {
  const r = await request.get("/robots.txt");
  const t = await r.text();
  expect(t).toMatch(/^User-Agent: \*$/m);
  expect(t).toMatch(/^Allow: \/$/m);
  // Um Disallow esconderia o noindex dos formulários dos robôs.
  expect(t).not.toContain("Disallow");
  expect(t).not.toMatch(/GPTBot|ClaudeBot|CCBot/);
  expect(t).toMatch(/^Sitemap: https?:\/\/.+\/sitemap\.xml$/m);
});

test("sitemap.xml lista páginas fixas, listas por UF e todos os perfis", async ({ request }) => {
  const base = await dominio(request);
  const xml = await (await request.get("/sitemap.xml")).text();
  for (const c of [
    "/",
    "/parlamentares",
    "/parlamentares?casa=senado",
    "/parlamentares?uf=SP",
    "/metodologia",
    "/fontes",
  ]) {
    expect(xml).toContain(`<loc>${base}${c.replace("&", "&amp;")}</loc>`);
  }
  // Os 7 perfis do seed, inclusive fora de exercício.
  for (const id of [900000001, 900000002, 900000003, 10009001, 10009002, 10009003, 10009004]) {
    expect(xml).toContain(`<loc>${base}/parlamentares/${id}</loc>`);
  }
  expect(xml).not.toContain("/contestar");
  expect(xml).toMatch(/<lastmod>\d{4}-\d{2}-\d{2}T/);
});

test("perfil: title, description, canonical sem filtros, Open Graph, X e alternativas", async ({ request }) => {
  const base = await dominio(request);
  const { head } = await cabecalho(request, `/parlamentares/${DEPUTADA}?ano=2026&votos=divergiu`);
  expect(head).toContain("<title>Maria Exemplo (PFX-SP), deputada federal · Auditaja</title>");
  expect(meta(head, "description")).toMatch(/^Deputada federal por São Paulo\. Cota parlamentar em 2026: R\$/);
  expect(canonical(head)).toBe(`${base}/parlamentares/${DEPUTADA}`);
  expect(meta(head, "og:type")).toBe("profile");
  expect(meta(head, "og:title")).toBe("Maria Exemplo (PFX-SP), deputada federal · Auditaja");
  expect(meta(head, "og:site_name")).toBe("Auditaja");
  expect(meta(head, "og:locale")).toBe("pt_BR");
  expect(meta(head, "og:image")).toContain(`${base}/parlamentares/${DEPUTADA}/opengraph-image`);
  expect(meta(head, "twitter:card")).toBe("summary_large_image");
  expect(meta(head, "twitter:image")).toContain(`/parlamentares/${DEPUTADA}/twitter-image`);
  expect(head).toContain(`<link rel="alternate" type="text/markdown" href="${base}/parlamentares/${DEPUTADA}.md"/>`);
  expect(head).toContain(`type="application/atom+xml"`);
});

test("ClaudeBot e Googlebot também recebem a metadata no <head>", async ({ request }) => {
  for (const ua of [CLAUDEBOT, GOOGLEBOT]) {
    const { head } = await cabecalho(request, `/parlamentares/${SENADOR}`, ua);
    expect(head).toContain("<title>Otávio Modelo (PFX-MG), senador · Auditaja</title>");
    expect(canonical(head)).toMatch(new RegExp(`/parlamentares/${SENADOR}$`));
  }
});

test("JSON-LD do perfil e do site é válido e descreve a pessoa", async ({ request }) => {
  const { html } = await cabecalho(request, `/parlamentares/${SENADOR}`);
  const blocos = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) =>
    JSON.parse(m[1]),
  );
  const tipos = blocos.flatMap((b) => (b["@graph"] as { "@type": string }[]).map((g) => g["@type"]));
  expect(tipos).toEqual(
    expect.arrayContaining(["WebSite", "Organization", "ProfilePage", "Person", "BreadcrumbList", "Dataset"]),
  );
  const pessoa = blocos.flatMap((b) => b["@graph"]).find((g) => g["@type"] === "Person");
  expect(pessoa).toMatchObject({
    name: "Otávio Modelo",
    jobTitle: "Senador",
    sameAs: ["https://www25.senado.leg.br/web/senadores/senador/-/perfil/9001"],
  });
  expect(JSON.stringify(blocos)).not.toMatch(/1968-02-03|OTÁVIO MODELO PEREIRA/);
  const grafo = blocos.flatMap((b) => b["@graph"]) as { "@type": string; license?: string }[];
  const ccBy = "https://creativecommons.org/licenses/by/4.0/";
  expect(grafo.find((g) => g["@type"] === "WebSite")?.license).toBe(ccBy);
  expect(grafo.filter((g) => g["@type"] === "Dataset").every((d) => d.license === ccBy)).toBe(true);
});

test("perfil em Markdown: /{id}.md responde text/markdown sem concorrer no índice", async ({ request }) => {
  const r = await request.get(`/parlamentares/${DEPUTADA}.md`);
  expect(r.status()).toBe(200);
  expect(r.headers()["content-type"]).toBe("text/markdown; charset=utf-8");
  expect(r.headers()["x-robots-tag"]).toBe("noindex, follow");
  expect(r.headers()["link"]).toMatch(new RegExp(`/parlamentares/${DEPUTADA}>; rel="canonical"`));
  const md = await r.text();
  expect(md).toMatch(/^# Maria Exemplo \(PFX-SP\), deputada federal$/m);
  expect(md).toContain("## Gastos da cota parlamentar (CEAP) em 2026");
  expect(md).toContain("Prestadores pessoa física (somados)");
  expect(md).toContain("Licença deste resumo e dos CSVs: CC BY 4.0");
  const inexistente = await request.get("/parlamentares/1.md");
  expect(inexistente.status()).toBe(404);
});

test("llms.txt e llms-full.txt: guia e índice de todos os perfis", async ({ request }) => {
  const base = await dominio(request);
  const curto = await request.get("/llms.txt");
  expect(curto.headers()["content-type"]).toBe("text/plain; charset=utf-8");
  const t = await curto.text();
  expect(t.startsWith("# Auditaja\n\n> ")).toBe(true);
  expect(t).toContain(`[Metodologia](${base}/metodologia)`);
  expect(t).toContain(`[Licença](${base}/sobre#licenca)`);
  const completo = await (await request.get("/llms-full.txt")).text();
  expect(completo).toContain(`- [Maria Exemplo](${base}/parlamentares/${DEPUTADA}.md): Deputada federal, PFX-SP`);
  expect(completo).toMatch(/### Fora de exercício\n\n- \[/);
});

test("security.txt (RFC 9116): relato privado, política e validade a partir do build", async ({ request }) => {
  const base = await dominio(request);
  const r = await request.get("/.well-known/security.txt");
  expect(r.status()).toBe(200);
  expect(r.headers()["content-type"]).toBe("text/plain; charset=utf-8");
  const t = await r.text();
  expect(t).toMatch(/^Contact: https:\/\/github\.com\/leonardo-moraes360\/auditaja\/security\/advisories\/new$/m);
  expect(t).toMatch(/^Policy: https:\/\/github\.com\/leonardo-moraes360\/auditaja\/blob\/main\/SECURITY\.md$/m);
  expect(t).toContain(`Canonical: ${base}/.well-known/security.txt`);
  const expira = new Date(t.match(/^Expires: (\S+)$/m)![1]);
  const dias = (expira.getTime() - Date.now()) / 86_400_000;
  expect(dias).toBeGreaterThan(0);
  expect(dias).toBeLessThan(365);
});

test("busca (?q=) e formulários ficam fora do índice; listas por UF têm canonical próprio", async ({ request }) => {
  const base = await dominio(request);
  const busca = await cabecalho(request, "/parlamentares?q=maria");
  expect(meta(busca.head, "robots")).toBe("noindex, follow");
  const uf = await cabecalho(request, "/parlamentares?uf=SP&casa=senado&q=");
  expect(canonical(uf.head)).toBe(`${base}/parlamentares?casa=senado&amp;uf=SP`);
  expect(uf.head).toContain("<title>São Paulo: senadores · Auditaja</title>");
  const form = await cabecalho(request, `/parlamentares/${DEPUTADA}/contestar`);
  expect(meta(form.head, "robots")).toBe("noindex, follow");
});

test("páginas institucionais: canonical e Open Graph completos", async ({ request }) => {
  const base = await dominio(request);
  for (const c of ["/sobre", "/metodologia", "/fontes", "/privacidade"]) {
    const { head } = await cabecalho(request, c);
    expect(canonical(head)).toBe(`${base}${c}`);
    expect(meta(head, "og:url")).toBe(`${base}${c}`);
    expect(meta(head, "og:title")).not.toContain("Auditaja · Auditaja");
    expect(meta(head, "description")?.length).toBeGreaterThan(50);
    expect(meta(head, "og:image")).toContain("/opengraph-image");
  }
  const inicio = await cabecalho(request, "/");
  expect(inicio.head).toContain("<title>Auditaja: fiscalize deputados e senadores</title>");
  // O Next.js normaliza a raiz sem barra final; para buscadores é a mesma URL.
  expect(canonical(inicio.head)).toBe(base);
});

test("cartões de compartilhamento são PNG 1200×630", async ({ request }) => {
  for (const c of [
    "/opengraph-image",
    `/parlamentares/${DEPUTADA}/opengraph-image`,
    `/parlamentares/${SENADOR}/twitter-image`,
  ]) {
    const r = await request.get(c);
    expect(r.status()).toBe(200);
    expect(r.headers()["content-type"]).toBe("image/png");
    const png = await r.body();
    expect(png.readUInt32BE(16)).toBe(1200);
    expect(png.readUInt32BE(20)).toBe(630);
  }
});

test("rodapé leva à licença (CC BY nos dados, AGPL no código) na página Sobre", async ({ page }) => {
  await page.goto("/sobre");
  const link = page.locator("footer").getByRole("link", { name: "Licença: dados CC BY 4.0, código AGPL-3.0" });
  await expect(link.filter({ visible: true })).toHaveCount(1);
  await expect(
    page.locator("footer").getByRole("link", { name: "Código-fonte" }).filter({ visible: true }),
  ).toHaveAttribute("href", "https://github.com/leonardo-moraes360/auditaja");
  await link.filter({ visible: true }).click();
  await expect(page).toHaveURL(/\/sobre#licenca$/);
  const secao = page.locator("#licenca");
  await expect(secao.getByRole("heading", { name: "Licença" })).toBeVisible();
  await expect(secao.getByRole("link", { name: /CC BY 4\.0/ })).toHaveAttribute(
    "href",
    "https://creativecommons.org/licenses/by/4.0/deed.pt-br",
  );
  await expect(secao.getByText("O nome Auditaja e o logo não estão licenciados")).toBeVisible();
});
