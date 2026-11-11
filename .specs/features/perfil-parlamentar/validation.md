# Validation Report: perfil-parlamentar — FAIL

**Date**: 2026-11-11
**Spec**: `.specs/features/perfil-parlamentar/spec.md`
**Diff range**: `1eeedc4..34fcdb3` (branch `feat/perfil-parlamentar`; HEAD avançou de `1f99e7a` para `34fcdb3` durante a verificação)
**Verifier**: sub-agente independente (author ≠ verifier)

**Verdict**: FAIL — (1) o build de produção falha em HEAD `34fcdb3`; (2) 13 dos 41 critérios não têm evidência `file:line`; (3) 6 de 10 mutantes sobreviveram.

---

## Task Completion

| Task | Status | Notes |
| ---- | ------ | ----- |
| T1–T12 | ✅ Marcadas como done (retroativo) | As checkboxes de tasks.md foram conferidas contra o código e os testes, não aceitas como verdade. O build quebrado em HEAD vem de `34fcdb3` (fora das tarefas, `src/components/nav-principal.tsx`). |

---

## Gate Check

Rodado num git worktree descartável (com cópia de `node_modules`). O dev server do usuário na porta 3000 não foi tocado. O pnpm 11 recusou o symlink de `node_modules` (verificação de deps), então os binários rodaram direto de `node_modules/.bin`, com os mesmos comandos dos scripts de `package.json`.

| Passo | HEAD `34fcdb3` | `1f99e7a` (último commit da spec) |
| ----- | -------------- | --------------------------------- |
| `pnpm lint` | ✅ | (mesmo código, exceto a nav) |
| `pnpm typecheck` | ✅ | — |
| `pnpm format:check` | ✅ | — |
| `pnpm db:seed:test` | ✅ "Seed fictício aplicado." | — |
| `pnpm test` (Vitest) | ✅ 43/43 passaram, 6 arquivos, 0 skip (os 3 testes de integração rodaram de fato, nenhum `ctx.skip`) | ✅ |
| `pnpm build` | ❌ **FALHA**: `Route "/parlamentares/[id]": usePathname() in a Client Component outside of <Suspense>` em `src/components/nav-principal.tsx:14` (prerender com Cache Components) | ✅ |
| `pnpm test:e2e` (Playwright, `PW_CHROME`) | não roda (sem build) | ✅ 10/10 (5 testes × desktop + Pixel 7) |

- **Contagem antes da feature**: 0 testes (`c5b06ce` não tem testes).
- **Contagem depois**: 43 Vitest + 5 Playwright (×2 projetos = 10 execuções). Delta +48. Nenhum teste removido ou enfraquecido.
- **Skipped**: nenhum.
- **Falhas**: build em HEAD (acima). Como o gate de build falhou em HEAD, o restante da verificação foi feito sobre `1f99e7a`, cujo código da feature é idêntico (a nav só mexe em `src/components/topo.tsx` e `nav-principal.tsx`).

---

## Spec-Anchored Acceptance Criteria

Legenda: ✅ a asserção mira o resultado definido na spec · ⚠️ parcial ou spec-precision gap (só parte do critério é afirmada, ou a asserção é vaga) · ❌ GAP (sem citação `file:line` = não coberto).

### P1: Encontrar um deputado

| ID | Spec-defined outcome | `file:line` + assertion | Result |
| -- | -------------------- | ----------------------- | ------ |
| BUSCA-01 | só em exercício; nome parlamentar **ou** civil; sem acento/caixa | `tests/integracao/perfil.test.ts:52` - `expect((await buscarParlamentares({ q: "joao" })).map(r => r.id)).toEqual([SEED.deputado])` | ⚠️ Cobre acento e caixa. O filtro de em exercício (os dois deputados do seed estão em exercício) e o casamento só pelo nome civil não são discriminados. |
| BUSCA-02 | `%` e `_` literais | `tests/integracao/perfil.test.ts:53` - `expect((await buscarParlamentares({ q: "%" })).length).toBe(0)` | ⚠️ `%` coberto; `_` não testado |
| BUSCA-03 | abre `/parlamentares/{id}` com o nome no h1 | `tests/e2e/perfil.spec.ts:7-8` - `getByRole("heading", { level: 1, name: "Maria Exemplo" })).toBeVisible()` | ✅ (URL não afirmada; o h1 basta como resultado) |

