# Emendas parlamentares e sanções Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: `.specs/features/emendas-transparencia/design.md`
**Status**: In Progress

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec. Guidelines found: `AGENTS.md`, `vitest.config.mts`, `playwright.config.ts`, `.specs/LESSONS.md` (candidatos L-001..L-008 aplicados como cuidado).

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Funções puras (`src/lib`) | unit | Todos os ramos; 1:1 com os ACs | `tests/unit/*.test.ts` | `pnpm test` |
| Coletores (`src/ingest`) | integration | ZIP de fixture → banco de teste; cada regra de filtro e de máscara com fixture própria | `tests/integracao/*.test.ts` | `TEST_DATABASE_URL=… pnpm test` |
| Leitura (`src/data`) | integration | Cada agregação e cada período; seed acima dos limites (top 5) | `tests/integracao/*.test.ts` | idem |
| Páginas e rotas (`src/app`, `src/components`) | e2e | Caminho feliz, vazio, período inválido, 320 px, axe | `tests/e2e/*.spec.ts` | `pnpm test:e2e` |
| Esquema / seed | none | build gate | - | build gate |

## Gate Check Commands

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | Só testes unitários | `pnpm test tests/unit` |
| Full | Integração ou e2e | `TEST_DATABASE_URL=postgres://auditaja:auditaja@127.0.0.1:5436/auditaja_emendas_test pnpm test && pnpm build && TEST_DATABASE_URL=… pnpm test:e2e` |
| Build | Fim de fase ou tarefa sem teste | `pnpm typecheck && pnpm lint && pnpm build && pnpm test` |

---

## Execution Plan

### Phase 1: Dados

```
T1 → T2 → T3 → T4
```

### Phase 2: Tela

```
T5 → T6 → T7 → T8
```

---

## Task Breakdown

### T1: Esquema das emendas e sanções

**What**: Migração `0007_emendas` com `emenda`, `emenda_favorecido` e `sancao`, tipos Kysely e limpeza no seed.
**Where**: `src/db/migrations/0007_emendas.ts`
**Depends on**: None
**Reuses**: padrão de `0003_blocos.ts`
**Requirement**: EMD-03

**Done when**:

- [x] Migração registrada em `src/db/migrate.ts` e tipos em `src/db/types.ts`
- [x] `semear` limpa as três tabelas antes de `parlamentar`
- [x] Build gate passa

**Tests**: none
**Gate**: build

---

### T2: Funções puras de emendas

**What**: `valorBr`, `rotuloLocalidade`, `favorecidoPublicavel`, `indiceDeAutores`, `ehTransferenciaEspecial`, `periodoEmendas`.
**Where**: `src/lib/emendas.ts`
**Depends on**: T1
**Reuses**: `normalizarNome`, `formatarCnpj`
**Requirement**: EMD-04, EMD-05, EMD-06, EMD-08, EMD-09, EMDUI-14, EDGE-03

**Done when**:

- [x] Um teste por AC citado, com valor exato da spec
- [x] Quick gate passa

**Tests**: unit
**Gate**: quick

---

### T3: Coletor de emendas

**What**: `coletarEmendas` e `abrirCsvDoZip` (streaming), com comando `pnpm ingest emendas`.
**Where**: `src/ingest/transparencia.ts`
**Depends on**: T2
**Reuses**: `ClienteEducado.baixar`, `registrarColeta`, `inserirEmBlocos`
**Requirement**: EMD-01, EMD-02, EMD-03, EMD-04, EMD-05, EMD-07, EMD-08, EMD-09, EMD-10, EMD-11, EDGE-01, EDGE-03

**Done when**:

- [x] ZIP de fixture latin1 com homônimo, autor sem casamento, bancada, ano 2023, PF, CNPJ e "Sem informação"
- [x] Segunda execução não duplica linhas
- [x] 403 não grava nada
- [x] Full gate passa

**Tests**: integration
**Gate**: full

---

### T4: Coletor de sanções

**What**: `coletarSancoes` (CEIS e CNEP, recuo de até 7 dias) e comando `pnpm ingest sancoes`.
**Where**: `src/ingest/transparencia.ts`
**Depends on**: T3
**Reuses**: `abrirCsvDoZip`, `dataBrParaIso`
**Requirement**: SAN-01, SAN-02, SAN-03, EDGE-02

