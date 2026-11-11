import type { Kysely } from "kysely";
import type { Database } from "./types";

/**
 * Dados FICTÍCIOS para testes e desenvolvimento sem rede.
 * Os ids ficam acima de 900000000 para não colidir com ids reais da Câmara.
 */
export const SEED = {
  deputada: 900000001,
  deputado: 900000002,
  foraDeExercicio: 900000003,
  /** Senadores fictícios: código do Senado 9001 e 9002 (id = 10.000.000 + código). */
  senador: 10009001,
  senadora: 10009002,
  /** Fora de exercício, com votos: não entra na média do Senado. */
  senadorAfastado: 10009003,
  /** Fora de exercício, sem votos nem notas: estados vazios. */
  senadoraSemRegistro: 10009004,
};

export async function semear(db: Kysely<Database>) {
  await db.transaction().execute(async (trx) => {
    for (const t of [
      "pedido_correcao",
      "bem_declarado",
      "candidatura",
      "orientacao",
      "voto",
      "votacao",
      "despesa_ceap",
      "orgao_membro",
      "suplente",
      "bloco_partido",
      "bloco",
      "parlamentar",
      "coleta",
    ] as const) {
      await trx.deleteFrom(t).execute();
    }
    const coleta = async (fonte: string, url: string) =>
      (
        await trx
          .insertInto("coleta")
          .values({
            fonte,
            url,
            coletado_em: "2026-11-10T08:12:00Z",
            sha256: "0".repeat(64),
            bytes: 0,
            licenca: "dados fictícios de teste",
            observacao: "seed",
          })
          .returning("id")
          .executeTakeFirstOrThrow()
      ).id;
    const cDep = await coleta("camara_api_deputados", "https://dadosabertos.camara.leg.br/api/v2/deputados");
    const cCeap = await coleta("camara_ceap", "https://www.camara.leg.br/cotas/Ano-2026.csv.zip");
    const cVot = await coleta(
      "camara_lote_votos",
      "https://dadosabertos.camara.leg.br/arquivos/votacoesVotos/csv/votacoesVotos-2026.csv",
    );
    const cTse = await coleta(
      "tse_bem_candidato",
      "https://cdn.tse.jus.br/estatistica/sead/odsele/bem_candidato/bem_candidato_2026.zip",
    );

    await trx
      .insertInto("parlamentar")
      .values([
        {
          id: SEED.deputada,
          casa: "camara",
          nome: "Maria Exemplo",
          nome_civil: "MARIA EXEMPLO DA SILVA",
          sigla_partido: "PFX",
          sigla_uf: "SP",
          url_foto: null,
          data_nascimento: "1975-04-10",
          sexo: "F",
          id_legislatura: 57,
          em_exercicio: true,
          source_url: "https://dadosabertos.camara.leg.br/api/v2/deputados/900000001",
          coleta_id: cDep,
        },
        {
          id: SEED.deputado,
          casa: "camara",
          nome: "João Ilustrativo",
          nome_civil: "JOAO ILUSTRATIVO",
          sigla_partido: "PFY",
          sigla_uf: "RJ",
          url_foto: null,
          data_nascimento: null,
          id_legislatura: 57,
          em_exercicio: true,
          source_url: "https://dadosabertos.camara.leg.br/api/v2/deputados/900000002",
          coleta_id: cDep,
        },
        {
          id: SEED.foraDeExercicio,
          casa: "camara",
          nome: "Joana Licenciada",
          nome_civil: "JOANA LICENCIADA",
          sigla_partido: "PFX",
          sigla_uf: "MG",
          url_foto: null,
          data_nascimento: null,
          id_legislatura: 57,
          em_exercicio: false,
          source_url: "https://dadosabertos.camara.leg.br/api/v2/deputados/900000003",
          coleta_id: cDep,
        },
      ])
      .execute();

    await trx
      .insertInto("orgao_membro")
      .values([
        {
          parlamentar_id: SEED.deputada,
          sigla_orgao: "CFT",
          nome_orgao: "Comissão de Finanças e Tributação",
          cargo: "Titular",
          data_inicio: "2025-03-01",
          data_fim: null,
          coleta_id: cDep,
        },
        {
          // Encerrado: não deve aparecer no perfil.
          parlamentar_id: SEED.deputada,
          sigla_orgao: "CE",
          nome_orgao: "Comissão de Educação",
          cargo: "Titular",
          data_inicio: "2023-03-01",
          data_fim: "2025-02-28",
          coleta_id: cDep,
        },
      ])
      .execute();

    const despesa = (
      mes: number,
      tipo: string,
      nome: string,
      doc: string | null,
      classe: "pessoa_juridica" | "terceiro_pf",
      valor: number,
    ) => ({
      parlamentar_id: SEED.deputada,
      ano: 2026,
      mes,
      tipo_despesa: tipo,
      fornecedor_nome: nome,
      fornecedor_doc: doc,
      fornecedor_classe: classe,
      data_emissao: `2026-${String(mes).padStart(2, "0")}-10`,
      valor_documento: valor,
      valor_glosa: 0,
      valor_liquido: valor,
      valor_restituicao: 0,
      url_documento: null,
      ide_documento: `seed-${mes}-${valor}`,
      coleta_id: cCeap,
    });
    await trx
      .insertInto("despesa_ceap")
      .values([
        despesa(
          1,
          "DIVULGAÇÃO DA ATIVIDADE PARLAMENTAR.",
          "Gráfica Exemplo Ltda",
          "12.345.678/0001-90",
          "pessoa_juridica",
          30000,
        ),
        despesa(
          2,
          "COMBUSTÍVEIS E LUBRIFICANTES.",
          "Posto Ilustrativo Ltda",
          "55.666.777/0001-88",
          "pessoa_juridica",
          4500,
        ),
        despesa(
          3,
          "CONSULTORIAS, PESQUISAS E TRABALHOS TÉCNICOS.",
          "Prestador pessoa física",
          "***.456.789-**",
          "terceiro_pf",
          9600,
        ),
      ])
      .execute();

    await trx
      .insertInto("votacao")
      .values([
        {
          id: "seed-1",
          data: "2026-10-29",
          sigla_orgao: "PLEN",
          descricao: "Rejeitada a PEC fictícia 12/2026",
          proposicao: null,
          proposicao_sigla: "PEC 12/2026",
          proposicao_ementa: "Regras fiscais fictícias para estados.",
          aprovacao: 0,
          votos_sim: 200,
          votos_nao: 250,
          votos_outros: 3,
          source_url: "https://dadosabertos.camara.leg.br/api/v2/votacoes/seed-1",
          coleta_id: cVot,
        },
        {
          id: "seed-2",
          data: "2026-11-05",
          sigla_orgao: "PLEN",
          descricao: "Aprovado o PL fictício 1.234/2026",
          proposicao: null,
          proposicao_sigla: "PL 1234/2026",
          proposicao_ementa: "Licenciamento ambiental fictício.",
          aprovacao: 1,
          votos_sim: 300,
          votos_nao: 100,
          votos_outros: 0,
          source_url: "https://dadosabertos.camara.leg.br/api/v2/votacoes/seed-2",
          coleta_id: cVot,
        },
        {
          id: "seed-3",
          data: "2026-11-06",
          sigla_orgao: "PLEN",
          descricao: "Aprovada a MPV fictícia 1.300/2026",
          proposicao: null,
          proposicao_sigla: "MPV 1300/2026",
          proposicao_ementa: "Crédito extraordinário fictício.",
          aprovacao: 1,
          votos_sim: 300,
          votos_nao: 100,
          votos_outros: 0,
          source_url: "https://dadosabertos.camara.leg.br/api/v2/votacoes/seed-3",
          coleta_id: cVot,
        },
        {
          // A Câmara publica linhas de voto vazias: não contam como presença.
          id: "seed-4",
          data: "2026-09-01",
          sigla_orgao: "PLEN",
          descricao: "Mantido o veto fictício 9/2026",
          proposicao: null,
          aprovacao: 1,
          votos_sim: 300,
          votos_nao: 100,
          votos_outros: 0,
          source_url: "https://dadosabertos.camara.leg.br/api/v2/votacoes/seed-4",
          coleta_id: cVot,
        },
      ])
      .execute();
    await trx
      .insertInto("voto")
      .values([
        { votacao_id: "seed-1", parlamentar_id: SEED.deputada, voto: "Não", sigla_partido: "PFX", coleta_id: cVot },
        { votacao_id: "seed-2", parlamentar_id: SEED.deputada, voto: "Sim", sigla_partido: "PFX", coleta_id: cVot },
        { votacao_id: "seed-4", parlamentar_id: SEED.deputada, voto: "", sigla_partido: "PFX", coleta_id: cVot },
      ])
      .execute();
    await trx
      .insertInto("orientacao")
      .values([
        { votacao_id: "seed-1", sigla_bancada: "PFX", orientacao: "Sim", coleta_id: cVot },
        { votacao_id: "seed-2", sigla_bancada: "PFX", orientacao: "Sim", coleta_id: cVot },
        { votacao_id: "seed-3", sigla_bancada: "PFX", orientacao: "Sim", coleta_id: cVot },
      ])
      .execute();

    for (const [ano, sq, valores] of [
      [
        2022,
        "seed-22",
        [
          ["Apartamento", 800000],
          ["Veículo automotor terrestre: caminhão, automóvel, moto, etc.", 90000],
        ],
      ],
      [
        2026,
        "seed-26",
        [
          ["Apartamento", 900000],
          ["Quotas ou quinhões de capital", 150000],
        ],
      ],
    ] as const) {
      await trx
        .insertInto("candidatura")
        .values({
          ano_eleicao: ano,
          sq_candidato: sq,
          parlamentar_id: SEED.deputada,
          cargo: "DEPUTADO FEDERAL",
          sigla_uf: "SP",
          sigla_partido: "PFX",
          situacao: "ELEITO POR QP",
          coleta_id: cTse,
        })
        .execute();
      await trx
        .insertInto("bem_declarado")
        .values(
          valores.map(([tipo, valor], i) => ({
            ano_eleicao: ano,
            sq_candidato: sq,
            parlamentar_id: SEED.deputada,
            ordem: i + 1,
            tipo,
            valor,
            coleta_id: cTse,
          })),
        )
        .execute();
    }
    // ---------- Senado (fictício) ----------
    const cSen = await coleta(
      "senado_api_senadores",
      "https://legis.senado.leg.br/dadosabertos/senador/lista/legislatura/57.json",
    );
    const cCeaps = await coleta(
      "senado_ceaps",
      "https://adm.senado.gov.br/adm-dadosabertos/api/v1/senadores/despesas_ceaps/2026",
    );
    const cVotSen = await coleta(
      "senado_votacoes",
      "https://legis.senado.leg.br/dadosabertos/votacao?dataInicio=2026-01-01&dataFim=2026-12-31",
    );
    const cOriSen = await coleta(
      "senado_orientacoes",
      "https://legis.senado.leg.br/dadosabertos/plenario/votacao/orientacaoBancada/20260101/20261231.json",
    );
    const senador = {
      casa: "senado" as const,
      url_foto: null,
      id_legislatura: 57,
      em_exercicio: true,
      mandato_inicio: "2023-02-01",
      mandato_fim: "2031-01-31",
      coleta_id: cSen,
    };
    await trx
      .insertInto("parlamentar")
      .values([
        {
          ...senador,
          id: SEED.senador,
          nome: "Otávio Modelo",
          nome_civil: "OTÁVIO MODELO PEREIRA",
          sigla_partido: "PFX",
          sigla_uf: "MG",
          data_nascimento: "1968-02-03",
          sexo: "M",
          participacao: "Titular",
          bloco: "Bloco Parlamentar Exemplo",
          source_url: "https://legis.senado.leg.br/dadosabertos/senador/9001",
        },
        {
          ...senador,
          id: SEED.senadora,
          nome: "Lúcia Fictícia",
          nome_civil: "LÚCIA FICTÍCIA ROCHA",
          sigla_partido: "PFY",
          sigla_uf: "AC",
          data_nascimento: "1980-07-15",
          sexo: "F",
          participacao: "1º Suplente",
          bloco: null,
          source_url: "https://legis.senado.leg.br/dadosabertos/senador/9002",
        },
        {
          ...senador,
          id: SEED.senadorAfastado,
          em_exercicio: false,
          nome: "Rui Afastado",
          nome_civil: "RUI AFASTADO SOUZA",
          sigla_partido: null,
          sigla_uf: "RS",
          data_nascimento: null,
          sexo: "M",
          participacao: "Titular",
          bloco: null,
          source_url: "https://legis.senado.leg.br/dadosabertos/senador/9003",
        },
        {
          ...senador,
          id: SEED.senadoraSemRegistro,
          em_exercicio: false,
          nome: "Célia Sem Registro",
          nome_civil: "CÉLIA SEM REGISTRO COSTA",
          sigla_partido: null,
          sigla_uf: "PI",
          data_nascimento: null,
          sexo: "F",
          participacao: "2º Suplente",
          bloco: null,
          source_url: "https://legis.senado.leg.br/dadosabertos/senador/9004",
        },
      ])
      .execute();
    await trx
      .insertInto("suplente")
      .values([
        { parlamentar_id: SEED.senador, ordem: 1, nome: "Beatriz Suplente Fictícia", codigo: null, coleta_id: cSen },
        { parlamentar_id: SEED.senador, ordem: 2, nome: "Carlos Suplente Fictício", codigo: null, coleta_id: cSen },
      ])
      .execute();
    await trx
      .insertInto("orgao_membro")
      .values({
        parlamentar_id: SEED.senador,
        sigla_orgao: "CAE",
        nome_orgao: "Comissão de Assuntos Econômicos",
        cargo: "Titular",
        data_inicio: "2025-03-01",
        data_fim: null,
        coleta_id: cSen,
      })
      .execute();
    const nota = (
      mes: number,
      tipo: string,
      nome: string,
      doc: string | null,
      classe: "pessoa_juridica" | "terceiro_pf",
      valor: number,
      ide: string,
    ) => ({
      parlamentar_id: SEED.senador,
      ano: 2026,
      mes,
      tipo_despesa: tipo,
      fornecedor_nome: nome,
      fornecedor_doc: doc,
      fornecedor_classe: classe,
      data_emissao: `2026-0${mes}-10`,
      valor_documento: valor,
      valor_glosa: 0,
      valor_liquido: valor,
      valor_restituicao: 0,
      url_documento: null,
      ide_documento: ide,
      coleta_id: cCeaps,
    });
    await trx
      .insertInto("despesa_ceap")
      .values([
        nota(
          1,
          "Passagens aéreas, aquáticas e terrestres nacionais",
          "Aérea Fictícia S.A.",
          "11.222.333/0001-44",
          "pessoa_juridica",
          4000,
          "sen-1",
        ),
        nota(
          2,
          "Aluguel de imóveis para escritório político, compreendendo despesas concernentes a eles.",
          "Imobiliária Exemplo Ltda",
          "12.345.678/0001-90",
          "pessoa_juridica",
          5000,
          "sen-2",
        ),
        nota(
          4,
          "Aluguel de imóveis para escritório político, compreendendo despesas concernentes a eles.",
          "Imobiliária Exemplo Ltda",
          "12.345.678/0001-90",
          "pessoa_juridica",
          5000,
          "sen-3",
        ),
        nota(
          4,
          "Locomoção, hospedagem, alimentação, combustíveis e lubrificantes",
          "Prestador pessoa física",
          null,
          "terceiro_pf",
          1000,
          "sen-4",
        ),
      ])
      .execute();
    const votacaoSen = (id: string, data: string, sigla: string, ementa: string, secreta: boolean) => ({
      id,
      data,
      sigla_orgao: "PLEN-SF",
      descricao: `Votação nominal fictícia ${sigla}`,
      proposicao: sigla,
      proposicao_sigla: sigla,
      proposicao_ementa: ementa,
      aprovacao: 1,
      votos_sim: 50,
      votos_nao: 20,
      votos_outros: 1,
      secreta,
      source_url: "https://www25.senado.leg.br/web/atividade/materias/-/materia/1",
      coleta_id: cVotSen,
    });
    await trx
      .insertInto("votacao")
      .values([
        votacaoSen("SF-seed-1", "2026-10-01", "PL 2468/2026", "Política fictícia de saneamento rural", false),
        votacaoSen("SF-seed-2", "2026-10-08", "PEC 8/2026", "Regras fiscais fictícias para estados", false),
        votacaoSen("SF-seed-3", "2026-10-15", "MSF 41/2026", "Indicação fictícia de embaixador", true),
        votacaoSen("SF-seed-4", "2026-10-22", "PLP 77/2026", "Transparência fictícia de emendas", false),
        votacaoSen("SF-seed-5", "2026-10-29", "PL 1357/2026", "Taxas cartoriais fictícias", false),
      ])
      .execute();
    const votoSen = (votacao_id: string, parlamentar_id: number, voto: string, sigla_partido: string) => ({
      votacao_id,
      parlamentar_id,
      voto,
      sigla_partido,
      coleta_id: cVotSen,
    });
    await trx
      .insertInto("voto")
      .values([
        votoSen("SF-seed-1", SEED.senador, "Sim", "PFX"),
        votoSen("SF-seed-2", SEED.senador, "Não", "PFX"),
        votoSen("SF-seed-3", SEED.senador, "Votou", "PFX"),
        votoSen("SF-seed-4", SEED.senador, "MIS", "PFX"),
        votoSen("SF-seed-5", SEED.senador, "LS", "PFX"),
        votoSen("SF-seed-1", SEED.senadora, "Sim", "PFY"),
        votoSen("SF-seed-2", SEED.senadora, "Sim", "PFY"),
        votoSen("SF-seed-3", SEED.senadora, "Votou", "PFY"),
        votoSen("SF-seed-4", SEED.senadora, "Sim", "PFY"),
        votoSen("SF-seed-5", SEED.senadora, "Não", "PFY"),
        // Fora de exercício: 100% de presença que não pode puxar a média do Senado (SPRES-04).
        ...["SF-seed-1", "SF-seed-2", "SF-seed-3", "SF-seed-4", "SF-seed-5"].map((v) =>
          votoSen(v, SEED.senadorAfastado, v === "SF-seed-3" ? "Votou" : "Sim", "PFZ"),
        ),
      ])
      .execute();
    await trx
      .insertInto("orientacao")
      .values([
        { votacao_id: "SF-seed-1", sigla_bancada: "PFX", orientacao: "Sim", coleta_id: cOriSen },
        { votacao_id: "SF-seed-2", sigla_bancada: "PFX", orientacao: "Sim", coleta_id: cOriSen },
        { votacao_id: "SF-seed-2", sigla_bancada: "Governo", orientacao: "Não", coleta_id: cOriSen },
        { votacao_id: "SF-seed-4", sigla_bancada: "PFX", orientacao: "Liberado", coleta_id: cOriSen },
        // Orientação numa votação secreta: o voto "Votou" nunca entra no alinhamento (SALI-02).
        { votacao_id: "SF-seed-3", sigla_bancada: "PFX", orientacao: "Sim", coleta_id: cOriSen },
      ])
      .execute();
    await trx
      .insertInto("candidatura")
      .values({
        ano_eleicao: 2022,
        sq_candidato: "seed-sen-22",
        parlamentar_id: SEED.senador,
        cargo: "SENADOR",
        sigla_uf: "MG",
        sigla_partido: "PFX",
        situacao: "ELEITO",
        coleta_id: cTse,
      })
      .execute();
    await trx
      .insertInto("bem_declarado")
      .values([
        {
          ano_eleicao: 2022,
          sq_candidato: "seed-sen-22",
          parlamentar_id: SEED.senador,
          ordem: 1,
          tipo: "Apartamento",
          valor: 1900000,
          coleta_id: cTse,
        },
        {
          ano_eleicao: 2022,
          sq_candidato: "seed-sen-22",
          parlamentar_id: SEED.senador,
          ordem: 2,
          tipo: "Aplicação de renda fixa (CDB, RDB e outros)",
          valor: 780000,
          coleta_id: cTse,
        },
      ])
      .execute();
  });
}
