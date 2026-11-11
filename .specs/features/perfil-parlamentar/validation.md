# Validation Report: perfil-parlamentar — FAIL (iteração 3 de 3, final)

**Date**: 2026-11-11
**Spec**: `.specs/features/perfil-parlamentar/spec.md` (49 requisitos: os 46 da iteração 2 + BUSCA-04, BUSCA-05, UI-03; VOTO-01 reescrito)
**Diff range**: `1eeedc4..04e04ae` (branch `feat/perfil-parlamentar`); correções e escopo novo desde a iteração 2: `c76b4d6..04e04ae`
**Verifier**: sub-agente independente, novo (author ≠ verifier). As afirmações do autor em tasks.md não foram aceitas: cada critério foi conferido no código e nos testes, e o sensor foi rodado de novo num worktree descartável.

**Verdict**: FAIL. O gate inteiro passa, os 49 critérios têm evidência `file:line` e os 6 sobreviventes da iteração 2 agora morrem. Mas 3 das 6 mutações novas sobreviveram: duas no código novo da busca por UF (BUSCA-04) e da casca estática (UI-03). Pelas regras do validate.md, mutante sobrevivente vira tarefa de correção. Esta é a última iteração: as lacunas restantes vão ao usuário.

---

## O que mudou desde a iteração 2

| Iteração 2 | Iteração 3 |
| ---------- | ---------- |
| 39 ✅ / 7 ⚠️ / 0 ❌ de 46 | 47 ✅ / 2 ⚠️ / 0 ❌ de 49 |
| Sensor: 9/15 (sobreviventes N1, N3, N5, N6, N7, N9) | Os 6 sobreviventes agora morrem; 6 mutações novas, 3 mortas; total 9/12 nesta rodada |
| Vitest 67 (8 arquivos), Playwright 28 | Vitest 74 (9 arquivos), Playwright 36 (18 testes × desktop e 390 px) |
| "—" do EDGE-03 não afirmado | ✅ `tests/e2e/perfil.spec.ts:121-122` |
| — | Escopo novo: busca por UF (`ufDaBusca`, `src/data/perfil.ts:22-28,47-50`), placeholders, páginas com componente síncrono e dados em `<Suspense>` (`src/app/{fontes,parlamentares,parlamentares/[id],parlamentares/[id]/contestar}/page.tsx`) |

---

## Task Completion

| Task | Status | Notes |
| ---- | ------ | ----- |
| T1–T13, T15–T19 | ✅ Done | Sem regressão no gate. T15 (N7), T16 (N3), T18 (N6) agora fechados. |
| T14 (menu) | ✅ Done | N1 morre (`tests/e2e/perfil.spec.ts:74`, casos `/parlamentares` e `/metodologia`); largura 2 px afirmada (`:80`). |
| T20 (casca estática) | ⚠️ Partial | O teste só confere que o componente da página não é `async`. Tirar o `<Suspense>` da página (U5, U6) passa no build (o `loading.tsx` da raiz absorve a suspensão) e em todos os testes. |
| T21 (busca por UF) | ⚠️ Partial | Busca por UF provada. "Além dos que casam pelo nome" não é provado: U3 (UF substitui o filtro de nome) sobreviveu. |
| T22 (lacunas da iteração 2) | ✅ Done | N1, N3, N5, N6, N7 e N9 morrem (conferido abaixo). 74 Vitest e 36 e2e, como afirmado. |

---

## Gate Check

Rodado num git worktree descartável em HEAD `04e04ae` (cópia de `node_modules` e dos `.env`). O dev server do usuário na porta 3000 não foi tocado; build e e2e rodaram só no worktree (porta 3212). Como na iteração 2, os scripts rodaram como `pnpm --config.verify-deps-before-run=false <script>` por causa da cópia de `node_modules`; os comandos não mudaram.

| Passo | HEAD `04e04ae` |
| ----- | -------------- |
| `pnpm lint` | ✅ exit 0 |
| `pnpm typecheck` | ✅ exit 0 |
| `pnpm format:check` | ✅ "All matched files use Prettier code style!" |
| `pnpm db:seed:test` | ✅ "Seed fictício aplicado." |
| `pnpm test` (Vitest) | ✅ 74/74, 9 arquivos, 0 skip (integração rodou contra o Postgres em 127.0.0.1:5436) |
| `pnpm build` | ✅ `/fontes`, `/parlamentares`, `/parlamentares/[id]`, `/parlamentares/[id]/contestar` como ◐ Partial Prerender |
| `pnpm test:e2e` (`PW_CHROME`) | ✅ 36/36 (18 testes × `desktop` e `celular` 390×844) |