**Done when**:

- [x] Fixture com sanção PF, PJ fora da CEAP, PJ na CEAP e arquivo só de ontem
- [x] Sem arquivo em 7 dias não apaga sanções antigas
- [x] Full gate passa

**Tests**: integration
**Gate**: full

---

### T5: Leitura das emendas e sanções

**What**: `emendasDoParlamentar` e `sancoesDosFornecedores`, com seed fictício de emendas, favorecidos e uma sanção.
**Where**: `src/data/emendas.ts`
**Depends on**: None
**Reuses**: `getDb`, seed existente
**Requirement**: EMDUI-03, EMDUI-04, EMDUI-05, EMDUI-06, EMDUI-07, EMDUI-09, EMDUI-10, EMDUI-11, SAN-05, EDGE-04

**Done when**:

- [x] Seed com 6+ áreas, 6+ locais e 6+ favorecidos (passa do limite de 5)
- [x] Totais por período conferidos com valores exatos
- [x] Full gate passa

**Tests**: integration
**Gate**: full

---

### T6: Seção de emendas no perfil

**What**: `SecaoEmendas`, aba "Emendas" e inserção na página.
**Where**: `src/components/perfil/secao-emendas.tsx`
**Depends on**: T5
**Reuses**: `Indicador`, `Fonte`, estilos do perfil
**Requirement**: EMDUI-01, EMDUI-02, EMDUI-03, EMDUI-04, EMDUI-08, EMDUI-12, EMDUI-13, EMDUI-14, EDGE-05

**Done when**:

- [x] e2e: valores do seed, troca de ano, vazio, período inválido, 320 px, axe
- [x] Full gate passa

**Tests**: e2e
**Gate**: full

---

### T7: Selo e aviso de sanção nos fornecedores

**What**: Prop `sancoes` em `SecaoGastos`, selo e aviso factual.
**Where**: `src/components/perfil/secoes.tsx`
**Depends on**: T6
**Reuses**: estilo do aviso existente
**Requirement**: SAN-04, SAN-05, SAN-06, SAN-07

**Done when**:

- [ ] e2e: selo, título, período (com e sem data final), contagem de notas, frase de ressalva
- [ ] Full gate passa

**Tests**: e2e
**Gate**: full

---

### T8: CSV, metodologia e fontes

**What**: Rota `emendas.csv`, seções da metodologia, versão 1.4, fontes e bloco lateral.
**Where**: `src/app/parlamentares/[id]/emendas.csv/route.ts`
**Depends on**: T7
**Reuses**: `gastos.csv/route.ts`
**Requirement**: EMDUI-15, MET-01, MET-02, MET-03, MET-04, MET-05

**Done when**:

- [ ] e2e: CSV com cabeçalho e linhas do período; textos da metodologia e da lateral
- [ ] Build gate e full gate passam

**Tests**: e2e
**Gate**: full

---

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| ---- | ---------------------- | ------------- | ------ |
| T1 | None | início da fase 1 | ✅ Match |
| T2 | T1 | T1 → T2 | ✅ Match |
| T3 | T2 | T2 → T3 | ✅ Match |
| T4 | T3 | T3 → T4 | ✅ Match |
| T5 | None (fase 1 completa) | início da fase 2 | ✅ Match |
| T6 | T5 | T5 → T6 | ✅ Match |
| T7 | T6 | T6 → T7 | ✅ Match |
| T8 | T7 | T7 → T8 | ✅ Match |

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| ---- | --------------------------- | --------------- | --------- | ------ |
| T1 | Esquema / seed | none | none | ✅ OK |
| T2 | Funções puras | unit | unit | ✅ OK |
| T3 | Coletor | integration | integration | ✅ OK |
| T4 | Coletor | integration | integration | ✅ OK |
| T5 | Leitura | integration | integration | ✅ OK |
| T6 | Página / componente | e2e | e2e | ✅ OK |
| T7 | Componente | e2e | e2e | ✅ OK |
| T8 | Rota / página | e2e | e2e | ✅ OK |
