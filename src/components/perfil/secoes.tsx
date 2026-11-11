import Link from "next/link";
import type { Perfil } from "@/data/perfil";
import { brl, brlCompacto, dataBr, MESES, pct } from "@/lib/format";
import { variacaoNominal } from "@/lib/metrics";
import { NotaFonte } from "./fonte";

/** "LOCAÇÃO OU FRETAMENTO" → "Locação ou fretamento". */
function fraseCase(s: string) {
  const l = s.toLowerCase().replace(/\.$/, "");
  return l.charAt(0).toUpperCase() + l.slice(1);
}

function Secao({ id, titulo, children }: { id: string; titulo: string; children: React.ReactNode }) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-titulo`}
      className="scroll-mt-4 space-y-4 rounded-lg border bg-superficie p-5"
    >
      <h2 id={`${id}-titulo`} className="font-heading text-xl font-bold">
        {titulo}
      </h2>
      {children}
    </section>
  );
}

export function Indicador({ titulo, valor, detalhe }: { titulo: string; valor: string; detalhe: string }) {
  return (
    <div className="rounded-lg border bg-superficie p-4">
      <p className="text-sm text-muted-foreground">{titulo}</p>
      <p className="mt-1 font-heading text-2xl font-bold">{valor}</p>
      <p className="mt-1 text-xs text-muted-foreground">{detalhe}</p>
    </div>
  );
}

// ---------------------------------------------------------------- CEAP

export function SecaoGastos({ perfil }: { perfil: Perfil }) {
  const { ceap, ano, parlamentar } = perfil;
  const max = Math.max(1, ...ceap.porMes.map((m) => m.total));
  const meses = Array.from({ length: 12 }, (_, i) => ceap.porMes.find((m) => m.mes === i + 1)?.total ?? null);
  const maiorTipo = ceap.porTipo[0]?.total ?? 1;

  return (
    <Secao id="gastos" titulo="Gastos da cota parlamentar (CEAP)">
      <nav aria-label="Ano dos gastos" className="flex flex-wrap gap-2">
        {perfil.anosDisponiveis.map((a) => (
          <Link
            key={a}
            href={`/parlamentares/${parlamentar.id}?ano=${a}#gastos`}
            aria-current={a === ano ? "page" : undefined}
            className={`rounded-full border px-3 py-1 text-sm no-underline ${
              a === ano ? "border-primary bg-secondary text-secondary-foreground" : "text-muted-foreground"
            }`}
          >
            {a}
          </Link>
        ))}
      </nav>

      {ceap.documentos === 0 ? (
        <p className="text-muted-foreground">Nenhuma despesa publicada para {ano}.</p>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {brl(ceap.totalAno)} em {ceap.documentos.toLocaleString("pt-BR")} documentos em {ano}. Valores líquidos, já
            descontadas as glosas.
          </p>

          <figure className="space-y-2">
            <figcaption className="text-sm font-medium">Gasto mensal em {ano}</figcaption>
            <div
              className="flex h-44 items-end gap-1 sm:gap-2"
              role="img"
              aria-label={`Gasto mensal da cota em ${ano}`}
            >
              {meses.map((v, i) => (
                <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                  {v !== null && (
                    <span className="hidden text-[10px] text-muted-foreground sm:block">
                      {(v / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}k
                    </span>
                  )}
                  <div
                    className={`w-full rounded-t ${v === null ? "bg-muted" : "bg-primary"}`}
                    style={{ height: `${v === null ? 2 : Math.max(2, Math.round((v / max) * 100))}%` }}
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-1 sm:gap-2" aria-hidden="true">
              {MESES.map((m) => (
                <span key={m} className="flex-1 text-center text-[10px] text-muted-foreground sm:text-xs">
                  {m}
                </span>
              ))}
            </div>
            <table className="sr-only">
              <caption>Gasto mensal em {ano}</caption>
              <tbody>
                {ceap.porMes.map((m) => (
                  <tr key={m.mes}>
                    <th scope="row">{MESES[m.mes - 1]}</th>
                    <td>{brl(m.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </figure>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-3">
              <h3 className="font-medium">Por tipo de despesa</h3>
              <ul className="space-y-2">
                {ceap.porTipo.slice(0, 8).map((t) => (
                  <li key={t.tipo} className="space-y-1">
                    <div className="flex justify-between gap-3 text-sm">
                      <span>{fraseCase(t.tipo)}</span>
                      <span className="shrink-0 text-muted-foreground">
                        {brl(t.total)} · {pct(t.total, ceap.totalAno)}%
                      </span>
                    </div>
                    <div className="h-2 rounded bg-muted">
                      <div
                        className="h-2 rounded bg-chart-2"
                        style={{ width: `${Math.max(1, Math.round((t.total / maiorTipo) * 100))}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-3">
              <h3 className="font-medium">Maiores fornecedores</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th scope="col" className="py-2 pr-2 font-medium">
                        Fornecedor
                      </th>
                      <th scope="col" className="py-2 pr-2 font-medium">
                        CNPJ/CPF
                      </th>
                      <th scope="col" className="py-2 text-right font-medium">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {ceap.fornecedores.map((f, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-2 pr-2">{f.fornecedor_nome}</td>
                        <td className="py-2 pr-2 font-mono text-xs whitespace-nowrap">{f.fornecedor_doc ?? "—"}</td>
                        <td className="py-2 text-right whitespace-nowrap">{brl(f.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted-foreground">
                CPF de pessoa física aparece mascarado e sem nome, no padrão da Receita Federal.
              </p>
            </div>
          </div>
        </>
      )}
      <NotaFonte
        rotulo="Câmara dos Deputados, Dados Abertos (CEAP, arquivo anual)"
        coleta={perfil.coletas.camara_ceap}
        parlamentarId={parlamentar.id}
        secao="gastos"
      />
    </Secao>
  );
}

// ---------------------------------------------------------------- Votações

const ROTULO_TIPO = { partido: "Partido", federacao: "Federação", bloco: "Bloco" } as const;

function corVoto(voto: string | null, orientacao: string | null) {
  if (!voto) return "bg-muted text-foreground";
  if (orientacao && (orientacao === "Sim" || orientacao === "Não") && (voto === "Sim" || voto === "Não")) {
    return voto === orientacao ? "bg-secondary text-secondary-foreground" : "bg-aviso-fundo text-aviso";
  }
  return "bg-muted text-foreground";
}

export function SecaoVotacoes({ perfil, filtro }: { perfil: Perfil; filtro: "todas" | "divergiu" | "ausencias" }) {
  const { votacoes, parlamentar, ano } = perfil;
  const lista = votacoes.lista.filter((v) => {
    if (filtro === "ausencias") return !v.voto;
    if (filtro === "divergiu")
      return (
        !!v.voto &&
        (v.voto === "Sim" || v.voto === "Não") &&
        (v.orientacao === "Sim" || v.orientacao === "Não") &&
        v.voto !== v.orientacao
      );
    return true;
  });
  const filtros = [
    ["todas", "Todas"],
    ["divergiu", "Divergiu da orientação"],
    ["ausencias", "Sem voto registrado"],
  ] as const;

  return (
    <Secao id="votacoes" titulo={`Votações nominais no Plenário em ${ano}`}>
      <nav aria-label="Filtrar votações" className="flex flex-wrap gap-2">
        {filtros.map(([k, r]) => (
          <Link
            key={k}
            href={`/parlamentares/${parlamentar.id}?ano=${ano}&votos=${k}#votacoes`}
            aria-current={filtro === k ? "page" : undefined}
            className={`rounded-full border px-3 py-1 text-sm no-underline ${
              filtro === k ? "border-primary bg-secondary text-secondary-foreground" : "text-muted-foreground"
            }`}
          >
            {r}
          </Link>
        ))}
      </nav>
      {lista.length === 0 ? (
        <p className="text-muted-foreground">Nenhuma votação neste filtro.</p>
      ) : (
        <ul className="divide-y">
          {lista.slice(0, 30).map((v) => (
            <li key={v.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">{dataBr(v.data)}</p>
                <p className="text-sm">
                  <a href={v.source_url} target="_blank" rel="noopener noreferrer">
                    {v.descricao}
                  </a>
                </p>
                {v.proposicao && <p className="line-clamp-2 text-xs text-muted-foreground">{v.proposicao}</p>}
              </div>
              <div className="flex shrink-0 flex-wrap gap-2 text-xs">
                <span className="rounded bg-muted px-2 py-1">
                  {v.tipoOrientacao ? `${ROTULO_TIPO[v.tipoOrientacao]}: ${v.orientacao}` : "Sem orientação"}
                </span>
                <span className={`rounded px-2 py-1 font-medium ${corVoto(v.voto, v.orientacao)}`}>
                  Votou: {v.voto ?? "sem registro"}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
      {lista.length > 30 && <p className="text-xs text-muted-foreground">Mostrando 30 de {lista.length} votações.</p>}
      <NotaFonte
        rotulo="Câmara dos Deputados, Dados Abertos (votações, votos e orientações, arquivos anuais)"
        coleta={perfil.coletas.camara_lote_votos}
        parlamentarId={parlamentar.id}
        secao="votacoes"
      />
    </Secao>
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
  const [anterior, atual] = anos.slice(-2);
  const tipos = atual
    ? [...new Set([...(porAno.get(anterior)?.tipos.keys() ?? []), ...porAno.get(atual)!.tipos.keys()])]
        .map((t) => ({ t, a: porAno.get(anterior)?.tipos.get(t) ?? 0, b: porAno.get(atual)!.tipos.get(t) ?? 0 }))
        .sort((x, y) => y.b - x.b)
    : [];

  return (
    <Secao id="bens" titulo="Bens declarados à Justiça Eleitoral">
      <p className="text-sm text-muted-foreground">
        Valores informados pelo próprio candidato ao registrar a candidatura. São nominais, sem correção pela inflação,
        e muitas vezes refletem o preço de compra, não o de mercado.
      </p>
      {anos.length === 0 ? (
        <p className="text-muted-foreground">
          Não encontramos declarações de bens associadas a este deputado nas eleições de 2018, 2022 e 2026.
        </p>
      ) : (
        <>
          <ul className="grid gap-3 sm:grid-cols-3">
            {anos.map((a, i) => {
              const e = porAno.get(a)!;
              const v = i > 0 ? variacaoNominal(porAno.get(anos[i - 1])!.total, e.total) : null;
              return (
                <li key={a} className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">
                    Eleição {a} · {e.cargo.toLowerCase()}
                  </p>
                  <p className="font-heading text-xl font-bold">{brlCompacto(e.total)}</p>
                  <p className="text-xs text-muted-foreground">
                    {v === null ? "primeira declaração na série" : `${v > 0 ? "+" : ""}${v}% em valor nominal`}
                  </p>
                </li>
              );
            })}
          </ul>
          {anterior !== undefined && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <caption className="mb-2 text-left font-medium">
                  Por tipo de bem, {anterior} e {atual}
                </caption>
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th scope="col" className="py-2 pr-2 font-medium">
                      Tipo
                    </th>
                    <th scope="col" className="py-2 pr-2 text-right font-medium">
                      {anterior}
                    </th>
                    <th scope="col" className="py-2 text-right font-medium">
                      {atual}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tipos.slice(0, 10).map((r) => (
                    <tr key={r.t} className="border-b last:border-0">
                      <td className="py-2 pr-2">{r.t}</td>
                      <td className="py-2 pr-2 text-right whitespace-nowrap">{brl(r.a)}</td>
                      <td className="py-2 text-right whitespace-nowrap">{brl(r.b)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Mostramos só o tipo e o valor. A descrição livre de cada bem pode conter endereço e fica de fora.
          </p>
        </>
      )}
      <NotaFonte
        rotulo="TSE, Portal de Dados Abertos (candidatos e bens declarados), download em lote"
        coleta={perfil.coletas.tse_bem_candidato}
        linkOriginal="https://divulgacandcontas.tse.jus.br/"
        parlamentarId={perfil.parlamentar.id}
        secao="bens"
      />
    </Secao>
  );
}

// ---------------------------------------------------------------- Lateral

export function Lateral({ perfil }: { perfil: Perfil }) {
  const { parlamentar: p, orgaos, candidaturas } = perfil;
  const comissoes = orgaos.filter((o) => /titular|presidente|vice/i.test(o.cargo)).slice(0, 12);
  return (
    <aside className="space-y-4">
      <section aria-labelledby="mandato-titulo" className="space-y-3 rounded-lg border bg-superficie p-5">
        <h2 id="mandato-titulo" className="font-heading text-lg font-bold">
          Mandato
        </h2>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          <dt className="text-muted-foreground">Casa</dt>
          <dd>Câmara dos Deputados</dd>
          <dt className="text-muted-foreground">UF</dt>
          <dd>{p.sigla_uf ?? "—"}</dd>
          <dt className="text-muted-foreground">Legislatura</dt>
          <dd>{p.id_legislatura ? `${p.id_legislatura}ª` : "—"}</dd>
          <dt className="text-muted-foreground">Situação</dt>
          <dd>{p.em_exercicio ? "Em exercício" : "Fora de exercício"}</dd>
        </dl>
        {comissoes.length > 0 && (
          <>
            <h3 className="pt-2 text-sm font-medium">Órgãos e comissões (cargo atual)</h3>
            <ul className="space-y-1 text-sm">
              {comissoes.map((o) => (
                <li key={`${o.sigla_orgao}-${o.cargo}`}>
                  {o.nome_orgao} <span className="text-muted-foreground">· {o.cargo}</span>
                </li>
              ))}
            </ul>
          </>
        )}
        {candidaturas.length > 0 && (
          <>
            <h3 className="pt-2 text-sm font-medium">Candidaturas no TSE</h3>
            <ul className="space-y-1 text-sm">
              {candidaturas.map((c) => (
                <li key={c.sq_candidato}>
                  {c.ano_eleicao} · {c.cargo.toLowerCase()} ({c.sigla_uf})
                  {c.situacao ? <span className="text-muted-foreground"> · {c.situacao.toLowerCase()}</span> : null}
                </li>
              ))}
            </ul>
          </>
        )}
        <p className="text-xs text-muted-foreground">
          Fonte: Câmara, API v2 e arquivo de órgãos · TSE, candidatos.{" "}
          <a href={p.source_url} target="_blank" rel="noopener noreferrer">
            Ver na fonte
          </a>
        </p>
      </section>

      <section aria-labelledby="erro-titulo" className="space-y-2 rounded-lg border bg-superficie p-5">
        <h2 id="erro-titulo" className="font-heading text-lg font-bold">
          Encontrou um erro?
        </h2>
        <p className="text-sm text-muted-foreground">
          Parlamentares, assessorias e qualquer pessoa podem pedir correção. Registramos cada pedido e cada alteração.
        </p>
        <Link
          href={`/parlamentares/${p.id}/contestar`}
          className="inline-flex h-10 items-center rounded-md border border-primary px-4 text-sm font-medium no-underline"
        >
          Pedir correção
        </Link>
        <p className="text-xs text-muted-foreground">Pedidos recebidos para este perfil: {perfil.correcoes}</p>
      </section>
    </aside>
  );
}
