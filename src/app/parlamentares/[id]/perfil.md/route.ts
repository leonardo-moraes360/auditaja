import { emendasDoParlamentar } from "@/data/emendas";
import { perfilParlamentar } from "@/data/perfil";
import { markdownDoPerfil } from "@/lib/markdown-perfil";
import { caminhoDoPerfil } from "@/lib/seo-perfil";
import { siteUrl, urlAbsoluta } from "@/lib/site";

/**
 * Perfil em Markdown para agentes de IA e leitores de texto. Também responde em /parlamentares/{id}.md
 * (rewrite no next.config.ts) e é anunciado no <head> do perfil como alternativa text/markdown.
 */
export async function GET(_request: Request, ctx: RouteContext<"/parlamentares/[id]/perfil.md">) {
  const { id: idTexto } = await ctx.params;
  const id = /^\d{1,9}$/.test(idTexto) ? Number(idTexto) : null;
  const perfil = id ? await perfilParlamentar(id) : null;
  if (!id || !perfil) {
    return new Response("# Parlamentar não encontrado\n", {
      status: 404,
      headers: { "Content-Type": "text/markdown; charset=utf-8" },
    });
  }
  const base = siteUrl();
  const corpo = markdownDoPerfil(perfil, await emendasDoParlamentar(id, undefined), base);
  return new Response(corpo, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      // A página HTML é a versão canônica; o Markdown não deve concorrer com ela no índice.
      Link: `<${urlAbsoluta(caminhoDoPerfil(id), base)}>; rel="canonical"`,
      "X-Robots-Tag": "noindex, follow",
    },
  });
}
