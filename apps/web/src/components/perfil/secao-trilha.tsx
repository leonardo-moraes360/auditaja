import Link from "next/link";
import type {
  ColetaCitada,
  EmendaTrilha,
  Indicio,
  IndicioCiclo,
  IndicioRecemAberta,
  PlanoTrilha,
  RecebedorTrilha,
  Trilha,
  TrilhaCheia,
} from "@/data/trilha";
import { brlMi } from "@auditaja/core/emendas";
import { brlCompacto, dataBr, dataHoraBr, pct } from "@auditaja/core/format";
import { METODOLOGIA_VERSAO } from "@auditaja/core/metrics";
import { formatarCnpj } from "@auditaja/core/privacy";
import {
  DIAS_RECEM_ABERTA,
  fraseSemPix,
  nomeLegivel,
  notasAvaliacao,
  quemIndicou,
  taxaDeBase,
  type QuemIndicou,
} from "@auditaja/core/trilha";

/**
 * "Para onde foi o dinheiro das emendas Pix", versão enxuta (artboards SeguirDinheiroEnxuto e
 * SeguirDinheiroEnxutoMobile, aprovados em 13/11/2026). Uma linha por emenda; a emenda abre os três
 * elos e os municípios em ordem de valor pago; cada município abre quem ele pagou. Indícios agrupados
 * por sinal (R4: "indício", regra, limiar, taxa de base, fontes e a frase de não imputação).
 * Tudo com <details> nativo: funciona sem JavaScript e com teclado.
 */

const CARTAO = "flex scroll-mt-4 flex-col rounded-[14px] border bg-superficie p-4 sm:rounded-[16px]";
const H2 = "font-heading text-lg font-bold leading-[1.3] sm:text-[1.375rem]";
const API = "https://api-publica.transferegov.gestao.gov.br/especiais";
const PORTAL_EMENDAS = "https://portaldatransparencia.gov.br/download-de-dados/emendas-parlamentares";
const PAGINA_RECEITA = "https://dados.gov.br/dados/conjuntos-dados/cadastro-nacional-da-pessoa-juridica---cnpj";
/** DENS-03: municípios com pagamento à vista antes de "Ver os outros N". */
export const LIMITE_MUNICIPIOS = 10;
const LINK_AVISO = "inline-flex min-h-11 items-center text-atipico sm:min-h-6";
const NAO_PROVA = "Indício não é prova de irregularidade.";
const SUMMARY = "cursor-pointer list-none [&::-webkit-details-marker]:hidden";

/** "2025-02" ou "2025-02-10" → "02/2025". */
const mesAno = (iso: string | null | undefined) => (iso ? `${iso.slice(5, 7)}/${iso.slice(0, 4)}` : "");

function plural(n: number, um: string, varios: string) {
  return `${n.toLocaleString("pt-BR")} ${n === 1 ? um : varios}`;
}

export { quemIndicou, type QuemIndicou };

const ancoraEmenda = (codigo: string) => `trilha-${codigo}`;
const ancoraMunicipio = (codigo: string, plano: number) => `trilha-${codigo}-${plano}`;
/** DENS-09: alvo dentro do município; o navegador abre o <details> fechado ao seguir a âncora. */
const ancoraRecebedores = (codigo: string, plano: number) => `${ancoraMunicipio(codigo, plano)}-pagos`;

/** "MUNICIPIO DE SANTA MARIA" → "Santa Maria"; estados e fundos ficam com o nome inteiro. */
function nomeMunicipio(p: PlanoTrilha) {
  const n = nomeLegivel(p.ente.nome) || "Ente não informado";
  return n.replace(/^Munic[ií]pio de /, "");
}

function nomeEnte(nome: string | null) {
  const n = nomeLegivel(nome);
  return n ? n.replace(/^Munic[ií]pio de /, "") : "ente não informado";
}

export function SecaoTrilha({
  trilha,
  parlamentarId,
  quem,
}: {
  trilha: Trilha;
  parlamentarId: number;
  quem: QuemIndicou;
}) {
  const contestar = `/parlamentares/${parlamentarId}/contestar?secao=trilha`;
  return (
    <section id="trilha" data-trilha aria-labelledby="trilha-titulo" className={`${CARTAO} gap-3.5 sm:gap-5 sm:p-6`}>
      <div className="flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-baseline sm:justify-between sm:gap-x-4 sm:gap-y-2">
        <h2 id="trilha-titulo" className={H2}>
          Para onde foi o dinheiro das emendas Pix
        </h2>
        <span
          data-acoes-topo
          className="flex gap-4 text-base sm:text-sm [&_a]:inline-flex [&_a]:min-h-11 [&_a]:items-center sm:[&_a]:min-h-0"
        >
          {!trilha.vazio && (
            <a href={`/parlamentares/${parlamentarId}/trilha.csv`} download>
              Baixar CSV
            </a>
          )}
          <Link href={contestar}>Contestar</Link>
        </span>
      </div>
      <p className="text-base leading-normal text-texto-2">
        <span className="hidden sm:inline">
          O dinheiro da emenda Pix cai no caixa do município, que informa no Transferegov quem pagou com ele. Ligamos
          tudo pelo código da emenda e pelo CNPJ.
        </span>
        <span className="sm:hidden">O município recebe a emenda Pix e informa no Transferegov quem pagou com ela.</span>
      </p>

      {trilha.vazio ? (
        <p data-trilha-vazio className="text-muted-foreground">
          {fraseSemPix(quem)}
        </p>
      ) : (
        <ConteudoTrilha trilha={trilha} quem={quem} contestar={contestar} />
      )}

      <ComoSeguimos className="lg:hidden" />
    </section>
  );
}

