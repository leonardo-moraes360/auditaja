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
  const sessaoIds = [...new Set(votos.map((v) => v.sessao_id))];
  const votosDaCorte =
    sessaoIds.length === 0
      ? []
      : await db
          .selectFrom("voto_judiciario")
          .select(["sessao_id", "voto", "presente"])
          .where("sessao_id", "in", sessaoIds)
          .where("presente", "=", true)
          .execute();
  const maioriaPorSessao = new Map<string, string | null>();
  for (const sid of sessaoIds) {
    const contagem = new Map<string, number>();
    for (const v of votosDaCorte) {
      if (v.sessao_id !== sid || !v.voto) continue;
      contagem.set(v.voto, (contagem.get(v.voto) ?? 0) + 1);
    }
    let melhor: string | null = null;
    let n = 0;
    for (const [voto, q] of contagem) {
      if (q > n) {
        melhor = voto;
        n = q;
      }
    }
    maioriaPorSessao.set(sid, melhor);
  }
  return { titular, despesas, votos, coleta, maioriaPorSessao };
}

export async function judiciarioExiste(id: number): Promise<boolean> {
  const row = await getDb().selectFrom("judiciario").select("id").where("id", "=", id).executeTakeFirst();
  return Boolean(row);
}

export async function indiceDeJudiciario() {
  return getDb().selectFrom("judiciario").select(["id", "em_exercicio"]).execute();
}
