# Perfil do deputado federal Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: `.specs/features/perfil-parlamentar/design.md`
**Status**: Done (fases 1–4 retroativas; fases 5–6 após a verificação nº 1)

> **Commits:** fases 1–4 em `c5b06ce` e `01f97cf`; T13 em `ac8b627`; T14 em `34fcdb3` e `399468f`; fases 6 e 7 em commits próprios; T26 em `e615cb0`, `61872c5` e `8573b87`.
>
> **Desvio registrado:** a implementação veio antes das specs. As tarefas abaixo descrevem o trabalho já feito e foram entregues em dois commits (`c5b06ce` scaffold, `01f97cf` feature), mais `ac8b627` (rodapé), não em um commit por tarefa. A verificação independente (`validation.md`) compensa essa falta de granularidade conferindo cada critério contra código e testes.

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec. Guidelines found: `AGENTS.md` (só regras do Next.js, sem metas de teste), `vitest.config.mts`, `playwright.config.ts` - strong defaults applied.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Regras puras (privacy, metrics, format, robots) | unit | Todos os ramos; 1:1 com ACs; todos os edge cases listados | `tests/unit/*.test.ts` | `pnpm test` |
| Cliente HTTP de coleta | unit (fetch falso) | Robots, intervalo, backoff, bloqueio | `tests/unit/http.test.ts` | `pnpm test` |
| Transformações de ingestão | unit | Cada regra R2/R3 e deduplicação | `tests/unit/transformacoes.test.ts` | `pnpm test` |
| Camada de leitura (`src/data`) | integration (Postgres) | Agregações do perfil e busca | `tests/integracao/*.test.ts` | `pnpm test` |
| Páginas e Server Action | e2e | Rotas em escopo: feliz + edge + erro | `tests/e2e/*.spec.ts` | `pnpm build && pnpm test:e2e` |
| Esquema, migrações, config | none | build gate only | - | `pnpm typecheck` |

## Gate Check Commands

> Generated from `package.json`.

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | Tarefas só com testes unitários | `pnpm test` |
| Full | Tarefas com integração ou e2e | `pnpm db:seed:test && pnpm test && pnpm build && pnpm test:e2e` |
| Build | Fim de fase ou tarefas sem teste | `pnpm lint && pnpm typecheck && pnpm format:check && pnpm test && pnpm build` |

---

## Execution Plan

### Phase 1: Fundação

```
T1 → T2
```

### Phase 2: Regras puras

```
T3 → T4 → T5
```

### Phase 3: Coleta

```
T6 → T7 → T8
```

### Phase 4: Leitura e telas

```
T9 → T10 → T11 → T12
```

### Phase 5: Fidelidade ao protótipo (pedidos do usuário na revisão)

```
T13 → T14
```

### Phase 6: Correções da verificação nº 1

```
T15 → T16 → T17 → T18 → T19
```

### Phase 7: Pedidos da revisão e correções da verificação nº 2

```
T20 → T21 → T22 → T23 → T24
```

### Phase 8: Acessibilidade

```
T25
```

### Phase 9: Política de privacidade

```
T26
```

---

## Task Breakdown

### T1: Esquema e migrações

**What**: Tabelas `coleta`, `parlamentar`, `orgao_membro`, `despesa_ceap`, `votacao`, `voto`, `orientacao`, `candidatura`, `bem_declarado`, `pedido_correcao` e extensão `unaccent`.
**Where**: `src/db/migrations/0001_init.ts`
**Depends on**: None
**Reuses**: Kysely Migrator
**Requirement**: PROV-01

**Done when**:

- [x] `pnpm db:migrate` aplica `0001_init` e `0002_busca`
- [x] Tipos em `src/db/types.ts` batem com as colunas

**Tests**: none
**Gate**: build

---

### T2: Seed fictício para testes

**What**: Dados fictícios (ids ≥ 900000000) e script que só roda em banco `_test`.
**Where**: `src/db/seed.ts`
**Depends on**: T1
**Reuses**: tipos de T1
**Requirement**: EDGE-05

**Done when**:

- [x] `pnpm db:seed:test` aplica o seed
- [x] Script recusa banco sem sufixo `_test`

**Tests**: none
**Gate**: build

---

### T3: Mascaramento e documento publicável