function Indicador({
  titulo,
  tituloCurto,
  valor,
  detalhe,
  detalheCurto,
  progresso,
  className = "",
  dado,
}: {
  titulo: string;
  tituloCurto?: string;
  valor: string;
  detalhe: string;
  detalheCurto?: string;
  progresso?: number | null;
  className?: string;
  dado?: string;
}) {
  return (
    <div
      data-indicador={dado ?? ""}
      className={`flex flex-col gap-1 rounded-[10px] bg-background p-3 sm:gap-1.5 sm:rounded-[12px] sm:p-4 ${className}`}
    >
      <p className="text-sm text-muted-foreground">
        <span className="hidden sm:inline">{titulo}</span>
        <span className="sm:hidden">{tituloCurto ?? titulo}</span>
      </p>
      <p className="font-heading text-xl font-bold tabular-nums sm:text-[1.625rem]">{valor}</p>
      {progresso != null && (
        <div
          className="hidden h-2 overflow-hidden rounded bg-muted sm:block"
          role="img"
          aria-label={`${progresso}% do valor transferido tem pagamento informado`}
        >
          <div className="h-2 bg-primary" style={{ width: `${Math.min(100, progresso)}%` }} />
        </div>
      )}
      <p className="text-sm text-muted-foreground">
        <span className="hidden sm:inline">{detalhe}</span>
        <span className="sm:hidden">{detalheCurto ?? detalhe}</span>
      </p>
    </div>
  );
}

/** UF dos municípios de todas as emendas (uma só) ou nada. */
function ufUnica(t: TrilhaCheia) {
  const ufs = new Set(t.emendas.flatMap((e) => e.planos.flatMap((p) => (p.ente.uf ? [p.ente.uf] : []))));
  return ufs.size === 1 ? ` (${[...ufs][0]})` : "";
}

function ConteudoTrilha({ trilha, quem, contestar }: { trilha: TrilhaCheia; quem: QuemIndicou; contestar: string }) {
  const { totais, indicios, emendas, avaliacao } = trilha;
  const pctPago = pct(totais.pago, totais.transferido);
  const recem = indicios.filter((i): i is IndicioRecemAberta => i.tipo === "recem-aberta");
  const ciclos = indicios.filter((i): i is IndicioCiclo => i.tipo === "ciclo-fechado");
  const avaliados = { recem: avaliacao.recemAberta === "avaliado", ciclo: avaliacao.ciclo === "avaliado" };
  const algumAvaliado = avaliados.recem || avaliados.ciclo;
  const notas = notasAvaliacao(avaliacao.recemAberta, avaliacao.ciclo, trilha.receitaBase, trilha.eleicao);
  const detalheIndicios = !algumAvaliado
    ? "Nenhum dos dois sinais pôde ser avaliado"
    : [
        avaliados.recem
          ? plural(recem.length, "empresa recém-aberta", "empresas recém-abertas")
          : "recém-aberta não avaliada",
        avaliados.ciclo
          ? `${plural(ciclos.length, "ciclo", "ciclos")} com a campanha`
          : "ciclo com a campanha não avaliado",
      ].join(" · ");
  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
        <Indicador
          dado="transferido"
          titulo="Transferido"
          valor={brlMi(totais.transferido)}
          detalhe={`${plural(totais.emendas, "emenda", "emendas")}, ${plural(totais.entes, "município", "municípios")}${ufUnica(trilha)}`}
          detalheCurto={`${plural(totais.emendas, "emenda", "emendas")}, ${plural(totais.entes, "município", "municípios")}`}
        />
        <Indicador
          dado="pago"
          titulo="Pagamento informado"
          tituloCurto="Pago informado"
          valor={brlMi(totais.pago)}
          progresso={pctPago}
          detalhe={`${pctPago ?? 0}% do transferido, a ${plural(totais.recebedoresPj, "empresa ou entidade", "empresas e entidades")}`}
          detalheCurto={`${pctPago ?? 0}% do transferido`}
        />
        <Indicador
          dado="indicios"
          className="hidden sm:flex"
          titulo="Indícios"
          valor={algumAvaliado ? String(indicios.length) : "Não avaliados"}
          detalhe={detalheIndicios}
        />
      </div>

      {notas.length > 0 && (
        <div
          role="note"
          data-nao-avaliado
          className="flex flex-col gap-1 rounded-[10px] bg-muted px-3 py-3 text-sm leading-normal text-texto-2 sm:rounded-[12px] sm:px-4"
        >
          {!algumAvaliado && <strong className="font-semibold sm:hidden">Indícios não avaliados.</strong>}
          {notas.map((n) => (
            <p key={n}>{n}</p>
          ))}
          <p>Isso não quer dizer que não haja indício.</p>
        </div>
      )}

      {indicios.length > 0 && (
        <>
          <div className="hidden flex-col gap-3 sm:flex">
            {recem.length > 0 && (
              <CartaoIndicios tipo="recem-aberta" casos={recem} trilha={trilha} quem={quem} contestar={contestar} />
            )}
            {ciclos.length > 0 && (
              <CartaoIndicios tipo="ciclo-fechado" casos={ciclos} trilha={trilha} quem={quem} contestar={contestar} />
            )}
          </div>
          <IndiciosCelular trilha={trilha} contestar={contestar} />
        </>
      )}

      <div className="flex flex-col gap-2">
        <h3 className="text-base font-bold">Emendas Pix</h3>
        <div
          data-emendas
          className="flex flex-col gap-2 sm:gap-0 sm:overflow-hidden sm:rounded-[12px] sm:border sm:border-borda-suave"
        >
          <div
            aria-hidden="true"
            className="hidden grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.4fr)_5.5rem] gap-3 bg-muted px-4 py-2.5 text-sm font-semibold text-texto-2 sm:grid"
          >
            <span>Emenda</span>
            <span>Municípios</span>
            <span className="text-right">Transferido</span>
            <span>Pago informado</span>
            <span />
          </div>
          {emendas.map((e) => (
            <LinhaEmenda key={e.codigo} emenda={e} trilha={trilha} />
          ))}
        </div>
      </div>

      <p data-nota-trilha className="text-sm leading-normal text-muted-foreground">
        Pagamentos a pessoas físicas aparecem somados, sem nome nem documento. A data de abertura é a da matriz da
        empresa{trilha.receitaBase ? ` (Receita, base de ${mesAno(trilha.receitaBase)})` : ""}. Fontes: Portal da
        Transparência, Transferegov, Receita Federal e TSE, com data e SHA-256 no CSV e em cada indício.
      </p>
    </>
  );
}

