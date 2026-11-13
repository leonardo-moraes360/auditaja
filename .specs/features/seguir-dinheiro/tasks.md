# Seguir o dinheiro das emendas Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: `.specs/features/seguir-dinheiro/design.md`
**Status**: Approved (usuário, 2026-11-12 23:08; implementação só depois do merge da branch `claude/project-thread-cop38e`, em worktree própria)

**Reservas**: migração `0012_trilha`, `METODOLOGIA_VERSAO` 1.11, e2e `E2E_PORT=3405`, banco `auditaja_trilha_test`.

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec - confirm before Execute. Guidelines found: `AGENTS.md`, `vitest.config.mts`, `playwright.config.ts`, `.specs/LESSONS.md` (candidatos L-002 a L-008 aplicados como cuidado: fixture que dispara e outra logo abaixo do limiar; cada ramo de status HTTP; seed acima de cada limite; mensagem exata de vazio e erro).

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Funções puras (`src/lib`) | unit | Todos os ramos; 1:1 com os ACs; limiar em 179 e 180 dias; cada disjunção com caso próprio | `tests/unit/*.test.ts` | `pnpm test tests/unit` |
| Coletores e importador (`src/ingest`) | integration | Fixture → banco de teste; cada regra de filtro, máscara e descarte com fixture própria; cada status HTTP (200, 404, 429, 5xx) | `tests/integracao/*.test.ts` | `TEST_DATABASE_URL=postgres://auditaja:auditaja@127.0.0.1:5436/auditaja_trilha_test pnpm test tests/integracao` |
| Leitura (`src/data`) | integration | Cada agregação, período, vazio e taxa de base; seed acima dos limites | `tests/integracao/*.test.ts` | idem |
| Páginas, rotas e componentes (`src/app`, `src/components`) | e2e | Caminho feliz, vazio, erro, 320 px, axe, textos exatos da spec | `tests/e2e/*.spec.ts` | `pnpm build && TEST_DATABASE_URL=… E2E_PORT=3405 PW_CHROME=/usr/bin/google-chrome pnpm test:e2e` |
| Esquema, comandos de `scripts/`, fixtures | none | build gate | - | build gate |

## Gate Check Commands

> Generated from codebase - confirm before Execute.

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | Só testes unitários | `pnpm test tests/unit` |
| Full | Integração ou e2e | `TEST_DATABASE_URL=postgres://auditaja:auditaja@127.0.0.1:5436/auditaja_trilha_test pnpm test && pnpm build && TEST_DATABASE_URL=postgres://auditaja:auditaja@127.0.0.1:5436/auditaja_trilha_test E2E_PORT=3405 PW_CHROME=/usr/bin/google-chrome pnpm test:e2e` |
| Build | Fim de fase ou tarefa sem teste | `pnpm typecheck && pnpm lint && pnpm build && pnpm test` |

---

## Execution Plan

Phases are ordered and run sequentially - each phase completes before the next begins, and tasks within a phase execute in order.

### Phase 1: Esquema e regras

```
T1 → T2
```

### Phase 2: Coletas

```
T3 → T4 → T5 → T6 → T7 → T8 → T9
```

### Phase 3: Leitura e tela

```
T10 → T11 → T12 → T13 → T14
```


### Phase 4: Versão enxuta (aprovada em 13/11)

```
T15 → T16 → T17
```

---

## Task Breakdown

### T1: Esquema da trilha

**What**: Migração `0012_trilha` com `transf_plano`, `transf_pagamento`, `cnpj_abertura` e `campanha_despesa` (índices do design), registrada na lista de `src/db/migrate.ts`, tipos Kysely e limpeza no seed.
**Where**: `src/db/migrations/0012_trilha.ts`
**Depends on**: None
**Reuses**: padrão de `0007_emendas.ts`
**Requirement**: TRI-01, TRI-03, CNPJ-01, CNPJ-02, CICLO-01, CICLO-02

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Nenhuma coluna para banco, agência, conta, sócio, endereço, telefone, e-mail ou CPF
- [x] Migração em `src/db/migrate.ts` e tipos em `src/db/types.ts`
- [x] `semear` limpa as quatro tabelas antes de `parlamentar`
- [x] Build gate passa

**Tests**: none
**Status**: ✅ Done
**Gate**: build

---

### T2: Regras puras da trilha