**What**: `mascararCpf`, `documentoPublicavel`, `nomeFornecedorPublicavel`.
**Where**: `src/lib/privacy.ts`
**Depends on**: None
**Requirement**: PRIV-01, PRIV-02, PRIV-04

**Done when**:

- [x] CPF vira `***.XXX.XXX-**`; CNPJ irregular é normalizado; inválido não é publicado
- [x] Gate quick passa

**Tests**: unit
**Gate**: quick

---

### T4: Métricas de votação e bens

**What**: Orientação aplicável (partido > federação > bloco), alinhamento, variação nominal, teto acumulado.
**Where**: `src/lib/metrics.ts`
**Depends on**: T3
**Requirement**: VOTO-02, VOTO-03, VOTO-04, BENS-02, CEAP-05

**Done when**:

- [x] PSD não casa PSDB; federação e bloco truncado casam
- [x] Alinhamento conta só Sim/Não × Sim/Não
- [x] Gate quick passa

**Tests**: unit
**Gate**: quick

---

### T5: Parser de robots.txt

**What**: Grupos por agente, regra mais longa, curingas, `Crawl-delay`.
**Where**: `src/ingest/robots.ts`
**Depends on**: T4
**Requirement**: COLETA-02

**Done when**:

- [x] Casos de grupo específico, `*`, `$` e empate cobertos
- [x] Gate quick passa

**Tests**: unit
**Gate**: quick

---

### T6: Cliente HTTP educado

**What**: User-Agent, robots por host, intervalo mínimo, backoff 429/5xx, parada em 401/403, download com SHA-256.
**Where**: `src/ingest/http.ts`
**Depends on**: None
**Reuses**: `parseRobots` (T5, fase anterior)
**Requirement**: COLETA-01, COLETA-03, COLETA-04, COLETA-05, COLETA-06

**Done when**:

- [x] Testes com `fetch` e `dormir` falsos cobrem cada regra
- [x] Gate quick passa

**Tests**: unit
**Gate**: quick

---

### T7: Ingestão da Câmara

**What**: Deputados, órgãos, CEAP e votações, com substituição por ano em transação.
**Where**: `src/ingest/camara.ts`
**Depends on**: T6
**Requirement**: PRIV-03, COLETA-07, COLETA-08, PROV-01

**Done when**:

- [x] `linhaCeap` descarta passageiro e CPF do parlamentar
- [x] `montarVotacoes` guarda só nominais e deduplica
- [x] Coleta real: 648 deputados, 123.497 despesas, 159 votações
- [x] Gate quick passa

**Tests**: unit
**Gate**: quick

---

### T8: Ingestão do TSE

**What**: Casamento de candidaturas e bens (só tipo e valor).
**Where**: `src/ingest/tse.ts`
**Depends on**: T7
**Requirement**: BENS-03, BENS-04

**Done when**:

- [x] Homônimo ambíguo é descartado; descrição do bem não é gravada
- [x] Gate quick passa

**Tests**: unit
**Gate**: quick

---

### T9: Camada de leitura do perfil

**What**: `buscarParlamentares`, `perfilParlamentar` com CEAP, presença, alinhamento, bens e coletas.
**Where**: `src/data/perfil.ts`
**Depends on**: None
**Requirement**: BUSCA-01, BUSCA-02, CEAP-01, CEAP-02, CEAP-03, CEAP-04, VOTO-01

**Done when**:

- [x] Integração contra `auditaja_test` confere totais, presença e alinhamento
- [x] Gate full passa

**Tests**: integration
**Gate**: full

---

### T10: Seções do perfil

**What**: Gastos, votações (filtros), bens, lateral e nota de fonte em cada seção.
**Where**: `src/components/perfil/secoes.tsx`
**Depends on**: T9
**Requirement**: PROV-02, VOTO-05, VOTO-06, EDGE-02, EDGE-03, EDGE-04

**Done when**:

- [x] E2E vê máscara, nota de fonte e filtro de divergência; sem rolagem horizontal em 390 px
- [x] Gate full passa

**Tests**: e2e
**Gate**: full

---

### T11: Páginas de busca e perfil

**What**: `/parlamentares` e `/parlamentares/[id]` com indicadores, `notFound()` e rodapé R13.
**Where**: `src/app/parlamentares/[id]/page.tsx`
**Depends on**: T10
**Requirement**: BUSCA-03, PRIV-05, EDGE-01

