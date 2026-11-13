import { describe, expect, it } from "vitest";
import { alinhamento } from "../../src/metrics";
import {
  classificarVotoSenado,
  comoLista,
  idSenador,
  normalizarOrientacao,
  orientacaoDaLideranca,
  partidoDaLideranca,
  presencaSenado,
  rotuloVotoSenado,
  sexoDoSenado,
} from "../../src/senado";

describe("identificação (SCAD-01, SCAD-04, SERR-02)", () => {
  it("id do senador = 10.000.000 + código", () => {
    expect(idSenador(5672)).toBe(10005672);
    expect(idSenador("5672")).toBe(10005672);
  });
  it("sexo Feminino/Masculino vira F/M", () => {
    expect(sexoDoSenado("Feminino")).toBe("F");
    expect(sexoDoSenado("Masculino")).toBe("M");
    expect(sexoDoSenado("")).toBeNull();
    expect(sexoDoSenado(undefined)).toBeNull();
  });
  it("objeto único vira lista de um item", () => {
    expect(comoLista({ a: 1 })).toEqual([{ a: 1 }]);
    expect(comoLista([{ a: 1 }, { a: 2 }])).toHaveLength(2);
    expect(comoLista(undefined)).toEqual([]);
  });
});

describe("orientação de liderança (SVOT-03, SALI-01, SALI-03)", () => {
  it("normaliza os valores publicados", () => {
    expect(normalizarOrientacao("SIM")).toBe("Sim");
    expect(normalizarOrientacao("NÃO")).toBe("Não");
    expect(normalizarOrientacao("LIVRE")).toBe("Liberado");
    expect(normalizarOrientacao("OBSTRUÇÃO")).toBe("Obstrução");
  });
  it("traduz nomes de liderança para siglas", () => {
    expect(partidoDaLideranca("Progressistas")).toBe("PP");
    expect(partidoDaLideranca("Podemos")).toBe("PODE");
    expect(partidoDaLideranca("Republicanos")).toBe("REPUBLICANOS");
    expect(partidoDaLideranca("UNIÃO")).toBe("UNIAO");
    expect(partidoDaLideranca("PT")).toBe("PT");
  });
  it("ignora Governo, Maioria, Minoria, Oposição, B.Feminina e blocos", () => {
    for (const n of ["Governo", "Maioria", "Minoria", "Oposição", "B.Feminina", "Bloco Parlamentar Aliança"]) {
      expect(partidoDaLideranca(n)).toBeNull();
    }
  });
  it("aplica só a orientação do próprio partido", () => {
    const o = [
      { siglaBancada: "Governo", orientacao: "Não" },
      { siglaBancada: "Progressistas", orientacao: "Liberado" },
      { siglaBancada: "PT", orientacao: "Sim" },
    ];
    expect(orientacaoDaLideranca("PP", o)).toBe("Liberado");
    expect(orientacaoDaLideranca("PT", o)).toBe("Sim");
    expect(orientacaoDaLideranca("UNIÃO", [{ siglaBancada: "UNIÃO", orientacao: "Não" }])).toBe("Não");
    expect(orientacaoDaLideranca("PL", o)).toBeNull();
    expect(orientacaoDaLideranca(null, o)).toBeNull();
    expect(orientacaoDaLideranca("PSD", [{ siglaBancada: "Governo", orientacao: "Sim" }])).toBeNull();
  });
});

describe("presença (SPRES-01, SPRES-02, SPRES-03)", () => {
  it("conta como presença os votos da lista", () => {
    for (const v of ["Sim", "Não", "Abstenção", "Votou", "P-NRV", "Obstrução", "Presidente (art. 51 RISF)"]) {
      expect(classificarVotoSenado(v)).toBe("presente");
    }
  });
  it("tira licenças e afastamentos do denominador", () => {
    for (const v of "AFO DJ EP EPR LL LS LP LPA LSP LAP LAF LA LG LGA LN LCS LEG LC L2 L3 L5".split(" ")) {
      expect(classificarVotoSenado(v)).toBe("licenca");
    }
  });
  it("trata o resto como ausência", () => {
    for (const v of ["AP", "MIS", "NCom", "AUS", "MER", "L1", "L4", "L6", "NA"]) {
      expect(classificarVotoSenado(v)).toBe("ausente");
    }
  });
  it("calcula presentes ÷ (registros − licenças)", () => {
    const r = presencaSenado(["Sim", "Votou", "Não", "AP", "NCom", "LS", "LP", "P-NRV"]);
    expect(r).toEqual({ presentes: 4, denominador: 6, licencas: 2, percentual: 67 });
  });
  it("sem votações devolve percentual nulo", () => {
    expect(presencaSenado([]).percentual).toBeNull();
    expect(presencaSenado(["LS"]).percentual).toBeNull();
  });
});

describe("alinhamento com a liderança (SALI-02)", () => {
  it("voto secreto e orientação Liberado ficam fora da conta", () => {
    const votos = [
      { voto: "Sim", orientacao: "Sim" },
      { voto: "Não", orientacao: "Sim" },
      { voto: "Votou", orientacao: "Sim" },
      { voto: "Sim", orientacao: "Liberado" },
      { voto: "AP", orientacao: "Não" },
    ].map((v) => ({
      voto: v.voto,
      siglaPartido: "PT",
      orientacoes: [{ siglaBancada: "PT", orientacao: v.orientacao }],
    }));
    expect(alinhamento(votos)).toEqual({ comparaveis: 2, iguais: 1, divergencias: 1 });
  });
});

describe("rótulo do voto (SVOT-06, SVOT-07)", () => {
  it("votação secreta", () => {
    expect(rotuloVotoSenado("Votou", true)).toBe("Votou (voto secreto)");
  });
  it("ausências com motivo", () => {
    expect(rotuloVotoSenado("AP", false)).toBe("Ausente: atividade parlamentar");
    expect(rotuloVotoSenado("MIS", false)).toBe("Ausente: missão oficial");
    expect(rotuloVotoSenado("MER", false)).toBe("Ausente: Parlamento do Mercosul");
    expect(rotuloVotoSenado("AUS", false)).toBe("Ausente: ausência comunicada");
    expect(rotuloVotoSenado("NCom", false)).toBe("Não compareceu");
  });
  it("voto aberto", () => {
    expect(rotuloVotoSenado("Sim", false)).toBe("Votou: Sim");
    expect(rotuloVotoSenado("LS", false)).toBe("Em licença ou afastado");
  });
});
