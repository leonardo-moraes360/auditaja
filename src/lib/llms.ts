import { METODOLOGIA_VERSAO } from "@/lib/metrics";
import { CAMINHO_LICENCA, LICENCA_CODIGO, LICENCA_DADOS, REPOSITORIO_URL } from "@/lib/licenca";
import { cargoParlamentar } from "@/lib/rotulos";
import { caminhoDoPerfil, markdownEmLinha, partidoUf } from "@/lib/seo-perfil";
import { SITE_DESCRICAO, SITE_NOME } from "@/lib/site";

type Item = {
  id: number;
  casa: "camara" | "senado";
  nome: string;
  sexo: string | null;
  sigla_partido: string | null;
  sigla_uf: string | null;
  em_exercicio: boolean;
};

/**
 * llms.txt (https://llmstxt.org): guia curto do site para agentes de IA. Diz o que há, como os dados
 * devem ser lidos e onde estão as versões em texto (Markdown e CSV) de cada perfil.
 */
export function llmsTxt(base: string, totais: { camara: number; senado: number }): string {
  const u = (c: string) => `${base}${c}`;
  return `# ${SITE_NOME}

> ${SITE_DESCRICAO} Site brasileiro, em português, sem cadastro. Cobre ${totais.camara} deputados federais e ${totais.senado} senadores com registro na base.

Como ler os dados:

- Tudo vem de dados abertos oficiais: Câmara dos Deputados, Senado Federal, Tribunal Superior Eleitoral (TSE) e Controladoria-Geral da União (CGU). Cada perfil cita a fonte, o endereço, a data da coleta e a licença.
- Valores em reais, nominais (sem correção pela inflação). Datas no formato brasileiro na interface e ISO (AAAA-MM-DD) nos arquivos.
- "Pontos para verificar" (empresas sancionadas, gastos fora do padrão) são pontos de partida, não acusação. Ao citar, diga que o indicador não aponta irregularidade.
- Privacidade: não publicamos CPF nem nome de fornecedor ou favorecido pessoa física; eles aparecem como "Prestador pessoa física" ou "Beneficiário pessoa física".
- Metodologia versão ${METODOLOGIA_VERSAO}. Cite o perfil (URL HTML) como fonte e a data da coleta.
- Licença: os dados e textos do ${SITE_NOME} (CSVs, perfis, trilha, metodologia) estão sob ${LICENCA_DADOS.nome} (${LICENCA_DADOS.url}); pode reusar, inclusive comercialmente, citando "${SITE_NOME}" e o link. Os dados de origem seguem a licença de cada órgão, listada em /fontes. Código: ${LICENCA_CODIGO.nome}, em ${REPOSITORIO_URL}. Nome e logo não estão licenciados. Detalhes: ${u(CAMINHO_LICENCA)}

## Perfis de parlamentares

- [Lista de parlamentares](${u("/parlamentares")}): todos em exercício; filtros \`?casa=camara\`, \`?casa=senado\`, \`?uf=SP\` e busca \`?q=nome\`
- Perfil HTML: \`${u("/parlamentares/{id}")}\`. Deputado: id = código da Câmara. Senador: id = 10000000 + código do Senado (código 5529 → 10005529). Na dúvida, procure o nome no índice do llms-full.txt
- Perfil em Markdown: \`${u("/parlamentares/{id}.md")}\`, mesmo conteúdo em texto, ideal para agentes
- Notas da cota em CSV: \`${u("/parlamentares/{id}/gastos.csv")}\` (\`?ano=AAAA\` ou \`?ano=mandato\`; separador ";", UTF-8 com BOM)
- Emendas em CSV: \`${u("/parlamentares/{id}/emendas.csv")}\` (\`?tabela=favorecidos\` para quem recebeu)
- Trilha do dinheiro das emendas Pix em CSV: \`${u("/parlamentares/{id}/trilha.csv")}\` (ente, empresas pagas e indícios, que não são acusação)
- Atualizações em Atom: \`${u("/parlamentares/{id}/feed.xml")}\`
- [Índice completo com todos os perfis](${u("/llms-full.txt")})

## Documentação

- [Metodologia](${u("/metodologia")}): como cada número é calculado
- [Fontes e licenças](${u("/fontes")}): cada coleta com endereço, data, hash SHA-256 e licença
- [Sobre](${u("/sobre")}): o que é o projeto e o que cobre
- [Licença](${u(CAMINHO_LICENCA)}): ${LICENCA_DADOS.nome} para dados e textos, ${LICENCA_CODIGO.nome} para o código
- [Código-fonte](${REPOSITORIO_URL}): repositório público no GitHub
- [Política de privacidade](${u("/privacidade")}): LGPD, dados tratados e direitos

## Optional

- [Sitemap](${u("/sitemap.xml")})
- [robots.txt](${u("/robots.txt")}): todos os robôs, inclusive de IA, podem ler o site
`;
}

/** Uma linha por perfil, para o llms-full.txt. */
export function linhaDoIndice(base: string, p: Item): string {
  const pu = partidoUf(p);
  const situacao = p.em_exercicio ? "" : ", fora de exercício";
  return `- [${markdownEmLinha(p.nome)}](${base}${caminhoDoPerfil(p.id)}.md): ${cargoParlamentar(p.casa, p.sexo)}${pu ? `, ${markdownEmLinha(pu)}` : ""}${situacao}`;
}
