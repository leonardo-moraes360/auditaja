# Perfil do senador Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: `.specs/features/perfil-senador/design.md`
**Status**: In Progress (correções da verificação nº 2)

---

## Test Coverage Matrix

> Mesma matriz do perfil do deputado (`AGENTS.md`, `vitest.config.mts`, `playwright.config.ts`).

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Regras puras (`src/lib/senado.ts`) | unit | Todos os ramos; 1:1 com ACs | `tests/unit/senado.test.ts` | `pnpm test` |
| Transformações de ingestão do Senado | unit (respostas gravadas) | Cada AC de coleta, R3 e deduplicação | `tests/unit/senado-ingest.test.ts` | `pnpm test` |
| Camada de leitura | integration (Postgres) | Ramo do Senado e não regressão do deputado | `tests/integracao/*.test.ts` | `pnpm test` |
| Páginas | e2e + axe | Perfil e lista do senador | `tests/e2e/*.spec.ts` | `pnpm build && pnpm test:e2e` |
| Esquema, migrações | none | build gate only | - | `pnpm typecheck` |

## Gate Check Commands

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

### Phase 2: Coleta

```
T3 → T4 → T5 → T6
```

### Phase 3: Leitura

```
T7 → T8
```

### Phase 4: Tela

```
T9 → T10 → T11 → T12
```

### Phase 5: Correções da verificação nº 1

```
T13 → T14 → T15
```

### Phase 6: Correções da verificação nº 2

```
T16
```

---

## Task Breakdown

### T1: Migração e tipos do Senado

**What**: Migração `0005_senado` (casa `senado`, colunas de mandato, tabela `suplente`, `votacao.secreta`) e tipos Kysely.
**Where**: `src/db/migrations/0005_senado.ts`, `src/db/migrate.ts`, `src/db/types.ts`
**Depends on**: None
**Reuses**: `src/db/migrations/0004_paridade.ts`
**Requirement**: SCAD-03

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Migração sobe e desce no banco de teste
- [x] `pnpm typecheck` sem erros

**Tests**: none
**Gate**: build

---

### T2: Regras puras do Senado

**What**: `src/lib/senado.ts` com id, lista única, sexo, orientação, liderança, classificação de voto, presença e rótulos de voto.
**Where**: `src/lib/senado.ts`, `tests/unit/senado.test.ts`
**Depends on**: T1
**Reuses**: `src/lib/metrics.ts` (`alinhamento`)
**Requirement**: SCAD-01, SCAD-04, SVOT-03, SVOT-06, SVOT-07, SPRES-01, SPRES-02, SPRES-03, SALI-01, SALI-02, SALI-03, SERR-02

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Cada sigla de SPRES-01/02 tem caso de teste
- [x] Gate quick passa

**Tests**: unit
**Gate**: quick

---

### T3: Coleta do cadastro de senadores

**What**: `montarSenadores`, `montarSuplentes`, `montarComissoes` e `coletarSenadores` com respostas gravadas.
**Where**: `src/ingest/senado.ts`, `src/ingest/coleta.ts`, `tests/unit/senado-ingest.test.ts`, `tests/fixtures/senado/`
**Depends on**: None (fase anterior concluída)
**Reuses**: `src/ingest/camara.ts` (`coletarDeputados`), `registrarColeta`
**Requirement**: SCAD-01, SCAD-02, SCAD-03, SCAD-04, SCAD-05, SCAD-06, SERR-01

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Senador 5672 da resposta gravada vira id 10005672 com 2 suplentes
- [x] Gate quick passa

**Tests**: unit
**Gate**: quick

---

### T4: Coleta da CEAPS

**What**: `montarDespesasCeaps` e `coletarCeaps` (API administrativa, um ano por requisição).
**Where**: `src/ingest/senado.ts`, `tests/unit/senado-ingest.test.ts`
**Depends on**: T3
**Reuses**: `src/lib/privacy.ts`
**Requirement**: SCEAPS-01, SCEAPS-02, SCEAPS-03, SCEAPS-04, SCEAPS-07

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] CPF de fornecedor nunca sai completo
- [x] Gate quick passa

**Tests**: unit
**Gate**: quick

---

### T5: Coleta de votações e orientações do Senado

