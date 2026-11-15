import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { cargoJudiciario } from "@auditaja/core/poderes";
import { listarJudiciario } from "@/data/judiciario";
import { metadataDaPagina } from "@/lib/site";
import { Esqueleto } from "@/components/esqueleto";

export const metadata: Metadata = metadataDaPagina({
  titulo: "Poder Judiciário federal",
  descricao: "Ministros do STF: presença em sessões do Plenário, votos e despesas publicadas, com fonte oficial.",
  caminho: "/judiciario",
});

export default function PaginaJudiciario() {
  return (
    <div className="mx-auto max-w-[1200px] space-y-6 px-4 py-8 sm:px-6">
      <header className="max-w-3xl space-y-2">
        <h1 className="font-heading text-3xl font-bold">Poder Judiciário federal</h1>
        <p className="text-muted-foreground">
          Ministros do Supremo Tribunal Federal em exercício. Sessões do Plenário, votos e despesas publicadas, com link
          para a fonte.
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
  const lista = await listarJudiciario();
  if (lista.length === 0) {
    return <p className="text-muted-foreground">Nenhum ministro do STF coletado ainda.</p>;
  }
  return (
    <ul className="divide-y rounded-[14px] border bg-card">
      {lista.map((t) => (
        <li key={t.id}>
          <Link
            href={`/judiciario/${t.id}`}
            className="flex flex-col gap-0.5 px-4 py-3 no-underline hover:bg-background sm:flex-row sm:items-baseline sm:justify-between"
          >
            <span className="font-semibold text-foreground">{t.nome}</span>
            <span className="text-sm text-muted-foreground">
              {cargoJudiciario(t.cargo, t.sexo)} · {t.tribunal}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
