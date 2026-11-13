import { brl } from "@auditaja/core/format";
import { cargoParlamentar, NOME_UF } from "@auditaja/core/rotulos";
import { DESLOCAMENTO_SENADO } from "@auditaja/core/senado";
import { SITE_NOME, urlAbsoluta } from "@/lib/site";

/** Campos públicos usados no <head>, no JSON-LD e no Markdown. Nada além do que o perfil já exibe (R2). */
export type IdentificacaoPublica = {
  id: number;
  casa: "camara" | "senado";
  nome: string;
  sexo: string | null;
  sigla_partido: string | null;
  sigla_uf: string | null;
  url_foto: string | null;
  em_exercicio: boolean;
  source_url: string;
};

export type CotaResumo = { ano: number; total: number; documentos: number } | null;

/**
 * Texto da fonte dentro de Markdown (título, item de lista, link): uma linha só e sinais de Markdown
 * escapados, para que um nome com "# ", "[x](y)" ou "|" não vire título, link ou coluna.
 */
export function markdownEmLinha(s: string): string {
  // Sem "[" e "]" não há link; "(" e "*" ficam como estão para o texto seguir legível em bruto.
  return s
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[\\`[\]<>|]/g, "\\$&")
    .replace(/^([#>+-])/, "\\$1");
}

export const caminhoDoPerfil = (id: number) => `/parlamentares/${id}`;

/** "PT-SP", "PT", "SP" ou "" conforme o que a fonte informa. */
export function partidoUf(p: Pick<IdentificacaoPublica, "sigla_partido" | "sigla_uf">): string {
  return [p.sigla_partido, p.sigla_uf].filter(Boolean).join("-");
}

/** "Maria Exemplo (PT-SP), deputada federal": nome, partido-UF e cargo em minúsculas. */
export function tituloDoPerfil(p: IdentificacaoPublica): string {
  const pu = partidoUf(p);
  const cargo = cargoParlamentar(p.casa, p.sexo).toLowerCase();
  return `${p.nome}${pu ? ` (${pu})` : ""}, ${cargo}`;
}

/**
 * Descrição para buscadores e cartões: o que há no perfil e o número principal (cota do último ano).
 * Fica abaixo de ~160 caracteres sempre que possível, para não ser cortada no resultado de busca.
 */
export function descricaoDoPerfil(p: IdentificacaoPublica, cota: CotaResumo): string {
  const cargo = cargoParlamentar(p.casa, p.sexo);
  const uf = p.sigla_uf && NOME_UF[p.sigla_uf] ? ` por ${NOME_UF[p.sigla_uf]}` : "";
  const gasto = cota ? ` Cota parlamentar em ${cota.ano}: ${brl(cota.total)}.` : "";
  return `${cargo}${uf}.${gasto} Votações, presença, emendas e bens declarados, com fonte oficial.`;
}

/**
 * URL da página do parlamentar no site oficial da Casa, para `sameAs`. Senadores são gravados com
 * id = DESLOCAMENTO_SENADO + código do Senado; o site do Senado usa o código.
 */
export function perfilOficial(p: Pick<IdentificacaoPublica, "id" | "casa">): string {
  return p.casa === "senado"
    ? `https://www25.senado.leg.br/web/senadores/senador/-/perfil/${p.id - DESLOCAMENTO_SENADO}`
    : `https://www.camara.leg.br/deputados/${p.id}`;
}

/**
 * JSON-LD do perfil: a pessoa (cargo, partido, UF, foto oficial e perfis oficiais), a trilha de
 * navegação, a própria página e os CSVs como Dataset. Sem data de nascimento, nome civil ou CPF (R2).
 */
export function jsonLdDoPerfil(
  p: IdentificacaoPublica,
  opts: { base: string; descricao: string; dataColeta?: Date | null; temGastos?: boolean; temEmendas?: boolean },
) {
  const { base } = opts;
  const url = urlAbsoluta(caminhoDoPerfil(p.id), base);
  const senado = p.casa === "senado";
  const casa = senado
    ? { "@type": "GovernmentOrganization", name: "Senado Federal", url: "https://www12.senado.leg.br/" }
    : { "@type": "GovernmentOrganization", name: "Câmara dos Deputados", url: "https://www.camara.leg.br/" };
  const portalDaCasa = senado ? "https://www12.senado.leg.br/dados-abertos" : "https://dadosabertos.camara.leg.br/";
  const cgu = {
    "@type": "GovernmentOrganization",
    name: "Controladoria-Geral da União (Portal da Transparência)",
    url: "https://portaldatransparencia.gov.br/",
  };
  const modificado = opts.dataColeta ? opts.dataColeta.toISOString() : undefined;
  const pessoa: Record<string, unknown> = {
    "@type": "Person",
    "@id": `${url}#pessoa`,
    name: p.nome,
    jobTitle: cargoParlamentar(p.casa, p.sexo),
    worksFor: casa,
    url,
    sameAs: [perfilOficial(p)],
    nationality: { "@type": "Country", name: "Brasil" },
  };
  if (p.url_foto) pessoa.image = p.url_foto;
  if (p.sigla_partido) pessoa.affiliation = { "@type": "PoliticalParty", name: p.sigla_partido };
  if (p.sigla_uf && NOME_UF[p.sigla_uf])
    pessoa.workLocation = { "@type": "AdministrativeArea", name: NOME_UF[p.sigla_uf] };

  const dataset = (
    nome: string,
    ancora: string,
    arquivo: string,
    descricao: string,
    fonte: { creator: object; portal: string },
  ) => ({
    "@type": "Dataset",
    name: `${nome}: ${p.nome}`,
    description: descricao,
    url: `${url}#${ancora}`,
    inLanguage: "pt-BR",
    isAccessibleForFree: true,
    creator: fonte.creator,
    publisher: { "@id": `${base}/#organizacao` },
    about: { "@id": `${url}#pessoa` },
    isBasedOn: fonte.portal,
    // Licença de cada fonte, com data e hash de cada coleta.
    citation: urlAbsoluta("/fontes", base),
    ...(modificado ? { dateModified: modificado } : {}),
    distribution: [{ "@type": "DataDownload", encodingFormat: "text/csv", contentUrl: urlAbsoluta(arquivo, base) }],
  });

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ProfilePage",
        "@id": `${url}#pagina`,
        url,
        name: tituloDoPerfil(p),
        description: opts.descricao,
        inLanguage: "pt-BR",
        isPartOf: { "@id": `${base}/#site` },
        mainEntity: { "@id": `${url}#pessoa` },
        ...(modificado ? { dateModified: modificado } : {}),
      },
      pessoa,
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: SITE_NOME, item: `${base}/` },
          { "@type": "ListItem", position: 2, name: "Parlamentares", item: urlAbsoluta("/parlamentares", base) },
          {
            "@type": "ListItem",
            position: 3,
            name: senado ? "Senado Federal" : "Câmara dos Deputados",
            item: urlAbsoluta(`/parlamentares?casa=${p.casa}`, base),
          },
          { "@type": "ListItem", position: 4, name: p.nome, item: url },
        ],
      },
      // Só declara o Dataset quando há dados: perfil sem notas ou sem emendas não promete arquivo vazio.
      ...(opts.temGastos === false
        ? []
        : [
            dataset(
              senado ? "Gastos da cota do senador (CEAPS)" : "Gastos da cota parlamentar (CEAP)",
              "gastos",
              `${caminhoDoPerfil(p.id)}/gastos.csv`,
              "Notas fiscais da cota parlamentar, uma por linha, com fornecedor, tipo de despesa e valor. Fornecedor pessoa física aparece sem nome nem CPF.",
              { creator: casa, portal: portalDaCasa },
            ),
          ]),
      ...(opts.temEmendas === false
        ? []
        : [
            dataset(
              "Emendas parlamentares e quem recebeu",
              "emendas",
              `${caminhoDoPerfil(p.id)}/emendas.csv`,
              "Emendas ao Orçamento indicadas pelo parlamentar e os favorecidos, segundo o Portal da Transparência (CGU).",
              { creator: cgu, portal: "https://portaldatransparencia.gov.br/emendas" },
            ),
          ]),
    ],
  };
}
