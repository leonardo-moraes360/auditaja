"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import {
  ALTURA_NO,
  arcoDoCiclo,
  COLUNAS_X,
  curva,
  detalheDo,
  espessura,
  LARGURA_NO,
  listaDoGrafo,
  montarGrafo,
  NAO_PROVA,
  qtdRecebedores,
  valorCurto,
  type DadosGrafo,
  type Detalhe,
  type EstadoGrafo,
  type No,
} from "@/lib/grafo-trilha";

/**
 * Grafo do caminho do dinheiro (artboards GrafoDinheiro, GrafoDinheiroLista e GrafoDinheiroMobile,
 * aprovados em 13/11/2026). Desktop: colunas com curvas de espessura pelo valor e painel de detalhes.
 * Celular: árvore vertical, um nível por vez. "Lista": os mesmos nós em tabela, com os grupos abertos.
 * Nós são <button> em ordem de coluna; Esc volta um nível; o status vai para aria-live.
 */

const ROTULOS_COLUNA = ["Parlamentar", "Emendas Pix", "Municípios", "Quem recebeu", "Campanha"];
const ICONE_ALERTA = "M12 3 2 21h20L12 3zM12 10v5M12 18h.01";
const BOTAO =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-[10px] border border-borda-campo bg-superficie px-3.5 text-sm font-semibold text-texto hover:bg-superficie-2";

function Alerta({ tamanho = 12 }: { tamanho?: number }) {
  return (
    <svg
      aria-hidden="true"
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      className="flex-none"
    >
      <path d={ICONE_ALERTA} />
    </svg>
  );
}

