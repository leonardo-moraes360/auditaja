import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { ESCOPO_TRES_PODERES, nomeDoPoder, type Poder } from "@auditaja/core/poderes";
import { painelTresPoderes, ROTULOS_KPI } from "@auditaja/core/metrics-poderes";
import { brl } from "@auditaja/core/format";
import { contarPorPoder, gastosPorPoder } from "@/data/titulares";
import { metadataDaPagina } from "@/lib/site";
import { Esqueleto } from "@/components/esqueleto";

export const metadata: Metadata = metadataDaPagina({
  titulo: "Três poderes",
  descricao:
    "Apanhado do Legislativo, Executivo e Judiciário federais no Auditaja: titulares em exercício, gastos publicados e indicadores como ponto de partida para verificação.",
  caminho: "/poderes",
});

const LINKS: Record<Poder, { href: string; rotulo: string }> = {
  legislativo: { href: "/parlamentares", rotulo: "Ver parlamentares" },
  executivo: { href: "/poderes/executivo", rotulo: "Ver Executivo" },
  judiciario: { href: "/poderes/judiciario", rotulo: "Ver Judiciário" },
};

const CARGOS: Record<Poder, readonly string[]> = {
  legislativo: ESCOPO_TRES_PODERES.legislativo,
  executivo: ESCOPO_TRES_PODERES.executivo,
  judiciario: ESCOPO_TRES_PODERES.judiciario,
};

const FONTES: Record<Poder, readonly string[]> = {
  legislativo: ESCOPO_TRES_PODERES.fontes.legislativo,
  executivo: ESCOPO_TRES_PODERES.fontes.executivo,
  judiciario: ESCOPO_TRES_PODERES.fontes.judiciario,
};

export default function PaginaPoderes() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-12 sm:gap-12 sm:py-16">
      <header className="max-w-3xl space-y-4">
        <p className="text-sm font-medium text-muted-foreground">Esfera federal · {ESCOPO_TRES_PODERES.esfera}</p>
        <h1 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl">Os três poderes em dados abertos</h1>
        <p className="text-lg text-muted-foreground">
          O Auditaja reúne titulares do Legislativo, do Executivo e do Judiciário federais com a mesma lógica de
          proveniência e privacidade. Os números abaixo são pontos de partida para verificação, não acusações.
        </p>
      </header>

      <Suspense
        fallback={
          <div className="grid gap-4 sm:grid-cols-3">
            <Esqueleto className="h-40" />
            <Esqueleto className="h-40" />
            <Esqueleto className="h-40" />
          </div>
        }
      >
        <Painel />
      </Suspense>

      <section aria-labelledby="escopo" className="space-y-3">
        <h2 id="escopo" className="font-heading text-xl font-bold">
          Escopo desta cobertura
        </h2>
        <p className="max-w-3xl text-muted-foreground">
          Só a esfera federal. Fora: governadores, prefeitos, tribunais regionais e demais tribunais superiores.
        </p>
        <ul className="grid gap-4 sm:grid-cols-3">
          {(["legislativo", "executivo", "judiciario"] as const).map((poder) => (
            <li key={poder} className="rounded-[14px] border bg-card p-4">
              <h3 className="font-heading text-lg font-semibold">{nomeDoPoder(poder)}</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-texto-2">
                {CARGOS[poder].map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
              <p className="mt-3 text-sm text-muted-foreground">Fontes: {FONTES[poder].join("; ")}.</p>
              <p className="mt-3">
                <Link href={LINKS[poder].href} className="font-medium">
                  {LINKS[poder].rotulo}
                </Link>
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="kpis" className="space-y-2">
        <h2 id="kpis" className="font-heading text-xl font-bold">
          Indicadores comuns
        </h2>
        <p className="max-w-3xl text-muted-foreground">
          Gastos no período, média mensal e composição por tipo existem nos três poderes. Presença e alinhamento
          continuam só no Legislativo, onde há votação nominal com orientação publicada.
        </p>
        <ul className="flex flex-wrap gap-2 text-sm">
          {Object.values(ROTULOS_KPI).map((r) => (
            <li key={r} className="rounded-[8px] border border-linha bg-superficie px-3 py-1.5">
              {r}
            </li>
          ))}
        </ul>
        <p className="text-sm text-muted-foreground">
          Metodologia detalhada do Legislativo em <Link href="/metodologia">/metodologia</Link>. Privacidade:{" "}
          <Link href="/privacidade">/privacidade</Link>.
        </p>
      </section>
    </div>
  );
}

async function Painel() {
  await connection();
  const ano = new Date().getFullYear();
  const [contagem, gastos] = await Promise.all([contarPorPoder(), gastosPorPoder(ano)]);
  const painel = painelTresPoderes(
    (["legislativo", "executivo", "judiciario"] as const).map((poder) => ({
      poder,
      titulares: contagem[poder],
      totalGastos: gastos[poder],
    })),
  );

  return (
    <section aria-labelledby="painel" className="space-y-3">
      <h2 id="painel" className="font-heading text-xl font-bold">
        Em exercício agora
      </h2>
      <ul className="grid gap-4 sm:grid-cols-3">
        {painel.map((p) => (
          <li key={p.poder} className="flex flex-col gap-2 rounded-[14px] border bg-card p-4">
            <h3 className="font-heading text-lg font-semibold">{nomeDoPoder(p.poder)}</h3>
            <p className="text-3xl font-bold tabular-nums">{p.titulares}</p>
            <p className="text-sm text-muted-foreground">titulares em exercício no banco</p>
            <p className="text-sm">
              Gastos {ano}: <strong className="tabular-nums">{brl(p.totalGastos)}</strong>
            </p>
            <p className="text-sm text-muted-foreground">
              Média por titular:{" "}
              {p.mediaPorTitular === null ? (
                "sem dados"
              ) : (
                <span className="tabular-nums">{brl(p.mediaPorTitular)}</span>
              )}
            </p>
            <Link href={LINKS[p.poder].href} className="mt-auto text-sm font-medium">
              {LINKS[p.poder].rotulo}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