- **Contagem antes da feature**: 0. **Iteração 2**: 67 Vitest + 28 e2e. **Agora**: 74 Vitest + 36 e2e (+7, +8).
- **Asserções alteradas**: `perfil.test.ts:96` (`totalPlenario` 3 → 4) e o e2e de presença ("2 de 3"/"67%" → "2 de 4"/`"50%"` com `toHaveCount(2)`) acompanham a linha de voto vazio nova no seed (`src/db/seed.ts:226-247`). O título de `metrics.test.ts:29` foi corrigido para o que o fixture testa. Nenhum teste removido, nenhuma asserção enfraquecida.
- **Skipped / falhas**: nenhum.

---

## Spec-Anchored Acceptance Criteria

Legenda: ✅ a asserção mira o resultado definido na spec · ⚠️ parcial (parte do critério não é afirmada ou um mutante na regra sobreviveu) · ❌ sem citação `file:line`.

### P1: Encontrar um deputado

| ID | Spec-defined outcome | `file:line` + assertion | Result |
| -- | -------------------- | ----------------------- | ------ |
| BUSCA-01 | só em exercício; nome parlamentar ou civil; sem acento/caixa | `tests/integracao/perfil.test.ts:135` - `q: "joao"` → `toEqual([SEED.deputado])`; `:136` - `"EXEMPLO DA SILVA"` (só no nome civil) → `[SEED.deputada]`; `:142-143` - `"joana"` fora de exercício → `[]`, com `todos` encontra | ✅ |
| BUSCA-02 | `%` e `_` literais | `tests/integracao/perfil.test.ts:159-160` - `toEqual([])` | ✅ |
| BUSCA-03 | `/parlamentares/{id}` com o nome no h1 | `tests/e2e/perfil.spec.ts:10-11` - `toHaveURL`, heading level 1 "Maria Exemplo" | ✅ |
| BUSCA-04 | sigla de UF (qualquer caixa) inclui os deputados da UF **além** dos que casam pelo nome | `tests/integracao/perfil.test.ts:149-150` - `q: "sp"` → `[SEED.deputada]`, `q: "RJ"` → `[SEED.deputado]` (U1, U2 mortos); `:151-153` - `ufDaBusca(" mg ")` → `"MG"`, `"XX"`/`"maria"` → `null`; `tests/e2e/perfil.spec.ts:94-99` - "rj" no topo lista João, não Maria | ⚠️ Nenhum termo é ao mesmo tempo UF e parte de um nome, então a união não é afirmada. Mutante U3 (com UF, só o filtro de UF vale, `src/data/perfil.ts:48-49`) sobreviveu: buscar "ma" deixaria de achar "Maria Exemplo". O título do teste promete "sem perder o nome". |
| BUSCA-05 | placeholder do topo "Buscar deputado por nome ou UF"; rótulo "Nome ou UF", placeholder "Ex.: Maria, Silva ou SP" | `tests/e2e/perfil.spec.ts:87-91` - `toHaveAttribute("placeholder", …)` com os dois textos exatos; `getByLabel("Nome ou UF")` | ✅ |

### P1: Ver gastos da cota (CEAP)

| ID | Spec-defined outcome | `file:line` + assertion | Result |
| -- | -------------------- | ----------------------- | ------ |
| CEAP-01 | total = soma de `valor_liquido` no ano | `tests/integracao/perfil.test.ts:38` - `toBe(44100)` | ✅ |
| CEAP-02 | por tipo, decrescente | `tests/integracao/perfil.test.ts:39` - `toEqual([30000, 9600, 4500])` | ✅ |
| CEAP-03 | até 8 maiores fornecedores | `tests/integracao/perfil.test.ts:86-88` - `toHaveLength(8)`, primeiro 900, último 200 | ✅ |
| CEAP-04 | `?ano=` sem despesas → ano mais recente | `tests/integracao/perfil.test.ts:47-48` - `ano).toBe(2026)` | ✅ |
| CEAP-05 | sem teto verificado → omite comparação | `tests/integracao/perfil.test.ts:55-56` - `toBeNull()`; `tests/e2e/perfil.spec.ts:21` | ✅ |

### P1: Ver votações e alinhamento

