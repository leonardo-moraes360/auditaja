import "server-only";
import { sql } from "kysely";
import { getDb } from "@/db/client";
import { acimaDosColegas, saltoAnual, type AlertaColegas, type AlertaSalto, type TotalTipo } from "@/lib/atipico";

type CasaParlamentar = "camara" | "senado";

/**
 * Totais por parlamentar e tipo de despesa de uma Casa num ano, com os meses do ano em que cada
 * parlamentar teve qualquer nota (denominador da média mensal).
 */
export async function totaisPorTipo(casa: CasaParlamentar, ano: number): Promise<TotalTipo[]> {
  const db = getDb();
  const rows = await db
    .with("doCasa", (q) =>
      q
        .selectFrom("despesa_ceap")
        .innerJoin("parlamentar", "parlamentar.id", "despesa_ceap.parlamentar_id")
        .select(["despesa_ceap.parlamentar_id", "despesa_ceap.tipo_despesa", "despesa_ceap.mes", "despesa_ceap.valor_liquido"])
        .where("parlamentar.casa", "=", casa)
        .where("despesa_ceap.ano", "=", ano),
    )
    .with("meses", (q) =>
      q
        .selectFrom("doCasa")
        .select(["parlamentar_id", sql<string>`count(distinct mes)`.as("meses")])
        .groupBy("parlamentar_id"),
    )
    .selectFrom("doCasa")
    .innerJoin("meses", "meses.parlamentar_id", "doCasa.parlamentar_id")
    .select([
      "doCasa.parlamentar_id",
      "doCasa.tipo_despesa",
      sql<string>`sum(${sql.ref("doCasa.valor_liquido")})`.as("total"),
      sql<string>`count(*)`.as("notas"),
      "meses.meses",
    ])
    .groupBy(["doCasa.parlamentar_id", "doCasa.tipo_despesa", "meses.meses"])
    .execute();
  return rows.map((r) => ({
    parlamentarId: r.parlamentar_id,
    tipo: r.tipo_despesa,
    total: Number(r.total),
    meses: Number(r.meses),
    notas: Number(r.notas),
  }));
}

export type PadraoAtipico = {
  ano: number;
  acima: AlertaColegas[];
  salto: AlertaSalto[];
  /** Ano anterior com notas coletadas da mesma Casa: sem ele, o aviso de salto não é calculado. */
  anoAnteriorDisponivel: boolean;
};

/**
 * Os dois avisos de padrão atípico de um parlamentar em cada ano pedido. Cada ano da Casa é lido uma
 * vez só, mesmo quando serve de "ano anterior" para o seguinte.
 */
export async function padraoAtipico(
  casa: CasaParlamentar,
  anos: number[],
  parlamentarId: number,
): Promise<PadraoAtipico[]> {
  const necessarios = [...new Set(anos.flatMap((a) => [a, a - 1]))];
  const totais = new Map(await Promise.all(necessarios.map(async (a) => [a, await totaisPorTipo(casa, a)] as const)));
  return anos.map((ano) => {
    const atual = totais.get(ano) ?? [];
    const anterior = totais.get(ano - 1) ?? [];
    return {
      ano,
      acima: acimaDosColegas(atual, parlamentarId),
      salto: anterior.length ? saltoAnual(atual, anterior, parlamentarId) : [],
      anoAnteriorDisponivel: anterior.length > 0,
    };
  });
}
