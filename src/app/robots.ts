import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

/**
 * Todos os robôs, inclusive os de IA e de treino de modelos, podem ler o site (decisão de 13/11/2026:
 * dados públicos de interesse coletivo). Ficam de fora só os formulários, que não têm conteúdo próprio.
 */
export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/parlamentares/*/contestar", "/parlamentares/*/acompanhar"] }],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