**Done when**:

- [x] E2E: busca leva ao perfil; id inexistente mostra "Página não encontrada"
- [x] Gate full passa

**Tests**: e2e
**Gate**: full

---

### T12: Pedido de correção

**What**: Formulário com Server Action, validação Zod e seção pré-selecionada.
**Where**: `src/app/parlamentares/[id]/contestar/actions.ts`
**Depends on**: T11
**Requirement**: CORR-01, CORR-02, CORR-03

**Done when**:

- [x] E2E envia pedido e vê "Pedido recebido."
- [x] Gate full passa

**Tests**: e2e
**Gate**: full

---

### T13: Rodapé escuro

**What**: Rodapé com fundo `#15181E`, texto claro e links `#A9BEF5`, como no canvas.
**Where**: `src/components/rodape.tsx`
**Depends on**: None
**Requirement**: UI-02, PRIV-05

**Done when**:

- [x] E2E confere `background-color` `rgb(21, 24, 30)` e as linhas Controlador/Encarregado
- [x] Gate full passa

**Tests**: e2e
**Gate**: full

---

### T14: Menu com página ativa

**What**: Item ativo com `aria-current="page"` e sublinhado `#1F4FD1`; `usePathname` dentro de `<Suspense>` para o prerender.
**Where**: `src/components/nav-principal.tsx`
**Depends on**: T13
**Requirement**: NAV-01

**Done when**:

- [x] `pnpm build` passa (Suspense resolve o erro de prerender apontado pelo Verifier)
- [x] E2E confere `aria-current` e a cor da borda
- [x] Gate full passa

**Tests**: e2e
**Gate**: full

---

### T15: Testes do cliente HTTP

**What**: 401 e 403 sem nova tentativa; 5xx com backoff 2/4/8 s e limite de 4; Retry-After; robots em HTML e falha de rede; intervalo de 1 s e Crawl-delay de 5 s com faixa precisa.
**Where**: `tests/unit/http.test.ts`
**Depends on**: None
**Requirement**: COLETA-03, COLETA-04, COLETA-05, COLETA-06

**Done when**:

- [x] Mutantes M3, M5 e M10 da verificação nº 1 seriam mortos
- [x] Gate quick passa

**Tests**: unit
**Gate**: quick

---

### T16: Testes de métricas e transformações

**What**: Federação antes de bloco; bloco quando não há partido nem federação; orientação duplicada no lote.
**Where**: `tests/unit/metrics.test.ts`
**Depends on**: T15
**Requirement**: VOTO-02, COLETA-08

**Done when**:

- [x] Mutante M6 seria morto (`tests/unit/transformacoes.test.ts` com orientação repetida)
- [x] Gate quick passa

**Tests**: unit
**Gate**: quick

---

### T17: Integração do perfil, busca e pedido de correção

**What**: Fallback de ano, limite de 8 fornecedores, teto nulo, totais de bens, busca por nome civil, só em exercício, `_` literal, `enviarPedido` (curto, válido com status, acima de 4000).
**Where**: `tests/integracao/perfil.test.ts`
**Depends on**: T16
**Requirement**: CEAP-03, CEAP-04, CEAP-05, BENS-01, BUSCA-01, BUSCA-02, CORR-01, CORR-02

**Done when**:

- [x] Mutantes M8 e M9 seriam mortos
- [x] Gate full passa

**Tests**: integration
**Gate**: full

---

### T18: Integração da coleta da CEAP de ponta a ponta

**What**: Zip falso servido ao `ClienteEducado` → `coletarCeap` duas vezes no mesmo ano; confere o lote em `coleta`, `coleta_id`, máscara e descarte de passageiro e CPF do parlamentar; teste do guarda do seed.
**Where**: `tests/integracao/coleta.test.ts`
**Depends on**: T17
**Requirement**: PROV-01, COLETA-07, PRIV-01, PRIV-02, PRIV-03, EDGE-05

**Done when**:

- [x] A máscara é provada a partir do CPF bruto (substitui as asserções tautológicas sobre o seed)
- [x] `tests/unit/seed-guard.test.ts` confere saída 1 e "Seed recusado"
- [x] Gate full passa

