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
};

export async function semear(db: Kysely<Database>) {
  await db.transaction().execute(async (trx) => {
    for (const t of [
      "sancao",
      "emenda_favorecido",
      "emenda",
      "pedido_correcao",
      "bem_declarado",
      "candidatura",
      "orientacao",
      "voto",
      "votacao",
      "despesa_ceap",
      "orgao_membro",
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
  });
}
