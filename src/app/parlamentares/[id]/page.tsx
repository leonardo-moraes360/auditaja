import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Esqueleto } from "@/components/esqueleto";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { perfilParlamentar, type PeriodoCeap } from "@/data/perfil";
import { FotoParlamentar } from "@/components/perfil/foto";
import { AbasSecoes } from "@/components/perfil/abas";
import { Indicador, Lateral, SecaoBens, SecaoGastos, SecaoVotacoes } from "@/components/perfil/secoes";
import { BOTAO_PRIMARIO, BOTAO_SECUNDARIO } from "@/components/perfil/estilos";
import { brl, brlCompacto, MESES, pct } from "@/lib/format";
import { variacaoNominal } from "@/lib/metrics";
import {
  cargoParlamentar,
  partidoPorExtenso,
  periodoLegislatura,
  periodoMandato,
  seloParticipacao,
  ufPorExtenso,
} from "@/lib/rotulos";

/** Média mensal curta do celular, como no protótipo: 31.840 → "R$ 31,8 mil". */
function milPorMes(v: number) {
  if (v < 1000) return brl(v);
  return `R$ ${(v / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mil`;
}

function idValido(s: string) {
  return /^\d{1,9}$/.test(s) ? Number(s) : null;
}

export async function generateMetadata({ params }: PageProps<"/parlamentares/[id]">): Promise<Metadata> {
  await connection();
  const id = idValido((await params).id);
  const perfil = id ? await perfilParlamentar(id) : null;
  return {
    title: perfil ? perfil.parlamentar.nome : "Parlamentar não encontrado",
    alternates: perfil
      ? { types: { "application/atom+xml": `/parlamentares/${perfil.parlamentar.id}/feed.xml` } }
      : undefined,
  };
}

