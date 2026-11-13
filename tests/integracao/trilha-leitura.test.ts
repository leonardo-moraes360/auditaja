import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createDb } from "@/db/client";
import { migrateToLatest } from "@/db/migrate";
import { SEED, semear } from "@/db/seed";
import type { TrilhaCheia } from "@/data/trilha";
import { CNPJ, EMENDA, limparTrilha, OUTRO, RITA, semearTrilha } from "../fixtures/trilha";

/** TRI-04, TRI-05, TRI-07, CNPJ-03..06, CICLO-03, CICLO-04, EDGE-03..05, LING-06, LING-07, LING-09. */
const URL_TESTE = process.env.TEST_DATABASE_URL ?? "postgres://auditaja:auditaja@127.0.0.1:5436/auditaja_trilha_test";
process.env.DATABASE_URL = URL_TESTE;
const db = createDb(URL_TESTE);
let disponivel = true;

beforeAll(async () => {
  try {
    await migrateToLatest(db);
    await semear(db);
    await semearTrilha(db);
  } catch (e) {
    console.error(e);
    disponivel = false;
  }
});
afterAll(async () => {
  if (disponivel) {
    await limparTrilha(db);
    await semear(db);
  }
  await db.destroy();
  const { getDb } = await import("@/db/client");
  await getDb().destroy();
});

const carregar = async () => await import("@/data/trilha");
async function cheia(id: number, periodo: number | "mandato" = "mandato"): Promise<TrilhaCheia> {
  const t = await (await carregar()).trilhaDoParlamentar(id, periodo);
  if (t.vazio) throw new Error("trilha vazia");
  return t;
}
const emendaDe = (t: TrilhaCheia, codigo: string) => t.emendas.find((e) => e.codigo === codigo)!;
const cents = (v: number) => Math.round(v * 100);

