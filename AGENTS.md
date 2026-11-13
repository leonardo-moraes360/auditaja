# Agentes

Instruções para agentes de IA e desenvolvedores que precisam entender a estrutura técnica do projeto.

O app Next.js mora em `apps/web`: leia `apps/web/AGENTS.md` antes de mexer nele.

## Estrutura do monorepo

| Pacote             | Caminho           | O que tem                                                                                   |
| ------------------ | ----------------- | ------------------------------------------------------------------------------------------- |
| `@auditaja/web`    | `apps/web`        | Site Next.js: páginas, componentes, leituras do banco (`src/data`), SEO, e2e com Playwright |
| `@auditaja/db`     | `packages/db`     | Esquema Kysely, cliente PostgreSQL, migrações, seed de teste e `db-init` do Docker          |
| `@auditaja/core`   | `packages/core`   | Regras de domínio puras: métricas, privacidade, emendas, trilha, Senado, padrão atípico     |
| `@auditaja/ingest` | `packages/ingest` | Coletores das fontes públicas e o CLI `pnpm ingest`                                         |

Dependências: `db ← core ← ingest` e `web → core, db`. Os pacotes exportam TypeScript direto (`@auditaja/core/metrics`, `@auditaja/db/client`...), sem etapa de build: o Next compila via `transpilePackages`, e tsx e Vitest leem o código-fonte.

Os comandos abaixo rodam na raiz; para um pacote só, use `pnpm --filter @auditaja/<pacote> <script>`.

## Como rodar

```bash
pnpm install
cp .env.example .env && cp .env.example apps/web/.env.local
# O Next lê só apps/web/.env*; o .env da raiz é dos scripts de banco e coleta
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

Os coletores rodam à mão. Preferem arquivos em lote a varrer a API, e usam o `ClienteEducado` (`packages/ingest/src/http.ts`): User-Agent identificado, leitura do `robots.txt` antes de cada host, no máximo 1 requisição por segundo (ou o `Crawl-delay`), backoff em 429/5xx e parada em 401/403. A API CKAN do TSE fica de fora porque o `robots.txt` dela proíbe `/api/`.

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

Cada página define title, description e canonical por `metadataDaPagina` (`apps/web/src/lib/site.ts`). O perfil traz JSON-LD (`Person`, `ProfilePage`, `BreadcrumbList`, `Dataset`) montado em `apps/web/src/lib/seo-perfil.ts`, só com o que a página já mostra (R2). Robôs de IA (lista em `ROBOS_DE_IA`) recebem a metadata no `<head>` sem streaming (`htmlLimitedBots` no `apps/web/next.config.ts`).

Limite conhecido: o conteúdo dos perfis e das listas chega por streaming (Suspense). Quem executa JavaScript, como o Googlebot, vê tudo; um robô sem JavaScript recebe o texto num bloco oculto do HTML, e por isso o perfil também sai em Markdown.

## Versão (semver)

A versão do site fica no `apps/web/package.json` e segue o [Versionamento Semântico](https://semver.org/lang/pt-BR/). O rodapé mostra `vX.Y.Z · <hash curto>`, lidos no build pelo `apps/web/next.config.ts` (hash: `NEXT_PUBLIC_COMMIT`, depois `SOURCE_COMMIT` do Coolify, depois `git rev-parse --short HEAD`). Sem git, aparece só a versão.

Enquanto o site não for lançado, fica em 0.x. Para publicar uma versão:

1. Anote as mudanças em `## [Não publicado]` no `CHANGELOG.md` ao longo do trabalho.
2. Rode `pnpm versao patch` (correção), `minor` (funcionalidade nova) ou `major` (mudança incompatível, ou o lançamento 1.0.0).
3. O script sobe o `apps/web/package.json`, move as notas para a seção da nova versão e imprime o `git commit` e o `git tag` para você revisar.

## Verificação

```bash
pnpm lint && pnpm typecheck && pnpm format:check
pnpm test            # unitários + integração (pula a integração se o Postgres não estiver no ar)
pnpm build && pnpm test:e2e
```

Se o Chromium do Playwright não estiver na versão esperada, defina `PW_CHROME` com o caminho de um Chrome/Chromium.

### CI (GitHub Actions)

`.github/workflows/ci.yml` roda os mesmos comandos em toda PR e em todo push na `main`, em jobs paralelos:

| Job                              | O que faz                                                                                                 |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `static`                         | `pnpm audit --prod --audit-level high`, lint, `format:check`, typecheck e build                           |
| `test`                           | `pnpm db:seed:test` num Postgres 16 do job (falha se o banco não subir) e `pnpm test` em todos os pacotes |
| `e2e (desktop)`, `e2e (celular)` | build, seed e Playwright de um projeto cada; em falha, `test-results/` fica como artefato por 7 dias      |

Os nomes dos jobs são os que a proteção da `main` exige como checks obrigatórios: renomear um job pede atualizar a regra no GitHub. As actions são fixadas por SHA e atualizadas pelo Dependabot (`.github/dependabot.yml`, toda segunda às 06:00, npm e GitHub Actions, minor/patch agrupados e 7 dias de espera após cada versão).

## Deploy (Coolify)

O build continua sendo `pnpm install` e `pnpm build` na raiz do repositório, e o start, `pnpm start`. Os dois delegam para `@auditaja/web`, e a saída fica em `apps/web/.next`. O diretório base do deploy precisa ser a raiz, não `apps/web`, para o pnpm enxergar os pacotes do workspace. `NEXT_PUBLIC_SITE_URL` continua sendo lido no build.

## Pendências conhecidas

- **Teto da CEAP por UF:** o Ato da Mesa nº 244/2026 atualizou os valores, mas a tabela não está na página do ato. `apps/web/src/data/teto-ceap.ts` só aceita valores conferidos; até lá a interface não compara com o teto.
- **Orientação de blocos:** a Câmara publica nomes de bloco truncados ("Bl UniPpPsd..."). Partidos que não aparecem na abreviação ficam sem orientação.
- **Presença:** inclui períodos de licença, porque os arquivos não trazem o período de exercício.
- **Senado:** fora do MVP.
