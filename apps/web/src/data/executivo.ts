import { getDb } from "@auditaja/db/client";
import { sql } from "kysely";

export async function listarExecutivo(opts: { q?: string; limite?: number } = {}) {
  const db = getDb();
  let query = db
    .selectFrom("executivo")
    .select(["id", "cargo", "orgao", "nome", "sigla_partido", "sigla_uf", "url_foto", "sexo", "em_exercicio"])
    .where("em_exercicio", "=", true)
    .orderBy("cargo")
    .orderBy("nome")
    .limit(opts.limite ?? 200);
  const q = opts.q?.trim();
  if (q) {
    for (const palavra of q.split(/\s+/)) {
      const padrao = `%${palavra.replace(/[%_\\]/g, "\\$&")}%`;
      query = query.where(({ or, eb }) =>
        or([
          eb(sql`unaccent(lower(nome))`, "like", sql`unaccent(lower(${padrao}))`),
          eb(sql`unaccent(lower(orgao))`, "like", sql`unaccent(lower(${padrao}))`),
        ]),
      );
    }
  }
  return query.execute();
}

export async function perfilExecutivo(id: number) {
  const db = getDb();
  const titular = await db.selectFrom("executivo").selectAll().where("id", "=", id).executeTakeFirst();
  if (!titular) return null;
  const [despesas, bens, coleta] = await Promise.all([
    db
      .selectFrom("despesa_executivo")
      .select(["ano", "mes", "tipo", "descricao", "fornecedor_nome", "fornecedor_doc", "valor_liquido", "data_emissao"])
      .where("executivo_id", "=", id)
      .orderBy("ano", "desc")
      .orderBy("mes", "desc")
      .execute(),
    db
      .selectFrom("bem_executivo")
      .select(["ano_eleicao", "tipo", "valor", "ordem"])
      .where("executivo_id", "=", id)
      .orderBy("ano_eleicao", "desc")
      .orderBy("ordem")
      .execute(),
    db
      .selectFrom("coleta")
      .select(["fonte", "url", "coletado_em", "licenca"])
      .where("id", "=", titular.coleta_id)
      .executeTakeFirst(),
  ]);
  const totalPorAno = new Map<number, number>();
  for (const d of despesas) {
    totalPorAno.set(d.ano, (totalPorAno.get(d.ano) ?? 0) + Number(d.valor_liquido));
  }
  const bensPorAno = new Map<number, number>();
  for (const b of bens) {
    bensPorAno.set(b.ano_eleicao, (bensPorAno.get(b.ano_eleicao) ?? 0) + Number(b.valor));
  }
  return { titular, despesas, bens, coleta, totalPorAno, bensPorAno };
}

export async function executivoExiste(id: number): Promise<boolean> {
  const row = await getDb().selectFrom("executivo").select("id").where("id", "=", id).executeTakeFirst();
  return Boolean(row);
}

export async function indiceDeExecutivo() {
  return getDb().selectFrom("executivo").select(["id", "em_exercicio"]).execute();
}
