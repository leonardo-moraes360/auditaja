import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  montarComissoes,
  nascimentoDoDetalhe,
  type DetalheApi,
  montarDespesasCeaps,
  montarOrientacoesSenado,
  montarVotacoesSenado,
  type OrientacoesSenadoApi,
  type VotacaoSenadoApi,
  type DespesaCeapsApi,
  montarSenadores,
  type ComissoesApi,
  type ListaAtualApi,
  type ListaLegislaturaApi,
} from "../../src/senado";
import { casarCandidaturas } from "../../src/tse";

/** Respostas reais da API do Senado (11/11/2026), reduzidas a poucos senadores. */
const fixture = <T>(nome: string): T =>
  JSON.parse(readFileSync(path.join(import.meta.dirname, "../fixtures/senado", nome), "utf8")) as T;

const leg = fixture<ListaLegislaturaApi>("lista-legislatura-57.json");
const atual = fixture<ListaAtualApi>("lista-atual.json");

describe("cadastro de senadores (SCAD-01..04)", () => {
  const m = montarSenadores(leg, atual, new Map([["5672", "1976-10-23"]]), 7);
  const alan = m.parlamentares.find((p) => p.id === 10005672)!;

  it("grava cada senador da legislatura com casa senado e id deslocado", () => {
    expect(m.parlamentares.map((p) => p.id).toSorted()).toEqual([10005672, 10005918, 10006358]);
    expect(m.parlamentares.every((p) => p.casa === "senado")).toBe(true);
    expect(alan.nome).toBe("Alan Rick");
    expect(alan.nome_civil).toBe("Alan Rick Miranda");
    expect(alan.sigla_uf).toBe("AC");
    expect(alan.sigla_partido).toBe("REPUBLICANOS");
    expect(alan.coleta_id).toBe(7);
  });

  it("marca em exercício só quem está na lista atual", () => {
    const ex = m.parlamentares.find((p) => p.id === 10005918)!;
    expect(alan.em_exercicio).toBe(true);
    expect(ex.em_exercicio).toBe(false);
    expect(ex.sigla_partido).toBeNull();
    expect(ex.sigla_uf).toBe("PE");
  });

  it("grava mandato, participação, bloco e suplentes", () => {
    expect(alan.mandato_inicio).toBe("2023-02-01");
    expect(alan.mandato_fim).toBe("2031-01-31");
    expect(alan.participacao).toBe("Titular");
    expect(alan.bloco).toBe("Bloco Parlamentar Aliança");
    const sup = m.suplentes.filter((s) => s.parlamentar_id === 10005672);
    expect(sup.map((s) => [s.ordem, s.nome, s.codigo])).toEqual([
      [1, "Gemil Junior", 6343],
      [2, "Coronel Casagrande", 6344],
    ]);
    const anaPaula = m.parlamentares.find((p) => p.id === 10006358)!;
    expect(anaPaula.participacao).toBe("1º Suplente");
  });

  it("grava sexo e nascimento", () => {
    expect(alan.sexo).toBe("M");
    expect(alan.data_nascimento).toBe("1976-10-23");
    const anaPaula = m.parlamentares.find((p) => p.id === 10006358)!;
    expect(anaPaula.sexo).toBe("F");
    expect(anaPaula.data_nascimento).toBeNull();
  });

  it("aponta para a fonte do Senado (SCAD-05)", () => {
    expect(alan.source_url).toBe("https://legis.senado.leg.br/dadosabertos/senador/5672");
    expect(alan.url_foto).toBe("https://www.senado.leg.br/senadores/img/fotos-oficiais/senador5672.jpg");
  });

  it("aceita objeto único no lugar de lista (SERR-02)", () => {
    const um: ListaAtualApi = {
      ListaParlamentarEmExercicio: {
        Parlamentares: {
          Parlamentar: (atual.ListaParlamentarEmExercicio.Parlamentares!.Parlamentar as never[])[0],
        },
      },
    };
    const r = montarSenadores({ ListaParlamentarLegislatura: {} }, um, new Map(), 1);
    expect(r.parlamentares).toHaveLength(1);
    expect(r.parlamentares[0].em_exercicio).toBe(true);
  });
});

describe("comissões do senador", () => {
  it("guarda só as atuais da Casa SF", () => {
    const r = montarComissoes("5672", fixture<ComissoesApi>("comissoes-5672.json"), 3);
    expect(r.map((c) => c.sigla_orgao)).toEqual(["CAE", "CE"]);
    expect(r.every((c) => c.parlamentar_id === 10005672 && c.data_fim === null)).toBe(true);
  });
});