### P1: Ver gastos da cota (CEAP)

| ID | Spec-defined outcome | `file:line` + assertion | Result |
| -- | -------------------- | ----------------------- | ------ |
| CEAP-01 | total = soma de `valor_liquido` no ano | `tests/integracao/perfil.test.ts:36` - `expect(p.ceap.totalAno).toBe(44100)` | ✅ |
| CEAP-02 | por tipo, decrescente | `tests/integracao/perfil.test.ts:37` - `expect(p.ceap.porTipo[0].tipo).toMatch(/DIVULGAÇÃO/)` | ✅ (só o primeiro; a ordem ascendente mudaria o primeiro e seria pega) |
| CEAP-03 | até 8 fornecedores com documento publicável e total | `tests/integracao/perfil.test.ts:38` só lê o doc do fornecedor PF, que já vem mascarado do seed (tautológico). O limite de 8 e o total não são afirmados. Mutante M9 sobreviveu. | ❌ GAP |
| CEAP-04 | `?ano=` sem despesas → ano mais recente | nenhuma | ❌ GAP (mutante M8 sobreviveu) |
| CEAP-05 | sem teto verificado → omitir a comparação | nenhuma | ❌ GAP |

### P1: Ver votações e alinhamento

| ID | Spec-defined outcome | `file:line` + assertion | Result |
| -- | -------------------- | ----------------------- | ------ |
| VOTO-01 | presença = com voto / total do Plenário | `tests/integracao/perfil.test.ts:41-42` - `totalPlenario).toBe(3)`, `presentes).toBe(2)`; `tests/e2e/perfil.spec.ts:14` - `"67%"` | ✅ |
| VOTO-02 | precedência partido → federação → bloco; ignora vazia | `tests/unit/metrics.test.ts:29-38` - `toEqual({ orientacao: "Sim", tipo: "partido" })` (partido > bloco); `:41-44` - vazia → `toBeNull()` | ⚠️ Federação > bloco e partido > federação não testados |
| VOTO-03 | só Sim/Não × Sim/Não; diferente = divergência | `tests/unit/metrics.test.ts:51-58` - `toEqual({ comparaveis: 2, iguais: 1, divergencias: 1 })` | ✅ (mutante M7 morto) |
| VOTO-04 | sigla completa só por igualdade (PSD ≠ PSDB) | `tests/unit/metrics.test.ts:20,26` - `tipoBancadaParaPartido("Bl UniPpPsd...", "PSDB")).toBeNull()` | ✅ (mutante M2 morto) |
| VOTO-05 | filtro "Divergiu" lista só Sim/Não divergentes | `tests/e2e/perfil.spec.ts:25-26` - PEC `toBeVisible()`, PL `toHaveCount(0)` | ✅ |
| VOTO-06 | sem voto → texto "sem registro" | `tests/integracao/perfil.test.ts:44` afirma só `voto: null` no dado; nenhum teste afirma o texto "sem registro" (`src/components/perfil/secoes.tsx:247`) | ❌ GAP |

### P1: Ver bens declarados ao TSE

| ID | Spec-defined outcome | `file:line` + assertion | Result |
| -- | -------------------- | ----------------------- | ------ |
| BENS-01 | total por eleição casada | `tests/integracao/perfil.test.ts:45` - `new Set(p.bens.map(b => b.ano_eleicao))).toEqual(new Set([2022, 2026]))` | ⚠️ Só os anos; o total de cada eleição não é afirmado |
| BENS-02 | `round((atual-anterior)/anterior*100)`; anterior 0 → nada | `tests/unit/metrics.test.ts:73-74` - `variacaoNominal(100,122)).toBe(22)`, `variacaoNominal(0,10)).toBeNull()` | ✅ (o arredondamento em si não é exercitado) |
| BENS-03 | só tipo e valor, nunca a descrição | `tests/unit/transformacoes.test.ts:150-151` - `toMatchObject({ tipo: "Casa", valor: 350000 })`, `not.toContain("RUA")` | ✅ |
| BENS-04 | casamento ambíguo descartado | `tests/unit/transformacoes.test.ts:130-131` - `toHaveLength(1)`, `sq_candidato: "10"` (homônimos RJ descartados) | ✅ |

