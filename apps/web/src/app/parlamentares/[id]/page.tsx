import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Esqueleto } from "@/components/esqueleto";
import { notFound } from "next/navigation";
import {
  baseDasSancoes,
  emendasDoParlamentar,
  fornecedoresComSancaoNoPeriodo,
  resumoSancoesPorAno,
  sancoesDosFornecedores,
} from "@/data/emendas";
import { padraoAtipico } from "@/data/atipico";
import { anosComPonto, PontosParaVerificar, pontosParaVerificar } from "@/components/perfil/pontos";
import { anoInicialDoSenador, juntarSancionados } from "@auditaja/core/emendas";
import { perfilParlamentar, type PeriodoCeap } from "@/data/perfil";
import { indiceDeParlamentares, resumoDoParlamentar, ultimaColetaPorCasa } from "@/data/seo";
import { caminhoDoPerfil, descricaoDoPerfil, jsonLdDoPerfil, tituloDoPerfil } from "@/lib/seo-perfil";
import { jsonLd, metadataDaPagina, siteUrl } from "@/lib/site";
import { SecaoEmendas } from "@/components/perfil/secao-emendas";
import { LateralTrilha, quemIndicou, SecaoTrilha } from "@/components/perfil/secao-trilha";
import { trilhaDoParlamentar } from "@/data/trilha";
import { FotoParlamentar } from "@/components/perfil/foto";
import { AbasSecoes } from "@/components/perfil/abas";
import { Indicador, Lateral, SecaoBens, SecaoGastos, SecaoVotacoes } from "@/components/perfil/secoes";
import { BOTAO_PRIMARIO, BOTAO_SECUNDARIO } from "@/components/perfil/estilos";
import { brl, brlCompacto, MESES, pct } from "@auditaja/core/format";
import { variacaoNominal } from "@auditaja/core/metrics";
import {
  cargoParlamentar,
  partidoPorExtenso,
  periodoLegislatura,
  periodoMandato,
  seloParticipacao,
  ufPorExtenso,
} from "@auditaja/core/rotulos";

/** Média mensal curta do celular, como no protótipo: 31.840 → "R$ 31,8 mil". */
function milPorMes(v: number) {
  if (v < 1000) return brl(v);
  return `R$ ${(v / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mil`;
}

function idValido(s: string) {
  return /^\d{1,9}$/.test(s) ? Number(s) : null;
}

export async function generateStaticParams() {
  try {
    const parlamentares = await indiceDeParlamentares();
    return parlamentares.map((p) => ({ id: String(p.id) }));
  } catch {
    return [{ id: "0" }];
  }
}

