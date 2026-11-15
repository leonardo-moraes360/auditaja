import "server-only";
import { sql } from "kysely";
import { getDb } from "@auditaja/db/client";
import { CASAS_JUDICIARIO, cargoTitular, poderDaCasa, type CasaTitular, type Poder } from "@auditaja/core/poderes";

export type TitularResumo = {
  id: number;
  casa: CasaTitular;
  poder: Poder;
  nome: string;
  sexo: string | null;
  cargo: string | null;
  orgao: string | null;
  sigla_partido: string | null;
  sigla_uf: string | null;
  url_foto: string | null;
  em_exercicio: boolean;
  cargoRotulo: string;
};

export async function listarTitulares(opts?: {
  poder?: Poder;
  limite?: number;
  todos?: boolean;
}): Promise<TitularResumo[]> {
  const db = getDb();
  let query = db
    .selectFrom("parlamentar")
    .select(["id", "casa", "nome", "sexo", "cargo", "orgao", "sigla_partido", "sigla_uf", "url_foto", "em_exercicio"])
    .orderBy("casa")
    .orderBy("nome")
    .limit(opts?.limite ?? 200);
  if (!opts?.todos) query = query.where("em_exercicio", "=", true);
  if (opts?.poder === "legislativo") query = query.where("casa", "in", ["camara", "senado"]);
  else if (opts?.poder === "executivo") query = query.where("casa", "=", "executivo");
  else if (opts?.poder === "judiciario") query = query.where("casa", "in", [...CASAS_JUDICIARIO]);
  const rows = await query.execute();
  return rows.flatMap((r) => {
    const poder = poderDaCasa(r.casa);
    if (!poder) return [];
    return [
      {
        ...r,
        casa: r.casa as CasaTitular,
        poder,
        cargoRotulo: cargoTitular(r.casa, r.sexo, { cargo: r.cargo, orgao: r.orgao }),
      },
    ];
  });
}

export async function contarPorPoder(): Promise<Record<Poder, number>> {
  const rows = await getDb()
    .selectFrom("parlamentar")
    .select(["casa", sql<string>`count(*)`.as("n")])
    .where("em_exercicio", "=", true)
    .groupBy("casa")
    .execute();
  const r: Record<Poder, number> = { legislativo: 0, executivo: 0, judiciario: 0 };
  for (const x of rows) {
    const p = poderDaCasa(x.casa);
    if (p) r[p] += Number(x.n);
  }
  return r;
}

export async function gastosPorPoder(ano: number): Promise<Record<Poder, number>> {
  const db = getDb();
  const ceap = await db
    .selectFrom("despesa_ceap as d")
    .innerJoin("parlamentar as p", "p.id", "d.parlamentar_id")
    .select(["p.casa", sql<string>`sum(d.valor_liquido)`.as("total")])
    .where("d.ano", "=", ano)
    .groupBy("p.casa")
    .execute();
  const titular = await db
    .selectFrom("despesa_titular as d")
    .innerJoin("parlamentar as p", "p.id", "d.parlamentar_id")
    .select(["p.casa", sql<string>`sum(d.valor_liquido)`.as("total")])
    .where("d.ano", "=", ano)
    .groupBy("p.casa")
    .execute();
  const r: Record<Poder, number> = { legislativo: 0, executivo: 0, judiciario: 0 };
  for (const x of [...ceap, ...titular]) {
    const p = poderDaCasa(x.casa);
    if (p) r[p] += Number(x.total);
  }
  return r;
}
