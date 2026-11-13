import { createHash } from "node:crypto";
import type { Insertable, Kysely } from "kysely";
import type { Database, TransfPagamentoTable, TransfPlanoTable } from "@/db/types";
import { TIPO_TRANSFERENCIA_ESPECIAL } from "@/lib/emendas";
import { soDigitos } from "@/lib/privacy";
import { cnpjValido, recebedorPublicavel } from "@/lib/trilha";
import { inserirEmBlocos, registrarColeta } from "./coleta";
import { ColetaBloqueada, type ClienteEducado } from "./http";

/**
 * Transferegov, módulo de Transferências Especiais ("emendas Pix"), API pública sem chave.
 * robots.txt do host responde 404 (permitido). Uma página por vez, a 1 req/s (ClienteEducado, R7).
 *
 * Trilha: plano de ação (código da emenda) → relatório de gestão → documentos de liquidação
 * (quem o ente pagou, com CNPJ, valor e data). Os lançamentos bancários não servem: o favorecido
 * vem mascarado. R2: banco, agência e conta do plano nunca são lidos para o banco.
 */
export const API_TRANSFEREGOV = "https://api-publica.transferegov.gestao.gov.br/especiais";
export const LICENCA_TRANSFEREGOV = "API de dados abertos do Transferegov (MGI); dados abertos, Decreto 8.777/2016";
/** Máximo aceito pela API (acima disso, 422). */
export const TAMANHO_PAGINA = 200;

type Pagina<T> = { data: T[]; total_pages: number; total_items: number; page_number: number; page_size: number };

export type Paginacao = {
  /** Recebe o corpo cru de cada resposta (para o SHA-256 da coleta). */
  aoReceber?: (corpo: string) => void;
};

/**
 * Pagina um recurso até `total_pages`, deduplicando por `id` (a base muda todo dia e a paginação
 * é por deslocamento: uma linha pode aparecer em duas páginas). Qualquer resposta que não seja
 * 200 com JSON paginado encerra a coleta com ColetaBloqueada (TRI-06).
 */
export async function* paginas<T>(
  cli: ClienteEducado,
  recurso: string,
  params: Record<string, string | number>,
  id: (linha: T) => string | number,
  op: Paginacao = {},
): AsyncGenerator<T[]> {
  const vistos = new Set<string | number>();
  for (let pagina = 1, total = 1; pagina <= total; pagina++) {
    const url = new URL(`${API_TRANSFEREGOV}/${recurso}`);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
    url.searchParams.set("pagina", String(pagina));
    url.searchParams.set("tamanho_da_pagina", String(TAMANHO_PAGINA));
    let corpo: string;
    try {
      corpo = await (await cli.get(url.toString())).text();
    } catch (e) {
      if (e instanceof ColetaBloqueada) throw e;
      throw new ColetaBloqueada(`Transferegov: ${e instanceof Error ? e.message : String(e)}`);
    }
    let p: Pagina<T>;
    try {
      p = JSON.parse(corpo) as Pagina<T>;
    } catch {
      throw new ColetaBloqueada(`Transferegov: resposta de ${recurso} não é JSON`);
    }
    if (!Array.isArray(p?.data) || !Number.isInteger(p.total_pages)) {
      throw new ColetaBloqueada(`Transferegov: resposta de ${recurso} sem paginação`);
    }
    op.aoReceber?.(corpo);
    total = p.total_pages;
    const novas = p.data.filter((l) => {
      const k = id(l);
      if (vistos.has(k)) return false;
      vistos.add(k);
      return true;
    });
    yield novas;
  }
}

type PlanoApi = {
  id_plano_acao: number;
  codigo_plano_acao: string;
  numero_emenda_parlamentar_plano_acao: number | string | null;
  ano_emenda_parlamentar_plano_acao: number | null;
  data_aceite_plano_acao: string | null;
  valor_custeio_plano_acao: number | null;
  valor_investimento_plano_acao: number | null;
  id_beneficiario: number | null;
};
type RelatorioApi = { id_relatorio_gestao_novo: number; id_plano_acao: number };
type LiquidacaoApi = {
  id_relatorio_gestao_dl: number;
  id_relatorio_gestao_novo: number;
  tp_doc_recebedor_relatorio_gestao_dl: string | null;
  tx_identificacao_recebedor_mascarado_relatorio_gestao_dl: string | null;
  tx_nome_recebedor_relatorio_gestao_dl: string | null;
  vl_pagamento_relatorio_gestao_dl: number | null;
  dt_pagamento_relatorio_gestao_dl: string | null;
};
type BeneficiarioApi = {
  id_beneficiario: number;
  uf_beneficiario: string | null;
  nome_beneficiario: string | null;
  cnpj_beneficiario: string | null;
};