| ID | Spec-defined outcome | `file:line` + assertion | Result |
| -- | -------------------- | ----------------------- | ------ |
| VOTO-01 | presentes = votos não vazios; total = votações do Plenário; voto vazio não conta | `tests/integracao/perfil.test.ts:96-97` - `totalPlenario).toBe(4)`, `presentes).toBe(2)` com a linha `voto: ""` do seed (`src/db/seed.ts:247`); `tests/e2e/perfil.spec.ts:18` - "2 de 4 em 2026" (N5 morto) | ✅ |
| VOTO-02 | partido → federação → bloco; ignora vazia | `tests/unit/metrics.test.ts:41-50` - federação listada antes do partido → `tipo: "partido"` (N3 morto); `:53-62` federação > bloco; `:65-74` só bloco; `:77-78` vazia → `null` | ✅ |
| VOTO-03 | só Sim/Não × Sim/Não; diferente = divergência | `tests/unit/metrics.test.ts:94`; `tests/integracao/perfil.test.ts:98` - `{ comparaveis: 2, iguais: 1, divergencias: 1 }` | ✅ |
| VOTO-04 | sigla completa só por igualdade | `tests/unit/metrics.test.ts:19-26` - `toBeNull()` para PSD × PSDB | ✅ |
| VOTO-05 | "Divergiu" lista só divergentes | `tests/e2e/perfil.spec.ts:46-48` | ✅ |
| VOTO-06 | sem voto → "Votou: sem registro" | `tests/e2e/perfil.spec.ts:57` - `toHaveCount(2)` (MPV e veto com voto vazio); `tests/integracao/perfil.test.ts:99-100` - `voto: null` | ✅ |
| VOTO-07 | "Sem voto registrado" lista só as sem voto | `tests/e2e/perfil.spec.ts:55-59` - MPV e veto visíveis, PEC e PL `toHaveCount(0)` | ✅ |

### P1: Ver bens declarados ao TSE

| ID | Spec-defined outcome | `file:line` + assertion | Result |
| -- | -------------------- | ----------------------- | ------ |
| BENS-01 | total por eleição casada | `tests/integracao/perfil.test.ts:108-109` - 890000, 1050000 | ✅ |
| BENS-02 | `round(...)`; anterior 0 → nada | `tests/unit/metrics.test.ts:109-110`; `tests/e2e/perfil.spec.ts:22` - "+18% sobre 2022" | ✅ |
| BENS-03 | só tipo e valor | `tests/unit/transformacoes.test.ts:151-152` - `not.toContain("RUA")` | ✅ |
| BENS-04 | ambíguo descartado | `tests/unit/transformacoes.test.ts:131-132` | ✅ |

### P1: Proveniência e privacidade

| ID | Spec-defined outcome | `file:line` + assertion | Result |
| -- | -------------------- | ----------------------- | ------ |
| PROV-01 | lote com fonte, URL, data, SHA-256, bytes, licença; registros ligados | `tests/integracao/coleta.test.ts:82-89` - `toMatchObject({ url, sha256, bytes, licenca })`, `coleta_id` das despesas = `coleta.id` | ✅ |
| PROV-02 | rótulo, data e "Ver na fonte" em cada seção | `tests/e2e/perfil.spec.ts:27-31` | ✅ |
| PRIV-01 | `***.XXX.XXX-**` | `tests/unit/privacy.test.ts:6-7`; `tests/integracao/coleta.test.ts:100-108` - CPF bruto do zip gravado mascarado | ✅ |
| PRIV-02 | PF → "Prestador pessoa física" | `tests/integracao/coleta.test.ts:100`; `tests/unit/privacy.test.ts:30` | ✅ |
| PRIV-03 | descarta passageiro e CPF do parlamentar | `tests/integracao/coleta.test.ts:109-110` | ✅ |
| PRIV-04 | nem 11 nem 14 dígitos → sem documento | `tests/unit/privacy.test.ts:25-26` | ✅ |
| PRIV-05 | "Controlador: …" e "Encarregado (LGPD): …" | `tests/e2e/perfil.spec.ts:38-39` | ✅ |

### P2: Contexto do mandato e fidelidade ao protótipo

