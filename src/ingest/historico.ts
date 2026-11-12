import type { Insertable, Kysely } from "kysely";
import type { Database, PeriodoForaExercicioTable } from "@/db/types";
import { periodosForaDoExercicio, type EventoHistorico } from "@/lib/exercicio";
import { API, LEGISLATURA_ATUAL } from "./camara";
import { LICENCA_CAMARA, registrarColeta } from "./coleta";
import { ColetaBloqueada, sha256De, type ClienteEducado } from "./http";

/** Primeiro dia da 57ª legislatura (posse em 01/02/2023). */
export const INICIO_LEGISLATURA_ATUAL = "2023-02-01";
/** Deputados por coleta registrada: o progresso fica salvo se a coleta parar no meio. */
const POR_LOTE = 50;

export type HistoricoApi = EventoHistorico & { id: number; idLegislatura: number };

export const urlHistorico = (id: number) => `${API}/deputados/${id}/historico`;

/**
 * Transformação pura: o endpoint mistura legislaturas e não vem em ordem; ficamos só com a atual.
 * null = sem nenhum evento de situação na legislatura (não marcamos o histórico como coletado).
 */
export function montarPeriodos(
  parlamentarId: number,
  dados: HistoricoApi[],
  coletaId: number,
  legislatura = LEGISLATURA_ATUAL,
  inicio = INICIO_LEGISLATURA_ATUAL,
): Insertable<PeriodoForaExercicioTable>[] | null {
  const daLegislatura = dados.filter((d) => Number(d.idLegislatura) === legislatura);
  const periodos = periodosForaDoExercicio(daLegislatura, inicio);
  if (!periodos) return null;
  return periodos.map((p) => ({
    parlamentar_id: parlamentarId,
    inicio: p.inicio,
    fim: p.fim,
    situacao: p.situacao,
    motivo: p.motivo,
    source_url: urlHistorico(parlamentarId),
    coleta_id: coletaId,
  }));
}

/**
 * Histórico de situação de cada deputado da legislatura: 1 requisição por deputado
 * (~600, a 1 req/s pelo ClienteEducado). `soFaltantes` pula quem já tem histórico coletado.
 */
export async function coletarHistorico(
  db: Kysely<Database>,
  cli: ClienteEducado,
  { soFaltantes = false, log = console.log }: { soFaltantes?: boolean; log?: (m: string) => void } = {},
) {
  // Só deputados: o histórico vem da API da Câmara e não existe para ids do Senado.
  let q = db
    .selectFrom("parlamentar")
    .select("id")
    .where("casa", "=", "camara")
    .where("id_legislatura", "=", LEGISLATURA_ATUAL)
    .orderBy("id");
  if (soFaltantes) q = q.where("historico_coleta_id", "is", null);
  const ids = (await q.execute()).map((r) => r.id);
  let comHistorico = 0;
  let periodos = 0;
  let falhas = 0;

  for (let i = 0; i < ids.length; i += POR_LOTE) {
    const lote: { id: number; dados: HistoricoApi[] }[] = [];
    for (const id of ids.slice(i, i + POR_LOTE)) {
      try {
        lote.push({ id, dados: (await cli.json<{ dados: HistoricoApi[] }>(urlHistorico(id))).dados });
      } catch (e) {
        if (e instanceof ColetaBloqueada) throw e;
        falhas++;
        log(`histórico de ${id} não coletado: ${e instanceof Error ? e.message : e}`);
      }
    }
    if (!lote.length) continue;
    const bruto = lote.map((l) => JSON.stringify(l.dados)).join("\n");
    const coletaId = await registrarColeta(db, {
      fonte: "camara_api_historico",
      url: `${API}/deputados/{id}/historico`,
      sha256: sha256De(bruto),
      bytes: bruto.length,
      licenca: LICENCA_CAMARA,
      observacao: `Deputados ${lote[0].id} a ${lote.at(-1)!.id} (${lote.length})`,
    });
    await db.transaction().execute(async (trx) => {
      for (const l of lote) {
        const rows = montarPeriodos(l.id, l.dados, coletaId);
        if (!rows) continue;
        await trx.deleteFrom("periodo_fora_exercicio").where("parlamentar_id", "=", l.id).execute();
        if (rows.length) await trx.insertInto("periodo_fora_exercicio").values(rows).execute();
        await trx.updateTable("parlamentar").set({ historico_coleta_id: coletaId }).where("id", "=", l.id).execute();
        comHistorico++;
        periodos += rows.length;
      }
    });
    log(`histórico: ${Math.min(i + POR_LOTE, ids.length)} de ${ids.length}`);
  }
  return { deputados: ids.length, comHistorico, periodos, falhas };
}
