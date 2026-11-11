import "server-only";
import { sql } from "kysely";
import { getDb } from "@/db/client";
import { tetoDaUf } from "@/data/teto-ceap";
import {
  alinhamento,
  orientacaoDoPartido,
  ORGAO_PLENARIO,
  tetoAcumulado,
  type BlocoParlamentar,
  type VotoComOrientacoes,
} from "@/lib/metrics";
import { orientacaoDaLideranca, ORGAO_PLENARIO_SENADO, presencaSenado } from "@/lib/senado";

export type ResultadoBusca = {
  id: number;
  nome: string;
  sigla_partido: string | null;
  sigla_uf: string | null;
  url_foto: string | null;
  em_exercicio: boolean;
};

const UFS = new Set("AC AL AM AP BA CE DF ES GO MA MG MS MT PA PB PE PI PR RJ RN RO RR RS SC SE SP TO".split(" "));

/** "sp" ou "SP" na busca também filtra pela UF; nomes continuam valendo. */
export function ufDaBusca(q: string | undefined): string | null {
  const t = (q ?? "").trim().toUpperCase();
  return UFS.has(t) ? t : null;
}

export async function buscarParlamentares(opts: {
  q?: string;
  uf?: string;
  todos?: boolean;
  limite?: number;
}): Promise<ResultadoBusca[]> {
  const db = getDb();
  let query = db
    .selectFrom("parlamentar")
    .select(["id", "nome", "sigla_partido", "sigla_uf", "url_foto", "em_exercicio"])
    .orderBy("nome")
    .limit(opts.limite ?? 60);
  if (!opts.todos) query = query.where("em_exercicio", "=", true);
  if (opts.uf) query = query.where("sigla_uf", "=", opts.uf);
  const q = opts.q?.trim();
  if (q) {
    const padrao = `%${q.replace(/[%_\\]/g, "\\$&")}%`;
    const ufBuscada = ufDaBusca(q);
    query = query.where(({ or, eb }) =>
      or([
        ...(ufBuscada ? [eb("sigla_uf", "=", ufBuscada)] : []),
        eb(sql`unaccent(lower(nome))`, "like", sql`unaccent(lower(${padrao}))`),
        eb(sql`unaccent(lower(coalesce(nome_civil, '')))`, "like", sql`unaccent(lower(${padrao}))`),
      ]),
    );
  }
  return query.execute();
}

export async function ufsDisponiveis(): Promise<string[]> {
  const rows = await getDb()
    .selectFrom("parlamentar")
    .select("sigla_uf")
    .distinct()
    .where("em_exercicio", "=", true)
    .where("sigla_uf", "is not", null)
    .orderBy("sigla_uf")
    .execute();
  return rows.map((r) => r.sigla_uf!);
}

/**
 * Última coleta de cada fonte, para a proveniência exibida (R1). A CEAP sai em um arquivo por ano:
 * a coleta exibida é a do arquivo do ano mostrado (`anoCeap`), não a do último arquivo baixado.
 */
async function coletasRecentes(anoCeap: number, casa: "camara" | "senado" = "camara") {
  const db = getDb();
  // Cada perfil mostra as fontes da própria Casa e as do TSE.
  const prefixo = casa === "senado" ? "senado_%" : "camara_%";
  const rows = await db
    .selectFrom("coleta")
    .select(["fonte", "url", "coletado_em", "sha256", "licenca"])
    .where((eb) => eb.or([eb("fonte", "like", prefixo), eb("fonte", "like", "tse_%")]))
    .distinctOn("fonte")
    .orderBy("fonte")
    .orderBy("coletado_em", "desc")
    .execute();
  const porFonte = Object.fromEntries(rows.map((r) => [r.fonte, r]));
  const [fonteCota, urlDoAno] =
    casa === "senado" ? ["senado_ceaps", `%/despesas_ceaps/${anoCeap}`] : ["camara_ceap", `%/Ano-${anoCeap}.csv.zip`];
  const ceapDoAno = await db
    .selectFrom("coleta")
    .select(["fonte", "url", "coletado_em", "sha256", "licenca"])
    .where("fonte", "=", fonteCota)
    .where("url", "like", urlDoAno)
    .orderBy("coletado_em", "desc")
    .executeTakeFirst();
  if (ceapDoAno) porFonte[fonteCota] = ceapDoAno;
  return porFonte;
}