| ID | Spec-defined outcome | `file:line` + assertion | Result |
| -- | -------------------- | ----------------------- | ------ |
| MAND-01 | órgãos sem data de fim, com o cargo | `tests/e2e/perfil.spec.ts:65` - `toHaveText("Comissão de Finanças e Tributação · Titular")`; `:66` - órgão encerrado do seed `toHaveCount(0)` (N9 morto) | ✅ |
| METOD-01 | "Versão {METODOLOGIA_VERSAO}." | `tests/e2e/perfil.spec.ts:104-105` | ✅ |
| NAV-01 | página do menu ou abaixo → `aria-current="page"` + 2 px `#1F4FD1` | `tests/e2e/perfil.spec.ts:69-82` - em `/parlamentares/{id}`, `/parlamentares` e `/metodologia`: `aria-current`, `border-bottom-color` `rgb(31, 79, 209)`, `border-bottom-width` `2px`, outro item sem `aria-current` (N1 morto) | ✅ |
| UI-02 | rodapé `#15181E` | `tests/e2e/perfil.spec.ts:41` - `rgb(21, 24, 30)` | ✅ |
| UI-03 | componente da página não é assíncrono **e** a parte com dados carrega dentro de `<Suspense>` | `tests/unit/paginas.test.ts:16-18` - `Pagina.constructor.name).toBe("Function")` nas 4 páginas (U4 morto) | ⚠️ Só a metade "não é async" é afirmada. Tirar o `<Suspense>` de `/fontes` (U5) ou de `/parlamentares` (U6) mantém o componente síncrono, o build segue verde (o `src/app/loading.tsx` vira o limite, e o h1 deixa de estar na casca estática) e todos os testes passam. |

### P1: Pedir correção

| ID | Spec-defined outcome | `file:line` + assertion | Result |
| -- | -------------------- | ----------------------- | ------ |
| CORR-01 | 20–4000 → grava "recebido" + "Pedido recebido." | `tests/integracao/perfil.test.ts:187-195` - redireciona, `status: "recebido"`; `:202` - 4001 → erro; `tests/e2e/perfil.spec.ts:114` | ✅ |
| CORR-02 | < 20 → não grava + mensagem exata | `tests/integracao/perfil.test.ts:177-180` | ✅ |
| CORR-03 | "Contestar" pré-seleciona | `tests/e2e/perfil.spec.ts:110-111` - `toHaveValue("gastos")` | ✅ |

### P1: Coleta não invasiva

| ID | Spec-defined outcome | `file:line` + assertion | Result |
| -- | -------------------- | ----------------------- | ------ |
| COLETA-01 | UA `Auditaja/<v> (+<URL>; ...)` | `tests/unit/http.test.ts:38-39` | ✅ |
| COLETA-02 | robots na 1ª vez; proibido → `ColetaBloqueada` | `tests/unit/http.test.ts:36-37` | ✅ |
| COLETA-03 | 5xx/rede bloqueia; 4xx/HTML permite | `tests/unit/http.test.ts:62,67-68` (bloqueia); `:44` (404); `:47-57` - corpo `User-agent: *\nDisallow: /` com `text/html` → resolve (N7 morto) | ✅ |
| COLETA-04 | max(1 s, Crawl-delay) | `tests/unit/http.test.ts:84-85,96-97` | ✅ |
| COLETA-05 | até 4 tentativas; Retry-After ou 2/4/8 s | `tests/unit/http.test.ts:106,112-114,120-121` | ✅ |
| COLETA-06 | 401/403 → `ColetaBloqueada`, 1 chamada | `tests/unit/http.test.ts:124-128` | ✅ |
| COLETA-07 | recoleta substitui em uma transação, sem duplicar | `tests/integracao/coleta.test.ts:115-128` - sem duplicar; `:131-145` - recoleta com mês inválido (`Number("x")` = NaN, falha no insert depois do delete) → `rejects`, ano continua com 2 linhas (N6 morto) | ✅ |
| COLETA-08 | só nominais, sem duplicados | `tests/unit/transformacoes.test.ts:93-95` | ✅ |

### Edge Cases

| ID | Spec-defined outcome | `file:line` + assertion | Result |
| -- | -------------------- | ----------------------- | ------ |
| EDGE-01 | "Página não encontrada" + `noindex` | `tests/e2e/perfil.spec.ts:132-137` | ✅ |
| EDGE-02 | "Nenhuma despesa publicada para {ano}." | `tests/e2e/perfil.spec.ts:119` | ✅ |
| EDGE-03 | mensagem de ausência e "—" no indicador | `tests/e2e/perfil.spec.ts:120-123` - mensagem; no indicador "Bens declarados ao TSE", `getByText("—", { exact: true })` visível | ✅ |
| EDGE-04 | 390 px sem rolagem horizontal | `playwright.config.ts:22`; `tests/e2e/perfil.spec.ts:128-129` | ✅ |
| EDGE-05 | seed fora de `_test` recusa, exit 1 | `tests/unit/seed-guard.test.ts:14-15` | ✅ |

