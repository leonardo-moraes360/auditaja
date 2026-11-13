import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { indiceDeParlamentares, ultimaColetaPorCasa } from "@/data/seo";
import { NOME_UF } from "@auditaja/core/rotulos";
import { caminhoDoPerfil } from "@/lib/seo-perfil";
import { siteUrl, urlAbsoluta } from "@/lib/site";

/**
 * Todas as páginas públicas: as fixas, as listas por Casa e por UF e um perfil por parlamentar.
 * A lista /parlamentares mostra só 60 nomes por vez; sem o sitemap, a maioria dos perfis não seria
 * encontrada por robôs. lastModified é a coleta mais recente da Casa (ou de fonte comum).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();
  const base = siteUrl();
  const [parlamentares, coletas] = await Promise.all([indiceDeParlamentares(), ultimaColetaPorCasa()]);
  const geral = coletas.geral ?? undefined;
  const u = (caminho: string) => urlAbsoluta(caminho, base);
  const fixas: MetadataRoute.Sitemap = [
    { url: u("/"), lastModified: geral, changeFrequency: "weekly", priority: 1 },
    { url: u("/parlamentares"), lastModified: geral, changeFrequency: "weekly", priority: 0.9 },
    {
      url: u("/parlamentares?casa=camara"),
      lastModified: coletas.camara ?? undefined,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: u("/parlamentares?casa=senado"),
      lastModified: coletas.senado ?? undefined,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...Object.keys(NOME_UF)
      .toSorted()
      .map((uf) => ({
        url: u(`/parlamentares?uf=${uf}`),
        lastModified: geral,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      })),
    { url: u("/sobre"), changeFrequency: "monthly", priority: 0.5 },
    { url: u("/metodologia"), changeFrequency: "monthly", priority: 0.5 },
    { url: u("/fontes"), lastModified: geral, changeFrequency: "weekly", priority: 0.4 },
    { url: u("/privacidade"), changeFrequency: "yearly", priority: 0.2 },
  ];
  const perfis: MetadataRoute.Sitemap = parlamentares.map((p) => ({
    url: u(caminhoDoPerfil(p.id)),
    lastModified: coletas[p.casa] ?? undefined,
    changeFrequency: "weekly",
    priority: p.em_exercicio ? 0.8 : 0.4,
  }));
  return [...fixas, ...perfis];
}