/** Blocos (não federações) da legislatura com a composição completa, para orientações de bloco. */
async function blocosDaLegislatura(idLegislatura: number | null): Promise<BlocoParlamentar[]> {
  if (!idLegislatura) return [];
  const rows = await getDb()
    .selectFrom("bloco")
    .innerJoin("bloco_partido", "bloco_partido.bloco_id", "bloco.id")
    .select(["bloco.id", "bloco.nome", "bloco_partido.sigla_partido"])
    .where("bloco.id_legislatura", "=", idLegislatura)
    .where("bloco.federacao", "=", false)
    .execute();
  const porId = new Map<number, BlocoParlamentar>();
  for (const r of rows) {
    const b = porId.get(r.id) ?? { nome: r.nome, partidos: [] };
    b.partidos.push(r.sigla_partido);
    porId.set(r.id, b);
  }
  return [...porId.values()];
}

export type Coleta = Awaited<ReturnType<typeof coletasRecentes>>[string];

/** `"mandato"`: soma de todos os anos da CEAP coletados na legislatura atual. */
export type PeriodoCeap = number | "mandato";

/**
 * Presença média dos deputados em exercício nas votações nominais do Plenário do ano:
 * média simples da presença de cada um (votos não vazios ÷ votações do ano), em %.
 */
async function presencaMediaDaCamara(ano: number): Promise<number | null> {
  const r = await getDb()
    .selectFrom("voto")
    .innerJoin("votacao", "votacao.id", "voto.votacao_id")
    .innerJoin("parlamentar", "parlamentar.id", "voto.parlamentar_id")
    .select(sql<string>`count(*) filter (where voto.voto <> '')`.as("presentes"))
    .select(sql<string>`count(distinct voto.parlamentar_id)`.as("deputados"))
    .select(sql<string>`count(distinct voto.votacao_id)`.as("votacoes"))
    .where("votacao.sigla_orgao", "=", ORGAO_PLENARIO)
    .where("votacao.data", ">=", `${ano}-01-01`)
    .where("votacao.data", "<=", `${ano}-12-31`)
    .where("parlamentar.em_exercicio", "=", true)
    .executeTakeFirst();
  const dep = Number(r?.deputados ?? 0);
  const vot = Number(r?.votacoes ?? 0);
  return dep && vot ? Math.round((Number(r!.presentes) / (dep * vot)) * 100) : null;
}

/**
 * Presença média dos senadores em exercício nas votações nominais do Plenário do Senado no ano:
 * média simples da presença de cada um, pela regra de `presencaSenado` (SPRES-04).
 */
async function presencaMediaDoSenado(ano: number): Promise<number | null> {
  const rows = await getDb()
    .selectFrom("voto")
    .innerJoin("votacao", "votacao.id", "voto.votacao_id")
    .innerJoin("parlamentar", "parlamentar.id", "voto.parlamentar_id")
    .select(["voto.parlamentar_id", "voto.voto"])
    .where("votacao.sigla_orgao", "=", ORGAO_PLENARIO_SENADO)
    .where("votacao.data", ">=", `${ano}-01-01`)
    .where("votacao.data", "<=", `${ano}-12-31`)
    .where("parlamentar.em_exercicio", "=", true)
    .execute();
  const porSenador = new Map<number, string[]>();
  for (const r of rows) porSenador.set(r.parlamentar_id, [...(porSenador.get(r.parlamentar_id) ?? []), r.voto]);
  const pcts = [...porSenador.values()].map((v) => presencaSenado(v).percentual).filter((x): x is number => x !== null);
  return pcts.length ? Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length) : null;
}