**What**: `recemAberta`, `cicloFechado`, `taxaDeBase`, `recebedorPublicavel` e `DIAS_RECEM_ABERTA = 180`.
**Where**: `src/lib/trilha.ts`
**Depends on**: T1
**Reuses**: `soDigitos`, `formatarCnpj` (`src/lib/privacy.ts`); estilo de `src/lib/atipico.ts`
**Requirement**: CNPJ-03, CNPJ-04, CICLO-03, CICLO-04, LING-06, LING-07, TRI-07, EDGE-02, EDGE-05

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] 179 dias marca, 180 dias não marca (CNPJ-03, CNPJ-04)
- [x] Despesa de campanha com data depois do pagamento não fecha ciclo (LING-06)
- [x] CNPJ de campanha de outro parlamentar não fecha ciclo (CICLO-04)
- [x] `taxaDeBase(38, 4120)` = "38 de 4.120 (0,9%)"
- [x] CNPJ com dígito inválido é descartado; PF vira agregado sem nome nem documento
- [x] Quick gate passa

**Tests**: unit
**Status**: ✅ Done
**Gate**: quick

---

### T3: Cliente paginado do Transferegov

**What**: `paginas<T>(cli, recurso, params)` com `tamanho_da_pagina=200`, até `total_pages`, deduplicando por id.
**Where**: `src/ingest/transferegov.ts`
**Depends on**: None
**Reuses**: `ClienteEducado`, `ColetaBloqueada` (`src/ingest/http.ts`)
**Requirement**: TRI-06

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] 429, 4xx e 5xx param a paginação com `ColetaBloqueada`; 200 segue (L-002)
- [x] Id repetido entre páginas aparece uma vez (L-004)
- [x] Full gate passa

**Tests**: integration
**Status**: ✅ Done
**Gate**: full

---

### T4: Coletor das emendas Pix no Transferegov

**What**: `coletarTransferegovPix(db, cli)`: planos → relatórios → documentos de liquidação, ligados pelo código da emenda, gravados em transação, com resumo de ligados, sem código, CNPJ inválido e PF agregados.
**Where**: `src/ingest/transferegov.ts` (modify)
**Depends on**: T3
**Reuses**: padrão de `coletarEmendas` (`src/ingest/transparencia.ts`), `registrarColeta`, `inserirEmBlocos`
**Requirement**: TRI-01, TRI-02, TRI-03, TRI-06, TRI-07, EDGE-01, EDGE-02

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Fixture com plano sem código não é ligado e entra no resumo
- [x] Nenhum campo bancário gravado (consulta às colunas no teste)
- [x] Falha no meio mantém a coleta anterior intacta
- [x] `coleta.observacao` guarda a `data-atualizacao` do Transferegov
- [x] Full gate passa

**Tests**: integration
**Status**: ✅ Done
**Gate**: full

---

### T5: Comando `transferegov-pix`

**What**: `pnpm ingest transferegov-pix` e linha de ordem no cabeçalho (depois de `emendas`).
**Where**: `scripts/ingest.ts`
**Depends on**: T4
**Reuses**: `switch` existente
**Requirement**: TRI-01

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Comando imprime o resumo do coletor
- [x] Build gate passa

**Tests**: none
**Status**: ✅ Done
**Gate**: build

---

### T6: Importador do lote Estabelecimentos

**What**: `importarEstabelecimentos(db, caminho)`: lê o ZIP local em fluxo, grava início de atividade, CNAE e matriz/filial só dos CNPJs já no banco, recusa lote de mês anterior ao vigente.
**Where**: `src/ingest/receita.ts`
**Depends on**: T5
**Reuses**: `linhasCsvDoZip`, `registrarColeta`, `sha256De`
**Requirement**: CNPJ-01, CNPJ-02, CNPJ-06, CNPJ-07, EDGE-05, EDGE-06

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] CNPJ que não está no banco não é gravado
- [x] Nenhum campo de endereço, telefone ou e-mail gravado
- [x] Lote de mês anterior é recusado com mensagem que cita os dois meses
- [x] O módulo não importa `ClienteEducado` nem faz requisição (teste de import)
- [x] Full gate passa

**Tests**: integration
**Status**: ✅ Done
**Gate**: full

---

### T7: Comando `receita --arquivo`

**What**: `pnpm ingest receita --arquivo <zip>`, com instrução de download manual no cabeçalho.
**Where**: `scripts/ingest.ts` (modify)
**Depends on**: T6
**Reuses**: `switch` existente
**Requirement**: CNPJ-01, CNPJ-07

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Sem `--arquivo`, o comando sai com erro e cita a página do dados.gov.br
- [x] Build gate passa

**Tests**: none
**Status**: ✅ Done
**Gate**: build

---

### T8: Despesas de campanha com fornecedor PJ

**What**: Conferir o cabeçalho real do CSV de despesas no ZIP de 2022 e escrever `coletarDespesasCampanha(db, cli, ano)`, que grava só fornecedor PJ de candidatos em `candidatura`.
**Where**: `src/ingest/tse.ts` (modify)
**Depends on**: T7
**Reuses**: `coletarBens`, `linhasCsvDoZip`, `ClienteEducado`
**Requirement**: CICLO-01, CICLO-02

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Fixture montada a partir do cabeçalho real (colunas registradas no commit)
- [x] Fornecedor PF e doador não são gravados
- [x] Candidato fora de `candidatura` é ignorado
- [x] Full gate passa

