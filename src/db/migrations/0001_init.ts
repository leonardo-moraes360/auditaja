import { sql, type Kysely } from "kysely";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("coleta")
    .addColumn("id", "serial", (c) => c.primaryKey())
    .addColumn("fonte", "text", (c) => c.notNull())
    .addColumn("url", "text", (c) => c.notNull())
    .addColumn("coletado_em", "timestamptz", (c) => c.notNull())
    .addColumn("sha256", "text", (c) => c.notNull())
    .addColumn("bytes", "integer", (c) => c.notNull())
    .addColumn("licenca", "text", (c) => c.notNull())
    .addColumn("observacao", "text")
    .execute();

  await db.schema
    .createTable("parlamentar")
    .addColumn("id", "integer", (c) => c.primaryKey())
    .addColumn("casa", "text", (c) => c.notNull().check(sql`casa in ('camara')`))
    .addColumn("nome", "text", (c) => c.notNull())
    .addColumn("nome_civil", "text")
    .addColumn("sigla_partido", "text")
    .addColumn("sigla_uf", "text")
    .addColumn("url_foto", "text")
    .addColumn("data_nascimento", "date")
    .addColumn("id_legislatura", "integer")
    .addColumn("em_exercicio", "boolean", (c) => c.notNull().defaultTo(false))
    .addColumn("source_url", "text", (c) => c.notNull())
    .addColumn("coleta_id", "integer", (c) => c.notNull().references("coleta.id"))
    .execute();
  await sql`create index parlamentar_nome_busca on parlamentar (lower(nome))`.execute(db);

  await db.schema
    .createTable("orgao_membro")
    .addColumn("parlamentar_id", "integer", (c) => c.notNull().references("parlamentar.id").onDelete("cascade"))
    .addColumn("sigla_orgao", "text", (c) => c.notNull())
    .addColumn("nome_orgao", "text", (c) => c.notNull())
    .addColumn("cargo", "text", (c) => c.notNull())
    .addColumn("data_inicio", "date")
    .addColumn("data_fim", "date")
    .addColumn("coleta_id", "integer", (c) => c.notNull().references("coleta.id"))
    .execute();
  await db.schema.createIndex("orgao_membro_parl").on("orgao_membro").column("parlamentar_id").execute();

  await db.schema
    .createTable("despesa_ceap")
    .addColumn("id", "bigserial", (c) => c.primaryKey())
    .addColumn("parlamentar_id", "integer", (c) => c.notNull().references("parlamentar.id").onDelete("cascade"))
    .addColumn("ano", "integer", (c) => c.notNull())
    .addColumn("mes", "integer", (c) => c.notNull())
    .addColumn("tipo_despesa", "text", (c) => c.notNull())
    .addColumn("fornecedor_nome", "text", (c) => c.notNull())
    .addColumn("fornecedor_doc", "text")
    .addColumn("fornecedor_classe", "text", (c) => c.notNull())
    .addColumn("data_emissao", "date")
    .addColumn("valor_documento", "decimal(14, 2)", (c) => c.notNull())
    .addColumn("valor_glosa", "decimal(14, 2)", (c) => c.notNull())
    .addColumn("valor_liquido", "decimal(14, 2)", (c) => c.notNull())
    .addColumn("valor_restituicao", "decimal(14, 2)", (c) => c.notNull())
    .addColumn("url_documento", "text")
    .addColumn("ide_documento", "text")
    .addColumn("coleta_id", "integer", (c) => c.notNull().references("coleta.id"))
    .execute();
  await db.schema.createIndex("despesa_parl_ano").on("despesa_ceap").columns(["parlamentar_id", "ano"]).execute();

  await db.schema
    .createTable("votacao")
    .addColumn("id", "text", (c) => c.primaryKey())
    .addColumn("data", "date", (c) => c.notNull())
    .addColumn("sigla_orgao", "text", (c) => c.notNull())
    .addColumn("descricao", "text", (c) => c.notNull())
    .addColumn("proposicao", "text")
    .addColumn("aprovacao", "integer")
    .addColumn("votos_sim", "integer", (c) => c.notNull().defaultTo(0))
    .addColumn("votos_nao", "integer", (c) => c.notNull().defaultTo(0))
    .addColumn("votos_outros", "integer", (c) => c.notNull().defaultTo(0))
    .addColumn("source_url", "text", (c) => c.notNull())
    .addColumn("coleta_id", "integer", (c) => c.notNull().references("coleta.id"))
    .execute();
  await db.schema.createIndex("votacao_data").on("votacao").columns(["sigla_orgao", "data"]).execute();

  await db.schema
    .createTable("voto")
    .addColumn("votacao_id", "text", (c) => c.notNull().references("votacao.id").onDelete("cascade"))
    .addColumn("parlamentar_id", "integer", (c) => c.notNull())
    .addColumn("voto", "text", (c) => c.notNull())
    .addColumn("sigla_partido", "text")
    .addColumn("coleta_id", "integer", (c) => c.notNull().references("coleta.id"))
    .addPrimaryKeyConstraint("voto_pk", ["votacao_id", "parlamentar_id"])
    .execute();
  await db.schema.createIndex("voto_parl").on("voto").column("parlamentar_id").execute();

  await db.schema
    .createTable("orientacao")
    .addColumn("votacao_id", "text", (c) => c.notNull().references("votacao.id").onDelete("cascade"))
    .addColumn("sigla_bancada", "text", (c) => c.notNull())
    .addColumn("orientacao", "text", (c) => c.notNull())
    .addColumn("coleta_id", "integer", (c) => c.notNull().references("coleta.id"))
    .addPrimaryKeyConstraint("orientacao_pk", ["votacao_id", "sigla_bancada"])
    .execute();

  await db.schema
    .createTable("candidatura")
    .addColumn("ano_eleicao", "integer", (c) => c.notNull())
    .addColumn("sq_candidato", "text", (c) => c.notNull())
    .addColumn("parlamentar_id", "integer", (c) => c.notNull().references("parlamentar.id").onDelete("cascade"))
    .addColumn("cargo", "text", (c) => c.notNull())
    .addColumn("sigla_uf", "text", (c) => c.notNull())
    .addColumn("sigla_partido", "text")
    .addColumn("situacao", "text")
    .addColumn("coleta_id", "integer", (c) => c.notNull().references("coleta.id"))
    .addPrimaryKeyConstraint("candidatura_pk", ["ano_eleicao", "sq_candidato"])
    .execute();

  await db.schema
    .createTable("bem_declarado")
    .addColumn("id", "bigserial", (c) => c.primaryKey())
    .addColumn("ano_eleicao", "integer", (c) => c.notNull())
    .addColumn("sq_candidato", "text", (c) => c.notNull())
    .addColumn("parlamentar_id", "integer", (c) => c.notNull().references("parlamentar.id").onDelete("cascade"))
    .addColumn("ordem", "integer", (c) => c.notNull())
    .addColumn("tipo", "text", (c) => c.notNull())
    .addColumn("valor", "decimal(16, 2)", (c) => c.notNull())
    .addColumn("coleta_id", "integer", (c) => c.notNull().references("coleta.id"))
    .execute();
  await db.schema.createIndex("bem_parl").on("bem_declarado").columns(["parlamentar_id", "ano_eleicao"]).execute();

  await db.schema
    .createTable("pedido_correcao")
    .addColumn("id", "serial", (c) => c.primaryKey())
    .addColumn("parlamentar_id", "integer", (c) => c.notNull().references("parlamentar.id").onDelete("cascade"))
    .addColumn("secao", "text", (c) => c.notNull())
    .addColumn("descricao", "text", (c) => c.notNull())
    .addColumn("contato", "text")
    .addColumn("status", "text", (c) =>
      c
        .notNull()
        .defaultTo("recebido")
        .check(sql`status in ('recebido','em_analise','corrigido','mantido')`),
    )
    .addColumn("criado_em", "timestamptz", (c) => c.notNull().defaultTo(sql`now()`))
    .execute();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function down(db: Kysely<any>): Promise<void> {
  for (const t of [
    "pedido_correcao",
    "bem_declarado",
    "candidatura",
    "orientacao",
    "voto",
    "votacao",
    "despesa_ceap",
    "orgao_membro",
    "parlamentar",
    "coleta",
  ]) {
    await db.schema.dropTable(t).ifExists().execute();
  }
}
