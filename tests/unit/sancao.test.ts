import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AvisoSancao } from "@/components/perfil/sancao";
import type { SancaoFornecedor } from "@/data/emendas";

/** C22/C29: o link conta as notas dentro da sanção (N), não o total de notas do fornecedor (M). */
const sancao = (notas: number): SancaoFornecedor => ({
  cadastro: "CEIS",
  cnpj: "55666777000188",
  nome: "POSTO",
  categoria: "Suspensão",
  data_inicio: "2026-02-01",
  data_fim: "2026-06-30",
  orgao: "Órgão",
  base: "10/11/2026",
  notas,
});
const render = (notas: number) =>
  renderToStaticMarkup(
    createElement(AvisoSancao, {
      fornecedores: [{ fornecedor_nome: "Posto", fornecedor_doc: "55.666.777/0001-88", documentos: 9 }],
      sancoes: [sancao(notas)],
      periodo: "no mandato",
      hrefNotas: (doc: string, de: string | null, ate: string | null) => `/csv?doc=${doc}&de=${de}&ate=${ate}`,
    }),
  );

describe("AvisoSancao", () => {
  it("rótulo e destino do link usam as notas dentro da sanção", () => {
    const html = render(3);
    expect(html).toContain("3 das 9 notas pagas a essa empresa no mandato têm data dentro desse período.");
    expect(html).toContain(">Ver as 3 notas</a>");
    expect(html).not.toContain("Ver as 9 notas");
    expect(html).toContain('href="/csv?doc=55.666.777/0001-88&amp;de=2026-02-01&amp;ate=2026-06-30"');
  });
  it("sem nota dentro da sanção, sem link de notas", () => {
    const html = render(0);
    expect(html).toContain("Nenhuma das 9 notas");
    expect(html).not.toMatch(/Ver (a nota|as \d+ notas)/);
  });
});