**Tests**: integration
**Status**: ✅ Done
**Gate**: full

---

### T9: Comando `tse-contas`

**What**: `pnpm ingest tse-contas 2022`.
**Where**: `scripts/ingest.ts` (modify)
**Depends on**: T8
**Reuses**: `switch` existente
**Requirement**: CICLO-01

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Comando imprime o resumo
- [x] Build gate passa

**Tests**: none
**Status**: ✅ Done
**Gate**: build

---

### T10: Leitura da trilha

**What**: `trilhaDoParlamentar(id, periodo)` e `taxasDeBase()`: trilha por emenda Pix, saldo sem pagamento, abertura da matriz, indícios e taxa de base.
**Where**: `src/data/trilha.ts`
**Depends on**: None
**Reuses**: regras de T2; período de `emendasDoParlamentar`
**Requirement**: TRI-04, TRI-05, CNPJ-05, CNPJ-06, EDGE-03, EDGE-04, LING-06, LING-07, LING-09

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Soma dos pagamentos + saldo = valor transferido, centavo a centavo
- [x] Ente público como recebedor não é avaliado como recém-aberta
- [x] Cada indício traz os `coleta_id` com data e SHA-256
- [x] Seed acima dos limites de listagem (L-003)
- [x] Full gate passa

**Tests**: integration
**Status**: ✅ Done
**Gate**: full

---

### T11: Seção "Para onde foi o dinheiro"

**What**: Componente do artboard aprovado (desktop e celular), chamado por uma linha em `secao-emendas.tsx`.
**Where**: `src/components/perfil/secao-trilha.tsx`
**Depends on**: T10
**Reuses**: `CARTAO`, `Fonte`, cartão de aviso de `sancao.tsx`
**Requirement**: TRI-04, TRI-05, TRI-07, LING-01, LING-02, LING-04, EDGE-04

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Textos exatos da spec ("Indício não é prova de irregularidade.", "Sem pagamento registrado: R$ X", frase de vazio)
- [x] 320 px sem rolagem horizontal; axe sem violações
- [x] Contestar leva ao formulário existente
- [x] Full gate passa

**Tests**: e2e
**Status**: ✅ Done
**Gate**: full

---

### T12: Seção "trilha" no formulário de contestação

**What**: Nova opção de seção para contestar um aviso da trilha.
**Where**: `src/app/parlamentares/[id]/contestar/secoes.ts`
**Depends on**: T11
**Reuses**: lista de seções existente
**Requirement**: LING-04

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Link "Contestar" de um aviso abre o formulário com a seção preenchida
- [x] Full gate passa

**Tests**: e2e
**Status**: ✅ Done
**Gate**: full

---

### T13: CSV da trilha

**What**: Rota `trilha.csv` com elos, `indicio` e `versao_metodologia`.
**Where**: `src/app/parlamentares/[id]/trilha.csv/route.ts`
**Depends on**: T12
**Reuses**: padrão de `emendas.csv/route.ts`
**Requirement**: LING-05

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Nenhuma coluna com nome ou documento de PF
- [x] Colunas `indicio` e `versao_metodologia` presentes
- [x] Full gate passa

**Tests**: e2e
**Status**: ✅ Done
**Gate**: full

---

### T14: Metodologia 1.11

**What**: Seção por sinal (fonte, regra, limiar, exemplo, causas de falso positivo) e `METODOLOGIA_VERSAO = "1.11"`.
**Where**: `src/app/metodologia/page.tsx`
**Depends on**: T13
**Reuses**: seções do padrão atípico na mesma página
**Requirement**: LING-03, LING-08

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Âncoras `#recem-aberta` e `#ciclo-fechado` usadas pelos links dos avisos
- [x] Versão 1.11 em `src/lib/metrics.ts`
- [x] Full gate passa

**Tests**: e2e
**Status**: ✅ Done
**Gate**: full


---

### T15: Leitura da versão enxuta

**What**: `trilhaDoParlamentar` passa a dizer quais sinais foram avaliados (base da Receita importada; despesas de campanha da eleição do mandato importadas), a UF dos municípios de cada emenda, o plano de cada indício (para "Ver na trilha") e os CNPJs com ciclo fechado por emenda (selo); `nomeLegivel` vai para `src/lib/trilha.ts` sem o bug do "Pará".
**Where**: `src/data/trilha.ts`, `src/lib/trilha.ts`, `tests/fixtures/trilha.ts`
**Depends on**: None
**Reuses**: leitura atual
**Requirement**: DENS-01, DENS-04, DENS-06, DENS-09, DENS-10

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Perfil sem base da Receita nem do TSE devolve os dois sinais como não avaliados
- [ ] Emenda com 15 municípios na fixture (12 pagos, 3 sem pagamento) com UF
- [ ] Cada indício traz o plano do primeiro pagamento ligado a ele
- [ ] `nomeLegivel("SHARK MAQUINAS PARA CONSTRUCAO LTDA")` não troca "para" por "Pará"
- [ ] Full gate passa

