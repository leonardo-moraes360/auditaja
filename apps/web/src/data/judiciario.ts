import { getDb } from "@auditaja/db/client";
import { sql } from "kysely";

export async function listarJudiciario(opts: { q?: string; limite?: number } = {}) {
  const db = getDb();
  let query = db
    .selectFrom("judiciario")
    .select(["id", "cargo", "tribunal", "nome", "url_foto", "sexo", "em_exercicio", "posse"])
    .where("em_exercicio", "=", true)
    .orderBy("nome")
    .limit(opts.limite ?? 200);
  const q = opts.q?.trim();
  if (q) {
    for (const palavra of q.split(/\s+/)) {
      const padrao = `%${palavra.replace(/[%_\\]/g, "\\$&")}%`;
      query = query.where(sql`unaccent(lower(nome))`, "like", sql`unaccent(lower(${padrao}))`);
    }
  }
  return query.execute();
}

export async function perfilJudiciario(id: number) {
  const db = getDb();
  const titular = await db.selectFrom("judiciario").selectAll().where("id", "=", id).executeTakeFirst();
  if (!titular) return null;
  const [despesas, votos, coleta] = await Promise.all([
    db
      .selectFrom("despesa_judiciario")
      .select(["ano", "mes", "tipo", "descricao", "fornecedor_nome", "valor_liquido", "data_emissao"])
      .where("judiciario_id", "=", id)
      .orderBy("ano", "desc")
      .orderBy("mes", "desc")
      .execute(),
    db
      .selectFrom("voto_judiciario")
      .innerJoin("sessao_judiciario", "sessao_judiciario.id", "voto_judiciario.sessao_id")
      .select([
        "voto_judiciario.sessao_id",
        "voto_judiciario.voto",
        "voto_judiciario.presente",
        "sessao_judiciario.data",
        "sessao_judiciario.descricao",
        "sessao_judiciario.tipo",
      ])
      .where("voto_judiciario.judiciario_id", "=", id)
      .orderBy("sessao_judiciario.data", "desc")
      .execute(),
    db
      .selectFrom("coleta")
      .select(["fonte", "url", "coletado_em", "licenca"])
      .where("id", "=", titular.coleta_id)
      .executeTakeFirst(),
  ]);
  return { titular, despesas, votos, coleta };
}

export async function judiciarioExiste(id: number): Promise<boolean> {
  const row = await getDb().selectFrom("judiciario").select("id").where("id", "=", id).executeTakeFirst();
  return Boolean(row);
}

export async function indiceDeJudiciario() {
  return getDb().selectFrom("judiciario").select(["id", "em_exercicio"]).execute();
}