**Tests**: integration
**Gate**: full

---

### T19: E2E das seções, filtros e casos de borda

**What**: Nota de fonte com data e link nas três seções; "Votou: sem registro" e filtro de ausências; seção pré-selecionada no Contestar; João sem dados; `/parlamentares/abc`; projeto Playwright em 390×844; órgãos, menu, metodologia e rodapé.
**Where**: `tests/e2e/perfil.spec.ts`
**Depends on**: T18
**Requirement**: PROV-02, VOTO-06, VOTO-07, CORR-03, EDGE-01, EDGE-02, EDGE-03, EDGE-04, MAND-01, METOD-01

**Done when**:

- [x] 28 testes e2e passam (14 × desktop e 390 px)
- [x] Gate full passa

**Tests**: e2e
**Gate**: full

---

### T20: Casca estática e Suspense nas páginas com dados

**What**: Páginas de parlamentares, perfil, contestação e fontes passam a ter componente síncrono e a parte com dados em `<Suspense>` com esqueleto (aviso "uncached data during a navigation" do Next).
**Where**: `src/app/parlamentares/[id]/page.tsx`
**Depends on**: None
**Reuses**: `src/components/esqueleto.tsx`
**Requirement**: UI-03

**Done when**:

- [x] `tests/unit/paginas.test.ts` confere que as 4 páginas exportam componente síncrono
- [x] Build lista as 4 rotas como ◐ (Partial Prerender) e o aviso some no dev
- [x] Gate full passa

**Tests**: unit
**Gate**: full

---

### T21: Busca por nome ou UF

**What**: `ufDaBusca` e filtro por UF na busca; placeholders do topo e da página de parlamentares.
**Where**: `src/data/perfil.ts`
**Depends on**: T20
**Requirement**: BUSCA-04, BUSCA-05

**Done when**:

- [x] Integração: "sp" e "RJ" trazem os deputados da UF; "maria" e "XX" não viram UF
- [x] E2E: placeholders e busca "rj" pelo topo
- [x] Gate full passa

**Tests**: integration
**Gate**: full

---

### T22: Testes das lacunas da verificação nº 2

**What**: Partido antes de federação listada antes; voto vazio no seed; robots em HTML com `Disallow: /`; menu ativo em `/parlamentares` e `/metodologia` com largura 2 px; órgão encerrado no seed; recoleta que falha no meio; "—" no indicador de bens.
**Where**: `tests/e2e/perfil.spec.ts`
**Depends on**: T21
**Requirement**: VOTO-01, VOTO-02, COLETA-03, NAV-01, MAND-01, COLETA-07, EDGE-03

**Done when**:

- [x] Mutantes N1, N3, N5, N6, N7 e N9 da verificação nº 2 seriam mortos
- [x] 74 Vitest e 36 e2e passam
- [x] Gate full passa

**Tests**: e2e
**Gate**: full

---

### T23: Cursor dos botões

**What**: Regra global em `@layer base`: `cursor-pointer` em botões e `cursor-not-allowed` quando desabilitados; o `Button` do shadcn troca `pointer-events-none` por `cursor-not-allowed`.
**Where**: `src/app/globals.css`
**Depends on**: T22
**Requirement**: UI-04

**Done when**:

- [x] E2E confere `cursor` `pointer` e, com `disabled`, `not-allowed`
- [x] `src/components/ui/button.tsx` também alterado; ainda não tem uso nas telas, então só passa a ser coberto pelo e2e quando algum botão adotar o `Button` (achado cosmético da verificação nº 4, aceito)
- [x] Gate full passa

**Tests**: e2e
**Gate**: full

---

### T24: Teste de contenção do Suspense

**What**: O teste de UI-03 passa a exigir que todo componente assíncrono da página esteja dentro de `<Suspense>` e nenhum fora (lacuna da verificação nº 4, mutante V5).
**Where**: `tests/unit/paginas.test.ts`
**Depends on**: T23
**Requirement**: UI-03

**Done when**:

- [x] Mutante V5 (`<Suspense>{null}</Suspense>` com a tabela ao lado) é morto, conferido em worktree temporário
- [x] Gate quick passa

**Tests**: unit
**Gate**: quick

---

### T25: Ronda de acessibilidade

