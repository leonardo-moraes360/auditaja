# Validation Report: perfil-parlamentar — FAIL (iteração 4, extra, autorizada pelo usuário)

**Date**: 2026-11-11
**Spec**: `.specs/features/perfil-parlamentar/spec.md` (50 requisitos: os 49 da iteração 3 + UI-04)
**Diff range**: `1eeedc4..1eccac9` (branch `feat/perfil-parlamentar`); mudanças desde a iteração 3: `04e04ae..1eccac9` (`4784343` testes, `b0ee97c` relatório 3, `1eccac9` UI-04)
**Verifier**: sub-agente independente, novo (author ≠ verifier). As afirmações do autor em tasks.md e nos commits não foram aceitas: os diffs foram lidos, o gate rodou de novo e o sensor rodou num worktree descartável.

**Rodada extra**: o validate.md limita o ciclo a 3 iterações. A iteração 3 terminou em FAIL e foi ao usuário, que autorizou esta 4ª rodada.

**Verdict**: FAIL (uma lacuna Minor). O gate inteiro passa e os 50 requisitos têm evidência `file:line`. As duas lacunas da iteração 3 estão fechadas: U3, U5 e U6 agora morrem. UI-04 está coberto (V1 e V2 morrem). Mas o teste novo de UI-03 só confere que existe *algum* `<Suspense>` na árvore, não que a parte com dados está *dentro* dele: V5 (Suspense vazio, com o componente assíncrono ao lado) sobreviveu ao Vitest, ao build e ao e2e, e tira o h1 de `/fontes` da casca visível. Há também um achado cosmético (V3): a mudança no `Button` do shadcn não tem consumidor, então nada a testa.

---

## O que mudou desde a iteração 3

| Iteração 3 | Iteração 4 |
| ---------- | ---------- |
| 47 ✅ / 2 ⚠️ / 0 ❌ de 49 | 49 ✅ / 1 ⚠️ / 0 ❌ de 50 |
| Sensor: 9/12 (sobreviventes U3, U5, U6) | U3, U5, U6 morrem; 5 mutações novas, 3 mortas (V1, V2, V4); sobreviventes V3 (cosmético) e V5 (Minor). Total nesta rodada: 6/8 |
| Vitest 74 (9 arquivos), Playwright 36 | Vitest 78 (9 arquivos), Playwright 38 (19 testes × desktop e 390 px) |
| BUSCA-04 ⚠️ (U3) | ✅ `tests/integracao/perfil.test.ts:152` - `q: "ma"` → `[SEED.deputada]` |
| UI-03 ⚠️ (U5, U6) | ⚠️ U5, U6 mortos por `tests/unit/paginas.test.ts:31-35`; V5 sobrevive |
| — | UI-04 novo: `src/app/globals.css:103-113`, `src/components/ui/button.tsx:6`, `tests/e2e/perfil.spec.ts:141-147` |

---

## Task Completion

| Task | Status | Notes |
| ---- | ------ | ----- |
| T1–T19, T21, T22 | ✅ Done | Sem regressão no gate. T21 fechado: U3 morre. |
| T20 (casca estática) | ⚠️ Partial | U4, U5, U6 morrem. O teste aceita qualquer `<Suspense>` na árvore, mesmo vazio, com a parte com dados fora dele (V5 sobrevive). |
| T23 (cursor dos botões) | ✅ Done | Regra global em `@layer base` provada pelo e2e (V1, V2 mortos). O "Where" da tarefa cita só `globals.css`, mas o commit também muda `src/components/ui/button.tsx` (citado no "What"). Esse `Button` não é importado em nenhum lugar de `src/` nem de `tests/`. |

---

## Gate Check

Rodado num git worktree descartável em HEAD `1eccac9` (cópia de `node_modules`, `.env` e `.env.local`). O dev server do usuário na porta 3000 não foi tocado; build e e2e rodaram só no worktree (porta 3212). Como nas iterações 2 e 3, os scripts rodaram como `pnpm --config.verify-deps-before-run=false <script>` por causa da cópia de `node_modules`; os comandos não mudaram.

