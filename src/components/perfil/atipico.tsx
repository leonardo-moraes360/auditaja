import Link from "next/link";
import type { PadraoAtipico } from "@/data/atipico";
import { PISO_REAIS, type AlertaColegas, type AlertaSalto } from "@/lib/atipico";
import { brl, fraseCase, MESES } from "@/lib/format";
import { tipoDespesaCurto } from "@/lib/rotulos";
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

const TEXTO = "text-sm leading-normal text-texto-2 sm:text-sm sm:leading-[1.55]";

/** " (jan–nov)" quando o ano ainda não tem os 12 meses publicados. */
function periodoParcial(ultimoMes: number) {
  return ultimoMes >= 1 && ultimoMes < 12 ? ` (jan–${MESES[ultimoMes - 1].toLowerCase()})` : "";
}

/** Mesma precisão no texto e no quadro do limite ("13 vezes" e "13 × 2025", nunca "12,8" ao lado de "13"). */
function numeroVezes(v: number) {
  return v.toLocaleString("pt-BR", { maximumFractionDigits: v < 10 ? 1 : 0 });
}

function vezes(v: number) {
  return `${numeroVezes(v)} vezes`;
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
  sexo: string | null;
  /** Último mês publicado do ano na Casa (rótulo "2026 (jan–nov)"). */
  ultimoMes: number;
  hrefNotas: (tipo: string) => string;
  hrefContestar: string;
};

/** "Este deputado", "Esta deputada", "Este senador", "Esta senadora". */
function este(ctx: Ctx) {
  const f = ctx.sexo === "F";
  const cargo = ctx.casa === "senado" ? (f ? "senadora" : "senador") : f ? "deputada" : "deputado";
  return `${f ? "Esta" : "Este"} ${cargo}`;
}

/** Nome curto do tipo para frases: "HOSPEDAGEM ,EXCETO DO PARLAMENTAR NO DF." → "hospedagem". */
function tipoCurto(tipo: string) {
  const curto = tipoDespesaCurto(tipo);
  if (curto) return curto.toLowerCase();
  return fraseCase(tipo)
    .split(/,\s*exceto/i)[0]
    .toLowerCase();
}

function rotuloNotas(n: number) {
  return n === 1 ? "a nota" : `as ${n} notas`;
}

function Moldura({
  icone,
  selo,
  titulo,
  tituloCurto,
  children,
  tipo,
  notasLongo,
  notasCurto,
  ctx,
}: {
  icone: React.ReactNode;
  selo: string;
  titulo: string;
  tituloCurto: string;
  children: React.ReactNode;
  tipo: string;
  notasLongo: string;
  notasCurto: string;
  ctx: Ctx;
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
        className="mt-0.5 hidden shrink-0 text-atipico-traco sm:block"
      >
        {icone}
      </svg>
      <div className="flex min-w-0 flex-1 flex-col gap-2.5">
        <div className="flex flex-col gap-2 sm:gap-1">
          <span className="text-sm font-bold tracking-[0.04em] text-atipico uppercase sm:text-xs">
            Padrão atípico<span className="max-sm:hidden"> · {selo} · ponto de partida para verificação</span>
          </span>
          <h3 className="text-base leading-[1.35] font-bold text-atipico-titulo sm:text-base sm:leading-snug">
            <Dois curto={tituloCurto} longo={titulo} />
          </h3>
        </div>
        {children}
        <p className="flex flex-col gap-x-4 gap-y-1 text-sm font-semibold sm:flex-row sm:flex-wrap">
          <a href={ctx.hrefNotas(tipo)} download className="inline-flex min-h-11 items-center text-atipico sm:min-h-6">
            <Dois curto={notasCurto} longo={notasLongo} />
          </a>
          <Link href="/metodologia#atipico" className="inline-flex min-h-11 items-center text-atipico sm:min-h-6">
            <Dois curto="Como calculamos" longo={`Como calculamos (metodologia v${METODOLOGIA_VERSAO})`} />
          </Link>
          <Link href={ctx.hrefContestar} className="hidden text-atipico sm:inline-flex sm:min-h-6 sm:items-center">
            Pedir correção
          </Link>
        </p>
      </div>
    </div>
  );
}