**What**: `montarVotacoesSenado`, `montarOrientacoesSenado` e `coletarVotacoesSenado` (2 requisições por ano).
**Where**: `src/ingest/senado.ts`, `tests/unit/senado-ingest.test.ts`
**Depends on**: T4
**Reuses**: `src/ingest/camara.ts` (`coletarVotacoes`)
**Requirement**: SVOT-01, SVOT-02, SVOT-03, SVOT-04

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] PEC 221/2019 de 14/10/2026 vira `SF-4420` com orientação do PT
- [x] Gate quick passa

**Tests**: unit
**Gate**: quick

---

### T6: Comandos de coleta e seed do senador fictício

**What**: Comandos `senadores`, `ceaps`, `votacoes-senado` e `senado` em `scripts/ingest.ts`; senador fictício no seed.
**Where**: `scripts/ingest.ts`, `src/db/seed.ts`, `tests/integracao/coleta.test.ts`
**Depends on**: T5
**Reuses**: `src/db/seed.ts`
**Requirement**: SCAD-06, SCEAPS-07, SBENS-01

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Coleta rodada duas vezes no banco de teste mantém as contagens e não altera deputados
- [x] Gate full passa

**Tests**: integration
**Gate**: full

---

### T7: Leitura do perfil do senador

**What**: Ramo do Senado em `perfilParlamentar` (presença, média do Senado, alinhamento com a liderança, CEAPS sem teto e média mensal, mandato e suplentes).
**Where**: `src/data/perfil.ts`, `tests/integracao/perfil.test.ts`
**Depends on**: None (fase anterior concluída)
**Reuses**: `src/lib/senado.ts`, `src/lib/metrics.ts`
**Requirement**: SCEAPS-05, SCEAPS-06, SVOT-05, SPRES-03, SPRES-04, SALI-02, SBENS-02, SERR-03, SERR-04

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Testes do deputado seguem passando sem mudança
- [x] Gate full passa

**Tests**: integration
**Gate**: full

---

### T8: Busca e contagem por casa

**What**: Filtro `casa` em `buscarParlamentares`, `contarPorCasa()` e casa no resultado da busca.
**Where**: `src/data/perfil.ts`, `tests/integracao/perfil.test.ts`
**Depends on**: T7
**Reuses**: `buscarParlamentares`
**Requirement**: SUI-06, SUI-09

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `casa=senado` só devolve senadores
- [x] Gate full passa

**Tests**: integration
**Gate**: full

---

### T9: Perfil do senador na tela

**What**: Trilha, cabeçalho, selos, CEAPS sem teto, votações com voto secreto e motivo da ausência, bloco Mandato com suplentes, fontes do Senado.
**Where**: `src/app/parlamentares/[id]/page.tsx`, `src/components/perfil/secoes.tsx`, `src/components/perfil/abas.tsx`, `src/lib/rotulos.ts`, `tests/e2e/senador.spec.ts`
**Depends on**: None (fase anterior concluída)
**Reuses**: `src/components/perfil/*`
**Requirement**: SUI-01, SUI-02, SUI-03, SUI-04, SUI-05, SUI-10, SCEAPS-05, SCEAPS-06, SVOT-06, SVOT-07, SVOT-08, SBENS-02

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] e2e do senador passa e o e2e do deputado não muda
- [x] Gate full passa

**Tests**: e2e
**Gate**: full

---

### T10: Lista com Câmara e Senado

**What**: Filtros por casa com contagem, cartão com cargo e placeholder novo da busca do topo.
**Where**: `src/app/parlamentares/page.tsx`, `src/components/topo.tsx`, `src/components/topo-movel.tsx`, `tests/e2e/senador.spec.ts`
**Depends on**: T9
**Reuses**: `src/app/parlamentares/page.tsx`
**Requirement**: SUI-06, SUI-07, SUI-08, SUI-09

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] e2e da lista passa
- [x] Gate full passa

**Tests**: e2e
**Gate**: full

---

### T11: Metodologia e fontes do Senado

**What**: Seção do Senado em `/metodologia` (presença, alinhamento, CEAPS) e fontes do Senado em `/fontes`.
**Where**: `src/app/metodologia/page.tsx`, `src/app/fontes/page.tsx`, `tests/e2e/senador.spec.ts`
**Depends on**: T10
**Reuses**: páginas existentes
**Requirement**: SUI-11

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] e2e confere os textos das regras
- [x] Gate full passa