| Passo | HEAD `1eccac9` |
| ----- | -------------- |
| `pnpm lint` | ✅ exit 0 |
| `pnpm typecheck` | ✅ exit 0 |
| `pnpm format:check` | ✅ "All matched files use Prettier code style!" |
| `pnpm db:seed:test` | ✅ "Seed fictício aplicado." |
| `pnpm test` (Vitest) | ✅ 78/78, 9 arquivos, 0 skip (integração rodou contra o Postgres em 127.0.0.1:5436) |
| `pnpm build` | ✅ `/fontes`, `/parlamentares`, `/parlamentares/[id]`, `/parlamentares/[id]/contestar` como ◐ Partial Prerender |
| `pnpm test:e2e` (`PW_CHROME`) | ✅ 38/38 (19 testes × `desktop` e `celular` 390×844) |

- **Contagem antes da feature**: 0. **Iteração 3**: 74 Vitest + 36 e2e. **Agora**: 78 Vitest + 38 e2e (+4 casos `it.each` de Suspense, +1 teste e2e de UI-04 nos 2 projetos).
- **Asserções alteradas**: nenhuma removida nem enfraquecida. `4784343` só acrescenta uma linha em `perfil.test.ts` e um `it.each` em `paginas.test.ts`; `1eccac9` só acrescenta um teste no fim de `perfil.spec.ts`.
- **Skipped / falhas**: nenhum.

---

## Spec-Anchored Acceptance Criteria

Legenda: ✅ a asserção mira o resultado definido na spec · ⚠️ parcial (um mutante na regra sobreviveu) · ❌ sem citação `file:line`.

Os arquivos de teste mudaram desde a iteração 3 só nos pontos citados acima; as citações abaixo foram reconferidas em HEAD (em `perfil.test.ts`, as linhas depois de 151 desceram 2).

### P1: Encontrar um deputado

| ID | Spec-defined outcome | `file:line` + assertion | Result |
| -- | -------------------- | ----------------------- | ------ |
| BUSCA-01 | só em exercício; nome parlamentar ou civil; sem acento/caixa | `tests/integracao/perfil.test.ts:135-136` - `"joao"` → `[SEED.deputado]`, `"EXEMPLO DA SILVA"` → `[SEED.deputada]`; `:142-143` - `"joana"` → `[]`, com `todos` encontra | ✅ |
| BUSCA-02 | `%` e `_` literais | `tests/integracao/perfil.test.ts:161-162` - `toEqual([])` (V4 morto) | ✅ |
| BUSCA-03 | `/parlamentares/{id}` com o nome no h1 | `tests/e2e/perfil.spec.ts:10-11` | ✅ |
| BUSCA-04 | sigla de UF (qualquer caixa) inclui os deputados da UF **além** dos que casam pelo nome | `tests/integracao/perfil.test.ts:149-150` - `"sp"`, `"RJ"`; `:152` - `"ma"` (UF do MA, sem deputado no seed) → `toEqual([SEED.deputada])` porque "Maria" casa pelo nome (U3 morto); `:153-155` - `ufDaBusca`; `tests/e2e/perfil.spec.ts:94-99` | ✅ |
| BUSCA-05 | placeholders e rótulo exatos | `tests/e2e/perfil.spec.ts:87-91` | ✅ |

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
| VOTO-01 | presentes = votos não vazios; voto vazio não conta | `tests/integracao/perfil.test.ts:96-97` - `totalPlenario).toBe(4)`, `presentes).toBe(2)`; `tests/e2e/perfil.spec.ts:18` - "2 de 4 em 2026" | ✅ |
| VOTO-02 | partido → federação → bloco; ignora vazia | `tests/unit/metrics.test.ts:41-50,53-62,65-74,77-78` | ✅ |
| VOTO-03 | só Sim/Não × Sim/Não | `tests/unit/metrics.test.ts:94`; `tests/integracao/perfil.test.ts:98` | ✅ |
| VOTO-04 | sigla completa só por igualdade | `tests/unit/metrics.test.ts:19-26` | ✅ |
| VOTO-05 | "Divergiu" lista só divergentes | `tests/e2e/perfil.spec.ts:46-48` | ✅ |
| VOTO-06 | sem voto → "Votou: sem registro" | `tests/e2e/perfil.spec.ts:57`; `tests/integracao/perfil.test.ts:99-100` | ✅ |
| VOTO-07 | "Sem voto registrado" lista só as sem voto | `tests/e2e/perfil.spec.ts:55-59` | ✅ |

