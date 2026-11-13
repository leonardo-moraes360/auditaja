import type { Metadata } from "next";
import Link from "next/link";
import { NOME_UF } from "@auditaja/core/rotulos";
import { metadataDaPagina, SITE_DESCRICAO, SITE_NOME } from "@/lib/site";

export const metadata: Metadata = {
  ...metadataDaPagina({ titulo: "Fiscalize deputados e senadores", descricao: SITE_DESCRICAO, caminho: "/" }),
  // A página inicial usa o título padrão do layout, sem o sufixo " · Auditaja".
  title: { absolute: `${SITE_NOME}: fiscalize deputados e senadores` },
};

const UFS = Object.keys(NOME_UF).toSorted();

const O_QUE_VER = [
  ["Gastos do gabinete", "Quanto usou da verba do gabinete (a cota), com o quê e com quais empresas."],
  ["Pontos para verificar", "Empresas punidas pelo governo e gastos fora do padrão. Não são acusação."],
  ["Emendas", "Quanto dinheiro do Orçamento indicou e quem recebeu."],
  ["Votos e presença", "Se foi às votações e se votou como o partido pediu."],
] as const;

export default function Inicio() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-12 sm:gap-12 sm:py-16">
      <div className="max-w-3xl space-y-6">
        <h1 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl">
          Veja o que seu deputado ou senador faz com o mandato e com o dinheiro público.
        </h1>
        <p className="text-lg text-muted-foreground">
          Quanto gastou da verba do gabinete, como votou, para onde mandou emendas e quais bens declarou. Tudo com link
          para a fonte oficial e a data em que foi coletado.
        </p>
        <form
          action="/parlamentares"
          role="search"
          aria-label="Buscar deputado ou senador"
          className="flex max-w-xl flex-col gap-2 sm:flex-row"
        >
          <label htmlFor="busca-inicio" className="sr-only">
            Nome do deputado ou senador
          </label>
          <input
            id="busca-inicio"
            name="q"
            type="search"
            placeholder="Nome do deputado ou senador"
            className="h-11 rounded-md border border-input bg-superficie px-4 sm:flex-1"
          />
          <button
            type="submit"
            className="h-11 rounded-md bg-primary px-5 font-medium text-primary-foreground hover:bg-primaria-hover"
          >
            Buscar
          </button>
        </form>
      </div>

      <section aria-labelledby="por-estado" className="flex flex-col gap-3">
        <h2 id="por-estado" className="text-lg font-semibold">
          Ou escolha seu estado
        </h2>
        <ul className="flex flex-wrap gap-2">
          {UFS.map((uf) => (
            <li key={uf}>
              <Link
                href={`/parlamentares?uf=${uf}`}
                className="inline-flex h-11 min-w-[52px] items-center justify-center rounded-[10px] border border-linha bg-card px-2 font-semibold text-foreground no-underline hover:bg-background"
              >
                {uf}
                <span className="sr-only"> ({NOME_UF[uf]})</span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="text-sm text-muted-foreground">
          Cada estado mostra os 3 senadores e os deputados federais em exercício. Ou{" "}
          <Link href="/parlamentares">veja a lista completa</Link>.
        </p>
      </section>

      <section aria-labelledby="o-que-ver" className="flex flex-col gap-3">
        <h2 id="o-que-ver" className="sr-only">
          O que você encontra em cada perfil
        </h2>
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {O_QUE_VER.map(([titulo, texto]) => (
            <li key={titulo} className="flex flex-col gap-1.5 rounded-[14px] border bg-card p-4">
              <strong className="text-base">{titulo}</strong>
              <span className="text-base leading-normal text-texto-2">{texto}</span>
            </li>
          ))}
        </ul>
        <p className="text-sm text-muted-foreground">
          Fontes: Câmara dos Deputados, Senado Federal, TSE e Portal da Transparência (CGU).{" "}
          <Link href="/sobre">Como funciona</Link>
        </p>
      </section>
    </div>
  );
}
