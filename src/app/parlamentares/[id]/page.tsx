import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Esqueleto } from "@/components/esqueleto";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { perfilParlamentar } from "@/data/perfil";
import { FotoParlamentar } from "@/components/perfil/foto";
import { Indicador, Lateral, SecaoBens, SecaoGastos, SecaoVotacoes } from "@/components/perfil/secoes";
import { brlCompacto, MESES, pct } from "@/lib/format";
import { variacaoNominal } from "@/lib/metrics";

function idValido(s: string) {
  return /^\d{1,9}$/.test(s) ? Number(s) : null;
}

export async function generateMetadata({ params }: PageProps<"/parlamentares/[id]">): Promise<Metadata> {
  await connection();
  const id = idValido((await params).id);
  const perfil = id ? await perfilParlamentar(id) : null;
  return { title: perfil ? perfil.parlamentar.nome : "Parlamentar não encontrado" };
}

export default function PaginaPerfil({ params, searchParams }: PageProps<"/parlamentares/[id]">) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-4 py-6">
          <Esqueleto linhas={5} />
        </div>
      }
    >
      <Perfil params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function Perfil({ params, searchParams }: PageProps<"/parlamentares/[id]">) {
  await connection();
  const id = idValido((await params).id);
  if (!id) notFound();
  const sp = await searchParams;
  const ano = typeof sp.ano === "string" && /^\d{4}$/.test(sp.ano) ? Number(sp.ano) : undefined;
  const filtro = sp.votos === "divergiu" || sp.votos === "ausencias" ? sp.votos : "todas";
  const perfil = await perfilParlamentar(id, ano);
  if (!perfil) notFound();

  const { parlamentar: p, ceap, votacoes } = perfil;
  const anosBens = [...new Set(perfil.bens.map((b) => b.ano_eleicao))].sort();
  const totalBens = (a: number) =>
    perfil.bens.filter((b) => b.ano_eleicao === a).reduce((s, b) => s + Number(b.total), 0);
  const ultimoBens = anosBens.at(-1);
  const varBens = anosBens.length >= 2 ? variacaoNominal(totalBens(anosBens.at(-2)!), totalBens(ultimoBens!)) : null;
  const presenca = pct(votacoes.presentes, votacoes.totalPlenario);
  const alin = pct(votacoes.alinhamento.iguais, votacoes.alinhamento.comparaveis);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
      <nav aria-label="Trilha" className="text-sm text-muted-foreground">
        <Link href="/parlamentares">Parlamentares</Link> / Câmara dos Deputados / {p.nome}
      </nav>

      <header className="flex flex-col gap-5 rounded-lg border bg-superficie p-5 sm:flex-row sm:items-center">
        <FotoParlamentar nome={p.nome} url={p.url_foto} tamanho={96} />
        <div className="flex-1 space-y-1">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {p.em_exercicio ? "Em exercício" : "Fora de exercício"} · {p.id_legislatura}ª legislatura
          </p>
          <h1 className="font-heading text-3xl font-bold">{p.nome}</h1>
          <p className="text-muted-foreground">
            Deputado(a) federal por {p.sigla_uf ?? "UF não informada"}
            {p.sigla_partido ? ` · ${p.sigla_partido}` : ""}
          </p>
          {p.nome_civil && (
            <p className="text-xs text-muted-foreground">Nome civil: {p.nome_civil} (Câmara dos Deputados)</p>
          )}
        </div>
        <Link
          href={`/parlamentares/${p.id}/contestar`}
          className="inline-flex h-10 items-center self-start rounded-md border px-4 text-sm font-medium no-underline sm:self-center"
        >
          Contestar um dado
        </Link>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Indicador
          titulo={`Cota parlamentar usada em ${perfil.ano}`}
          valor={brlCompacto(ceap.totalAno)}
          detalhe={
            ceap.tetoAcumulado
              ? `${pct(ceap.totalAno, ceap.tetoAcumulado)}% do teto acumulado até ${MESES[ceap.ultimoMes - 1].toLowerCase()}`
              : `${ceap.documentos.toLocaleString("pt-BR")} documentos · sem teto conferido para ${perfil.ano}`
          }
        />
        <Indicador
          titulo="Votou nas votações nominais do Plenário"
          valor={presenca === null ? "—" : `${presenca}%`}
          detalhe={`${votacoes.presentes} de ${votacoes.totalPlenario} em ${perfil.ano}, inclui períodos de licença`}
        />
        <Indicador
          titulo="Votou como o partido orientou"
          valor={alin === null ? "—" : `${alin}%`}
          detalhe={
            votacoes.alinhamento.comparaveis
              ? `Divergiu em ${votacoes.alinhamento.divergencias} de ${votacoes.alinhamento.comparaveis} votações com orientação Sim/Não`
              : "Sem votações com orientação comparável"
          }
        />
        <Indicador
          titulo={ultimoBens ? `Bens declarados ao TSE (${ultimoBens})` : "Bens declarados ao TSE"}
          valor={ultimoBens ? brlCompacto(totalBens(ultimoBens)) : "—"}
          detalhe={
            varBens === null
              ? ultimoBens
                ? "sem declaração anterior na série"
                : "nenhuma declaração encontrada"
              : `${varBens > 0 ? "+" : ""}${varBens}% sobre ${anosBens.at(-2)}, em valor nominal`
          }
        />
      </div>

      <nav aria-label="Seções do perfil" className="flex flex-wrap gap-x-4 gap-y-1 border-b pb-2 text-sm [&>a]:py-1">
        <a href="#gastos">Gastos da cota</a>
        <a href="#votacoes">Votações</a>
        <a href="#bens">Bens declarados</a>
        <a href="#mandato-titulo">Mandato</a>
        <Link href="/fontes">Fontes</Link>
      </nav>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-6">
          <SecaoGastos perfil={perfil} />
          <SecaoVotacoes perfil={perfil} filtro={filtro} />
          <SecaoBens perfil={perfil} />
        </div>
        <Lateral perfil={perfil} />
      </div>
    </div>
  );
}