export type ResumoPix = {
  /** Planos ligados a uma emenda Pix da base. */
  planos: number;
  /** Documentos de liquidação gravados (PJ e PF). */
  pagamentos: number;
  /** EDGE-01: planos sem código de emenda. */
  semCodigo: number;
  /** Planos com código de emenda que não é de emenda Pix de parlamentar da base. */
  foraDaBase: number;
  /** EDGE-02: pagamentos descartados por CNPJ com dígito verificador inválido. */
  cnpjInvalido: number;
  /** TRI-07: pagamentos a pessoa física, gravados sem nome nem documento. */
  pf: number;
  /** Pagamentos sem data ou sem valor, descartados. */
  incompletos: number;
};

/** Código da emenda no formato do Portal da Transparência (12 dígitos). */
export function codigoDaEmenda(v: number | string | null | undefined): string | null {
  const d = soDigitos(v == null ? "" : String(v));
  return d ? d.padStart(12, "0") : null;
}

/** "2026-11-12T00:00:00" → "12/11/2026". */
function dataApiBr(iso: string | null | undefined): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? "");
  return m ? `${m[3]}/${m[2]}/${m[1]}` : null;
}

function centavos(v: number | null | undefined): string {
  return (Math.round((v ?? 0) * 100) / 100).toFixed(2);
}

/**
 * TRI-01..TRI-07, EDGE-01, EDGE-02: grava planos de ação de emendas Pix da base e os pagamentos
 * informados pelo ente. Tudo é baixado antes de tocar no banco; a troca é numa transação, então um
 * erro no meio mantém a coleta anterior (TRI-06).
 */