### P1: Ver bens declarados ao TSE

| ID | Spec-defined outcome | `file:line` + assertion | Result |
| -- | -------------------- | ----------------------- | ------ |
| BENS-01 | total por eleição casada | `tests/integracao/perfil.test.ts:108-109` | ✅ |
| BENS-02 | `round(...)`; anterior 0 → nada | `tests/unit/metrics.test.ts:109-110`; `tests/e2e/perfil.spec.ts:22` | ✅ |
| BENS-03 | só tipo e valor | `tests/unit/transformacoes.test.ts:151-152` | ✅ |
| BENS-04 | ambíguo descartado | `tests/unit/transformacoes.test.ts:131-132` | ✅ |

### P1: Proveniência e privacidade

| ID | Spec-defined outcome | `file:line` + assertion | Result |
| -- | -------------------- | ----------------------- | ------ |
| PROV-01 | lote com fonte, URL, data, SHA-256, bytes, licença | `tests/integracao/coleta.test.ts:82-89` | ✅ |
| PROV-02 | rótulo, data e "Ver na fonte" em cada seção | `tests/e2e/perfil.spec.ts:27-31` | ✅ |
| PRIV-01 | `***.XXX.XXX-**` | `tests/unit/privacy.test.ts:6-7`; `tests/integracao/coleta.test.ts:100-108` | ✅ |
| PRIV-02 | PF → "Prestador pessoa física" | `tests/integracao/coleta.test.ts:100`; `tests/unit/privacy.test.ts:30` | ✅ |
| PRIV-03 | descarta passageiro e CPF do parlamentar | `tests/integracao/coleta.test.ts:109-110` | ✅ |
| PRIV-04 | nem 11 nem 14 dígitos → sem documento | `tests/unit/privacy.test.ts:25-26` | ✅ |
| PRIV-05 | "Controlador: …" e "Encarregado (LGPD): …" | `tests/e2e/perfil.spec.ts:38-39` | ✅ |

### P2: Contexto do mandato e fidelidade ao protótipo

