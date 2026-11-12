import { describe, expect, it } from "vitest";
import {
  motivoDoStatus,
  periodoDoDia,
  periodosForaDoExercicio,
  presencaEmExercicio,
  tipoFora,
  type EventoHistorico,
} from "@/lib/exercicio";
import { montarPeriodos, urlHistorico, type HistoricoApi } from "@/ingest/historico";

const INI = "2023-02-01";
const ev = (dataHora: string, situacao: string | null, descricaoStatus: string | null = null): EventoHistorico => ({
  dataHora,
  situacao,
  descricaoStatus,
});
const POSSE = ev("2023-02-01T12:05", "Exercício", "Entrada - Posse de Eleito Titular - Posse na Sessão Preparatória");

describe("PRES-01: períodos fora do exercício a partir do histórico da Câmara", () => {
  it("sem nenhum evento de situação devolve null (histórico desconhecido)", () => {
    expect(periodosForaDoExercicio([], INI)).toBeNull();
    expect(periodosForaDoExercicio([ev("2023-02-01T00:00", null, "Nome no início da legislatura")], INI)).toBeNull();
  });

  it("titular empossado no primeiro dia e sempre em exercício não tem período", () => {
    expect(periodosForaDoExercicio([ev("2023-02-01T00:00", null), POSSE], INI)).toEqual([]);
  });

  it("saída fora da meia-noite tira a partir do dia seguinte; reassunção devolve o próprio dia", () => {
    const p = periodosForaDoExercicio(
      [
        POSSE,
        ev(
          "2024-05-06T15:05",
          "Licença",
          "Saída - Afastamento com prazo determinado - Afastamento Conjunto Consecutivo",
        ),
        ev("2024-09-04T10:00", "Exercício", "Entrada - Reassunção"),
      ],
      INI,
    );
    expect(p).toEqual([
      {
        inicio: "2024-05-07",
        fim: "2024-09-03",
        situacao: "Licença",
        motivo: "Afastamento Conjunto Consecutivo",
      },
    ]);
  });

  it("saída às 00:00 tira o próprio dia", () => {
    const p = periodosForaDoExercicio(
      [POSSE, ev("2025-06-13T00:00", "Licença", "Saída - X - Licença para Tratamento de Saúde")],
      INI,
    );
    expect(p).toEqual([
      { inicio: "2025-06-13", fim: null, situacao: "Licença", motivo: "Licença para Tratamento de Saúde" },
    ]);
  });

  it("renovações com o mesmo motivo viram um período; motivo novo abre outro no dia do evento", () => {
    const p = periodosForaDoExercicio(
      [
        POSSE,
        ev("2026-02-01T00:00", "Licença", "Saída - A - Licença para Tratamento de Saúde"),
        ev("2026-03-29T00:00", "Licença", "Saída - A - Licença para Tratamento de Saúde"),
        ev("2026-05-22T00:00", "Licença", "Saída - A - Missão"),
        ev("2026-06-10T00:00", "Afastado", "Saída - A - Missão"),
        ev("2026-07-19T00:00", "Exercício", "Entrada - Reassunção"),
      ],
      INI,
    );
    expect(p).toEqual([
      { inicio: "2026-02-01", fim: "2026-05-21", situacao: "Licença", motivo: "Licença para Tratamento de Saúde" },
      { inicio: "2026-05-22", fim: "2026-06-09", situacao: "Licença", motivo: "Missão" },
      { inicio: "2026-06-10", fim: "2026-07-18", situacao: "Afastado", motivo: "Missão" },
    ]);
  });

  it("motivo novo no mesmo dia em que a saída começou substitui o período sem deixá-lo vazio", () => {
    const p = periodosForaDoExercicio(
      [
        POSSE,
        ev("2026-02-01T00:00", "Licença", "Saída - A - Um"),
        ev("2026-02-01T09:00", "Licença", "Saída - A - Dois"),
      ],
      INI,
    );
    expect(p).toEqual([{ inicio: "2026-02-01", fim: null, situacao: "Licença", motivo: "Dois" }]);
  });

  it("suplente: da abertura da legislatura até a véspera da posse fica 'Antes da posse'; CONVOCADO não é exercício", () => {
    const p = periodosForaDoExercicio(
      [
        ev("2026-09-14T21:30", "CONVOCADO", "DIVERSO - Convocação Eleito ou Suplente"),
        ev("2026-09-15T10:31", "Exercício", "Entrada - Posse de Suplente - Posse como Titular"),
      ],
      INI,
    );
    expect(p).toEqual([{ inicio: INI, fim: "2026-09-14", situacao: "Antes da posse", motivo: "Antes da posse" }]);
  });

  it("eventos fora de ordem são ordenados pela data e hora", () => {
    const p = periodosForaDoExercicio(
      [ev("2024-09-04T10:00", "Exercício"), ev("2024-05-06T15:05", "Licença", "Saída - X - L"), POSSE],
      INI,
    );
    expect(p).toEqual([{ inicio: "2024-05-07", fim: "2024-09-03", situacao: "Licença", motivo: "L" }]);
  });

  it("saída e volta no mesmo dia (ou no seguinte) não geram período, porque o dia teve exercício", () => {
    expect(
      periodosForaDoExercicio(
        [POSSE, ev("2024-05-06T15:05", "Licença", "x - L"), ev("2024-05-07T09:00", "Exercício")],
        INI,
      ),
    ).toEqual([]);
  });

  it("vacância e fim de mandato ficam abertos (fim null)", () => {
    expect(
      periodosForaDoExercicio(
        [POSSE, ev("2025-01-01T00:00", "VACANCIA", "Saída - Afastamento definitivo - Renúncia")],
        INI,
      ),
    ).toEqual([{ inicio: "2025-01-01", fim: null, situacao: "VACANCIA", motivo: "Renúncia" }]);
  });

  it("já fora do exercício, registro avulso (ex.: 'Alteração de partido') não vira período com motivo falso", () => {
    const p = periodosForaDoExercicio(
      [
        POSSE,
        ev(
          "2023-12-12T11:37",
          "Licença",
          "Saída - Afastamento com prazo determinado - Afastamento Conjunto Consecutivo",
        ),
        ev("2024-02-07T00:00", "Licença", "Alteração de partido"),
        ev("2024-04-12T10:00", "Exercício", "Entrada - Reassunção"),
      ],
      INI,
    );
    expect(p).toEqual([
      { inicio: "2023-12-13", fim: "2024-04-11", situacao: "Licença", motivo: "Afastamento Conjunto Consecutivo" },
    ]);
  });

  it("convocação recusada no meio da suplência não repete o período (vizinhos iguais se juntam)", () => {
    const imposs = "DIVERSO - Negativas de Recusa de Convocação - Impossibilidade de Assumir o Mandato";
    const p = periodosForaDoExercicio(
      [
        POSSE,
        ev(
          "2023-10-27T00:00",
          "SUPLENCIA",
          "Saída - Afastamento sem prazo determinado - Afastamento de Suplente (automático)",
        ),
        ev(
          "2024-09-11T18:45",
          "CONVOCADO",
          "DIVERSO - Convocação Eleito ou Suplente - Aguardando Convocação de Suplente",
        ),
        ev("2024-09-12T16:44", "SUPLENCIA", imposs),
        ev("2024-09-19T18:07", "CONVOCADO", "DIVERSO - Convocação Eleito ou Suplente"),
        ev("2024-09-19T18:47", "SUPLENCIA", imposs),
        ev("2026-08-06T12:32", "Exercício", "DIVERSO - Decisão da Mesa - Torna-se titular por Retotalização"),
      ],
      INI,
    );
    expect(p).toEqual([
      {
        inicio: "2023-10-27",
        fim: "2024-09-10",
        situacao: "SUPLENCIA",
        motivo: "Afastamento de Suplente (automático)",
      },
      { inicio: "2024-09-11", fim: "2024-09-11", situacao: "CONVOCADO", motivo: "Aguardando Convocação de Suplente" },
      {
        inicio: "2024-09-12",
        fim: "2026-08-05",
        situacao: "SUPLENCIA",
        motivo: "Impossibilidade de Assumir o Mandato",
      },
    ]);
  });

  it("períodos iguais separados por dias de exercício não se juntam (nem com um dia só no meio)", () => {
    const p = periodosForaDoExercicio(
      [
        POSSE,
        ev("2026-02-01T00:00", "Licença", "Saída - A - Missão"),
        ev("2026-02-10T08:00", "Exercício"),
        ev("2026-02-11T00:00", "Licença", "Saída - A - Missão"),
        ev("2026-02-20T08:00", "Exercício"),
        ev("2026-02-28T00:00", "Licença", "Saída - A - Missão"),
      ],
      INI,
    );
    expect(p).toEqual([
      { inicio: "2026-02-01", fim: "2026-02-09", situacao: "Licença", motivo: "Missão" },
      { inicio: "2026-02-11", fim: "2026-02-19", situacao: "Licença", motivo: "Missão" },
      { inicio: "2026-02-28", fim: null, situacao: "Licença", motivo: "Missão" },
    ]);
  });

  it("mudança de situação sem prefixo de movimento abre período novo", () => {
    const p = periodosForaDoExercicio(
      [POSSE, ev("2026-02-01T00:00", "Licença", "Saída - A - Missão"), ev("2026-03-01T00:00", "VACANCIA", null)],
      INI,
    );
    expect(p).toEqual([
      { inicio: "2026-02-01", fim: "2026-02-28", situacao: "Licença", motivo: "Missão" },
      { inicio: "2026-03-01", fim: null, situacao: "VACANCIA", motivo: "VACANCIA" },
    ]);
  });

  it("período de um dia é mantido e tira a votação daquele dia", () => {
    const p = periodosForaDoExercicio(
      [
        POSSE,
        ev("2026-07-08T00:00", "CONVOCADO", "DIVERSO - Convocação Eleito ou Suplente"),
        ev("2026-07-09T08:00", "Exercício"),
      ],
      INI,
    )!;
    expect(p).toEqual([
      { inicio: "2026-07-08", fim: "2026-07-08", situacao: "CONVOCADO", motivo: "Convocação Eleito ou Suplente" },
    ]);
    const r = presencaEmExercicio(
      [
        { id: "x", data: "2026-07-08" },
        { id: "y", data: "2026-07-09" },
      ],
      new Map(),
      p,
      2026,
    );
    expect(r.elegiveis).toBe(1);
    expect(r.periodosNoAno[0].votacoes).toBe(1);
  });

  it("motivo novo no mesmo dia de uma saída à tarde não tira o dia da saída", () => {
    const p = periodosForaDoExercicio(
      [
        POSSE,
        ev("2026-03-10T15:00", "Licença", "Saída - A - Um"),
        ev("2026-03-10T16:00", "Licença", "Saída - A - Dois"),
      ],
      INI,
    );
    expect(p).toEqual([{ inicio: "2026-03-11", fim: null, situacao: "Licença", motivo: "Dois" }]);
  });

  it("motivo é o último trecho da descrição; sem descrição, a situação", () => {
    expect(motivoDoStatus("Saída - Afastamento sem prazo determinado - Secretário de Estado", "Licença")).toBe(
      "Secretário de Estado",
    );
    expect(motivoDoStatus(null, "Licença")).toBe("Licença");
    expect(motivoDoStatus("Saída - Afastamento de titular  por Recontagem", "SUPLENCIA")).toBe(
      "Afastamento de titular por Recontagem",
    );
    expect(motivoDoStatus("  ", "Afastado")).toBe("Afastado");
  });

  it("tipo do período", () => {
    expect(tipoFora("Licença")).toBe("licenca");
    expect(tipoFora("Antes da posse")).toBe("antes_posse");
    expect(tipoFora("Afastado")).toBe("outro");
  });

  it("período do dia inclui as duas pontas e trata fim null como aberto", () => {
    const ps = [
      { inicio: "2026-02-01", fim: "2026-02-10" },
      { inicio: "2026-03-01", fim: null },
    ];
    expect(periodoDoDia(ps, "2026-01-31")).toBeNull();
    expect(periodoDoDia(ps, "2026-02-01")).toBe(ps[0]);
    expect(periodoDoDia(ps, "2026-02-10")).toBe(ps[0]);
    expect(periodoDoDia(ps, "2026-02-11")).toBeNull();
    expect(periodoDoDia(ps, "2030-01-01")).toBe(ps[1]);
  });
});

