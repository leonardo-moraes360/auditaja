import "server-only";
import { sql } from "kysely";
import { getDb } from "@/db/client";
import { TIPO_TRANSFERENCIA_ESPECIAL, type PeriodoEmendas } from "@/lib/emendas";
import { soDigitos } from "@/lib/privacy";
import {
  aberturaConsiderada,
  estadoAvaliacao,
  cicloFechado,
  dataDoAnoMes,
  DIAS_RECEM_ABERTA,
  eleicaoDoMandato,
  ehEntePublico,
  recemAberta,
  type DespesaCampanha,
  type Recebimento,
} from "@/lib/trilha";

/**
 * Leitura da trilha do dinheiro das emendas Pix de um parlamentar (TRI-04, TRI-05, CNPJ-05, CNPJ-06,
 * EDGE-03, EDGE-04, LING-06, LING-07, LING-09). Os indícios são calculados aqui, a cada leitura,
 * pelas regras puras de src/lib/trilha.ts: nada é gravado.
 */

export type ColetaCitada = {
  id: number;
  fonte: string;
  url: string;
  coletado_em: Date;
  sha256: string;
  observacao: string | null;
};

export type Abertura = {
  data: string;
  origem: "matriz" | "filial";
  /** AAAA-MM do lote da Receita. */
  baseMes: string;
};

export type RecebedorTrilha = {
  cnpj: string;
  nome: string;
  valor: number;
  pagamentos: number;
  primeiroPagamento: string;
  /** EDGE-03: outro ente público (não é avaliado como recém-aberta). */
  entePublico: boolean;
  /** null: CNPJ fora do lote importado da Receita (CNPJ-05). */
  abertura: Abertura | null;
  recemAberta: { dias: number; indicio: boolean } | null;
};

export type PlanoTrilha = {
  id: number;
  codigoPlano: string;
  ente: { nome: string | null; cnpj: string | null; uf: string | null };
  valor: number;
  dataAceite: string | null;
  recebedores: RecebedorTrilha[];
  /** TRI-07: pagamentos a pessoa física, somados, sem nome nem documento. */
  pf: { pagamentos: number; valor: number };
  pago: number;
  /** TRI-05: valor transferido menos os pagamentos registrados (nunca negativo). */
  saldo: number;
  coletaId: number;
};

export type EmendaTrilha = {
  codigo: string;
  ano: number;
  funcao: string;
  localidade: string;
  empenhado: number;
  uf: string | null;
  planos: PlanoTrilha[];
  transferido: number;
  pago: number;
  saldo: number;
  /** Primeiro mês com aceite do plano, "AAAA-MM". */
  mesTransferencia: string | null;
  indicios: number;
};

export type IndicioRecemAberta = {
  tipo: "recem-aberta";
  emenda: string;
  /** DENS-09: plano (município) do primeiro pagamento, para "Ver na trilha". */
  plano: number;
  ente: string | null;
  cnpj: string;
  nome: string;
  abertura: Abertura;
  primeiroPagamento: string;
  dias: number;
  /** Total que a empresa recebeu ligado a essa emenda. */
  recebido: number;
  coletas: number[];
};

export type IndicioCiclo = {
  tipo: "ciclo-fechado";
  /** DENS-09: plano do primeiro recebimento; null no pagamento direto da União. */
  plano: number | null;
  /** Código da emenda; `direto` quando o favorecido foi pago direto pela União (Portal da Transparência). */
  emenda: string;
  direto: boolean;
  ente: string | null;
  cnpj: string;
  nome: string;
  recebido: number;
  primeiroRecebimento: string;
  ultimoRecebimento: string;
  despesaCampanha: number;
  primeiraDespesa: string;
  ultimaDespesa: string;
  eleicao: number;
  coletas: number[];
};

export type Indicio = IndicioRecemAberta | IndicioCiclo;

export type TaxasDeBase = {
  /** Empresas pagas com emenda Pix (fora entes públicos) com data de abertura na base: [com indício, total]. */
  recemAberta: [number, number];
  /** Parlamentares com emenda Pix: [com ao menos um ciclo fechado, total]. */
  ciclo: [number, number];
};

