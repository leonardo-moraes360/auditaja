import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { anosComPonto, PontosParaVerificar, pontosParaVerificar } from "@/components/perfil/pontos";
import { SemSancao } from "@/components/perfil/sancao";
import type { PadraoAtipico } from "@/data/atipico";

const atip = (ano: number, acima: number, salto: number) =>
  ({
    ano,
    acima: Array.from({ length: acima }, () => ({})),
    salto: Array.from({ length: salto }, () => ({})),
    anoAnteriorDisponivel: true,
  }) as unknown as PadraoAtipico;

describe("pontosParaVerificar", () => {
  it("lista sanção antes de atípico, ano mais recente primeiro, e ignora anos sem caso", () => {
    const p = pontosParaVerificar(
      7,
      [
        { ano: 2025, empresas: 30, sancionadas: 1 },
        { ano: 2026, empresas: 40, sancionadas: 2 },
        { ano: 2024, empresas: 10, sancionadas: 0 },
      ],
      [atip(2026, 1, 0), atip(2025, 0, 0), atip(2024, 1, 2)],
    );
    expect(p.map((x) => [x.tipo, x.ano, x.n])).toEqual([
      ["sancao", 2026, 2],
      ["sancao", 2025, 1],
      ["atipico", 2026, 1],
      ["atipico", 2024, 3],
    ]);
    expect(p[0].texto).toBe("2 empresas pagas com a cota estão numa lista de empresas punidas · 2026");
    expect(p[1].texto).toBe("1 empresa paga com a cota está numa lista de empresas punidas · 2025");
    expect(p[3].texto).toBe("3 gastos fora do padrão · 2024");
    expect(p[0].href).toBe("/parlamentares/7?ano=2026#gastos");
    expect([...anosComPonto(p)].toSorted()).toEqual([2024, 2025, 2026]);
  });

  it("sem pontos, a faixa diz que a checagem foi feita (R4: sem acusação)", () => {
    const html = renderToStaticMarkup(createElement(PontosParaVerificar, { pontos: [], periodo: "em 2025–2026" }));
    expect(html).toContain("Nenhum ponto para verificar em 2025–2026");
    const com = renderToStaticMarkup(
      createElement(PontosParaVerificar, {
        pontos: pontosParaVerificar(1, [{ ano: 2026, empresas: 3, sancionadas: 1 }], []),
        periodo: "em 2026",
      }),
    );
    expect(com).toContain("1 ponto para verificar");
    expect(com).toContain("não é acusação");
  });
});

describe("SemSancao", () => {
  const render = (anos: number[]) =>
    renderToStaticMarkup(
      createElement(SemSancao, {
        resumo: [
          { ano: 2025, empresas: 30, sancionadas: 1 },
          { ano: 2026, empresas: 41, sancionadas: 0 },
        ],
        anosExibidos: anos,
        periodo: `em ${anos[0]}`,
        base: "10/11/2026",
        hrefAno: (a: number) => `/x?ano=${a}`,
      }),
    );

  it("diz que nenhuma empresa do período está nas listas e aponta o outro ano com caso", () => {
    const html = render([2026]);
    expect(html).toContain("nenhuma das 41 empresas pagas com a cota em 2026 aparece");
    expect(html).toContain("CEIS e CNEP, base de 10/11/2026");
    expect(html).toContain("Em 2025 há 1 caso");
  });

  it("some quando o período exibido tem sanção (o aviso detalhado aparece no lugar)", () => {
    expect(render([2025])).toBe("");
  });
});
