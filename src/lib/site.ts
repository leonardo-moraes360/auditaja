/**
 * Endereço público e textos comuns do site, para SEO e leitura por agentes.
 *
 * A URL base vem de NEXT_PUBLIC_SITE_URL (lida no build e no servidor). Sem ela, vale o endereço
 * local de desenvolvimento: canonical, sitemap e Open Graph apontam para lá, então defina a
 * variável antes de publicar.
 */
export const SITE_NOME = "Auditaja";

export const SITE_DESCRICAO =
  "Gastos da cota parlamentar, votações, emendas e bens declarados de deputados federais e senadores, com fonte oficial e data de coleta em cada dado.";

/** Texto alternativo do cartão de compartilhamento do site. */
export const CARTAO_ALT = "Auditaja: veja o que seu deputado ou senador faz com o mandato e com o dinheiro público";

export const SITE_URL_PADRAO = "http://localhost:3000";

/** Origem sem barra no fim. Valor inválido cai no padrão local em vez de quebrar o build. */
export function siteUrl(valor: string | undefined = process.env.NEXT_PUBLIC_SITE_URL): string {
  const v = valor?.trim();
  if (!v) return SITE_URL_PADRAO;
  try {
    const u = new URL(v);
    if (u.protocol !== "https:" && u.protocol !== "http:") return SITE_URL_PADRAO;
    return u.origin;
  } catch {
    return SITE_URL_PADRAO;
  }
}

/** Caminho relativo ("/sobre") → URL absoluta no domínio público. */
export function urlAbsoluta(caminho: string, base: string = siteUrl()): string {
  return new URL(caminho, `${base}/`).toString();
}

/**
 * Serializa JSON-LD para um <script type="application/ld+json">. Troca "<" por < para que um
 * nome vindo da fonte não feche o script (orientação do guia de JSON-LD do Next.js).
 */
export function jsonLd(dados: unknown): string {
  return JSON.stringify(dados).replace(/</g, "\\u003c");
}

/** Robôs que recebem metadata no <head> sem streaming, além da lista padrão do Next.js. */
export const ROBOS_DE_IA = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-User",
  "Claude-SearchBot",
  "anthropic-ai",
  "PerplexityBot",
  "Perplexity-User",
  "CCBot",
  "Google-Extended",
  "Applebot-Extended",
  "Meta-ExternalAgent",
  "Amazonbot",
  "Bytespider",
  "DuckAssistBot",
  "MistralAI-User",
  "cohere-ai",
] as const;

type MetadataDaPagina = {
  titulo: string;
  descricao: string;
  /** Caminho canônico, sem domínio ("/metodologia"). */
  caminho: string;
  tipo?: "website" | "profile";
  indexar?: boolean;
};

/**
 * Title, description, canonical, Open Graph e cartão do X de uma página. O Next.js não completa
 * openGraph campo a campo a partir do layout: cada página precisa repetir site, idioma e URL.
 */
export function metadataDaPagina({ titulo, descricao, caminho, tipo = "website", indexar = true }: MetadataDaPagina) {
  return {
    title: titulo,
    description: descricao,
    alternates: { canonical: caminho },
    openGraph: {
      type: tipo,
      siteName: SITE_NOME,
      locale: "pt_BR",
      url: caminho,
      title: `${titulo} · ${SITE_NOME}`,
      description: descricao,
      // Ao redefinir openGraph, a página perde a imagem do layout (src/app/opengraph-image.tsx). O perfil
      // tem opengraph-image próprio, que só vale se a página não declarar images.
      ...(tipo === "profile"
        ? {}
        : { images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: CARTAO_ALT }] }),
    },
    twitter: {
      card: "summary_large_image" as const,
      title: `${titulo} · ${SITE_NOME}`,
      description: descricao,
      ...(tipo === "profile" ? {} : { images: [{ url: "/twitter-image", alt: CARTAO_ALT }] }),
    },
    ...(indexar ? {} : { robots: { index: false, follow: true } }),
  };
}
