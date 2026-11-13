import { describe, expect, it } from "vitest";
import { jsonLd, metadataDaPagina, SITE_URL_PADRAO, siteUrl, urlAbsoluta } from "@/lib/site";
import {
  caminhoDoPerfil,
  descricaoDoPerfil,
  jsonLdDoPerfil,
  markdownEmLinha,
  partidoUf,
  perfilOficial,
  tituloDoPerfil,
  type IdentificacaoPublica,
} from "@/lib/seo-perfil";
import { linhaDoIndice, llmsTxt } from "@/lib/llms";

const deputada: IdentificacaoPublica = {
  id: 204554,
  casa: "camara",
  nome: "Maria Exemplo",
  sexo: "F",
  sigla_partido: "PT",
  sigla_uf: "SP",
  url_foto: "https://www.camara.leg.br/internet/deputado/bandep/204554.jpg",
  em_exercicio: true,
  source_url: "https://dadosabertos.camara.leg.br/api/v2/deputados/204554",
};
const senador: IdentificacaoPublica = { ...deputada, id: 10005529, casa: "senado", sexo: "M", sigla_partido: null };

describe("siteUrl", () => {
  it("usa a origem da variável, sem caminho nem barra final", () => {
    expect(siteUrl("https://auditaja.org.br/")).toBe("https://auditaja.org.br");
    expect(siteUrl("https://auditaja.org.br/qualquer/coisa?x=1")).toBe("https://auditaja.org.br");
  });
  it("sem variável, vazia, inválida ou com protocolo estranho, cai no endereço local", () => {
    expect(siteUrl(undefined)).toBe(SITE_URL_PADRAO);
    expect(siteUrl("  ")).toBe(SITE_URL_PADRAO);
    expect(siteUrl("auditaja.org.br")).toBe(SITE_URL_PADRAO);
    expect(siteUrl("ftp://auditaja.org.br")).toBe(SITE_URL_PADRAO);
  });
  it("monta URL absoluta a partir de caminho relativo", () => {
    expect(urlAbsoluta("/sobre", "https://a.br")).toBe("https://a.br/sobre");
    expect(urlAbsoluta("/parlamentares?uf=SP", "https://a.br")).toBe("https://a.br/parlamentares?uf=SP");
  });
});

describe("jsonLd", () => {
  it("escapa < para que um texto da fonte não feche o <script>", () => {
    const s = jsonLd({ name: "</script><script>alert(1)</script>" });
    expect(s).not.toContain("<");
    expect(JSON.parse(s).name).toBe("</script><script>alert(1)</script>");
  });
});

describe("metadataDaPagina", () => {
  it("repete site, idioma, URL e cartão do X em toda página", () => {
    const m = metadataDaPagina({ titulo: "Sobre", descricao: "D", caminho: "/sobre" });
    expect(m.alternates).toEqual({ canonical: "/sobre" });
    expect(m.openGraph).toMatchObject({ siteName: "Auditaja", locale: "pt_BR", url: "/sobre", type: "website" });
    expect(m.twitter.card).toBe("summary_large_image");
    expect("robots" in m).toBe(false);
  });
  it("indexar: false vira noindex com follow", () => {
    expect(metadataDaPagina({ titulo: "B", descricao: "D", caminho: "/x", indexar: false }).robots).toEqual({
      index: false,
      follow: true,
    });
  });
});

describe("textos do perfil", () => {
  it("título com partido-UF e cargo no gênero informado", () => {
    expect(tituloDoPerfil(deputada)).toBe("Maria Exemplo (PT-SP), deputada federal");
    expect(tituloDoPerfil(senador)).toBe("Maria Exemplo (SP), senador");
    expect(tituloDoPerfil({ ...deputada, sigla_partido: null, sigla_uf: null })).toBe(
      "Maria Exemplo, deputada federal",
    );
    expect(partidoUf({ sigla_partido: "PL", sigla_uf: null })).toBe("PL");
  });
  it("descrição com o total da cota e abaixo de 160 caracteres", () => {
    // Intl separa "R$" do número com espaço não separável.
    const d = descricaoDoPerfil(deputada, { ano: 2026, total: 44100, documentos: 3 }).replace(/\u00a0/g, " ");
    expect(d).toBe(
      "Deputada federal por São Paulo. Cota parlamentar em 2026: R$ 44.100. Votações, presença, emendas e bens declarados, com fonte oficial.",
    );
    expect(d.length).toBeLessThanOrEqual(160);
    expect(descricaoDoPerfil(deputada, null)).not.toContain("Cota");
  });
  it("perfil oficial da Casa certa", () => {
    expect(perfilOficial(deputada)).toBe("https://www.camara.leg.br/deputados/204554");
    expect(perfilOficial(senador)).toBe("https://www25.senado.leg.br/web/senadores/senador/-/perfil/5529");
  });
});

