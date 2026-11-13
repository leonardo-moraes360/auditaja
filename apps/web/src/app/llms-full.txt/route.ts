import { connection } from "next/server";
import { contarPorCasa } from "@/data/perfil";
import { indiceDeParlamentares } from "@/data/seo";
import { linhaDoIndice, llmsTxt } from "@/lib/llms";
import { siteUrl } from "@/lib/site";

/**
 * Versão completa do llms.txt: o guia e o índice de todos os perfis, com link para o Markdown de cada
 * um. Sobre, Metodologia e Privacidade são HTML estático, legível sem JavaScript, e ficam linkados no guia.
 */
export async function GET() {
  await connection();
  const base = siteUrl();
  const [totais, todos] = await Promise.all([contarPorCasa(), indiceDeParlamentares()]);
  const secao = (titulo: string, lista: typeof todos) =>
    lista.length ? `\n### ${titulo}\n\n${lista.map((p) => linhaDoIndice(base, p)).join("\n")}\n` : "";
  const corpo = [
    llmsTxt(base, totais),
    "## Índice de perfis",
    secao(
      "Câmara dos Deputados",
      todos.filter((p) => p.casa === "camara" && p.em_exercicio),
    ),
    secao(
      "Senado Federal",
      todos.filter((p) => p.casa === "senado" && p.em_exercicio),
    ),
    secao(
      "Fora de exercício",
      todos.filter((p) => !p.em_exercicio),
    ),
  ].join("\n");
  return new Response(corpo, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
