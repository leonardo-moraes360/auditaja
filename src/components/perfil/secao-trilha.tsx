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
import { brlMi } from "@/lib/emendas";
import { brlCompacto, dataBr, dataHoraBr, pct } from "@/lib/format";
import { METODOLOGIA_VERSAO } from "@/lib/metrics";
import { formatarCnpj } from "@/lib/privacy";
import { DIAS_RECEM_ABERTA, nomeLegivel, taxaDeBase } from "@/lib/trilha";

/**
 * "Para onde foi o dinheiro das emendas Pix" (artboards SeguirDinheiro e SeguirDinheiroMobile).
 * R4: os avisos dizem só "indício", com regra, limiar, dados comparados, taxa de base, fontes e a
 * frase de não imputação. Terceiros (empresas) só aparecem no perfil de quem indicou a emenda.
 */

const CARTAO = "flex scroll-mt-4 flex-col rounded-[14px] border bg-superficie p-4 sm:rounded-[16px]";
const H2 = "font-heading text-lg font-bold leading-[1.3] sm:text-[1.375rem]";
const API = "https://api-publica.transferegov.gestao.gov.br/especiais";
const PORTAL_EMENDAS = "https://portaldatransparencia.gov.br/download-de-dados/emendas-parlamentares";
const PAGINA_RECEITA = "https://dados.gov.br/dados/conjuntos-dados/cadastro-nacional-da-pessoa-juridica---cnpj";
/** Trilhas exibidas antes de "Mostrar as outras N emendas Pix". */
export const LIMITE_TRILHAS = 3;
const LINK_AVISO = "inline-flex min-h-11 items-center text-atipico sm:min-h-6";

function ente(p: PlanoTrilha) {
  const nome = nomeLegivel(p.ente.nome) || "Ente não informado";
  return p.ente.uf ? `${nome} (${p.ente.uf})` : nome;
}

/** "2025-02" → "02/2025". */
const mesAno = (iso: string | null | undefined) => (iso ? `${iso.slice(5, 7)}/${iso.slice(0, 4)}` : "");

function plural(n: number, um: string, varios: string) {
  return `${n.toLocaleString("pt-BR")} ${n === 1 ? um : varios}`;
}

/** Quem pagou: "4 empresas e 3 pessoas". */
function recebedoresTexto(empresas: number, pessoas: number) {
  const partes = [];
  if (empresas) partes.push(plural(empresas, "empresa", "empresas"));
  if (pessoas) partes.push(plural(pessoas, "pessoa", "pessoas"));
  return partes.join(" e ");
}

export type QuemIndicou = "deste deputado" | "desta deputada" | "deste senador" | "desta senadora";

export function quemIndicou(casa: "camara" | "senado", sexo: string | null): QuemIndicou {
  if (casa === "senado") return sexo === "F" ? "desta senadora" : "deste senador";
  return sexo === "F" ? "desta deputada" : "deste deputado";
}

