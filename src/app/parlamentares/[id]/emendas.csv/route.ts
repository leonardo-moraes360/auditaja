import type { NextRequest } from "next/server";
import { getDb } from "@/db/client";
import { periodoEmendas } from "@/lib/emendas";

/** CSV com ";" e BOM, para abrir direto em planilhas em português. */
function celula(v: unknown): string {
  const s = v == null ? "" : String(v);
  return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** EMDUI-15: "Baixar CSV" da seção de emendas, uma linha por emenda do período (`?emendas=`). */
export async function GET(request: NextRequest, ctx: RouteContext<"/parlamentares/[id]/emendas.csv">) {
  const { id: idTexto } = await ctx.params;
  const id = /^\d{1,9}$/.test(idTexto) ? Number(idTexto) : null;
  if (!id) return new Response("Parlamentar não encontrado", { status: 404 });
  const db = getDb();
  const anos = (await db.selectFrom("emenda").select("ano").distinct().where("parlamentar_id", "=", id).execute()).map(
    (r) => r.ano,
  );
  const periodo = periodoEmendas(request.nextUrl.searchParams.get("emendas") ?? undefined, anos);
  const anosDoPeriodo = periodo === "mandato" ? anos : [periodo];
  if (request.nextUrl.searchParams.get("tabela") === "favorecidos") {
    // Quem recebeu cada pagamento (a tabela "Quem recebeu os pagamentos" do perfil, sem o corte dos maiores).
    // R3: pessoa física sem documento; o nome já é gravado como "Beneficiário pessoa física".
    const pagamentos = anos.length
      ? await db
          .selectFrom("emenda_favorecido")
          .select([
            "codigo_emenda",
            "ano_emenda",
            "ano_mes",
            "favorecido_nome",
            "tipo_favorecido",
            "natureza_juridica",
            "municipio",
            "uf",
            "valor",
            (eb) =>
              eb
                .case()
                .when("tipo_favorecido", "=", "Pessoa Fisica")
                .then(null)
                .else(eb.ref("favorecido_doc"))
                .end()
                .as("favorecido_doc"),
          ])
          .where("parlamentar_id", "=", id)
          .where("ano_emenda", "in", anosDoPeriodo)
          .orderBy("ano_emenda")
          .orderBy("codigo_emenda")
          .orderBy("ano_mes")
          .orderBy("favorecido_nome")
          .execute()
      : [];
    const cab = [
      "codigo_emenda",
      "ano_emenda",
      "mes_pagamento",
      "favorecido",
      "cnpj_ou_codigo",
      "tipo",
      "natureza_juridica",
      "municipio",
      "uf",
      "valor_recebido",
    ];
    const linhasFav = pagamentos.map((l) =>
      [
        l.codigo_emenda,
        l.ano_emenda,
        l.ano_mes,
        l.favorecido_nome,
        l.favorecido_doc,
        l.tipo_favorecido,
        l.natureza_juridica,
        l.municipio,
        l.uf,
        l.valor,
      ]
        .map(celula)
        .join(";"),
    );
    return new Response("\uFEFF" + [cab.join(";"), ...linhasFav].join("\r\n") + "\r\n", {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="emendas-favorecidos-${id}-${periodo}.csv"`,
      },
    });
  }
  const linhas = anos.length
    ? await db
        .selectFrom("emenda")
        .select(["codigo", "ano", "tipo", "localidade", "funcao", "empenhado", "liquidado", "pago", "rp_pagos"])
        .where("parlamentar_id", "=", id)
        .where("ano", "in", anosDoPeriodo)
        .orderBy("ano")
        .orderBy("codigo")
        .orderBy("localidade")
        .execute()
    : [];
  const cabecalho = [
    "codigo_emenda",
    "ano",
    "tipo",
    "local",
    "area",
    "empenhado",
    "liquidado",
    "pago",
    "restos_a_pagar_pagos",
  ];
  const corpo = linhas.map((l) =>
    [l.codigo, l.ano, l.tipo, l.localidade, l.funcao, l.empenhado, l.liquidado, l.pago, l.rp_pagos]
      .map(celula)
      .join(";"),
  );
  return new Response("﻿" + [cabecalho.join(";"), ...corpo].join("\r\n") + "\r\n", {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="emendas-${id}-${periodo}.csv"`,
    },
  });
}