**What**: Foco visível de 2 px (branco no rodapé), reflow a 320 px no perfil (`min-w-0` nas colunas de gastos), rótulos distintos nas buscas (`landmark-unique`), erro do formulário ligado ao campo, divergência em texto para leitor de tela, `motion-reduce` no esqueleto, alvos maiores no menu de seções; varredura axe permanente.
**Where**: `tests/e2e/a11y.spec.ts`
**Depends on**: None
**Requirement**: A11Y-01, A11Y-02, A11Y-03, A11Y-04, A11Y-05, A11Y-06

**Done when**:

- [x] axe sem violações em 11 rotas, desktop e 390 px; e também com dados reais em 7 rotas
- [x] Borda dos campos de `#C9CCD2` (1,6:1) para `#80858E` (3,7:1)
- [x] 70 testes e2e passam
- [x] Relatório em `.specs/features/perfil-parlamentar/a11y.md`

**Tests**: e2e
**Gate**: full

---

### T28: Orientação de bloco pela composição da API

**What**: Coletor `pnpm ingest blocos` (API v2 `/blocos?idLegislatura=57` e `/blocos/{id}/partidos`, pelo `ClienteEducado`), tabelas `bloco` e `bloco_partido` (migração 0003) e identificação do bloco da orientação truncada pelo nome. PSDB, Cidadania, Republicanos, MDB e Podemos passam a receber a orientação do "Bl UniPpPsd...".
**Where**: `src/db/migrations/0003_blocos.ts`, `src/ingest/camara.ts`, `scripts/ingest.ts`, `src/lib/metrics.ts`, `src/data/perfil.ts`, `src/app/metodologia/page.tsx`
**Depends on**: None
**Requirement**: VOTO-02, VOTO-04, VOTO-08

**Done when**:

- [x] "Bl UniPpPsd..." vale para os 8 partidos do bloco 589 e não para PL ou Avante
- [x] Bloco 590 (API sem partidos) usa a lista do nome
- [x] Abreviação ambígua ou sem bloco cai na regra antiga
- [x] Metodologia 1.2 descreve a regra e o limite da composição atual
- [x] Gate full passa

**Tests**: unit, integration, e2e
**Gate**: full

---

### T26: Política de privacidade

**What**: Página `/privacidade` (LGPD) estática no estilo de `/metodologia`: controlador e encarregado, dados tratados (deputados, terceiros minimizados na gravação conforme AD-002, quem pede correção), finalidades e bases legais (art. 7º, IX, §§ 3º e 4º; art. 5º, II e art. 11), compartilhamento, retenção, direitos do art. 18, cookies (nenhum), segurança e data de atualização. Responsáveis extraídos para `responsavel()` e usados pelo rodapé e pela página; link "Política de privacidade" no rodapé, como no protótipo.
**Where**: `src/app/privacidade/page.tsx`, `src/lib/responsavel.ts`, `src/components/rodape.tsx`
**Depends on**: None
**Requirement**: PRIV-06, PRIV-07, A11Y-01, A11Y-02, UI-03

**Done when**:

- [x] E2E segue o link do rodapé até `/privacidade` e confere título, data de atualização, os mesmos controlador e encarregado e as seções de dados, direitos e cookies
- [x] Unit: `responsavel()` devolve placeholders sem variáveis e os valores quando definidas; `/metodologia` e `/privacidade` não têm componente assíncrono
- [x] axe sem violações em `/privacidade` (desktop e 390 px) e sem rolagem horizontal a 320 px; espaço vertical entre os links do rodapé quando quebram linha (`target-size`)
- [x] Gate full passa (74 testes e2e)

**Tests**: unit + e2e
**Gate**: full

---

### T27: Teto da CEAP por UF

**What**: Liga a comparação do gasto com o teto acumulado usando os 27 valores mensais de 2026 publicados na página oficial "Cota Parlamentar" da Câmara (reajuste do Ato da Mesa nº 244/2026). Teto só vale para 2026; outros anos ficam sem comparação.
**Where**: `src/data/teto-ceap.ts`, `src/data/perfil.ts`, `src/app/parlamentares/[id]/page.tsx`, `src/app/metodologia/page.tsx`
**Depends on**: None
**Requirement**: CEAP-05, CEAP-06

**Done when**:

