import { describe, expect, it } from "vitest";
import { idExecutivo, montarDespesasExecutivo, montarExecutivo } from "../../src/executivo";
import { despesaJudiciarioPublicavel, idJudiciario, montarJudiciario, montarVotos } from "../../src/judiciario";

describe("montarExecutivo", () => {
  it("gera titulares com id no deslocamento e sem CPF", () => {
    const rows = montarExecutivo(
      [
        {
          id: 1,
          cargo: "presidente",
          orgao: "Presidência da República",
          nome: "Ana",
          sexo: "F",
        },
      ],
      9,
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe(20_000_001);
    expect(rows[0].coleta_id).toBe(9);
    expect(rows[0].em_exercicio).toBe(true);
  });

  it("mascara fornecedor PF nas despesas", () => {
    const [d] = montarDespesasExecutivo(
      [
        {
          executivo_id: 20_000_001,
          ano: 2026,
          mes: 1,
          tipo: "cartao",
          descricao: "Serviço",
          fornecedor_nome: "Fulano da Silva",
          fornecedor_doc: "12345678901",
          valor_liquido: 10,
        },
      ],
      3,
    );
    expect(d.fornecedor_classe).toBe("terceiro_pf");
    expect(d.fornecedor_doc).toBeNull();
    expect(d.fornecedor_nome).toBe("Prestador pessoa física");
  });

  it("idExecutivo é estável para a mesma chave", () => {
    const a = idExecutivo({ cargo: "ministro", orgao: "X", nome: "Y" });
    const b = idExecutivo({ cargo: "ministro", orgao: "X", nome: "Y" });
    expect(a).toBe(b);
    expect(a).toBeGreaterThanOrEqual(20_000_000);
  });
});

describe("montarJudiciario", () => {
  it("fixa ministro do STF", () => {
    const [m] = montarJudiciario([{ id: 7, nome: "Diego", sexo: "M" }], 2);
    expect(m.id).toBe(30_000_007);
    expect(m.cargo).toBe("ministro_stf");
    expect(m.tribunal).toBe("STF");
  });

  it("idJudiciario é estável", () => {
    expect(idJudiciario({ nome: "Elena" })).toBe(idJudiciario({ nome: "Elena" }));
  });

  it("monta votos e mascara despesa PF", () => {
    const votos = montarVotos([{ sessao_id: "s1", judiciario_id: 1, voto: "Acompanhou" }], 4);
    expect(votos[0]).toMatchObject({ presente: true, coleta_id: 4 });
    const d = despesaJudiciarioPublicavel({
      judiciario_id: 1,
      ano: 2026,
      mes: 2,
      tipo: "diaria",
      descricao: "x",
      fornecedor_nome: "Maria",
      fornecedor_doc: "529.982.247-25",
      valor_liquido: 1,
      coleta_id: 4,
    });
    expect(d.fornecedor_nome).toBe("Prestador pessoa física");
    expect(d.fornecedor_doc).toBeNull();
  });
});