export async function coletarTransferegovPix(db: Kysely<Database>, cli: ClienteEducado): Promise<ResumoPix> {
  const hash = createHash("sha256");
  let bytes = 0;
  const aoReceber = (corpo: string) => {
    hash.update(corpo);
    bytes += Buffer.byteLength(corpo);
  };

  let atualizacao: string | null = null;
  try {
    const corpo = await (await cli.get(`${API_TRANSFEREGOV}/data-atualizacao`)).text();
    aoReceber(corpo);
    atualizacao = dataApiBr((JSON.parse(corpo) as { data_ultima_atualizacao?: string }).data_ultima_atualizacao);
  } catch (e) {
    if (e instanceof ColetaBloqueada) throw e;
    throw new ColetaBloqueada(`Transferegov: data-atualizacao falhou (${e instanceof Error ? e.message : e})`);
  }

  // TRI-02: liga pelo código da emenda publicado no Transferegov; nunca pelo nome do autor ou do ente.
  const pix = await db
    .selectFrom("emenda")
    .select(["codigo", "parlamentar_id", "ano"])
    .where("tipo", "=", TIPO_TRANSFERENCIA_ESPECIAL)
    .execute();
  const donoDoCodigo = new Map(pix.map((e) => [e.codigo, e.parlamentar_id]));
  const anos = [...new Set(pix.map((e) => e.ano))].toSorted();

  const resumo: ResumoPix = {
    planos: 0,
    pagamentos: 0,
    semCodigo: 0,
    foraDaBase: 0,
    cnpjInvalido: 0,
    pf: 0,
    incompletos: 0,
  };
  const planos = new Map<number, PlanoApi & { codigo: string; parlamentar_id: number }>();
  // Um ano por vez: só os orçamentos que a base tem (menos requisições).
  for (const ano of anos) {
    for await (const pg of paginas<PlanoApi>(
      cli,
      "planos-acao-especiais",
      { ano_emenda_parlamentar_plano_acao: ano },
      (p) => p.id_plano_acao,
      { aoReceber },
    )) {
      for (const p of pg) {
        const codigo = codigoDaEmenda(p.numero_emenda_parlamentar_plano_acao);
        if (!codigo) {
          resumo.semCodigo++;
          continue;
        }
        const dono = donoDoCodigo.get(codigo);
        if (dono === undefined) {
          resumo.foraDaBase++;
          continue;
        }
        planos.set(p.id_plano_acao, { ...p, codigo, parlamentar_id: dono });
      }
    }
  }

  const beneficiarios = new Map<number, BeneficiarioApi>();
  const idsBenef = new Set([...planos.values()].map((p) => p.id_beneficiario).filter((x) => x != null));
  if (idsBenef.size) {
    for await (const pg of paginas<BeneficiarioApi>(cli, "beneficiarios-especiais", {}, (b) => b.id_beneficiario, {
      aoReceber,
    })) {
      for (const b of pg) if (idsBenef.has(b.id_beneficiario)) beneficiarios.set(b.id_beneficiario, b);
    }
  }

  const planoDoRelatorio = new Map<number, number>();
  if (planos.size) {
    for await (const pg of paginas<RelatorioApi>(
      cli,
      "relatorios-gestao-novos-especiais",
      {},
      (r) => r.id_relatorio_gestao_novo,
      { aoReceber },
    )) {
      for (const r of pg)
        if (planos.has(r.id_plano_acao)) planoDoRelatorio.set(r.id_relatorio_gestao_novo, r.id_plano_acao);
    }
  }

  // coleta_id entra na transação, depois que tudo foi baixado.
  const pagamentos: Omit<Insertable<TransfPagamentoTable>, "coleta_id">[] = [];
  if (planoDoRelatorio.size) {
    for await (const pg of paginas<LiquidacaoApi>(
      cli,
      "relatorios-gestao-documento-liquidacao-especiais",
      {},
      (d) => d.id_relatorio_gestao_dl,
      { aoReceber },
    )) {
      for (const d of pg) {
        const idPlano = planoDoRelatorio.get(d.id_relatorio_gestao_novo);
        if (idPlano === undefined) continue;
        const data = /^\d{4}-\d{2}-\d{2}/.exec(d.dt_pagamento_relatorio_gestao_dl ?? "")?.[0];
        if (!data || d.vl_pagamento_relatorio_gestao_dl == null) {
          resumo.incompletos++;
          continue;
        }
        const r = recebedorPublicavel(
          d.tp_doc_recebedor_relatorio_gestao_dl ?? "",
          d.tx_identificacao_recebedor_mascarado_relatorio_gestao_dl ?? "",
          d.tx_nome_recebedor_relatorio_gestao_dl ?? "",
        );
        if (r.tipo === "invalido") {
          resumo.cnpjInvalido++;
          continue;
        }
        if (r.tipo === "pf") resumo.pf++;
        pagamentos.push({
          id: d.id_relatorio_gestao_dl,
          id_plano_acao: idPlano,
          tipo: r.tipo,
          recebedor_cnpj: r.tipo === "pj" ? r.cnpj : null,
          recebedor_nome: r.tipo === "pj" ? r.nome : null,
          valor: centavos(d.vl_pagamento_relatorio_gestao_dl),
          data_pagamento: data,
        });
      }
    }
  }

  await db.transaction().execute(async (trx) => {
    const coletaId = await registrarColeta(trx, {
      fonte: "transferegov_especiais",
      url: API_TRANSFEREGOV,
      sha256: hash.digest("hex"),
      bytes,
      licenca: LICENCA_TRANSFEREGOV,
      observacao: atualizacao ? `base de ${atualizacao} (data-atualizacao do Transferegov)` : undefined,
    });
    const linhasPlano: Insertable<TransfPlanoTable>[] = [...planos.values()].map((p) => {
      const b = p.id_beneficiario != null ? beneficiarios.get(p.id_beneficiario) : undefined;
      const cnpj = soDigitos(b?.cnpj_beneficiario);
      return {
        id_plano_acao: p.id_plano_acao,
        codigo_emenda: p.codigo,
        codigo_plano: p.codigo_plano_acao,
        parlamentar_id: p.parlamentar_id,
        beneficiario_cnpj: cnpjValido(cnpj) ? cnpj : null,
        beneficiario_nome: b?.nome_beneficiario?.trim() || null,
        beneficiario_uf: b?.uf_beneficiario?.trim() || null,
        valor: centavos((p.valor_custeio_plano_acao ?? 0) + (p.valor_investimento_plano_acao ?? 0)),
        data_aceite: /^\d{4}-\d{2}-\d{2}/.exec(p.data_aceite_plano_acao ?? "")?.[0] ?? null,
        coleta_id: coletaId,
      };
    });
    await trx.deleteFrom("transf_pagamento").execute();
    await trx.deleteFrom("transf_plano").execute();
    await inserirEmBlocos(trx, "transf_plano", linhasPlano);
    await inserirEmBlocos(
      trx,
      "transf_pagamento",
      pagamentos.map((p) => ({ ...p, coleta_id: coletaId })),
    );
  });
  resumo.planos = planos.size;
  resumo.pagamentos = pagamentos.length;
  return resumo;
}