describe("PRES-02: presença só nas votações em exercício", () => {
  const vot = [
    { id: "a", data: "2026-01-10" },
    { id: "b", data: "2026-02-05" },
    { id: "c", data: "2026-02-06" },
    { id: "d", data: "2026-03-01" },
    { id: "e", data: "2026-04-01" },
  ];
  const lic = { inicio: "2025-12-01", fim: "2026-02-28", situacao: "Licença", motivo: "Saúde" };

  it("sem histórico (null) todas as votações contam, como antes", () => {
    const r = presencaEmExercicio(vot, new Map([["a", "Sim"]]), null, 2026);
    expect(r).toMatchObject({
      historicoDisponivel: false,
      presentes: 1,
      elegiveis: 5,
      foraDoExercicio: 0,
      tipoFora: null,
    });
    expect(r.periodosNoAno).toEqual([]);
  });

  it("votação em licença sai do denominador; voto registrado na licença sempre conta; voto vazio não salva", () => {
    const r = presencaEmExercicio(
      vot,
      new Map([
        ["b", "Sim"],
        ["c", ""],
        ["d", "Não"],
      ]),
      [lic],
      2026,
    );
    expect(r.presentes).toBe(2);
    expect(r.elegiveis).toBe(3); // b (votou na licença), d, e
    expect(r.foraDoExercicio).toBe(2); // a, c
    expect([...r.foraPorVotacao.keys()]).toEqual(["a", "c"]);
    expect(r.foraPorVotacao.get("a")).toBe("licenca");
    expect(r.tipoFora).toBe("licenca");
    expect(r.periodosNoAno).toEqual([
      { inicio: "2026-01-01", fim: "2026-02-28", situacao: "Licença", motivo: "Saúde", tipo: "licenca", votacoes: 2 },
    ]);
  });

  it("períodos são recortados ao ano; os de outros anos somem; fim depois do ano vira 31/12", () => {
    const r = presencaEmExercicio(
      vot,
      new Map(),
      [
        { inicio: "2024-01-01", fim: "2024-02-01", situacao: "Licença", motivo: "Velho" },
        { inicio: "2026-12-20", fim: "2027-01-10", situacao: "Licença", motivo: "Virada" },
        { inicio: "2027-02-01", fim: null, situacao: "Licença", motivo: "Futuro" },
      ],
      2026,
    );
    expect(r.periodosNoAno.map((p) => [p.motivo, p.inicio, p.fim])).toEqual([["Virada", "2026-12-20", "2026-12-31"]]);
    expect(r.elegiveis).toBe(5);
  });

  it("período aberto que começou antes do ano continua aberto", () => {
    const r = presencaEmExercicio(vot, new Map(), [{ ...lic, fim: null }], 2026);
    expect(r.periodosNoAno[0]).toMatchObject({ inicio: "2026-01-01", fim: null, votacoes: 5 });
    expect(r.elegiveis).toBe(0);
  });

  it("licença e antes da posse misturados viram tipo 'outro'; só antes da posse fica 'antes_posse'", () => {
    const antes = { inicio: "2023-02-01", fim: "2026-01-31", situacao: "Antes da posse", motivo: "Antes da posse" };
    const misto = presencaEmExercicio(
      vot,
      new Map(),
      [antes, { ...lic, inicio: "2026-03-01", fim: "2026-03-01" }],
      2026,
    );
    expect(misto.tipoFora).toBe("outro");
    expect(misto.foraDoExercicio).toBe(2);
    expect(presencaEmExercicio(vot, new Map(), [antes], 2026).tipoFora).toBe("antes_posse");
  });
});