- [x] 27 UFs com valor conferido; DF R$ 41.612,55 e RR R$ 58.474,70 batem com os valores de 2026 noticiados
- [x] Metodologia 1.3 cita a fonte, o ato, a data de conferência e a aproximação de jan–fev
- [x] Perfil do seed (SP, até março) mostra "30% do teto acumulado até mar"
- [x] Gate full passa

**Tests**: unit, integration, e2e
**Gate**: full

---

## Phase Execution Map

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6 → Phase 7 → Phase 8 → Phase 9

Phase 1:  T1 ------→ T2
Phase 2:  T3 ------→ T4 ------→ T5
Phase 3:  T6 ------→ T7 ------→ T8
Phase 4:  T9 ------→ T10 -----→ T11 -----→ T12
Phase 5:  T13 -----→ T14
Phase 6:  T15 -----→ T16 -----→ T17 -----→ T18 -----→ T19
Phase 7:  T20 -----→ T21 -----→ T22 -----→ T23 -----→ T24
Phase 8:  T25
Phase 9:  T26
```

---

## Task Granularity Check

| Task | Scope | Status |
| ---- | ----- | ------ |
| T1 | 1 migração (+ tipos) | ✅ Granular |
| T2 | 1 seed | ✅ Granular |
| T3 | 1 módulo de funções puras | ✅ Granular |
| T4 | 1 módulo de funções puras | ✅ Granular |
| T5 | 1 parser | ✅ Granular |
| T6 | 1 classe | ✅ Granular |
| T7 | 1 módulo de ingestão | ⚠️ Coeso: 4 coletores no mesmo arquivo |
| T8 | 1 módulo de ingestão | ✅ Granular |
| T9 | 1 módulo de leitura | ✅ Granular |
| T10 | 1 arquivo de seções | ⚠️ Coeso: 4 seções irmãs |
| T11 | 2 páginas | ⚠️ Coeso: busca e perfil |
| T12 | 1 action + formulário | ✅ Granular |
| T13 | 1 componente | ✅ Granular |
| T14 | 1 componente (+ Suspense no topo) | ✅ Granular |
| T15 | 1 arquivo de teste | ✅ Granular |
| T16 | 1 arquivo de teste (+ 1 caso em transformações) | ⚠️ Coeso |
| T17 | 1 arquivo de teste | ✅ Granular |
| T18 | 1 arquivo de teste (+ guarda do seed) | ⚠️ Coeso |
| T19 | 1 arquivo de teste (+ viewport no config) | ⚠️ Coeso |
| T20 | 4 páginas, mesmo padrão | ⚠️ Coeso: mudança mecânica idêntica |
| T21 | 1 função + 2 placeholders | ✅ Granular |
| T22 | testes em 6 arquivos + seed | ⚠️ Coeso: lista de lacunas de uma verificação |
| T23 | 1 regra CSS (+ variante do Button) | ✅ Granular |
| T24 | 1 arquivo de teste | ✅ Granular |
| T25 | ajustes pequenos em 8 arquivos + 1 suíte | ⚠️ Coeso: achados de uma auditoria |
| T26 | 1 página + 1 helper (+ link no rodapé) | ⚠️ Coeso: página e link no mesmo fluxo |

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| ---- | ---------------------- | ------------- | ------ |
| T1 | None | - | ✅ Match |
| T2 | T1 | T1 → T2 | ✅ Match |
| T3 | None | - | ✅ Match |
| T4 | T3 | T3 → T4 | ✅ Match |
| T5 | T4 | T4 → T5 | ✅ Match |
| T6 | None (T5 vem da fase anterior) | - | ✅ Match |
| T7 | T6 | T6 → T7 | ✅ Match |
| T8 | T7 | T7 → T8 | ✅ Match |
| T9 | None | - | ✅ Match |
| T10 | T9 | T9 → T10 | ✅ Match |
| T11 | T10 | T10 → T11 | ✅ Match |
| T12 | T11 | T11 → T12 | ✅ Match |
| T13 | None | - | ✅ Match |
| T14 | T13 | T13 → T14 | ✅ Match |
| T15 | None | - | ✅ Match |
| T16 | T15 | T15 → T16 | ✅ Match |
| T17 | T16 | T16 → T17 | ✅ Match |
| T18 | T17 | T17 → T18 | ✅ Match |
| T19 | T18 | T18 → T19 | ✅ Match |
| T20 | None | - | ✅ Match |
| T21 | T20 | T20 → T21 | ✅ Match |
| T22 | T21 | T21 → T22 | ✅ Match |
| T23 | T22 | T22 → T23 | ✅ Match |
| T24 | T23 | T23 → T24 | ✅ Match |
| T25 | None | - | ✅ Match |
| T26 | None | - | ✅ Match |

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| ---- | --------------------------- | --------------- | --------- | ------ |
| T1 | Esquema | none | none | ✅ OK |
| T2 | Config (seed) | none | none | ✅ OK |
| T3 | Regras puras | unit | unit | ✅ OK |
| T4 | Regras puras | unit | unit | ✅ OK |
| T5 | Regras puras | unit | unit | ✅ OK |
| T6 | Cliente HTTP | unit | unit | ✅ OK |
| T7 | Transformações | unit | unit | ✅ OK |
| T8 | Transformações | unit | unit | ✅ OK |
| T9 | Camada de leitura | integration | integration | ✅ OK |
| T10 | Páginas | e2e | e2e | ✅ OK |
| T11 | Páginas | e2e | e2e | ✅ OK |
| T12 | Server Action | e2e | e2e | ✅ OK |
| T13 | Páginas (layout) | e2e | e2e | ✅ OK |
| T14 | Páginas (layout) | e2e | e2e | ✅ OK |
| T15 | Testes do cliente HTTP | unit | unit | ✅ OK |
| T16 | Testes de regras puras | unit | unit | ✅ OK |
| T17 | Testes da camada de leitura | integration | integration | ✅ OK |
| T18 | Testes de ingestão | integration | integration | ✅ OK |
| T19 | Testes de páginas | e2e | e2e | ✅ OK |
| T20 | Páginas | e2e | unit (estrutura) + e2e existentes | ✅ OK |
| T21 | Camada de leitura + páginas | integration | integration + e2e | ✅ OK |
| T22 | Testes | e2e | e2e + integration + unit | ✅ OK |
| T23 | Estilo global | e2e | e2e | ✅ OK |
| T24 | Teste de estrutura de páginas | unit | unit | ✅ OK |
| T25 | Páginas e estilos | e2e | e2e | ✅ OK |
| T26 | Página + helper puro | e2e + unit | unit + e2e | ✅ OK |

---

### T29: Paridade com o protótipo aprovado

**What**: Rubrica auditável de paridade (`paridade/rubrica.md`, 93 itens de visual, layout desktop e celular, conteúdo e comportamento) e verificações independentes e adversariais (`paridade/verificacao-N.md`) até ≥ 95%. Tokens do protótipo (bordas, raios, cores de gráfico), cabeçalho do perfil em cartão único com foto retangular e indicadores, abas de seção que acompanham a rolagem, topo do celular com "Buscar" e "Menu", resumo do celular, "Mandato todo", "Baixar CSV", feed Atom para "Acompanhar atualizações", linha do tempo e "De onde vêm os dados" na lateral, página Sobre. Migração 0004: `parlamentar.sexo` (deputados.csv) e proposição principal da votação (votacoesObjetos).
**Where**: `src/app/parlamentares/[id]/**`, `src/components/perfil/*`, `src/components/topo*.tsx`, `src/components/rodape.tsx`, `src/lib/rotulos.ts`, `src/data/perfil.ts`, `src/ingest/camara.ts`, `src/db/migrations/0004_paridade.ts`, `src/app/sobre/page.tsx`
**Depends on**: None
**Requirement**: PAR-01 a PAR-08, CEAP-03

**Done when**:

- [x] Verificador independente mede ≥ 95% na rubrica (verificação 5: 96,8%), com as divergências intencionais listadas à parte
- [x] Unit: rótulos por extenso, sexo do deputados.csv, proposição principal citada na descrição
- [x] E2E: Baixar CSV (CPF mascarado), feed Atom, abas até Mandato e Fontes, Mandato todo, resumo do celular, topo do celular
- [x] Gate full passa (lint, typecheck, 113 unit e integração, build, 90 e2e e 4 pulados por tamanho de tela)

**Tests**: unit, integration, e2e
**Gate**: full