describe("CEAPS (SCEAPS-01..04)", () => {
  const notas = fixture<DespesaCeapsApi[]>("ceaps-2026.json");
  const ids = new Set([10005672, 10006304]);

  it("grava o valor reembolsado como valor líquido, sem glosa", () => {
    const { linhas } = montarDespesasCeaps(notas, ids, 9);
    const n = linhas.find((l) => l.ide_documento === "2279778")!;
    expect(n.parlamentar_id).toBe(10005672);
    expect(n.valor_liquido).toBe(462.18);
    expect(n.valor_documento).toBe(462.18);
    expect(n.valor_glosa).toBe(0);
    expect(n.fornecedor_doc).toBe("66.970.229/0132-26");
    expect(n.fornecedor_classe).toBe("pessoa_juridica");
    expect(n.data_emissao).toBe("2026-01-20");
    expect(n.coleta_id).toBe(9);
  });

  it("CPF mascarado pela fonte: sem documento e sem nome", () => {
    const { linhas } = montarDespesasCeaps(notas, ids, 9);
    const pf = linhas.find((l) => l.ide_documento === "2280723")!;
    expect(pf.fornecedor_doc).toBeNull();
    expect(pf.fornecedor_classe).toBe("terceiro_pf");
    expect(pf.fornecedor_nome).toBe("Prestador pessoa física");
    expect(JSON.stringify(linhas)).not.toContain("PESSOA FICTICIA");
  });

  it("CPF completo não é gravado, nem mascarado", () => {
    const { linhas } = montarDespesasCeaps([{ ...notas[0], cpfCnpj: "123.456.789-01", fornecedor: "Fulano" }], ids, 1);
    expect(linhas[0].fornecedor_doc).toBeNull();
    expect(linhas[0].fornecedor_classe).toBe("terceiro_pf");
    expect(JSON.stringify(linhas)).not.toMatch(/456\.?789/);
    expect(linhas[0].fornecedor_nome).toBe("Prestador pessoa física");
    expect(JSON.stringify(linhas)).not.toContain("12345678901");
  });

  it("nota sem tipo vira 'Não informado pelo Senado'", () => {
    const { linhas } = montarDespesasCeaps(notas, ids, 9);
    expect(linhas.find((l) => l.ide_documento === "2280723")!.tipo_despesa).toBe("Não informado pelo Senado");
  });

  it("descarta e conta notas de senador não cadastrado", () => {
    const r = montarDespesasCeaps(notas, new Set([10005672]), 9);
    expect(r.linhas).toHaveLength(3);
    expect(r.descartadas).toBe(1);
  });
});

describe("votações do Senado (SVOT-01..03)", () => {
  const lista = fixture<VotacaoSenadoApi[]>("votacao-2026.json");
  const ids = new Set([10005672, 10006358]);
  const m = montarVotacoesSenado(lista, ids, 4);

  it("grava a votação com id SF-sequencial, órgão PLEN-SF, matéria, ementa, data e resultado", () => {
    const pec = m.votacoes.find((v) => v.id === "SF-4420")!;
    expect(pec).toMatchObject({
      sigla_orgao: "PLEN-SF",
      data: "2026-10-14",
      proposicao_sigla: "PEC 221/2019",
      aprovacao: 1,
      secreta: false,
      coleta_id: 4,
    });
    expect(pec.proposicao_ementa).toMatch(/^Altera o art\. 7º da Constituição/);
    expect(pec.source_url).toBe("https://www25.senado.leg.br/web/atividade/materias/-/materia/174386");
  });

  it("marca a votação secreta e usa os totais publicados", () => {
    const msf = m.votacoes.find((v) => v.id === "SF-4367")!;
    expect(msf.secreta).toBe(true);
    expect([msf.votos_sim, msf.votos_nao, msf.votos_outros]).toEqual([43, 2, 1]);
  });

  it("grava o voto e o partido do dia só de senadores cadastrados", () => {
    expect(m.votos.every((v) => ids.has(v.parlamentar_id as number))).toBe(true);
    const alan = m.votos.find((v) => v.votacao_id === "SF-4420" && v.parlamentar_id === 10005672)!;
    expect(alan.voto).toBe("Sim");
    expect(alan.sigla_partido).toBe("REPUBLICANOS");
    expect(m.votos.find((v) => v.votacao_id === "SF-4367" && v.parlamentar_id === 10005672)!.voto).toBe("P-NRV");
  });

  it("liga as orientações pelo sequencial e normaliza os valores", () => {
    const o = montarOrientacoesSenado(
      fixture<OrientacoesSenadoApi>("orientacao-20261014.json"),
      new Set(m.votacoes.map((v) => v.id)),
      5,
    );
    const de = (b: string) => o.find((x) => x.sigla_bancada === b)?.orientacao;
    expect(o.every((x) => x.votacao_id === "SF-4420")).toBe(true);
    expect(de("PT")).toBe("Sim");
    expect(de("Progressistas")).toBe("Liberado");
    expect(de("PL")).toBe("Liberado");
    expect(o).toHaveLength(13);
  });

  it("ignora orientação de votação não coletada", () => {
    expect(montarOrientacoesSenado(fixture("orientacao-20261014.json"), new Set(["SF-1"]), 5)).toEqual([]);
  });
});