function sha(c: ColetaCitada) {
  return `${c.sha256.slice(0, 4)}…${c.sha256.slice(-4)}`;
}

/** LING-09: cada arquivo de cada elo com data, SHA-256 e link para a coleta. */
function rotuloColeta(c: ColetaCitada): string {
  const base = /base de (\d{2}\/\d{4}|\d{2}\/\d{2}\/\d{4})/.exec(c.observacao ?? "")?.[1];
  const quando = dataHoraBr(c.coletado_em).slice(0, 10);
  switch (c.fonte) {
    case "receita_estabelecimentos":
      return `Receita Federal, Estabelecimentos, base de ${base ?? "mês não informado"}`;
    case "transferegov_especiais":
      return `Transferegov, emendas Pix, coletado em ${quando}`;
    case "tse_prestacao_contas":
      return `TSE, prestação de contas de candidatos ${/candidatos_(\d{4})/.exec(c.url)?.[1] ?? ""}`;
    case "cgu_emendas":
      return `Portal da Transparência, emendas, coletado em ${quando}`;
    default:
      return `${c.fonte}, coletado em ${quando}`;
  }
}

function hrefColeta(c: ColetaCitada) {
  if (c.fonte === "receita_estabelecimentos") return PAGINA_RECEITA;
  if (c.fonte === "cgu_emendas") return PORTAL_EMENDAS;
  return c.url;
}

const ORDEM_FONTE = ["receita_estabelecimentos", "tse_prestacao_contas", "transferegov_especiais", "cgu_emendas"];

function ArquivosUsados({ indicios, trilha }: { indicios: Indicio[]; trilha: TrilhaCheia }) {
  const ids = [...new Set(indicios.flatMap((i) => i.coletas))];
  const cs = ids
    .map((id) => trilha.coletas[id])
    .filter(Boolean)
    .toSorted((a, b) => ORDEM_FONTE.indexOf(a.fonte) - ORDEM_FONTE.indexOf(b.fonte));
  return (
    <details data-arquivos className="text-sm">
      <summary className={`${SUMMARY} ${LINK_AVISO} font-semibold underline`}>Arquivos usados e SHA-256</summary>
      <ul className="mt-1 flex flex-col gap-1 text-sm leading-normal text-muted-foreground">
        {cs.map((c) => (
          <li key={c.id}>
            <a href={hrefColeta(c)} rel="noopener noreferrer" target="_blank" className="text-muted-foreground">
              {rotuloColeta(c)}
            </a>{" "}
            (SHA-256 <span title={c.sha256}>{sha(c)}</span>)
          </li>
        ))}
      </ul>
    </details>
  );
}

function periodoMeses(a: string, b: string) {
  return mesAno(a) === mesAno(b) ? `em ${mesAno(a)}` : `entre ${mesAno(a)} e ${mesAno(b)}`;
}

function enteDoIndicio(i: Indicio) {
  return i.tipo === "ciclo-fechado" && i.direto ? "o governo federal" : nomeEnte(i.ente);
}

/** Frase com as datas de um caso (desktop). */
function fraseCaso(i: Indicio) {
  if (i.tipo === "recem-aberta") {
    const filial = i.abertura.origem === "filial" ? " (data da filial; matriz não encontrada)" : "";
    return `Aberta em ${dataBr(i.abertura.data)}${filial} (Receita, base de ${mesAno(i.abertura.baseMes)}), ${plural(i.dias, "dia", "dias")} antes do 1º pagamento de ${nomeEnte(i.ente)} com a emenda ${i.emenda}.`;
  }
  const recebeu = i.direto
    ? `Recebeu do governo federal, em pagamento direto da emenda ${i.emenda}, ${periodoMeses(i.primeiroRecebimento, i.ultimoRecebimento)}.`
    : `Recebeu de ${nomeEnte(i.ente)} com a emenda ${i.emenda} ${periodoMeses(i.primeiroRecebimento, i.ultimoRecebimento)}.`;
  return `${recebeu} Na campanha de ${i.eleicao}: ${brlMi(i.despesaCampanha)} em despesas declaradas ao TSE ${periodoMeses(i.primeiraDespesa, i.ultimaDespesa)}.`;
}