const cents = (v: number) => Math.round(v * 100);
const reais = (c: number) => c / 100;

/** Mais frequente; empate pelo primeiro em ordem alfabética (estável entre leituras). */
function moda(vs: string[]): string {
  const n = new Map<string, number>();
  for (const v of vs) n.set(v, (n.get(v) ?? 0) + 1);
  return [...n].toSorted((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] ?? "";
}

/**
 * LING-07: taxa de base de cada sinal, na base inteira (todas as emendas Pix e todos os parlamentares),
 * com as mesmas regras do perfil: uma consulta agregada por sinal.
 */
export async function taxasDeBase(): Promise<TaxasDeBase> {
  const db = getDb();
  const recem = await sql<{ n: string; m: string }>`
    with entes as (
      select distinct beneficiario_cnpj as c from transf_plano where beneficiario_cnpj is not null
    ),
    pag as (
      select pl.codigo_emenda, pg.recebedor_cnpj as cnpj, min(pg.data_pagamento) as primeiro
      from transf_pagamento pg join transf_plano pl on pl.id_plano_acao = pg.id_plano_acao
      where pg.tipo = 'pj'
      group by 1, 2
    ),
    av as (
      select pag.cnpj, pag.primeiro,
        coalesce(m.inicio_atividade, f.inicio_atividade) as abertura,
        coalesce(f.cnae_principal, m.cnae_principal) as cnae
      from pag
      left join cnpj_abertura f on f.cnpj = pag.cnpj
      left join cnpj_abertura m on m.cnpj_basico = left(pag.cnpj, 8) and m.matriz
    )
    select
      count(distinct cnpj) filter (where abertura is not null) as n,
      count(distinct cnpj) filter (
        where abertura is not null and primeiro - abertura >= 0 and primeiro - abertura < ${DIAS_RECEM_ABERTA}
      ) as m
    from av
    where cnpj not in (select c from entes) and coalesce(cnae, '') not like '84%'
  `.execute(db);
  const ciclo = await sql<{ n: string; m: string }>`
    with par as (
      select p.id,
        case when p.casa = 'senado' then extract(year from p.mandato_inicio)::int - 1
             else 2022 + 4 * (p.id_legislatura - 57) end as eleicao
      from parlamentar p
      where exists (select 1 from emenda e where e.parlamentar_id = p.id and e.tipo = ${TIPO_TRANSFERENCIA_ESPECIAL})
    ),
    rec as (
      select pl.parlamentar_id as pid, pg.recebedor_cnpj as cnpj, pg.data_pagamento as data
      from transf_pagamento pg join transf_plano pl on pl.id_plano_acao = pg.id_plano_acao
      where pg.tipo = 'pj'
      union all
      select ef.parlamentar_id, regexp_replace(ef.favorecido_doc, '\\D', '', 'g'), to_date(ef.ano_mes || '01', 'YYYYMMDD')
      from emenda_favorecido ef
      where ef.tipo_favorecido <> 'Pessoa Fisica' and ef.favorecido_doc is not null and ef.ano_mes ~ '^[0-9]{4}(0[1-9]|1[0-2])$'
    )
    select count(*) as n,
      count(*) filter (where exists (
        select 1 from rec
        join campanha_despesa d on d.parlamentar_id = rec.pid and d.fornecedor_cnpj = rec.cnpj
        where rec.pid = par.id and d.ano_eleicao = par.eleicao and d.data_despesa <= rec.data
      )) as m
    from par
  `.execute(db);
  return {
    recemAberta: [Number(recem.rows[0]?.m ?? 0), Number(recem.rows[0]?.n ?? 0)],
    ciclo: [Number(ciclo.rows[0]?.m ?? 0), Number(ciclo.rows[0]?.n ?? 0)],
  };
}

/** Mês do lote vigente da Receita ("AAAA-MM"), para "base de MM/AAAA" (CNPJ-05, CNPJ-06). */
export async function baseDaReceita(): Promise<string | null> {
  const r = await getDb()
    .selectFrom("cnpj_abertura")
    .select((eb) => eb.fn.max("base_mes").as("m"))
    .executeTakeFirst();
  return r?.m ?? null;
}

/** EDGE-04 quando `vazio`; senão a trilha das emendas Pix do período, indícios e taxas de base. */
export async function trilhaDoParlamentar(id: number, periodo: PeriodoEmendas) {
  const db = getDb();
  const parlamentar = await db
    .selectFrom("parlamentar")
    .select(["casa", "id_legislatura", "mandato_inicio"])
    .where("id", "=", id)
    .executeTakeFirst();
  const eleicao = parlamentar ? eleicaoDoMandato(parlamentar) : null;

  let qEmendas = db
    .selectFrom("emenda")
    .select([
      "codigo",
      sql<number>`min(ano)`.as("ano"),
      sql<string>`mode() within group (order by funcao)`.as("funcao"),
      sql<string>`string_agg(distinct localidade, ' · ' order by localidade)`.as("localidade"),
      sql<string>`sum(empenhado)`.as("empenhado"),
    ])
    .where("parlamentar_id", "=", id)
    .where("tipo", "=", TIPO_TRANSFERENCIA_ESPECIAL)
    .groupBy("codigo");
  if (periodo !== "mandato") qEmendas = qEmendas.where("ano", "=", periodo);
  const emendasPix = await qEmendas.execute();
  const [taxas, receitaBase] = await Promise.all([taxasDeBase(), baseDaReceita()]);
  if (!emendasPix.length) return { vazio: true as const, eleicao, taxas, receitaBase };

  const codigos = emendasPix.map((e) => e.codigo);
  const planos = await db
    .selectFrom("transf_plano")
    .selectAll()
    .where("parlamentar_id", "=", id)
    .where("codigo_emenda", "in", codigos)
    .orderBy("id_plano_acao")
    .execute();
  const idsPlano = planos.map((p) => p.id_plano_acao);
  const pagamentos = idsPlano.length
    ? await db
        .selectFrom("transf_pagamento")
        .selectAll()
        .where("id_plano_acao", "in", idsPlano)
        .orderBy("data_pagamento")
        .orderBy("id")
        .execute()
    : [];
  const cnpjsPj = [...new Set(pagamentos.flatMap((p) => (p.recebedor_cnpj ? [p.recebedor_cnpj] : [])))];
  const basicos = [...new Set(cnpjsPj.map((c) => c.slice(0, 8)))];
  const [aberturas, entes] = cnpjsPj.length
    ? await Promise.all([
        db
          .selectFrom("cnpj_abertura")
          .selectAll()
          .where((eb) =>
            eb.or([eb("cnpj", "in", cnpjsPj), eb.and([eb("cnpj_basico", "in", basicos), eb("matriz", "=", true)])]),
          )
          .execute(),
        db
          .selectFrom("transf_plano")
          .select("beneficiario_cnpj")
          .distinct()
          .where("beneficiario_cnpj", "in", cnpjsPj)
          .execute(),
      ])
    : [[], []];
  const porCnpj = new Map(aberturas.map((a) => [a.cnpj, a]));
  const matrizDe = new Map(aberturas.filter((a) => a.matriz).map((a) => [a.cnpj_basico, a]));
  const cnpjsDeEnte = new Set(entes.map((e) => e.beneficiario_cnpj));

  const pagamentosDoPlano = new Map<number, typeof pagamentos>();
  for (const p of pagamentos)
    pagamentosDoPlano.set(p.id_plano_acao, [...(pagamentosDoPlano.get(p.id_plano_acao) ?? []), p]);

  const indicios: Indicio[] = [];
  const recebimentosPix: (Recebimento & {
    emenda: string;
    plano: number;
    ente: string | null;
    nome: string;
    coleta: number;
  })[] = [];

  const emendas: EmendaTrilha[] = emendasPix.map((e) => {
    const planosDe = planos.filter((p) => p.codigo_emenda === e.codigo);
    // CNPJ-03: o primeiro pagamento conta por emenda (todos os planos dela), não por plano.
    const daEmenda = new Map<string, { pg: (typeof pagamentos)[number]; ente: string | null }[]>();
    for (const p of planosDe)
      for (const pg of pagamentosDoPlano.get(p.id_plano_acao) ?? [])
        if (pg.tipo === "pj" && pg.recebedor_cnpj)
          daEmenda.set(pg.recebedor_cnpj, [
            ...(daEmenda.get(pg.recebedor_cnpj) ?? []),
            { pg, ente: p.beneficiario_nome },
          ]);
    for (const l of daEmenda.values())
      l.sort((a, b) => a.pg.data_pagamento.localeCompare(b.pg.data_pagamento) || a.pg.id - b.pg.id);
    const avisados = new Set<string>();
    const planosDaEmenda: PlanoTrilha[] = planosDe.map((p) => {
      const pgs = pagamentosDoPlano.get(p.id_plano_acao) ?? [];
      const porRecebedor = new Map<string, typeof pgs>();
      for (const pg of pgs) {
        if (pg.tipo !== "pj" || !pg.recebedor_cnpj) continue;
        porRecebedor.set(pg.recebedor_cnpj, [...(porRecebedor.get(pg.recebedor_cnpj) ?? []), pg]);
      }
      const recebedores: RecebedorTrilha[] = [...porRecebedor].map(([cnpj, lista]) => {
        const propria = porCnpj.get(cnpj) ?? null;
        const matriz = matrizDe.get(cnpj.slice(0, 8)) ?? null;
        const ab = aberturaConsiderada(
          matriz && { inicio: matriz.inicio_atividade },
          propria && { inicio: propria.inicio_atividade },
        );
        const fonteAb = ab.origem === "matriz" ? matriz : propria;
        const entePublico =
          cnpjsDeEnte.has(cnpj) || ehEntePublico(propria?.cnae_principal ?? matriz?.cnae_principal ?? null);
        const primeiro = lista[0].data_pagamento;
        const abertura: Abertura | null =
          ab.data && ab.origem && fonteAb ? { data: ab.data, origem: ab.origem, baseMes: fonteAb.base_mes } : null;
        const naEmenda = daEmenda.get(cnpj)!;
        const ra = abertura && !entePublico ? recemAberta(abertura.data, naEmenda[0].pg.data_pagamento) : null;
        const nome = moda(lista.map((x) => x.recebedor_nome ?? ""));
        const valor = reais(lista.reduce((t, x) => t + cents(Number(x.valor)), 0));
        if (ra?.indicio && abertura && fonteAb && !avisados.has(cnpj)) {
          avisados.add(cnpj);
          indicios.push({
            tipo: "recem-aberta",
            emenda: e.codigo,
            ente: naEmenda[0].ente,
            plano: naEmenda[0].pg.id_plano_acao,
            cnpj,
            nome,
            abertura,
            primeiroPagamento: naEmenda[0].pg.data_pagamento,
            dias: ra.dias,
            recebido: reais(naEmenda.reduce((t, x) => t + cents(Number(x.pg.valor)), 0)),
            coletas: [...new Set([...naEmenda.map((x) => x.pg.coleta_id), fonteAb.coleta_id])],
          });
        }
        if (!entePublico) {
          for (const x of lista)
            recebimentosPix.push({
              cnpj,
              parlamentarId: id,
              data: x.data_pagamento,
              valor: Number(x.valor),
              emenda: e.codigo,
              ente: p.beneficiario_nome,
              nome,
              coleta: x.coleta_id,
              plano: p.id_plano_acao,
            });
        }
        return {
          cnpj,
          nome,
          valor,
          pagamentos: lista.length,
          primeiroPagamento: primeiro,
          entePublico,
          abertura,
          recemAberta: ra,
        };
      });
      recebedores.sort((a, b) => b.valor - a.valor || a.nome.localeCompare(b.nome));
      const pfs = pgs.filter((x) => x.tipo === "pf");
      const pagoC = pgs.reduce((t, x) => t + cents(Number(x.valor)), 0);
      const valorC = cents(Number(p.valor));
      return {
        id: p.id_plano_acao,
        codigoPlano: p.codigo_plano,
        ente: { nome: p.beneficiario_nome, cnpj: p.beneficiario_cnpj, uf: p.beneficiario_uf },
        valor: reais(valorC),
        dataAceite: p.data_aceite,
        recebedores,
        pf: { pagamentos: pfs.length, valor: reais(pfs.reduce((t, x) => t + cents(Number(x.valor)), 0)) },
        pago: reais(pagoC),
        saldo: reais(Math.max(0, valorC - pagoC)),
        coletaId: p.coleta_id,
      };
    });
    // DENS-03: municípios em ordem de valor pago (depois o transferido).
    planosDaEmenda.sort((a, b) => b.pago - a.pago || b.valor - a.valor || a.id - b.id);
    const ufs = planosDaEmenda.flatMap((p) => (p.ente.uf ? [p.ente.uf] : []));
    const transferidoC = planosDaEmenda.reduce((t, p) => t + cents(p.valor), 0);
    const pagoC = planosDaEmenda.reduce((t, p) => t + cents(p.pago), 0);
    const saldoC = planosDaEmenda.reduce((t, p) => t + cents(p.saldo), 0);
    const aceites = planosDaEmenda.flatMap((p) => (p.dataAceite ? [p.dataAceite] : [])).toSorted();
    return {
      codigo: e.codigo,
      ano: Number(e.ano),
      funcao: e.funcao,
      localidade: e.localidade,
      empenhado: Number(e.empenhado),
      /** UF mais frequente dos entes; "várias" quando há mais de uma. */
      uf: new Set(ufs).size > 1 ? "várias UFs" : (ufs[0] ?? null),
      planos: planosDaEmenda,
      transferido: reais(transferidoC),
      pago: reais(pagoC),
      saldo: reais(saldoC),
      mesTransferencia: aceites[0]?.slice(0, 7) ?? null,
      indicios: 0,
    };
  });

  // Ciclo fechado: pagos com a emenda Pix (por emenda) e favorecidos diretos do Portal, contra a
  // campanha D8 do mesmo parlamentar.
  const despesasRows =
    eleicao === null
      ? []
      : await db
          .selectFrom("campanha_despesa")
          .select(["fornecedor_cnpj", "valor", "data_despesa", "coleta_id"])
          .where("parlamentar_id", "=", id)
          .where("ano_eleicao", "=", eleicao)
          .execute();
  // DENS-06: o TSE da eleição do mandato foi importado (para qualquer candidato)?
  const tseImportado =
    eleicao !== null &&
    (despesasRows.length > 0 ||
      !!(await db
        .selectFrom("campanha_despesa")
        .select("id")
        .where("ano_eleicao", "=", eleicao)
        .limit(1)
        .executeTakeFirst()));
  const despesas: (DespesaCampanha & { coleta: number })[] = despesasRows.map((d) => ({
    cnpj: d.fornecedor_cnpj,
    parlamentarId: id,
    data: d.data_despesa,
    valor: Number(d.valor),
    coleta: d.coleta_id,
  }));
  const coletaTse = (cnpj: string) => [...new Set(despesas.filter((d) => d.cnpj === cnpj).map((d) => d.coleta))];

  if (despesas.length) {
    const grupos = new Map<string, typeof recebimentosPix>();
    for (const r of recebimentosPix) grupos.set(r.emenda, [...(grupos.get(r.emenda) ?? []), r]);
    for (const [emenda, rs] of grupos) {
      for (const c of cicloFechado(rs, despesas)) {
        const r0 = rs.find((r) => r.cnpj === c.cnpj && r.data === c.primeiroRecebimento)!;
        indicios.push({
          tipo: "ciclo-fechado",
          emenda,
          plano: r0.plano,
          direto: false,
          ente: r0.ente,
          nome: r0.nome,
          ...c,
          eleicao: eleicao!,
          coletas: [...new Set([...rs.filter((r) => r.cnpj === c.cnpj).map((r) => r.coleta), ...coletaTse(c.cnpj)])],
        });
      }
    }
    let qDiretos = db
      .selectFrom("emenda_favorecido")
      .select(["codigo_emenda", "favorecido_nome", "favorecido_doc", "ano_mes", "valor", "coleta_id"])
      .where("parlamentar_id", "=", id)
      .where("tipo_favorecido", "<>", "Pessoa Fisica")
      .where("favorecido_doc", "is not", null);
    if (periodo !== "mandato") qDiretos = qDiretos.where("ano_emenda", "=", periodo);
    const diretos = (await qDiretos.execute()).flatMap((f) => {
      const data = dataDoAnoMes(f.ano_mes);
      const cnpj = soDigitos(f.favorecido_doc);
      return data && cnpj.length === 14
        ? [
            {
              cnpj,
              parlamentarId: id,
              data,
              valor: Number(f.valor),
              emenda: f.codigo_emenda,
              nome: f.favorecido_nome,
              coleta: f.coleta_id,
            },
          ]
        : [];
    });
    const porEmenda = new Map<string, typeof diretos>();
    for (const r of diretos) porEmenda.set(r.emenda, [...(porEmenda.get(r.emenda) ?? []), r]);
    for (const [emenda, rs] of porEmenda) {
      for (const c of cicloFechado(rs, despesas)) {
        const r0 = rs.find((r) => r.cnpj === c.cnpj)!;
        indicios.push({
          tipo: "ciclo-fechado",
          emenda,
          plano: null,
          direto: true,
          ente: null,
          nome: r0.nome,
          ...c,
          eleicao: eleicao!,
          coletas: [...new Set([...rs.filter((r) => r.cnpj === c.cnpj).map((r) => r.coleta), ...coletaTse(c.cnpj)])],
        });
      }
    }
  }

  for (const e of emendas) e.indicios = indicios.filter((i) => i.emenda === e.codigo).length;
  // Emendas com indício primeiro (os avisos apontam para elas), depois pelo valor transferido.
  emendas.sort(
    (a, b) =>
      b.indicios - a.indicios ||
      b.transferido - a.transferido ||
      b.empenhado - a.empenhado ||
      a.codigo.localeCompare(b.codigo),
  );
  indicios.sort((a, b) => (a.tipo === b.tipo ? 0 : a.tipo === "recem-aberta" ? -1 : 1) || b.recebido - a.recebido);

  const ids = [...new Set([...indicios.flatMap((i) => i.coletas), ...planos.map((p) => p.coleta_id)])];
  const coletas: ColetaCitada[] = ids.length
    ? await db
        .selectFrom("coleta")
        .select(["id", "fonte", "url", "coletado_em", "sha256", "observacao"])
        .where("id", "in", ids)
        .execute()
    : [];

  const todosPlanos = emendas.flatMap((e) => e.planos);
  const recebedoresPj = new Set(todosPlanos.flatMap((p) => p.recebedores.map((r) => r.cnpj)));
  return {
    vazio: false as const,
    eleicao,
    taxas,
    receitaBase,
    /**
     * DENS-06: um sinal só é avaliado quando a base dele existe para este perfil: alguma empresa paga (fora
     * entes públicos) com data de abertura na Receita; despesas de campanha da eleição do mandato no TSE.
     */
    avaliacao: {
      recemAberta: estadoAvaliacao(
        receitaBase !== null,
        todosPlanos.some((p) => p.recebedores.some((r) => !r.entePublico && r.abertura)),
      ),
      ciclo: estadoAvaliacao(tseImportado, despesasRows.length > 0),
    },
    emendas,
    indicios,
    coletas: Object.fromEntries(coletas.map((c) => [c.id, c])) as Record<number, ColetaCitada>,
    totais: {
      emendas: emendas.length,
      transferido: reais(emendas.reduce((t, e) => t + cents(e.transferido), 0)),
      pago: reais(emendas.reduce((t, e) => t + cents(e.pago), 0)),
      entes: new Set(todosPlanos.map((p) => p.ente.cnpj ?? p.ente.nome ?? String(p.id))).size,
      recebedoresPj: recebedoresPj.size,
      pessoas: todosPlanos.reduce((t, p) => t + p.pf.pagamentos, 0),
    },
  };
}

export type Trilha = Awaited<ReturnType<typeof trilhaDoParlamentar>>;
export type TrilhaCheia = Extract<Trilha, { vazio: false }>;