### P1: Proveniência e privacidade

| ID | Spec-defined outcome | `file:line` + assertion | Result |
| -- | -------------------- | ----------------------- | ------ |
| PROV-01 | lote com fonte, URL, data, SHA-256, bytes e licença; registros ligados ao lote | só `tests/integracao/perfil.test.ts:46` - `coletas.camara_ceap?.url).toContain("camara.leg.br")`, um valor do seed. `registrarColeta` e o `coleta_id` não são testados. | ❌ GAP |
| PROV-02 | toda seção: rótulo, data da coleta, "Ver na fonte" | `tests/e2e/perfil.spec.ts:17` - `/Fonte: Câmara dos Deputados, Dados Abertos \(CEAP/` | ⚠️ Só o rótulo da seção CEAP; a data, o link e as outras seções não |
| PRIV-01 | `***.XXX.XXX-**` | `tests/unit/privacy.test.ts:6-7` - `toBe("***.456.789-**")` | ✅ (mutante M1 morto) |
| PRIV-02 | PF → "Prestador pessoa física" | `tests/unit/privacy.test.ts:30`; `tests/unit/transformacoes.test.ts:28` | ✅ |
| PRIV-03 | descarta passageiro e CPF do parlamentar | `tests/unit/transformacoes.test.ts:31-32` - `not.toContain("Passageira")`, `not.toContain("11122233344")` | ✅ |
| PRIV-04 | nem 11 nem 14 dígitos → sem documento | `tests/unit/privacy.test.ts:25-26` - `toEqual({ doc: null, classe: "desconhecido" })` | ✅ |
| PRIV-05 | rodapé com controlador **e** encarregado | `tests/e2e/perfil.spec.ts:18` - `/Encarregado \(LGPD\)/` | ⚠️ "Controlador" não afirmado |

### P1: Pedir correção

| ID | Spec-defined outcome | `file:line` + assertion | Result |
| -- | -------------------- | ----------------------- | ------ |
| CORR-01 | 20–4000 caracteres → grava com status "recebido" + "Pedido recebido." | `tests/e2e/perfil.spec.ts:33` - `getByText("Pedido recebido.")).toBeVisible()` | ⚠️ Linha gravada e status "recebido" não verificados; limite de 4000 não testado |
| CORR-02 | < 20 caracteres → não grava + mensagem exata | nenhuma | ❌ GAP |
| CORR-03 | "Contestar" pré-seleciona a seção | `tests/e2e/perfil.spec.ts:30` só navega com `?secao=gastos`; o valor do `<select>` não é afirmado | ❌ GAP |

### P1: Coleta não invasiva

| ID | Spec-defined outcome | `file:line` + assertion | Result |
| -- | -------------------- | ----------------------- | ------ |
| COLETA-01 | UA `Auditaja/<v> (+<URL>; ...)` em toda requisição | `tests/unit/http.test.ts:35-36` - `chamadas[0].ua).toBe(USER_AGENT)`, `toMatch(/^Auditaja\/.+\(\+https?:\/\//)` | ✅ |
| COLETA-02 | lê robots na 1ª vez; caminho proibido → `ColetaBloqueada` | `tests/unit/http.test.ts:33-34` - `rejects.toBeInstanceOf(ColetaBloqueada)`, `chamadas).toHaveLength(1)`; parser em `tests/unit/robots.test.ts:9-34` | ✅ |
| COLETA-03 | 5xx/rede → bloqueia; 4xx/HTML → permite | `tests/unit/http.test.ts:46` (5xx → bloqueia, mutante M4 morto); `:41` (404 → permite) | ⚠️ O robots em HTML (o título do teste diz que cobre, mas a rota não existe) e a falha de rede não são testados |
| COLETA-04 | espera = max(1 s, Crawl-delay) | `tests/unit/http.test.ts:61` - `esperas.some(ms => ms > 4000)).toBe(true)` | ⚠️ Spec-precision gap: a asserção é vaga (`> 4000` em vez de ≈5000) e o piso de 1 s sem Crawl-delay não é testado |
| COLETA-05 | 429/5xx: até 4 tentativas; Retry-After ou 2/4/8 s | `tests/unit/http.test.ts:70` - `esperas).toContain(7000)` | ❌ GAP: backoff 2/4/8 s, limite de 4 tentativas e repetição em 5xx não testados (mutantes M5 e M10 sobreviveram) |
| COLETA-06 | 401/403 → `ColetaBloqueada`, sem nova tentativa | `tests/unit/http.test.ts:71` - só 403 → `rejects.toBeInstanceOf(ColetaBloqueada)` | ❌ GAP: 401 não testado (mutante M3 sobreviveu); o número de chamadas ("sem nova tentativa") não é afirmado |
| COLETA-07 | recoleta substitui o ano em uma transação | nenhuma (`src/ingest/camara.ts:236-239` sem teste) | ❌ GAP |
| COLETA-08 | só votações nominais; sem votos ou orientações duplicados | `tests/unit/transformacoes.test.ts:92-94` - `ids).toEqual(["a"])`, `votos).toHaveLength(1)`, `orientacoes).toHaveLength(1)` | ⚠️ Deduplicação de orientações não exercitada (a única duplicata é filtrada por ser não nominal); mutante M6 sobreviveu |

