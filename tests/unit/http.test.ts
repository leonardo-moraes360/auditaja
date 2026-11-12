import { describe, expect, it } from "vitest";
import { ClienteEducado, ColetaBloqueada, USER_AGENT } from "@/ingest/http";

type Resp = { status: number; body?: string; headers?: Record<string, string> };

function fake(rotas: Record<string, Resp | Resp[] | "erro">, intervaloMinMs?: number) {
  const chamadas: { url: string; ua: string | null }[] = [];
  const fetchImpl = (async (input: URL | string, init?: RequestInit) => {
    const url = input.toString();
    chamadas.push({ url, ua: new Headers(init?.headers).get("User-Agent") });
    const r = rotas[url];
    if (r === "erro") throw new TypeError("fetch failed");
    const resp = Array.isArray(r) ? r.shift()! : (r ?? { status: 404 });
    return new Response(resp.body ?? "", { status: resp.status, headers: resp.headers });
  }) as typeof fetch;
  const esperas: number[] = [];
  const cli = new ClienteEducado({
    fetchImpl,
    dormir: async (ms) => void esperas.push(ms),
    log: () => {},
    intervaloMinMs,
  });
  const contar = (url: string) => chamadas.filter((c) => c.url === url).length;
  return { cli, chamadas, esperas, contar };
}

