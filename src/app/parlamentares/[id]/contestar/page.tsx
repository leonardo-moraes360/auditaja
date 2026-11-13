import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Esqueleto } from "@/components/esqueleto";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { getDb } from "@/db/client";
import { SECOES, secoesDaCasa } from "./secoes";
import { FormularioPedido } from "./formulario";

export const metadata: Metadata = { title: "Pedir correção", robots: { index: false, follow: true } };

export default function Contestar({ params, searchParams }: PageProps<"/parlamentares/[id]/contestar">) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-2xl px-4 py-8">
          <Esqueleto linhas={3} />
        </div>
      }
    >
      <ConteudoContestar params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function ConteudoContestar({ params, searchParams }: PageProps<"/parlamentares/[id]/contestar">) {
  await connection();
  const raw = (await params).id;
  if (!/^\d{1,9}$/.test(raw)) notFound();
  const p = await getDb()
    .selectFrom("parlamentar")
    .select(["id", "nome", "casa"])
    .where("id", "=", Number(raw))
    .executeTakeFirst();
  if (!p) notFound();
  const sp = await searchParams;
  const secao = typeof sp.secao === "string" && sp.secao in SECOES ? sp.secao : "outro";

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <nav aria-label="Trilha" className="text-sm text-muted-foreground">
        <Link href={`/parlamentares/${p.id}`}>{p.nome}</Link> / Pedir correção
      </nav>
      <h1 className="font-heading text-3xl font-bold">Pedir correção</h1>
      {sp.enviado === "1" ? (
        <div role="status" className="space-y-2 rounded-lg border bg-superficie p-5">
          <p className="font-medium">Pedido recebido.</p>
          <p className="text-sm text-muted-foreground">
            Vamos conferir com a fonte oficial. Toda alteração no perfil fica registrada.
          </p>
          <Link href={`/parlamentares/${p.id}`}>Voltar ao perfil</Link>
        </div>
      ) : (
        <>
          <p className="text-muted-foreground">
            Perfil de <strong className="text-foreground">{p.nome}</strong>. O próprio parlamentar, a assessoria ou
            qualquer pessoa pode pedir correção. Também atendemos pedidos de direito de resposta.
          </p>
          <FormularioPedido parlamentarId={p.id} secaoInicial={secao} secoes={secoesDaCasa(p.casa)} />
        </>
      )}
    </div>
  );
}
