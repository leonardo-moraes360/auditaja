import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { ESCOPO_EXECUTIVO, ESCOPO_JUDICIARIO, ESCOPO_LEGISLATIVO, nomeDoPoder } from "@auditaja/core/poderes";
import { getDb } from "@auditaja/db/client";
import { metadataDaPagina, SITE_NOME } from "@/lib/site";
import { Esqueleto } from "@/components/esqueleto";

export const metadata: Metadata = metadataDaPagina({
  titulo: "Os três poderes",
  descricao:
    "Apanhado do Legislativo, Executivo e Judiciário federais no Auditaja: quem entra no escopo, o que você encontra e para onde ir.",
  caminho: "/poderes",
});

const PODERES = [
  {
    poder: "legislativo" as const,
    href: "/parlamentares",
    escopo: ESCOPO_LEGISLATIVO.descricao,
    oQue: "Gastos da cota, votações, presença, alinhamento, emendas e bens declarados.",
    kpis: "Uso da cota, presença em Plenário, alinhamento com o partido e variação de bens.",
  },
  {
    poder: "executivo" as const,
    href: "/executivo",
    escopo: ESCOPO_EXECUTIVO.descricao,
    oQue: "Viagens a serviço, cartão de pagamento, diárias e bens do Presidente e do Vice.",
    kpis: "Média mensal de gastos, concentração em fornecedor e variação patrimonial.",
  },
  {
    poder: "judiciario" as const,
    href: "/judiciario",
    escopo: ESCOPO_JUDICIARIO.descricao,
    oQue: "Sessões do Plenário do STF, votos, presença e despesas publicadas.",
    kpis: "Presença em sessões, concordância com a maioria do colegiado e média mensal de despesas.",
  },
] as const;

export default function PaginaTresPoderes() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-12 sm:gap-12 sm:py-16">
      <header className="max-w-3xl space-y-4">
        <p className="text-sm font-semibold tracking-wide text-primary uppercase">{SITE_NOME}</p>
        <h1 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl">Os três poderes, lado a lado</h1>
        <p className="text-lg text-muted-foreground">
          O mesmo cuidado com fonte, data e privacidade em cada poder da República — no recorte federal do MVP. Escolha
          um poder para ver as pessoas em exercício.
        </p>
      </header>

      <Suspense fallback={<Esqueleto linhas={3} />}>
        <Contagens />
      </Suspense>

      <section aria-labelledby="por-poder" className="space-y-4">
        <h2 id="por-poder" className="font-heading text-2xl font-bold">
          O que entra em cada poder
        </h2>
        <ul className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {PODERES.map((p) => (
            <li key={p.poder} className="flex flex-col gap-3 rounded-[14px] border bg-card p-5">
              <h3 className="font-heading text-xl font-bold">
                <Link href={p.href} className="text-foreground no-underline hover:underline">
                  {nomeDoPoder(p.poder)}
                </Link>
              </h3>
              <p className="text-sm text-muted-foreground">{p.escopo}</p>
              <p className="text-base leading-normal text-texto-2">
                <span className="font-semibold text-foreground">No perfil: </span>
                {p.oQue}
              </p>
              <p className="text-base leading-normal text-texto-2">
                <span className="font-semibold text-foreground">Indicadores: </span>
                {p.kpis}
              </p>
              <p className="mt-auto pt-2">
                <Link
                  href={p.href}
                  className="inline-flex h-11 items-center rounded-md bg-primary px-4 font-medium text-primary-foreground no-underline hover:bg-primaria-hover"
                >
                  Ver {nomeDoPoder(p.poder).replace("Poder ", "").toLowerCase()}
                </Link>
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="como-ler" className="max-w-3xl space-y-2">
        <h2 id="como-ler" className="font-heading text-2xl font-bold">
          Como ler os números
        </h2>
        <p className="text-muted-foreground">
          Indicadores são pontos de partida para verificação. Cada seção mostra a fonte oficial e a data da coleta. CPF
          de terceiros não é gravado; nomes de prestadores pessoa física viram rótulo genérico. Detalhes em{" "}
          <Link href="/metodologia#tres-poderes">metodologia</Link> e <Link href="/fontes">fontes</Link>.
        </p>
      </section>
    </div>
  );
}

async function Contagens() {
  await connection();
  let legislativo = 0;
  let executivo = 0;
  let judiciario = 0;
  try {
    const db = getDb();
    const [l, e, j] = await Promise.all([
      db
        .selectFrom("parlamentar")
        .select((eb) => eb.fn.countAll<string>().as("n"))
        .where("em_exercicio", "=", true)
        .executeTakeFirstOrThrow(),
      db
        .selectFrom("executivo")
        .select((eb) => eb.fn.countAll<string>().as("n"))
        .where("em_exercicio", "=", true)
        .executeTakeFirstOrThrow(),
      db
        .selectFrom("judiciario")
        .select((eb) => eb.fn.countAll<string>().as("n"))
        .where("em_exercicio", "=", true)
        .executeTakeFirstOrThrow(),
    ]);
    legislativo = Number(l.n);
    executivo = Number(e.n);
    judiciario = Number(j.n);
  } catch {
    /* banco indisponível no build: a página segue sem as contagens */
  }

  const itens = [
    { rotulo: "Legislativo", n: legislativo, href: "/parlamentares" },
    { rotulo: "Executivo", n: executivo, href: "/executivo" },
    { rotulo: "Judiciário", n: judiciario, href: "/judiciario" },
  ];

  return (
    <section aria-labelledby="em-exercicio" className="space-y-3">
      <h2 id="em-exercicio" className="text-lg font-semibold">
        Em exercício na base coletada
      </h2>
      <ul className="flex flex-wrap gap-3">
        {itens.map((i) => (
          <li key={i.rotulo}>
            <Link
              href={i.href}
              className="inline-flex min-h-11 items-center gap-2 rounded-[10px] border border-linha bg-card px-4 font-semibold text-foreground no-underline hover:bg-background"
            >
              <span>{i.rotulo}</span>
              <span className="tabular-nums text-muted-foreground">{i.n}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
