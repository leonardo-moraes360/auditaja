import type { NextRequest } from "next/server";
import { getDb } from "@auditaja/db/client";
import { trilhaDoParlamentar } from "@/data/trilha";
import { periodoEmendas, TIPO_TRANSFERENCIA_ESPECIAL } from "@auditaja/core/emendas";
import { CABECALHO_CSV_TRILHA, linhasCsvTrilha } from "@/lib/trilha-csv";

/** CSV com ";" e BOM, para abrir direto em planilhas em português. */
function celula(v: unknown): string {
  const s = v == null ? "" : String(v);
  return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * LING-05: elos e indícios da trilha do dinheiro das emendas Pix, uma linha por recebedor de cada plano.
 * R3: pessoas físicas só numa linha somada, sem nome nem documento.
 */
export async function GET(request: NextRequest, ctx: RouteContext<"/parlamentares/[id]/trilha.csv">) {
  const { id: idTexto } = await ctx.params;
  const id = /^\d{1,9}$/.test(idTexto) ? Number(idTexto) : null;
  if (!id) return new Response("Parlamentar não encontrado", { status: 404 });
  const anos = (
    await getDb()
      .selectFrom("emenda")
      .select("ano")
      .distinct()
      .where("parlamentar_id", "=", id)
      .where("tipo", "=", TIPO_TRANSFERENCIA_ESPECIAL)
      .execute()
  ).map((r) => r.ano);
  const periodo = periodoEmendas(request.nextUrl.searchParams.get("emendas") ?? undefined, anos);
  const t = await trilhaDoParlamentar(id, periodo);
  const linhas = t.vazio ? [] : linhasCsvTrilha(t);
  const corpo = linhas.map((l) => l.map(celula).join(";"));
  return new Response("﻿" + [CABECALHO_CSV_TRILHA.join(";"), ...corpo].join("\r\n") + "\r\n", {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="trilha-${id}-${periodo}.csv"`,
    },
  });
}
