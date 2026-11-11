import { describe, expect, it } from "vitest";
import { linhaCeap, montarParlamentares, montarVotacoes } from "@/ingest/camara";
import { casarCandidaturas, montarBens } from "@/ingest/tse";
import { normalizarNome } from "@/ingest/arquivos";

const ceapBase = {
  ideCadastro: "100",
  numAno: "2026",
  numMes: "3",
  txtDescricao: "COMBUSTÍVEIS E LUBRIFICANTES.",
  txtFornecedor: "João da Silva",
  txtCNPJCPF: "123.456.789-01",
  datEmissao: "2026-03-10T00:00:00",
  vlrDocumento: "200",
  vlrGlosa: "50",
  vlrLiquido: "150",
  vlrRestituicao: "",
  urlDocumento: "https://www.camara.leg.br/doc.pdf",
  ideDocumento: "999",
  txtPassageiro: "Maria Passageira",
  cpf: "11122233344",
};

describe("CEAP", () => {
  it("aplica R2/R3 e ignora lideranças", () => {
    const r = linhaCeap(ceapBase, new Set([100]), 1)!;
    expect(r.fornecedor_doc).toBe("***.456.789-**");
    expect(r.fornecedor_nome).toBe("Prestador pessoa física");
    expect(r.valor_liquido).toBe(150);
    expect(r.data_emissao).toBe("2026-03-10");
    expect(JSON.stringify(r)).not.toContain("Passageira");
    expect(JSON.stringify(r)).not.toContain("11122233344");
    expect(linhaCeap({ ...ceapBase, ideCadastro: "" }, new Set([100]), 1)).toBeNull();
  });
});

describe("deputados", () => {
  it("junta API e lote e marca em exercício", () => {
    const rows = montarParlamentares(
      [
        { id: 1, uri: "", nome: "Fulana", siglaPartido: "AAA", siglaUf: "SP", urlFoto: null },
        { id: 1, uri: "", nome: "Fulana", siglaPartido: "BBB", siglaUf: "SP", urlFoto: null },
        { id: 2, uri: "", nome: "Beltrano", siglaPartido: "CCC", siglaUf: "RJ", urlFoto: null },
      ],
      new Set([1]),
      [{ uri: "https://x/api/v2/deputados/1", nomeCivil: "FULANA DE TAL", dataNascimento: "1980-01-02" }],
      9,
    );
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ id: 1, sigla_partido: "BBB", em_exercicio: true, nome_civil: "FULANA DE TAL" });
    expect(rows[1]).toMatchObject({ id: 2, em_exercicio: false, nome_civil: null });
  });
});

describe("votações", () => {
  it("guarda só votações nominais e deduplica", () => {
    const m = montarVotacoes(
      [
        {
          id: "a",
          uri: "u",
          data: "2026-01-01",
          siglaOrgao: "PLEN",
          descricao: "d",
          aprovacao: "1",
          votosSim: "1",
          votosNao: "0",
          votosOutros: "0",
        },
        {
          id: "b",
          uri: "u",
          data: "2026-01-01",
          siglaOrgao: "PLEN",
          descricao: "simbólica",
          aprovacao: "1",
          votosSim: "0",
          votosNao: "0",
          votosOutros: "0",
        },
      ],
      [
        { idVotacao: "a", deputado_id: "1", voto: "Sim", deputado_siglaPartido: "PL" },
        { idVotacao: "a", deputado_id: "1", voto: "Sim", deputado_siglaPartido: "PL" },
      ],
      [
        { idVotacao: "a", siglaBancada: "PL", orientacao: "Sim" },
        { idVotacao: "a", siglaBancada: "PL", orientacao: "Sim" },
        { idVotacao: "b", siglaBancada: "PL", orientacao: "Sim" },
      ],
      { votacoes: 1, votos: 2, orientacoes: 3 },
    );
    expect(m.votacoes.map((v) => v.id)).toEqual(["a"]);
    expect(m.votos).toHaveLength(1);
    expect(m.orientacoes).toHaveLength(1);
  });
});

describe("TSE", () => {
  const parl = [
    { id: 1, nome_civil: "José Ânimo Souza", data_nascimento: "1970-05-01", sigla_uf: "SP" },
    { id: 2, nome_civil: "MARIA HOMÔNIMA", data_nascimento: null, sigla_uf: "RJ" },
    { id: 3, nome_civil: "MARIA HOMÔNIMA", data_nascimento: null, sigla_uf: "RJ" },
  ];
  const cand = (o: Record<string, string>) => ({
    SQ_CANDIDATO: "10",
    NM_CANDIDATO: "JOSE ANIMO SOUZA",
    DT_NASCIMENTO: "01/05/1970",
    SG_UF: "SP",
    DS_CARGO: "DEPUTADO FEDERAL",
    SG_PARTIDO: "AAA",
    DS_SIT_TOT_TURNO: "ELEITO POR QP",
    ...o,
  });

  it("normaliza nomes", () => {
    expect(normalizarNome("  José  Ânimo-Souza ")).toBe("JOSE ANIMO SOUZA");
  });

  it("casa por nome e nascimento; descarta homônimos ambíguos", () => {
    const c = casarCandidaturas(
      [
        cand({}),
        cand({ SQ_CANDIDATO: "11", DT_NASCIMENTO: "02/05/1970" }),
        cand({ SQ_CANDIDATO: "12", NM_CANDIDATO: "MARIA HOMONIMA", DT_NASCIMENTO: "-4", SG_UF: "RJ" }),
      ],
      parl,
      2022,
      5,
    );
    expect(c).toHaveLength(1);
    expect(c[0]).toMatchObject({ sq_candidato: "10", parlamentar_id: 1, situacao: "ELEITO POR QP" });
  });

  it("guarda só tipo e valor dos bens", () => {
    const c = casarCandidaturas([cand({})], parl, 2022, 5);
    const b = montarBens(
      [
        {
          SQ_CANDIDATO: "10",
          NR_ORDEM_BEM_CANDIDATO: "1",
          DS_TIPO_BEM_CANDIDATO: "Casa",
          DS_BEM_CANDIDATO: "CASA NA RUA X, 10",
          VR_BEM_CANDIDATO: "350.000,00",
        },
      ],
      c,
      2022,
      6,
    );
    expect(b[0]).toMatchObject({ tipo: "Casa", valor: 350000, parlamentar_id: 1 });
    expect(JSON.stringify(b)).not.toContain("RUA");
  });
});