**Status**: ⚠️ 47 ✅, 2 ⚠️ (BUSCA-04, UI-03), 0 ❌, de 49.

---

## Discrimination Sensor

Worktree descartável em HEAD `04e04ae`. Uma mutação por vez, por substituição exata de texto (o script confere que o trecho original aparece uma única vez), seguida de `pnpm test` completo; para mutações de UI ou de dados exibidos, também `pnpm build` e `pnpm test:e2e` quando o Vitest não matou. Depois de cada uma, `git checkout -- <arquivo>`.

### Os 6 sobreviventes da iteração 2

| Mutation | File:line | Description | Killed? |
| -------- | --------- | ----------- | ------- |
| N1 | `src/components/nav-principal.tsx:26` | remove `pathname === href \|\|` | ✅ Killed (e2e `perfil.spec.ts:74`, `/parlamentares` e `/metodologia`, desktop e celular) |
| N3 | `src/lib/metrics.ts:78` | precedência `["federacao", "partido", "bloco"]` | ✅ Killed (`metrics.test.ts:41`) |
| N5 | `src/data/perfil.ts:202` | presença = `votos.length` (conta voto vazio) | ✅ Killed (`perfil.test.ts:92`) |
| N6 | `src/ingest/camara.ts:236-239` | delete e insert em transações separadas | ✅ Killed (`coleta.test.ts:131`) |
| N7 | `src/ingest/http.ts:65` | robots em `text/html` é lido pelo parser | ✅ Killed (`http.test.ts:47`) |
| N9 | `src/data/perfil.ts:250` | remove `.where("data_fim", "is", null)` | ✅ Killed (e2e `perfil.spec.ts:62`, desktop e celular) |

### Mutações novas (código desde a iteração 2)

| Mutation | File:line | Description | Killed? |
| -------- | --------- | ----------- | ------- |
| U1 | `src/data/perfil.ts:50` | remove o ramo `sigla_uf = ufBuscada` do `or` | ✅ Killed (`perfil.test.ts:146`) |
| U2 | `src/data/perfil.ts:25` | `ufDaBusca` sem `.toUpperCase()` | ✅ Killed (`perfil.test.ts:146`) |
| U3 | `src/data/perfil.ts:48-49` | com UF reconhecida, usa só `sigla_uf = UF` (descarta o filtro de nome) | ❌ Survived (Vitest 74/74, build, e2e 36/36) |
| U4 | `src/app/fontes/page.tsx:10` | `export default async function Fontes()` | ✅ Killed (`paginas.test.ts:16`, caso `/fontes`) |
| U5 | `src/app/fontes/page.tsx:19-21` | remove o `<Suspense>` em volta de `<TabelaColetas />` (componente segue síncrono) | ❌ Survived (Vitest, build com `/fontes` ainda ◐, e2e) |
| U6 | `src/app/parlamentares/page.tsx` | remove o `<Suspense>` em volta de `<Resultados />` | ❌ Survived (Vitest, build, e2e) |

**Sensor depth**: lightweight ampliado (12 mutações nesta rodada)
**Sensor outcome**: 9/12 mortos. 6/6 da iteração 2 morrem; 3/6 das novas → FAIL
**Isolation**: `git status --porcelain` do repositório real estava vazio antes e depois (comparados com `diff`: iguais). Worktree removido com `git worktree remove --force`; `git worktree list` mostra só o checkout principal. Nenhum `git stash`.

---

## Code Quality

| Principle | Status |
| --------- | ------ |
| Minimum code | ✅ `ufDaBusca` é um `Set` e um `trim().toUpperCase()`; `Esqueleto` é um componente de 11 linhas reutilizado nas 4 páginas |
| Surgical changes | ✅ Produção mudou só nas 4 páginas, `topo.tsx`, `esqueleto.tsx`, `perfil.ts` e no seed |
| No scope creep | ✅ BUSCA-04, BUSCA-05 e UI-03 foram acrescentados à spec antes da verificação; não há código sem requisito |
| Matches patterns | ✅ |
| Spec-anchored outcome check | ⚠️ BUSCA-04 e UI-03 parciais |
| Per-layer Coverage Expectation met | ⚠️ Busca: falta o caso em que o termo é UF e parte de um nome. UI-03: falta afirmar o `<Suspense>`. |
| Every test maps to a spec requirement | ✅ Todos os testes novos citam o ID no título |
| Documented guidelines followed: `AGENTS.md`, Test Coverage Matrix de tasks.md | ⚠️ ver acima |

