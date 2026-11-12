import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { Rodape } from "@/components/rodape";
import { Topo } from "@/components/topo";
import "./globals.css";

const SCRIPT_TEMA = `try{if(localStorage.getItem("tema")==="escuro")document.documentElement.classList.add("dark")}catch(e){}`;

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const grotesk = Space_Grotesk({ variable: "--font-grotesk", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Auditaja", template: "%s · Auditaja" },
  description:
    "Gastos da cota parlamentar, votações e bens declarados de deputados federais, com fonte e data de coleta em cada dado.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${grotesk.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        {/* Aplica o tema escolhido antes da pintura, sem piscar. Padrão: claro. */}
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />
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
