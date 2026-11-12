import { ColetaBloqueada, type ClienteEducado } from "./http";

/**
 * Transferegov, módulo de Transferências Especiais ("emendas Pix"), API pública sem chave.
 * robots.txt do host responde 404 (permitido). Uma página por vez, a 1 req/s (ClienteEducado, R7).
 *
 * Trilha: plano de ação (código da emenda) → relatório de gestão → documentos de liquidação
 * (quem o ente pagou, com CNPJ, valor e data). Os lançamentos bancários não servem: o favorecido
 * vem mascarado. R2: banco, agência e conta do plano nunca são lidos para o banco.
 */
export const API_TRANSFEREGOV = "https://api-publica.transferegov.gestao.gov.br/especiais";
export const LICENCA_TRANSFEREGOV = "API de dados abertos do Transferegov (MGI); dados abertos, Decreto 8.777/2016";
/** Máximo aceito pela API (acima disso, 422). */
export const TAMANHO_PAGINA = 200;

type Pagina<T> = { data: T[]; total_pages: number; total_items: number; page_number: number; page_size: number };

export type Paginacao = {
  /** Recebe o corpo cru de cada resposta (para o SHA-256 da coleta). */
  aoReceber?: (corpo: string) => void;
};

/**
 * Pagina um recurso até `total_pages`, deduplicando por `id` (a base muda todo dia e a paginação
 * é por deslocamento: uma linha pode aparecer em duas páginas). Qualquer resposta que não seja
 * 200 com JSON paginado encerra a coleta com ColetaBloqueada (TRI-06).
 */
export async function* paginas<T>(
  cli: ClienteEducado,
  recurso: string,
  params: Record<string, string | number>,
  id: (linha: T) => string | number,
  op: Paginacao = {},
): AsyncGenerator<T[]> {
  const vistos = new Set<string | number>();
  for (let pagina = 1, total = 1; pagina <= total; pagina++) {
    const url = new URL(`${API_TRANSFEREGOV}/${recurso}`);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
    url.searchParams.set("pagina", String(pagina));
    url.searchParams.set("tamanho_da_pagina", String(TAMANHO_PAGINA));
    let corpo: string;
    try {
      corpo = await (await cli.get(url.toString())).text();
    } catch (e) {
      if (e instanceof ColetaBloqueada) throw e;
      throw new ColetaBloqueada(`Transferegov: ${e instanceof Error ? e.message : String(e)}`);
    }
    let p: Pagina<T>;
    try {
      p = JSON.parse(corpo) as Pagina<T>;
    } catch {
      throw new ColetaBloqueada(`Transferegov: resposta de ${recurso} não é JSON`);
    }
    if (!Array.isArray(p?.data) || !Number.isInteger(p.total_pages)) {
      throw new ColetaBloqueada(`Transferegov: resposta de ${recurso} sem paginação`);
    }
    op.aoReceber?.(corpo);
    total = p.total_pages;
    const novas = p.data.filter((l) => {
      const k = id(l);
      if (vistos.has(k)) return false;
      vistos.add(k);
      return true;
    });
    yield novas;
  }
}