function Diagrama({ a, rotulo, eu }: { a: AlertaColegas; rotulo: string; eu: string }) {
  const max = Math.max(a.mediaMensal, a.limiteMensal) * 1.12;
  const pos = (v: number) => Math.max(0, Math.min(100, (v / max) * 100));
  const x = (v: number) => `${pos(v)}%`;
  const rotulos = [
    { chave: "mediana", v: a.mediana, texto: `Mediana ${brl(a.mediana)}/mês`, classe: "" },
    {
      chave: "limite",
      v: a.limiteMensal,
      texto: `Limite ${brl(a.limiteMensal)}/mês`,
      classe: "font-semibold text-atipico",
    },
    { chave: "eu", v: a.mediaMensal, texto: eu, classe: "font-semibold text-aviso" },
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
        )}, limite de atipicidade ${brl(a.limiteMensal)}, ${eu.toLowerCase()} ${brl(a.mediaMensal)}`}
      >
        <div className="absolute inset-x-0 top-[13px] h-0.5 bg-borda-campo sm:top-[27px]" />
        <div
          className="absolute top-1.5 h-4 rounded-[3px] border border-primary bg-primaria-fundo sm:top-4 sm:h-6 sm:rounded-[4px]"
          style={{ left: x(a.q1), width: `calc(${x(a.q3)} - ${x(a.q1)})` }}
        />
        <div className="absolute top-3.5 hidden h-7 w-0.5 bg-primary sm:block" style={{ left: x(a.mediana) }} />
        <div
          className="absolute top-0 h-7 border-l-2 border-dashed border-atipico-traco sm:top-1.5 sm:h-11"
          style={{ left: x(a.limiteMensal) }}
        />
        <div
          className="absolute top-[7px] -ml-[7px] size-3.5 rounded-full border-2 border-superficie bg-atipico sm:top-5 sm:-ml-2 sm:size-4"
          style={{ left: x(a.mediaMensal) }}
        />
      </div>
      <div
        className="relative hidden text-xs text-muted-foreground sm:block"
        style={{ height: `${nLinhas * 18}px` }}
        aria-hidden="true"
      >
        <span className="absolute left-0">R$ 0</span>
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
        Caixa azul: metade do meio dos {rotulo} (de {brl(a.q1)} a {brl(a.q3)} por mês). Tracejado: limite de
        atipicidade.
      </figcaption>
    </figure>
  );
}

function AvisoColegas({ a, ctx }: { a: AlertaColegas; ctx: Ctx }) {
  const rotulo = ROTULO_CASA[ctx.casa];
  return (
    <Moldura
      selo="acima dos colegas"
      titulo={`${tipoDespesaCurto(a.tipo) ?? fraseCase(a.tipo)}: gasto mensal muito acima do comum entre os ${rotulo} em ${ctx.ano}`}
      tituloCurto={`${fraseCase(tipoCurto(a.tipo))} muito acima do comum entre os ${rotulo}`}
      tipo={a.tipo}
      notasLongo={`Baixar ${rotuloNotas(a.notas)} de ${tipoCurto(a.tipo)}`}
      notasCurto={`Baixar ${rotuloNotas(a.notas)}`}
      ctx={ctx}
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
              mês; o limite de atipicidade é {brl(a.limiteMensal)} por mês.
            </>
          }
          longo={
            <>
              {este(ctx)} gastou em média <strong>{brl(a.mediaMensal)} por mês</strong> em {tipoCurto(a.tipo)} (
              {brl(a.total)} em {a.meses} {a.meses === 1 ? "mês" : "meses"} com notas). Entre os {a.colegas} {rotulo}{" "}
              que usaram essa despesa no ano, metade gastou até {brl(a.mediana)} por mês e três em cada quatro até{" "}
              {brl(a.q3)}. O valor passa do limite de atipicidade, de <strong>{brl(a.limiteMensal)} por mês</strong>, em{" "}
              {brl(a.excessoAno)} no ano.
            </>
          }
        />
      </p>
      <Diagrama a={a} rotulo={rotulo} eu={este(ctx)} />
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
      titulo={`${tipoDespesaCurto(a.tipo) ?? fraseCase(a.tipo)}: gasto ${vezes(a.razao)} maior que no ano anterior`}
      tituloCurto={`${fraseCase(tipoCurto(a.tipo))}: ${vezes(a.razao)} mais que em ${ctx.ano - 1}`}
      tipo={a.tipo}
      notasLongo={`Baixar ${rotuloNotas(a.notas)} de ${ctx.ano}`}
      notasCurto={`Baixar ${rotuloNotas(a.notas)}`}
      ctx={ctx}
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
              os {a.colegas} {rotulo} que usaram essa despesa nos dois anos, metade variou entre {variacao(a.q1Razao)} e{" "}
              {variacao(a.q3Razao)}. O limite de salto é <strong>{vezes(a.limiteRazao)}</strong> o valor do ano
              anterior, e o aumento passa de {brl(PISO_REAIS)}.
            </>
          }
        />
      </p>
      <div className="flex flex-wrap gap-3">
        {[
          { rotulo: String(ctx.ano - 1), valor: brl(a.totalAnterior), destaque: false },
          { rotulo: `${ctx.ano}${periodoParcial(ctx.ultimoMes)}`, valor: brl(a.total), destaque: false },
          {
            rotulo: "Limite de salto",
            valor: `${numeroVezes(a.limiteRazao)} × ${ctx.ano - 1}`,
            destaque: true,
          },
        ].map((c) => (
          <div
            key={c.rotulo}
            className="flex flex-[1_1_160px] flex-col gap-0.5 rounded-[10px] bg-superficie px-3 py-2.5"
          >
            <span className="text-xs text-muted-foreground">{c.rotulo}</span>
            <span className={`font-heading text-xl font-bold ${c.destaque ? "text-atipico" : ""}`}>{c.valor}</span>
          </div>
        ))}
      </div>
      <p className={TEXTO}>
        <Dois
          curto="Atípico não quer dizer irregular. É um ponto de partida para olhar as notas."
          longo="Um salto pode ter explicação, como abrir um escritório novo no estado. Vale olhar as notas e, se for o caso, perguntar ao gabinete."
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
  sexo,
  ultimoMes,
  hrefNotas,
  hrefAno,
  hrefContestar,
}: {
  resultados: PadraoAtipico[];
  mandato: boolean;
  casa: "camara" | "senado";
  sexo: string | null;
  ultimoMes: number;
  hrefNotas: (ano: number, tipo: string) => string;
  hrefAno: (ano: number) => string;
  hrefContestar: string;
}) {
  // Link dentro da frase: no celular ganha 44 px de altura de toque.
  const ALVO = "inline-flex min-h-11 items-center font-semibold sm:inline sm:min-h-0";
  const como = (
    <Link href="/metodologia#atipico" className={ALVO}>
      Como calculamos
    </Link>
  );
  if (mandato) {
    const comAviso = resultados
      .map((r) => ({ ano: r.ano, n: r.acima.length + r.salto.length }))
      .filter((r) => r.n > 0)
      .toSorted((a, b) => a.ano - b.ano);
    return (
      <p data-atipico-resumo className="text-sm leading-normal text-muted-foreground sm:text-sm">
        {comAviso.length ? (
          <>
            Padrão atípico, comparado ano a ano:{" "}
            {comAviso.map((r, i) => (
              <span key={r.ano}>
                {i > 0 && ", "}
                <Link href={hrefAno(r.ano)} className={ALVO}>
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
  const ctx: Ctx = { ano: r.ano, casa, sexo, ultimoMes, hrefNotas: (tipo) => hrefNotas(r.ano, tipo), hrefContestar };
  // Do maior excesso sobre o limite para o menor, nos dois tipos de aviso.
  const avisos = [
    ...r.acima.map((a) => ({ chave: `c-${a.tipo}`, valor: a.excessoAno, el: <AvisoColegas a={a} ctx={ctx} /> })),
    ...r.salto.map((a) => ({ chave: `s-${a.tipo}`, valor: a.excessoAno, el: <AvisoSalto a={a} ctx={ctx} /> })),
  ].toSorted((a, b) => b.valor - a.valor);
  const semSalto = !r.anoAnteriorDisponivel
    ? ` A comparação com ${r.ano - 1} não é feita porque esse ano não foi coletado.`
    : "";
  if (!avisos.length) {
    return (
      <p data-atipico-resumo className="text-sm leading-normal text-muted-foreground sm:text-sm">
        Nenhum tipo de despesa ficou acima do limite de atipicidade em {r.ano}.{semSalto} {como}.
      </p>
    );
  }
  const abertos = avisos.slice(0, ABERTOS);
  const resto = avisos.slice(ABERTOS);
  return (
    <div className="flex flex-col gap-3 sm:gap-5">
      {abertos.map((a) => (
        <div key={a.chave}>{a.el}</div>
      ))}
      {resto.length > 0 && (
        <details className="flex flex-col gap-3">
          <summary className="inline-flex min-h-11 cursor-pointer items-center text-sm font-semibold text-atipico sm:min-h-6">
            Ver mais {resto.length} {resto.length === 1 ? "padrão atípico" : "padrões atípicos"}
          </summary>
          <div className="mt-3 flex flex-col gap-3 sm:mt-5 sm:gap-5">
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
