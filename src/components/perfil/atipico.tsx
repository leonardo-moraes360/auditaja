import Link from "next/link";
import type { PadraoAtipico } from "@/data/atipico";
import type { AlertaColegas, AlertaSalto } from "@/lib/atipico";
import { brl, fraseCase } from "@/lib/format";
import { METODOLOGIA_VERSAO } from "@/lib/metrics";

/** Avisos abertos antes do "Ver mais". */
const ABERTOS = 3;

const ROTULO_CASA = { camara: "deputados", senado: "senadores" } as const;

/** Texto curto no celular e longo no desktop, como nos dois artboards da proposta. */
function Dois({ curto, longo }: { curto: React.ReactNode; longo: React.ReactNode }) {
  return (
    <>
      <span className="sm:hidden">{curto}</span>
      <span className="hidden sm:inline">{longo}</span>
    </>
  );
}

/** Largura reservada a cada rótulo do diagrama, em % da linha (os rótulos têm até ~150 px em ~760 px). */
const LARGURA_ROTULO = 22;

/** Distribui rótulos em linhas para não se sobreporem: cada um vai na primeira linha com espaço. */
export function linhasDosRotulos(posicoes: number[]): number[] {
  const fim: number[] = [];
  return posicoes.map((x) => {
    let linha = fim.findIndex((f) => x - f >= LARGURA_ROTULO);
    if (linha === -1) linha = fim.length;
    fim[linha] = x;
    return linha;
  });
}

const TEXTO = "text-[13px] leading-normal text-texto-2 sm:text-sm sm:leading-[1.55]";

function vezes(v: number) {
  return `${v.toLocaleString("pt-BR", { maximumFractionDigits: v < 10 ? 1 : 0 })} vezes`;
}

/** Variação em % a partir de uma razão: 0,9 → "10% a menos"; 1,25 → "25% a mais". */
function variacao(r: number) {
  const p = Math.round((r - 1) * 100);
  if (p === 0) return "o mesmo valor";
  return p < 0 ? `${-p}% a menos` : `${p}% a mais`;
}

type Ctx = {
  ano: number;
  casa: "camara" | "senado";
  hrefNotas: (tipo: string) => string;
};

function Moldura({
  icone,
  selo,
  titulo,
  children,
  tipo,
  hrefNotas,
}: {
  icone: React.ReactNode;
  selo: string;
  titulo: string;
  children: React.ReactNode;
  tipo: string;
  hrefNotas: (tipo: string) => string;
}) {
  return (
    <div
      data-atipico
      className="flex items-start gap-3.5 rounded-[10px] border border-atipico-borda bg-atipico-fundo p-3 sm:rounded-[12px] sm:px-[18px] sm:py-4"
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="mt-0.5 hidden shrink-0 text-atipico sm:block"
      >
        {icone}
      </svg>
      <div className="flex min-w-0 flex-1 flex-col gap-2.5">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-bold tracking-[0.04em] text-atipico uppercase sm:text-xs">
            Padrão atípico · {selo} <span className="max-sm:hidden">· ponto de partida para verificação</span>
          </span>
          <h3 className="text-[15px] leading-snug font-bold text-atipico-titulo sm:text-base">{titulo}</h3>
        </div>
        {children}
        <p className="flex flex-col gap-x-4 gap-y-1 text-sm font-semibold sm:flex-row sm:flex-wrap">
          <a href={hrefNotas(tipo)} download className="inline-flex min-h-11 items-center text-atipico sm:min-h-6">
            Baixar as notas (CSV)
          </a>
          <Link href="/metodologia#atipico" className="inline-flex min-h-11 items-center text-atipico sm:min-h-6">
            Como calculamos (metodologia v{METODOLOGIA_VERSAO})
          </Link>
        </p>
      </div>
    </div>
  );
}

