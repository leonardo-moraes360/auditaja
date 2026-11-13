import type { TrilhaCheia } from "@/data/trilha";
import { METODOLOGIA_VERSAO } from "@auditaja/core/metrics";

export const CABECALHO_CSV_TRILHA = [
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
 * LING-05: linhas do CSV da trilha, uma por recebedor de cada plano. A coluna `indicio` só leva os indícios
 * do próprio par (emenda, CNPJ): um terceiro nunca herda o indício de outra empresa da mesma emenda.
 * R3: pessoas físicas só numa linha somada, sem nome nem documento.
 */
export function linhasCsvTrilha(t: TrilhaCheia): unknown[][] {
  const linhas: unknown[][] = [];
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
  return linhas;
}
