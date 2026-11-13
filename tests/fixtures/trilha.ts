import type { Kysely } from "kysely";
import type { Database } from "@/db/types";
import { comDv } from "./cnpj";

/**
 * Trilha do dinheiro fictícia (feature seguir-dinheiro): ids 970.000.001 em diante, fora das faixas
 * do seed. Os dois deputados ficam fora de exercício, para não mudar listas nem médias.
 *
 * Rita (RITA) tem 6 emendas Pix (acima do limite de 3 trilhas abertas, L-003), uma emenda de
 * finalidade definida com favorecido direto e a campanha de 2022. Outro (OUTRO) tem uma emenda Pix
 * e uma campanha com a construtora da Rita (CICLO-04).
 */
const BASE = 970_000_000;
export const RITA = BASE + 1;
export const OUTRO = BASE + 2;
/** Emenda Pix com dois planos (CNPJ-03 por emenda), entes sem CNAE 84 e despesa de campanha tardia. */
export const TERCEIRO = BASE + 3;
/** Só tem campanha de 2018 (D8): não entra no ciclo nem na taxa de base. */
export const QUARTO = BASE + 4;
export const OBS_TRILHA = "seed trilha do dinheiro";

export const CNPJ = {
  sorocaba: comDv("970000010001"),
  campinas: comDv("970000020001"),
  fundoEstadual: comDv("970000030001"),
  enteX: comDv("970000040001"),
  construtora: comDv("444444440001"),
  distribuidoraFilial: comDv("667778880003"),
  distribuidoraMatriz: comDv("667778880001"),
  associacao: comDv("778889990001"),
  servicos: comDv("889990000001"),
  /** Ente público pelo CNAE 8411-6 (EDGE-03), aberto há pouco. */
  fundoMunicipal: comDv("555000110001"),
  /** Fora do lote da Receita (CNPJ-05). */
  semAbertura: comDv("321321320001"),
  /** Só a filial está no lote (EDGE-05). */
  soFilial: comDv("654654650002"),
  limiar179: comDv("179179170001"),
  limiar180: comDv("180180180001"),
  grafica: comDv("123456780001"),
  comunicacao: comDv("246246240001"),
  /** Paga por dois planos da mesma emenda. */
  novaDoisPlanos: comDv("590590590001"),
  /** Filial sem CNAE cuja matriz é da administração pública (CNAE 84). */
  enteFilial: comDv("840840840002"),
  enteMatriz: comDv("840840840001"),
  /** Primeiro pagamento da emenda é anterior à abertura; outro plano paga 30 dias depois dela. */
  pagaAntesDeAbrir: comDv("101010100001"),
};

export const EMENDA = {
  sorocaba: "202570010001",
  campinas: "202470010002",
  fundo: "202470010003",
  itu: "202570010004",
  bauru: "202570010005",
  semPlano: "202570010006",
  direta: "202570010007",
  doOutro: "202570020001",
  doTerceiro: "202570030001",
  doQuarto: "202570040001",
};

const ESP = "Emenda Individual - Transferências Especiais";
const FD = "Emenda Individual - Transferências com Finalidade Definida";

