import type { Kysely } from "kysely";

/**
 * Emendas parlamentares individuais, pagamentos por favorecido e sanções CEIS/CNEP,
 * todos do download em lote do Portal da Transparência (CGU). 0005 e 0006 estão reservadas
 * para as frentes do Senado e da presença.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("emenda")
    .addColumn("id", "serial", (c) => c.primaryKey())
    .addColumn("codigo", "text", (c) => c.notNull())
    .addColumn("ano", "integer", (c) => c.notNull())
    .addColumn("tipo", "text", (c) => c.notNull())
    .addColumn("autor_nome", "text", (c) => c.notNull())
    .addColumn("parlamentar_id", "integer", (c) => c.notNull().references("parlamentar.id").onDelete("cascade"))
    .addColumn("localidade", "text", (c) => c.notNull())
    .addColumn("uf", "text")
    .addColumn("funcao", "text", (c) => c.notNull())
    .addColumn("empenhado", "numeric(16, 2)", (c) => c.notNull())
    .addColumn("liquidado", "numeric(16, 2)", (c) => c.notNull())
    .addColumn("pago", "numeric(16, 2)", (c) => c.notNull())
    .addColumn("rp_pagos", "numeric(16, 2)", (c) => c.notNull())
    .addColumn("coleta_id", "integer", (c) => c.notNull().references("coleta.id"))
    .execute();
  await db.schema.createIndex("emenda_parlamentar_ano").on("emenda").columns(["parlamentar_id", "ano"]).execute();

  await db.schema
    .createTable("emenda_favorecido")
    .addColumn("id", "serial", (c) => c.primaryKey())
    .addColumn("codigo_emenda", "text", (c) => c.notNull())
    .addColumn("parlamentar_id", "integer", (c) => c.notNull().references("parlamentar.id").onDelete("cascade"))
    .addColumn("ano_emenda", "integer", (c) => c.notNull())
    .addColumn("ano_mes", "text", (c) => c.notNull())
    // R3: "Beneficiário pessoa física" no lugar do nome de PF.
    .addColumn("favorecido_nome", "text", (c) => c.notNull())
    // CNPJ formatado, CPF já mascarado pela fonte (***.ddd.ddd-**) ou nulo. Nunca CPF completo.
    .addColumn("favorecido_doc", "text")
    .addColumn("tipo_favorecido", "text", (c) => c.notNull())
    .addColumn("uf", "text")
    .addColumn("municipio", "text")
    .addColumn("valor", "numeric(16, 2)", (c) => c.notNull())
    .addColumn("coleta_id", "integer", (c) => c.notNull().references("coleta.id"))
    .execute();
  await db.schema
    .createIndex("emenda_favorecido_parlamentar_ano")
    .on("emenda_favorecido")
    .columns(["parlamentar_id", "ano_emenda"])
    .execute();

  await db.schema
    .createTable("sancao")
    .addColumn("id", "serial", (c) => c.primaryKey())
    .addColumn("cadastro", "text", (c) => c.notNull())
    .addColumn("codigo", "text", (c) => c.notNull())
    // Só pessoa jurídica: 14 dígitos, sem formatação.
    .addColumn("cnpj", "text", (c) => c.notNull())
    .addColumn("nome", "text", (c) => c.notNull())
    .addColumn("categoria", "text", (c) => c.notNull())
    .addColumn("data_inicio", "date")
    .addColumn("data_fim", "date")
    .addColumn("orgao", "text", (c) => c.notNull())
    .addColumn("coleta_id", "integer", (c) => c.notNull().references("coleta.id"))
    .execute();
  await db.schema.createIndex("sancao_cnpj").on("sancao").column("cnpj").execute();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("sancao").ifExists().execute();
  await db.schema.dropTable("emenda_favorecido").ifExists().execute();
  await db.schema.dropTable("emenda").ifExists().execute();
}