**Tests**: e2e
**Gate**: full

---

### T12: Acessibilidade e coleta real

**What**: axe nas páginas do senador; coleta real do Senado no banco de desenvolvimento conferida à mão (contagens e um perfil real).
**Where**: `tests/e2e/a11y.spec.ts`
**Depends on**: T11
**Reuses**: `tests/e2e/a11y.spec.ts`
**Requirement**: SUI-10, SVOT-04

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] axe sem violações no perfil e na lista do senador
- [x] Gate build passa

**Tests**: e2e
**Gate**: build

---

### T13: Proveniência por resposta, proteção entre Casas e R3 de borda

**What**: Uma linha em `coleta` por resposta do Senado; teste de que as coletas da Câmara não tocam o Senado; nota da CEAPS sem CNPJ válido sem nome nem documento; nascimento lido do detalhe por função testada.
**Where**: `src/ingest/senado.ts`, `tests/integracao/coleta-senado.test.ts`, `tests/unit/senado-ingest.test.ts`
**Depends on**: None (fase anterior concluída)
**Reuses**: `registrarColeta`
**Requirement**: SCAD-04, SCAD-05, SCEAPS-02, SCEAPS-07

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Mutantes M04 e M11 da verificação nº 1 morrem
- [x] Gate quick passa

**Tests**: integration
**Gate**: quick

---

### T14: Paridade com os artboards do Senado

**What**: Corrige os FAIL de paridade da verificação nº 1 que não são divergência intencional: Mandato compacto antes de Bens no celular, 6 votações no resumo, comissão com nome curto e sigla, textos de correção, rótulos curtos do celular, linha do tempo do senador, partido do dia do voto, `{código}` literal, lista no layout do artboard e sem limite de 60 no Senado.
**Where**: `src/components/perfil/secoes.tsx`, `src/app/parlamentares/[id]/page.tsx`, `src/app/parlamentares/page.tsx`, `src/data/perfil.ts`, `tests/e2e/senador.spec.ts`
**Depends on**: T13
**Reuses**: componentes do perfil
**Requirement**: SUI-04, SUI-06, SUI-07, SVOT-06

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] e2e do senador e do deputado passam
- [x] Gate full passa

**Tests**: e2e
**Gate**: full

---

### T15: Lacunas de teste da verificação nº 1

**What**: Orientação em votação secreta no seed (SALI-02), senador fora de exercício com votos (SPRES-04), senador sem votos nem notas (SERR-03, SERR-04), nota dos 8 anos (SBENS-02) e UF no bloco Mandato (SUI-04), com asserções.
**Where**: `src/db/seed.ts`, `tests/integracao/perfil-senador.test.ts`, `tests/e2e/senador.spec.ts`
**Depends on**: T14
**Reuses**: `src/db/seed.ts`
**Requirement**: SALI-02, SPRES-04, SERR-03, SERR-04, SBENS-02, SUI-04

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Mutantes M02 e M12 da verificação nº 1 morrem
- [x] Gate full passa

**Tests**: e2e
**Gate**: full

---

### T16: CPF em razão social de MEI e lacunas da verificação nº 2

**What**: Mascarar CPF solto no nome do fornecedor (Câmara e Senado); testes de nascimento no banco (SCAD-04), coleta de órgãos da Câmara sem tocar comissões de senadores, partido do dia no rótulo da liderança; suplente com ordinal pelo sexo cadastrado; ordem do celular (Mandato antes de Bens); espaçamento da marca; texto completo de "Sem votações registradas" no celular.
**Where**: `src/lib/privacy.ts`, `src/data/perfil.ts`, `src/components/perfil/secoes.tsx`, `src/app/parlamentares/[id]/page.tsx`, `src/components/topo.tsx`, `src/db/seed.ts`, testes
**Depends on**: None (fase anterior concluída)
**Reuses**: `mascararCpf`
**Requirement**: SCEAPS-02, SCAD-04, SUI-04, SVOT-08, SERR-03

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Nenhum CPF de 11 dígitos sobra no nome do fornecedor
- [x] Gate full passa

**Tests**: e2e
**Gate**: full
