import { sql, type Kysely } from "kysely";

/**
 * Poder Executivo e Poder Judiciário (esfera federal), no mesmo modelo do Legislativo:
 * titular com coleta (R1), sem CPF nem descrição livre de bens (R2), fornecedor PF mascarado (R3).
 *
 * Escopo: Presidente, Vice-Presidente e Ministros de Estado; Ministros do STF.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("executivo")
    .addColumn("id", "integer", (c) => c.primaryKey())
    .addColumn("cargo", "text", (c) => c.notNull().check(sql`cargo in ('presidente','vice_presidente','ministro')`))
    .addColumn("orgao", "text", (c) => c.notNull())
    .addColumn("nome", "text", (c) => c.notNull())
    .addColumn("nome_civil", "text")
    .addColumn("sigla_partido", "text")
    .addColumn("sigla_uf", "text")
    .addColumn("url_foto", "text")
    .addColumn("data_nascimento", "date")
    .addColumn("sexo", "text")
    .addColumn("em_exercicio", "boolean", (c) => c.notNull().defaultTo(false))
    .addColumn("mandato_inicio", "date")
    .addColumn("mandato_fim", "date")
    .addColumn("source_url", "text", (c) => c.notNull())
    .addColumn("coleta_id", "integer", (c) => c.notNull().references("coleta.id"))
    .execute();
  await sql`create index executivo_nome_busca on executivo (lower(nome))`.execute(db);
  await sql`create index executivo_exercicio on executivo (em_exercicio)`.execute(db);

  await db.schema
    .createTable("despesa_executivo")
    .addColumn("id", "bigserial", (c) => c.primaryKey())
    .addColumn("executivo_id", "integer", (c) => c.notNull().references("executivo.id").onDelete("cascade"))
    .addColumn("ano", "integer", (c) => c.notNull())
    .addColumn("mes", "integer", (c) => c.notNull())
    .addColumn("tipo", "text", (c) => c.notNull().check(sql`tipo in ('viagem','cartao','diaria')`))
    .addColumn("descricao", "text", (c) => c.notNull())
    .addColumn("fornecedor_nome", "text", (c) => c.notNull())
    .addColumn("fornecedor_doc", "text")
    .addColumn("fornecedor_classe", "text", (c) => c.notNull())
    .addColumn("data_emissao", "date")
    .addColumn("valor_liquido", "decimal(14, 2)", (c) => c.notNull())
    .addColumn("url_documento", "text")
    .addColumn("coleta_id", "integer", (c) => c.notNull().references("coleta.id"))
    .execute();
  await db.schema
    .createIndex("despesa_executivo_titular_ano")
    .on("despesa_executivo")
    .columns(["executivo_id", "ano"])
    .execute();

  await db.schema
    .createTable("bem_executivo")
    .addColumn("id", "bigserial", (c) => c.primaryKey())
    .addColumn("ano_eleicao", "integer", (c) => c.notNull())
    .addColumn("executivo_id", "integer", (c) => c.notNull().references("executivo.id").onDelete("cascade"))
    .addColumn("ordem", "integer", (c) => c.notNull())
    .addColumn("tipo", "text", (c) => c.notNull())
    .addColumn("valor", "decimal(16, 2)", (c) => c.notNull())
    .addColumn("coleta_id", "integer", (c) => c.notNull().references("coleta.id"))
    .execute();
  await db.schema
    .createIndex("bem_executivo_titular")
    .on("bem_executivo")
    .columns(["executivo_id", "ano_eleicao"])
    .execute();

  await db.schema
    .createTable("judiciario")
    .addColumn("id", "integer", (c) => c.primaryKey())
    .addColumn("cargo", "text", (c) => c.notNull().check(sql`cargo in ('ministro_stf')`))
    .addColumn("tribunal", "text", (c) => c.notNull().check(sql`tribunal in ('STF')`))
    .addColumn("nome", "text", (c) => c.notNull())
    .addColumn("nome_civil", "text")
    .addColumn("url_foto", "text")
    .addColumn("data_nascimento", "date")
    .addColumn("sexo", "text")
    .addColumn("em_exercicio", "boolean", (c) => c.notNull().defaultTo(false))
    .addColumn("posse", "date")
    .addColumn("source_url", "text", (c) => c.notNull())
    .addColumn("coleta_id", "integer", (c) => c.notNull().references("coleta.id"))
    .execute();
  await sql`create index judiciario_nome_busca on judiciario (lower(nome))`.execute(db);
  await sql`create index judiciario_exercicio on judiciario (em_exercicio)`.execute(db);

  await db.schema
    .createTable("despesa_judiciario")
    .addColumn("id", "bigserial", (c) => c.primaryKey())
    .addColumn("judiciario_id", "integer", (c) => c.notNull().references("judiciario.id").onDelete("cascade"))
    .addColumn("ano", "integer", (c) => c.notNull())
    .addColumn("mes", "integer", (c) => c.notNull())
    .addColumn("tipo", "text", (c) => c.notNull().check(sql`tipo in ('diaria','auxilio','passagem')`))
    .addColumn("descricao", "text", (c) => c.notNull())
    .addColumn("fornecedor_nome", "text", (c) => c.notNull())
    .addColumn("fornecedor_doc", "text")
    .addColumn("fornecedor_classe", "text", (c) => c.notNull())
    .addColumn("data_emissao", "date")
    .addColumn("valor_liquido", "decimal(14, 2)", (c) => c.notNull())
    .addColumn("url_documento", "text")
    .addColumn("coleta_id", "integer", (c) => c.notNull().references("coleta.id"))
    .execute();
  await db.schema
    .createIndex("despesa_judiciario_titular_ano")
    .on("despesa_judiciario")
    .columns(["judiciario_id", "ano"])
    .execute();

  await db.schema
    .createTable("sessao_judiciario")
    .addColumn("id", "text", (c) => c.primaryKey())
    .addColumn("data", "date", (c) => c.notNull())
    .addColumn("tribunal", "text", (c) => c.notNull().check(sql`tribunal in ('STF')`))
    .addColumn("tipo", "text", (c) => c.notNull())
    .addColumn("descricao", "text", (c) => c.notNull())
    .addColumn("source_url", "text", (c) => c.notNull())
    .addColumn("coleta_id", "integer", (c) => c.notNull().references("coleta.id"))
    .execute();
  await db.schema.createIndex("sessao_judiciario_data").on("sessao_judiciario").columns(["tribunal", "data"]).execute();

  await db.schema
    .createTable("voto_judiciario")
    .addColumn("sessao_id", "text", (c) => c.notNull().references("sessao_judiciario.id").onDelete("cascade"))
    .addColumn("judiciario_id", "integer", (c) => c.notNull().references("judiciario.id").onDelete("cascade"))
    .addColumn("voto", "text", (c) => c.notNull())
    .addColumn("presente", "boolean", (c) => c.notNull().defaultTo(true))
    .addColumn("coleta_id", "integer", (c) => c.notNull().references("coleta.id"))
    .addPrimaryKeyConstraint("voto_judiciario_pk", ["sessao_id", "judiciario_id"])
    .execute();
  await db.schema.createIndex("voto_judiciario_titular").on("voto_judiciario").column("judiciario_id").execute();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function down(db: Kysely<any>): Promise<void> {
  for (const t of [
    "voto_judiciario",
    "sessao_judiciario",
    "despesa_judiciario",
    "judiciario",
    "bem_executivo",
    "despesa_executivo",
    "executivo",
  ]) {
    await db.schema.dropTable(t).ifExists().execute();
  }
}
