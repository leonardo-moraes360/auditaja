import { sql, type Kysely } from "kysely";

/**
 * Trilha do dinheiro das emendas Pix (feature seguir-dinheiro):
 * - transf_plano: plano de ação de transferência especial no Transferegov, ligado à emenda pelo código;
 * - transf_pagamento: documento de liquidação informado pelo ente no relatório de gestão;
 * - cnpj_abertura: início de atividade e CNAE do lote "Estabelecimentos" da Receita, importado à mão;
 * - campanha_despesa: despesa de campanha com fornecedor pessoa jurídica (TSE).
 *
 * R2/R3/AD-002: nenhuma coluna para banco, agência, conta, sócio, endereço, telefone, e-mail ou CPF.
 * Pagamento a pessoa física fica só com tipo 'pf', valor e data: sem nome nem documento.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("transf_plano")
    .addColumn("id_plano_acao", "integer", (c) => c.primaryKey())
    // numero_emenda_parlamentar_plano_acao = emenda.codigo (12 dígitos).
    .addColumn("codigo_emenda", "text", (c) => c.notNull())
    .addColumn("codigo_plano", "text", (c) => c.notNull())
    .addColumn("parlamentar_id", "integer", (c) => c.notNull().references("parlamentar.id").onDelete("cascade"))
    // Ente que recebeu a transferência (município, estado ou fundo): CNPJ de 14 dígitos.
    .addColumn("beneficiario_cnpj", "text")
    .addColumn("beneficiario_nome", "text")
    .addColumn("beneficiario_uf", "text")
    // Custeio + investimento do plano.
    .addColumn("valor", "numeric(16, 2)", (c) => c.notNull())
    .addColumn("data_aceite", "date")
    .addColumn("coleta_id", "integer", (c) => c.notNull().references("coleta.id"))
    .execute();
  await db.schema.createIndex("transf_plano_parlamentar").on("transf_plano").column("parlamentar_id").execute();
  await db.schema.createIndex("transf_plano_codigo").on("transf_plano").column("codigo_emenda").execute();

  await db.schema
    .createTable("transf_pagamento")
    // id_relatorio_gestao_dl
    .addColumn("id", "integer", (c) => c.primaryKey())
    .addColumn("id_plano_acao", "integer", (c) =>
      c.notNull().references("transf_plano.id_plano_acao").onDelete("cascade"),
    )
    .addColumn("tipo", "text", (c) => c.notNull().check(sql`tipo in ('pj', 'pf')`))
    // Só PJ: 14 dígitos com dígito verificador válido. PF: nulo.
    .addColumn("recebedor_cnpj", "text")
    .addColumn("recebedor_nome", "text")
    .addColumn("valor", "numeric(16, 2)", (c) => c.notNull())
    .addColumn("data_pagamento", "date", (c) => c.notNull())
    .addColumn("coleta_id", "integer", (c) => c.notNull().references("coleta.id"))
    .addCheckConstraint(
      "transf_pagamento_pf_sem_dado",
      sql`tipo = 'pj' or (recebedor_cnpj is null and recebedor_nome is null)`,
    )
    .execute();
  await db.schema.createIndex("transf_pagamento_plano").on("transf_pagamento").column("id_plano_acao").execute();
  await db.schema.createIndex("transf_pagamento_cnpj").on("transf_pagamento").column("recebedor_cnpj").execute();

  await db.schema
    .createTable("cnpj_abertura")
    .addColumn("cnpj", "text", (c) => c.primaryKey())
    .addColumn("cnpj_basico", "text", (c) => c.notNull())
    .addColumn("matriz", "boolean", (c) => c.notNull())
    .addColumn("inicio_atividade", "date")
    .addColumn("cnae_principal", "text")
    // AAAA-MM do lote da Receita.
    .addColumn("base_mes", "text", (c) => c.notNull())
    .addColumn("coleta_id", "integer", (c) => c.notNull().references("coleta.id"))
    .execute();
  await sql`create index cnpj_abertura_matriz on cnpj_abertura (cnpj_basico) where matriz`.execute(db);

  await db.schema
    .createTable("campanha_despesa")
    .addColumn("id", "bigserial", (c) => c.primaryKey())
    .addColumn("ano_eleicao", "integer", (c) => c.notNull())
    .addColumn("sq_candidato", "text", (c) => c.notNull())
    .addColumn("parlamentar_id", "integer", (c) => c.notNull().references("parlamentar.id").onDelete("cascade"))
    .addColumn("fornecedor_cnpj", "text", (c) => c.notNull())
    .addColumn("valor", "numeric(16, 2)", (c) => c.notNull())
    .addColumn("data_despesa", "date")
    .addColumn("coleta_id", "integer", (c) => c.notNull().references("coleta.id"))
    .execute();
  await db.schema
    .createIndex("campanha_despesa_cnpj")
    .on("campanha_despesa")
    .columns(["fornecedor_cnpj", "parlamentar_id"])
    .execute();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("campanha_despesa").ifExists().execute();
  await db.schema.dropTable("cnpj_abertura").ifExists().execute();
  await db.schema.dropTable("transf_pagamento").ifExists().execute();
  await db.schema.dropTable("transf_plano").ifExists().execute();
}
