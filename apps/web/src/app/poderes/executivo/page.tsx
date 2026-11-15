import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { cargoTitular, ESCOPO_TRES_PODERES } from "@auditaja/core/poderes";
import { listarTitulares } from "@/data/titulares";
import { metadataDaPagina } from "@/lib/site";
import { Esqueleto } from "@/components/esqueleto";

export const metadata: Metadata = metadataDaPagina({
  titulo: "Poder Executivo federal",
  descricao: "Presidente, Vice-presidente e Ministros de Estado com dados públicos e fonte oficial.",
  caminho: "/poderes/executivo",
});

export default function PaginaExecutivo() {
  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-8 px-4 py-10 sm:px-6">
      <header className="max-w-3xl space-y-3">
        <p className="text-sm">
          <Link href="/poderes">Três poderes</Link>
          <span className="text-muted-foreground"> / Executivo</span>
        </p>
        <h1 className="font-heading text-3xl font-bold sm:text-4xl">Poder Executivo federal</h1>
        <p className="text-muted-foreground">
          Cobertura: {ESCOPO_TRES_PODERES.executivo.join("; ")}. Indicadores de gasto são pontos de partida para
          verificação.
        </p>
      </header>
      <Suspense fallback={<Esqueleto className="h-64" />}>
        <Lista />
      </Suspense>
    </div>
  );
}

async function Lista() {
  const titulares = await listarTitulares({ poder: "executivo" });
  if (!titulares.length) {
    return (
      <p className="text-muted-foreground">
        Ainda não há titulares do Executivo neste banco. Rode <code>pnpm ingest executivo</code> ou o seed de teste.
      </p>
    );
  }
  return (
    <ul className="divide-y rounded-[14px] border bg-card">
      {titulares.map((t) => (
        <li key={t.id} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-baseline sm:justify-between">
          <div>
            <p className="font-medium">{t.nome}</p>
            <p className="text-sm text-muted-foreground">
              {cargoTitular(t.casa, t.sexo, { cargo: t.cargo, orgao: t.orgao })}
              {t.sigla_partido ? ` · ${t.sigla_partido}` : ""}
            </p>
          </div>
          <p className="text-sm text-muted-foreground">id {t.id}</p>
        </li>
      ))}
    </ul>
  );
}
