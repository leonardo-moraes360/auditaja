# Auditaja

Plataforma para que a população brasileira possa auditar seus políticos e as contas públicas.

O MVP é o **perfil do deputado federal**: gastos da cota parlamentar (CEAP), votações nominais no Plenário, alinhamento com a orientação do partido e bens declarados ao TSE. Cada número mostra a fonte, a data de coleta e o link para o original.

## Stack

Next.js 16 (App Router, Cache Components), React 19, Tailwind CSS 4, shadcn/ui, PostgreSQL 16, Kysely, Vitest e Playwright. Gerenciador: pnpm.

## Como rodar

```bash
pnpm install
cp .env.example .env && cp .env.example .env.local
pnpm db:up          # Postgres em 127.0.0.1:5436 (cria também o banco auditaja_test)
pnpm db:migrate
pnpm ingest tudo 2026   # coleta real: ~80 MB, alguns minutos
pnpm dev
```

Sem rede, use os dados fictícios do banco de teste: `pnpm db:seed:test` e aponte `DATABASE_URL` para `auditaja_test`.

## Coleta (`pnpm ingest <comando> [ano]`)

| Comando     | Fonte                                                            |
| ----------- | ---------------------------------------------------------------- |
| `deputados` | Câmara, API v2 `/deputados` + arquivo `deputados.csv`            |
| `orgaos`    | Câmara, arquivo `orgaosDeputados-L57.csv`                        |
| `ceap`      | Câmara, arquivo anual `cotas/Ano-AAAA.csv.zip`                   |
| `votacoes`  | Câmara, arquivos anuais de votações, votos e orientações         |
| `bens`      | TSE, `consulta_cand` e `bem_candidato` (download em lote no CDN) |
| `tudo`      | Todos acima; bens de 2018, 2022 e 2026                           |

Os coletores rodam à mão. Preferem arquivos em lote a varrer a API, e usam o `ClienteEducado` (`src/ingest/http.ts`): User-Agent identificado, leitura do `robots.txt` antes de cada host, no máximo 1 requisição por segundo (ou o `Crawl-delay`), backoff em 429/5xx e parada em 401/403. A API CKAN do TSE fica de fora porque o `robots.txt` dela proíbe `/api/`.

## Regras legais aplicadas (R1–R13)

- **R1 proveniência:** tabela `coleta` (URL, data, SHA-256, licença); todo registro aponta para ela e a interface mostra a fonte em cada seção.
- **R2 minimização:** não guardamos CPF do parlamentar, nome de passageiros da CEAP, nem a descrição livre dos bens (pode ter endereço).
- **R3 mascaramento:** CPF de fornecedor PF vira `***.XXX.XXX-**` na gravação e o nome vira "Prestador pessoa física".
- **R4 linguagem:** indicadores descritos como pontos de partida para verificação; o alerta de "padrão atípico" ficou para depois.
- **R6 contestação:** formulário por perfil grava em `pedido_correcao`.
- **R7 coleta não invasiva:** ver acima.
- **R10:** partido só de parlamentares; nada de listas de filiados.
- **R13:** rodapé e política de privacidade (`/privacidade`) com controlador e encarregado (variáveis `NEXT_PUBLIC_*`, hoje placeholders).

## SEO e agentes de IA

O domínio público vem de `NEXT_PUBLIC_SITE_URL`, lido no build: sem ele, canonical, sitemap e cartões apontam para `http://localhost:3000`.

| Endereço                          | Para quê                                                                 |
| --------------------------------- | ------------------------------------------------------------------------ |
| `/robots.txt`                     | Libera todos os robôs, inclusive de IA e de treino; bloqueia formulários |
| `/sitemap.xml`                    | Páginas fixas, listas por Casa e UF e todos os perfis                    |
| `/llms.txt`, `/llms-full.txt`     | Guia do site para agentes e índice de perfis em Markdown                 |
| `/parlamentares/{id}.md`          | Perfil em Markdown (`noindex`, canonical para o HTML)                    |
| `opengraph-image`/`twitter-image` | Cartões 1200×630 do site e de cada perfil                                |

Cada página define title, description e canonical por `metadataDaPagina` (`src/lib/site.ts`). O perfil traz JSON-LD (`Person`, `ProfilePage`, `BreadcrumbList`, `Dataset`) montado em `src/lib/seo-perfil.ts`, só com o que a página já mostra (R2). Robôs de IA (lista em `ROBOS_DE_IA`) recebem a metadata no `<head>` sem streaming (`htmlLimitedBots` no `next.config.ts`).

Limite conhecido: o conteúdo dos perfis e das listas chega por streaming (Suspense). Quem executa JavaScript, como o Googlebot, vê tudo; um robô sem JavaScript recebe o texto num bloco oculto do HTML, e por isso o perfil também sai em Markdown.

## Versão (semver)

A versão do site fica no `package.json` e segue o [Versionamento Semântico](https://semver.org/lang/pt-BR/). O rodapé mostra `vX.Y.Z · <hash curto>`, lidos no build pelo `next.config.ts` (hash: `NEXT_PUBLIC_COMMIT`, depois `SOURCE_COMMIT` do Coolify, depois `git rev-parse --short HEAD`). Sem git, aparece só a versão.

Enquanto o site não for lançado, fica em 0.x. Para publicar uma versão:

1. Anote as mudanças em `## [Não publicado]` no `CHANGELOG.md` ao longo do trabalho.
2. Rode `pnpm versao patch` (correção), `minor` (funcionalidade nova) ou `major` (mudança incompatível, ou o lançamento 1.0.0).
3. O script sobe o `package.json`, move as notas para a seção da nova versão e imprime o `git commit` e o `git tag` para você revisar.

## Verificação

```bash
pnpm lint && pnpm typecheck && pnpm format:check
pnpm test            # unitários + integração (pula a integração se o Postgres não estiver no ar)
pnpm build && pnpm test:e2e
```

Se o Chromium do Playwright não estiver na versão esperada, defina `PW_CHROME` com o caminho de um Chrome/Chromium.

## Pendências conhecidas

- **Teto da CEAP por UF:** o Ato da Mesa nº 244/2026 atualizou os valores, mas a tabela não está na página do ato. `src/data/teto-ceap.ts` só aceita valores conferidos; até lá a interface não compara com o teto.
- **Orientação de blocos:** a Câmara publica nomes de bloco truncados ("Bl UniPpPsd..."). Partidos que não aparecem na abreviação ficam sem orientação.
- **Presença:** inclui períodos de licença, porque os arquivos não trazem o período de exercício.
- **Senado:** fora do MVP.