export default function PaginaPerfil({ params, searchParams }: PageProps<"/parlamentares/[id]">) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6">
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
  const periodo: PeriodoCeap | undefined =
    sp.ano === "mandato"
      ? "mandato"
      : typeof sp.ano === "string" && /^\d{4}$/.test(sp.ano)
        ? Number(sp.ano)
        : undefined;
  const filtro = sp.votos === "divergiu" || sp.votos === "ausencias" ? sp.votos : "todas";
  const completo = sp.lista === "completa";
  const perfil = await perfilParlamentar(id, periodo);
  if (!perfil) notFound();

  const { parlamentar: p, ceap, votacoes } = perfil;
  const anosBens = [...new Set(perfil.bens.map((b) => b.ano_eleicao))].sort();
  const totalBens = (a: number) =>
    perfil.bens.filter((b) => b.ano_eleicao === a).reduce((s, b) => s + Number(b.total), 0);
  const ultimoBens = anosBens.at(-1);
  const anteriorBens = anosBens.at(-2);
  const varBens = anteriorBens ? variacaoNominal(totalBens(anteriorBens), totalBens(ultimoBens!)) : null;
  const senado = p.casa === "senado";
  const presenca = pct(votacoes.presentes, votacoes.denominadorPresenca);
  const alin = pct(votacoes.alinhamento.iguais, votacoes.alinhamento.comparaveis);
  const pctTeto = ceap.tetoAcumulado ? pct(ceap.totalAno, ceap.tetoAcumulado) : null;
  const mandatoSen = senado ? periodoMandato(p.mandato_inicio, p.mandato_fim) : null;
  const periodoLeg = senado ? (mandatoSen?.anos ?? null) : periodoLegislatura(p.id_legislatura);
  const participacao = senado ? seloParticipacao(p.participacao) : null;
  const cargo = cargoParlamentar(p.casa, p.sexo);
  const casaNome = senado ? "Senado Federal" : "Câmara dos Deputados";
  const mesesComNotas = ceap.porMes.map((m) => m.mes);
  const faixaMeses =
    mesesComNotas.length > 0
      ? `${MESES[Math.min(...mesesComNotas) - 1].slice(0, 3).toLowerCase()} a ${MESES[Math.max(...mesesComNotas) - 1]
          .slice(0, 3)
          .toLowerCase()}`
      : "";
  const situacao = p.em_exercicio ? "Em exercício" : "Fora de exercício";
  const partido = partidoPorExtenso(p.sigla_partido);
  const cota = perfil.mandato ? "no mandato" : `em ${perfil.ano}`;
  const sinal = (v: number) => `${v > 0 ? "+" : ""}${v}%`;
  const docs = `${ceap.documentos.toLocaleString("pt-BR")} documentos`;

  return (
    <div className="mx-auto max-w-[1200px] sm:px-6 sm:pt-5 sm:pb-12">
      <nav aria-label="Trilha" className="mb-4 hidden text-[13px] text-muted-foreground sm:block">
        <Link href="/parlamentares" className="text-muted-foreground">
          Parlamentares
        </Link>{" "}
        /{" "}
        <Link href={senado ? "/parlamentares?casa=senado" : "/parlamentares"} className="text-muted-foreground">
          {casaNome}
        </Link>{" "}
        / <span className="text-foreground">{p.nome}</span>
      </nav>

      <section
        aria-labelledby="nome"
        className="flex flex-col gap-3.5 border-b bg-superficie px-4 py-5 sm:gap-6 sm:rounded-[16px] sm:border sm:p-7"
      >
        <div className="flex items-center gap-3.5 sm:flex-wrap sm:items-start sm:gap-6">
          <FotoParlamentar nome={p.nome} url={p.url_foto} />
          <div className="flex min-w-0 flex-col gap-1.5 sm:flex-[999_1_320px] sm:gap-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="self-start rounded-full bg-sucesso-fundo px-2 py-[3px] text-[11px] font-semibold text-sucesso sm:px-2.5 sm:py-1 sm:text-xs">
                {situacao}
                {periodoLeg && <span className="sm:hidden"> · {periodoLeg}</span>}
              </span>
              {senado
                ? mandatoSen && (
                    <span className="hidden rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-texto-2 sm:inline">
                      Mandato {mandatoSen.anos} · {mandatoSen.legislaturas}
                    </span>
                  )
                : p.id_legislatura && (
                    <span className="hidden rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-texto-2 sm:inline">
                      {p.id_legislatura}ª legislatura{periodoLeg ? ` · ${periodoLeg}` : ""}
                    </span>
                  )}
              {participacao && (
                <span className="hidden rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-texto-2 sm:inline">
                  {participacao}
                </span>
              )}
            </div>
            <h1
              id="nome"
              className="font-heading text-2xl leading-[1.15] font-bold sm:text-4xl sm:leading-[1.1] sm:tracking-[-0.02em]"
            >
              {p.nome}
            </h1>
            <p className="text-sm text-texto-2 sm:hidden">
              {cargo} · {p.sigla_uf ?? "UF não informada"}
              {p.sigla_partido ? ` · ${p.sigla_partido}` : ""}
            </p>
            <p className="hidden text-base text-texto-2 sm:block">
              {cargo} por {ufPorExtenso(p.sigla_uf)}
              {partido ? ` · ${partido}` : ""}
              {senado && p.bloco ? ` · ${p.bloco}` : ""}
            </p>
            <p className="hidden text-sm text-muted-foreground sm:block">
              {senado
                ? "Nome civil, cargo, UF, partido e bloco conforme o Senado Federal."
                : "Nome civil, cargo, UF e partido conforme a Câmara dos Deputados."}
            </p>
          </div>
          <div className="hidden flex-[1_1_220px] flex-wrap justify-end gap-2.5 sm:flex">
            <Link href={`/parlamentares/${p.id}/acompanhar`} className={BOTAO_PRIMARIO}>
              Acompanhar atualizações
            </Link>
            <Link href={`/parlamentares/${p.id}/contestar`} className={BOTAO_SECUNDARIO}>
              Contestar um dado
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-[repeat(auto-fit,minmax(210px,1fr))] sm:gap-3">
          {senado ? (
            <Indicador
              titulo={`Cota do senador (CEAPS) em ${perfil.ano}`}
              tituloCurto={`Cota em ${perfil.ano}`}
              valor={brl(ceap.totalAno)}
              valorCurto={brlCompacto(ceap.totalAno)}
              detalhe={
                ceap.mediaMensal !== null
                  ? `Média de ${brl(ceap.mediaMensal)} por mês, ${faixaMeses}`
                  : `Nenhuma nota publicada em ${perfil.ano}`
              }
              detalheCurto={ceap.mediaMensal !== null ? `${milPorMes(ceap.mediaMensal)}/mês` : "sem notas"}
            />
          ) : (
            <Indicador
              titulo={`Cota parlamentar usada ${cota}`}
              tituloCurto={perfil.mandato ? "Cota no mandato" : `Cota em ${perfil.ano}`}
              valor={brl(ceap.totalAno)}
              valorCurto={brlCompacto(ceap.totalAno)}
              progresso={pctTeto}
              detalhe={
                pctTeto !== null
                  ? `${pctTeto}% do teto acumulado até ${MESES[ceap.ultimoMes - 1].toLowerCase()} (${brl(ceap.tetoAcumulado!)})`
                  : `${docs} · sem teto conferido para ${perfil.mandato ? "o mandato" : perfil.ano}`
              }
              detalheCurto={pctTeto !== null ? `${pctTeto}% do teto` : docs}
            />
          )}
          <Indicador
            titulo="Presença em votações nominais"
            tituloCurto="Presença"
            valor={presenca === null ? "—" : `${presenca}%`}
            detalhe={
              votacoes.denominadorPresenca === 0
                ? `Sem votações registradas em ${votacoes.ano}`
                : `${votacoes.presentes} de ${votacoes.denominadorPresenca} em ${votacoes.ano}${
                    votacoes.mediaPresenca !== null
                      ? ` · média ${senado ? "do Senado" : "da Câmara"} ${votacoes.mediaPresenca}%`
                      : ""
                  }`
            }
            detalheCurto={
              votacoes.denominadorPresenca === 0
                ? "sem votações"
                : `${votacoes.presentes} de ${votacoes.denominadorPresenca}`
            }
          />
          <Indicador
            titulo={senado ? "Votou como a liderança orientou" : "Votou como o partido orientou"}
            tituloCurto={senado ? "Seguiu a liderança" : "Seguiu o partido"}
            valor={alin === null ? "—" : `${alin}%`}
            detalhe={
              votacoes.alinhamento.comparaveis
                ? `Divergiu em ${votacoes.alinhamento.divergencias} de ${votacoes.alinhamento.comparaveis} votações${
                    senado ? " abertas" : ""
                  }`
                : "Sem votações com orientação comparável"
            }
            detalheCurto={
              votacoes.alinhamento.comparaveis
                ? `${votacoes.alinhamento.divergencias} ${votacoes.alinhamento.divergencias === 1 ? "divergência" : "divergências"}`
                : "sem orientação"
            }
          />
          <Indicador
            titulo={ultimoBens ? `Bens declarados ao TSE (${ultimoBens})` : "Bens declarados ao TSE"}
            tituloCurto={ultimoBens ? `Bens (TSE ${ultimoBens})` : "Bens (TSE)"}
            valor={ultimoBens ? brlCompacto(totalBens(ultimoBens)) : "—"}
            detalhe={
              varBens === null
                ? ultimoBens
                  ? "sem declaração anterior na série"
                  : "nenhuma declaração encontrada"
                : `${sinal(varBens)} sobre ${anteriorBens}, em valor nominal`
            }
            detalheCurto={
              varBens === null
                ? ultimoBens
                  ? "primeira declaração"
                  : "nenhuma declaração encontrada"
                : `${sinal(varBens)} sobre ${anteriorBens}`
            }
          />
        </div>

        <div className="flex gap-2 sm:hidden">
          <Link href={`/parlamentares/${p.id}/acompanhar`} className={`${BOTAO_PRIMARIO} flex-1 px-0`}>
            Acompanhar
          </Link>
          <Link href={`/parlamentares/${p.id}/contestar`} className={`${BOTAO_SECUNDARIO} flex-1 px-0`}>
            Contestar dado
          </Link>
        </div>
      </section>

      <AbasSecoes />

      <div className="flex flex-col gap-4 px-4 pt-4 pb-6 sm:gap-5 sm:px-0 sm:pt-0 sm:pb-0 lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-col gap-4 sm:gap-5 lg:flex-[999_1_560px]">
          <SecaoGastos perfil={perfil} completo={completo} />
          <SecaoVotacoes perfil={perfil} filtro={filtro} completo={completo} />
          <SecaoBens perfil={perfil} />
        </div>
        <Lateral perfil={perfil} />
      </div>
    </div>
  );
}