const ancora = (codigo: string) => `trilha-${codigo}`;

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
      <div className="flex flex-col gap-2">
        <h2 id="trilha-titulo" className={H2}>
          Para onde foi o dinheiro das emendas Pix
        </h2>
        <p className="hidden text-sm leading-normal text-texto-2 sm:block">
          Na transferência especial (“emenda Pix”) o dinheiro vai para o caixa do município ou do estado, que depois
          paga empresas e entidades. O município informa esses pagamentos no Transferegov. Aqui ligamos cada emenda aos
          pagamentos feitos com ela, pelo código da emenda e pelo CNPJ de quem recebeu. Nunca pelo nome.
        </p>
        <p className="text-sm leading-normal text-texto-2 sm:hidden">
          O dinheiro vai para o caixa do município, que depois paga empresas e entidades. Ligamos cada emenda aos
          pagamentos pelo código da emenda e pelo CNPJ, nunca pelo nome.
        </p>
      </div>

      {trilha.vazio ? (
        <p data-trilha-vazio className="text-muted-foreground">
          Este parlamentar não indicou transferências especiais no período
        </p>
      ) : (
        <ConteudoTrilha trilha={trilha} quem={quem} contestar={contestar} />
      )}

      <ComoSeguimos className="lg:hidden" />

      <div className="flex flex-col gap-1 border-t border-borda-suave pt-2.5 text-xs text-muted-foreground sm:flex-row sm:flex-wrap sm:justify-between sm:gap-x-4 sm:gap-y-2 sm:pt-3">
        <span className="hidden sm:inline">
          Fontes: Transferegov (emendas Pix, API pública) · Receita Federal (Estabelecimentos
          {trilha.receitaBase ? `, base de ${mesAno(trilha.receitaBase)}` : ""}, importado à mão) · TSE (prestação de
          contas{trilha.eleicao ? ` ${trilha.eleicao}` : ""}) · Portal da Transparência (emendas)
        </span>
        <span className="sm:hidden">
          Fontes: Transferegov · Receita Federal{trilha.receitaBase ? ` (base de ${mesAno(trilha.receitaBase)})` : ""} ·
          TSE{trilha.eleicao ? ` (contas ${trilha.eleicao})` : ""} · Portal da Transparência
        </span>
        <span className="flex gap-4 text-sm sm:text-xs [&_a]:inline-flex [&_a]:min-h-11 [&_a]:items-center sm:[&_a]:min-h-0">
          {!trilha.vazio && (
            <a href={`/parlamentares/${parlamentarId}/trilha.csv`} download>
              <span className="hidden sm:inline">Baixar CSV da trilha</span>
              <span className="sm:hidden">Baixar CSV</span>
            </a>
          )}
          <Link href={contestar}>Contestar</Link>
        </span>
      </div>
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
}: {
  titulo: string;
  tituloCurto?: string;
  valor: string;
  detalhe: string;
  detalheCurto?: string;
  progresso?: number | null;
  className?: string;
}) {
  return (
    <div
      data-indicador
      className={`flex flex-col gap-1 rounded-[10px] bg-background p-3 sm:gap-1.5 sm:rounded-[12px] sm:p-4 ${className}`}
    >
      <p className="text-xs text-muted-foreground sm:text-sm">
        <span className="hidden sm:inline">{titulo}</span>
        <span className="sm:hidden">{tituloCurto ?? titulo}</span>
      </p>
      <p className="font-heading text-xl font-bold sm:text-[1.625rem]">{valor}</p>
      {progresso != null && (
        <div
          className="hidden h-2 overflow-hidden rounded bg-border sm:block"
          role="img"
          aria-label={`${progresso}% do valor transferido tem pagamento informado`}
        >
          <div className="h-2 bg-primary" style={{ width: `${Math.min(100, progresso)}%` }} />
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        <span className="hidden sm:inline">{detalhe}</span>
        <span className="sm:hidden">{detalheCurto ?? detalhe}</span>
      </p>
    </div>
  );
}

function ConteudoTrilha({ trilha, quem, contestar }: { trilha: TrilhaCheia; quem: QuemIndicou; contestar: string }) {
  const { totais, indicios, emendas } = trilha;
  const pctPago = pct(totais.pago, totais.transferido);
  const recem = indicios.filter((i) => i.tipo === "recem-aberta").length;
  const ciclos = indicios.length - recem;
  const visiveis = emendas.slice(0, LIMITE_TRILHAS);
  const resto = emendas.slice(LIMITE_TRILHAS);
  return (
    <>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-[repeat(auto-fit,minmax(200px,1fr))] sm:gap-3">
        <Indicador
          titulo="Transferido por emendas Pix"
          tituloCurto="Transferido"
          valor={brlMi(totais.transferido)}
          detalhe={`${plural(totais.emendas, "emenda", "emendas")} para ${plural(totais.entes, "município ou estado", "municípios ou estados")}`}
          detalheCurto={plural(totais.emendas, "emenda", "emendas")}
        />
        <Indicador
          titulo="Pagamentos informados pelos municípios"
          tituloCurto="Pagamento informado"
          valor={brlMi(totais.pago)}
          progresso={pctPago}
          detalhe={`${pctPago ?? 0}% do transferido · ${plural(totais.recebedoresPj, "empresa ou entidade", "empresas e entidades")}`}
          detalheCurto={`${pctPago ?? 0}% · ${plural(totais.recebedoresPj, "recebedor", "recebedores")}`}
        />
        <Indicador
          className="hidden sm:flex"
          titulo="Indícios encontrados"
          valor={String(indicios.length)}
          detalhe={
            indicios.length
              ? [
                  recem && plural(recem, "empresa recém-aberta", "empresas recém-abertas"),
                  ciclos && `${plural(ciclos, "ciclo fechado", "ciclos fechados")} com a campanha`,
                ]
                  .filter(Boolean)
                  .join(" · ")
              : "Nenhum pelas regras da metodologia"
          }
        />
      </div>

      {indicios.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="sr-only text-base font-bold sm:not-sr-only">Indícios</h3>
          {indicios.map((i) => (
            <AvisoIndicio
              key={`${i.tipo}-${i.emenda}-${i.cnpj}`}
              indicio={i}
              trilha={trilha}
              quem={quem}
              contestar={contestar}
            />
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3">
        <h3 className="sr-only text-base font-bold sm:not-sr-only">Trilha por emenda</h3>
        {visiveis.map((e, i) => (
          <TrilhaEmenda key={e.codigo} emenda={e} aberta={i === 0 || e.indicios > 0} receitaBase={trilha.receitaBase} />
        ))}
        {resto.length > 0 && (
          <details data-outras-emendas className="group flex flex-col gap-3">
            <summary className="inline-flex min-h-11 cursor-pointer items-center self-start rounded-[8px] border border-linha bg-superficie px-3.5 text-sm text-texto-2 group-open:mb-3">
              <span className="hidden sm:inline">
                Mostrar as outras {plural(resto.length, "emenda Pix", "emendas Pix")}
              </span>
              <span className="sm:hidden">Ver as outras {plural(resto.length, "emenda Pix", "emendas Pix")}</span>
            </summary>
            <div className="flex flex-col gap-3">
              {resto.map((e) => (
                <TrilhaEmenda key={e.codigo} emenda={e} aberta={false} receitaBase={trilha.receitaBase} />
              ))}
            </div>
          </details>
        )}
      </div>
    </>
  );
}

function Icone({ tipo }: { tipo: Indicio["tipo"] }) {
  return (
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
      {tipo === "recem-aberta" ? (
        <>
          <circle cx="12" cy="12" r="10" />
          <path d="M12 7v6" />
          <path d="M12 17h.01" />
        </>
      ) : (
        <>
          <path d="M21 12a9 9 0 1 1-3-6.7" />
          <path d="M21 4v5h-5" />
        </>
      )}
    </svg>
  );
}

function sha(c: ColetaCitada) {
  return `${c.sha256.slice(0, 4)}…${c.sha256.slice(-4)}`;
}

/** LING-09: cada arquivo de cada elo com data, SHA-256 e link para a coleta. */
function rotuloColeta(c: ColetaCitada): { rotulo: string; curto: string; href: string } {
  const base = /base de (\d{2}\/\d{4}|\d{2}\/\d{2}\/\d{4})/.exec(c.observacao ?? "")?.[1];
  const quando = dataHoraBr(c.coletado_em).slice(0, 10);
  switch (c.fonte) {
    case "receita_estabelecimentos":
      return {
        rotulo: `Receita Federal, Estabelecimentos, base de ${base ?? "mês não informado"}`,
        curto: `Receita, base de ${base ?? "?"}`,
        href: PAGINA_RECEITA,
      };
    case "transferegov_especiais":
      return {
        rotulo: `Transferegov, emendas Pix, coletado em ${quando}`,
        curto: `Transferegov, coletado em ${quando}`,
        href: c.url,
      };
    case "tse_prestacao_contas": {
      const ano = /candidatos_(\d{4})/.exec(c.url)?.[1] ?? "";
      return { rotulo: `TSE, prestação de contas de candidatos ${ano}`, curto: `TSE, contas ${ano}`, href: c.url };
    }
    case "cgu_emendas":
      return {
        rotulo: `Portal da Transparência, emendas, coletado em ${quando}`,
        curto: `Portal, coletado em ${quando}`,
        href: PORTAL_EMENDAS,
      };
    default:
      return { rotulo: `${c.fonte}, coletado em ${quando}`, curto: c.fonte, href: c.url };
  }
}

/** Fontes na ordem do texto do aviso: o elo que caracteriza o sinal primeiro, o Transferegov depois. */
const ORDEM_FONTE = ["receita_estabelecimentos", "tse_prestacao_contas", "transferegov_especiais", "cgu_emendas"];

function DadosUsados({ coletas }: { coletas: ColetaCitada[] }) {
  const cs = coletas.toSorted((a, b) => ORDEM_FONTE.indexOf(a.fonte) - ORDEM_FONTE.indexOf(b.fonte));
  const completo = (
    <>
      Dados usados:{" "}
      {cs.map((c, i) => {
        const r = rotuloColeta(c);
        return (
          <span key={c.id}>
            {i > 0 && " · "}
            <a href={r.href} rel="noopener noreferrer" target="_blank" className="text-muted-foreground underline">
              {r.rotulo}
            </a>{" "}
            (SHA-256 <span title={c.sha256}>{sha(c)}</span>)
          </span>
        );
      })}
    </>
  );
  return (
    <>
      <span data-dados-usados className="hidden text-xs leading-normal text-muted-foreground sm:inline">
        {completo}
      </span>
      <details className="text-xs leading-[1.4] text-muted-foreground sm:hidden">
        <summary className="inline-flex min-h-11 cursor-pointer items-center">
          {cs.map((c) => rotuloColeta(c).curto).join(" · ")} ·&nbsp;
          <span className="text-link underline">ver arquivos e SHA-256</span>
        </summary>
        <p>{completo}</p>
      </details>
    </>
  );
}

function LinksAviso({ indicio, contestar }: { indicio: Indicio; contestar: string }) {
  const metodologia = indicio.tipo === "recem-aberta" ? "/metodologia#recem-aberta" : "/metodologia#ciclo-fechado";
  const verTrilha = !(indicio.tipo === "ciclo-fechado" && indicio.direto);
  return (
    <div className="flex flex-col text-sm font-semibold sm:flex-row sm:flex-wrap sm:gap-4">
      {verTrilha && (
        <a href={`#${ancora(indicio.emenda)}`} className={LINK_AVISO}>
          Ver a trilha
        </a>
      )}
      <Link href={metodologia} className={LINK_AVISO}>
        <span className="hidden sm:inline">Como calculamos (metodologia {METODOLOGIA_VERSAO})</span>
        <span className="sm:hidden">Como calculamos</span>
      </Link>
      <Link href={contestar} className={LINK_AVISO}>
        Contestar
      </Link>
    </div>
  );
}

function AvisoIndicio({
  indicio,
  trilha,
  quem,
  contestar,
}: {
  indicio: Indicio;
  trilha: TrilhaCheia;
  quem: QuemIndicou;
  contestar: string;
}) {
  const coletas = indicio.coletas.map((id) => trilha.coletas[id]).filter(Boolean);
  return (
    <div
      data-indicio={indicio.tipo}
      className="flex items-start gap-3.5 rounded-[10px] border border-atipico-borda bg-atipico-fundo p-3 sm:rounded-[12px] sm:px-[18px] sm:py-4"
    >
      <Icone tipo={indicio.tipo} />
      <div className="flex min-w-0 flex-col gap-2">
        {indicio.tipo === "recem-aberta" ? (
          <CorpoRecemAberta i={indicio} taxa={trilha.taxas.recemAberta} />
        ) : (
          <CorpoCiclo i={indicio} taxa={trilha.taxas.ciclo} quem={quem} />
        )}
        <LinksAviso indicio={indicio} contestar={contestar} />
        <DadosUsados coletas={coletas} />
      </div>
    </div>
  );
}

function Titulo({ rotulo, desktop, celular }: { rotulo: string; desktop: string; celular: string }) {
  return (
    <>
      <span className="text-[0.6875rem] font-bold tracking-[0.04em] text-atipico uppercase sm:hidden">{rotulo}</span>
      <h4 className="text-[0.9375rem] leading-[1.35] font-bold text-atipico-titulo">
        <span className="hidden sm:inline">{desktop}</span>
        <span className="sm:hidden">{celular}</span>
      </h4>
    </>
  );
}

const NAO_PROVA = "Indício não é prova de irregularidade.";

function CorpoRecemAberta({ i, taxa }: { i: IndicioRecemAberta; taxa: [number, number] }) {
  const nome = nomeLegivel(i.nome);
  const filial = i.abertura.origem === "filial" ? " (data da filial; matriz não encontrada)" : "";
  const dias = plural(i.dias, "dia", "dias");
  return (
    <>
      <Titulo
        rotulo="Indício · empresa recém-aberta"
        desktop={`Indício: empresa aberta ${dias} antes do primeiro pagamento`}
        celular={`Aberta ${dias} antes do primeiro pagamento`}
      />
      <p className="text-sm leading-normal text-texto-2">
        <span className="hidden sm:inline">
          {nome} ({formatarCnpj(i.cnpj)}) começou a funcionar em {dataBr(i.abertura.data)}
          {filial}, segundo a Receita Federal (base de {mesAno(i.abertura.baseMes)}). Recebeu o primeiro pagamento
          ligado à emenda {i.emenda} em {dataBr(i.primeiroPagamento)}, pago por{" "}
          {nomeLegivel(i.ente) || "ente não informado"}. Ao todo, essa emenda pagou {brlMi(i.recebido)} a ela.
        </span>
        <span className="sm:hidden">
          {nome} abriu em {dataBr(i.abertura.data)}
          {filial} (Receita, base de {mesAno(i.abertura.baseMes)}) e recebeu o primeiro pagamento da emenda {i.emenda}{" "}
          em {dataBr(i.primeiroPagamento)}, pago por {nomeLegivel(i.ente) || "ente não informado"}. Total:{" "}
          {brlMi(i.recebido)}.
        </span>
      </p>
      <p className="text-sm leading-normal text-texto-2">
        <span className="hidden sm:inline">
          <strong>Regra:</strong> a matriz da empresa abriu menos de {DIAS_RECEM_ABERTA} dias antes do primeiro
          pagamento ligado à emenda. <strong>Para comparar:</strong> {taxaDeBase(taxa[0], taxa[1])} empresas pagas com
          emendas Pix na base, com data de abertura conhecida, caem na mesma regra.
        </span>
        <span className="sm:hidden">
          <strong>Regra:</strong> matriz aberta menos de {DIAS_RECEM_ABERTA} dias antes. <strong>Para comparar:</strong>{" "}
          {taxaDeBase(taxa[0], taxa[1])} empresas pagas com emendas Pix.
        </span>
      </p>
      <p className="text-sm leading-normal text-muted-foreground">
        {NAO_PROVA}
        <span className="hidden sm:inline">
          {" "}
          Empresa nova pode ser legítima, por exemplo quando é a única do ramo na região. Essa e outras causas
          conhecidas de falso positivo estão na metodologia.
        </span>
      </p>
    </>
  );
}

function periodoMeses(a: string, b: string) {
  return mesAno(a) === mesAno(b) ? `em ${mesAno(a)}` : `entre ${mesAno(a)} e ${mesAno(b)}`;
}

function CorpoCiclo({ i, taxa, quem }: { i: IndicioCiclo; taxa: [number, number]; quem: QuemIndicou }) {
  const nome = nomeLegivel(i.nome);
  const pagador = i.direto ? "do governo federal, em pagamento direto" : `do ${nomeLegivel(i.ente) || "ente"}`;
  return (
    <>
      <Titulo
        rotulo="Indício · ciclo fechado"
        desktop="Indício: ciclo fechado entre emenda e campanha"
        celular="Empresa da emenda também vendeu para a campanha"
      />
      <p className="text-sm leading-normal text-texto-2">
        <span className="hidden sm:inline">
          {nome} ({formatarCnpj(i.cnpj)}) recebeu {brlMi(i.recebido)} {pagador} com a emenda {i.emenda},{" "}
          {periodoMeses(i.primeiroRecebimento, i.ultimoRecebimento)}. A mesma empresa aparece como fornecedora da
          campanha de {i.eleicao} {quem}, com {brlMi(i.despesaCampanha)} em despesas declaradas ao TSE{" "}
          {periodoMeses(i.primeiraDespesa, i.ultimaDespesa)}.
        </span>
        <span className="sm:hidden">
          {nome} recebeu {brlMi(i.recebido)} {i.direto ? "do governo federal" : `do ${nomeLegivel(i.ente) || "ente"}`}{" "}
          com a emenda {i.emenda} e aparece com {brlMi(i.despesaCampanha)} nas despesas da campanha de {i.eleicao}{" "}
          {quem} (TSE).
        </span>
      </p>
      <p className="text-sm leading-normal text-texto-2">
        <span className="hidden sm:inline">
          <strong>Regra:</strong> o mesmo CNPJ recebeu dinheiro da emenda e vendeu para a campanha que elegeu quem
          indicou a emenda, com a despesa de campanha datada até o pagamento. <strong>Para comparar:</strong>{" "}
        </span>
        <strong className="sm:hidden">Para comparar: </strong>
        {taxaDeBase(taxa[0], taxa[1])} parlamentares com emenda Pix na base têm ao menos um caso assim.
      </p>
      <p className="text-sm leading-normal text-muted-foreground">
        {NAO_PROVA}{" "}
        <span className="hidden sm:inline">
          Gráficas e serviços de comunicação atendem campanhas e prefeituras com frequência, sobretudo em cidades
          pequenas.
        </span>
        <span className="sm:hidden">Gráficas atendem campanhas e prefeituras com frequência.</span>
      </p>
    </>
  );
}

function resumoEmenda(e: EmendaTrilha) {
  if (!e.planos.length) return "Sem plano de ação publicado no Transferegov";
  const entes = [...new Set(e.planos.map(ente))].join(", ");
  const empresas = new Set(e.planos.flatMap((p) => p.recebedores.map((r) => r.cnpj))).size;
  const pago =
    e.pago > 0
      ? `${brlMi(e.pago)} pagos${empresas ? ` a ${plural(empresas, "empresa", "empresas")}` : ""}`
      : "sem pagamento registrado";
  const ind = e.indicios ? ` · ${plural(e.indicios, "indício", "indícios")}` : "";
  return `${entes} · ${brlMi(e.transferido)} transferidos · ${pago}${ind}`;
}

function TrilhaEmenda({
  emenda: e,
  aberta,
  receitaBase,
}: {
  emenda: EmendaTrilha;
  aberta: boolean;
  receitaBase: string | null;
}) {
  return (
    <details
      id={ancora(e.codigo)}
      data-trilha-emenda={e.codigo}
      open={aberta}
      className="group scroll-mt-4 rounded-[10px] border border-borda-suave p-3 sm:rounded-[12px] sm:p-4"
    >
      <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-x-4 gap-y-2 [&::-webkit-details-marker]:hidden">
        <span className="flex min-w-0 flex-col gap-0.5 sm:gap-1">
          <h4 className="text-[0.9375rem] font-bold">
            Emenda {e.codigo} · {e.funcao}
          </h4>
          <span className="text-xs text-muted-foreground group-open:hidden sm:text-sm">{resumoEmenda(e)}</span>
          {e.mesTransferencia && (
            <span className="hidden text-xs text-muted-foreground group-open:inline sm:text-sm">
              Transferido em {mesAno(e.mesTransferencia)}
            </span>
          )}
        </span>
        <span
          aria-hidden="true"
          className="inline-flex min-h-11 items-center rounded-[8px] border border-linha bg-superficie px-3.5 text-sm text-texto-2 group-open:hidden"
        >
          Ver a trilha
        </span>
      </summary>
      <div className="mt-3.5 flex flex-col gap-3.5">
        {e.planos.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            O Transferegov ainda não publicou plano de ação para esta emenda; não há pagamento a seguir. Valor reservado
            no Orçamento: {brlMi(e.empenhado)}.
          </p>
        ) : (
          e.planos.map((p) => <PlanoEmenda key={p.id} emenda={e} plano={p} receitaBase={receitaBase} />)
        )}
      </div>
    </details>
  );
}

function Seta() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="hidden shrink-0 self-center text-borda-campo sm:block"
    >
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </svg>
  );
}

function Elo({
  n,
  rotulo,
  valor,
  href,
  fonte,
  fonteCurta,
}: {
  n: number;
  rotulo: string;
  valor: string;
  href: string;
  fonte: string;
  fonteCurta: string;
}) {
  return (
    <li className="flex justify-between gap-2 rounded-[8px] bg-background p-2.5 text-[0.8125rem] sm:flex-[1_1_160px] sm:flex-col sm:justify-start sm:gap-1 sm:rounded-[10px] sm:p-3">
      <span className="flex flex-col gap-0.5 sm:gap-1">
        <span className="text-xs text-muted-foreground">
          {n} · {rotulo}
        </span>
        <strong className="text-sm">{valor}</strong>
      </span>
      <a
        href={href}
        rel="noopener noreferrer"
        target="_blank"
        className="inline-flex min-h-11 items-center self-center text-xs sm:min-h-0 sm:self-start"
      >
        <span className="hidden sm:inline">{fonte}</span>
        <span className="sm:hidden">{fonteCurta}</span>
      </a>
    </li>
  );
}

/**
 * CNPJ-05, CNPJ-06, EDGE-05. `comBase`: cita o mês da base ao lado da data (celular); na tabela do desktop o
 * mês vai no cabeçalho da coluna e só aparece na célula quando difere do lote vigente.
 */
function abertura(r: RecebedorTrilha, receitaBase: string | null, comBase: boolean) {
  if (!r.abertura)
    return receitaBase
      ? `Data de abertura não encontrada na base da Receita de ${mesAno(receitaBase)}`
      : "Data de abertura ainda não importada da Receita";
  const notas = [
    ...(r.abertura.origem === "filial" ? ["data da filial; matriz não encontrada"] : []),
    ...(comBase || r.abertura.baseMes !== receitaBase ? [`base de ${mesAno(r.abertura.baseMes)}`] : []),
  ];
  const d = dataBr(r.abertura.data);
  return notas.length ? `${d} (${notas.join("; ")})` : d;
}

function SeloRecem() {
  return (
    <span className="rounded-full border border-atipico-borda bg-atipico-fundo px-2 py-[3px] text-xs font-semibold whitespace-nowrap text-atipico">
      Indício: recém-aberta
    </span>
  );
}

function PlanoEmenda({
  emenda: e,
  plano: p,
  receitaBase,
}: {
  emenda: EmendaTrilha;
  plano: PlanoTrilha;
  receitaBase: string | null;
}) {
  const pagos = recebedoresTexto(p.recebedores.length, p.pf.pagamentos);
  return (
    <>
      <ol
        aria-label="Elos da trilha"
        className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:items-stretch sm:gap-2"
      >
        <Elo
          n={1}
          rotulo="Emenda"
          valor={brlMi(e.empenhado)}
          href={PORTAL_EMENDAS}
          fonte="Portal da Transparência"
          fonteCurta="Portal"
        />
        <Seta />
        <Elo
          n={2}
          rotulo="Quem recebeu"
          valor={ente(p)}
          href={`${API}/planos-acao-especiais?id_plano_acao=${p.id}`}
          fonte="Transferegov · plano de ação"
          fonteCurta="Transferegov"
        />
        <Seta />
        <Elo
          n={3}
          rotulo="Quem o município pagou"
          valor={p.pago > 0 ? `${brlCompacto(p.pago)}${pagos ? ` a ${pagos}` : ""}` : "Sem pagamento registrado"}
          href={`${API}/relatorios-gestao-novos-especiais?id_plano_acao=${p.id}`}
          fonte="Transferegov · pagamentos"
          fonteCurta="Transferegov"
        />
      </ol>

      {/* Celular: uma linha por recebedor, com o valor à vista. */}
      <ul data-recebedores-cartoes className="flex flex-col sm:hidden">
        {p.recebedores.map((r) => (
          <li key={r.cnpj} className="flex flex-col gap-1 border-t border-borda-suave py-2.5">
            <span className="flex justify-between gap-2 text-sm">
              <span className="min-w-0 font-semibold break-words">{nomeLegivel(r.nome)}</span>
              <span className="whitespace-nowrap tabular-nums">{brlMi(r.valor)}</span>
            </span>
            {r.recemAberta?.indicio && (
              <span className="self-start">
                <SeloRecem />
              </span>
            )}
            <span className="text-xs break-words text-muted-foreground tabular-nums">
              {formatarCnpj(r.cnpj)}
              {r.entePublico ? " · ente público" : ""} ·{" "}
              {r.abertura ? `abriu em ${abertura(r, receitaBase, true)}` : abertura(r, receitaBase, true)} · 1º
              pagamento {dataBr(r.primeiroPagamento)}
            </span>
          </li>
        ))}
        {p.pf.pagamentos > 0 && (
          <li className="flex justify-between gap-2 border-t border-borda-suave py-2.5 text-sm">
            <span>Pessoas físicas ({p.pf.pagamentos})</span>
            <span className="tabular-nums">{brlMi(p.pf.valor)}</span>
          </li>
        )}
        {p.saldo > 0 && (
          <li
            data-saldo
            className="flex justify-between gap-2 border-t border-linha py-2.5 text-[0.8125rem] text-muted-foreground"
          >
            <span>Sem pagamento registrado:</span>
            <span className="tabular-nums">{brlMi(p.saldo)}</span>
          </li>
        )}
      </ul>

      <div
        className="hidden overflow-x-auto sm:block"
        tabIndex={0}
        role="region"
        aria-label={`Pagamentos da emenda ${e.codigo}`}
      >
        <table className="w-full border-collapse text-[0.8125rem]">
          <thead>
            <tr className="text-left text-muted-foreground">
              <th scope="col" className="py-1.5 pr-2 font-semibold">
                Pago pelo município a
              </th>
              <th scope="col" className="px-2 py-1.5 font-semibold">
                CNPJ
              </th>
              <th scope="col" className="px-2 py-1.5 font-semibold">
                Abertura da matriz{receitaBase ? ` (base de ${mesAno(receitaBase)})` : ""}
              </th>
              <th scope="col" className="px-2 py-1.5 font-semibold">
                1º pagamento
              </th>
              <th scope="col" className="py-1.5 text-right font-semibold">
                Recebido
              </th>
            </tr>
          </thead>
          <tbody>
            {p.recebedores.map((r) => (
              <tr key={r.cnpj} data-recebedor={r.cnpj} className="border-t border-borda-suave">
                <td className="py-2 pr-2">
                  <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
                    <span>{nomeLegivel(r.nome)}</span>
                    {r.recemAberta?.indicio && <SeloRecem />}
                    {r.entePublico && <span className="text-xs text-muted-foreground">ente público</span>}
                  </span>
                </td>
                <td className="px-2 py-2 whitespace-nowrap text-muted-foreground tabular-nums">
                  {formatarCnpj(r.cnpj)}
                </td>
                <td
                  data-abertura
                  className={`px-2 py-2 text-muted-foreground ${r.abertura?.origem === "matriz" && r.abertura.baseMes === receitaBase ? "whitespace-nowrap" : "min-w-[9rem]"}`}
                >
                  {abertura(r, receitaBase, false)}
                </td>
                <td className="px-2 py-2 whitespace-nowrap text-muted-foreground">{dataBr(r.primeiroPagamento)}</td>
                <td className="py-2 text-right whitespace-nowrap tabular-nums">{brlMi(r.valor)}</td>
              </tr>
            ))}
            {p.pf.pagamentos > 0 && (
              <tr data-pf className="border-t border-borda-suave">
                <td className="py-2 pr-2">Pessoas físicas ({p.pf.pagamentos})</td>
                <td className="px-2 py-2 text-muted-foreground">—</td>
                <td className="px-2 py-2 text-muted-foreground">—</td>
                <td className="px-2 py-2 text-muted-foreground">—</td>
                <td className="py-2 text-right tabular-nums">{brlMi(p.pf.valor)}</td>
              </tr>
            )}
            {p.saldo > 0 && (
              <tr data-saldo className="border-t border-linha">
                <td colSpan={4} className="py-2 pr-2 text-muted-foreground">
                  Sem pagamento registrado:
                </td>
                <td className="py-2 text-right text-muted-foreground tabular-nums">{brlMi(p.saldo)}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <span className="text-xs leading-normal text-muted-foreground">
        Pessoas físicas aparecem somadas, sem nome nem documento. A data de abertura é a da matriz da empresa
        {receitaBase ? ` (base da Receita de ${mesAno(receitaBase)})` : ""}
        <span className="hidden sm:inline">
          : uma filial nova de empresa antiga não conta como recém-aberta. A situação cadastral de hoje (ativa, baixada)
          não entra na regra, porque não diz como a empresa estava na data do pagamento
        </span>
        .
      </span>
    </>
  );
}

/** Lateral do artboard; no celular vira um <details> no fim da seção (SeguirDinheiroMobile). */
function ComoSeguimos({ className = "" }: { className?: string }) {
  return (
    <details className={`border-t border-borda-suave pt-2.5 text-[0.8125rem] leading-normal text-texto-2 ${className}`}>
      <summary className="flex min-h-11 cursor-pointer items-center text-sm font-semibold">
        Como seguimos o dinheiro e o que não mostramos
      </summary>
      <p className="mb-2">
        Emenda (Portal da Transparência) → plano de ação do município (Transferegov, pelo código da emenda) → pagamentos
        com CNPJ de quem recebeu. Abertura da empresa vem da Receita; campanha vem do TSE. Cada regra só usa dados com
        data até o pagamento.
      </p>
      <p>Não mostramos sócios das empresas, doadores pessoa física, contratos do PNCP nem emendas de convênio.</p>
    </details>
  );
}

/** Blocos da lateral do perfil no desktop (SeguirDinheiro.dc.html, aside). */
export function LateralTrilha() {
  return (
    <>
      <section aria-labelledby="como-seguimos-titulo" className={`${CARTAO} hidden gap-2.5 sm:p-5 lg:flex`}>
        <h2 id="como-seguimos-titulo" className="font-heading text-lg font-bold">
          Como seguimos o dinheiro
        </h2>
        <ol className="flex list-decimal flex-col gap-1.5 pl-5 text-sm leading-normal text-texto-2">
          <li>A emenda vem do Portal da Transparência.</li>
          <li>O Transferegov liga a emenda ao plano de ação do município, pelo código da emenda.</li>
          <li>Os pagamentos do plano trazem o CNPJ de quem recebeu.</li>
          <li>A data de abertura vem da Receita; a campanha vem do TSE. As duas ligações usam o CNPJ.</li>
        </ol>
        <p className="text-[0.8125rem] leading-normal text-muted-foreground">
          Cada regra só usa dados com data até o dia do pagamento avaliado.
        </p>
      </section>
      <section aria-labelledby="nao-mostramos-titulo" className={`${CARTAO} hidden gap-2.5 sm:p-5 lg:flex`}>
        <h2 id="nao-mostramos-titulo" className="font-heading text-lg font-bold">
          O que não mostramos
        </h2>
        <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm leading-normal text-texto-2">
          <li>Sócios das empresas: são pessoas comuns, não agentes públicos.</li>
          <li>Doadores pessoa física da campanha.</li>
          <li>Contratos do PNCP: não dizem com que dinheiro foram pagos.</li>
          <li>Emendas de convênio: o Transferegov ainda não publica os pagamentos delas na API aberta.</li>
        </ul>
      </section>
    </>
  );
}
