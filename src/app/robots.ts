import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

/**
 * Todos os robôs, inclusive os de IA e de treino de modelos, podem ler o site (decisão de 13/11/2026:
 * dados públicos de interesse coletivo). Os formulários (contestar, acompanhar) não são bloqueados aqui: têm
 * `noindex, follow`, e um Disallow impediria o robô de ler esse noindex.
 */
export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${base}/sitemap.xml`,
  };
}