function Diagrama({ a, rotulo }: { a: AlertaColegas; rotulo: string }) {
  const max = Math.max(a.mediaMensal, a.limiteMensal) * 1.12;
  const pos = (v: number) => Math.max(0, Math.min(100, (v / max) * 100));
  const x = (v: number) => `${pos(v)}%`;
  const rotulos = [
    { chave: "mediana", v: a.mediana, texto: `Mediana ${brl(a.mediana)}/mês`, classe: "" },
    { chave: "limite", v: a.limiteMensal, texto: `Limite ${brl(a.limiteMensal)}/mês`, classe: "font-semibold text-atipico" },
    { chave: "eu", v: a.mediaMensal, texto: "Este parlamentar", classe: "font-semibold text-aviso" },
  ].toSorted((p, q) => p.v - q.v);
  const linhas = linhasDosRotulos(rotulos.map((l) => pos(l.v)));
  const nLinhas = Math.max(...linhas) + 1;
  return (
    <figure className="flex flex-col gap-1.5">
      <div
        className="relative h-7 sm:h-14"
        role="img"
        aria-label={`Metade dos ${rotulo} entre ${brl(a.q1)} e ${brl(a.q3)} por mês, mediana ${brl(
          a.mediana,
        )}, limite de atipicidade ${brl(a.limiteMensal)}, este parlamentar ${brl(a.mediaMensal)}`}
      >
        <div className="absolute inset-x-0 top-[13px] h-0.5 bg-linha sm:top-[27px]" />
        <div
          className="absolute top-1.5 h-4 rounded-[3px] border border-chart-2 bg-secondary sm:top-4 sm:h-6 sm:rounded-[4px]"
          style={{ left: x(a.q1), width: `calc(${x(a.q3)} - ${x(a.q1)})` }}
        />
        <div className="absolute top-1 h-5 w-0.5 bg-primary sm:top-3.5 sm:h-7" style={{ left: x(a.mediana) }} />
        <div
          className="absolute top-0 h-7 border-l-2 border-dashed border-atipico sm:top-1.5 sm:h-11"
          style={{ left: x(a.limiteMensal) }}
        />
        <div
          className="absolute top-[7px] -ml-[7px] size-3.5 rounded-full border-2 border-white bg-teto sm:top-5 sm:-ml-2 sm:size-4"
          style={{ left: x(a.mediaMensal) }}
        />
      </div>
      <div
        className="relative hidden text-xs text-muted-foreground sm:block"
        style={{ height: `${nLinhas * 18}px` }}
        aria-hidden="true"
      >
        {rotulos.map((l, i) => (
          <span
            key={l.chave}
            className={`absolute whitespace-nowrap ${l.classe} ${pos(l.v) > 80 ? "-translate-x-full" : pos(l.v) > 8 ? "-translate-x-1/2" : ""}`}
            style={{ left: x(l.v), top: `${linhas[i] * 18}px` }}
          >
            {l.texto}
          </span>
        ))}
      </div>
      <figcaption className="hidden text-xs text-muted-foreground sm:block">
        Caixa azul: metade do meio dos {rotulo} (de {brl(a.q1)} a {brl(a.q3)} por mês). Tracejado: limite de atipicidade.
      </figcaption>
    </figure>
  );
}

function AvisoColegas({ a, ctx }: { a: AlertaColegas; ctx: Ctx }) {
  const rotulo = ROTULO_CASA[ctx.casa];
  return (
    <Moldura
      selo="acima dos colegas"
      titulo={`${fraseCase(a.tipo)}: gasto mensal muito acima do comum entre os ${rotulo} em ${ctx.ano}`}
      tipo={a.tipo}
      hrefNotas={ctx.hrefNotas}
      icone={
        <>
          <path d="M3 3v18h18" />
          <path d="M7 15l4-4 3 3 6-7" />
        </>
      }
    >
      <p className={TEXTO}>
        <Dois
          curto={
            <>
              {brl(a.mediaMensal)} por mês em {ctx.ano}. Metade dos {a.colegas} {rotulo} gastou até {brl(a.mediana)} por
              mês; o limite de atipicidade é {brl(a.limiteMensal)}.
            </>
          }
          longo={
            <>
              Média de <strong>{brl(a.mediaMensal)} por mês</strong> ({brl(a.total)} em {a.meses}{" "}
              {a.meses === 1 ? "mês" : "meses"} com notas). Entre os {a.colegas} {rotulo} que usaram essa despesa no
              ano, metade gastou até {brl(a.mediana)} por mês e três em cada quatro até {brl(a.q3)}. O limite de
              atipicidade é <strong>{brl(a.limiteMensal)} por mês</strong>; no ano, o gasto passa dele em{" "}
              {brl(a.excessoAno)}.
            </>
          }
        />
      </p>
      <Diagrama a={a} rotulo={rotulo} />
      <p className={TEXTO}>
        <Dois
          curto="Atípico não quer dizer irregular. É um ponto de partida para olhar as notas."
          longo="Gasto atípico não é gasto irregular. Pode ter explicação, como base eleitoral longe da capital ou muitas agendas fora de Brasília. Vale olhar as notas e, se for o caso, perguntar ao gabinete."
        />
      </p>
    </Moldura>
  );
}

