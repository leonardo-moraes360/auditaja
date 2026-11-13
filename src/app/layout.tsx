import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { Rodape } from "@/components/rodape";
import { Topo } from "@/components/topo";
import { LICENCA_DADOS } from "@/lib/licenca";
import { jsonLd, SITE_DESCRICAO, SITE_NOME, siteUrl, urlAbsoluta } from "@/lib/site";
import "./globals.css";

const SCRIPT_TEMA = `try{if(localStorage.getItem("tema")==="escuro")document.documentElement.classList.add("dark")}catch(e){}`;

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const grotesk = Space_Grotesk({ variable: "--font-grotesk", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: `${SITE_NOME}: fiscalize deputados e senadores`, template: `%s · ${SITE_NOME}` },
  description: SITE_DESCRICAO,
  applicationName: SITE_NOME,
  openGraph: {
    type: "website",
    siteName: SITE_NOME,
    locale: "pt_BR",
    title: { default: `${SITE_NOME}: fiscalize deputados e senadores`, template: `%s · ${SITE_NOME}` },
    description: SITE_DESCRICAO,
  },
  // O X lê og:* como reserva, mas só mostra a imagem grande com summary_large_image.
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
};

/** Site e organização (schema.org): nome, descrição e a busca de parlamentares. */
function dadosDoSite() {
  const base = siteUrl();
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${base}/#site`,
        url: `${base}/`,
        name: SITE_NOME,
        description: SITE_DESCRICAO,
        inLanguage: "pt-BR",
        // Licença dos textos e dados derivados; os dados de origem seguem a licença de cada órgão (/fontes).
        license: LICENCA_DADOS.url,
        publisher: { "@id": `${base}/#organizacao` },
        potentialAction: {
          "@type": "SearchAction",
          target: { "@type": "EntryPoint", urlTemplate: `${base}/parlamentares?q={search_term_string}` },
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "Organization",
        "@id": `${base}/#organizacao`,
        name: SITE_NOME,
        url: `${base}/`,
        logo: urlAbsoluta("/icones/icone-512.png", base),
      },
    ],
  };
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${grotesk.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        {/* Aplica o tema escolhido antes da pintura, sem piscar. Padrão: claro. */}
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(dadosDoSite()) }} />
        <link rel="alternate" type="text/plain" href="/llms.txt" title="Guia do site para agentes de IA (llms.txt)" />
      </head>
      <body className="flex min-h-full flex-col">
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-superficie focus:px-3 focus:py-2"
        >
          Pular para o conteúdo
        </a>
        <Topo />
        <main id="conteudo" className="flex-1">
          {children}
        </main>
        <Rodape />
      </body>
    </html>
  );
}
