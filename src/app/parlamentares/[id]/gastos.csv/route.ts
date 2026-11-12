import type { NextRequest } from "next/server";
import { getDb } from "@/db/client";

/** "AAAA-MM-DD" de uma data que existe; "2026-13-99" não passa. */
function dataIsoValida(s: string | null): boolean {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

/** CSV com ";" e BOM, para abrir direto em planilhas em português. */
function celula(v: unknown): string {
  const s = v == null ? "" : String(v);
  return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * "Baixar CSV" da seção de gastos: as notas da CEAP do deputado no ano (ou no mandato),
 * opcionalmente de um fornecedor. Só campos já minimizados na coleta (AD-002): CPF de
 * pessoa física chega mascarado e sem nome.
 */
export async function GET(request: NextRequest, ctx: RouteContext<"/parlamentares/[id]/gastos.csv">) {
  const { id: idTexto } = await ctx.params;
  const id = /^\d{1,9}$/.test(idTexto) ? Number(idTexto) : null;
  if (!id) return new Response("Parlamentar não encontrado", { status: 404 });
  const sp = request.nextUrl.searchParams;
  const ano = sp.get("ano");
  const doc = sp.get("doc");
  // Período de uma sanção (aviso de sanção): datas ISO, inclusive.
  const de = sp.get("de");
  const ate = sp.get("ate");

  let q = getDb()
    .selectFrom("despesa_ceap")
    .select([
      "ano",
      "mes",
      "data_emissao",
      "tipo_despesa",
      "fornecedor_nome",
      "fornecedor_doc",
      "valor_documento",
      "valor_glosa",
      "valor_liquido",
      "url_documento",
    ])
    .where("parlamentar_id", "=", id)
    .orderBy("ano")
    .orderBy("mes")
    .orderBy("data_emissao");
  if (ano && /^\d{4}$/.test(ano)) q = q.where("ano", "=", Number(ano));
  if (doc) q = q.where("fornecedor_doc", "=", doc);
  if (dataIsoValida(de)) q = q.where("data_emissao", ">=", de!);
  if (dataIsoValida(ate)) q = q.where("data_emissao", "<=", ate!);
  const linhas = await q.execute();

  const cabecalho = [
    "ano",
    "mes",
    "data_emissao",
    "tipo_despesa",
    "fornecedor",
    "cnpj_cpf",
    "valor_documento",
    "valor_glosa",
    "valor_liquido",
    "url_documento",
  ];
  const corpo = linhas.map((l) =>
    [
      l.ano,
      l.mes,
      l.data_emissao ? String(l.data_emissao).slice(0, 10) : "",
      l.tipo_despesa,
      l.fornecedor_nome,
      l.fornecedor_doc,
      l.valor_documento,
      l.valor_glosa,
      l.valor_liquido,
      l.url_documento,
    ]
      .map(celula)
      .join(";"),
  );
  const nome = `ceap-${id}-${ano && /^\d{4}$/.test(ano) ? ano : "mandato"}${doc ? "-fornecedor" : ""}.csv`;
  return new Response("﻿" + [cabecalho.join(";"), ...corpo].join("\r\n") + "\r\n", {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${nome}"`,
    },
  });
}
