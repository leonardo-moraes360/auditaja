import Link from "next/link";
import type { SancaoFornecedor } from "@/data/emendas";
import type { Perfil } from "@/data/perfil";
import { brl, brlCompacto, dataBr, dataHoraBr, fraseCase, INICIAIS_MESES, MESES, pct } from "@/lib/format";
import { METODOLOGIA_VERSAO, variacaoNominal } from "@/lib/metrics";
import { LEGISLATURAS, NOME_UF } from "@/lib/rotulos";
import { classificarVotoSenado, codigoSenado, rotuloVotoSenado } from "@/lib/senado";
import { BOTAO_PRIMARIO, classeFiltro } from "./estilos";
import { NotaFonte } from "./fonte";
import { AvisosAtipicos, tiposAtipicos } from "./atipico";
import { AvisoSancao, SeloSancao } from "./sancao";
import { ComoLigamosEmendas } from "./secao-emendas";


/** "k" com uma casa: 31200 → "31,2k". */
function milhar(v: number) {
  return `${(v / 1000).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}k`;
}

/** Texto que muda entre celular e desktop, como nos dois artboards do protótipo. */
function Dois({ curto, longo }: { curto: React.ReactNode; longo: React.ReactNode }) {
  return (
    <>
      <span className="sm:hidden">{curto}</span>
      <span className="hidden sm:inline">{longo}</span>
    </>
  );
}

const CARTAO = "flex scroll-mt-4 flex-col rounded-[14px] border bg-superficie p-4 sm:rounded-[16px]";
const H2 = "font-heading text-lg font-bold sm:text-[22px]";
const H2_LATERAL = "font-heading text-lg font-bold";
const H3 = "text-[15px] font-bold";

export function Indicador({
  titulo,
  tituloCurto,
  valor,
  valorCurto,
  detalhe,
  detalheCurto,
  progresso,
  nota,
}: {
  titulo: string;
  tituloCurto?: string;
  valor: string;
  valorCurto?: string;
  detalhe: string;
  detalheCurto?: string;
  progresso?: number | null;
  /** Linha extra, só no desktop. */
  nota?: React.ReactNode;
}) {
  return (
    <div
      data-indicador
      className="flex flex-col gap-1 rounded-[10px] bg-background p-3 sm:gap-1.5 sm:rounded-[12px] sm:p-4"
    >
      <p className="text-xs text-muted-foreground sm:text-[13px]">
        <Dois curto={tituloCurto ?? titulo} longo={titulo} />
      </p>
      <p className="font-heading text-xl font-bold sm:text-[26px]">
        <Dois curto={valorCurto ?? valor} longo={valor} />
      </p>
      {progresso != null && (
        <div
          className="hidden h-2 overflow-hidden rounded bg-border sm:block"
          role="img"
          aria-label={`${progresso}% do teto acumulado`}
        >
          <div className="h-2 bg-primary" style={{ width: `${Math.min(100, progresso)}%` }} />
        </div>
      )}
      <p className="text-[11px] text-muted-foreground sm:text-xs">
        <Dois curto={detalheCurto ?? detalhe} longo={detalhe} />
      </p>
      {nota && <p className="hidden text-xs text-muted-foreground sm:block">{nota}</p>}
    </div>
  );
}

// ---------------------------------------------------------------- CEAP