export async function generateMetadata({ params }: PageProps<"/parlamentares/[id]">): Promise<Metadata> {
  const id = idValido((await params).id);
  const r = id ? await resumoDoParlamentar(id) : null;
  if (!r) return { title: "Parlamentar não encontrado", robots: { index: false, follow: true } };
  const caminho = caminhoDoPerfil(r.id);
  const titulo = tituloDoPerfil(r);
  const descricao = descricaoDoPerfil(r, r.cota);
  // Filtros (?ano=, ?votos=, ?lista=) mostram o mesmo perfil: a URL canônica é a sem parâmetros.
  const base = metadataDaPagina({ titulo, descricao, caminho, tipo: "profile" });
  return {
    ...base,
    alternates: {
      canonical: caminho,
      types: { "application/atom+xml": `${caminho}/feed.xml`, "text/markdown": `${caminho}.md` },
    },
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
  // Emendas e sanções (CGU) valem para as duas Casas; a coleta liga cada emenda a um único perfil.
  const anosCeap = perfil.mandato ? perfil.anosDisponiveis : [perfil.ano];
  const anosTodos = perfil.anosDisponiveis;
  const [emendas, extras, resumoSancoes, atipicosTodos, baseSancoes, resumo, coletas] = await Promise.all([
    emendasDoParlamentar(id, sp.emendas),
    fornecedoresComSancaoNoPeriodo(id, anosCeap),
    resumoSancoesPorAno(id, anosTodos),
    // Pontos para verificar valem para todos os anos coletados, não só o exibido.
    perfil.mandato ? perfil.atipico : padraoAtipico(perfil.parlamentar.casa, anosTodos, id),
    baseDasSancoes(),
    resumoDoParlamentar(id),
    ultimaColetaPorCasa(),
  ]);
  const pontos = pontosParaVerificar(id, resumoSancoes, atipicosTodos);
  const trilha = await trilhaDoParlamentar(id, emendas.periodo);
  const periodoPontos =
    anosTodos.length > 1
      ? `em ${Math.min(...anosTodos)}–${Math.max(...anosTodos)}`
      : anosTodos.length
        ? `em ${anosTodos[0]}`
        : "";
  // Sanção de fornecedor fora dos 5 maiores também aparece, desde que haja nota dentro do período dela.
  const docsCeap = [...perfil.ceap.fornecedores, ...extras].map((f) => f.fornecedor_doc);
  const sancionados = juntarSancionados(
    perfil.ceap.fornecedores,
    extras,
    await sancoesDosFornecedores(id, docsCeap, anosCeap),
  );

  const { parlamentar: p, ceap, votacoes } = perfil;
  const anosBens = [...new Set(perfil.bens.map((b) => b.ano_eleicao))].sort();
  const totalBens = (a: number) =>
    perfil.bens.filter((b) => b.ano_eleicao === a).reduce((s, b) => s + Number(b.total), 0);
  const ultimoBens = anosBens.at(-1);
  const anteriorBens = anosBens.at(-2);
  const varBens = anteriorBens ? variacaoNominal(totalBens(anteriorBens), totalBens(ultimoBens!)) : null;
  const senado = p.casa === "senado";
  const presenca = pct(votacoes.presentes, votacoes.elegiveis);
  const comHistorico = votacoes.historicoDisponivel;
  const fora = votacoes.foraDoExercicio;
  const foraTexto =
    votacoes.tipoFora === "licenca"
      ? "em licença"
      : votacoes.tipoFora === "antes_posse"
        ? "antes da posse"
        : "fora do exercício";
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
  const docs = `${ceap.documentos.toLocaleString("pt-BR")} documentos`;

  const dadosEstruturados = jsonLdDoPerfil(p, {
    base: siteUrl(),
    descricao: descricaoDoPerfil(p, resumo?.cota ?? null),
    dataColeta: coletas[p.casa],
    temGastos: !!resumo?.cota,
    temEmendas: !emendas.vazio,
  });

  return (
    <div className="mx-auto max-w-[1200px] sm:px-6 sm:pt-5 sm:pb-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(dadosEstruturados) }} />
      <nav aria-label="Trilha" className="mb-4 hidden text-sm text-muted-foreground sm:block">
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
              <span className="self-start rounded-full bg-sucesso-fundo px-2 py-[3px] text-sm font-semibold text-sucesso sm:px-2.5 sm:py-1 sm:text-xs">
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
              Receber atualizações
            </Link>
            <Link href={`/parlamentares/${p.id}/contestar`} className={BOTAO_SECUNDARIO}>
              Pedir correção
            </Link>
          </div>
        </div>

        {anosTodos.length > 0 && <PontosParaVerificar pontos={pontos} periodo={periodoPontos} />}

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
              senado
                ? votacoes.denominadorPresenca === 0
                  ? `Sem votações registradas em ${votacoes.ano}`
                  : `Votou em ${votacoes.presentes} de ${votacoes.denominadorPresenca} votações de ${votacoes.ano}${
                      votacoes.mediaPresenca !== null
                        ? ` · média ${senado ? "do Senado" : "da Câmara"} ${votacoes.mediaPresenca}%`
                        : ""
                    }`
                : comHistorico && votacoes.elegiveis === 0 && fora > 0
                  ? fora === 1
                    ? `Fora do exercício na única votação de ${votacoes.ano}`
                    : `Fora do exercício nas ${fora} votações de ${votacoes.ano}`
                  : `Votou em ${votacoes.presentes} de ${votacoes.elegiveis} votações de ${votacoes.ano}${
                      votacoes.mediaPresenca !== null ? ` · média da Câmara ${votacoes.mediaPresenca}%` : ""
                    }`
            }
            detalheCurto={
              senado
                ? votacoes.denominadorPresenca === 0
                  ? `Sem votações registradas em ${votacoes.ano}`
                  : `${votacoes.presentes} de ${votacoes.denominadorPresenca} votações`
                : comHistorico && votacoes.elegiveis === 0 && fora > 0
                  ? votacoes.tipoFora === "licenca"
                    ? "Em licença em todas as votações"
                    : "Fora do exercício em todas as votações"
                  : `${votacoes.presentes} de ${votacoes.elegiveis} votações${comHistorico ? "" : " · pode incluir licenças"}`
            }
            nota={
              senado ? undefined : !comHistorico ? (
                "Pode incluir períodos de licença"
              ) : fora > 0 && votacoes.elegiveis === 0 ? (
                <a href="#periodos">Ver períodos</a>
              ) : fora > 0 ? (
                <>
                  {fora} {fora === 1 ? "votação" : "votações"} {foraTexto} não {fora === 1 ? "conta" : "contam"} ·{" "}
                  <a href="#periodos">ver períodos</a>
                </>
              ) : undefined
            }
          />
          <Indicador
            titulo={senado ? "Votou como a liderança orientou" : "Votou como o partido orientou"}
            tituloCurto={senado ? "Como a liderança orientou" : "Como o partido orientou"}
            valor={alin === null ? "—" : `${alin}%`}
            detalhe={
              votacoes.alinhamento.comparaveis
                ? `Votou diferente em ${votacoes.alinhamento.divergencias} de ${votacoes.alinhamento.comparaveis} votações${
                    senado ? " abertas" : ""
                  }`
                : "Sem votações com orientação comparável"
            }
            detalheCurto={
              votacoes.alinhamento.comparaveis
                ? `diferente ${votacoes.alinhamento.divergencias} ${votacoes.alinhamento.divergencias === 1 ? "vez" : "vezes"}`
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
                : `Em ${anteriorBens} eram ${brlCompacto(totalBens(anteriorBens!))} · valores sem correção pela inflação`
            }
            detalheCurto={
              varBens === null
                ? ultimoBens
                  ? "primeira declaração"
                  : "nenhuma declaração encontrada"
                : `era ${brlCompacto(totalBens(anteriorBens!))} em ${anteriorBens}`
            }
          />
        </div>

        <div className="flex gap-2 sm:hidden">
          <Link
            href={`/parlamentares/${p.id}/acompanhar`}
            aria-label="Receber atualizações"
            className={`${BOTAO_PRIMARIO} flex-1 px-0`}
          >
            Atualizações
          </Link>
          <Link href={`/parlamentares/${p.id}/contestar`} className={`${BOTAO_SECUNDARIO} flex-1 px-0`}>
            Pedir correção
          </Link>
        </div>
      </section>

      <AbasSecoes />

      <div className="flex flex-col gap-4 px-4 pt-4 pb-6 sm:gap-5 sm:px-0 sm:pt-0 sm:pb-0 lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-col gap-4 sm:gap-5 lg:flex-[999_1_560px]">
          <SecaoGastos
            perfil={perfil}
            completo={completo}
            sancoes={sancionados.sancoes}
            fornecedoresDoAviso={sancionados.fornecedores}
            resumoSancoes={resumoSancoes}
            baseSancoes={baseSancoes}
            anosComPonto={anosComPonto(pontos)}
          />
          <SecaoEmendas
            dados={emendas}
            parlamentarId={p.id}
            senado={
              senado
                ? {
                    anoInicial: anoInicialDoSenador(p.mandato_inicio),
                    mandato: mandatoSen ? mandatoSen.anos : null,
                    sexo: p.sexo,
                  }
                : undefined
            }
          />
          <SecaoTrilha trilha={trilha} parlamentarId={p.id} quem={quemIndicou(p.casa, p.sexo)} />
          <SecaoVotacoes perfil={perfil} filtro={filtro} completo={completo} />
          <SecaoBens perfil={perfil} />
        </div>
        <Lateral perfil={perfil} extra={trilha.vazio ? null : <LateralTrilha />} />
      </div>
    </div>
  );
}