function hrefCaso(i: Indicio) {
  return i.plano != null ? `#${ancoraRecebedores(i.emenda, i.plano)}` : null;
}

function CartaoIndicios({
  tipo,
  casos,
  trilha,
  quem,
  contestar,
}: {
  tipo: Indicio["tipo"];
  casos: Indicio[];
  trilha: TrilhaCheia;
  quem: QuemIndicou;
  contestar: string;
}) {
  const recem = tipo === "recem-aberta";
  const [m, n] = recem ? trilha.taxas.recemAberta : trilha.taxas.ciclo;
  const titulo = recem
    ? "Indício: empresa aberta pouco antes de receber"
    : "Indício: empresa da emenda também na campanha";
  const id = `indicios-${tipo}`;
  return (
    <div
      role="note"
      aria-labelledby={id}
      data-indicio={tipo}
      className="flex flex-col gap-2.5 rounded-[12px] border border-atipico-borda bg-atipico-fundo px-4 py-4"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h3 id={id} className="text-base leading-[1.35] font-bold text-atipico-titulo">
          {titulo} · {plural(casos.length, "caso", "casos")}
        </h3>
        <span data-taxa className="text-sm text-texto-2">
          {recem
            ? `${taxaDeBase(m, n)} das empresas pagas com emendas Pix na base, com data de abertura conhecida, caem nesta regra`
            : `${taxaDeBase(m, n)} dos parlamentares com emenda Pix na base têm um caso assim`}
        </span>
      </div>
      <p className="text-sm leading-normal text-texto-2">
        {recem
          ? `A matriz da empresa abriu menos de ${DIAS_RECEM_ABERTA} dias antes do primeiro pagamento ligado à emenda.`
          : `O mesmo CNPJ recebeu dinheiro da emenda e aparece nas despesas declaradas da campanha de ${casos[0].tipo === "ciclo-fechado" ? casos[0].eleicao : ""} ${quem}, com data até o pagamento.`}{" "}
        {NAO_PROVA}
      </p>
      <ul className="flex flex-col">
        {casos.map((i) => {
          const href = hrefCaso(i);
          return (
            <li
              key={`${i.emenda}-${i.cnpj}`}
              data-caso={i.cnpj}
              className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-baseline gap-x-4 gap-y-1 border-t border-atipico-borda py-2.5"
            >
              <span className="text-base">
                <strong className="font-semibold">{nomeLegivel(i.nome)}</strong>{" "}
                <span className="text-sm text-muted-foreground tabular-nums">{formatarCnpj(i.cnpj)}</span>
              </span>
              <span className="text-base tabular-nums">{brlMi(i.recebido)}</span>
              {href ? (
                <a href={href} className="text-sm font-semibold text-atipico">
                  Ver na trilha
                </a>
              ) : (
                <span />
              )}
              <span className="col-span-3 text-sm text-texto-2">{fraseCaso(i)}</span>
            </li>
          );
        })}
      </ul>
      <div className="flex flex-wrap gap-x-4 text-sm font-semibold">
        <Link href={recem ? "/metodologia#recem-aberta" : "/metodologia#ciclo-fechado"} className={LINK_AVISO}>
          Como calculamos (metodologia {METODOLOGIA_VERSAO})
        </Link>
        <Link href={contestar} className={LINK_AVISO}>
          Contestar
        </Link>
        <ArquivosUsados indicios={casos} trilha={trilha} />
      </div>
    </div>
  );
}

/**
 * Celular: um cartão só (SeguirDinheiroEnxutoMobile), com um bloco por sinal: regra com o limiar, taxa de
 * base (LING-02, LING-07), uma linha por caso e o link da metodologia daquele sinal.
 */