### Edge Cases

| ID | Spec-defined outcome | `file:line` + assertion | Result |
| -- | -------------------- | ----------------------- | ------ |
| EDGE-01 | id não numérico **ou** inexistente → "Página não encontrada" + `noindex` | `tests/e2e/perfil.spec.ts:38-40` - heading `toBeVisible()`, `meta[name="robots"][content*="noindex"]` count > 0; `tests/integracao/perfil.test.ts:59` - `toBeNull()` | ⚠️ Só id inexistente; id não numérico (`/parlamentares/abc`) não testado |
| EDGE-02 | "Nenhuma despesa publicada para {ano}." | nenhuma | ❌ GAP |
| EDGE-03 | mensagem de ausência de bens + "—" | nenhuma (o seed do João Ilustrativo serviria) | ❌ GAP |
| EDGE-04 | 390 px sem rolagem horizontal | `tests/e2e/perfil.spec.ts:19-20` - `scrollWidth <= viewportSize().width`, rodando em Pixel 7 (412 px) e desktop | ⚠️ Spec-precision gap: a largura testada não é 390 px |
| EDGE-05 | seed fora de `_test` → recusa, exit 1 | nenhum teste automatizado. Conferido à mão: `scripts/seed.ts:7-9` com `DATABASE_URL=…/naoexiste` imprimiu "Seed recusado…" e saiu com 1 | ❌ GAP (evidence-or-zero) |

**Status**: ❌ Gaps presentes. 16 ✅, 12 ⚠️, 13 ❌, de 41.

---

## Discrimination Sensor

Worktree descartável em `1f99e7a` (código da feature idêntico ao de HEAD). Uma mutação por vez, Vitest completo (unit + integração no Postgres) e depois `git checkout -- <arquivo>`. O e2e não foi rodado contra os mutantes: nenhum teste e2e usa `?ano=` ou passa de 8 fornecedores, então ele também não mataria M8 e M9.

| Mutation | File:line | Description | Killed? |
| -------- | --------- | ----------- | ------- |
| M1 | `src/lib/privacy.ts:13` | máscara expõe os 2 últimos dígitos (`-**` → `-${d.slice(9)}`) | ✅ Killed (privacy, transformacoes) |
| M2 | `src/lib/metrics.ts:40` | remove a guarda `SIGLAS_COMPLETAS` em `casaAbreviado` | ✅ Killed (`metrics.test.ts:20`) |
| M3 | `src/ingest/http.ts:90` | `401 \|\| 403` → só `403` | ❌ Survived |
| M4 | `src/ingest/http.ts:68` | robots 5xx → `PERMITE_TUDO` | ✅ Killed (`http.test.ts:44`) |
| M5 | `src/ingest/http.ts:98` | backoff `2000 * 2 ** (t-1)` → `1000` fixo | ❌ Survived |
| M6 | `src/ingest/camara.ts:145` | chave de orientação única por linha (sem deduplicação) | ❌ Survived |
| M7 | `src/lib/metrics.ts:103` | alinhamento deixa de exigir voto Sim/Não | ✅ Killed (`metrics.test.ts:49`) |
| M8 | `src/data/perfil.ts:102` | `?ano=` sem despesas é aceito no lugar de cair no ano mais recente | ❌ Survived |
| M9 | `src/data/perfil.ts:134` | `.limit(8)` → `.limit(80)` | ❌ Survived |
| M10 | `src/ingest/http.ts:20` | `MAX_TENTATIVAS` 4 → 9 | ❌ Survived |