export async function semearTrilha(db: Kysely<Database>) {
  const coleta = async (
    fonte: string,
    url: string,
    sha: string,
    observacao: string,
    coletado_em = "2026-11-12T09:30:00Z",
  ) =>
    (
      await db
        .insertInto("coleta")
        .values({
          fonte,
          url,
          coletado_em,
          sha256: sha.padEnd(64, "0"),
          bytes: 0,
          licenca: "dados fictícios de teste",
          observacao: `${OBS_TRILHA} · ${observacao}`,
        })
        .returning("id")
        .executeTakeFirstOrThrow()
    ).id;
  const cCgu = await coleta(
    "cgu_emendas",
    "https://dadosabertos-download.cgu.gov.br/x.zip",
    "c9e1",
    "base de 09/11/2026",
    // Mais antiga que a do seed: a seção de emendas cita a coleta mais recente da CGU.
    "2026-11-01T09:30:00Z",
  );
  const cTg = await coleta(
    "transferegov_especiais",
    "https://api-publica.transferegov.gestao.gov.br/especiais",
    "b71d",
    "base de 12/11/2026 (data-atualizacao do Transferegov)",
  );
  const cRf = await coleta("receita_estabelecimentos", "file://Estabelecimentos0.zip", "3f9a", "base de 10/2026");
  const cTse = await coleta(
    "tse_prestacao_contas",
    "https://cdn.tse.jus.br/estatistica/sead/odsele/prestacao_contas/prestacao_de_contas_eleitorais_candidatos_2022.zip",
    "9c04",
    "despesas contratadas de candidatos, eleição de 2022",
  );

  await db
    .insertInto("parlamentar")
    .values(
      [
        [RITA, "Rita Trilha Fictícia"],
        [OUTRO, "Outro Trilha Fictício"],
        [TERCEIRO, "Terceiro Trilha Fictício"],
        [QUARTO, "Quarto Trilha Fictício"],
      ].map(([id, nome]) => ({
        id: id as number,
        casa: "camara" as const,
        nome: nome as string,
        sexo: id === RITA ? "F" : "M",
        sigla_partido: "PFX",
        sigla_uf: "SP",
        em_exercicio: false,
        id_legislatura: 57,
        source_url: "https://example.invalid/trilha",
        coleta_id: cCgu,
      })),
    )
    .execute();

  const emenda = (
    parlamentar_id: number,
    codigo: string,
    ano: number,
    localidade: string,
    funcao: string,
    v: number,
    tipo = ESP,
  ) => ({
    codigo,
    ano,
    tipo,
    autor_nome: "RITA TRILHA",
    parlamentar_id,
    localidade,
    uf: "SÃO PAULO",
    funcao,
    empenhado: v,
    liquidado: v,
    pago: v,
    rp_pagos: 0,
    coleta_id: cCgu,
  });
  await db
    .insertInto("emenda")
    .values([
      emenda(RITA, EMENDA.sorocaba, 2025, "SOROCABA - SP", "Saúde", 2_000_000),
      emenda(RITA, EMENDA.campinas, 2024, "CAMPINAS - SP", "Urbanismo", 3_500_000),
      emenda(RITA, EMENDA.fundo, 2024, "SÃO PAULO (UF)", "Saúde", 1_800_000),
      emenda(RITA, EMENDA.itu, 2025, "ITU - SP", "Educação", 500_000),
      emenda(RITA, EMENDA.bauru, 2025, "BAURU - SP", "Cultura", 300_000),
      emenda(RITA, EMENDA.semPlano, 2025, "JUNDIAÍ - SP", "Saúde", 250_000),
      emenda(RITA, EMENDA.direta, 2025, "SOROCABA - SP", "Saúde", 40_000, FD),
      emenda(OUTRO, EMENDA.doOutro, 2025, "SOROCABA - SP", "Saúde", 900_000),
      emenda(TERCEIRO, EMENDA.doTerceiro, 2025, "ITU - SP", "Saúde", 1_000_000),
      emenda(QUARTO, EMENDA.doQuarto, 2025, "ITU - SP", "Saúde", 100_000),
    ])
    .execute();
  await db
    .insertInto("emenda_favorecido")
    .values({
      codigo_emenda: EMENDA.direta,
      parlamentar_id: RITA,
      ano_emenda: 2025,
      ano_mes: "202506",
      favorecido_nome: "Comunicação Direta Fictícia Ltda",
      favorecido_doc: `${CNPJ.comunicacao.slice(0, 2)}.${CNPJ.comunicacao.slice(2, 5)}.${CNPJ.comunicacao.slice(5, 8)}/${CNPJ.comunicacao.slice(8, 12)}-${CNPJ.comunicacao.slice(12)}`,
      tipo_favorecido: "Pessoa Jurídica",
      natureza_juridica: "Sociedade Empresária Limitada",
      uf: "SP",
      municipio: "SOROCABA",
      valor: 40_000,
      coleta_id: cCgu,
    })
    .execute();

  const plano = (
    id: number,
    pid: number,
    codigo: string,
    ente: string,
    nome: string,
    valor: number,
    aceite: string,
  ) => ({
    id_plano_acao: id,
    codigo_emenda: codigo,
    codigo_plano: `0903-${String(id).padStart(6, "0")}`,
    parlamentar_id: pid,
    beneficiario_cnpj: ente,
    beneficiario_nome: nome,
    beneficiario_uf: "SP",
    valor,
    data_aceite: aceite,
    coleta_id: cTg,
  });
  await db
    .insertInto("transf_plano")
    .values([
      plano(97001, RITA, EMENDA.sorocaba, CNPJ.sorocaba, "MUNICIPIO DE SOROCABA", 2_000_000, "2025-02-20"),
      plano(97002, RITA, EMENDA.campinas, CNPJ.campinas, "MUNICIPIO DE CAMPINAS", 3_500_000, "2024-03-01"),
      plano(97003, RITA, EMENDA.fundo, CNPJ.fundoEstadual, "FUNDO ESTADUAL DE SAUDE", 1_800_000, "2024-04-01"),
      plano(97004, RITA, EMENDA.itu, CNPJ.enteX, "MUNICIPIO DE ITU", 500_000, "2025-03-01"),
      plano(97005, RITA, EMENDA.bauru, CNPJ.enteX, "MUNICIPIO DE ITU", 300_000, "2025-03-01"),
      plano(97009, OUTRO, EMENDA.doOutro, CNPJ.sorocaba, "MUNICIPIO DE SOROCABA", 900_000, "2025-03-01"),
      plano(97031, TERCEIRO, EMENDA.doTerceiro, CNPJ.enteX, "MUNICIPIO DE ITU", 600_000, "2025-02-01"),
      plano(97032, TERCEIRO, EMENDA.doTerceiro, CNPJ.campinas, "MUNICIPIO DE CAMPINAS", 400_000, "2025-02-01"),
      plano(97041, QUARTO, EMENDA.doQuarto, CNPJ.enteX, "MUNICIPIO DE ITU", 100_000, "2025-02-01"),
    ])
    .execute();

  let n = 9_700_000;
  const pj = (plano: number, cnpj: string, nome: string, valor: number, data: string) => ({
    id: ++n,
    id_plano_acao: plano,
    tipo: "pj" as const,
    recebedor_cnpj: cnpj,
    recebedor_nome: nome,
    valor,
    data_pagamento: data,
    coleta_id: cTg,
  });
  const pf = (plano: number, valor: number, data: string) => ({
    id: ++n,
    id_plano_acao: plano,
    tipo: "pf" as const,
    recebedor_cnpj: null,
    recebedor_nome: null,
    valor,
    data_pagamento: data,
    coleta_id: cTg,
  });
  await db
    .insertInto("transf_pagamento")
    .values([
      pj(97001, CNPJ.construtora, "CONSTRUTORA ILUSTRATIVA LTDA", 1_000_000, "2025-03-25"),
      pj(97001, CNPJ.construtora, "CONSTRUTORA ILUSTRATIVA LTDA", 200_000, "2025-05-10"),
      pj(97001, CNPJ.distribuidoraFilial, "DISTRIBUIDORA HOSPITALAR MODELO S.A.", 214_000, "2025-04-14"),
      pj(97001, CNPJ.associacao, "ASSOCIACAO BENEFICENTE EXEMPLO", 98_000, "2025-05-02"),
      pj(97001, CNPJ.servicos, "SERVICOS MEDICOS FICTICIOS LTDA", 66_000, "2025-05-19"),
      pj(97001, CNPJ.fundoMunicipal, "FUNDO MUNICIPAL DE SAUDE DE SOROCABA", 10_000, "2025-04-01"),
      pj(97001, CNPJ.semAbertura, "EMPRESA SEM ABERTURA LTDA", 5_000, "2025-06-01"),
      pj(97001, CNPJ.soFilial, "FILIAL SEM MATRIZ LTDA", 4_000, "2025-06-02"),
      pf(97001, 5_000, "2025-04-03"),
      pf(97001, 4_000, "2025-04-04"),
      pf(97001, 3_000, "2025-04-05"),
      pj(97002, CNPJ.grafica, "GRAFICA EXEMPLO LTDA", 50_000, "2024-04-10"),
      pj(97002, CNPJ.grafica, "GRAFICA EXEMPLO LTDA", 36_000, "2024-09-02"),
      pj(97002, CNPJ.limiar179, "ABERTA HA 179 DIAS LTDA", 100_000, "2024-06-28"),
      pj(97002, CNPJ.limiar180, "ABERTA HA 180 DIAS LTDA", 100_000, "2024-06-29"),
      pj(97004, CNPJ.associacao, "ASSOCIACAO BENEFICENTE EXEMPLO", 500_000, "2025-07-01"),
      pj(97005, CNPJ.servicos, "SERVICOS MEDICOS FICTICIOS LTDA", 100_000, "2025-08-01"),
      pj(97009, CNPJ.construtora, "CONSTRUTORA ILUSTRATIVA LTDA", 300_000, "2025-04-01"),
      // Plano 97031 paga depois de 180 dias; o 97032, da mesma emenda, antes: vale o primeiro da emenda.
      pj(97031, CNPJ.novaDoisPlanos, "NOVA DOIS PLANOS LTDA", 70_000, "2025-08-01"),
      pj(97032, CNPJ.novaDoisPlanos, "NOVA DOIS PLANOS LTDA", 30_000, "2025-03-01"),
      // EDGE-03: recebedor que é ente beneficiário de plano, sem CNAE 84, aberto há pouco.
      pj(97032, CNPJ.enteX, "MUNICIPIO DE ITU", 20_000, "2025-03-02"),
      // EDGE-03: filial sem CNAE, matriz com CNAE 84 aberta há pouco.
      pj(97032, CNPJ.enteFilial, "CONSORCIO PUBLICO FICTICIO", 10_000, "2025-03-03"),
      // LING-06: o primeiro pagamento da emenda (plano 97031) é anterior à abertura: sem indício,
      // mesmo com o plano 97032 pagando 30 dias depois dela.
      pj(97031, CNPJ.pagaAntesDeAbrir, "PAGA ANTES DE ABRIR LTDA", 5_000, "2025-03-15"),
      pj(97032, CNPJ.pagaAntesDeAbrir, "PAGA ANTES DE ABRIR LTDA", 5_000, "2025-05-01"),
      pj(97041, CNPJ.associacao, "ASSOCIACAO BENEFICENTE EXEMPLO", 50_000, "2025-05-01"),
    ])
    .execute();

  const ab = (cnpj: string, matriz: boolean, inicio: string, cnae = "4120400") => ({
    cnpj,
    cnpj_basico: cnpj.slice(0, 8),
    matriz,
    inicio_atividade: inicio,
    cnae_principal: cnae,
    base_mes: "2026-10",
    coleta_id: cRf,
  });
  await db
    .insertInto("cnpj_abertura")
    .values([
      ab(CNPJ.construtora, true, "2025-02-12"),
      ab(CNPJ.distribuidoraMatriz, true, "2009-06-08", "4645101"),
      ab(CNPJ.distribuidoraFilial, false, "2025-01-01", "4645101"),
      ab(CNPJ.associacao, true, "1994-09-21", "9430800"),
      ab(CNPJ.servicos, true, "2018-01-30", "8630503"),
      ab(CNPJ.fundoMunicipal, true, "2025-03-01", "8411600"),
      ab(CNPJ.soFilial, false, "2010-05-05"),
      ab(CNPJ.limiar179, true, "2024-01-01"),
      ab(CNPJ.limiar180, true, "2024-01-01"),
      ab(CNPJ.grafica, true, "2001-01-01", "1813001"),
      ab(CNPJ.novaDoisPlanos, true, "2025-01-01"),
      ab(CNPJ.pagaAntesDeAbrir, true, "2025-04-01"),
      ab(CNPJ.enteX, true, "2025-01-01", "4120400"),
      { ...ab(CNPJ.enteFilial, false, "2025-01-01"), cnae_principal: null },
      ab(CNPJ.enteMatriz, true, "2025-01-01", "8411600"),
    ])
    .execute();

  await db
    .insertInto("candidatura")
    .values(
      [
        [RITA, "trilha-rita-22", 2022],
        [RITA, "trilha-rita-18", 2018],
        [OUTRO, "trilha-outro-22", 2022],
        [TERCEIRO, "trilha-terceiro-22", 2022],
        [QUARTO, "trilha-quarto-18", 2018],
      ].map(([pid, sq, ano]) => ({
        ano_eleicao: ano as number,
        sq_candidato: sq as string,
        parlamentar_id: pid as number,
        cargo: "DEPUTADO FEDERAL",
        sigla_uf: "SP",
        sigla_partido: "PFX",
        situacao: "ELEITO",
        coleta_id: cTse,
      })),
    )
    .execute();
  const desp = (pid: number, sq: string, ano: number, cnpj: string, valor: number, data: string) => ({
    ano_eleicao: ano,
    sq_candidato: sq,
    parlamentar_id: pid,
    fornecedor_cnpj: cnpj,
    valor,
    data_despesa: data,
    coleta_id: cTse,
  });
  await db
    .insertInto("campanha_despesa")
    .values([
      desp(RITA, "trilha-rita-22", 2022, CNPJ.grafica, 20_000, "2022-09-15"),
      desp(RITA, "trilha-rita-22", 2022, CNPJ.grafica, 12_000, "2022-09-20"),
      desp(RITA, "trilha-rita-22", 2022, CNPJ.comunicacao, 8_000, "2022-08-10"),
      // LING-06: despesa com data depois dos pagamentos não fecha ciclo.
      desp(RITA, "trilha-rita-22", 2022, CNPJ.servicos, 1_000, "2025-09-01"),
      // D8: campanha de outra eleição não conta.
      desp(RITA, "trilha-rita-18", 2018, CNPJ.associacao, 5_000, "2018-09-01"),
      // CICLO-04: a construtora da Rita na campanha do outro deputado.
      desp(OUTRO, "trilha-outro-22", 2022, CNPJ.construtora, 7_000, "2022-09-01"),
      // LING-06 na taxa de base: despesa depois de todos os pagamentos.
      desp(TERCEIRO, "trilha-terceiro-22", 2022, CNPJ.novaDoisPlanos, 1_000, "2025-12-01"),
      // D8 na taxa de base: só a campanha de 2018, que não deu o mandato atual.
      desp(QUARTO, "trilha-quarto-18", 2018, CNPJ.associacao, 2_000, "2018-09-01"),
    ])
    .execute();
}

export async function limparTrilha(db: Kysely<Database>) {
  await db.deleteFrom("parlamentar").where("id", "in", [RITA, OUTRO, TERCEIRO, QUARTO]).execute();
  await db.deleteFrom("cnpj_abertura").where("cnpj", "in", Object.values(CNPJ)).execute();
  await db.deleteFrom("coleta").where("observacao", "like", `${OBS_TRILHA}%`).execute();
}