| ID | Spec-defined outcome | `file:line` + assertion | Result |
| -- | -------------------- | ----------------------- | ------ |
| MAND-01 | órgãos sem data de fim, com o cargo | `tests/e2e/perfil.spec.ts:65-66` | ✅ |
| METOD-01 | "Versão {METODOLOGIA_VERSAO}." | `tests/e2e/perfil.spec.ts:104-105` | ✅ |
| NAV-01 | `aria-current="page"` + 2 px `#1F4FD1` | `tests/e2e/perfil.spec.ts:74-82` | ✅ |
| UI-02 | rodapé `#15181E` | `tests/e2e/perfil.spec.ts:41` - `rgb(21, 24, 30)` | ✅ |
| UI-03 | componente da página não é assíncrono **e** a parte com dados carrega **dentro** de `<Suspense>` | `tests/unit/paginas.test.ts:26-29` - `constructor.name).toBe("Function")` (U4 morto na iteração 3); `:31-35` - `temSuspense(arvore)).toBe(true)` nas 4 páginas (U5, U6 mortos) | ⚠️ `temSuspense` (`:18-23`) devolve `true` ao achar qualquer `Suspense`, sem olhar o que ele envolve. V5 (`<Suspense …>{null}</Suspense>` com `<TabelaColetas />` ao lado, em `src/app/fontes/page.tsx:19-21`) passa no Vitest, no build (◐) e no e2e. No `.next/server/app/fontes.html` do build com V5, o h1 "Fontes e licenças" vai para o segmento oculto `<div hidden id="S:0">` (o `src/app/loading.tsx` vira o limite); em HEAD o h1 está na casca visível (não há segmento oculto). |
| UI-04 | `cursor: pointer` em todo botão; `cursor: not-allowed` quando desabilitado | `tests/e2e/perfil.spec.ts:144` - `toHaveCSS("cursor", "pointer")` no botão "Filtrar"; `:145-146` - com `disabled`, `toHaveCSS("cursor", "not-allowed")` (V1, V2 mortos, desktop e celular) | ✅ Todos os botões renderizados hoje são `<button>` simples (`src/app/page.tsx:25`, `src/app/parlamentares/page.tsx:58`, `src/app/parlamentares/[id]/contestar/formulario.tsx:75`), cobertos pela mesma regra global; o teste mede um deles. |

### P1: Pedir correção

| ID | Spec-defined outcome | `file:line` + assertion | Result |
| -- | -------------------- | ----------------------- | ------ |
| CORR-01 | 20–4000 → grava "recebido" + "Pedido recebido." | `tests/integracao/perfil.test.ts:189-197` - redireciona, `status: "recebido"`; `:204` - 4001 → erro; `tests/e2e/perfil.spec.ts:114` | ✅ |
| CORR-02 | < 20 → não grava + mensagem exata | `tests/integracao/perfil.test.ts:179-182` | ✅ |
| CORR-03 | "Contestar" pré-seleciona | `tests/e2e/perfil.spec.ts:110-111` - `toHaveValue("gastos")` | ✅ |

### P1: Coleta não invasiva

| ID | Spec-defined outcome | `file:line` + assertion | Result |
| -- | -------------------- | ----------------------- | ------ |
| COLETA-01 | UA `Auditaja/<v> (+<URL>; ...)` | `tests/unit/http.test.ts:38-39` | ✅ |
| COLETA-02 | robots na 1ª vez; proibido → `ColetaBloqueada` | `tests/unit/http.test.ts:36-37` | ✅ |
| COLETA-03 | 5xx/rede bloqueia; 4xx/HTML permite | `tests/unit/http.test.ts:44,47-57,62,67-68` | ✅ |
| COLETA-04 | max(1 s, Crawl-delay) | `tests/unit/http.test.ts:84-85,96-97` | ✅ |
| COLETA-05 | até 4 tentativas; Retry-After ou 2/4/8 s | `tests/unit/http.test.ts:106,112-114,120-121` | ✅ |
| COLETA-06 | 401/403 → `ColetaBloqueada`, 1 chamada | `tests/unit/http.test.ts:124-128` | ✅ |
| COLETA-07 | recoleta substitui em uma transação | `tests/integracao/coleta.test.ts:115-128,131-145` | ✅ |
| COLETA-08 | só nominais, sem duplicados | `tests/unit/transformacoes.test.ts:93-95` | ✅ |

### Edge Cases

| ID | Spec-defined outcome | `file:line` + assertion | Result |
| -- | -------------------- | ----------------------- | ------ |
| EDGE-01 | "Página não encontrada" + `noindex` | `tests/e2e/perfil.spec.ts:133-138` | ✅ |
| EDGE-02 | "Nenhuma despesa publicada para {ano}." | `tests/e2e/perfil.spec.ts:119` | ✅ |
| EDGE-03 | mensagem de ausência e "—" no indicador | `tests/e2e/perfil.spec.ts:120-123` | ✅ |
| EDGE-04 | 390 px sem rolagem horizontal | `playwright.config.ts:22`; `tests/e2e/perfil.spec.ts:128-129` | ✅ |
| EDGE-05 | seed fora de `_test` recusa, exit 1 | `tests/unit/seed-guard.test.ts:14-15` | ✅ |

