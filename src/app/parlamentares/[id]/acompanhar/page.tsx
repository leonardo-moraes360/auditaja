import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Esqueleto } from "@/components/esqueleto";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { getDb } from "@/db/client";

export const metadata: Metadata = { title: "Acompanhar atualizações" };

export default function Acompanhar({ params }: PageProps<"/parlamentares/[id]/acompanhar">) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-2xl px-4 py-8">
          <Esqueleto linhas={3} />
        </div>
      }
    >
      <ConteudoAcompanhar params={params} />
    </Suspense>
  );
}

async function ConteudoAcompanhar({ params }: { params: PageProps<"/parlamentares/[id]/acompanhar">["params"] }) {
  await connection();
  const raw = (await params).id;
  if (!/^\d{1,9}$/.test(raw)) notFound();
  const p = await getDb()
    .selectFrom("parlamentar")
    .select(["id", "nome", "casa"])
    .where("id", "=", Number(raw))
    .executeTakeFirst();
  if (!p) notFound();
  const feed = `/parlamentares/${p.id}/feed.xml`;

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <nav aria-label="Trilha" className="text-sm text-muted-foreground">
        <Link href={`/parlamentares/${p.id}`}>{p.nome}</Link> / Acompanhar atualizações
      </nav>
      <h1 className="font-heading text-3xl font-bold">Acompanhar atualizações</h1>
      <p className="text-texto-2">
        Cada nova votação nominal do Plenário e cada mês de gastos da cota parlamentar de{" "}
        <strong className="text-foreground">{p.nome}</strong> entram num feed público. Não pedimos cadastro nem e-mail.
      </p>
      <ol className="list-decimal space-y-2 pl-5 text-sm">
        <li>Abra o seu leitor de feeds (Feedly, Inoreader, NetNewsWire, Thunderbird, entre outros).</li>
        <li>Adicione o endereço abaixo como nova assinatura.</li>
      </ol>
      <p className="rounded-xl border bg-superficie p-4 font-mono text-sm break-all">
        <a href={feed}>{feed}</a>
      </p>
      <p className="text-sm text-muted-foreground">
        O feed é atualizado a cada coleta dos dados abertos {p.casa === "senado" ? "do Senado" : "da Câmara"}.{" "}
        <Link href={`/parlamentares/${p.id}`}>Voltar ao perfil</Link>
      </p>
    </div>
  );
}
