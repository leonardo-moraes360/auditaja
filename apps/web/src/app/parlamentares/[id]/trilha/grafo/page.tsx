import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Esqueleto } from "@/components/esqueleto";
import { GrafoDinheiro } from "@/components/trilha-grafo/grafo-dinheiro";
import { trilhaDoParlamentar } from "@/data/trilha";
import { resumoDoParlamentar } from "@/data/seo";
import { dadosDoGrafo, valorCurto } from "@/lib/grafo-trilha";
import { cargoParlamentar } from "@auditaja/core/rotulos";
import { fraseSemPix, quemIndicou } from "@auditaja/core/trilha";

/** Grafo do caminho do dinheiro das emendas Pix: página própria, aberta pela seção "Para onde foi o dinheiro". */

function idValido(s: string) {
  return /^\d{1,9}$/.test(s) ? Number(s) : null;
}

export async function generateMetadata({ params }: PageProps<"/parlamentares/[id]/trilha/grafo">): Promise<Metadata> {
  await connection();
  const id = idValido((await params).id);
  const r = id ? await resumoDoParlamentar(id) : null;
  if (!r) return { title: "Parlamentar não encontrado", robots: { index: false, follow: true } };
  return {
    title: `Caminho do dinheiro das emendas Pix · ${r.nome}`,
    description: `Grafo das emendas Pix de ${r.nome}: municípios que receberam, quem eles pagaram e indícios para conferir.`,
    alternates: { canonical: `/parlamentares/${r.id}/trilha/grafo` },
  };
}

export default function PaginaGrafo({ params }: PageProps<"/parlamentares/[id]/trilha/grafo">) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6">
          <Esqueleto linhas={6} />
        </div>
      }
    >
      <Grafo params={params} />
    </Suspense>
  );
}

async function Grafo({ params }: { params: PageProps<"/parlamentares/[id]/trilha/grafo">["params"] }) {
  await connection();
  const id = idValido((await params).id);
  if (!id) notFound();
  const p = await resumoDoParlamentar(id);
  if (!p) notFound();
  const trilha = await trilhaDoParlamentar(id, "mandato");
  const quem = quemIndicou(p.casa === "senado" ? "senado" : "camara", p.sexo);
  const cargo = cargoParlamentar(p.casa, p.sexo);
  const perfil = `/parlamentares/${p.id}`;
  const contestar = `${perfil}/contestar?secao=trilha`;

  return (
    <div className="mx-auto flex max-w-[1440px] flex-col gap-4 px-4 pb-12 pt-5 sm:px-6">
      <Link href={perfil} className="-mb-2 inline-flex min-h-11 items-center gap-1.5 self-start text-sm sm:hidden">
        <svg
          aria-hidden="true"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
        Voltar para o perfil
      </Link>
      <nav aria-label="Você está em" className="hidden flex-wrap items-center gap-1.5 text-sm text-texto-2 sm:flex">
        <Link href={perfil}>{p.nome}</Link>
        <span aria-hidden="true">›</span>
        <Link href={`${perfil}#trilha`}>Para onde foi o dinheiro</Link>
        <span aria-hidden="true">›</span>
        <span aria-current="page">Grafo</span>
      </nav>
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="flex max-w-[760px] flex-col gap-1">
          <h1 className="font-heading text-[22px] font-bold leading-[1.25] sm:text-[28px] sm:leading-[1.2]">
            Caminho do dinheiro das emendas Pix
          </h1>
          <p className="text-[15px] leading-normal text-texto-2 sm:text-base">
            <span className="sm:hidden">
              {p.nome} · {cargo}
              {p.sigla_uf ? ` (${p.sigla_uf})` : ""}
            </span>
            <span className="hidden sm:inline">
              {cargo} {p.nome}
              {p.sigla_uf ? ` (${p.sigla_uf})` : ""}
              {!trilha.vazio && (
                <>
                  {" · "}
                  <span className="whitespace-nowrap">{valorCurto(trilha.totais.transferido)}</span> transferidos a{" "}
                  {trilha.totais.entes.toLocaleString("pt-BR")}{" "}
                  {trilha.totais.entes === 1 ? "município ou estado" : "municípios ou estados"}
                  {" · "}
                  <span className="whitespace-nowrap">{valorCurto(trilha.totais.pago)}</span> com pagamento informado
                </>
              )}
            </span>
          </p>
        </div>
        <span className="flex flex-wrap gap-x-4 text-sm [&_a]:inline-flex [&_a]:min-h-11 [&_a]:items-center sm:[&_a]:min-h-0">
          <span className="sr-only">Ações:</span>
          {!trilha.vazio && (
            <a href={`${perfil}/trilha.csv`} download>
              Baixar CSV
            </a>
          )}
          <Link href={contestar}>Contestar um dado</Link>
          <Link href="/metodologia#trilha">Como seguimos o dinheiro</Link>
        </span>
      </div>
      {trilha.vazio ? (
        <p data-trilha-vazio className="text-texto-2">
          {fraseSemPix(quem)}. <Link href={perfil}>Voltar ao perfil</Link>
        </p>
      ) : (
        <GrafoDinheiro
          dados={dadosDoGrafo(trilha, { id: p.id, nome: p.nome, cargo, uf: p.sigla_uf }, quem)}
          emendaInicial={
            trilha.emendas[0] &&
            trilha.emendas[0].indicios > 0 &&
            (trilha.avaliacao.recemAberta === "avaliado" || trilha.avaliacao.ciclo === "avaliado")
              ? trilha.emendas[0].codigo
              : null
          }
          contestar={contestar}
        />
      )}
      <p className="max-w-[900px] text-sm leading-normal text-texto-3">
        Pessoas físicas pagas pelo município aparecem somadas, sem nome nem CPF. Não mostramos sócios, doadores pessoa
        física, contratos do PNCP nem emendas de convênio.
      </p>
    </div>
  );
}
