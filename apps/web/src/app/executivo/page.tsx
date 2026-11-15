import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { cargoExecutivo } from "@auditaja/core/poderes";
import { listarExecutivo } from "@/data/executivo";
import { metadataDaPagina } from "@/lib/site";
import { Esqueleto } from "@/components/esqueleto";

export const metadata: Metadata = metadataDaPagina({
  titulo: "Poder Executivo federal",
  descricao:
    "Presidente, Vice-Presidente e Ministros de Estado: viagens a serviço, cartão de pagamento e bens declarados, com fonte oficial.",
  caminho: "/executivo",
});

export default function PaginaExecutivo() {
  return (
    <div className="mx-auto max-w-[1200px] space-y-6 px-4 py-8 sm:px-6">
      <header className="max-w-3xl space-y-2">
        <h1 className="font-heading text-3xl font-bold">Poder Executivo federal</h1>
        <p className="text-muted-foreground">
          Presidente, Vice-Presidente e Ministros de Estado em exercício. Gastos com viagens e cartão e bens declarados
          ao TSE, com link para a fonte.
        </p>
      </header>
      <Suspense fallback={<Esqueleto linhas={4} />}>
        <Lista />
      </Suspense>
    </div>
  );
}

async function Lista() {
  await connection();
  const lista = await listarExecutivo();
  if (lista.length === 0) {
    return <p className="text-muted-foreground">Nenhum titular do Executivo coletado ainda.</p>;
  }
  return (
    <ul className="divide-y rounded-[14px] border bg-card">
      {lista.map((t) => (
        <li key={t.id}>
          <Link
            href={`/executivo/${t.id}`}
            className="flex flex-col gap-0.5 px-4 py-3 no-underline hover:bg-background sm:flex-row sm:items-baseline sm:justify-between"
          >
            <span className="font-semibold text-foreground">{t.nome}</span>
            <span className="text-sm text-muted-foreground">
              {cargoExecutivo(t.cargo, t.sexo)}
              {t.orgao ? ` · ${t.orgao}` : ""}
              {t.sigla_partido ? ` · ${t.sigla_partido}` : ""}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