describe("bens do TSE para senadores (SBENS-01)", () => {
  it("casa a candidatura a senador pelo nome civil e pela data de nascimento", () => {
    const r = casarCandidaturas(
      [
        {
          NM_CANDIDATO: "ALAN RICK MIRANDA",
          DT_NASCIMENTO: "23/10/1976",
          SG_UF: "AC",
          SQ_CANDIDATO: "10001",
          DS_CARGO: "SENADOR",
          SG_PARTIDO: "UNIÃO",
          DS_SIT_TOT_TURNO: "ELEITO",
        },
        // Homônimo com outra data de nascimento: não casa.
        {
          NM_CANDIDATO: "ALAN RICK MIRANDA",
          DT_NASCIMENTO: "01/01/1950",
          SG_UF: "SP",
          SQ_CANDIDATO: "10002",
          DS_CARGO: "DEPUTADO ESTADUAL",
          SG_PARTIDO: "PFX",
          DS_SIT_TOT_TURNO: "NÃO ELEITO",
        },
      ],
      [{ id: 10005672, nome_civil: "Alan Rick Miranda", data_nascimento: "1976-10-23", sigla_uf: "AC" }],
      2022,
      1,
    );
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ parlamentar_id: 10005672, cargo: "SENADOR", sq_candidato: "10001" });
  });
});

describe("detalhe do senador (SCAD-04)", () => {
  it("lê a data de nascimento do detalhe", () => {
    expect(nascimentoDoDetalhe(fixture<DetalheApi>("senador-5672.json"))).toBe("1976-10-23");
  });
  it("ignora nascimento ausente ou fora do formato", () => {
    expect(nascimentoDoDetalhe({ DetalheParlamentar: { Parlamentar: {} } })).toBeNull();
    expect(
      nascimentoDoDetalhe({
        DetalheParlamentar: { Parlamentar: { DadosBasicosParlamentar: { DataNascimento: "23/10/1976" } } },
      }),
    ).toBeNull();
  });
});

describe("CEAPS: documento malformado ou ausente (R3)", () => {
  it("sem CNPJ válido, não grava documento nem nome", () => {
    const notas = fixture<DespesaCeapsApi[]>("ceaps-2026.json");
    for (const cpfCnpj of ["1234567890123", null, ""]) {
      const { linhas } = montarDespesasCeaps(
        [{ ...notas[0], cpfCnpj, fornecedor: "Pessoa Possivelmente Física" }],
        new Set([10005672]),
        1,
      );
      expect(linhas[0]).toMatchObject({
        fornecedor_doc: null,
        fornecedor_classe: "terceiro_pf",
        fornecedor_nome: "Prestador pessoa física",
      });
    }
  });
});

describe("CEAPS: CPF dentro da razão social (R3)", () => {
  it("a nota de MEI com CNPJ válido mantém o nome, mas com o CPF mascarado", () => {
    const notas = fixture<DespesaCeapsApi[]>("ceaps-2026.json");
    const { linhas } = montarDespesasCeaps(
      [{ ...notas[0], cpfCnpj: "12.345.678/0001-90", fornecedor: "FULANO DE TAL 12345678901" }],
      new Set([10005672]),
      1,
    );
    expect(linhas[0].fornecedor_nome).toBe("FULANO DE TAL ***.***.***-**");
    expect(JSON.stringify(linhas)).not.toContain("12345678901");
  });
});