describe("jsonLdDoPerfil", () => {
  const ld = jsonLdDoPerfil(deputada, {
    base: "https://a.br",
    descricao: "D",
    dataColeta: new Date("2026-11-10T08:12:00Z"),
  });
  const grafo = ld["@graph"] as Record<string, unknown>[];
  const doTipo = (t: string) => grafo.filter((g) => g["@type"] === t);

  it("descreve a pessoa com cargo, partido, UF, foto e perfil oficial", () => {
    const [pessoa] = doTipo("Person");
    expect(pessoa).toMatchObject({
      name: "Maria Exemplo",
      jobTitle: "Deputada federal",
      url: "https://a.br/parlamentares/204554",
      image: deputada.url_foto,
      sameAs: ["https://www.camara.leg.br/deputados/204554"],
      affiliation: { "@type": "PoliticalParty", name: "PT" },
      workLocation: { name: "São Paulo" },
    });
  });
  it("R2: nada de nascimento, nome civil ou documento", () => {
    const texto = JSON.stringify(ld);
    expect(texto).not.toMatch(/birthDate|nascimento|nome_civil|taxID|"identifier"|SILVA/);
  });
  it("página de perfil, trilha de 4 níveis e os dois CSVs como Dataset com licença", () => {
    expect(doTipo("ProfilePage")[0]).toMatchObject({ dateModified: "2026-11-10T08:12:00.000Z" });
    const trilha = doTipo("BreadcrumbList")[0].itemListElement as { item: string }[];
    expect(trilha.map((i) => i.item)).toEqual([
      "https://a.br/",
      "https://a.br/parlamentares",
      "https://a.br/parlamentares?casa=camara",
      "https://a.br/parlamentares/204554",
    ]);
    const datasets = doTipo("Dataset") as { distribution: { contentUrl: string }[]; citation: string }[];
    expect(datasets.map((d) => d.distribution[0].contentUrl)).toEqual([
      "https://a.br/parlamentares/204554/gastos.csv",
      "https://a.br/parlamentares/204554/emendas.csv",
    ]);
    expect(datasets.every((d) => d.citation === "https://a.br/fontes")).toBe(true);
    expect(
      datasets.every((d) => (d as { license?: string }).license === "https://creativecommons.org/licenses/by/4.0/"),
    ).toBe(true);
  });
  it("sem notas nem emendas, não declara Dataset", () => {
    const s = jsonLdDoPerfil(deputada, { base: "https://a.br", descricao: "D", temGastos: false, temEmendas: false });
    expect((s["@graph"] as { "@type": string }[]).some((g) => g["@type"] === "Dataset")).toBe(false);
  });
  it("sem foto nem partido, omite os campos em vez de mandar null", () => {
    const s = jsonLdDoPerfil({ ...senador, url_foto: null }, { base: "https://a.br", descricao: "D" });
    const pessoa = (s["@graph"] as Record<string, unknown>[]).find((g) => g["@type"] === "Person")!;
    expect(pessoa).not.toHaveProperty("image");
    expect(pessoa).not.toHaveProperty("affiliation");
    expect(pessoa.worksFor).toMatchObject({ name: "Senado Federal" });
  });
});

describe("markdownEmLinha", () => {
  it("nome hostil não vira título, link, HTML nem coluna", () => {
    const s = markdownEmLinha("# Maria </script> | [y](javascript:alert(2))\n# Injetado");
    expect(s).toBe("\\# Maria \\</script\\> \\| \\[y\\](javascript:alert(2)) # Injetado");
    expect(s).not.toContain("\n");
  });
  it("texto comum fica legível", () => expect(markdownEmLinha("São Paulo (SP)")).toBe("São Paulo (SP)"));
});

describe("llms.txt", () => {
  const t = llmsTxt("https://a.br", { camara: 513, senado: 81 });
  it("segue o formato: H1, resumo em citação e seções H2 com links", () => {
    expect(t.startsWith("# Auditaja\n\n> ")).toBe(true);
    expect(t).toContain("513 deputados federais e 81 senadores");
    expect(t).toMatch(/^## Perfis de parlamentares$/m);
    expect(t).toMatch(/^## Optional$/m);
    expect(t).toContain("[Metodologia](https://a.br/metodologia)");
    expect(t).toContain("https://a.br/parlamentares/{id}.md");
  });
  it("declara a licença dos dados (CC BY 4.0), a do código (AGPL) e que as fontes têm licença própria", () => {
    expect(t).toContain("CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/)");
    expect(t).toContain("GNU AGPL-3.0");
    expect(t).toMatch(/dados de origem seguem a licença de cada órgão/);
    expect(t).toContain("[Licença](https://a.br/sobre#licenca)");
    expect(t).toContain("[Código-fonte](https://github.com/leonardo-moraes360/auditaja)");
  });
  it("linha do índice aponta para o Markdown e marca quem está fora de exercício", () => {
    expect(linhaDoIndice("https://a.br", deputada)).toBe(
      "- [Maria Exemplo](https://a.br/parlamentares/204554.md): Deputada federal, PT-SP",
    );
    expect(linhaDoIndice("https://a.br", { ...senador, em_exercicio: false })).toContain("fora de exercício");
  });
  it("caminho do perfil", () => expect(caminhoDoPerfil(1)).toBe("/parlamentares/1"));
});