function AvisoSalto({ a, ctx }: { a: AlertaSalto; ctx: Ctx }) {
  const rotulo = ROTULO_CASA[ctx.casa];
  return (
    <Moldura
      selo={`salto em relação a ${ctx.ano - 1}`}
      titulo={`${fraseCase(a.tipo)}: gasto ${vezes(a.razao)} maior que no ano anterior`}
      tipo={a.tipo}
      hrefNotas={ctx.hrefNotas}
      icone={
        <>
          <path d="M12 19V5" />
          <path d="M5 12l7-7 7 7" />
        </>
      }
    >
      <p className={TEXTO}>
        <Dois
          curto={
            <>
              {brl(a.total)} em {ctx.ano} contra {brl(a.totalAnterior)} em {ctx.ano - 1}. O limite de salto é{" "}
              {vezes(a.limiteRazao)} o ano anterior.
            </>
          }
          longo={
            <>
              Foram <strong>{brl(a.total)}</strong> em {ctx.ano} contra {brl(a.totalAnterior)} em {ctx.ano - 1}. Entre
              os {a.colegas} {rotulo} que usaram essa despesa nos dois anos, metade ficou entre {variacao(a.q1Razao)} e{" "}
              {variacao(a.q3Razao)}. O limite de salto é <strong>{vezes(a.limiteRazao)}</strong> o valor do ano anterior,
              e o aumento foi de {brl(a.aumento)}.
            </>
          }
        />
      </p>
      <p className={TEXTO}>
        <Dois
          curto="Atípico não quer dizer irregular. É um ponto de partida para olhar as notas."
          longo="Um salto pode ter explicação, como abrir um escritório novo ou mudar a forma de contratar um serviço. Vale olhar as notas e, se for o caso, perguntar ao gabinete."
        />
      </p>
    </Moldura>
  );
}

/** Tipos de despesa com algum aviso no ano exibido (selo "Atípico" na lista por tipo). */
export function tiposAtipicos(r: PadraoAtipico | undefined): Set<string> {
  return new Set([...(r?.acima ?? []).map((a) => a.tipo), ...(r?.salto ?? []).map((a) => a.tipo)]);
}

/**
 * Avisos de padrão atípico do ano exibido (ou, no mandato, os anos com aviso). Sem aviso, uma linha
 * discreta diz que a checagem foi feita.
 */
export function AvisosAtipicos({
  resultados,
  mandato,
  casa,
  hrefNotas,
  hrefAno,
}: {
  resultados: PadraoAtipico[];
  mandato: boolean;
  casa: "camara" | "senado";
  hrefNotas: (ano: number, tipo: string) => string;
  hrefAno: (ano: number) => string;
}) {
  const como = (
    <Link href="/metodologia#atipico" className="font-semibold">
      Como calculamos
    </Link>
  );
  if (mandato) {
    const comAviso = resultados
      .map((r) => ({ ano: r.ano, n: r.acima.length + r.salto.length }))
      .filter((r) => r.n > 0)
      .toSorted((a, b) => a.ano - b.ano);
    return (
      <p data-atipico-resumo className="text-[13px] leading-normal text-muted-foreground sm:text-sm">
        {comAviso.length ? (
          <>
            Padrão atípico, comparado ano a ano:{" "}
            {comAviso.map((r, i) => (
              <span key={r.ano}>
                {i > 0 && ", "}
                <Link href={hrefAno(r.ano)}>
                  {r.ano} ({r.n} {r.n === 1 ? "aviso" : "avisos"})
                </Link>
              </span>
            ))}
            . {como}.
          </>
        ) : (
          <>Nenhum padrão atípico nos anos do mandato. {como}.</>
        )}
      </p>
    );
  }
  const r = resultados[0];
  if (!r) return null;
  const avisos = [
    ...r.acima.map((a) => ({ chave: `c-${a.tipo}`, valor: a.excessoAno, el: <AvisoColegas a={a} ctx={ctxDe(r, casa, hrefNotas)} /> })),
    ...r.salto.map((a) => ({ chave: `s-${a.tipo}`, valor: a.aumento, el: <AvisoSalto a={a} ctx={ctxDe(r, casa, hrefNotas)} /> })),
  ].toSorted((a, b) => b.valor - a.valor);
  const semSalto = !r.anoAnteriorDisponivel ? ` A comparação com ${r.ano - 1} não é feita porque esse ano não foi coletado.` : "";
  if (!avisos.length) {
    return (
      <p data-atipico-resumo className="text-[13px] leading-normal text-muted-foreground sm:text-sm">
        Nenhum tipo de despesa ficou acima dos limites de padrão atípico em {r.ano}.{semSalto} {como}.
      </p>
    );
  }
  const abertos = avisos.slice(0, ABERTOS);
  const resto = avisos.slice(ABERTOS);
  return (
    <div className="flex flex-col gap-3">
      {abertos.map((a) => (
        <div key={a.chave}>{a.el}</div>
      ))}
      {resto.length > 0 && (
        <details className="flex flex-col gap-3">
          <summary className="inline-flex min-h-11 cursor-pointer items-center text-sm font-semibold text-atipico sm:min-h-6">
            Ver mais {resto.length} {resto.length === 1 ? "padrão atípico" : "padrões atípicos"}
          </summary>
          <div className="mt-3 flex flex-col gap-3">
            {resto.map((a) => (
              <div key={a.chave}>{a.el}</div>
            ))}
          </div>
        </details>
      )}
      {semSalto && <p className="text-xs text-muted-foreground">{semSalto.trim()}</p>}
    </div>
  );
}

function ctxDe(r: PadraoAtipico, casa: "camara" | "senado", hrefNotas: (ano: number, tipo: string) => string): Ctx {
  return { ano: r.ano, casa, hrefNotas: (tipo) => hrefNotas(r.ano, tipo) };
}
