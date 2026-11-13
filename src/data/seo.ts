import "server-only";
import { sql } from "kysely";
import { getDb } from "@/db/client";
import type { Casa } from "@/data/perfil";

export type ParlamentarIndice = {
  id: number;
  casa: Casa;
  nome: string;
  sexo: string | null;
  sigla_partido: string | null;
  sigla_uf: string | null;
  em_exercicio: boolean;
};

/** Todos os perfis publicados, em exercício primeiro, para sitemap e llms.txt. */
export async function indiceDeParlamentares(): Promise<ParlamentarIndice[]> {
  return getDb()
    .selectFrom("parlamentar")
    .select(["id", "casa", "nome", "sexo", "sigla_partido", "sigla_uf", "em_exercicio"])
    .orderBy("em_exercicio", "desc")
    .orderBy("casa")
    .orderBy("nome")
    .execute();
}

/**
 * Data da coleta mais recente de cada Casa, contando as fontes comuns (TSE, CGU): é a última vez que
 * algo de um perfil daquela Casa pode ter mudado. Serve de lastModified no sitemap.
 */
export async function ultimaColetaPorCasa(): Promise<Record<Casa | "geral", Date | null>> {
  const rows = await getDb()
    .selectFrom("coleta")
    .select([
      sql<string>`case when fonte like 'camara_%' then 'camara' when fonte like 'senado_%' then 'senado' else 'comum' end`.as(
        "grupo",
      ),
      sql<Date>`max(coletado_em)`.as("ultima"),
    ])
    .groupBy("grupo")
    .execute();
  const por = Object.fromEntries(rows.map((r) => [r.grupo, new Date(r.ultima)])) as Record<string, Date>;
  const maior = (...ds: (Date | undefined)[]) =>
    ds.filter((d): d is Date => !!d).reduce<Date | null>((a, b) => (!a || b > a ? b : a), null);
  return {
    camara: maior(por.camara, por.comum),
    senado: maior(por.senado, por.comum),
    geral: maior(por.camara, por.senado, por.comum),
  };
}

/**
 * Dados leves para title, description e cartão de compartilhamento do perfil: identificação e o total
 * da cota no ano mais recente com notas. Evita rodar o perfil inteiro só para o <head>.
 */
export async function resumoDoParlamentar(id: number) {
  const db = getDb();
  const p = await db
    .selectFrom("parlamentar")
    .select(["id", "casa", "nome", "sexo", "sigla_partido", "sigla_uf", "url_foto", "em_exercicio", "source_url"])
    .where("id", "=", id)
    .executeTakeFirst();
  if (!p) return null;
  const cota = await db
    .selectFrom("despesa_ceap")
    .select(["ano", sql<string>`sum(valor_liquido)`.as("total"), sql<string>`count(*)`.as("documentos")])
    .where("parlamentar_id", "=", id)
    .groupBy("ano")
    .orderBy("ano", "desc")
    .limit(1)
    .executeTakeFirst();
  return {
    ...p,
    cota: cota ? { ano: cota.ano, total: Number(cota.total), documentos: Number(cota.documentos) } : null,
  };
}

export type ResumoParlamentar = NonNullable<Awaited<ReturnType<typeof resumoDoParlamentar>>>;