export function GrafoDinheiro({
  dados,
  emendaInicial,
  contestar,
}: {
  dados: DadosGrafo;
  emendaInicial: string | null;
  contestar: string;
}) {
  const [estado, setEstado] = useState<EstadoGrafo>({
    em: emendaInicial,
    mu: null,
    sel: emendaInicial ? `e:${emendaInicial}` : null,
    so: false,
  });
  const [visao, setVisao] = useState<"grafo" | "lista">("grafo");
  const [abertoCelular, setAbertoCelular] = useState<string | null>(null);
  const focoCelular = useRef<HTMLHeadingElement>(null);
  const nivelCelular = useRef<number | null>(null);

  const g = useMemo(() => montarGrafo(dados, estado), [dados, estado]);
  const lista = useMemo(() => listaDoGrafo(dados, g), [dados, g]);
  const det = useMemo(() => detalheDo(dados, g, estado.sel), [dados, g, estado.sel]);
  const avaliou = dados.avaliado.recem || dados.avaliado.ciclo;

  const nivel = g.municipio ? 2 : g.emenda ? 1 : 0;
  useEffect(() => {
    // Celular: ao descer ou subir de nível, o foco vai para o cartão do nível atual.
    if (nivelCelular.current !== null && nivelCelular.current !== nivel && focoCelular.current?.offsetParent)
      focoCelular.current.focus();
    nivelCelular.current = nivel;
  }, [nivel]);

  const abrir = (no: { id: string; abre: No["abre"]; alvo: string | number | null }) => {
    if (no.abre === "emenda") setEstado((s) => ({ ...s, em: String(no.alvo), mu: null, sel: no.id }));
    else if (no.abre === "municipio") setEstado((s) => ({ ...s, mu: Number(no.alvo), sel: no.id }));
    else setEstado((s) => ({ ...s, sel: no.id }));
  };
  const voltar = () =>
    setEstado((s) =>
      s.mu
        ? { ...s, mu: null, sel: s.em ? `e:${s.em}` : null }
        : s.em
          ? { ...s, em: null, sel: null }
          : { ...s, sel: null },
    );
  const raizRef = useRef<HTMLDivElement>(null);
  const tecla = (ev: KeyboardEvent) => {
    if (ev.key !== "Escape") return;
    ev.preventDefault();
    setAbertoCelular(null);
    // O nó focado pode sumir ao subir de nível: o foco vai para o nó que fica aberto (ou para o parlamentar).
    const alvo = estado.mu ? `e:${estado.em}` : "parlamentar";
    voltar();
    requestAnimationFrame(() => {
      const el = raizRef.current?.querySelector<HTMLElement>(`[data-grafo] [data-no="${alvo}"]`);
      if (el?.offsetParent) return el.focus();
      // Na lista (ou com o grafo escondido), o foco vai para o título da lista ou da árvore.
      const titulo = raizRef.current?.querySelector<HTMLElement>("#lista-titulo, [data-arvore] h2");
      if (titulo?.offsetParent) titulo.focus();
    });
  };

  const migalhas = [
    { rotulo: "Todas as emendas", ir: () => setEstado((s) => ({ ...s, em: null, mu: null, sel: null })) },
    ...(g.emenda
      ? [{ rotulo: g.emenda.codigo, ir: () => setEstado((s) => ({ ...s, mu: null, sel: `e:${s.em}` })) }]
      : []),
    ...(g.municipio ? [{ rotulo: g.municipio.nome, ir: () => {} }] : []),
  ];

  return (
    <div ref={raizRef} onKeyDown={tecla} className="flex flex-col gap-4">
      <p
        role="note"
        className="rounded-[10px] bg-superficie-2 px-3 py-3 text-sm leading-normal text-texto-2 sm:rounded-[12px] sm:px-4 sm:text-[15px]"
      >
        <span className="hidden sm:inline">
          Cada linha liga dois registros públicos pelo código da emenda ou pelo CNPJ. Uma ligação mostra para onde o
          dinheiro foi, não que houve irregularidade.{" "}
          <strong className="text-texto">Os selos âmbar marcam indícios para conferir. {NAO_PROVA}</strong>
        </span>
        <span className="sm:hidden">
          Cada ligação vem de registros públicos, pelo código da emenda ou pelo CNPJ. Ligação não é irregularidade.{" "}
          <strong className="text-texto">Selo âmbar = indício para conferir; indício não é prova.</strong>
        </span>
      </p>

      <div
        role="toolbar"
        aria-label="Controles do grafo"
        className="flex flex-wrap items-center justify-between gap-x-5 gap-y-3"
      >
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <div
            role="group"
            aria-label="Forma de ver"
            className="inline-flex overflow-hidden rounded-[10px] border border-borda-campo"
          >
            {(["grafo", "lista"] as const).map((v, i) => (
              <button
                key={v}
                type="button"
                aria-pressed={visao === v}
                onClick={() => setVisao(v)}
                data-visao={v}
                className={`inline-flex min-h-11 items-center gap-2 px-4 text-sm font-semibold ${i ? "border-l border-borda-campo" : ""} ${
                  visao === v ? "bg-primaria text-sobre-primaria" : "bg-superficie text-texto hover:bg-superficie-2"
                }`}
              >
                <svg
                  aria-hidden="true"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  className="flex-none"
                >
                  {v === "grafo" ? (
                    <>
                      <circle cx="5" cy="12" r="2.5" />
                      <circle cx="19" cy="5" r="2.5" />
                      <circle cx="19" cy="19" r="2.5" />
                      <path d="M7.5 12h3l6-6M10.5 12l6 6" />
                    </>
                  ) : (
                    <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
                  )}
                </svg>
                {v === "grafo" ? "Grafo" : "Lista"}
              </button>
            ))}
          </div>
          <label
            className={`inline-flex min-h-11 items-center gap-2.5 text-[15px] ${avaliou ? "text-texto" : "text-texto-3"}`}
          >
            <input
              type="checkbox"
              checked={g.so}
              disabled={!avaliou}
              onChange={() => setEstado((s) => ({ ...s, so: !s.so }))}
              className="size-5 accent-[var(--primaria)]"
            />
            Só caminhos com indício
          </label>
          <button
            type="button"
            className="hidden min-h-11 items-center rounded-[10px] border border-borda-campo bg-superficie px-3.5 text-sm font-semibold text-texto hover:bg-superficie-2 lg:inline-flex"
            onClick={() => setEstado({ em: null, mu: null, sel: null, so: false })}
          >
            Recolher tudo
          </button>
        </div>
        <nav aria-label="Caminho aberto no grafo" className="hidden flex-wrap items-center gap-1 text-sm lg:flex">
          {migalhas.map((m, i) => (
            <span key={m.rotulo} className="inline-flex items-center gap-1">
              {i > 0 && (
                <span aria-hidden="true" className="text-texto-3">
                  ›
                </span>
              )}
              {i === migalhas.length - 1 ? (
                <span aria-current="location" className="px-2 font-semibold">
                  {m.rotulo}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={m.ir}
                  className="min-h-11 px-2 text-link underline hover:text-link-hover"
                >
                  {m.rotulo}
                </button>
              )}
            </span>
          ))}
        </nav>
      </div>

      <p
        aria-live="polite"
        data-status
        className={`text-sm text-texto-2 ${visao === "grafo" ? "hidden lg:block" : ""}`}
      >
        {g.status}
      </p>

      <div className="flex flex-wrap items-start gap-5">
        <div className="min-w-0 flex-[999_1_720px]">
          {visao === "grafo" ? (
            <>
              <GrafoColunas g={g} abrir={abrir} avaliou={avaliou} quem={dados.quem} />
              <ArvoreCelular
                dados={dados}
                g={g}
                abrir={abrir}
                aberto={abertoCelular}
                setAberto={setAbertoCelular}
                verLista={() => setVisao("lista")}
                focoRef={focoCelular}
                voltarPara={(nv) =>
                  setEstado((s) =>
                    nv === 0 ? { ...s, em: null, mu: null, sel: null } : { ...s, mu: null, sel: `e:${s.em}` },
                  )
                }
                contestar={contestar}
              />
            </>
          ) : (
            <ListaGrafo lista={lista} sel={g.sel} abrir={abrir} />
          )}
        </div>
        <PainelDetalhe
          det={det}
          contestar={contestar}
          notas={dados.notas}
          verLista={() => setVisao("lista")}
          className={visao === "grafo" ? "hidden lg:flex" : "flex"}
        />
      </div>
    </div>
  );
}