describe("trilhaDoParlamentar", () => {
  it("EDGE-04: parlamentar sem emenda Pix devolve vazio", async (ctx) => {
    if (!disponivel) ctx.skip();
    const t = await (await carregar()).trilhaDoParlamentar(SEED.deputado, "mandato");
    expect(t.vazio).toBe(true);
  });

  it("L-003: as 6 emendas Pix do mandato, acima do limite de 3 trilhas abertas, com indício primeiro", async (ctx) => {
    if (!disponivel) ctx.skip();
    const t = await cheia(RITA);
    expect(t.emendas.map((e) => [e.codigo, e.indicios])).toEqual([
      [EMENDA.campinas, 2],
      [EMENDA.sorocaba, 1],
      [EMENDA.fundo, 0],
      [EMENDA.itu, 0],
      [EMENDA.bauru, 0],
      [EMENDA.semPlano, 0],
    ]);
    expect(t.totais).toEqual({
      emendas: 6,
      transferido: 8_100_000,
      pago: 2_495_000,
      entes: 4,
      recebedoresPj: 10,
      pessoas: 3,
    });
  });

  it("TRI-04, TRI-07: trilha emenda → ente → empresas com valor por empresa e PF somadas sem nome", async (ctx) => {
    if (!disponivel) ctx.skip();
    const e = emendaDe(await cheia(RITA), EMENDA.sorocaba);
    expect(e).toMatchObject({ ano: 2025, funcao: "Saúde", transferido: 2_000_000, mesTransferencia: "2025-02" });
    const [p] = e.planos;
    expect(p.ente).toEqual({ nome: "MUNICIPIO DE SOROCABA", cnpj: CNPJ.sorocaba, uf: "SP" });
    expect(p.recebedores.map((r) => [r.nome, r.cnpj, r.valor, r.pagamentos, r.primeiroPagamento])).toEqual([
      ["CONSTRUTORA ILUSTRATIVA LTDA", CNPJ.construtora, 1_200_000, 2, "2025-03-25"],
      ["DISTRIBUIDORA HOSPITALAR MODELO S.A.", CNPJ.distribuidoraFilial, 214_000, 1, "2025-04-14"],
      ["ASSOCIACAO BENEFICENTE EXEMPLO", CNPJ.associacao, 98_000, 1, "2025-05-02"],
      ["SERVICOS MEDICOS FICTICIOS LTDA", CNPJ.servicos, 66_000, 1, "2025-05-19"],
      ["FUNDO MUNICIPAL DE SAUDE DE SOROCABA", CNPJ.fundoMunicipal, 10_000, 1, "2025-04-01"],
      ["EMPRESA SEM ABERTURA LTDA", CNPJ.semAbertura, 5_000, 1, "2025-06-01"],
      ["FILIAL SEM MATRIZ LTDA", CNPJ.soFilial, 4_000, 1, "2025-06-02"],
    ]);
    expect(p.pf).toEqual({ pagamentos: 3, valor: 12_000 });
    expect(JSON.stringify(p.pf)).not.toMatch(/nome|cnpj|cpf/i);
  });

  it("TRI-05: soma dos pagamentos + saldo = valor transferido, centavo a centavo", async (ctx) => {
    if (!disponivel) ctx.skip();
    const t = await cheia(RITA);
    const s = emendaDe(t, EMENDA.sorocaba).planos[0];
    expect([s.pago, s.saldo]).toEqual([1_609_000, 391_000]);
    for (const e of t.emendas)
      for (const p of e.planos) {
        if (p.pago < p.valor) expect(cents(p.pago) + cents(p.saldo)).toBe(cents(p.valor));
        else expect(p.saldo).toBe(0);
      }
    expect(emendaDe(t, EMENDA.fundo)).toMatchObject({ transferido: 1_800_000, pago: 0, saldo: 1_800_000 });
    expect(emendaDe(t, EMENDA.itu)).toMatchObject({ pago: 500_000, saldo: 0 });
    expect(emendaDe(t, EMENDA.semPlano)).toMatchObject({ planos: [], transferido: 0, empenhado: 250_000 });
  });

  it("D12, EDGE-05, CNPJ-05, CNPJ-06: abertura da matriz, da filial sem matriz, ou nenhuma; com o mês da base", async (ctx) => {
    if (!disponivel) ctx.skip();
    const rs = emendaDe(await cheia(RITA), EMENDA.sorocaba).planos[0].recebedores;
    const de = (c: string) => rs.find((r) => r.cnpj === c)!;
    expect(de(CNPJ.distribuidoraFilial).abertura).toEqual({ data: "2009-06-08", origem: "matriz", baseMes: "2026-10" });
    expect(de(CNPJ.distribuidoraFilial).recemAberta).toEqual({ dias: 5789, indicio: false });
    expect(de(CNPJ.soFilial).abertura).toEqual({ data: "2010-05-05", origem: "filial", baseMes: "2026-10" });
    expect(de(CNPJ.semAbertura)).toMatchObject({ abertura: null, recemAberta: null });
    expect((await cheia(RITA)).receitaBase).toBe("2026-10");
  });

  it("EDGE-03: ente público pago pelo município aparece sem avaliar recém-aberta", async (ctx) => {
    if (!disponivel) ctx.skip();
    const rs = emendaDe(await cheia(RITA), EMENDA.sorocaba).planos[0].recebedores;
    expect(rs.find((r) => r.cnpj === CNPJ.fundoMunicipal)).toMatchObject({ entePublico: true, recemAberta: null });
    expect(rs.filter((r) => r.entePublico)).toHaveLength(1);
  });

  it("CNPJ-03, CNPJ-04: recém-aberta com as duas datas e os dias; 179 dias marca, 180 não", async (ctx) => {
    if (!disponivel) ctx.skip();
    const t = await cheia(RITA);
    const recem = t.indicios.filter((i) => i.tipo === "recem-aberta");
    expect(recem.map((i) => [i.cnpj, i.emenda, i.abertura.data, i.primeiroPagamento, i.dias, i.recebido])).toEqual([
      [CNPJ.construtora, EMENDA.sorocaba, "2025-02-12", "2025-03-25", 41, 1_200_000],
      [CNPJ.limiar179, EMENDA.campinas, "2024-01-01", "2024-06-28", 179, 100_000],
    ]);
    const l180 = emendaDe(t, EMENDA.campinas).planos[0].recebedores.find((r) => r.cnpj === CNPJ.limiar180)!;
    expect(l180.recemAberta).toEqual({ dias: 180, indicio: false });
  });

  it("CICLO-03, CICLO-04, LING-06, D8: ciclo fechado só com a campanha de 2022 da própria parlamentar, até a data do pagamento", async (ctx) => {
    if (!disponivel) ctx.skip();
    const t = await cheia(RITA);
    expect(t.eleicao).toBe(2022);
    const ciclos = t.indicios.filter((i) => i.tipo === "ciclo-fechado");
    expect(
      ciclos.map((i) => [
        i.cnpj,
        i.emenda,
        i.direto,
        i.ente,
        i.recebido,
        i.primeiroRecebimento,
        i.ultimoRecebimento,
        i.despesaCampanha,
        i.primeiraDespesa,
        i.ultimaDespesa,
      ]),
    ).toEqual([
      [
        CNPJ.grafica,
        EMENDA.campinas,
        false,
        "MUNICIPIO DE CAMPINAS",
        86_000,
        "2024-04-10",
        "2024-09-02",
        32_000,
        "2022-09-15",
        "2022-09-20",
      ],
      [
        CNPJ.comunicacao,
        EMENDA.direta,
        true,
        null,
        40_000,
        "2025-06-01",
        "2025-06-01",
        8_000,
        "2022-08-10",
        "2022-08-10",
      ],
    ]);
    // A construtora está na campanha do outro deputado; serviços tem despesa depois do pagamento;
    // a associação só está na campanha de 2018.
    expect(ciclos.map((i) => i.cnpj)).not.toContain(CNPJ.construtora);
    expect(ciclos.map((i) => i.cnpj)).not.toContain(CNPJ.servicos);
    expect(ciclos.map((i) => i.cnpj)).not.toContain(CNPJ.associacao);
  });

  it("CICLO-04: o ciclo do outro deputado aparece só no perfil dele", async (ctx) => {
    if (!disponivel) ctx.skip();
    const t = await cheia(OUTRO);
    expect(t.indicios.map((i) => [i.tipo, i.cnpj])).toEqual([
      ["recem-aberta", CNPJ.construtora],
      ["ciclo-fechado", CNPJ.construtora],
    ]);
  });

  it("LING-09: cada indício cita as coletas de todos os elos, com data e SHA-256", async (ctx) => {
    if (!disponivel) ctx.skip();
    const t = await cheia(RITA);
    for (const i of t.indicios) {
      const fontes = i.coletas.map((id) => t.coletas[id]?.fonte).toSorted();
      expect(fontes).toEqual(
        i.tipo === "recem-aberta"
          ? ["receita_estabelecimentos", "transferegov_especiais"]
          : i.direto
            ? ["cgu_emendas", "tse_prestacao_contas"]
            : ["transferegov_especiais", "tse_prestacao_contas"],
      );
      for (const id of i.coletas) {
        expect(t.coletas[id].sha256).toMatch(/^[0-9a-f]{64}$/);
        expect(t.coletas[id].coletado_em).toBeInstanceOf(Date);
      }
    }
  });

  it("LING-07: taxa de base na base inteira, com o universo de cada sinal", async (ctx) => {
    if (!disponivel) ctx.skip();
    const t = await cheia(RITA);
    // Recém-aberta: 8 empresas com abertura conhecida (fora o ente público e a sem abertura); 2 com indício.
    // Ciclo: 3 parlamentares com emenda Pix (deputada do seed, Rita, Outro); Rita e Outro com ciclo.
    expect(t.taxas).toEqual({ recemAberta: [2, 8], ciclo: [2, 3] });
  });

  it("período de um ano só leva as emendas e os favorecidos diretos desse ano", async (ctx) => {
    if (!disponivel) ctx.skip();
    const t = await cheia(RITA, 2025);
    expect(t.emendas.map((e) => e.codigo).toSorted()).toEqual(
      [EMENDA.sorocaba, EMENDA.itu, EMENDA.bauru, EMENDA.semPlano].toSorted(),
    );
    expect(t.indicios.map((i) => [i.tipo, i.cnpj])).toEqual([
      ["recem-aberta", CNPJ.construtora],
      ["ciclo-fechado", CNPJ.comunicacao],
    ]);
    const vazio = await (await carregar()).trilhaDoParlamentar(RITA, 2023);
    expect(vazio.vazio).toBe(true);
  });
});
