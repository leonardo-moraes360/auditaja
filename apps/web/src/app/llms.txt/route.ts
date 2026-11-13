import { connection } from "next/server";
import { contarPorCasa } from "@/data/perfil";
import { llmsTxt } from "@/lib/llms";
import { siteUrl } from "@/lib/site";

/** Guia do site para agentes de IA (formato llms.txt). */
export async function GET() {
  await connection();
  const corpo = llmsTxt(siteUrl(), await contarPorCasa());
  return new Response(corpo, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