function GrafoColunas({
  g,
  abrir,
  avaliou,
  quem,
}: {
  g: ReturnType<typeof montarGrafo>;
  abrir: (n: No) => void;
  avaliou: boolean;
  quem: string;
}) {
  const porId = new Map(g.nos.map((n) => [n.id, n]));
  // Defesa: aresta sem as duas pontas no grafo não é desenhada.
  const arestas = g.arestas.filter((a) => porId.has(a.de) && porId.has(a.para));
  const maior = Math.max(0, ...arestas.filter((a) => porId.get(a.de)!.col > 0).map((a) => a.valor));
  const maiorRaiz = Math.max(0, ...arestas.filter((a) => porId.get(a.de)!.col === 0).map((a) => a.valor));
  const raiz = porId.get("parlamentar")!;
  const camp = porId.get("campanha");
  return (
    <section
      aria-labelledby="grafo-titulo"
      data-grafo
      className="hidden flex-col gap-2 rounded-[16px] border border-borda bg-superficie p-4 lg:flex"
    >
      <h2 id="grafo-titulo" className="sr-only">
        Grafo: parlamentar, emendas, municípios, quem recebeu e campanha
      </h2>
      <p className="sr-only">
        Os nós são botões, em ordem de coluna. Enter abre o nó e mostra os detalhes ao lado. Esc volta um nível. A mesma
        informação está na forma Lista.
      </p>
      <div className="overflow-x-auto">
        <div className="min-w-[940px]">
          <div
            aria-hidden="true"
            className="relative h-7 text-sm font-semibold uppercase tracking-[.04em] text-texto-3"
          >
            {ROTULOS_COLUNA.map((r, i) => (
              <span
                key={r}
                className="absolute top-1 w-[180px] text-center"
                style={{ left: `calc(${COLUNAS_X[i]}% - 90px)` }}
              >
                {r}
              </span>
            ))}
          </div>
          <div className="relative" style={{ height: g.altura }}>
            <svg
              aria-hidden="true"
              width="100%"
              height={g.altura}
              viewBox={`0 0 1000 ${g.altura}`}
              preserveAspectRatio="none"
              className="pointer-events-none absolute inset-0 overflow-visible"
            >
              {arestas.map((a) => {
                const de = porId.get(a.de)!;
                const para = porId.get(a.para)!;
                const aceso = g.caminho.has(a.de) && g.caminho.has(a.para);
                const ind = a.indicio && avaliou;
                const cor = ind ? "var(--atipico-borda)" : aceso ? "var(--primaria)" : "var(--borda-campo)";
                return (
                  <path
                    key={`${a.de}>${a.para}`}
                    data-aresta={`${a.de}>${a.para}`}
                    d={curva(de, para)}
                    fill="none"
                    vectorEffect="non-scaling-stroke"
                    strokeLinecap="round"
                    style={{
                      stroke: cor,
                      strokeWidth: a.campanha ? 2.5 : espessura(a.valor, de.col === 0 ? maiorRaiz : maior),
                      strokeOpacity: aceso || ind ? 0.95 : 0.45,
                      strokeDasharray: a.semPagamento || a.campanha ? "6 6" : undefined,
                    }}
                  />
                );
              })}
              {camp && (
                <path
                  data-ciclo
                  d={arcoDoCiclo(camp, raiz)}
                  fill="none"
                  vectorEffect="non-scaling-stroke"
                  style={{ stroke: "var(--atipico-borda)", strokeWidth: 2.5, strokeDasharray: "7 6" }}
                />
              )}
            </svg>
            {camp && (
              <span className="absolute left-1/2 top-1 -translate-x-1/2 whitespace-nowrap rounded-full border border-atipico-borda bg-atipico-fundo px-2.5 py-0.5 text-sm font-semibold text-atipico">
                Volta à campanha de {camp.nome.replace(/\D/g, "")} {quem}
              </span>
            )}
            {!g.emenda && (
              <p
                className="absolute top-[340px] w-[320px] text-center text-[15px] text-texto-2"
                style={{ left: "calc(60% - 160px)" }}
              >
                Escolha uma emenda para ver os municípios que receberam e quem eles pagaram.
              </p>
            )}
            {g.nos.map((n) => {
              const sel = g.sel === n.id;
              const aberto = g.caminho.has(n.id) && (n.abre !== "detalhe" || sel) && n.col > 0;
              return (
                <button
                  key={n.id}
                  type="button"
                  data-no={n.id}
                  aria-pressed={sel}
                  onClick={() => abrir(n)}
                  className={`absolute flex flex-col justify-center gap-px overflow-hidden rounded-[10px] px-2.5 py-1.5 text-left text-texto transition-shadow hover:shadow-[0_0_0_2px_var(--primaria)] ${
                    n.grupo ? "border-dashed bg-superficie-2" : "bg-superficie"
                  } ${sel ? "border-2 border-primaria !bg-primaria-fundo" : aberto ? "border-2 border-primaria" : n.selo ? "border border-atipico-borda" : "border border-borda-campo"}`}
                  style={{
                    left: `calc(${COLUNAS_X[n.col]}% - ${LARGURA_NO[n.col] / 2}px)`,
                    top: n.y - ALTURA_NO / 2,
                    width: LARGURA_NO[n.col],
                    height: ALTURA_NO,
                  }}
                >
                  {/* Nome acessível = descrição completa; o texto visível (truncado) fica fora da árvore de acessibilidade. */}
                  <span className="sr-only">{n.aria}</span>
                  <span aria-hidden="true" className="block w-full truncate text-sm font-semibold leading-tight">
                    {n.nome}
                  </span>
                  <span
                    aria-hidden="true"
                    className="block w-full truncate text-sm leading-snug tabular-nums text-texto-2"
                  >
                    {n.meta}
                  </span>
                  {n.selo && (
                    <span
                      aria-hidden="true"
                      className="inline-flex max-w-full items-center gap-1 self-start whitespace-nowrap text-sm font-bold leading-tight text-atipico"
                    >
                      <Alerta />
                      {n.selo}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <div
        aria-hidden="true"
        className="flex flex-wrap gap-x-6 gap-y-2 border-t border-borda pt-2 text-sm text-texto-2"
      >
        <span className="inline-flex items-center gap-2">
          <svg width="40" height="14">
            <path d="M2 7h36" style={{ stroke: "var(--borda-campo)", strokeWidth: 2 }} />
          </svg>
          <svg width="40" height="14">
            <path d="M2 7h36" style={{ stroke: "var(--borda-campo)", strokeWidth: 9 }} />
          </svg>
          espessura = valor
        </span>
        <Legenda traco={{ stroke: "var(--borda-campo)", strokeWidth: 3, strokeDasharray: "5 5" }}>
          transferido sem pagamento informado
        </Legenda>
        <Legenda traco={{ stroke: "var(--primaria)", strokeWidth: 4 }}>caminho aberto</Legenda>
        {avaliou && <Legenda traco={{ stroke: "var(--atipico-borda)", strokeWidth: 4 }}>caminho com indício</Legenda>}
        <span className="inline-flex items-center gap-2">
          <span className="h-3.5 w-8 rounded-[4px] border border-dashed border-borda-campo bg-superficie-2" />
          grupo (um por um na lista)
        </span>
      </div>
      <p className="text-sm text-texto-3">
        Teclado: Tab percorre os nós coluna por coluna, Enter abre, Esc volta um nível.
      </p>
    </section>
  );
}

function Legenda({ traco, children }: { traco: React.CSSProperties; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2">
      <svg width="40" height="14">
        <path d="M2 7h36" style={traco} />
      </svg>
      {children}
    </span>
  );
}

function BlocoIndicios({
  det,
  contestar,
  passosCiclo,
}: {
  det: Detalhe;
  contestar: string;
  /** Celular: o ciclo passo a passo, dentro do cartão âmbar. */
  passosCiclo?: string[];
}) {
  // Arquivos usados (com data e SHA-256) ficam na seção da trilha do perfil.
  const arquivos = `${contestar.split("/contestar")[0]}#trilha`;
  return det.indicios.map((i) => (
    <div
      key={i.tipo}
      role="note"
      aria-label={i.titulo}
      data-indicio-grafo={i.tipo}
      className="flex flex-col gap-2 rounded-[12px] border border-atipico-borda bg-atipico-fundo p-3.5"
    >
      <p className="flex items-center gap-1.5 text-[15px] font-bold leading-snug text-atipico">
        <Alerta tamanho={16} />
        {i.titulo}
      </p>
      <p className="text-sm leading-normal text-texto">{i.frase}</p>
      {i.tipo === "ciclo-fechado" && passosCiclo && (
        <ol aria-label="O ciclo, passo a passo" className="flex flex-wrap items-center gap-1 text-sm">
          {passosCiclo.map((x, k) => (
            <li key={k} className="inline-flex items-center gap-1">
              {k > 0 && <span aria-hidden="true">→</span>}
              <span className="rounded-full border border-atipico-borda px-2 py-0.5">{x}</span>
            </li>
          ))}
        </ol>
      )}
      <p className="text-sm leading-normal text-texto-2">
        {i.base} {NAO_PROVA}
      </p>
      <div className="flex flex-wrap gap-x-4 text-sm font-semibold [&_a]:inline-flex [&_a]:min-h-11 [&_a]:items-center [&_a]:text-atipico">
        <Link href={i.tipo === "recem-aberta" ? "/metodologia#recem-aberta" : "/metodologia#ciclo-fechado"}>
          Como calculamos
        </Link>
        <Link href={contestar}>Contestar</Link>
        <Link href={arquivos}>Arquivos usados</Link>
      </div>
    </div>
  ));
}

function PainelDetalhe({
  det,
  contestar,
  notas,
  verLista,
  className,
}: {
  det: Detalhe;
  contestar: string;
  notas: string[];
  verLista: () => void;
  className: string;
}) {
  return (
    <aside
      aria-labelledby="detalhe-titulo"
      data-detalhe
      className={`${className} min-w-[300px] max-w-[380px] flex-[1_1_340px] flex-col gap-3.5 rounded-[16px] border border-borda bg-superficie p-5`}
    >
      <span className="text-sm font-semibold uppercase tracking-[.04em] text-texto-3">{det.tipo}</span>
      <h2 id="detalhe-titulo" tabIndex={-1} className="-mt-2 font-heading text-xl font-bold leading-[1.3]">
        {det.titulo}
      </h2>
      {det.sub && <p className="-mt-2 text-sm tabular-nums text-texto-3">{det.sub}</p>}
      {det.linhas.length > 0 && (
        <dl className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-2 text-[15px]">
          {det.linhas.map((l) => (
            <div key={l.r} className="contents">
              <dt className="text-texto-2">{l.r}</dt>
              <dd className="text-right font-semibold tabular-nums">{l.v}</dd>
            </div>
          ))}
        </dl>
      )}
      <BlocoIndicios det={det} contestar={contestar} />
      {det.nota && <p className="text-sm leading-normal text-texto-2">{det.nota}</p>}
      {det.fonte && (
        <p className="border-t border-borda pt-3 text-sm leading-normal text-texto-3">
          Fonte:{" "}
          <a href={det.fonte.href} rel="noopener noreferrer" target="_blank">
            {det.fonte.texto}
          </a>
        </p>
      )}
      {det.verNaLista && (
        <button type="button" className={BOTAO} onClick={verLista}>
          {det.verNaLista}
        </button>
      )}
      {notas.map((n) => (
        <p key={n} role="note" className="rounded-[10px] bg-superficie-2 p-3 text-sm leading-normal text-texto-2">
          {n}
        </p>
      ))}
    </aside>
  );
}

type LinhaClicavel = { id: string; abre: No["abre"]; alvo: string | number | null };

function ListaGrafo({
  lista,
  sel,
  abrir,
}: {
  lista: ReturnType<typeof listaDoGrafo>;
  sel: string | null;
  abrir: (l: LinhaClicavel) => void;
}) {
  return (
    <section
      aria-labelledby="lista-titulo"
      data-lista-grafo
      className="flex flex-col gap-3 rounded-[16px] border border-borda bg-superficie p-4"
    >
      <h2 id="lista-titulo" tabIndex={-1} className="text-lg font-bold leading-[1.3] focus:outline-none">
        O mesmo caminho em lista
      </h2>
      <p className="text-sm text-texto-2">
        Os mesmos nós do grafo, com os grupos abertos um por um. Abrir uma emenda ou um município mostra o nível
        seguinte.
      </p>
      {lista
        .filter((grupo) => grupo.linhas.length > 0)
        .map((grupo) => (
          <div key={grupo.titulo} className="relative overflow-x-auto rounded-[12px] border border-borda">
            <table className="w-full min-w-[640px] border-collapse text-[15px]">
              <caption className="px-3 pb-1.5 pt-3 text-left text-sm font-semibold uppercase tracking-[.04em] text-texto-3">
                {grupo.titulo}
              </caption>
              <thead>
                <tr className="bg-superficie-2 text-left text-sm text-texto-2">
                  <th scope="col" className="px-3 py-2.5">
                    Item
                  </th>
                  <th scope="col" className="px-3 py-2.5">
                    Veio de
                  </th>
                  <th scope="col" className="px-3 py-2.5 text-right">
                    Valor
                  </th>
                  <th scope="col" className="px-3 py-2.5">
                    Indício
                  </th>
                  <th scope="col" className="px-3 py-2.5">
                    <span className="sr-only">Ação</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {grupo.linhas.map((l) => (
                  <tr key={l.id} className={`border-t border-borda ${sel === l.id ? "bg-primaria-fundo" : ""}`}>
                    <th scope="row" className="px-3 py-2 text-left font-semibold">
                      {l.nome}
                      <span className="block text-sm font-normal tabular-nums text-texto-3">{l.meta}</span>
                    </th>
                    <td className="px-3 py-2 text-texto-2">{l.veioDe}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">{l.valor}</td>
                    <td className="px-3 py-2 font-semibold text-atipico">{l.selo}</td>
                    <td className="px-3 py-1 text-right">
                      <button
                        type="button"
                        className={`${BOTAO} whitespace-nowrap`}
                        aria-label={`${l.abre === "detalhe" ? "Detalhes de" : "Abrir"} ${l.nome}`}
                        onClick={() => abrir(l)}
                      >
                        {l.abre === "detalhe" ? "Detalhes" : "Abrir"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
    </section>
  );
}

function ArvoreCelular({
  dados,
  g,
  abrir,
  aberto,
  setAberto,
  verLista,
  focoRef,
  voltarPara,
  contestar,
}: {
  dados: DadosGrafo;
  g: ReturnType<typeof montarGrafo>;
  abrir: (n: No) => void;
  aberto: string | null;
  setAberto: (id: string | null) => void;
  verLista: () => void;
  focoRef: React.RefObject<HTMLHeadingElement | null>;
  voltarPara: (nivel: 0 | 1) => void;
  contestar: string;
}) {
  const nivel = g.municipio ? 2 : g.emenda ? 1 : 0;
  const focoId = nivel === 2 ? `m:${g.municipio!.id}` : nivel === 1 ? `e:${g.emenda!.codigo}` : "parlamentar";
  const foco = detalheDo(dados, g, focoId);
  // No nível da emenda, os recebedores diretos da União (sem município) ficam junto dos municípios.
  const filhosVisiveis = g.nos.filter(
    (n) => n.col === nivel + 1 || (nivel === 1 && n.col === 3 && n.pai === `e:${g.emenda!.codigo}`),
  );
  const diretos = nivel === 1 ? filhosVisiveis.filter((n) => n.col === 3).length : 0;
  const maior = Math.max(0, ...filhosVisiveis.filter((f) => f.tipo !== "sem-pagamento").map((f) => f.valor));
  const ancestrais = [
    ...(nivel >= 1
      ? [
          {
            tipo: dados.parlamentar.cargo,
            nome: dados.parlamentar.nome,
            valor: valorCurto(dados.totais.transferido),
            nv: 0 as const,
            w: 12,
          },
        ]
      : []),
    ...(nivel === 2
      ? [{ tipo: "Emenda", nome: g.emenda!.codigo, valor: valorCurto(g.emenda!.transferido), nv: 1 as const, w: 8 }]
      : []),
  ];
  // Cartão em foco da emenda: função no tipo, código no título (como no protótipo de celular).
  const tipoFoco = nivel === 1 ? `Emenda Pix · ${g.emenda!.funcao}` : foco.tipo;
  const tituloFoco = nivel === 1 ? g.emenda!.codigo : foco.titulo;
  const grupos = filhosVisiveis.filter((f) => f.grupo).length;
  const statusCelular = !filhosVisiveis.length
    ? g.so
      ? "Filtro ligado: nada com indício neste nível."
      : "Nada para mostrar neste nível."
    : g.so
      ? `Filtro ligado: ${filhosVisiveis.length} com indício. Toque para abrir.`
      : `${
          grupos === filhosVisiveis.length
            ? grupos === 1
              ? "Tudo num grupo."
              : `Tudo em ${grupos} grupos.`
            : grupos
              ? `${filhosVisiveis.length - grupos} em ordem de valor e ${grupos} ${grupos === 1 ? "grupo" : "grupos"} com o resto.`
              : `${filhosVisiveis.length === 1 ? "1 item" : `Todos os ${filhosVisiveis.length}`} em ordem de valor.`
        } Toque para abrir.`;
  const rotulo =
    nivel === 0
      ? `Emendas Pix (${dados.emendas.length})`
      : nivel === 1
        ? `Municípios (${g.emenda!.municipios.length})${diretos ? ` e direto da União (${diretos})` : ""}`
        : `Quem ${g.municipio!.nome} pagou (${qtdRecebedores(g.municipio!)})`;
  return (
    <div data-arvore className="flex flex-col lg:hidden">
      {ancestrais.length > 0 && (
        <nav aria-label="Caminho aberto" className="flex flex-col">
          {ancestrais.map((a) => (
            <div key={a.nome} className="flex items-stretch">
              <span aria-hidden="true" className="flex w-7 flex-none justify-center">
                <span className="rounded-[2px] bg-primaria" style={{ width: a.w }} />
              </span>
              <button
                type="button"
                onClick={() => {
                  setAberto(null);
                  voltarPara(a.nv);
                }}
                className="my-0.5 flex min-h-11 flex-1 items-center justify-between gap-2 rounded-[8px] border border-borda bg-superficie px-2.5 text-left text-sm"
              >
                <span>
                  <span className="text-texto-3">{a.tipo} · </span>
                  <span className="text-link underline">{a.nome}</span>
                </span>
                <span className="whitespace-nowrap tabular-nums text-texto-2">{a.valor}</span>
              </button>
            </div>
          ))}
        </nav>
      )}
      <section
        aria-labelledby="arvore-foco"
        className="mt-0.5 flex flex-col gap-2.5 rounded-[12px] border-2 border-primaria bg-primaria-fundo p-3.5"
      >
        <span className="text-sm font-semibold uppercase tracking-[.04em] text-texto-2">{tipoFoco}</span>
        <h2
          id="arvore-foco"
          ref={focoRef}
          tabIndex={-1}
          className="-mt-2 font-heading text-[19px] font-bold leading-[1.3]"
        >
          {tituloFoco}
        </h2>
        <dl className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1.5 text-[15px]">
          {foco.linhas.map((l) => (
            <div key={l.r} className="contents">
              <dt className="text-texto-2">{l.r}</dt>
              <dd className="text-right font-semibold tabular-nums">{l.v}</dd>
            </div>
          ))}
        </dl>
        {foco.fonte && (
          <p className="text-sm text-texto-2">
            Fonte:{" "}
            <a href={foco.fonte.href} rel="noopener noreferrer" target="_blank">
              {foco.fonte.texto}
            </a>
          </p>
        )}
      </section>
      <section aria-labelledby="arvore-filhos" className="flex flex-col">
        <h2 id="arvore-filhos" className="pb-2 pl-7 pt-3 text-base font-bold leading-[1.35]">
          {rotulo}
        </h2>
        <p aria-live="polite" data-status-celular className="mb-1.5 pl-7 text-sm text-texto-2">
          {statusCelular}
        </p>
        <ul className="flex flex-col">
          {filhosVisiveis.map((f, i) => {
            const desce = f.abre !== "detalhe";
            const exp = !desce && aberto === f.id;
            const w = Math.round(2 + 9 * Math.sqrt(Math.min(1, maior > 0 ? f.valor / maior : 0)));
            const det = exp ? detalheDo(dados, g, f.id) : null;
            return (
              <li key={f.id} className="flex items-stretch" data-filho={f.id}>
                <span aria-hidden="true" className="relative w-7 flex-none">
                  <span
                    className="absolute left-[13px] top-0 w-0.5 bg-borda-campo"
                    style={{ bottom: i === filhosVisiveis.length - 1 ? "calc(100% - 34px)" : 0 }}
                  />
                  <span
                    className="absolute left-[13px] top-[34px] w-[15px] rounded-[2px]"
                    style={{
                      height: w,
                      marginTop: -Math.round(w / 2),
                      background: f.selo
                        ? "var(--atipico-borda)"
                        : f.tipo === "sem-pagamento"
                          ? "var(--borda)"
                          : "var(--borda-campo)",
                    }}
                  />
                </span>
                <div className="flex min-w-0 flex-1 flex-col py-1">
                  <button
                    type="button"
                    aria-expanded={desce ? undefined : exp}
                    onClick={() => (desce ? (setAberto(null), abrir(f)) : setAberto(exp ? null : f.id))}
                    className={`flex min-h-[60px] w-full flex-col gap-1 rounded-[10px] px-3 py-2 text-left text-[15px] text-texto ${
                      f.grupo ? "border border-dashed bg-superficie-2" : "border bg-superficie"
                    } ${f.selo ? "border-atipico-borda" : "border-borda-campo"}`}
                  >
                    <span className="sr-only">{f.aria}</span>
                    <span aria-hidden="true" className="flex w-full justify-between gap-2">
                      <strong className="min-w-0 break-words font-semibold">{f.nome}</strong>
                      <span className="whitespace-nowrap tabular-nums">{valorCurto(f.valor)}</span>
                    </span>
                    <span aria-hidden="true" className="flex w-full justify-between gap-2 text-sm text-texto-2">
                      <span>{f.resumo}</span>
                      <span aria-hidden="true">{desce ? "abrir ›" : exp ? "fechar" : "detalhes"}</span>
                    </span>
                    {f.selo && (
                      <span
                        aria-hidden="true"
                        className="inline-flex items-center gap-1 text-sm font-bold text-atipico"
                      >
                        <Alerta tamanho={13} />
                        {f.selo}
                      </span>
                    )}
                  </button>
                  {det && (
                    <div className="mt-1.5 flex flex-col gap-2 rounded-[10px] border border-borda bg-superficie p-3 text-sm leading-normal">
                      {det.sub && <span className="tabular-nums text-texto-2">{det.sub}</span>}
                      {det.linhas.map((l) => (
                        <span key={l.r} className="flex justify-between gap-2">
                          <span className="text-texto-2">{l.r}</span>
                          <span className="font-semibold tabular-nums">{l.v}</span>
                        </span>
                      ))}
                      {det.nota && <span className="text-texto-2">{det.nota}</span>}
                      <BlocoIndicios
                        det={det}
                        contestar={contestar}
                        passosCiclo={[
                          `Campanha ${dados.eleicao ?? ""}`.trim(),
                          dados.parlamentar.cargo,
                          "Emenda",
                          g.municipio?.nome ?? "Município",
                          f.nome,
                        ]}
                      />
                      {det.verNaLista && (
                        <button type="button" className={BOTAO} onClick={verLista}>
                          {det.verNaLista}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </section>
      {dados.notas.map((n) => (
        <p key={n} role="note" className="mt-3 rounded-[10px] bg-superficie-2 p-3 text-sm leading-normal text-texto-2">
          {n}
        </p>
      ))}
      <p className="mt-3 text-sm leading-normal text-texto-3">
        A espessura do traço à esquerda é o valor.{" "}
        <a href={`${contestar.split("/contestar")[0]}/trilha.csv`} download>
          Baixar CSV
        </a>
      </p>
    </div>
  );
}