**Status**: ⚠️ 49 ✅, 1 ⚠️ (UI-03), 0 ❌, de 50.

---

## Discrimination Sensor

Worktree descartável em HEAD `1eccac9`. Uma mutação por vez, por substituição exata de texto (o script confere que o trecho original aparece uma única vez), seguida de `pnpm test` completo; quando o Vitest não matou, também `pnpm build` e `pnpm test:e2e`. Depois de cada uma, `git checkout -- <arquivo>`.

### Os 3 sobreviventes da iteração 3

| Mutation | File:line | Description | Killed? |
| -------- | --------- | ----------- | ------- |
| U3 | `src/data/perfil.ts:48-50` | com UF reconhecida, usa só `sigla_uf = UF` (`ufBuscada ? eb("sigla_uf", "=", ufBuscada) : or([nome, nome_civil])`) | ✅ Killed (`perfil.test.ts:146`, linha `:152`) |
| U5 | `src/app/fontes/page.tsx:19-21` | troca o `<Suspense>` em volta de `<TabelaColetas />` por fragmento | ✅ Killed (`paginas.test.ts:31`, caso `/fontes`) |
| U6 | `src/app/parlamentares/page.tsx:15-17` | troca o `<Suspense>` em volta de `<Resultados />` por fragmento | ✅ Killed (`paginas.test.ts:31`, caso `/parlamentares`) |

### Mutações novas

| Mutation | File:line | Description | Killed? |
| -------- | --------- | ----------- | ------- |
| V1 | `src/app/globals.css:109-113` | remove a regra `cursor-not-allowed` dos botões desabilitados (UI-04) | ✅ Killed (e2e `perfil.spec.ts:141`, desktop e celular) |
| V2 | `src/app/globals.css:107` | remove `@apply cursor-pointer` (UI-04) | ✅ Killed (e2e `perfil.spec.ts:141`, desktop e celular) |
| V3 | `src/components/ui/button.tsx:6` | volta `disabled:cursor-not-allowed` para `disabled:pointer-events-none` | ❌ Survived (Vitest 78/78, build, e2e 38/38). Cosmético: o `Button` não tem nenhum consumidor, então nenhuma tela muda. |
| V4 | `src/data/perfil.ts:46` | escape sem `_` (`/[%\\]/g`) | ✅ Killed (`perfil.test.ts:158`, BUSCA-02) |
| V5 | `src/app/fontes/page.tsx:19-21` | `<Suspense fallback=…>{null}</Suspense>` e `<TabelaColetas />` fora dele | ❌ Survived (Vitest 78/78, build com `/fontes` ◐, e2e 38/38). O h1 sai da casca visível (ver UI-03). |

**Sensor depth**: lightweight ampliado (8 mutações nesta rodada)
**Sensor outcome**: 6/8 mortos. 3/3 da iteração 3 morrem; 3/5 das novas. V5 é lacuna real (Minor); V3 é cosmética.
**Isolation**: `git status --porcelain` do repositório real estava vazio antes e depois (comparados com `diff`: iguais). Worktree removido com `git worktree remove --force`; `git worktree list` mostra só o checkout principal. Nenhum `git stash`.

---

## Code Quality

