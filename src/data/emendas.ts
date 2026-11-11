import "server-only";
import { sql } from "kysely";
import { getDb } from "@/db/client";
import { periodoEmendas, rotuloLocalidade, TIPO_TRANSFERENCIA_ESPECIAL, type PeriodoEmendas } from "@/lib/emendas";
import { soDigitos } from "@/lib/privacy";

const LIMITE = 5;
/** Emenda aplicada em vários lugares: o Orçamento não diz onde. */
export const LOCALIDADE_MULTIPLA = "MÚLTIPLO";

const ROTULO_TIPO: Record<string, string> = {
  "Pessoa Fisica": "Pessoa física",
  "Pessoa Jurídica": "Pessoa jurídica",
  "Unidade Gestora": "Unidade gestora",
};

/** Natureza jurídica quando a fonte informa; senão o tipo do favorecido. */
function tipoDoFavorecido(natureza: string | null, tipo: string): string {
  return natureza ?? ROTULO_TIPO[tipo] ?? tipo;
}

/** Ano da emenda → período; `param` é o `?emendas=` da página. */
export async function emendasDoParlamentar(id: number, param?: string | string[]) {
  const db = getDb();
  const anos = (
    await db
      .selectFrom("emenda")
      .select("ano")
      .distinct()
      .where("parlamentar_id", "=", id)
      .orderBy("ano", "desc")
      .execute()
  ).map((r) => r.ano);
  const coleta =
    (await db
      .selectFrom("coleta")
      .select(["fonte", "url", "coletado_em", "sha256", "licenca"])
      .where("fonte", "=", "cgu_emendas")
      .orderBy("coletado_em", "desc")
      .executeTakeFirst()) ?? null;
  const periodo: PeriodoEmendas = periodoEmendas(param, anos);
  if (!anos.length) return { anos, periodo, coleta, vazio: true as const };
  const anosDoPeriodo = periodo === "mandato" ? anos : [periodo];

  const base = db.selectFrom("emenda").where("parlamentar_id", "=", id).where("ano", "in", anosDoPeriodo);
  const [totais, porAno, areas, locais, favorecidos] = await Promise.all([
    base
      .select([
        sql<string>`coalesce(sum(empenhado), 0)`.as("empenhado"),
        sql<string>`coalesce(sum(pago + rp_pagos), 0)`.as("pago"),
        sql<string>`coalesce(sum(empenhado) filter (where tipo = ${TIPO_TRANSFERENCIA_ESPECIAL}), 0)`.as("especiais"),
        sql<string>`count(distinct codigo)`.as("emendas"),
        sql<string>`coalesce(sum(empenhado) filter (where localidade = ${LOCALIDADE_MULTIPLA}), 0)`.as("multiplo"),
      ])
      .executeTakeFirstOrThrow(),
    base
      .select(["ano", sql<string>`sum(empenhado)`.as("empenhado"), sql<string>`sum(pago + rp_pagos)`.as("pago")])
      .groupBy("ano")
      .orderBy("ano")
      .execute(),
    base
      .select(["funcao", sql<string>`sum(empenhado)`.as("valor")])
      .groupBy("funcao")
      .orderBy(sql`sum(empenhado)`, "desc")
      .orderBy("funcao")
      .limit(LIMITE)
      .execute(),
    base
      .select(["localidade", sql<string>`sum(empenhado)`.as("valor")])
      .where("localidade", "<>", LOCALIDADE_MULTIPLA)
      .groupBy("localidade")
      .orderBy(sql`sum(empenhado)`, "desc")
      .orderBy("localidade")
      .limit(LIMITE)
      .execute(),
    db
      .selectFrom("emenda_favorecido")
      .select([
        "favorecido_nome",
        "favorecido_doc",
        "tipo_favorecido",
        sql<string | null>`mode() within group (order by natureza_juridica)`.as("natureza"),
        sql<string | null>`mode() within group (order by municipio)`.as("municipio"),
        sql<string | null>`mode() within group (order by uf)`.as("uf"),
        sql<string>`sum(valor)`.as("valor"),
      ])
      .where("parlamentar_id", "=", id)
      .where("ano_emenda", "in", anosDoPeriodo)
      .groupBy(["favorecido_nome", "favorecido_doc", "tipo_favorecido"])
      .orderBy(sql`sum(valor)`, "desc")
      .orderBy("favorecido_nome")
      .limit(LIMITE)
      .execute(),
  ]);

  const empenhado = Number(totais.empenhado);
  return {
    anos,
    periodo,
    coleta,
    vazio: false as const,
    totais: {
      empenhado,
      pago: Number(totais.pago),
      especiais: Number(totais.especiais),
      emendas: Number(totais.emendas),
      multiplo: Number(totais.multiplo),
    },
    porAno: porAno.map((a) => ({ ano: a.ano, empenhado: Number(a.empenhado), pago: Number(a.pago) })),
    areas: areas.map((a) => ({ nome: a.funcao, valor: Number(a.valor) })),
    locais: locais.map((l) => ({ nome: rotuloLocalidade(l.localidade), valor: Number(l.valor) })),
    favorecidos: favorecidos.map((f) => ({
      nome: f.favorecido_nome,
      doc: f.favorecido_doc,
      tipo: tipoDoFavorecido(f.natureza, f.tipo_favorecido),
      municipio: f.municipio ? rotuloLocalidade(f.uf ? `${f.municipio} - ${f.uf}` : f.municipio) : null,
      valor: Number(f.valor),
    })),
  };
}

export type EmendasDoParlamentar = Awaited<ReturnType<typeof emendasDoParlamentar>>;

/**
 * Sanções CEIS/CNEP dos fornecedores listados e quantas notas do período exibido da cota
 * têm data de emissão dentro do período da sanção (fim nulo = sem data final).
 */
export async function sancoesDosFornecedores(id: number, docs: (string | null)[], anosCeap: number[]) {
  const cnpjs = [...new Set(docs.map(soDigitos).filter((d) => d.length === 14))];
  if (!cnpjs.length || !anosCeap.length) return [];
  const db = getDb();
  const rows = await db
    .selectFrom("sancao")
    .select([
      "cadastro",
      "cnpj",
      "nome",
      "categoria",
      "data_inicio",
      "data_fim",
      "orgao",
      (eb) =>
        eb
          .selectFrom("despesa_ceap")
          .select(sql<string>`count(*)`.as("n"))
          .where("despesa_ceap.parlamentar_id", "=", id)
          .where("despesa_ceap.ano", "in", anosCeap)
          .where(sql<boolean>`regexp_replace(despesa_ceap.fornecedor_doc, '\\D', '', 'g') = sancao.cnpj`)
          .where(sql<boolean>`despesa_ceap.data_emissao >= sancao.data_inicio`)
          .where(sql<boolean>`despesa_ceap.data_emissao <= coalesce(sancao.data_fim, 'infinity'::date)`)
          .as("notas"),
    ])
    .where("cnpj", "in", cnpjs)
    .orderBy("cnpj")
    .orderBy("cadastro")
    .orderBy("data_inicio", "desc")
    .execute();
  return rows.map((r) => ({ ...r, notas: Number(r.notas ?? 0) }));
}

export type SancaoFornecedor = Awaited<ReturnType<typeof sancoesDosFornecedores>>[number];