**Sensor depth**: lightweight ampliado (10 mutações; coleta e privacidade são caminhos de conformidade legal)
**Sensor outcome**: 4/10 mortos, 6 sobreviveram → os testes não discriminam esses comportamentos
**Isolation**: `git status --porcelain` do repositório real estava vazio antes e depois (iguais); worktree removido com `git worktree remove --force`.

---

## Code Quality

| Principle | Status |
| --------- | ------ |
| Minimum code | ✅ |
| Surgical changes | ⚠️ `34fcdb3` (nav com página ativa) entrou depois da spec, fora das tarefas, e quebrou o build |
| No scope creep | ⚠️ filtro "Sem voto registrado" (`secoes.tsx:195`), órgãos/comissões e `/metodologia` existem sem AC na spec |
| Matches patterns | ✅ |
| Spec-anchored outcome check | ❌ 13 sem evidência, 12 parciais |
| Per-layer Coverage Expectation met | ❌ A matriz exige "todos os ramos" em http (401, backoff, limite de tentativas faltam) e "feliz + edge + erro" nas rotas (CORR-02, EDGE-02/03, id não numérico faltam) |
| Every test maps to a spec requirement | ✅ (testes de `numeroBr`/`dataBr` e de `montarParlamentares` apoiam BUSCA e BENS indiretamente) |
| Documented guidelines followed: `AGENTS.md`, tasks.md Test Coverage Matrix | ⚠️ ver acima |

Notas:
- `tests/integracao/perfil.test.ts:38` e `tests/e2e/perfil.spec.ts:16` afirmam `***.456.789-**`, mas o seed (`src/db/seed.ts`, despesa do mês 3) já grava o valor mascarado. Esses testes não provam o mascaramento da ingestão; só os testes unitários provam.
- O título de `tests/unit/http.test.ts:39` promete "página HTML no lugar do robots também", mas a rota HTML não existe no teste.

---

## Fix Plans

### Fix 1 (Blocker): build de produção quebrado em HEAD
- **Root cause**: `NavPrincipal` (`src/components/nav-principal.tsx:14`) usa `usePathname()` fora de `<Suspense>`; com Cache Components isso bloqueia o prerender de `/parlamentares/[id]`.
- **Fix task**: em `src/components/topo.tsx`, envolver `<NavPrincipal />` em `<Suspense fallback={<nav … sem item ativo/>}>`.
- **Done when**: `pnpm build && pnpm test:e2e` passam em HEAD.

### Fix 2 (Major): COLETA-05/06, cliente HTTP (M3, M5, M10)
- Em `tests/unit/http.test.ts`:
  - 401 → `rejects.toBeInstanceOf(ColetaBloqueada)` e `chamadas.filter(c => c.url.endsWith("/b")).length === 1`.
  - 503 ×4 sem Retry-After → `rejects.toThrow(/HTTP 503/)`, `esperas` contém `[2000, 4000, 8000]` em ordem e exatamente 4 chamadas à URL.
  - 503 → 200 → resolve.

### Fix 3 (Major): CEAP-03/04/05 (M8, M9)
- Em `tests/integracao/perfil.test.ts`:
  - `perfilParlamentar(SEED.deputada, 2019)` → `ano).toBe(2026)`.
  - Seed (ou fixture local do teste) com 9 fornecedores → `fornecedores).toHaveLength(8)` e `fornecedores[0].total` igual ao maior.
  - `ceap.teto).toBeNull()` e `tetoAcumulado).toBeNull()`.
  - No e2e, afirmar `"teto por UF em verificação"` e a ausência de "% do teto".