function IndiciosCelular({ trilha, contestar }: { trilha: TrilhaCheia; contestar: string }) {
  const { indicios } = trilha;
  const grupos = (["recem-aberta", "ciclo-fechado"] as const)
    .map((tipo) => ({ tipo, casos: indicios.filter((i) => i.tipo === tipo) }))
    .filter((g) => g.casos.length > 0);
  return (
    <div
      role="note"
      aria-labelledby="indicios-celular"
      data-indicios-celular
      className="flex flex-col gap-2 rounded-[10px] border border-atipico-borda bg-atipico-fundo p-3 sm:hidden"
    >
      <h3 id="indicios-celular" className="text-base leading-[1.35] font-bold text-atipico-titulo">
        {plural(indicios.length, "indício para conferir", "indícios para conferir")}
      </h3>
      <p className="text-sm leading-normal text-texto-2">{NAO_PROVA}</p>
      {grupos.map(({ tipo, casos }) => {
        const recem = tipo === "recem-aberta";
        const [m, n] = recem ? trilha.taxas.recemAberta : trilha.taxas.ciclo;
        return (
          <section
            key={tipo}
            data-grupo-celular={tipo}
            aria-label={recem ? "Empresa aberta pouco antes de receber" : "Empresa da emenda também na campanha"}
            className="flex flex-col gap-1 border-t border-atipico-borda pt-2"
          >
            <h4 className="text-sm font-bold text-atipico">
              {recem ? "Empresa aberta pouco antes de receber" : "Empresa da emenda também na campanha"}
            </h4>
            <p className="text-sm leading-normal text-texto-2">
              {recem
                ? `Regra: matriz aberta menos de ${DIAS_RECEM_ABERTA} dias antes do 1º pagamento. ${taxaDeBase(m, n)} das empresas pagas com emendas Pix caem nesta regra.`
                : `Regra: despesa de campanha com data até o pagamento. ${taxaDeBase(m, n)} dos parlamentares com emenda Pix têm um caso assim.`}
            </p>
            <ul className="flex flex-col">
              {casos.map((i) => {
                const href = hrefCaso(i);
                const conteudo = (
                  <>
                    <span className="flex justify-between gap-2 text-base">
                      <strong className="font-semibold">{nomeLegivel(i.nome)}</strong>
                      <span className="whitespace-nowrap tabular-nums">{brlMi(i.recebido)}</span>
                    </span>
                    <span className="text-sm text-texto-2">
                      {i.tipo === "recem-aberta"
                        ? `Aberta ${plural(i.dias, "dia", "dias")} antes do 1º pagamento de ${enteDoIndicio(i)} (Receita, base de ${mesAno(i.abertura.baseMes)}).`
                        : `Nas despesas declaradas da campanha de ${i.eleicao}: ${brlMi(i.despesaCampanha)}.`}
                    </span>
                  </>
                );
                return (
                  <li key={`${i.emenda}-${i.cnpj}`} className="border-t border-atipico-borda first:border-t-0">
                    {href ? (
                      <a href={href} className="flex flex-col gap-0.5 py-2 text-foreground no-underline">
                        {conteudo}
                      </a>
                    ) : (
                      <span className="flex flex-col gap-0.5 py-2">{conteudo}</span>
                    )}
                  </li>
                );
              })}
            </ul>
            <Link
              href={recem ? "/metodologia#recem-aberta" : "/metodologia#ciclo-fechado"}
              className={`${LINK_AVISO} text-sm font-semibold`}
            >
              Como calculamos
            </Link>
          </section>
        );
      })}
      <div className="flex flex-wrap gap-x-4 border-t border-atipico-borda text-sm font-semibold">
        <Link href={contestar} className={LINK_AVISO}>
          Contestar
        </Link>
        <ArquivosUsados indicios={indicios} trilha={trilha} />
      </div>
    </div>
  );
}

