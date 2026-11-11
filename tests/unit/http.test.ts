import { describe, expect, it } from "vitest";
import { ClienteEducado, ColetaBloqueada, USER_AGENT } from "@/ingest/http";

type Resp = { status: number; body?: string; headers?: Record<string, string> };

function fake(rotas: Record<string, Resp | Resp[]>) {
  const chamadas: { url: string; ua: string | null }[] = [];
  const fetchImpl = (async (input: URL | string, init?: RequestInit) => {
    const url = input.toString();
    chamadas.push({ url, ua: new Headers(init?.headers).get("User-Agent") });
    const r = rotas[url];
    const resp = Array.isArray(r) ? r.shift()! : (r ?? { status: 404 });
    return new Response(resp.body ?? "", { status: resp.status, headers: resp.headers });
  }) as typeof fetch;
  const esperas: number[] = [];
  const cli = new ClienteEducado({
    fetchImpl,
    dormir: async (ms) => void esperas.push(ms),
    log: () => {},
  });
  return { cli, chamadas, esperas };
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

  it("robots.txt 404 permite; página HTML no lugar do robots também", async () => {
    const { cli } = fake({ "https://y.gov.br/dados": { status: 200, body: "{}" } });
    await expect(cli.get("https://y.gov.br/dados")).resolves.toBeInstanceOf(Response);
  });

  it("robots.txt 5xx bloqueia tudo", async () => {
    const { cli } = fake({ "https://z.gov.br/robots.txt": { status: 503 } });
    await expect(cli.get("https://z.gov.br/x")).rejects.toBeInstanceOf(ColetaBloqueada);
  });

  it("respeita intervalo mínimo e Crawl-delay entre requisições ao mesmo host", async () => {
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
    expect(esperas.some((ms) => ms > 4000)).toBe(true);
  });

  it("faz backoff em 429 honrando Retry-After e desiste em 403", async () => {
    const { cli, esperas } = fake({
      "https://v.gov.br/a": [{ status: 429, headers: { "retry-after": "7" } }, { status: 200 }],
      "https://v.gov.br/b": { status: 403 },
    });
    await expect(cli.get("https://v.gov.br/a")).resolves.toBeInstanceOf(Response);
    expect(esperas).toContain(7000);
    await expect(cli.get("https://v.gov.br/b")).rejects.toBeInstanceOf(ColetaBloqueada);
  });
});
