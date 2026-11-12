import { sql, type Kysely } from "kysely";

/**
 * R3: nenhum dígito de CPF de terceiro pessoa física no banco. A Câmara e o Portal da Transparência
 * mascaram o CPF mostrando os 6 dígitos do meio; o Senado, os 3 primeiros e os 2 últimos. Juntas,
 * as máscaras remontam o número. Apaga as máscaras já gravadas, sem esperar nova coleta.
 * Não há volta: o dado apagado não é recuperável (nem deve ser).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function up(db: Kysely<any>): Promise<void> {
  await sql`update despesa_ceap set fornecedor_doc = null
    where fornecedor_doc is not null
      and (fornecedor_classe = 'terceiro_pf' or fornecedor_doc !~ '^\\d{2}\\.\\d{3}\\.\\d{3}/\\d{4}-\\d{2}$')`.execute(
    db,
  );
  await sql`update emenda_favorecido set favorecido_doc = null
    where favorecido_doc is not null
      and (tipo_favorecido = 'Pessoa Fisica' or favorecido_doc !~ '^\\d{2}\\.\\d{3}\\.\\d{3}/\\d{4}-\\d{2}$')`.execute(
    db,
  );
}

export async function down(): Promise<void> {
  // Sem volta: os dígitos apagados não são restaurados.
}
