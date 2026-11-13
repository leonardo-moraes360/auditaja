import type { NextRequest } from "next/server";
import { getDb } from "@/db/client";
import { trilhaDoParlamentar } from "@/data/trilha";
import { periodoEmendas, TIPO_TRANSFERENCIA_ESPECIAL } from "@/lib/emendas";
import { METODOLOGIA_VERSAO } from "@/lib/metrics";

/** CSV com ";" e BOM, para abrir direto em planilhas em português. */
function celula(v: unknown): string {
  const s = v == null ? "" : String(v);
  return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const CABECALHO = [
  "codigo_emenda",
  "ano",
  "area",
  "codigo_plano",
  "ente",
  "ente_cnpj",
  "valor_transferido",
  "elo",
  "recebedor",
  "recebedor_cnpj",
  "valor",
  "pagamentos",
  "primeiro_pagamento",
  "abertura",
  "origem_abertura",
  "base_receita",
  "indicio",
  "versao_metodologia",
];

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
  const linhas: unknown[][] = [];
  if (!t.vazio) {
    const indiciosDe = (emenda: string, cnpj: string) =>
      t.indicios
        .filter((i) => i.emenda === emenda && i.cnpj === cnpj)
        .map((i) => i.tipo)
        .join("|");
    for (const e of t.emendas) {
      if (!e.planos.length) {
        linhas.push([
          e.codigo,
          e.ano,
          e.funcao,
          "",
          "",
          "",
          "",
          "sem_plano",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          METODOLOGIA_VERSAO,
        ]);
        continue;
      }
      for (const p of e.planos) {
        const base = [e.codigo, e.ano, e.funcao, p.codigoPlano, p.ente.nome, p.ente.cnpj, p.valor.toFixed(2)];
        for (const r of p.recebedores)
          linhas.push([
            ...base,
            r.entePublico ? "ente_publico" : "pessoa_juridica",
            r.nome,
            r.cnpj,
            r.valor.toFixed(2),
            r.pagamentos,
            r.primeiroPagamento,
            r.abertura?.data ?? "",
            r.abertura?.origem ?? "",
            r.abertura?.baseMes ?? "",
            indiciosDe(e.codigo, r.cnpj),
            METODOLOGIA_VERSAO,
          ]);
        if (p.pf.pagamentos)
          linhas.push([
            ...base,
            "pessoas_fisicas",
            "",
            "",
            p.pf.valor.toFixed(2),
            p.pf.pagamentos,
            "",
            "",
            "",
            "",
            "",
            METODOLOGIA_VERSAO,
          ]);
        if (p.saldo > 0)
          linhas.push([
            ...base,
            "sem_pagamento_registrado",
            "",
            "",
            p.saldo.toFixed(2),
            "",
            "",
            "",
            "",
            "",
            "",
            METODOLOGIA_VERSAO,
          ]);
      }
    }
    // Ciclo com favorecido pago direto pela União (fora do Transferegov).
    for (const i of t.indicios)
      if (i.tipo === "ciclo-fechado" && i.direto)
        linhas.push([
          i.emenda,
          "",
          "",
          "",
          "",
          "",
          "",
          "favorecido_direto",
          i.nome,
          i.cnpj,
          i.recebido.toFixed(2),
          "",
          i.primeiroRecebimento,
          "",
          "",
          "",
          i.tipo,
          METODOLOGIA_VERSAO,
        ]);
  }
  const corpo = linhas.map((l) => l.map(celula).join(";"));
  return new Response("﻿" + [CABECALHO.join(";"), ...corpo].join("\r\n") + "\r\n", {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="trilha-${id}-${periodo}.csv"`,
    },
  });
}