describe("PRES-03: montarPeriodos usa só a legislatura atual", () => {
  const h = (dataHora: string, situacao: string | null, idLegislatura: number, descricaoStatus = ""): HistoricoApi => ({
    id: 74581,
    idLegislatura,
    dataHora,
    situacao,
    descricaoStatus,
  });

  it("ignora eventos de legislaturas antigas e grava a URL do histórico", () => {
    const rows = montarPeriodos(
      74581,
      [
        h("2011-02-01T00:00", "Exercício", 54),
        h("2013-01-01T00:00", "VACANCIA", 54, "Saída - Afastamento definitivo - Renúncia"),
        h("2026-09-14T21:30", "CONVOCADO", 57),
        h("2026-09-15T10:31", "Exercício", 57),
      ],
      7,
    );
    expect(rows).toEqual([
      {
        parlamentar_id: 74581,
        inicio: "2023-02-01",
        fim: "2026-09-14",
        situacao: "Antes da posse",
        motivo: "Antes da posse",
        source_url: urlHistorico(74581),
        coleta_id: 7,
      },
    ]);
  });

  it("só eventos de outras legislaturas devolve null", () => {
    expect(montarPeriodos(1, [h("2011-02-01T00:00", "Exercício", 54)], 7)).toBeNull();
  });

  it("idLegislatura em texto também casa", () => {
    const rows = montarPeriodos(
      1,
      [{ ...h("2023-02-01T12:00", "Exercício", 57), idLegislatura: "57" as unknown as number }],
      7,
    );
    expect(rows).toEqual([]);
  });
});