| Principle | Status |
| --------- | ------ |
| Minimum code | ✅ UI-04 é uma regra CSS de 10 linhas em `@layer base` |
| Surgical changes | ⚠️ `src/components/ui/button.tsx` mudou sem consumidor (código morto hoje). A troca de `pointer-events-none` por `cursor-not-allowed` é necessária para o cursor aparecer, então a mudança é coerente com UI-04, mas não é verificável. |
| No scope creep | ✅ UI-04 foi acrescentado à spec e à tasks.md (T23) no mesmo commit |
| Matches patterns | ✅ |
| Spec-anchored outcome check | ⚠️ UI-03 parcial (V5) |
| Per-layer Coverage Expectation met | ⚠️ UI-03: falta afirmar que a parte com dados fica dentro do `<Suspense>` |
| Every test maps to a spec requirement | ✅ Os testes novos citam BUSCA-04, UI-03 e UI-04 no título |
| Documented guidelines followed: `AGENTS.md`, Test Coverage Matrix de tasks.md | ⚠️ ver acima |

Nota: o teste de UI-04 só mede o botão "Filtrar". Como os 3 `<button>` do app pegam a mesma regra global, isso basta hoje; se um botão passar a ter `cursor-*` próprio, o teste não vai notar.

---

## Fix Plans

### Fix 1 (Minor): UI-03, a parte com dados precisa estar dentro do `<Suspense>` (V5)
- **Root cause**: `temSuspense` em `tests/unit/paginas.test.ts:18-23` para no primeiro `Suspense` que acha e não olha o que ele envolve, nem se há componente assíncrono fora dele.
- **Fix task**: em `tests/unit/paginas.test.ts`, trocar `temSuspense` por uma função que percorre a árvore com um sinal "dentro de Suspense" e: (a) conta os elementos cujo `type` é função assíncrona (`typeof type === "function" && type.constructor.name === "AsyncFunction"`); (b) falha se algum deles aparecer fora de um `Suspense`; (c) exige pelo menos um dentro. Afirmar `toEqual({ dentro: >=1, fora: 0 })` (ou equivalente) nas 4 páginas.
- **Done when**: U5, U6 e V5 morrem.

### Fix 2 (Cosmetic, opcional): `Button` sem consumidor (V3)
- **Root cause**: `src/components/ui/button.tsx` não é importado em lugar nenhum; a mudança de UI-04 nele não tem como ser provada.
- **Fix task**: aceitar e registrar (é a variante certa para quando o componente for usado), ou trocar um dos `<button>` por `Button` e o e2e de UI-04 passa a cobri-lo. Ajustar o "Where" de T23 em tasks.md para listar também `src/components/ui/button.tsx`.
- **Done when**: decisão registrada; se trocar, V3 morre.

---

## Requirement Traceability Update

| Requirement | Previous | New |
| ----------- | -------- | --- |
| BUSCA-04 | Needs Fix (U3) | ✅ Verified |
| UI-04 | Implementing (novo) | ✅ Verified |
| UI-03 | Needs Fix (U5, U6) | ❌ Needs Fix (V5) |
| Os outros 47 | Verified | ✅ Verified (mantido) |

A tabela de rastreabilidade da spec tem 50 linhas (conferido), todas com status Verified ou Needs Fix.

---

## Summary

**Overall**: ❌ Not Ready (uma lacuna Minor, só de teste; produção está correta em HEAD)

**Spec-anchored check**: 49/50 batem com a spec; 1 parcial (UI-03); 0 sem evidência
**Sensor**: 6/8 mortos (3/3 da iteração 3; 3/5 novas; V3 cosmético, V5 Minor)
**Gate**: lint, typecheck, format, seed ✅; Vitest 78 passaram, 0 falharam, 0 pulados; build ✅; Playwright 38/38

**What works**: as duas lacunas da iteração 3 estão fechadas e provadas pelo sensor (a busca por UF soma ao nome; tirar o `<Suspense>` de uma página derruba um teste). UI-04 está implementado e coberto em desktop e 390 px.

**Issues found**: V5 (UI-03, Fix 1, Minor: só teste, cerca de 15 linhas em `paginas.test.ts`); V3 (Fix 2, Cosmetic: `Button` sem consumidor).

**Next steps**: aplicar Fix 1 e reverificar só UI-03 (U5, U6, V5), ou o usuário aceita a lacuna registrada. Fix 2 é opcional.