export async function perfilParlamentar(id: number, anoPedido?: PeriodoCeap) {
  const db = getDb();
  const p = await db
    .selectFrom("parlamentar")
    .select([
      "id",
      "casa",
      "nome",
      "nome_civil",
      "sigla_partido",
      "sigla_uf",
      "url_foto",
      "em_exercicio",
      "sexo",
      "id_legislatura",
      "source_url",
      "mandato_inicio",
      "mandato_fim",
      "participacao",
      "bloco",
    ])
    .where("id", "=", id)
    .executeTakeFirst();
  if (!p) return null;

  const anos = await db
    .selectFrom("despesa_ceap")
    .select("ano")
    .distinct()
    .where("parlamentar_id", "=", id)
    .orderBy("ano", "desc")
    .execute();
  const anoMaisRecente = anos[0]?.ano ?? new Date().getFullYear();
  const mandato = anoPedido === "mandato" && anos.length > 0;
  const ano = typeof anoPedido === "number" && anos.some((a) => a.ano === anoPedido) ? anoPedido : anoMaisRecente;
  const anosCeap = mandato ? anos.map((a) => a.ano) : [ano];

  const [porMes, porTipo, fornecedores, totalDocs, ultimoMesGeral] = await Promise.all([
    db
      .selectFrom("despesa_ceap")
      .select(["ano", "mes", sql<string>`sum(valor_liquido)`.as("total")])
      .where("parlamentar_id", "=", id)
      .where("ano", "in", anosCeap)
      .groupBy(["ano", "mes"])
      .orderBy("ano")
      .orderBy("mes")
      .execute(),
    db
      .selectFrom("despesa_ceap")
      .select(["tipo_despesa", sql<string>`sum(valor_liquido)`.as("total")])
      .where("parlamentar_id", "=", id)
      .where("ano", "in", anosCeap)
      .groupBy("tipo_despesa")
      .orderBy(sql`sum(valor_liquido)`, "desc")
      .execute(),
    db
      .selectFrom("despesa_ceap")
      // Mesmo CNPJ com grafias diferentes ("VED Imóveis" e "VED IMOVEIS") é um fornecedor só: agrupa pelo
      // documento e mostra o nome mais frequente. Pessoa física (CPF mascarado) segue por nome + documento.
      .select([
        sql<string>`mode() within group (order by fornecedor_nome)`.as("fornecedor_nome"),
        "fornecedor_doc",
        "fornecedor_classe",
        sql<string>`sum(valor_liquido)`.as("total"),
        sql<string>`count(*)`.as("documentos"),
      ])
      .where("parlamentar_id", "=", id)
      .where("ano", "in", anosCeap)
      .groupBy([
        sql`case when fornecedor_classe = 'pessoa_juridica' and fornecedor_doc is not null then fornecedor_doc else fornecedor_nome || '|' || coalesce(fornecedor_doc, '') end`,
        "fornecedor_doc",
        "fornecedor_classe",
      ])
      .orderBy(sql`sum(valor_liquido)`, "desc")
      .limit(5)
      .execute(),
    db
      .selectFrom("despesa_ceap")
      .select(sql<string>`count(*)`.as("n"))
      .where("parlamentar_id", "=", id)
      .where("ano", "in", anosCeap)
      .executeTakeFirstOrThrow(),
    // Último mês publicado na base da mesma Casa: base do teto acumulado.
    db
      .selectFrom("despesa_ceap")
      .select(sql<number>`max(mes)`.as("mes"))
      .where("ano", "=", ano)
      .where("parlamentar_id", "in", db.selectFrom("parlamentar").select("id").where("casa", "=", p.casa))
      .executeTakeFirst(),
  ]);

  const totalAno = porMes.reduce((a, m) => a + Number(m.total), 0);
  const senado = p.casa === "senado";
  // O Senado não publica teto da CEAPS por UF em formato aberto (SCEAPS-06).
  const teto = mandato || senado ? null : tetoDaUf(p.sigla_uf, ano);
  const orgaoPlenario = senado ? ORGAO_PLENARIO_SENADO : ORGAO_PLENARIO;
  const ultimoMes = ultimoMesGeral?.mes ?? 0;

  // Votações nominais do Plenário (presença e alinhamento) do ano mais recente com votações:
  // o filtro de ano é só dos gastos, como no protótipo.
  const ultimaVotacao = await db
    .selectFrom("votacao")
    .select(sql<number>`max(extract(year from data))::int`.as("ano"))
    .where("sigla_orgao", "=", orgaoPlenario)
    .executeTakeFirst();
  const anoVotos = ultimaVotacao?.ano ?? ano;
  const plenario = await db
    .selectFrom("votacao")
    .select([
      "id",
      "data",
      "descricao",
      "proposicao",
      "proposicao_sigla",
      "proposicao_ementa",
      "aprovacao",
      "secreta",
      "source_url",
    ])
    .where("sigla_orgao", "=", orgaoPlenario)
    .where("data", ">=", `${anoVotos}-01-01`)
    .where("data", "<=", `${anoVotos}-12-31`)
    .orderBy("data", "desc")
    .orderBy("id", "desc")
    .execute();
  const idsPlen = plenario.map((v) => v.id);
  const blocos = senado ? [] : await blocosDaLegislatura(p.id_legislatura);
  const [votos, orientacoes] = idsPlen.length
    ? await Promise.all([
        db
          .selectFrom("voto")
          .select(["votacao_id", "voto", "sigla_partido"])
          .where("parlamentar_id", "=", id)
          .where("votacao_id", "in", idsPlen)
          .execute(),
        db
          .selectFrom("orientacao")
          .select(["votacao_id", "sigla_bancada", "orientacao"])
          .where("votacao_id", "in", idsPlen)
          .execute(),
      ])
    : [[], []];
  const orientPorVotacao = new Map<string, { siglaBancada: string; orientacao: string }[]>();
  for (const o of orientacoes) {
    const l = orientPorVotacao.get(o.votacao_id) ?? [];
    l.push({ siglaBancada: o.sigla_bancada, orientacao: o.orientacao });
    orientPorVotacao.set(o.votacao_id, l);
  }
  const votoPorVotacao = new Map(votos.map((v) => [v.votacao_id, v]));
  /**
   * Senado: vale só a orientação da liderança do próprio partido (SALI-01). Ela entra na lista
   * com a sigla do partido como bancada, e o resto das regras de alinhamento é o mesmo da Câmara.
   */
  const orientacoesDoVoto = (votacaoId: string, siglaPartido: string | null) => {
    const todas = orientPorVotacao.get(votacaoId) ?? [];
    if (!senado) return todas;
    const o = orientacaoDaLideranca(siglaPartido, todas);
    return o && siglaPartido ? [{ siglaBancada: siglaPartido, orientacao: o }] : [];
  };
  const comOrientacao: VotoComOrientacoes[] = votos.map((v) => ({
    voto: v.voto,
    siglaPartido: v.sigla_partido ?? p.sigla_partido,
    orientacoes: orientacoesDoVoto(v.votacao_id, v.sigla_partido ?? p.sigla_partido),
  }));
  const presencaSen = senado ? presencaSenado(votos.map((v) => v.voto)) : null;
  const presentes = presencaSen ? presencaSen.presentes : votos.filter((v) => v.voto !== "").length;
  // Câmara: votações do ano; Senado: votações com registro do senador, sem licenças (SPRES-03).
  const denominadorPresenca = presencaSen ? presencaSen.denominador : plenario.length;
  const alin = alinhamento(comOrientacao, blocos);

  const listaVotacoes = plenario.map((v) => {
    const voto = votoPorVotacao.get(v.id);
    const orient = orientacaoDoPartido(
      {
        voto: voto?.voto ?? "",
        siglaPartido: voto?.sigla_partido ?? p.sigla_partido,
        orientacoes: orientacoesDoVoto(v.id, voto?.sigla_partido ?? p.sigla_partido),
      },
      blocos,
    );
    return {
      ...v,
      voto: voto?.voto || null,
      orientacao: orient?.orientacao ?? null,
      tipoOrientacao: orient?.tipo ?? null,
    };
  });

  // Bens declarados ao TSE por eleição.
  const bens = await db
    .selectFrom("bem_declarado")
    .innerJoin("candidatura", (j) =>
      j
        .onRef("candidatura.sq_candidato", "=", "bem_declarado.sq_candidato")
        .onRef("candidatura.ano_eleicao", "=", "bem_declarado.ano_eleicao"),
    )
    .select([
      "bem_declarado.ano_eleicao",
      "bem_declarado.tipo",
      "candidatura.cargo",
      sql<string>`sum(bem_declarado.valor)`.as("total"),
      sql<string>`count(*)`.as("itens"),
    ])
    .where("bem_declarado.parlamentar_id", "=", id)
    .groupBy(["bem_declarado.ano_eleicao", "bem_declarado.tipo", "candidatura.cargo"])
    .orderBy("bem_declarado.ano_eleicao")
    .execute();
  const candidaturas = await db
    .selectFrom("candidatura")
    .select(["ano_eleicao", "cargo", "sigla_uf", "sigla_partido", "situacao", "sq_candidato"])
    .where("parlamentar_id", "=", id)
    .orderBy("ano_eleicao", "desc")
    .execute();

  const orgaos = await db
    .selectFrom("orgao_membro")
    .select(["sigla_orgao", "nome_orgao", "cargo", "data_inicio", "data_fim"])
    .where("parlamentar_id", "=", id)
    .where("data_fim", "is", null)
    .orderBy("nome_orgao")
    .execute();

  const correcoes = await db
    .selectFrom("pedido_correcao")
    .select(sql<string>`count(*)`.as("n"))
    .where("parlamentar_id", "=", id)
    .executeTakeFirstOrThrow();

  const mediaPresenca = senado ? await presencaMediaDoSenado(anoVotos) : await presencaMediaDaCamara(anoVotos);

  const suplentes = senado
    ? await db
        .selectFrom("suplente")
        .select(["ordem", "nome"])
        .where("parlamentar_id", "=", id)
        .orderBy("ordem")
        .execute()
    : [];

  return {
    parlamentar: p,
    ano,
    mandato,
    anosDisponiveis: anos.map((a) => a.ano),
    ceap: {
      totalAno,
      documentos: Number(totalDocs.n),
      porMes: porMes.filter((m) => m.ano === ano).map((m) => ({ mes: m.mes, total: Number(m.total) })),
      porAno: anosCeap
        .toSorted((x, y) => x - y)
        .map((a) => ({ ano: a, total: porMes.filter((m) => m.ano === a).reduce((t, m) => t + Number(m.total), 0) })),
      porTipo: porTipo.map((t) => ({ tipo: t.tipo_despesa, total: Number(t.total) })),
      fornecedores: fornecedores.map((f) => ({ ...f, total: Number(f.total), documentos: Number(f.documentos) })),
      teto,
      tetoAcumulado: tetoAcumulado(teto, ultimoMes),
      ultimoMes,
      /** Total do ano ÷ meses com notas no ano (SCEAPS-05). */
      mediaMensal: (() => {
        const meses = mandato ? 0 : porMes.filter((m) => m.ano === ano).length;
        return meses ? totalAno / meses : null;
      })(),
    },
    votacoes: {
      ano: anoVotos,
      totalPlenario: plenario.length,
      mediaPresenca,
      presentes,
      denominadorPresenca,
      alinhamento: alin,
      lista: listaVotacoes,
    },
    bens,
    candidaturas,
    orgaos,
    suplentes,
    correcoes: Number(correcoes.n),
    coletas: await coletasRecentes(ano, p.casa),
  };
}

export type Perfil = NonNullable<Awaited<ReturnType<typeof perfilParlamentar>>>;
