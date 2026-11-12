import type { Kysely } from "kysely";
import type { Database } from "@/db/types";

/** Colegas fictícios para o padrão atípico: ids 980.000.001 em diante (fora das faixas do seed). */
export const COLEGAS_ATIPICO = 25;
const BASE_ID = 980_000_000;
/** Deputado fictício com os dois avisos (os outros testes não usam esse perfil). */
export const ID_ATIPICO = BASE_ID + COLEGAS_ATIPICO + 1;

export const TIPO_ACIMA = "HOSPEDAGEM ,EXCETO DO PARLAMENTAR NO DISTRITO FEDERAL.";
export const TIPO_SALTO = "MANUTENÇÃO DE ESCRITÓRIO DE APOIO À ATIVIDADE PARLAMENTAR";

/**
 * Acrescenta ao seed 25 deputados fictícios com notas de janeiro a outubro de 2024 e 2025 e um 26º
 * (ID_ATIPICO) com hospedagem muito acima dos colegas em 2025 (aviso "acima dos colegas") e um salto
 * na manutenção de escritório de 2024 para 2025 (aviso "salto"). Todos fora de exercício, para não
 * mudar a lista nem as médias de presença. Anos 2024 e 2025, que o seed não usa, para não mexer
 * no último mês publicado de 2026 (teto acumulado).
 */
export async function semearAtipico(db: Kysely<Database>) {
  const { id: coletaId } = await db
    .insertInto("coleta")
    .values({
      fonte: "camara_ceap",
      url: "https://www.camara.leg.br/cotas/Ano-2024.csv.zip",
      coletado_em: "2026-11-10T08:12:00Z",
      sha256: "0".repeat(64),
      bytes: 0,
      licenca: "dados fictícios de teste",
      observacao: "seed padrão atípico",
    })
    .returning("id")
    .executeTakeFirstOrThrow();
  await db
    .insertInto("parlamentar")
    .values(
      Array.from({ length: COLEGAS_ATIPICO + 1 }, (_, i) => ({
        id: BASE_ID + i + 1,
        casa: "camara" as const,
        nome: BASE_ID + i + 1 === ID_ATIPICO ? "Deputado Atípico Fictício" : `Colega Fictício ${i + 1}`,
        sigla_uf: "SP",
        em_exercicio: false,
        id_legislatura: 57,
        source_url: "https://example.invalid/colega",
        coleta_id: coletaId,
      })),
    )
    .execute();
  const nota = (parlamentar_id: number, ano: number, mes: number, tipo: string, valor: number) => ({
    parlamentar_id,
    ano,
    mes,
    tipo_despesa: tipo,
    fornecedor_nome: "Fornecedor Fictício Ltda",
    fornecedor_doc: "00.000.000/0001-00",
    fornecedor_classe: "pessoa_juridica" as const,
    data_emissao: `${ano}-${String(mes).padStart(2, "0")}-05`,
    valor_documento: valor,
    valor_glosa: 0,
    valor_liquido: valor,
    valor_restituicao: 0,
    url_documento: null,
    ide_documento: `atipico-${parlamentar_id}-${ano}-${mes}-${tipo.length}`,
    coleta_id: coletaId,
  });
  const linhas = [];
  for (let i = 0; i < COLEGAS_ATIPICO; i++) {
    const id = BASE_ID + i + 1;
    for (let mes = 1; mes <= 10; mes++) {
      linhas.push(nota(id, 2024, mes, TIPO_ACIMA, 500 + i * 20));
      linhas.push(nota(id, 2025, mes, TIPO_ACIMA, 520 + i * 20));
      linhas.push(nota(id, 2024, mes, TIPO_SALTO, 2000 + i * 40));
      linhas.push(nota(id, 2025, mes, TIPO_SALTO, 2000 + i * 44));
    }
  }
  for (let mes = 1; mes <= 10; mes++) {
    linhas.push(nota(ID_ATIPICO, 2024, mes, TIPO_ACIMA, 5000));
    linhas.push(nota(ID_ATIPICO, 2025, mes, TIPO_ACIMA, 5000));
    linhas.push(nota(ID_ATIPICO, 2024, mes, TIPO_SALTO, 300));
    linhas.push(nota(ID_ATIPICO, 2025, mes, TIPO_SALTO, 4000));
  }
  await db.insertInto("despesa_ceap").values(linhas).execute();
}

export async function limparAtipico(db: Kysely<Database>) {
  await db.deleteFrom("despesa_ceap").where("ide_documento", "like", "atipico-%").execute();
  await db.deleteFrom("parlamentar").where("id", ">", BASE_ID).where("id", "<=", ID_ATIPICO).execute();
  await db.deleteFrom("coleta").where("observacao", "=", "seed padrão atípico").execute();
}
