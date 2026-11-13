import { describe, expect, it } from "vitest";
import { ClienteEducado, ColetaBloqueada } from "../../src/http";
import { API_TRANSFEREGOV, paginas, TAMANHO_PAGINA } from "../../src/transferegov";

/** TRI-06, L-002, L-004: paginação do Transferegov contra um servidor falso. */
type Linha = { id: number };

function cliente(responder: (u: URL) => Response, pedidos: URL[] = []) {
  return new ClienteEducado({
    intervaloMinMs: 0,
    dormir: async () => {},
    log: () => {},
    fetchImpl: (async (input: URL | string) => {
      const u = new URL(input.toString());
      if (u.pathname === "/robots.txt") return new Response("Not Found", { status: 404 });
      pedidos.push(u);
      return responder(u);
    }) as typeof fetch,
  });
}

const json = (corpo: unknown, status = 200) =>
  new Response(JSON.stringify(corpo), { status, headers: { "content-type": "application/json" } });

const pagina = (data: Linha[], n: number, total: number) =>
  json({ data, total_pages: total, total_items: total * 2, page_number: n, page_size: TAMANHO_PAGINA });

async function tudo(cli: ClienteEducado) {
  const linhas: Linha[] = [];
  for await (const pg of paginas<Linha>(cli, "planos-acao-especiais", { ano: 2025 }, (l) => l.id)) linhas.push(...pg);
  return linhas;
}

describe("paginas (Transferegov)", () => {
  it("200: segue até total_pages com tamanho_da_pagina=200, uma página por vez", async () => {
    const pedidos: URL[] = [];
    const cli = cliente((u) => {
      const n = Number(u.searchParams.get("pagina"));
      return pagina([{ id: n * 10 }, { id: n * 10 + 1 }], n, 3);
    }, pedidos);
    expect((await tudo(cli)).map((l) => l.id)).toEqual([10, 11, 20, 21, 30, 31]);
    expect(pedidos.map((u) => u.searchParams.get("pagina"))).toEqual(["1", "2", "3"]);
    expect(pedidos.every((u) => u.searchParams.get("tamanho_da_pagina") === "200")).toBe(true);
    expect(pedidos.every((u) => u.searchParams.get("ano") === "2025")).toBe(true);
    expect(pedidos[0].origin + pedidos[0].pathname).toBe(`${API_TRANSFEREGOV}/planos-acao-especiais`);
  });

  it("L-004: id repetido entre páginas aparece uma vez", async () => {
    const cli = cliente((u) => {
      const n = Number(u.searchParams.get("pagina"));
      return n === 1 ? pagina([{ id: 1 }, { id: 2 }], 1, 2) : pagina([{ id: 2 }, { id: 3 }], 2, 2);
    });
    expect((await tudo(cli)).map((l) => l.id)).toEqual([1, 2, 3]);
  });

  for (const status of [429, 404, 422, 500, 503]) {
    it(`TRI-06: HTTP ${status} na segunda página para a paginação com ColetaBloqueada`, async () => {
      const pedidos: URL[] = [];
      const cli = cliente((u) => {
        const n = Number(u.searchParams.get("pagina"));
        return n === 1 ? pagina([{ id: 1 }], 1, 3) : new Response("erro", { status });
      }, pedidos);
      await expect(tudo(cli)).rejects.toBeInstanceOf(ColetaBloqueada);
      // Nunca pula para a terceira página.
      expect(pedidos.some((u) => u.searchParams.get("pagina") === "3")).toBe(false);
    });
  }

  it("TRI-06: 403 vira ColetaBloqueada sem nova tentativa", async () => {
    const pedidos: URL[] = [];
    const cli = cliente(() => new Response("negado", { status: 403 }), pedidos);
    await expect(tudo(cli)).rejects.toBeInstanceOf(ColetaBloqueada);
    expect(pedidos).toHaveLength(1);
  });

  it("200 sem JSON paginado também para com ColetaBloqueada", async () => {
    await expect(tudo(cliente(() => new Response("<html>manutenção</html>", { status: 200 })))).rejects.toBeInstanceOf(
      ColetaBloqueada,
    );
    await expect(tudo(cliente(() => json({ detail: "Not Found" })))).rejects.toBeInstanceOf(ColetaBloqueada);
  });
});