describe("ClienteEducado (R7)", () => {
  it("identifica-se, lê robots.txt e bloqueia caminho proibido", async () => {
    const { cli, chamadas } = fake({
      "https://x.gov.br/robots.txt": {
        status: 200,
        body: "User-agent: *\nDisallow: /api/",
        headers: { "content-type": "text/plain" },
      },
    });
    await expect(cli.get("https://x.gov.br/api/dados")).rejects.toBeInstanceOf(ColetaBloqueada);
    expect(chamadas).toHaveLength(1);
    expect(chamadas[0].ua).toBe(USER_AGENT);
    expect(USER_AGENT).toMatch(/^Auditaja\/.+\(\+https?:\/\//);
  });

  it("robots.txt 404 permite", async () => {
    const { cli } = fake({ "https://y.gov.br/dados": { status: 200, body: "{}" } });
    await expect(cli.get("https://y.gov.br/dados")).resolves.toBeInstanceOf(Response);
  });

  it("robots.txt servido como página HTML permite (o host não tem robots.txt)", async () => {
    const { cli } = fake({
      "https://h.gov.br/robots.txt": {
        status: 200,
        // Se o HTML fosse lido como robots, estas linhas bloqueariam tudo.
        body: "User-agent: *\nDisallow: /",
        headers: { "content-type": "text/html; charset=utf-8" },
      },
      "https://h.gov.br/dados": { status: 200 },
    });
    await expect(cli.get("https://h.gov.br/dados")).resolves.toBeInstanceOf(Response);
  });

  it("robots.txt 5xx bloqueia tudo", async () => {
    const { cli } = fake({ "https://z.gov.br/robots.txt": { status: 503 } });
    await expect(cli.get("https://z.gov.br/x")).rejects.toBeInstanceOf(ColetaBloqueada);
  });

  it("falha de rede ao ler robots.txt bloqueia tudo", async () => {
    const { cli, contar } = fake({ "https://r.gov.br/robots.txt": "erro" });
    await expect(cli.get("https://r.gov.br/x")).rejects.toBeInstanceOf(ColetaBloqueada);
    expect(contar("https://r.gov.br/x")).toBe(0);
  });

  it("espera o Crawl-delay (5 s) entre requisições ao mesmo host", async () => {
    const { cli, esperas } = fake({
      "https://w.gov.br/robots.txt": {
        status: 200,
        body: "User-agent: *\nCrawl-delay: 5",
        headers: { "content-type": "text/plain" },
      },
      "https://w.gov.br/a": { status: 200 },
      "https://w.gov.br/b": { status: 200 },
    });
    await cli.get("https://w.gov.br/a");
    await cli.get("https://w.gov.br/b");
    const maior = Math.max(...esperas);
    expect(maior).toBeGreaterThanOrEqual(4900);
    expect(maior).toBeLessThanOrEqual(5000);
  });

  it("sem Crawl-delay, o intervalo mínimo é 1 s", async () => {
    const { cli, esperas } = fake({
      "https://m.gov.br/a": { status: 200 },
      "https://m.gov.br/b": { status: 200 },
    });
    await cli.get("https://m.gov.br/a");
    await cli.get("https://m.gov.br/b");
    const maior = Math.max(...esperas);
    expect(maior).toBeGreaterThanOrEqual(900);
    expect(maior).toBeLessThanOrEqual(1000);
  });

  it("em 429 espera o Retry-After e tenta de novo", async () => {
    const { cli, esperas } = fake(
      { "https://v.gov.br/a": [{ status: 429, headers: { "retry-after": "7" } }, { status: 200 }] },
      0,
    );
    await expect(cli.get("https://v.gov.br/a")).resolves.toBeInstanceOf(Response);
    expect(esperas).toEqual([7000]);
  });

  it("em 5xx repete com backoff de 2 s, 4 s e 8 s e desiste após 4 tentativas", async () => {
    const url = "https://q.gov.br/a";
    const { cli, esperas, contar } = fake({ [url]: Array.from({ length: 6 }, () => ({ status: 503 })) }, 0);
    await expect(cli.get(url)).rejects.toThrow(/HTTP 503/);
    expect(esperas).toEqual([2000, 4000, 8000]);
    expect(contar(url)).toBe(4);
  });

  it("5xx seguido de 200 resolve", async () => {
    const url = "https://q2.gov.br/a";
    const { cli, contar } = fake({ [url]: [{ status: 500 }, { status: 200 }] }, 0);
    await expect(cli.get(url)).resolves.toBeInstanceOf(Response);
    expect(contar(url)).toBe(2);
  });

  it.each([401, 403])("em %i para com ColetaBloqueada sem nova tentativa", async (status) => {
    const url = `https://b${status}.gov.br/a`;
    const { cli, contar } = fake({ [url]: [{ status }, { status: 200 }] }, 0);
    await expect(cli.get(url)).rejects.toBeInstanceOf(ColetaBloqueada);
    expect(contar(url)).toBe(1);
  });

  it("403 leva status, content-type e corpo curto do erro (ex.: XML do S3)", async () => {
    const url = "https://s3.gov.br/saida/x.zip";
    const corpo = '<?xml version="1.0"?><Error><Code>AccessDenied</Code></Error>';
    const { cli } = fake({ [url]: { status: 403, body: corpo, headers: { "content-type": "application/xml" } } }, 0);
    const e = await cli.get(url).catch((x: unknown) => x);
    expect(e).toBeInstanceOf(ColetaBloqueada);
    expect((e as ColetaBloqueada).resposta).toEqual({ status: 403, contentType: "application/xml", corpo });
  });

  it("403 em HTML (WAF/captcha) não guarda o corpo", async () => {
    const url = "https://waf.gov.br/x";
    const { cli } = fake(
      { [url]: { status: 403, body: "<html>captcha</html>", headers: { "content-type": "text/html" } } },
      0,
    );
    const e = (await cli.get(url).catch((x: unknown) => x)) as ColetaBloqueada;
    expect(e.resposta).toEqual({ status: 403, contentType: "text/html", corpo: "" });
  });

  it("content-type em maiúsculas é normalizado e o corpo ainda é lido", async () => {
    const url = "https://s3up.gov.br/x.zip";
    const corpo = "<Error><Code>AccessDenied</Code></Error>";
    const { cli } = fake({ [url]: { status: 403, body: corpo, headers: { "content-type": "Application/XML" } } }, 0);
    const e = (await cli.get(url).catch((x: unknown) => x)) as ColetaBloqueada;
    expect(e.resposta).toEqual({ status: 403, contentType: "application/xml", corpo });
  });

  it("corpo de 403 é cortado em 2 KB", async () => {
    const url = "https://grande.gov.br/x";
    const { cli } = fake(
      { [url]: { status: 403, body: "a".repeat(10_000), headers: { "content-type": "text/plain" } } },
      0,
    );
    const e = (await cli.get(url).catch((x: unknown) => x)) as ColetaBloqueada;
    expect(e.resposta?.corpo).toHaveLength(2000);
  });

  it("falha ao ler o corpo do 403 ainda encerra com ColetaBloqueada", async () => {
    const corpo = new ReadableStream<Uint8Array>({
      pull(c) {
        c.error(new TypeError("terminated"));
      },
    });
    const cli = new ClienteEducado({
      fetchImpl: (async (input: URL | string) =>
        input.toString().endsWith("/robots.txt")
          ? new Response("", { status: 404 })
          : new Response(corpo, { status: 403, headers: { "content-type": "application/xml" } })) as typeof fetch,
      dormir: async () => {},
      log: () => {},
      intervaloMinMs: 0,
    });
    const e = (await cli.get("https://quebra.gov.br/x").catch((x: unknown) => x)) as ColetaBloqueada;
    expect(e).toBeInstanceOf(ColetaBloqueada);
    expect(e.resposta?.corpo).toBe("");
  });
});
