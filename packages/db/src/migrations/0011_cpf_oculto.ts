import { sql, type Kysely } from "kysely";

/** CNPJ formatado: único documento que pode ficar gravado. */
const CNPJ = "^[0-9]{2}\\.[0-9]{3}\\.[0-9]{3}/[0-9]{4}-[0-9]{2}$";

/**
 * Mesma regra de CPF_MASCARADO_NO_TEXTO (@auditaja/core/privacy), em regex do Postgres: CPF com máscara
 * parcial da Receita/Câmara ("***.456.789-**") ou do Senado ("123.***.***-01") dentro de um nome.
 */
const MASCARA_PARCIAL =
  "(^|[^0-9*])(\\*{3}[-./[:space:]]{0,3}[0-9]{3}[-./[:space:]]{0,3}[0-9]{3}[-./[:space:]]{0,3}\\*{2}|[0-9]{3}[-./[:space:]]{0,3}\\*{3}[-./[:space:]]{0,3}\\*{3}[-./[:space:]]{0,3}[0-9]{2})(?![0-9*])";

/**
 * R3: nenhum dígito de CPF de terceiro pessoa física no banco. A Câmara e o Portal da Transparência
 * mascaram o CPF mostrando os 6 dígitos do meio; o Senado, os 3 primeiros e os 2 últimos. Juntas,
 * as máscaras remontam o número. Apaga as máscaras já gravadas, sem esperar nova coleta, inclusive
 * máscaras parciais deixadas em nomes (razão social de MEI) por versões antigas da coleta.
 * Não há volta: o dado apagado não é recuperável (nem deve ser).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function up(db: Kysely<any>): Promise<void> {
  await sql`update despesa_ceap set fornecedor_doc = null
    where fornecedor_doc is not null and (fornecedor_classe = 'terceiro_pf' or fornecedor_doc !~ ${CNPJ})`.execute(db);
  await sql`update emenda_favorecido set favorecido_doc = null
    where favorecido_doc is not null and (tipo_favorecido = 'Pessoa Fisica' or favorecido_doc !~ ${CNPJ})`.execute(db);
  for (const [tabela, coluna] of [
    ["despesa_ceap", "fornecedor_nome"],
    ["emenda_favorecido", "favorecido_nome"],
    ["sancao", "nome"],
  ]) {
    await sql`update ${sql.table(tabela)}
      set ${sql.ref(coluna)} = regexp_replace(${sql.ref(coluna)}, ${MASCARA_PARCIAL}, '\\1***.***.***-**', 'g')
      where ${sql.ref(coluna)} ~ ${MASCARA_PARCIAL}`.execute(db);
  }
}

export async function down(): Promise<void> {
  // Sem volta: os dígitos apagados não são restaurados.
}
