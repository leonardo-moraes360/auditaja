/**
 * Parser mínimo de robots.txt (RFC 9309) para a regra R7.
 * - grupo escolhido pelo user-agent mais específico que casar; senão `*`;
 * - regra vencedora = caminho mais longo; empate favorece `Allow`;
 * - suporta `*` e `$` nos caminhos e `Crawl-delay`.
 */

type Regra = { allow: boolean; path: string };
type Grupo = { agentes: string[]; regras: Regra[]; crawlDelay: number | null };

export type Robots = {
  permite(path: string): boolean;
  crawlDelaySegundos: number | null;
};

export function parseRobots(texto: string, userAgent: string): Robots {
  const grupos: Grupo[] = [];
  let atual: Grupo | null = null;
  let ultimaFoiAgente = false;

  for (const linhaBruta of texto.split(/\r?\n/)) {
    const linha = linhaBruta.replace(/#.*$/, "").trim();
    if (!linha) continue;
    const idx = linha.indexOf(":");
    if (idx < 0) continue;
    const chave = linha.slice(0, idx).trim().toLowerCase();
    const valor = linha.slice(idx + 1).trim();

    if (chave === "user-agent") {
      if (!atual || !ultimaFoiAgente) {
        atual = { agentes: [], regras: [], crawlDelay: null };
        grupos.push(atual);
      }
      atual.agentes.push(valor.toLowerCase());
      ultimaFoiAgente = true;
      continue;
    }
    ultimaFoiAgente = false;
    if (!atual) continue;
    if (chave === "allow" || chave === "disallow") {
      if (valor === "" && chave === "disallow") continue; // "Disallow:" vazio = permite tudo
      atual.regras.push({ allow: chave === "allow", path: valor });
    } else if (chave === "crawl-delay") {
      const n = Number(valor);
      if (Number.isFinite(n) && n >= 0) atual.crawlDelay = n;
    }
  }

  const produto = userAgent.split("/")[0].trim().toLowerCase();
  const especificos = grupos.filter((g) => g.agentes.some((a) => a !== "*" && produto.includes(a)));
  const aplicaveis = especificos.length ? especificos : grupos.filter((g) => g.agentes.includes("*"));
  const regras = aplicaveis.flatMap((g) => g.regras);
  const delays = aplicaveis.map((g) => g.crawlDelay).filter((d): d is number => d !== null);

  return {
    crawlDelaySegundos: delays.length ? Math.max(...delays) : null,
    permite(path: string) {
      let melhor: Regra | null = null;
      for (const r of regras) {
        if (!casa(r.path, path)) continue;
        if (!melhor || r.path.length > melhor.path.length || (r.path.length === melhor.path.length && r.allow)) {
          melhor = r;
        }
      }
      return melhor ? melhor.allow : true;
    },
  };
}

function casa(padrao: string, path: string): boolean {
  const ancorado = padrao.endsWith("$");
  const corpo = ancorado ? padrao.slice(0, -1) : padrao;
  const re = corpo
    .split("*")
    .map((p) => p.replace(/[.+?^${}()|[\]\\]/g, "\\$&"))
    .join(".*");
  return new RegExp(`^${re}${ancorado ? "$" : ""}`).test(path);
}

/** Robots que permite tudo (404/410 e demais 4xx, conforme RFC 9309 §2.3.1.3). */
export const PERMITE_TUDO: Robots = { permite: () => true, crawlDelaySegundos: null };
/** Robots que bloqueia tudo (5xx ou rede, conforme RFC 9309 §2.3.1.4). */
export const BLOQUEIA_TUDO: Robots = { permite: () => false, crawlDelaySegundos: null };
