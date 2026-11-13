import "server-only";
import { sql } from "kysely";
import { getDb } from "@auditaja/db/client";
import {
  baseDaColeta,
  periodoEmendas,
  rotuloLocalidade,
  TIPO_TRANSFERENCIA_ESPECIAL,
  type PeriodoEmendas,
} from "@auditaja/core/emendas";
import { soDigitos } from "@auditaja/core/privacy";

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
      .select(["fonte", "url", "coletado_em", "sha256", "licenca", "observacao"])
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
        // R3: pessoa física sem nenhum dígito de CPF, mesmo que um registro antigo ainda tenha a máscara.
        sql<string | null>`case when tipo_favorecido = 'Pessoa Fisica' then null else favorecido_doc end`.as(
          "favorecido_doc",
        ),
        "tipo_favorecido",
        sql<string | null>`mode() within group (order by natureza_juridica)`.as("natureza"),
        sql<string | null>`mode() within group (order by municipio)`.as("municipio"),
        sql<string | null>`mode() within group (order by uf)`.as("uf"),
        sql<string>`sum(valor)`.as("valor"),
      ])
      .where("parlamentar_id", "=", id)
      .where("ano_emenda", "in", anosDoPeriodo)
      .groupBy([
        "favorecido_nome",
        sql`case when tipo_favorecido = 'Pessoa Fisica' then null else favorecido_doc end`,
        "tipo_favorecido",
      ])
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
      pessoaFisica: f.tipo_favorecido === "Pessoa Fisica",
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
    .innerJoin("coleta", "coleta.id", "sancao.coleta_id")
    .select([
      "coleta.observacao",
      "cadastro",
      "sancao.cnpj",
      "sancao.nome",
      "sancao.categoria",
      "sancao.data_inicio",
      "sancao.data_fim",
      "sancao.orgao",
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
    .where("sancao.cnpj", "in", cnpjs)
    .orderBy("sancao.cnpj")
    .orderBy("sancao.cadastro")
    .orderBy("sancao.data_inicio", "desc")
    .execute();
  return rows.map(({ observacao, ...r }) => ({ ...r, base: baseDaColeta(observacao), notas: Number(r.notas ?? 0) }));
}

/**
 * Fornecedores PJ do período exibido da cota com ao menos uma nota emitida dentro do período de uma sanção
 * CEIS/CNEP, estejam ou não entre os maiores fornecedores. Sem isso, a nota paga a uma empresa sancionada
 * fora do top 5 não aparecia no perfil.
 */
export async function fornecedoresComSancaoNoPeriodo(id: number, anosCeap: number[]) {
  if (!anosCeap.length) return [];
  const db = getDb();
  const rows = await db
    .selectFrom("despesa_ceap")
    .select([
      sql<string>`mode() within group (order by despesa_ceap.fornecedor_nome)`.as("fornecedor_nome"),
      // Documento como gravado (com máscara de CNPJ): é o que o CSV de notas filtra.
      sql<string>`mode() within group (order by despesa_ceap.fornecedor_doc)`.as("fornecedor_doc"),
      sql<string>`count(*)`.as("documentos"),
    ])
    .where("despesa_ceap.parlamentar_id", "=", id)
    .where("despesa_ceap.ano", "in", anosCeap)
    .where("despesa_ceap.fornecedor_classe", "=", "pessoa_juridica")
    .where(({ exists, selectFrom }) =>
      exists(
        selectFrom("despesa_ceap as n")
          .innerJoin("sancao", (j) =>
            j.on(sql<boolean>`regexp_replace(n.fornecedor_doc, '\\D', '', 'g') = sancao.cnpj`),
          )
          .select(sql`1`.as("x"))
          .where("n.parlamentar_id", "=", id)
          .where("n.ano", "in", anosCeap)
          .whereRef("n.fornecedor_doc", "=", "despesa_ceap.fornecedor_doc")
          .where(sql<boolean>`n.data_emissao >= sancao.data_inicio`)
          .where(sql<boolean>`n.data_emissao <= coalesce(sancao.data_fim, 'infinity'::date)`),
      ),
    )
    .groupBy(sql`regexp_replace(despesa_ceap.fornecedor_doc, '\\D', '', 'g')`)
    .orderBy(sql`sum(despesa_ceap.valor_liquido)`, "desc")
    .execute();
  return rows
    .filter((r) => soDigitos(r.fornecedor_doc).length === 14)
    .map((r) => ({ ...r, documentos: Number(r.documentos) }));
}

export type FornecedorSancionado = Awaited<ReturnType<typeof fornecedoresComSancaoNoPeriodo>>[number];

/**
 * Por ano da cota: quantas empresas tiveram nota dentro do período de uma sanção CEIS/CNEP, e quantas
 * empresas (CNPJ) foram pagas no total. Alimenta a faixa "Pontos para verificar" e a frase de ausência.
 */
export async function resumoSancoesPorAno(id: number, anos: number[]) {
  if (!anos.length) return [];
  const db = getDb();
  const cnpj = sql<string>`regexp_replace(despesa_ceap.fornecedor_doc, '\\D', '', 'g')`;
  const rows = await db
    .selectFrom("despesa_ceap")
    .select([
      "despesa_ceap.ano",
      sql<string>`count(distinct ${cnpj})`.as("empresas"),
      sql<string>`count(distinct ${cnpj}) filter (where exists (
        select 1 from sancao
        where sancao.cnpj = ${cnpj}
          and despesa_ceap.data_emissao >= sancao.data_inicio
          and despesa_ceap.data_emissao <= coalesce(sancao.data_fim, 'infinity'::date)
      ))`.as("sancionadas"),
    ])
    .where("despesa_ceap.parlamentar_id", "=", id)
    .where("despesa_ceap.ano", "in", anos)
    .where("despesa_ceap.fornecedor_classe", "=", "pessoa_juridica")
    .where(sql<boolean>`length(${cnpj}) = 14`)
    .groupBy("despesa_ceap.ano")
    .orderBy("despesa_ceap.ano")
    .execute();
  return rows.map((r) => ({ ano: r.ano, empresas: Number(r.empresas), sancionadas: Number(r.sancionadas) }));
}

export type ResumoSancoesAno = Awaited<ReturnType<typeof resumoSancoesPorAno>>[number];

/** Base (data do arquivo) da coleta de sanções mais recente, para citar na frase de ausência. */
export async function baseDasSancoes() {
  const r = await getDb()
    .selectFrom("coleta")
    .select(["observacao", "coletado_em"])
    .where("fonte", "like", "cgu_ceis%")
    .orderBy("coletado_em", "desc")
    .executeTakeFirst();
  return r ? (baseDaColeta(r.observacao) ?? null) : null;
}

export type SancaoFornecedor = Awaited<ReturnType<typeof sancoesDosFornecedores>>[number];