### Fix 4 (Major): CORR-02/03 e CORR-01 (status)
- Em `tests/e2e/perfil.spec.ts`:
  - `expect(page.getByLabel("Qual parte do perfil?")).toHaveValue("gastos")`.
  - Descrição curta enviada pela Server Action (remover `minLength` via `evaluate` ou chamar `enviarPedido` num teste de integração) → `"Descreva o erro com pelo menos 20 caracteres."` e nenhuma linha nova em `pedido_correcao`.
- No teste de integração, depois do envio, `pedido_correcao.status === "recebido"`.

### Fix 5 (Major): COLETA-07 / PROV-01, ingestão no Postgres
- Novo teste de integração: `coletarCeap` com `ClienteEducado` sobre `fetch` falso servindo um zip pequeno, rodado duas vezes no mesmo ano → contagem de `despesa_ceap` do ano igual nas duas vezes. Afirmar também que a linha de `coleta` tem `sha256`, `bytes`, `licenca` e `url`, e que as despesas têm `coleta_id` igual ao da coleta.

### Fix 6 (Minor): edge cases e UI
- e2e:
  - João Ilustrativo (sem despesas e sem bens) → `"Nenhuma despesa publicada para"` e a mensagem "Não encontramos declarações de bens" (EDGE-02/03).
  - `/parlamentares/abc` → "Página não encontrada" (EDGE-01).
  - Projeto Playwright com viewport 390×844 (EDGE-04).
  - `getByText("sem registro")` no perfil (VOTO-06).
  - `Controlador:` no rodapé (PRIV-05).
  - `getByRole("link", { name: "Ver na fonte" })` e "coletado em" em cada seção (PROV-02).
- unit:
  - orientações duplicadas `a|PL` ×2 → length 1 (COLETA-08, M6).
  - federação vence bloco (VOTO-02).
  - `q: "_"` → 0 resultados (BUSCA-02).
  - deputado fora de exercício não aparece (BUSCA-01).
  - `http.test.ts` com robots `text/html` e `fetch` que lança erro (COLETA-03).
  - Crawl-delay: `Math.max(...esperas)` entre 4900 e 5000; sem Crawl-delay, espera ≤ 1000 (COLETA-04).
- EDGE-05: teste que roda `tsx scripts/seed.ts` com `DATABASE_URL=postgres://x@127.0.0.1:1/prod` via `execa` e espera exit 1.

---

## Requirement Traceability Update

| Requirement | Previous | New |
| ----------- | -------- | --- |
| BUSCA-03, CEAP-01, CEAP-02, VOTO-01, VOTO-03, VOTO-04, VOTO-05, BENS-02, BENS-03, BENS-04, PRIV-01, PRIV-02, PRIV-03, PRIV-04, COLETA-01, COLETA-02 | Implementing | ✅ Verified |
| BUSCA-01, BUSCA-02, CEAP-03, CEAP-04, CEAP-05, VOTO-02, VOTO-06, BENS-01, PROV-01, PROV-02, PRIV-05, CORR-01, CORR-02, CORR-03, COLETA-03, COLETA-04, COLETA-05, COLETA-06, COLETA-07, COLETA-08, EDGE-01, EDGE-02, EDGE-03, EDGE-04, EDGE-05 | Implementing | ❌ Needs Fix |

---

## Summary

**Overall**: ❌ Not Ready

**Spec-anchored check**: 16/41 batem com a spec; 12 parciais ou com spec-precision gap; 13 sem evidência
**Sensor**: 4/10 mutações mortas
**Gate**: Vitest 43 passaram, 0 falharam; Playwright 10/10 em `1f99e7a`; `pnpm build` falha em HEAD `34fcdb3`

**What works**: regras puras de privacidade (máscara, PF, descarte de passageiro e CPF), precedência e casamento de siglas, alinhamento, robots e bloqueio por 5xx, agregações principais do perfil, fluxo feliz de busca, perfil, filtro e correção.

**Issues found**: build quebrado pela nav nova; cliente HTTP sem testes de 401, backoff e limite de tentativas; ano de fallback, limite de fornecedores e omissão do teto sem teste; correção sem caminho de erro nem pré-seleção; recoleta e proveniência sem teste de integração; edge cases 02/03/05 sem teste.

**Next steps**: Fix 1 (blocker) → Fixes 2–5 → Fix 6 → re-verificação (iteração 1 de 3).
