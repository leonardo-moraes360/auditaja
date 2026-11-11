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

/** Última coleta de cada fonte, para a proveniência exibida (R1). */
async function coletasRecentes() {
  const rows = await getDb()
    .selectFrom("coleta")
    .select(["fonte", "url", "coletado_em", "sha256", "licenca"])
    .distinctOn("fonte")
    .orderBy("fonte")
    .orderBy("coletado_em", "desc")
    .execute();
  return Object.fromEntries(rows.map((r) => [r.fonte, r]));
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

export async function perfilParlamentar(id: number, anoPedido?: number) {
  const db = getDb();
  const p = await db
    .selectFrom("parlamentar")
    .select([
      "id",
      "nome",
      "nome_civil",
      "sigla_partido",
      "sigla_uf",
      "url_foto",
      "em_exercicio",
      "id_legislatura",
      "source_url",
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
  const ano = anoPedido && anos.some((a) => a.ano === anoPedido) ? anoPedido : anoMaisRecente;

  const [porMes, porTipo, fornecedores, totalDocs, ultimoMesGeral] = await Promise.all([
    db
      .selectFrom("despesa_ceap")
      .select(["mes", sql<string>`sum(valor_liquido)`.as("total")])
      .where("parlamentar_id", "=", id)
      .where("ano", "=", ano)
      .groupBy("mes")
      .orderBy("mes")
      .execute(),
    db
      .selectFrom("despesa_ceap")
      .select(["tipo_despesa", sql<string>`sum(valor_liquido)`.as("total")])
      .where("parlamentar_id", "=", id)
      .where("ano", "=", ano)
      .groupBy("tipo_despesa")
      .orderBy(sql`sum(valor_liquido)`, "desc")
      .execute(),
    db
      .selectFrom("despesa_ceap")
      .select([
        "fornecedor_nome",
        "fornecedor_doc",
        "fornecedor_classe",
        sql<string>`sum(valor_liquido)`.as("total"),
        sql<string>`count(*)`.as("documentos"),
      ])
      .where("parlamentar_id", "=", id)
      .where("ano", "=", ano)
      .groupBy(["fornecedor_nome", "fornecedor_doc", "fornecedor_classe"])
      .orderBy(sql`sum(valor_liquido)`, "desc")
      .limit(8)
      .execute(),
    db
      .selectFrom("despesa_ceap")
      .select(sql<string>`count(*)`.as("n"))
      .where("parlamentar_id", "=", id)
      .where("ano", "=", ano)
      .executeTakeFirstOrThrow(),
    // Último mês publicado na base inteira: base do teto acumulado.
    db
      .selectFrom("despesa_ceap")
      .select(sql<number>`max(mes)`.as("mes"))
      .where("ano", "=", ano)
      .executeTakeFirst(),
  ]);

  const totalAno = porMes.reduce((a, m) => a + Number(m.total), 0);
  const teto = tetoDaUf(p.sigla_uf);
  const ultimoMes = ultimoMesGeral?.mes ?? 0;

  // Votações nominais do Plenário no ano (presença e alinhamento).
  const plenario = await db
    .selectFrom("votacao")
    .select(["id", "data", "descricao", "proposicao", "aprovacao", "source_url"])
    .where("sigla_orgao", "=", ORGAO_PLENARIO)
    .where("data", ">=", `${ano}-01-01`)
    .where("data", "<=", `${ano}-12-31`)
    .orderBy("data", "desc")
    .orderBy("id", "desc")
    .execute();
  const idsPlen = plenario.map((v) => v.id);
  const blocos = await blocosDaLegislatura(p.id_legislatura);
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
  const comOrientacao: VotoComOrientacoes[] = votos.map((v) => ({
    voto: v.voto,
    siglaPartido: v.sigla_partido ?? p.sigla_partido,
    orientacoes: orientPorVotacao.get(v.votacao_id) ?? [],
  }));
  const presentes = votos.filter((v) => v.voto !== "").length;
  const alin = alinhamento(comOrientacao, blocos);

  const listaVotacoes = plenario.map((v) => {
    const voto = votoPorVotacao.get(v.id);
    const orient = orientacaoDoPartido(
      {
        voto: voto?.voto ?? "",
        siglaPartido: voto?.sigla_partido ?? p.sigla_partido,
        orientacoes: orientPorVotacao.get(v.id) ?? [],
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

  return {
    parlamentar: p,
    ano,
    anosDisponiveis: anos.map((a) => a.ano),
    ceap: {
      totalAno,
      documentos: Number(totalDocs.n),
      porMes: porMes.map((m) => ({ mes: m.mes, total: Number(m.total) })),
      porTipo: porTipo.map((t) => ({ tipo: t.tipo_despesa, total: Number(t.total) })),
      fornecedores: fornecedores.map((f) => ({ ...f, total: Number(f.total), documentos: Number(f.documentos) })),
      teto,
      tetoAcumulado: tetoAcumulado(teto, ultimoMes),
      ultimoMes,
    },
    votacoes: {
      totalPlenario: plenario.length,
      presentes,
      alinhamento: alin,
      lista: listaVotacoes,
    },
    bens,
    candidaturas,
    orgaos,
    correcoes: Number(correcoes.n),
    coletas: await coletasRecentes(),
  };
}

export type Perfil = NonNullable<Awaited<ReturnType<typeof perfilParlamentar>>>;
