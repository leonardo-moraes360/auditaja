import Link from "next/link";
import type { EmendasDoParlamentar } from "@/data/emendas";
import { ANO_INICIAL_EMENDAS, baseDaColeta, brlMi } from "@/lib/emendas";
import { brl, pct } from "@/lib/format";
import { classeFiltro } from "./estilos";
import { NotaFonte } from "./fonte";

/** Mesmo cartão e títulos das outras seções do perfil (secoes.tsx). */
const CARTAO = "flex scroll-mt-4 flex-col rounded-[14px] border bg-superficie p-4 sm:rounded-[16px]";
const H2 = "font-heading text-lg font-bold sm:text-[22px]";
const H3 = "text-[15px] font-bold";

export const PAGINA_EMENDAS_PORTAL = "https://portaldatransparencia.gov.br/download-de-dados/emendas-parlamentares";

/** "17,1" (milhões, uma casa) para o rótulo acima da barra. */
function milhoes(v: number) {
  return (v / 1_000_000).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

function Indicador({
  titulo,
  valor,
  detalhe,
  progresso,
}: {
  titulo: string;
  valor: string;
  detalhe: string;
  progresso?: number | null;
}) {
  return (
    <div
      data-indicador
      className="flex flex-col gap-1 rounded-[10px] bg-background p-3 sm:gap-1.5 sm:rounded-[12px] sm:p-4"
    >
      <p className="text-xs text-muted-foreground sm:text-sm">{titulo}</p>
      <p className="font-heading text-xl font-bold sm:text-[26px]">{valor}</p>
      {progresso != null && (
        <div
          className="h-2 overflow-hidden rounded bg-border"
          role="img"
          aria-label={`${progresso}% do valor empenhado já foi pago`}
        >
          <div className="h-2 bg-primary" style={{ width: `${Math.min(100, progresso)}%` }} />
        </div>
      )}
      <p className="text-sm text-muted-foreground sm:text-xs">{detalhe}</p>
    </div>
  );
}

function Barras({ itens }: { itens: { nome: string; valor: number; detalhe: string }[] }) {
  const maior = itens[0]?.valor || 1;
  return (
    <ul className="flex flex-col gap-2.5 sm:gap-3">
      {itens.map((c) => (
        <li key={c.nome} className="flex flex-col gap-1">
          <div className="flex justify-between gap-3 text-sm">
            <span className="min-w-0 break-words">{c.nome}</span>
            <span className="shrink-0 whitespace-nowrap text-muted-foreground">{c.detalhe}</span>
          </div>
          <div className="h-2 overflow-hidden rounded bg-muted">
            <div className="h-2 bg-chart-2" style={{ width: `${Math.max(1, Math.round((c.valor / maior) * 100))}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Senado: mandato de 8 anos, com todos os anos como botões, e o período do mandato no indicador. */
export type EmendasDoSenador = { anoInicial: number; mandato: string | null; sexo: string | null };

export function SecaoEmendas({
  dados,
  parlamentarId,
  senado,
}: {
  dados: EmendasDoParlamentar;
  parlamentarId: number;
  senado?: EmendasDoSenador;
}) {
  const { periodo, anos } = dados;
  const mandato = periodo === "mandato";
  const parametro = mandato ? "mandato" : String(periodo);
  const href = (p: string) => `/parlamentares/${parlamentarId}?emendas=${p}#emendas`;
  const botoesAno = senado ? anos : anos.slice(0, 2);
  const deste = senado ? (senado.sexo === "F" ? "desta senadora" : "deste senador") : "deste deputado";
  const base = baseDaColeta(dados.coleta?.observacao);

  return (
    <section id="emendas" aria-labelledby="emendas-titulo" className={`${CARTAO} gap-3.5 sm:gap-5 sm:p-6`}>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="emendas-titulo" className={H2}>
          Emendas parlamentares individuais
        </h2>
        {!dados.vazio && (
          <nav aria-label="Período das emendas" className="flex flex-wrap gap-1.5">
            {botoesAno.map((a) => (
              <Link
                key={a}
                href={href(String(a))}
                aria-current={periodo === a ? "page" : undefined}
                className={classeFiltro(periodo === a)}
              >
                {a}
              </Link>
            ))}
            <Link href={href("mandato")} aria-current={mandato ? "page" : undefined} className={classeFiltro(mandato)}>
              Mandato todo
            </Link>
          </nav>
        )}
      </div>

      <p className="text-sm leading-normal text-texto-2">
        Emenda é a parte do Orçamento da União que{" "}
        {senado ? (senado.sexo === "F" ? "a senadora" : "o senador") : "o parlamentar"} indica para uma área ou um
        lugar. Quem executa é o governo federal. <strong>Empenhado</strong> é o valor reservado para a despesa;{" "}
        <strong>pago</strong> é o que já saiu do caixa. Emendas de bancada e de comissão têm autoria coletiva e não
        entram nesta soma.
      </p>

      {dados.vazio ? (
        <p className="text-muted-foreground">
          Nenhuma emenda individual {deste} foi encontrada no Portal da Transparência a partir do orçamento de{" "}
          {senado?.anoInicial ?? ANO_INICIAL_EMENDAS}.
        </p>
      ) : (
        <ConteudoEmendas dados={dados} mandato={mandato} periodoMandato={senado?.mandato ?? null} />
      )}

      <NotaFonte
        rotulo={`Portal da Transparência (CGU), Emendas Parlamentares, download em lote${base ? ` · base de ${base}` : ""}`}
        rotuloCurto="Portal da Transparência, emendas"
        coleta={dados.coleta ?? undefined}
        linkOriginal={PAGINA_EMENDAS_PORTAL}
        rotuloOriginal="Ver no Portal"
        extras={
          dados.vazio
            ? []
            : [
                {
                  rotulo: "Baixar CSV",
                  href: `/parlamentares/${parlamentarId}/emendas.csv?emendas=${parametro}`,
                  download: true,
                },
              ]
        }
        parlamentarId={parlamentarId}
        secao="emendas"
      />
    </section>
  );
}

function ConteudoEmendas({
  dados,
  mandato,
  periodoMandato,
}: {
  dados: Extract<EmendasDoParlamentar, { vazio: false }>;
  mandato: boolean;
  /** "2019–2027" no perfil do senador. */
  periodoMandato: string | null;
}) {
  const { totais, periodo, anos } = dados;
  const pctPago = pct(totais.pago, totais.empenhado);
  const pctEsp = pct(totais.especiais, totais.empenhado);
  const pctSemLocal = pct(totais.multiplo, totais.empenhado) ?? 0;
  const anosOrdem = anos.toSorted((a, b) => a - b);
  const qtd = `${totais.emendas} ${totais.emendas === 1 ? "emenda" : "emendas"}`;
  const anoAtual = new Date().getFullYear();
  const max = Math.max(1, ...dados.porAno.flatMap((a) => [a.empenhado, a.pago])) * 1.08;

  return (
    <>
      <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 sm:grid-cols-[repeat(auto-fit,minmax(200px,1fr))] sm:gap-3">
        <Indicador
          titulo={mandato ? "Reservado (empenhado) no mandato" : `Reservado (empenhado) em ${periodo}`}
          valor={brlMi(totais.empenhado)}
          detalhe={
            mandato
              ? `${qtd}, ${
                  anosOrdem.length === 1
                    ? `orçamento de ${anosOrdem[0]}`
                    : `orçamentos de ${anosOrdem[0]} a ${anosOrdem.at(-1)}`
                }${periodoMandato ? ` (mandato ${periodoMandato.replace("–", "\u2060–\u2060")})` : ""}`
              : `${qtd} do orçamento de ${periodo}`
          }
        />
        <Indicador
          titulo="Já pago"
          valor={brlMi(totais.pago)}
          progresso={pctPago}
          detalhe={pctPago === null ? "—" : `${pctPago}% do reservado, inclui pagamentos de anos anteriores`}
        />
        <Indicador
          titulo="Emendas Pix (transferências especiais)"
          valor={brlMi(totais.especiais)}
          detalhe={`${pctEsp === null ? "—" : `${pctEsp}%`} do reservado · caem direto no caixa da prefeitura ou do estado, sem dizer em quê serão usadas`}
        />
      </div>

      {mandato && (
        <figure className="flex flex-col gap-2">
          <figcaption className="flex flex-wrap justify-between gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span>Por ano do orçamento</span>
            <span className="flex gap-4" aria-hidden="true">
              <span className="flex items-center gap-1.5">
                <span className="size-3 rounded-[3px] bg-anterior" />
                Empenhado
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-3 rounded-[3px] bg-primary" />
                Pago
              </span>
            </span>
          </figcaption>
          {/* Senador com dois mandatos chega a 7 anos: abaixo de ~64 px por ano os rótulos de valor não cabem e as
              barras transbordavam. Barras e anos rolam juntos dentro do cartão, sempre alinhados; row-reverse abre
              a rolagem no fim, com os anos mais recentes à vista. */}
          <div
            className="flex flex-row-reverse overflow-x-auto"
            {...(dados.porAno.length > 4 && { tabIndex: 0, role: "region", "aria-label": "Por ano do orçamento" })}
          >
            <div className="flex-1" style={{ minWidth: `${dados.porAno.length * 64}px` }}>
              <div
                className="flex h-[150px] items-end gap-4 border-b border-linha px-1 pt-2.5 sm:h-[190px] sm:gap-8 sm:px-2"
                role="img"
                aria-label={`Gráfico de barras: valor empenhado e pago por ano do orçamento, de ${anosOrdem[0]} a ${anosOrdem.at(-1)}`}
              >
                {dados.porAno.map((a) => (
                  <div key={a.ano} className="flex h-full min-w-0 flex-1 items-end justify-center gap-1.5">
                    {[
                      { v: a.empenhado, cor: "bg-anterior" },
                      { v: a.pago, cor: "bg-primary" },
                    ].map((b, i) => (
                      <div key={i} className="flex h-full w-[44%] max-w-[52px] flex-col items-center justify-end gap-1">
                        <span className="text-sm text-muted-foreground">{milhoes(b.v)}</span>
                        <div
                          className={`w-full rounded-t-[4px] ${b.cor}`}
                          style={{ height: `${Math.max(1, (b.v / max) * 100)}%` }}
                        />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
              <div className="flex gap-4 px-1 sm:gap-8 sm:px-2" aria-hidden="true">
                {dados.porAno.map((a) => (
                  <span key={a.ano} className="min-w-0 flex-1 text-center text-xs text-muted-foreground">
                    {a.ano}
                  </span>
                ))}
              </div>
            </div>
          </div>
          {/* Tabela fora da tela: `sr-only` direto na tabela não encolhe a largura (estoura 320 px). */}
          <div className="sr-only">
            <table>
              <caption>Empenhado e pago por ano do orçamento</caption>
              <thead>
                <tr>
                  <th scope="col">Ano</th>
                  <th scope="col">Empenhado</th>
                  <th scope="col">Pago</th>
                </tr>
              </thead>
              <tbody>
                {dados.porAno.map((a) => (
                  <tr key={a.ano}>
                    <th scope="row">{a.ano}</th>
                    <td>{brl(a.empenhado)}</td>
                    <td>{brl(a.pago)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <span className="text-xs text-muted-foreground">
            {anos.includes(anoAtual) &&
              `Em ${anoAtual} o ano ainda está em curso: boa parte do empenhado só é paga no ano seguinte, como restos a pagar.`}
          </span>
        </figure>
      )}

      <div className="flex flex-wrap gap-6">
        <div className="flex min-w-0 flex-[1_1_280px] flex-col gap-3">
          <h3 className={H3}>Por área do governo</h3>
          <Barras
            itens={dados.areas.map((a) => ({
              ...a,
              detalhe: `${brlMi(a.valor)} · ${pct(a.valor, totais.empenhado) ?? 0}%`,
            }))}
          />
        </div>
        <div className="flex min-w-0 flex-[1_1_280px] flex-col gap-3">
          <h3 className={H3}>Onde o dinheiro foi aplicado</h3>
          {totais.multiplo > 0 && (
            // A parte sem local é mostrada como fatia, não em nota de rodapé: lida só a lista de locais, o
            // total parecia pequeno (avaliação com cidadãos, 12/11/2026).
            <div data-sem-local className="flex flex-col gap-2">
              <div
                className="flex h-5 overflow-hidden rounded-[5px] bg-primary"
                role="img"
                aria-label={`${pctSemLocal}% do empenhado sem local definido no Orçamento`}
              >
                <div className="h-full bg-linha" style={{ width: `${pctSemLocal}%` }} />
              </div>
              <p className="text-sm leading-normal">
                <strong>
                  Sem local definido no Orçamento: {brlMi(totais.multiplo)} ({pctSemLocal}%)
                </strong>
                <br />
                <span className="text-sm text-texto-2">
                  O Orçamento marca como “Múltiplo” (vários lugares). Para saber quem recebeu, veja a lista abaixo.
                </span>
              </p>
              {dados.locais.length > 0 && <p className="text-sm font-semibold text-texto-2">Com local definido:</p>}
            </div>
          )}
          <Barras itens={dados.locais.map((l) => ({ ...l, detalhe: brlMi(l.valor) }))} />
          {dados.locais.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhuma emenda do período tem local único no Orçamento.</p>
          )}
          <p className="text-xs text-muted-foreground">
            “Estado (UF)” e “Nacional” indicam emendas sem município definido no Orçamento.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h3 className={H3}>Quem recebeu os pagamentos</h3>
        {dados.favorecidos.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum pagamento a favorecido publicado para este período.</p>
        ) : (
          <>
            {/* Celular: cartões com o valor à vista (na tabela, a coluna "Recebido" ficava fora da tela). */}
            <ul className="flex flex-col gap-2 sm:hidden" data-favorecidos-cartoes>
              {dados.favorecidos.map((f, i) => (
                <li key={i} className="flex justify-between gap-3 rounded-[10px] border border-borda-suave px-3 py-2.5">
                  <span className="flex min-w-0 flex-col gap-0.5 text-sm">
                    <strong className="font-semibold">{f.nome}</strong>
                    <span className="text-sm text-muted-foreground">
                      {[f.municipio, f.tipo].filter(Boolean).join(" · ")}
                    </span>
                    {f.doc && <span className="text-xs text-muted-foreground tabular-nums">{f.doc}</span>}
                  </span>
                  <strong className="shrink-0 text-[15px] whitespace-nowrap tabular-nums">{brlMi(f.valor)}</strong>
                </li>
              ))}
            </ul>
            <div
              className="hidden flex-row-reverse overflow-x-auto sm:flex"
              tabIndex={0}
              role="region"
              aria-label="Quem recebeu os pagamentos"
            >
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground">
                    <th scope="col" className="py-1.5 pr-2 font-semibold">
                      Favorecido
                    </th>
                    <th scope="col" className="px-2 py-1.5 font-semibold">
                      CNPJ/CPF
                    </th>
                    <th scope="col" className="px-2 py-1.5 font-semibold">
                      Tipo
                    </th>
                    <th scope="col" className="px-2 py-1.5 font-semibold">
                      Município
                    </th>
                    <th scope="col" className="py-1.5 text-right font-semibold">
                      Recebido
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {dados.favorecidos.map((f, i) => (
                    <tr key={i} className="border-t border-borda-suave">
                      <td className="py-2 pr-2">{f.nome}</td>
                      <td className="px-2 py-2 whitespace-nowrap text-muted-foreground tabular-nums">
                        {f.doc ?? (f.pessoaFisica ? "CPF não exibido" : "—")}
                      </td>
                      <td className="px-2 py-2 text-muted-foreground">{f.tipo}</td>
                      <td className="px-2 py-2 whitespace-nowrap text-muted-foreground">{f.municipio ?? "—"}</td>
                      <td className="py-2 text-right whitespace-nowrap tabular-nums">{brlMi(f.valor)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        <p className="text-xs text-muted-foreground">
          Prefeituras e fundos municipais aparecem pelo nome. Pessoas físicas aparecem somadas, sem nome e sem CPF: a
          máscara do Portal da Transparência, junto com a de outras fontes, remontaria o número.
        </p>
      </div>
    </>
  );
}

/** MET-05: bloco da lateral com a regra de ligação autor ↔ deputado ou senador. */
export function ComoLigamosEmendas({ senado = false, sexo = null }: { senado?: boolean; sexo?: string | null }) {
  return (
    <section aria-labelledby="como-ligamos-titulo" className={`${CARTAO} gap-2.5 sm:p-5`}>
      <h2 id="como-ligamos-titulo" className="font-heading text-lg font-bold">
        {senado
          ? `Como ligamos a emenda ${sexo === "F" ? "à senadora" : "ao senador"}`
          : "Como ligamos a emenda ao deputado"}
      </h2>
      {senado ? (
        <p className="text-sm leading-normal text-texto-2">
          O Portal identifica o autor pelo nome parlamentar. Ligamos esse nome ao cadastro do Senado (titulares e
          suplentes). Contamos os orçamentos votados durante o mandato: para quem tomou posse em 2019, de 2020 em
          diante; em 2023, de 2024 em diante. Se o nome também é de um deputado federal atual, a emenda fica no perfil
          do deputado. Quando dois senadores têm o mesmo nome, a emenda fica de fora.{" "}
          <Link href="/metodologia#emendas">Ver a metodologia</Link>
        </p>
      ) : (
        <p className="text-sm leading-normal text-texto-2">
          O Portal identifica o autor pelo nome parlamentar. Ligamos esse nome ao cadastro da Câmara. Quando dois
          deputados têm o mesmo nome, a emenda fica de fora. <Link href="/metodologia#emendas">Ver a metodologia</Link>
        </p>
      )}
    </section>
  );
}