**Tests**: integration
**Gate**: full

---

### T16: Seção enxuta

**What**: Reescrever a seção pelo artboard aprovado: emendas em linhas, emenda com indício aberta, elos uma vez, municípios em ordem de valor pago (10 + "Ver os outros N" + linha dos sem pagamento), município abre os recebedores com selos, indícios agrupados por sinal, "Não avaliados", CSV e Contestar no topo, notas uma vez; textos revistos (TRI-07, EDGE-04, DENS-10).
**Where**: `src/components/perfil/secao-trilha.tsx`, `src/app/parlamentares/[id]/page.tsx`
**Depends on**: T15
**Reuses**: tokens do design system, `<details>` nativo
**Requirement**: DENS-01..DENS-10, TRI-04, TRI-05, TRI-07, EDGE-04, LING-01, LING-02, LING-04, LING-07, LING-09

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Textos exatos da spec ("Indício não é prova de irregularidade.", "Sem pagamento registrado: R$ X", "N municípios sem pagamento registrado", "Não avaliados", frase de vazio com gênero)
- [ ] Desktop e celular conferidos no e2e por projeto; 320 px sem rolagem; axe sem violações
- [ ] "Ver na trilha" abre o município da empresa
- [ ] Full gate passa

**Tests**: e2e
**Gate**: full

---

### T17: Verificação da versão enxuta

**What**: Verificador independente: ACs DENS e os já existentes, injeção de falhas e paridade com os artboards da versão enxuta (≥ 95%).
**Where**: `.specs/features/seguir-dinheiro/validation.md`
**Depends on**: T16
**Reuses**: método da validação anterior
**Requirement**: todos

**Tools**:

- MCP: NONE
- Skill: tlc-spec-driven

**Done when**:

- [ ] Veredito PASS e `validate_state.py` sai com 0

**Tests**: none
**Gate**: build

---

## Phase Execution Map

```
Phase 1 → Phase 2 → Phase 3

Phase 1:  T1 → T2
Phase 2:  T3 → T4 → T5 → T6 → T7 → T8 → T9
Phase 3:  T10 → T11 → T12 → T13 → T14
```

---

## Task Granularity Check

| Task | Scope | Status |
| ---- | ----- | ------ |
| T1 | 1 migração | ✅ Granular |
| T2 | 1 módulo de funções puras | ✅ Granular |
| T3 | 1 função | ✅ Granular |
| T4 | 1 função | ✅ Granular |
| T5, T7, T9 | 1 comando cada | ✅ Granular |
| T6 | 1 função | ✅ Granular |
| T8 | 1 função | ✅ Granular |
| T10 | 2 funções de leitura no mesmo arquivo | ⚠️ OK (coesas) |
| T11 | 1 componente + 1 linha de chamada | ✅ Granular |
| T12, T13, T14 | 1 arquivo cada | ✅ Granular |

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| ---- | ---------------------- | ------------- | ------ |
| T1 | None | início da fase 1 | ✅ Match |
| T2 | T1 | T1 → T2 | ✅ Match |
| T3 | None (fase 1 inteira antes) | início da fase 2 | ✅ Match |
| T4 | T3 | T3 → T4 | ✅ Match |
| T5 | T4 | T4 → T5 | ✅ Match |
| T6 | T5 | T5 → T6 | ✅ Match |
| T7 | T6 | T6 → T7 | ✅ Match |
| T8 | T7 | T7 → T8 | ✅ Match |
| T9 | T8 | T8 → T9 | ✅ Match |
| T10 | None (fase 2 inteira antes) | início da fase 3 | ✅ Match |
| T11 | T10 | T10 → T11 | ✅ Match |
| T12 | T11 | T11 → T12 | ✅ Match |
| T13 | T12 | T12 → T13 | ✅ Match |
| T14 | T13 | T13 → T14 | ✅ Match |

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| ---- | --------------------------- | --------------- | --------- | ------ |
| T1 | Esquema | none | none | ✅ OK |
| T2 | `src/lib` | unit | unit | ✅ OK |
| T3, T4 | `src/ingest` | integration | integration | ✅ OK |
| T5, T7, T9 | `scripts/` | none | none | ✅ OK |
| T6, T8 | `src/ingest` | integration | integration | ✅ OK |
| T10 | `src/data` | integration | integration | ✅ OK |
| T11 | `src/components` | e2e | e2e | ✅ OK |
| T12, T13, T14 | `src/app` | e2e | e2e | ✅ OK |