function Chevron({ className = "group-open:rotate-180" }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      data-chevron
      className={`shrink-0 transition-transform ${className}`}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function Barra({ valor }: { valor: number }) {
  return (
    <span aria-hidden="true" className="block h-1.5 overflow-hidden rounded-[3px] bg-muted">
      <span className="block h-1.5 bg-primary" style={{ width: `${Math.min(100, valor)}%` }} />
    </span>
  );
}

/**
 * Toda emenda Pix aparece no Portal como "Encargos especiais" (é a função orçamentária da transferência,
 * não a área de aplicação): nesse caso a área sai da linha.
 */
function areaVisivel(funcao: string) {
  return !!funcao && !/^encargos especiais$/i.test(funcao.trim());
}

function LinhaEmenda({ emenda: e, trilha }: { emenda: EmendaTrilha; trilha: TrilhaCheia }) {
  const pctPago = pct(e.pago, e.transferido) ?? 0;
  const municipios = e.planos.length;
  const munic = municipios ? `${plural(municipios, "município", "municípios")}${e.uf ? ` (${e.uf})` : ""}` : "—";
  const resumo = municipios
    ? `${munic} · ${brlMi(e.transferido)} · ${pctPago}% pago`
    : "Sem plano de ação publicado no Transferegov";
  return (
    <details
      id={ancoraEmenda(e.codigo)}
      data-trilha-emenda={e.codigo}
      open={e.indicios > 0}
      className="group scroll-mt-4 rounded-[10px] border border-borda-suave sm:rounded-none sm:border-0 sm:border-t sm:open:bg-background"
    >
      <summary
        className={`${SUMMARY} flex min-h-14 items-center justify-between gap-2 px-3 py-2.5 sm:grid sm:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.4fr)_5.5rem] sm:gap-3 sm:px-4`}
      >
        <span className="flex min-w-0 flex-col gap-0.5">
          <strong className="font-semibold">
            {e.codigo}
            {areaVisivel(e.funcao) ? ` · ${e.funcao}` : ""}
          </strong>
          <span className="text-sm text-texto-2 sm:hidden">{resumo}</span>
          {e.indicios > 0 && (
            <span className="text-sm font-semibold text-atipico">{plural(e.indicios, "indício", "indícios")}</span>
          )}
        </span>
        <span className="hidden tabular-nums sm:inline">
          {municipios ? `${municipios}${e.uf ? ` (${e.uf})` : ""}` : "—"}
        </span>
        <span className="hidden text-right tabular-nums sm:inline">{municipios ? brlMi(e.transferido) : "—"}</span>
        <span className="hidden flex-col gap-1 sm:flex">
          {municipios ? (
            <>
              <span className="tabular-nums">
                {brlMi(e.pago)} · {pctPago}%
              </span>
              <Barra valor={pctPago} />
            </>
          ) : (
            <span className="text-sm text-muted-foreground">Sem plano no Transferegov</span>
          )}
        </span>
        <span className="flex items-center justify-center gap-1.5 text-sm font-semibold sm:min-h-11 sm:rounded-[8px] sm:border sm:border-linha sm:bg-superficie">
          <span className="hidden sm:inline sm:group-open:hidden">Abrir</span>
          <span className="hidden sm:group-open:inline">Fechar</span>
          <Chevron />
        </span>
      </summary>
      <div className="flex flex-col gap-3 px-3 pb-3 sm:px-4 sm:pb-4">
        {municipios === 0 ? (
          <p className="text-sm text-muted-foreground">
            O Transferegov ainda não publicou plano de ação para esta emenda; não há pagamento a seguir. Valor reservado
            no Orçamento: {brlMi(e.empenhado)}.
          </p>
        ) : (
          <>
            <Elos emenda={e} />
            <Municipios emenda={e} trilha={trilha} />
          </>
        )}
      </div>
    </details>
  );
}

function Elos({ emenda: e }: { emenda: EmendaTrilha }) {
  const empresas = new Set(e.planos.flatMap((p) => p.recebedores.map((r) => r.cnpj))).size;
  const pf = e.planos.reduce((t, p) => t + p.pf.pagamentos, 0);
  const quem = [
    empresas ? plural(empresas, "empresa ou entidade", "empresas e entidades") : "",
    pf ? plural(pf, "pagamento a pessoa física", "pagamentos a pessoas físicas") : "",
  ]
    .filter(Boolean)
    .join(" e ");
  const card = "flex flex-col gap-0.5 rounded-[10px] border border-borda-suave bg-superficie px-3 py-2.5 text-base";
  return (
    <ol aria-label="Elos da trilha" className="grid grid-cols-1 gap-2 sm:grid-cols-3">
      <li className={card}>
        <span className="text-sm text-muted-foreground">1 · Reservado no Orçamento</span>
        <strong className="tabular-nums">{brlMi(e.empenhado)}</strong>
        <a href={PORTAL_EMENDAS} rel="noopener noreferrer" target="_blank" className="text-sm">
          Portal da Transparência
        </a>
      </li>
      <li className={card}>
        <span className="text-sm text-muted-foreground">
          2 · Transferido a {plural(e.planos.length, "município ou estado", "municípios ou estados")}
        </span>
        <strong className="tabular-nums">{brlMi(e.transferido)}</strong>
        <a
          href={`${API}/planos-acao-especiais?numero_emenda_parlamentar_plano_acao=${e.codigo}`}
          rel="noopener noreferrer"
          target="_blank"
          className="text-sm"
        >
          Transferegov · planos de ação
        </a>
      </li>
      <li className={card}>
        <span className="text-sm text-muted-foreground">3 · Pago pelos municípios</span>
        <strong className="tabular-nums">
          {e.pago > 0 ? `${brlCompacto(e.pago)}${quem ? ` a ${quem}` : ""}` : brlMi(0)}
        </strong>
        {e.saldo > 0 && (
          <span data-saldo-emenda className="text-sm text-muted-foreground tabular-nums">
            Sem pagamento registrado: {brlMi(e.saldo)}
          </span>
        )}
        <a
          href={`${API}/relatorios-gestao-documento-liquidacao-especiais`}
          rel="noopener noreferrer"
          target="_blank"
          className="text-sm"
        >
          Transferegov · pagamentos (base completa; por município abaixo)
        </a>
      </li>
    </ol>
  );
}

const GRADE_MUNICIPIO =
  "sm:grid sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_2.5rem] sm:items-center sm:gap-3";

function Municipios({ emenda: e, trilha }: { emenda: EmendaTrilha; trilha: TrilhaCheia }) {
  const pagos = e.planos.filter((p) => p.pago > 0);
  const semPagamento = e.planos.filter((p) => p.pago <= 0);
  const visiveis = pagos.slice(0, LIMITE_MUNICIPIOS);
  const outros = pagos.slice(LIMITE_MUNICIPIOS);
  const daEmenda = trilha.indicios.filter((i) => i.emenda === e.codigo);
  const planosComIndicio = new Set(daEmenda.map((i) => i.plano));
  const totalSem = semPagamento.reduce((t, p) => t + Math.round(p.valor * 100), 0) / 100;
  return (
    <div
      data-municipios
      role="group"
      aria-label={`Municípios da emenda ${e.codigo}`}
      className="overflow-hidden rounded-[10px] border border-borda-suave bg-superficie"
    >
      <div
        aria-hidden="true"
        className={`hidden border-b border-borda-suave px-3 py-2 text-sm font-semibold text-texto-2 ${GRADE_MUNICIPIO}`}
      >
        <span>Município ou estado</span>
        <span className="text-right">Recebeu</span>
        <span className="text-right">Pagou</span>
        <span>Recebedores</span>
        <span />
      </div>
      {visiveis.map((p) => (
        <Municipio
          key={p.id}
          emenda={e}
          plano={p}
          indicios={daEmenda}
          aberto={planosComIndicio.has(p.id)}
          trilha={trilha}
        />
      ))}
      {outros.length > 0 && (
        <details data-outros-municipios open={outros.some((p) => planosComIndicio.has(p.id))} className="group/outros">
          <summary
            className={`${SUMMARY} m-3 inline-flex min-h-11 items-center rounded-[8px] border border-linha bg-superficie px-3.5 text-sm font-semibold group-open/outros:hidden`}
          >
            Ver os outros {plural(outros.length, "município com pagamento", "municípios com pagamento")}
          </summary>
          {outros.map((p) => (
            <Municipio
              key={p.id}
              emenda={e}
              plano={p}
              indicios={daEmenda}
              aberto={planosComIndicio.has(p.id)}
              trilha={trilha}
            />
          ))}
        </details>
      )}
      {semPagamento.length > 0 && (
        <p data-sem-pagamento className="px-3 py-2.5 text-sm text-texto-2 tabular-nums">
          {plural(semPagamento.length, "município", "municípios")} sem pagamento registrado · {brlMi(totalSem)}
        </p>
      )}
    </div>
  );
}

function Municipio({
  emenda: e,
  plano: p,
  indicios,
  aberto,
  trilha,
}: {
  emenda: EmendaTrilha;
  plano: PlanoTrilha;
  indicios: Indicio[];
  aberto: boolean;
  trilha: TrilhaCheia;
}) {
  const comIndicio = p.recebedores.filter((r) => indicios.some((i) => i.cnpj === r.cnpj)).length;
  const nome = nomeMunicipio(p);
  return (
    <details
      id={ancoraMunicipio(e.codigo, p.id)}
      data-municipio={p.id}
      open={aberto}
      className="group/mun scroll-mt-4 border-b border-borda-suave"
    >
      <summary
        className={`${SUMMARY} flex min-h-11 flex-wrap items-center justify-between gap-x-2 gap-y-0.5 px-3 py-1.5 text-base ${GRADE_MUNICIPIO}`}
      >
        <span className="min-w-0 flex-1 font-semibold break-words">
          {nome}
          {p.ente.uf && (!e.uf || e.uf === "várias UFs") && (
            <span className="font-normal text-muted-foreground"> ({p.ente.uf})</span>
          )}
        </span>
        <span className="hidden text-right tabular-nums sm:inline">{brlMi(p.valor)}</span>
        {/* Celular: o valor vai para a linha de baixo, para o nome caber inteiro ao lado da seta. */}
        <span className="order-last basis-full text-sm whitespace-nowrap text-texto-2 tabular-nums sm:order-none sm:basis-auto sm:text-right sm:text-base sm:text-foreground">
          <span className="sm:hidden">pagou </span>
          {brlMi(p.pago)}
        </span>
        <span className="hidden text-sm text-texto-2 sm:inline">
          {p.recebedores.length + (p.pf.pagamentos ? 1 : 0)}
          {comIndicio > 0 && (
            <span className="font-semibold text-atipico"> · {plural(comIndicio, "indício", "indícios")}</span>
          )}
        </span>
        <span className="flex size-10 shrink-0 items-center justify-center rounded-[8px] border border-linha">
          <span className="sr-only">{`Recebedores de ${nome}`}</span>
          <Chevron className="group-open/mun:rotate-180" />
        </span>
      </summary>
      <Recebedores emenda={e} plano={p} indicios={indicios} trilha={trilha} />
    </details>
  );
}

/**
 * CNPJ-05, CNPJ-06, EDGE-05. `comBase`: cita o mês da base ao lado da data (celular); na tabela do desktop o
 * mês vai no cabeçalho da coluna e só aparece na célula quando difere do lote vigente.
 */
function abertura(r: RecebedorTrilha, receitaBase: string | null, comBase = false) {
  if (!receitaBase) return "—";
  if (!r.abertura) return `Data de abertura não encontrada na base da Receita de ${mesAno(receitaBase)}`;
  const d = dataBr(r.abertura.data);
  const notas = [
    ...(r.abertura.origem === "filial" ? ["data da filial; matriz não encontrada"] : []),
    ...(comBase || r.abertura.baseMes !== receitaBase ? [`base de ${mesAno(r.abertura.baseMes)}`] : []),
  ];
  return notas.length ? `${d} (${notas.join("; ")})` : d;
}

function Selos({ cnpj, indicios }: { cnpj: string; indicios: Indicio[] }) {
  const tipos = [...new Set(indicios.filter((i) => i.cnpj === cnpj).map((i) => i.tipo))];
  return tipos.map((t) => (
    <span
      key={t}
      data-selo={t}
      className="rounded-full border border-atipico-borda bg-atipico-fundo px-2 py-px text-sm font-semibold whitespace-nowrap text-atipico"
    >
      {t === "recem-aberta" ? "Indício: recém-aberta" : "Indício: também na campanha"}
    </span>
  ));
}

function Recebedores({
  emenda: e,
  plano: p,
  indicios,
  trilha,
}: {
  emenda: EmendaTrilha;
  plano: PlanoTrilha;
  indicios: Indicio[];
  trilha: TrilhaCheia;
}) {
  const pfTexto =
    p.pf.pagamentos > 0 ? plural(p.pf.pagamentos, "pagamento a pessoa física", "pagamentos a pessoas físicas") : null;
  return (
    <div id={ancoraRecebedores(e.codigo, p.id)} className="flex scroll-mt-24 flex-col gap-2 px-3 pb-3 sm:pl-6">
      <ul data-recebedores-cartoes className="flex flex-col sm:hidden">
        {p.recebedores.map((r) => (
          <li key={r.cnpj} className="flex flex-col gap-1 border-t border-borda-suave py-2">
            <span className="flex justify-between gap-2 text-base">
              <span className="min-w-0 break-words">{nomeLegivel(r.nome)}</span>
              <span className="whitespace-nowrap tabular-nums">{brlMi(r.valor)}</span>
            </span>
            <span className="flex flex-wrap gap-1.5">
              <Selos cnpj={r.cnpj} indicios={indicios} />
            </span>
            <span className="text-sm break-words text-muted-foreground tabular-nums">
              {formatarCnpj(r.cnpj)}
              {r.entePublico ? " · ente público" : ""}
              {trilha.receitaBase
                ? ` · ${r.abertura ? `aberta em ${abertura(r, trilha.receitaBase, true)}` : abertura(r, trilha.receitaBase)}`
                : ""}{" "}
              · 1º pagamento {dataBr(r.primeiroPagamento)}
            </span>
          </li>
        ))}
        {pfTexto && (
          <li data-pf className="flex justify-between gap-2 border-t border-borda-suave py-2 text-base">
            <span>{pfTexto}</span>
            <span className="tabular-nums">{brlMi(p.pf.valor)}</span>
          </li>
        )}
      </ul>
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full border-collapse text-sm">
          <caption className="sr-only">
            Quem {nomeMunicipio(p)} pagou com a emenda {e.codigo}
          </caption>
          <thead>
            <tr className="text-left text-muted-foreground">
              <th scope="col" className="py-1.5 pr-2 font-semibold">
                Pago a
              </th>
              <th scope="col" className="px-2 py-1.5 font-semibold">
                CNPJ
              </th>
              <th scope="col" className="px-2 py-1.5 font-semibold">
                Aberta em{trilha.receitaBase ? ` (base de ${mesAno(trilha.receitaBase)})` : ""}
              </th>
              <th scope="col" className="px-2 py-1.5 font-semibold">
                1º pagamento
              </th>
              <th scope="col" className="py-1.5 text-right font-semibold">
                Valor
              </th>
            </tr>
          </thead>
          <tbody>
            {p.recebedores.map((r) => (
              <tr key={r.cnpj} data-recebedor={r.cnpj} className="border-t border-borda-suave">
                <td className="py-2 pr-2">
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span>{nomeLegivel(r.nome)}</span>
                    <Selos cnpj={r.cnpj} indicios={indicios} />
                    {r.entePublico && <span className="text-muted-foreground">ente público</span>}
                  </span>
                </td>
                <td className="px-2 py-2 whitespace-nowrap text-muted-foreground tabular-nums">
                  {formatarCnpj(r.cnpj)}
                </td>
                <td data-abertura className="min-w-[7rem] px-2 py-2 text-muted-foreground tabular-nums">
                  {abertura(r, trilha.receitaBase)}
                </td>
                <td className="px-2 py-2 whitespace-nowrap text-muted-foreground tabular-nums">
                  {dataBr(r.primeiroPagamento)}
                </td>
                <td className="py-2 text-right whitespace-nowrap tabular-nums">{brlMi(r.valor)}</td>
              </tr>
            ))}
            {pfTexto && (
              <tr data-pf className="border-t border-borda-suave text-texto-2">
                <td className="py-2 pr-2">{pfTexto}</td>
                <td colSpan={3} className="px-2 py-2">
                  somados, sem nome
                </td>
                <td className="py-2 text-right tabular-nums">{brlMi(p.pf.valor)}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <a
        href={`${API}/relatorios-gestao-novos-especiais?id_plano_acao=${p.id}`}
        rel="noopener noreferrer"
        target="_blank"
        className="text-sm text-muted-foreground"
      >
        Fonte: Transferegov, plano {p.codigoPlano}
      </a>
    </div>
  );
}

/** Lateral do artboard; no celular vira um <details> no fim da seção. */
function ComoSeguimos({ className = "" }: { className?: string }) {
  return (
    <details className={`border-t border-borda-suave pt-1 text-sm leading-normal text-texto-2 ${className}`}>
      <summary className={`${SUMMARY} flex min-h-11 items-center text-base font-semibold text-foreground`}>
        Como seguimos o dinheiro
      </summary>
      <p className="mb-2">
        Emenda (Portal da Transparência), município que recebeu e quem ele pagou (Transferegov, pelo código da emenda e
        pelo CNPJ). Abertura da empresa: Receita. Campanha: TSE. Pessoas físicas aparecem somadas, sem nome.
      </p>
      <p>Não mostramos sócios, doadores pessoa física, contratos do PNCP nem emendas de convênio.</p>
    </details>
  );
}

/** Blocos da lateral do perfil no desktop (SeguirDinheiroEnxuto.dc.html, aside). */
export function LateralTrilha() {
  return (
    <>
      <section aria-labelledby="como-seguimos-titulo" className={`${CARTAO} hidden gap-2.5 sm:p-5 lg:flex`}>
        <h2 id="como-seguimos-titulo" className="font-heading text-lg font-bold">
          Como seguimos o dinheiro
        </h2>
        <ol className="flex list-decimal flex-col gap-1.5 pl-5 text-sm leading-normal text-texto-2">
          <li>Emenda: Portal da Transparência.</li>
          <li>Município que recebeu: Transferegov, pelo código da emenda.</li>
          <li>Quem o município pagou: Transferegov, pelo CNPJ.</li>
          <li>Abertura da empresa: Receita. Campanha: TSE.</li>
        </ol>
        <p className="text-sm leading-normal text-muted-foreground">
          Cada regra só usa dados com data até o pagamento.{" "}
          <Link href="/metodologia#trilha">Metodologia {METODOLOGIA_VERSAO}</Link>
        </p>
      </section>
      <section aria-labelledby="nao-mostramos-titulo" className={`${CARTAO} hidden gap-2.5 sm:p-5 lg:flex`}>
        <h2 id="nao-mostramos-titulo" className="font-heading text-lg font-bold">
          O que não mostramos
        </h2>
        <p className="text-sm leading-normal text-texto-2">
          Sócios das empresas, doadores pessoa física, contratos do PNCP e emendas de convênio.
        </p>
      </section>
    </>
  );
}