export function SecaoGastos({
  perfil,
  completo,
  sancoes = [],
}: {
  perfil: Perfil;
  completo: boolean;
  sancoes?: SancaoFornecedor[];
}) {
  const { ceap, ano, parlamentar, mandato } = perfil;
  const senado = parlamentar.casa === "senado";
  const uf = parlamentar.sigla_uf;
  const tetoMensal = ceap.teto?.mensal ?? null;
  const parametroAno = mandato ? "mandato" : String(ano);

  // Barras: meses do ano até o último com dado; no mandato, uma barra por ano.
  const ultimoMes = Math.max(0, ...ceap.porMes.map((m) => m.mes));
  const barras = mandato
    ? ceap.porAno.map((a) => ({ rotulo: String(a.ano), inicial: String(a.ano).slice(2), total: a.total }))
    : Array.from({ length: ultimoMes }, (_, i) => ({
        rotulo: MESES[i],
        inicial: INICIAIS_MESES[i],
        total: ceap.porMes.find((m) => m.mes === i + 1)?.total ?? 0,
      }));
  const linhaTeto = mandato ? null : tetoMensal;
  // Escala com folga sobre o maior valor (ou o teto), para o rótulo caber acima da barra.
  const max = Math.max(1, linhaTeto ?? 0, ...barras.map((b) => b.total)) * 1.08;

  // Por tipo: 6 maiores e "Outros" no desktop; 4 maiores no celular.
  const atipicos = mandato ? new Set<string>() : tiposAtipicos(perfil.atipico[0]);
  const tipos = ceap.porTipo
    .slice(0, 6)
    .map((t) => ({ nome: fraseCase(t.tipo), total: t.total, atipico: atipicos.has(t.tipo) }));
  const resto = ceap.porTipo.slice(6).reduce((s, t) => s + t.total, 0);
  if (resto > 0) tipos.push({ nome: "Outros", total: resto, atipico: false });
  const maiorTipo = tipos[0]?.total ?? 1;
  const href = (q: string) => `/parlamentares/${parlamentar.id}?${q}`;

  return (
    <section id="gastos" aria-labelledby="gastos-titulo" className={`${CARTAO} gap-3.5 sm:gap-5 sm:p-6`}>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="gastos-titulo" className={H2}>
          <Dois
            curto={`Gastos da cota (${senado ? "CEAPS" : "CEAP"}) · ${mandato ? "mandato" : ano}`}
            longo={senado ? "Gastos da cota do senador (CEAPS)" : "Gastos da cota parlamentar (CEAP)"}
          />
        </h2>
        <nav aria-label="Período dos gastos" className="hidden flex-wrap gap-1.5 sm:flex">
          {perfil.anosDisponiveis.map((a) => (
            <Link
              key={a}
              href={href(`ano=${a}#gastos`)}
              aria-current={!mandato && a === ano ? "page" : undefined}
              className={classeFiltro(!mandato && a === ano)}
            >
              {a}
            </Link>
          ))}
          {!senado && (
            <Link
              href={href("ano=mandato#gastos")}
              aria-current={mandato ? "page" : undefined}
              className={classeFiltro(mandato)}
            >
              Mandato todo
            </Link>
          )}
        </nav>
      </div>

      {senado && (
        <p className="flex items-start gap-3 rounded-[10px] bg-muted p-3 text-[13px] leading-[1.45] text-texto-2 sm:rounded-[12px] sm:px-[18px] sm:py-3.5 sm:text-sm sm:leading-normal">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="mt-px hidden size-5 shrink-0 sm:block"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 11v6" />
            <path d="M12 7h.01" />
          </svg>
          <Dois
            curto="Valor reembolsado pelo Senado. Sem teto por estado publicado em formato aberto, não há linha de teto."
            longo="O Senado publica o valor reembolsado de cada nota, sem glosa, e não divulga em formato aberto o teto da cota por estado. Por isso este bloco não compara o gasto com um teto."
          />
        </p>
      )}
      {ceap.documentos === 0 ? (
        <p className="text-muted-foreground">Nenhuma despesa publicada para {ano}.</p>
      ) : (
        <>
          <figure className="flex flex-col gap-2">
            <figcaption className="hidden flex-wrap justify-between gap-x-4 gap-y-1 text-[13px] text-muted-foreground sm:flex">
              <span>{mandato ? "Gasto anual no mandato" : `Gasto mensal em ${ano}`}</span>
              {linhaTeto !== null && (
                <span>
                  Linha tracejada: teto mensal para {uf} ({brl(linhaTeto)})
                </span>
              )}
              {senado && <span>Valor reembolsado pelo Senado</span>}
            </figcaption>
            <div
              className="relative flex h-[140px] items-end gap-1.5 border-b border-linha sm:h-[211px] sm:gap-2.5 sm:pt-2.5"
              role="img"
              aria-label={`${mandato ? "Gasto anual da cota no mandato" : `Gasto mensal da cota em ${ano}`}${
                linhaTeto !== null ? `, com o teto mensal de ${brl(linhaTeto)}` : ""
              }`}
            >
              {linhaTeto !== null && (
                <div
                  data-teto
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 z-10 border-t-2 border-dashed border-teto"
                  style={{ bottom: `${(linhaTeto / max) * 100}%` }}
                />
              )}
              {barras.map((b) => (
                <div key={b.rotulo} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                  <span className="hidden text-[11px] text-muted-foreground sm:block">{milhar(b.total)}</span>
                  <div
                    className="w-full rounded-t-[3px] bg-primary sm:max-w-11 sm:rounded-t-[4px]"
                    style={{ height: `${Math.max(1, (b.total / max) * 100)}%` }}
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-1.5 sm:gap-2.5" aria-hidden="true">
              {barras.map((b) => (
                <span key={b.rotulo} className="flex-1 text-center text-[11px] text-muted-foreground sm:text-xs">
                  <Dois curto={b.inicial} longo={b.rotulo} />
                </span>
              ))}
            </div>
            {linhaTeto !== null && (
              <span className="text-xs text-muted-foreground sm:hidden">Tracejado: teto mensal de {uf}</span>
            )}
            <table className="sr-only">
              <caption>{mandato ? "Gasto anual no mandato" : `Gasto mensal em ${ano}`}</caption>
              <tbody>
                {barras.map((b) => (
                  <tr key={b.rotulo}>
                    <th scope="row">{b.rotulo}</th>
                    <td>{brl(b.total)}</td>
                  </tr>
                ))}
              </tbody>
              {linhaTeto !== null && (
                <tfoot>
                  <tr>
                    <th scope="row">Teto mensal</th>
                    <td>{brl(linhaTeto)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </figure>

          <AvisosAtipicos
            resultados={perfil.atipico}
            mandato={mandato}
            casa={senado ? "senado" : "camara"}
            sexo={parlamentar.sexo}
            ultimoMes={ceap.ultimoMes}
            hrefContestar={`/parlamentares/${parlamentar.id}/contestar?secao=gastos`}
            hrefNotas={(a, tipo) => `/parlamentares/${parlamentar.id}/gastos.csv?ano=${a}&tipo=${encodeURIComponent(tipo)}`}
            hrefAno={(a) => href(`ano=${a}#gastos`)}
          />

          <div className="flex flex-wrap gap-6">
            <div className="flex min-w-0 flex-[1_1_280px] flex-col gap-2.5 sm:gap-3">
              <h3 className={`${H3} hidden sm:block`}>Por tipo de despesa</h3>
              <ul className="flex flex-col gap-2.5 sm:gap-3">
                {tipos.map((t, i) => (
                  <li key={t.nome} className={`flex flex-col gap-1 ${i >= 4 && !completo ? "max-sm:hidden" : ""}`}>
                    <div className="flex justify-between gap-2 text-[13px]">
                      <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 break-words">
                        {t.nome}
                        {t.atipico && (
                          <span className="rounded-full border border-atipico-borda bg-atipico-fundo px-[7px] py-0.5 text-[11px] font-bold whitespace-nowrap text-atipico">
                            Atípico
                          </span>
                        )}
                      </span>
                      <span className="shrink-0 whitespace-nowrap text-muted-foreground">
                        <Dois
                          curto={`${pct(t.total, ceap.totalAno)}%`}
                          longo={`${brl(t.total)} · ${pct(t.total, ceap.totalAno)}%`}
                        />
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded bg-muted">
                      <div
                        className="h-2 bg-chart-2"
                        style={{ width: `${Math.max(1, Math.round((t.total / maiorTipo) * 100))}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className={`min-w-0 flex-[1_1_320px] flex-col gap-3 ${completo ? "flex" : "hidden sm:flex"}`}>
              <h3 className={H3}>Maiores fornecedores</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[13px]">
                  <thead>
                    <tr className="text-left text-muted-foreground">
                      <th scope="col" className="py-1.5 pr-2 font-semibold">
                        Fornecedor
                      </th>
                      <th scope="col" className="px-2 py-1.5 font-semibold">
                        CNPJ/CPF
                      </th>
                      <th scope="col" className="py-1.5 text-right font-semibold">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {ceap.fornecedores.map((f, i) => (
                      <tr key={i} className="border-t border-borda-suave">
                        <td className="py-2 pr-2">
                          <a
                            href={`/parlamentares/${parlamentar.id}/gastos.csv?ano=${parametroAno}${
                              f.fornecedor_doc ? `&doc=${encodeURIComponent(f.fornecedor_doc)}` : ""
                            }`}
                            download
                            className="text-foreground"
                          >
                            {f.fornecedor_nome}
                          </a>
                          <SeloSancao doc={f.fornecedor_doc} sancoes={sancoes} />
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-muted-foreground tabular-nums">
                          {f.fornecedor_doc ?? "—"}
                        </td>
                        <td className="py-2 text-right whitespace-nowrap tabular-nums">{brl(f.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted-foreground">
                CPF de pessoa física aparece mascarado, como no Portal da Transparência. O nome do fornecedor baixa as
                notas dele.
              </p>
            </div>
          </div>
          <AvisoSancao
            fornecedores={ceap.fornecedores}
            sancoes={sancoes}
            periodo={mandato ? "no mandato" : `em ${ano}`}
            hrefNotas={(doc, de, ate) =>
              `/parlamentares/${parlamentar.id}/gastos.csv?ano=${parametroAno}&doc=${encodeURIComponent(doc)}${
                de ? `&de=${de}` : ""
              }${ate ? `&ate=${ate}` : ""}`
            }
          />
          {!completo && (
            <Link href={href(`ano=${parametroAno}&lista=completa#gastos`)} className="text-sm font-semibold sm:hidden">
              Ver todas as notas e fornecedores
            </Link>
          )}
        </>
      )}
      <NotaFonte
        rotulo={
          senado
            ? "Senado Federal, Dados Abertos administrativos (CEAPS)"
            : "Câmara dos Deputados, Dados Abertos (CEAP)"
        }
        rotuloCurto={senado ? "Senado, CEAPS" : "Câmara, CEAP"}
        coleta={senado ? perfil.coletas.senado_ceaps : perfil.coletas.camara_ceap}
        extras={[
          {
            rotulo: "Baixar CSV",
            href: `/parlamentares/${parlamentar.id}/gastos.csv?ano=${parametroAno}`,
            download: true,
          },
        ]}
        parlamentarId={parlamentar.id}
        secao="gastos"
      />
    </section>
  );
}

// ---------------------------------------------------------------- Votações

/** Rótulo da orientação: "Partido" quando é do partido; indica bloco ou federação quando é deles. */
/** De quem veio a orientação seguida pelo partido do deputado (vai no title do rótulo "Partido: X"). */
const ORIGEM_ORIENTACAO = {
  partido: "Orientação do partido",
  federacao: "Orientação da federação do partido",
  bloco: "Orientação do bloco do partido",
} as const;

function diverge(voto: string | null, orientacao: string | null) {
  const comparavel = (x: string | null) => x === "Sim" || x === "Não";
  return comparavel(voto) && comparavel(orientacao) && voto !== orientacao;
}

function corVoto(voto: string | null, orientacao: string | null) {
  const comparavel = (x: string | null) => x === "Sim" || x === "Não";
  if (comparavel(voto) && comparavel(orientacao)) {
    return voto === orientacao ? "bg-secondary text-secondary-foreground" : "bg-aviso-fundo text-aviso";
  }
  if (voto && orientacao === "Liberado") return "bg-secondary text-secondary-foreground";
  return "bg-muted text-texto-2";
}

const SELO_FORA = { licenca: "Em licença", antes_posse: "Antes da posse", outro: "Fora do exercício" } as const;

function intervalo(inicio: string, fim: string | null) {
  const d = (x: string) => dataBr(x).slice(0, 5);
  if (!fim) return `desde ${d(inicio)}`;
  return fim === inicio ? d(inicio) : `${d(inicio)} a ${d(fim)}`;
}

/**
 * Quadro dos períodos fora do exercício no ano das votações (licença, afastamento, antes da posse).
 * Só os que tiraram alguma votação da conta, como nas pranchas aprovadas.
 */
function PeriodosFora({ perfil }: { perfil: Perfil }) {
  const { votacoes, parlamentar } = perfil;
  const artigo = parlamentar.sexo === "F" ? "a deputada" : "o deputado";
  const periodos = votacoes.periodosFora.filter((p) => p.votacoes > 0);
  if (!periodos.length) return null;
  return (
    <div
      id="periodos"
      className="mt-2 flex scroll-mt-4 flex-col gap-2 rounded-[10px] bg-background p-3 sm:mt-0 sm:gap-2.5 sm:rounded-[12px] sm:p-4"
    >
      <h3 className="text-sm font-bold sm:text-[15px]">
        <Dois curto={`Fora do exercício em ${votacoes.ano}`} longo={`Períodos fora do exercício em ${votacoes.ano}`} />
      </h3>
      <ul className="flex flex-col gap-2 sm:gap-1.5">
        {periodos.map((p) => (
          <li
            key={p.inicio}
            className="flex flex-col gap-0.5 text-[13px] sm:flex-row sm:flex-wrap sm:gap-x-4 sm:gap-y-1 sm:text-sm"
          >
            <span className="font-semibold tabular-nums sm:w-[200px] sm:font-normal">{intervalo(p.inicio, p.fim)}</span>
            <span className="text-texto-2">
              {p.motivo} · {p.votacoes} {p.votacoes === 1 ? "votação" : "votações"}
            </span>
          </li>
        ))}
      </ul>
      <p className="text-xs leading-normal text-texto-2 sm:text-[13px]">
        <span className="sm:hidden">Essas votações não contam na presença nem em &quot;Ausências&quot;. </span>
        <span className="hidden sm:inline">
          A presença conta só as votações em que {artigo} estava em exercício. Licença, afastamento e suplência ficam de
          fora. Votações nesses períodos aparecem na lista, marcadas, mas não entram em &quot;Ausências&quot;.{" "}
        </span>
        <Link href="/metodologia#presenca">Como calculamos</Link>
      </p>
    </div>
  );
}

/** "Aprovado" / "Rejeitada" a partir do começo da descrição da Câmara; senão pelo campo aprovação. */
function resultado(descricao: string, aprovacao: number | null) {
  const m = descricao.match(/\b(Aprovad[oa]s?|Rejeitad[oa]s?|Mantid[oa]s?|Derrubad[oa]s?)\b/i);
  if (m) return m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase();
  if (aprovacao === 1) return "Aprovada";
  if (aprovacao === 0) return "Rejeitada";
  return null;
}

export function SecaoVotacoes({
  perfil,
  filtro,
  completo,
}: {
  perfil: Perfil;
  filtro: "todas" | "divergiu" | "ausencias";
  completo: boolean;
}) {
  const { votacoes, parlamentar, ano } = perfil;
  const senado = parlamentar.casa === "senado";
  const ausente = (voto: string | null) => (senado ? !voto || classificarVotoSenado(voto) === "ausente" : !voto);
  const lista = votacoes.lista.filter((v) => {
    if (filtro === "ausencias") return senado ? ausente(v.voto) : !v.voto && !v.foraDoExercicio;
    if (filtro === "divergiu") return diverge(v.voto, v.orientacao);
    return true;
  });
  const filtros = [
    ["todas", "Todas"],
    ["divergiu", senado ? "Divergiu da liderança" : "Divergiu do partido"],
    ["ausencias", "Ausências"],
  ] as const;
  // Resumo: 5 votações no perfil do deputado e 6 no do senador, como nos artboards.
  const visiveis = completo ? lista : lista.slice(0, senado ? 6 : 5);
  const verTodas = `/parlamentares/${parlamentar.id}?ano=${ano}&votos=${filtro}&lista=completa#votacoes`;

  return (
    <section id="votacoes" aria-labelledby="votacoes-titulo" className={`${CARTAO} gap-1 sm:gap-4 sm:p-6`}>
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-3 sm:mb-0">
        <h2 id="votacoes-titulo" className={H2}>
          <Dois
            curto="Votações recentes"
            longo={senado ? "Votações nominais no Plenário" : "Votações nominais recentes"}
          />
        </h2>
        <nav aria-label="Filtrar votações" className="hidden flex-wrap gap-1.5 sm:flex">
          {filtros.map(([k, r]) => (
            <Link
              key={k}
              href={`/parlamentares/${parlamentar.id}?ano=${ano}&votos=${k}#votacoes`}
              aria-current={filtro === k ? "page" : undefined}
              className={classeFiltro(filtro === k, true)}
            >
              {r}
            </Link>
          ))}
        </nav>
      </div>
      {senado && (
        <p className="pb-2 text-xs leading-[1.45] text-muted-foreground sm:pb-0 sm:text-[13px] sm:leading-normal">
          <Dois
            curto="Em votação secreta o Senado registra só que o senador votou."
            longo="Em votação secreta, como a escolha de autoridades, o Senado registra só que o senador votou. Essas votações contam para a presença, mas não para o alinhamento com a liderança."
          />
        </p>
      )}
      {lista.length === 0 ? (
        <p className="text-muted-foreground">Nenhuma votação neste filtro.</p>
      ) : (
        <ul className="flex flex-col">
          {visiveis.map((v, i) => {
            const res = resultado(v.descricao, v.aprovacao);
            const titulo = v.proposicao_sigla ?? v.descricao;
            const ementa = v.proposicao_sigla ? (v.proposicao_ementa ?? v.descricao) : null;
            const partidoDoDia = v.partidoNoVoto ?? parlamentar.sigla_partido;
            const orient = senado ? (
              v.secreta ? (
                "Orientação: não se aplica"
              ) : v.orientacao ? (
                <Dois
                  curto={`Liderança: ${v.orientacao}`}
                  longo={`Liderança${partidoDoDia ? ` do ${partidoDoDia}` : ""}: ${v.orientacao}`}
                />
              ) : (
                "Liderança: sem orientação"
              )
            ) : v.tipoOrientacao ? (
              `Partido: ${v.orientacao}`
            ) : (
              "Partido: sem orientação"
            );
            const origem = v.tipoOrientacao ? ORIGEM_ORIENTACAO[v.tipoOrientacao] : undefined;
            const selo = v.foraDoExercicio ? (
              <span className="rounded-[6px] border border-dashed border-input bg-superficie px-[9px] py-[3px] text-xs font-bold text-texto-2 sm:rounded-[8px] sm:px-[11px] sm:py-[5px] sm:text-[13px]">
                {SELO_FORA[v.foraDoExercicio]} · não conta
              </span>
            ) : (
              <span
                className={`rounded-[6px] px-2.5 py-1 text-xs font-bold sm:rounded-[8px] sm:px-3 sm:py-1.5 sm:text-[13px] ${corVoto(v.voto, v.orientacao)}`}
              >
                {senado ? (
                  v.secreta && v.voto === "Votou" ? (
                    <Dois curto="Votou (secreto)" longo="Votou (voto secreto)" />
                  ) : (
                    rotuloVotoSenado(v.voto, v.secreta)
                  )
                ) : (
                  `Votou: ${v.voto ?? "sem registro"}`
                )}
                {diverge(v.voto, v.orientacao) && <span className="sr-only"> (divergiu da orientação)</span>}
              </span>
            );
            return (
              <li
                key={v.id}
                className={`flex flex-col gap-1.5 border-t border-borda-suave py-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-5 sm:gap-y-2 sm:py-3.5 ${
                  i >= 3 && !completo ? "max-sm:hidden" : ""
                }`}
              >
                <span className="hidden w-[84px] text-[13px] text-muted-foreground tabular-nums sm:block">
                  {dataBr(v.data)}
                </span>
                <div className="flex min-w-0 flex-col gap-1.5 sm:flex-[1_1_260px] sm:gap-0.5">
                  <div className="flex justify-between gap-2">
                    <a
                      href={v.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`text-sm font-semibold text-foreground sm:text-[15px] ${v.proposicao_sigla ? "" : "line-clamp-2"}`}
                    >
                      {titulo}
                    </a>
                    <span className="shrink-0 text-xs text-muted-foreground sm:hidden">
                      {dataBr(v.data).slice(0, 5)}
                    </span>
                  </div>
                  {(ementa || res) && (
                    <span className="text-[13px] text-muted-foreground">
                      {ementa && (ementa.length > 110 ? `${ementa.slice(0, 110).replace(/\s+\S*$/, "")}…` : ementa)}
                      {ementa && res ? <span className="max-sm:hidden"> · {res}</span> : null}
                      {!ementa && res}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    title={origem}
                    className="text-xs text-muted-foreground sm:order-none sm:text-[13px] max-sm:order-2"
                  >
                    {orient}
                    {v.tipoOrientacao && v.tipoOrientacao !== "partido" && (
                      <span className="sr-only"> ({origem?.toLowerCase()})</span>
                    )}
                  </span>
                  <span className="max-sm:order-1">{selo}</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <PeriodosFora perfil={perfil} />
      {!completo && lista.length > 3 && (
        <Link href={verTodas} className="pt-2 text-sm font-semibold sm:hidden">
          Ver as {lista.length} votações
        </Link>
      )}
      {senado && (
        <p className="mt-2 text-xs text-muted-foreground sm:mt-0">
          A presença não conta as votações em que o senador estava de licença ou afastado.
        </p>
      )}
      <NotaFonte
        rotulo={
          senado
            ? "Senado Federal, Dados Abertos (/votacao e orientação de bancada)"
            : "Câmara dos Deputados, Dados Abertos (votações e histórico de situação dos deputados)"
        }
        rotuloCurto={senado ? "Senado, Dados Abertos" : "Câmara, Dados Abertos"}
        coleta={senado ? perfil.coletas.senado_votacoes : perfil.coletas.camara_lote_votos}
        extras={completo || lista.length <= 5 ? [] : [{ rotulo: `Ver todas as ${lista.length}`, href: verTodas }]}
        parlamentarId={parlamentar.id}
        secao="votacoes"
      />
    </section>
  );
}

// ---------------------------------------------------------------- Bens

export function SecaoBens({ perfil }: { perfil: Perfil }) {
  const porAno = new Map<number, { total: number; cargo: string; tipos: Map<string, number> }>();
  for (const b of perfil.bens) {
    const e = porAno.get(b.ano_eleicao) ?? { total: 0, cargo: b.cargo, tipos: new Map() };
    e.total += Number(b.total);
    e.tipos.set(b.tipo, (e.tipos.get(b.tipo) ?? 0) + Number(b.total));
    porAno.set(b.ano_eleicao, e);
  }
  const anos = [...porAno.keys()].sort();
  const [anterior, atual] = anos.length >= 2 ? anos.slice(-2) : [undefined, anos[0]];
  const tipos =
    atual !== undefined && anterior !== undefined
      ? [...new Set([...porAno.get(anterior)!.tipos.keys(), ...porAno.get(atual)!.tipos.keys()])]
          .map((t) => ({ t, a: porAno.get(anterior)!.tipos.get(t) ?? 0, b: porAno.get(atual)!.tipos.get(t) ?? 0 }))
          .sort((x, y) => y.b - x.b)
          .slice(0, 6)
      : [];
  const maxTipo = Math.max(1, ...tipos.flatMap((r) => [r.a, r.b]));
  const maxAno = Math.max(1, ...anos.map((a) => porAno.get(a)!.total));
  const mil = (v: number) => (v >= 10_000 ? `${Math.round(v / 1000).toLocaleString("pt-BR")} mil` : brl(v));

  return (
    <section id="bens" aria-labelledby="bens-titulo" className={`${CARTAO} gap-3 sm:gap-4 sm:p-6`}>
      <h2 id="bens-titulo" className={H2}>
        <Dois curto="Bens declarados ao TSE" longo="Bens declarados à Justiça Eleitoral" />
      </h2>
      <p className="hidden text-sm leading-normal text-texto-2 sm:block">
        Valores informados pelo próprio candidato ao registrar a candidatura. São valores nominais, sem correção pela
        inflação, e muitas vezes refletem o preço de compra, não o de mercado.
        {perfil.parlamentar.casa === "senado" &&
          " Senadores disputam eleição a cada 8 anos, por isso os anos podem ser mais espaçados."}
      </p>
      {anos.length === 0 ? (
        <p className="text-muted-foreground">
          Não encontramos declarações de bens associadas a este{" "}
          {perfil.parlamentar.casa === "senado" ? "senador" : "deputado"} nas eleições de 2018, 2022 e 2026.
        </p>
      ) : (
        <>
          {/* Celular: uma barra por eleição (Mobile.dc.html:114-119). */}
          <ul className="flex flex-col gap-3 sm:hidden">
            {anos.map((a) => (
              <li key={a} className="flex flex-col gap-1">
                <div className="flex justify-between text-[13px]">
                  <span>Eleição {a}</span>
                  <strong>{brlCompacto(porAno.get(a)!.total)}</strong>
                </div>
                <div className="h-2.5 overflow-hidden rounded bg-muted">
                  <div
                    className="h-2.5 bg-primary"
                    style={{ width: `${Math.max(1, Math.round((porAno.get(a)!.total / maxAno) * 100))}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
          <p className="text-xs leading-normal text-muted-foreground sm:hidden">
            Valores nominais informados pelo candidato, sem correção pela inflação.
          </p>

          {/* Desktop: cartões por eleição e comparação por tipo (Main.dc.html:202-226). */}
          <ul className="hidden grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3 sm:grid">
            {anos.map((a, i) => {
              const e = porAno.get(a)!;
              const v = i > 0 ? variacaoNominal(porAno.get(anos[i - 1])!.total, e.total) : null;
              return (
                <li key={a} className="flex flex-col gap-1 rounded-[12px] border p-3.5">
                  <span className="text-[13px] text-muted-foreground">Eleição {a}</span>
                  <span className="font-heading text-[22px] font-bold">{brlCompacto(e.total)}</span>
                  <span className="text-xs text-muted-foreground">
                    {v === null
                      ? feminino(`Candidato a ${e.cargo.toLowerCase()}`, perfil.parlamentar.sexo).replace(/^C/, "c")
                      : `${v > 0 ? "+" : ""}${v}% sobre ${anos[i - 1]}`}
                  </span>
                </li>
              );
            })}
          </ul>
          {tipos.length > 0 && (
            <div className="hidden flex-col gap-3 sm:flex">
              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span aria-hidden="true" className="size-3 rounded-[3px] bg-anterior" />
                  {anterior}
                </span>
                <span className="flex items-center gap-1.5">
                  <span aria-hidden="true" className="size-3 rounded-[3px] bg-primary" />
                  {atual}
                </span>
              </div>
              <table className="sr-only">
                <caption>
                  Bens por tipo, {anterior} e {atual}
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Tipo</th>
                    <th scope="col">{anterior}</th>
                    <th scope="col">{atual}</th>
                  </tr>
                </thead>
                <tbody>
                  {tipos.map((r) => (
                    <tr key={r.t}>
                      <th scope="row">{r.t}</th>
                      <td>{brl(r.a)}</td>
                      <td>{brl(r.b)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {tipos.map((r) => (
                <div key={r.t} aria-hidden="true" className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                  <span className="w-[190px] text-[13px]">{r.t}</span>
                  <div className="flex flex-[1_1_240px] flex-col gap-[3px]">
                    <div
                      className="h-2.5 rounded-[3px] bg-anterior"
                      style={{ width: `${Math.max(0.5, (r.a / maxTipo) * 100)}%` }}
                    />
                    <div
                      className="h-2.5 rounded-[3px] bg-primary"
                      style={{ width: `${Math.max(0.5, (r.b / maxTipo) * 100)}%` }}
                    />
                  </div>
                  <span className="w-[150px] text-right text-[13px] text-muted-foreground tabular-nums">
                    {mil(r.a)} → {mil(r.b)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
      <NotaFonte
        rotulo="TSE, Dados Abertos (bens declarados), em lote"
        rotuloCurto="TSE, dados abertos em lote"
        coleta={perfil.coletas.tse_bem_candidato}
        linkOriginal="https://divulgacandcontas.tse.jus.br/"
        rotuloOriginal="Ver na DivulgaCand"
        parlamentarId={perfil.parlamentar.id}
        secao="bens"
      />
    </section>
  );
}

// ---------------------------------------------------------------- Lateral

function feminino(texto: string, sexo: string | null) {
  if (sexo !== "F") return texto;
  return texto
    .replace(/\bdeputado\b/g, "deputada")
    .replace(/\bsenador\b/g, "senadora")
    .replace(/\bgovernador\b/g, "governadora")
    .replace(/\bvereador\b/g, "vereadora")
    .replace(/\bprefeito\b/g, "prefeita")
    .replace(/\beleito\b/g, "eleita")
    .replace(/\bEleito\b/g, "Eleita")
    .replace(/\bCandidato\b/g, "Candidata");
}

/** Linha da candidatura no TSE: "Eleita deputada federal (SP), por média · mandato 2027–2031". */
function marcoCandidatura(c: Perfil["candidaturas"][number], sexo: string | null) {
  const cargo = c.cargo.toLowerCase();
  const sit = (c.situacao ?? "").toUpperCase();
  let texto: string;
  // Senado: "Eleito senador por MG" e "Eleita 1ª suplente de senador por MA" (artboard do senador).
  const suplenteSenado = /^(\d)º suplente$/.exec(cargo);
  if (sit.startsWith("ELEITO") && suplenteSenado) {
    const ordinal = `${suplenteSenado[1]}${sexo === "F" ? "ª" : "º"}`;
    return `${sexo === "F" ? "Eleita" : "Eleito"} ${ordinal} suplente de senador por ${c.sigla_uf}`;
  }
  if (sit.startsWith("ELEITO") && cargo === "senador") return feminino(`Eleito senador por ${c.sigla_uf}`, sexo);
  if (sit.startsWith("ELEITO")) {
    const via = sit.includes("MÉDIA") ? ", por média" : sit.includes("QP") ? ", por quociente partidário" : "";
    const mandato = cargo === "deputado federal" ? ` · mandato ${c.ano_eleicao + 1}–${c.ano_eleicao + 5}` : "";
    texto = `Eleito ${cargo} (${c.sigla_uf})${via}${mandato}`;
  } else if (sit === "SUPLENTE") {
    texto = `Suplente de ${cargo} (${c.sigla_uf})`;
  } else if (sit === "NÃO ELEITO") {
    texto = `Candidato a ${cargo} (${c.sigla_uf}), não eleito`;
  } else {
    texto = `Candidato a ${cargo} (${c.sigla_uf})`;
  }
  return feminino(texto, sexo);
}

export function Lateral({ perfil }: { perfil: Perfil }) {
  const { parlamentar: p, orgaos, candidaturas, coletas, suplentes } = perfil;
  const senado = p.casa === "senado";
  const comissoes = orgaos
    .filter((o) => /^comiss/i.test(o.nome_orgao) && /titular|presidente/i.test(o.cargo))
    .slice(0, 12);
  const leg = senado
    ? p.mandato_inicio && p.mandato_fim
      ? { inicio: p.mandato_inicio, fim: p.mandato_fim }
      : undefined
    : p.id_legislatura
      ? LEGISLATURAS[p.id_legislatura]
      : undefined;
  const cargoFederal = senado ? "SENADOR" : "DEPUTADO FEDERAL";
  const marcos = [
    ...candidaturas.map((c) => ({
      ano: c.ano_eleicao,
      texto: marcoCandidatura(c, p.sexo),
      federal: c.cargo.toUpperCase() === cargoFederal,
    })),
    ...(leg
      ? [
          {
            ano: Number(leg.inicio.slice(0, 4)),
            texto: senado
              ? `Posse para o mandato ${leg.inicio.slice(0, 4)}–${leg.fim.slice(0, 4)}`
              : `Início da ${p.id_legislatura}ª legislatura`,
            federal: true,
          },
        ]
      : []),
  ].sort((a, b) => b.ano - a.ano);
  const coletadoEm = (k: string) =>
    coletas[k] ? ` · coletado em ${dataHoraBr(coletas[k].coletado_em).slice(0, 10)}` : "";
  const fontesSenado = [
    {
      nome: "Senado Federal · Dados Abertos",
      href: p.source_url,
      det: `Mandato, suplentes, comissões, votações e orientações${coletadoEm("senado_api_senadores")}`,
    },
    {
      nome: "Senado Federal · CEAPS (dados administrativos)",
      href: coletas.senado_ceaps?.url ?? "https://adm.senado.gov.br/adm-dadosabertos/",
      det: `Notas da cota do senador${coletadoEm("senado_ceaps")}`,
    },
    {
      nome: "TSE · Dados Abertos (lote)",
      href: "https://dadosabertos.tse.jus.br/",
      det: `Candidaturas e bens, por eleição${coletadoEm("tse_bem_candidato")}`,
    },
    {
      nome: `Metodologia v${METODOLOGIA_VERSAO}`,
      href: "/metodologia#senado",
      det: "Regras públicas e versionadas, com as diferenças do Senado",
    },
  ];
  const fontesCamara = [
    {
      nome: "Câmara dos Deputados · API v2",
      href: p.source_url,
      det: `Mandato, partido e blocos${coletadoEm("camara_api_deputados")}`,
    },
    {
      nome: "Câmara dos Deputados · CEAP em lote",
      href: coletas.camara_ceap?.url ?? "https://www.camara.leg.br/cota-parlamentar/",
      det: `Notas da cota parlamentar${coletadoEm("camara_ceap")}`,
    },
    {
      nome: "Câmara dos Deputados · votações em lote",
      href: coletas.camara_lote_votos?.url ?? "https://dadosabertos.camara.leg.br/",
      det: `Votações, votos e orientações${coletadoEm("camara_lote_votos")}`,
    },
    {
      nome: "Portal da Transparência · Emendas (lote)",
      href: "https://portaldatransparencia.gov.br/download-de-dados/emendas-parlamentares",
      det: `Emendas e pagamentos por favorecido${coletadoEm("cgu_emendas")}`,
    },
    {
      nome: "Portal da Transparência · CEIS e CNEP (lote)",
      href: "https://portaldatransparencia.gov.br/download-de-dados/ceis",
      det: `Empresas sancionadas${coletadoEm("cgu_ceis")}`,
    },
    {
      nome: "TSE · Dados Abertos (lote)",
      href: "https://dadosabertos.tse.jus.br/",
      det: `Candidaturas e bens, por eleição${coletadoEm("tse_bem_candidato")}`,
    },
    { nome: `Metodologia v${METODOLOGIA_VERSAO}`, href: "/metodologia", det: "Regras públicas e versionadas" },
  ];
  const fontes = senado ? fontesSenado : fontesCamara;
  const situacao = p.em_exercicio ? "em exercício" : "fora de exercício";

  return (
    <aside className={`flex min-w-0 flex-col gap-4 sm:gap-5 lg:flex-[1_1_300px]`}>
      <section
        id="mandato"
        aria-labelledby="mandato-titulo"
        className={`${CARTAO} sm:gap-3.5 sm:p-5 ${senado ? "gap-2.5" : "gap-3.5"}`}
      >
        <h2 id="mandato-titulo" className={H2_LATERAL}>
          Mandato
        </h2>
        {senado && (
          // Celular: versão compacta do artboard SenadorMobile (Período, Situação, Bloco, Suplentes).
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-sm sm:hidden">
            <dt className="text-muted-foreground">Período</dt>
            <dd>{leg ? `${dataBr(leg.inicio)} a ${dataBr(leg.fim)}` : "—"}</dd>
            <dt className="text-muted-foreground">Situação</dt>
            <dd>{p.participacao ? `${p.participacao}, ${situacao}` : situacao}</dd>
            {p.bloco && (
              <>
                <dt className="text-muted-foreground">Bloco</dt>
                <dd>{p.bloco}</dd>
              </>
            )}
            {suplentes.length > 0 && (
              <>
                <dt className="text-muted-foreground">Suplentes</dt>
                <dd>{suplentes.map((s) => `${s.nome} (${s.ordem}${s.sexo === "F" ? "ª" : "º"})`).join(" · ")}</dd>
              </>
            )}
          </dl>
        )}
        <dl className={`grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-sm ${senado ? "max-sm:hidden" : ""}`}>
          <dt className="text-muted-foreground">Casa</dt>
          <dd>{senado ? "Senado Federal" : "Câmara dos Deputados"}</dd>
          <dt className="text-muted-foreground">UF</dt>
          <dd>{p.sigla_uf ? (NOME_UF[p.sigla_uf] ?? p.sigla_uf) : "—"}</dd>
          <dt className="text-muted-foreground">Início</dt>
          <dd>{leg ? dataBr(leg.inicio) : "—"}</dd>
          <dt className="text-muted-foreground">Fim previsto</dt>
          <dd>{leg ? dataBr(leg.fim) : "—"}</dd>
          <dt className="text-muted-foreground">Situação</dt>
          <dd>
            {senado && p.participacao
              ? `${p.participacao}, ${situacao}`
              : p.em_exercicio
                ? "Em exercício"
                : "Fora de exercício"}
          </dd>
          {senado && p.bloco && (
            <>
              <dt className="text-muted-foreground">Bloco</dt>
              <dd>{p.bloco}</dd>
            </>
          )}
        </dl>
        {senado && suplentes.length > 0 && (
          <div className="flex flex-col gap-3.5 max-sm:hidden">
            <h3 className="mt-1 text-sm font-bold">Suplentes</h3>
            <ul className="flex flex-col gap-1.5 text-sm">
              {suplentes.map((s) => (
                <li key={s.ordem} className="flex justify-between gap-2">
                  <span>{s.nome}</span>
                  <span className="shrink-0 text-muted-foreground">
                    {s.ordem}
                    {s.sexo === "F" ? "ª" : "º"} suplente
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-xs leading-normal text-muted-foreground">
              Quando um suplente assume, ele ganha perfil próprio e os gastos e votos ficam no nome de quem estava em
              exercício.
            </p>
          </div>
        )}
        {comissoes.length > 0 && (
          <div className={`flex flex-col gap-3.5 ${senado ? "max-sm:hidden" : ""}`}>
            <h3 className="mt-1 text-sm font-bold">Comissões como titular</h3>
            <ul className="flex list-disc flex-col gap-1 pl-[18px] text-sm">
              {comissoes.map((o) => (
                <li key={`${o.sigla_orgao}-${o.cargo}`}>
                  {senado
                    ? `${o.nome_orgao.replace(/^Comiss[ãa]o (de |da |do |das |dos )?/i, "")} (${o.sigla_orgao})`
                    : o.nome_orgao}
                  {/titular/i.test(o.cargo) ? null : <span className="text-muted-foreground"> · {o.cargo}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}
        {marcos.length > 0 && (
          <div className={`flex flex-col gap-3.5 ${senado ? "max-sm:hidden" : ""}`}>
            <h3 className="mt-1 text-sm font-bold">Linha do tempo</h3>
            <ol className="flex flex-col gap-2.5 text-[13px]">
              {marcos.map((m, i) => (
                <li key={i} className="flex gap-2.5">
                  <span
                    aria-hidden="true"
                    className={`mt-1 size-2.5 shrink-0 rounded-full ${m.federal ? "bg-primary" : "bg-anterior"}`}
                  />
                  <span>
                    <strong>{m.ano}</strong> · {m.texto}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        )}
        <p className={`text-xs text-muted-foreground ${senado ? "max-sm:hidden" : ""}`}>
          {senado
            ? `Fonte: Senado, Dados Abertos /senador/${codigoSenado(p.id)} · TSE (candidaturas). `
            : `Fonte: Câmara, API v2 /deputados/${p.id} e /legislaturas · TSE (candidaturas). `}
          <a href={p.source_url} target="_blank" rel="noopener noreferrer">
            Ver na fonte
          </a>
        </p>
      </section>

      <section id="fontes" aria-labelledby="fontes-titulo" className={`${CARTAO} gap-3 sm:p-5`}>
        <h2 id="fontes-titulo" className={H2_LATERAL}>
          De onde vêm os dados
        </h2>
        <ul className="flex flex-col gap-2.5">
          {fontes.map((f) => (
            <li key={f.nome} className="flex flex-col gap-0.5 border-b border-borda-suave pb-2.5">
              {f.href.startsWith("/") ? (
                <Link href={f.href} className="text-sm font-semibold">
                  {f.nome}
                </Link>
              ) : (
                <a href={f.href} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold">
                  {f.nome}
                </a>
              )}
              <span className="text-xs text-muted-foreground">{f.det}</span>
            </li>
          ))}
        </ul>
        <p className="text-xs leading-normal text-muted-foreground">
          Só usamos dados que os órgãos já publicam. Cada registro guarda link e data de coleta.{" "}
          <Link href="/fontes">Ver todas as coletas</Link>
        </p>
      </section>

      <ComoLigamosEmendas />

      <section
        aria-labelledby="erro-titulo"
        className={`flex flex-col gap-2 rounded-[14px] bg-secondary p-4 sm:gap-2.5 sm:rounded-[16px] sm:p-5`}
      >
        <h2 id="erro-titulo" className="font-heading text-[17px] font-bold sm:text-lg">
          Encontrou um erro?
        </h2>
        <p className="text-[13px] leading-[1.45] text-texto-2 sm:text-sm sm:leading-normal">
          <Dois
            curto={
              senado
                ? "Qualquer pessoa pode pedir correção de um dado deste perfil."
                : "Qualquer pessoa pode pedir correção."
            }
            longo={
              senado
                ? "Senadores, assessorias e qualquer pessoa podem pedir correção de um dado deste perfil."
                : "Parlamentares, assessorias e qualquer pessoa podem pedir correção. Registramos cada pedido e toda alteração."
            }
          />
        </p>
        <Link
          href={`/parlamentares/${p.id}/contestar`}
          className={`${BOTAO_PRIMARIO.replace("px-[18px]", "px-4")} self-start`}
        >
          Pedir correção
        </Link>
        <p className="hidden text-[13px] text-texto-2 sm:block">
          Pedidos de correção recebidos para este perfil: {perfil.correcoes}
        </p>
      </section>
    </aside>
  );
}
