# Perfil do deputado federal Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: `.specs/features/perfil-parlamentar/design.md`
**Status**: Done (retroativo)

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

## Phase Execution Map

```
Phase 1 → Phase 2 → Phase 3 → Phase 4

Phase 1:  T1 ------→ T2
Phase 2:  T3 ------→ T4 ------→ T5
Phase 3:  T6 ------→ T7 ------→ T8
Phase 4:  T9 ------→ T10 -----→ T11 -----→ T12
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
