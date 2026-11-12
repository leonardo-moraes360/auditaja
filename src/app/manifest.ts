import type { MetadataRoute } from "next";

/** Manifesto do app: nome e ícones para instalar na tela inicial (Android, desktop). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Auditaja",
    short_name: "Auditaja",
    description: "Gastos, votações, emendas e bens de deputados e senadores, com fonte e data de coleta em cada dado.",
    lang: "pt-BR",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f7f4",
    theme_color: "#1a44b8",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/icones/icone-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icones/icone-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icones/icone-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