Notas:
- O teste de COLETA-07 depende de `Number("x")` virar `NaN` e o Postgres recusar no insert. Funciona (N6 morre), mas o motivo da falha é implícito; um comentário mais preciso ajudaria quem mexer em `linhaCeap` (se ela passar a descartar mês inválido, o teste deixa de exercitar a transação sem falhar).
- `tests/unit/paginas.test.ts:18` depende de o transpilador manter `async function` nativa (`constructor.name === "AsyncFunction"`). Hoje é o caso (U4 morre).

---

## Fix Plans

### Fix 1 (Major): BUSCA-04, UF sem perder o nome (U3)
- **Root cause**: nenhum termo do teste é ao mesmo tempo sigla de UF e parte de um nome, então "além dos que casam pelo nome" não é afirmado.
- **Fix task**: em `tests/integracao/perfil.test.ts` (teste BUSCA-04), `buscarParlamentares({ q: "ma" })` → `toEqual([SEED.deputada])` ("MA" é Maranhão, sem deputado no seed; "Maria" casa pelo nome). Se quiser também a união no mesmo resultado, ponha no seed um deputado em exercício de outra UF cujo nome contenha "rj" ou "sp", ou busque "ma" com um deputado do MA no seed e afirme os dois ids.
- **Done when**: U3 morre.

### Fix 2 (Minor): UI-03, dados dentro de `<Suspense>` (U5, U6)
- **Root cause**: `tests/unit/paginas.test.ts` só confere que o componente não é `async`. Sem o `<Suspense>` da página, o `src/app/loading.tsx` absorve a suspensão, o build continua ◐ e nenhum teste nota que a casca (h1, texto) saiu da parte estática.
- **Fix task**: em `tests/unit/paginas.test.ts`, chamar o componente (`Pagina({ params: Promise.resolve({ id: "1" }), searchParams: Promise.resolve({}) })`) e percorrer a árvore de elementos devolvida, afirmando que há um elemento com `type === Suspense` (de `react`) em cada uma das 4 páginas. Alternativa e2e/build: ler `.next/server/app/fontes.html` depois do build e afirmar que o h1 "Fontes e licenças" está no HTML prerenderizado.
- **Done when**: U5 e U6 morrem.

---

## Requirement Traceability Update

| Requirement | Previous | New |
| ----------- | -------- | --- |
| VOTO-01, VOTO-02, COLETA-03, COLETA-07, MAND-01, NAV-01, EDGE-03 | Needs Fix / Implementing | ✅ Verified |
| BUSCA-05 | Implementing | ✅ Verified |
| BUSCA-04 | Implementing | ❌ Needs Fix (U3) |
| UI-03 | — (novo) | ❌ Needs Fix (U5, U6) |
| Os outros 39 | Verified | ✅ Verified (mantido) |

Nota: a tabela de rastreabilidade da spec dizia "49 total", mas tinha 48 linhas (faltava UI-03). A linha foi acrescentada com status Needs Fix.

---

## Summary

**Overall**: ❌ Not Ready (iteração 3 de 3: o ciclo de correção chegou ao limite; as 2 lacunas vão ao usuário)

**Spec-anchored check**: 47/49 batem com a spec; 2 parciais (BUSCA-04, UI-03); 0 sem evidência
**Sensor**: 9/12 mortos (6/6 da iteração 2; 3/6 das novas)
**Gate**: lint, typecheck, format, seed ✅; Vitest 74 passaram, 0 falharam, 0 pulados; build ✅; Playwright 36/36

**What works**: todas as 7 lacunas da iteração 2 estão fechadas e provadas pelo sensor (precedência partido > federação, voto vazio fora da presença, robots em HTML, menu ativo na página exata com 2 px, órgão encerrado e cargo, atomicidade da recoleta, "—" dos bens). Busca por UF, placeholders e componentes de página síncronos estão cobertos.

**Issues found**: U3 (BUSCA-04, Fix 1, Major: um teste de uma linha); U5/U6 (UI-03, Fix 2, Minor).

**Next steps**: decisão do usuário: aplicar Fix 1 e Fix 2 (ambos só testes, sem mudar produção) e rodar uma verificação extra, ou aceitar as lacunas registradas.
