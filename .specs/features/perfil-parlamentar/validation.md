# Validation Report: perfil-parlamentar — FAIL (iteração 2 de 3)

**Date**: 2026-11-11
**Spec**: `.specs/features/perfil-parlamentar/spec.md` (46 requisitos: os 41 da iteração 1 + VOTO-07, MAND-01, METOD-01, NAV-01, UI-02)
**Diff range**: `1eeedc4..c76b4d6` (branch `feat/perfil-parlamentar`); correções desde a iteração 1: `34fcdb3..c76b4d6`
**Verifier**: sub-agente independente, novo (author ≠ verifier). As afirmações do autor em tasks.md não foram aceitas: cada critério foi conferido no código e nos testes, e o sensor foi rodado de novo.

**Verdict**: FAIL. O gate inteiro passa e todos os 46 critérios têm evidência `file:line` (nenhum ❌). Mas 6 de 15 mutantes sobreviveram e 7 critérios estão só parcialmente provados. Pelas regras do validate.md, mutante sobrevivente vira tarefa de correção antes de fechar a feature.

---

## O que mudou desde a iteração 1

| Iteração 1 | Iteração 2 |
| ---------- | ---------- |
| `pnpm build` falhava em HEAD (`usePathname` fora de `<Suspense>`) | ✅ Build passa: `src/components/topo.tsx:24-26` envolve `<NavPrincipal />` em `<Suspense fallback={<NavPrincipalEstatica />}>` |
| 16 ✅ / 12 ⚠️ / 13 ❌ de 41 | 39 ✅ / 7 ⚠️ / 0 ❌ de 46 |
| Sensor: 4/10 mortos | Sensor: os 6 sobreviventes (M3, M5, M6, M8, M9, M10) agora morrem; 9 mutações novas, 3 mortas e 6 sobreviventes; total 9/15 |
| Vitest 43, Playwright 10 | Vitest 67 (8 arquivos), Playwright 28 (14 testes × desktop e 390 px) |
| Asserções de máscara tautológicas (o seed já gravava mascarado) | Máscara provada pela ingestão real: `tests/integracao/coleta.test.ts:95-105`, a partir de um CPF bruto num zip falso |

---

## Task Completion

| Task | Status | Notes |
| ---- | ------ | ----- |
| T1–T12 | ✅ Done | Conferidas na iteração 1. Nenhuma regressão no gate. |
| T13 (rodapé) | ✅ Done | `tests/e2e/perfil.spec.ts:39-42` |
| T14 (menu com página ativa) | ⚠️ Partial | O build passa. Mas o teste só cobre uma subpágina (`/parlamentares/{id}`); a página exata do menu não é testada (mutante N1 sobreviveu). |
| T15 (cliente HTTP) | ⚠️ Partial | M3, M5 e M10 morrem. O teste de robots em HTML não discrimina (N7 sobreviveu). |
| T16 (métricas) | ⚠️ Partial | M6 morre; federação > bloco testado. Partido > federação não testado (N3 sobreviveu). |
| T17 (integração do perfil) | ✅ Done | M8 e M9 morrem; CORR-01/02 por Server Action com linha gravada. |
| T18 (coleta de ponta a ponta) | ⚠️ Partial | Lote, `coleta_id`, máscara e recoleta sem duplicar estão provados. A atomicidade ("em uma transação") não é testada (N6 sobreviveu). |
| T19 (e2e) | ✅ Done | 28 testes passam. Lacunas menores em MAND-01 e EDGE-03 (abaixo). |

---

## Gate Check

Rodado num git worktree descartável (`git worktree add … HEAD`, cópia de `node_modules` e dos `.env`). O dev server do usuário na porta 3000 não foi tocado; o build e o e2e rodaram só no worktree (porta 3212). O pnpm 11 recusa a cópia de `node_modules` na verificação de dependências (`ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY`), então os scripts rodaram como `pnpm --config.verify-deps-before-run=false <script>`, sem mudar os comandos.

| Passo | HEAD `c76b4d6` |
| ----- | -------------- |
| `pnpm lint` | ✅ |
| `pnpm typecheck` | ✅ |
| `pnpm format:check` | ✅ |
| `pnpm db:seed:test` | ✅ |
| `pnpm test` (Vitest) | ✅ 67/67 passaram, 8 arquivos, 0 skip (os testes de integração rodaram contra o Postgres; nenhum `ctx.skip`) |
| `pnpm build` | ✅ Compilou e fez o prerender de todas as rotas (`/parlamentares/[id]` como Partial Prerender) |
| `pnpm test:e2e` (`PW_CHROME`) | ✅ 28/28 (14 testes × `desktop` e `celular` 390×844) |

- **Contagem antes da feature**: 0 testes.
- **Contagem na iteração 1**: 43 Vitest + 10 execuções Playwright.
- **Contagem agora**: 67 Vitest + 28 execuções Playwright. Delta desde a iteração 1: +24 Vitest, +18 e2e. Nenhum teste removido; nenhuma asserção enfraquecida (a de `perfil.test.ts:38`, tautológica, foi trocada pela prova na ingestão).
- **Skipped**: nenhum.
- **Falhas**: nenhuma.

---

## Spec-Anchored Acceptance Criteria

Legenda: ✅ a asserção mira o resultado definido na spec · ⚠️ parcial (parte do critério não é afirmada, ou um mutante na regra sobreviveu) · ❌ sem citação `file:line`.

### P1: Encontrar um deputado

| ID | Spec-defined outcome | `file:line` + assertion | Result |
| -- | -------------------- | ----------------------- | ------ |
| BUSCA-01 | só em exercício; nome parlamentar ou civil; sem acento/caixa | `tests/integracao/perfil.test.ts:134` - `buscarParlamentares({ q: "joao" })…toEqual([SEED.deputado])`; `:135` - `q: "EXEMPLO DA SILVA"` (só o nome civil contém) `toEqual([SEED.deputada])`; `:141` - `q: "joana"` (fora de exercício) `toEqual([])`, `:142` com `todos: true` encontra | ✅ |
| BUSCA-02 | `%` e `_` literais | `tests/integracao/perfil.test.ts:148-149` - `q: "%"` e `q: "_"` → `toEqual([])` (como curinga, `_` casaria todos) | ✅ |
| BUSCA-03 | abre `/parlamentares/{id}` com o nome no h1 | `tests/e2e/perfil.spec.ts:10-11` - `toHaveURL(/\/parlamentares\/900000001$/)`, heading level 1 "Maria Exemplo" | ✅ |

### P1: Ver gastos da cota (CEAP)

| ID | Spec-defined outcome | `file:line` + assertion | Result |
| -- | -------------------- | ----------------------- | ------ |
| CEAP-01 | total = soma de `valor_liquido` no ano | `tests/integracao/perfil.test.ts:38` - `totalAno).toBe(44100)` | ✅ |
| CEAP-02 | por tipo, decrescente | `tests/integracao/perfil.test.ts:39` - `porTipo.map(t => t.total)).toEqual([30000, 9600, 4500])` | ✅ |
| CEAP-03 | até 8 maiores fornecedores com total | `tests/integracao/perfil.test.ts:86-88` - 9 fornecedores inseridos → `toHaveLength(8)`, primeiro `{ "Fornecedor 9", total: 900 }`, último `{ "Fornecedor 2", total: 200 }` (M9 morto) | ✅ |
| CEAP-04 | `?ano=` sem despesas → ano mais recente | `tests/integracao/perfil.test.ts:46-48` - `perfilParlamentar(deputada, 2019)` → `ano).toBe(2026)` (M8 morto) | ✅ |
| CEAP-05 | sem teto verificado → omitir comparação | `tests/integracao/perfil.test.ts:55-56` - `teto).toBeNull()`, `tetoAcumulado).toBeNull()`; `tests/e2e/perfil.spec.ts:22` - "teto por UF em verificação" | ✅ |

### P1: Ver votações e alinhamento

| ID | Spec-defined outcome | `file:line` + assertion | Result |
| -- | -------------------- | ----------------------- | ------ |
| VOTO-01 | presença = votações com voto **não vazio** / total do Plenário | `tests/integracao/perfil.test.ts:96-97` - `totalPlenario).toBe(3)`, `presentes).toBe(2)`; `tests/e2e/perfil.spec.ts:18-19` - "67%", "2 de 3 em 2026" | ⚠️ O seed não tem linha de voto com `voto = ""`, então o filtro de voto vazio não é exercitado. Mutante N5 (`votos.filter(v => v.voto !== "").length` → `votos.length`, `src/data/perfil.ts:192`) sobreviveu. |
| VOTO-02 | precedência partido → federação → bloco; ignora vazia | `tests/unit/metrics.test.ts:41-50` - federação > bloco `toEqual({ orientacao: "Sim", tipo: "federacao" })` (N4 morto); `:53-62` - só bloco → `tipo: "bloco"`; `:29-38` - partido > bloco; `:65-68` - vazia → `toBeNull()` | ⚠️ Partido > federação não é testado: o título de `:29` promete "partido direto tem precedência sobre federação e bloco", mas o fixture só tem bloco e partido. Mutante N3 (`PRECEDENCIA` → `["federacao", "partido", "bloco"]`, `src/lib/metrics.ts:78`) sobreviveu. |
| VOTO-03 | só Sim/Não × Sim/Não; diferente = divergência | `tests/unit/metrics.test.ts:82` - `toEqual({ comparaveis: 2, iguais: 1, divergencias: 1 })`; `tests/integracao/perfil.test.ts:98` - mesmo valor no banco | ✅ |
| VOTO-04 | sigla completa só por igualdade (PSD ≠ PSDB) | `tests/unit/metrics.test.ts:20,26` - `tipoBancadaParaPartido("Bl UniPpPsd...", "PSDB")).toBeNull()` | ✅ |
| VOTO-05 | filtro "Divergiu" lista só Sim/Não divergentes | `tests/e2e/perfil.spec.ts:47-49` - PEC `toBeVisible()`, PL e MPV `toHaveCount(0)` | ✅ |
| VOTO-06 | sem voto → "Votou: sem registro" | `tests/e2e/perfil.spec.ts:55` - `getByText("Votou: sem registro")).toBeVisible()` | ✅ |
| VOTO-07 | filtro "Sem voto registrado" lista só votações sem voto | `tests/e2e/perfil.spec.ts:53-57` - `?votos=ausencias`: MPV visível, PEC e PL `toHaveCount(0)` | ✅ |

### P1: Ver bens declarados ao TSE

| ID | Spec-defined outcome | `file:line` + assertion | Result |
| -- | -------------------- | ----------------------- | ------ |
| BENS-01 | total por eleição casada | `tests/integracao/perfil.test.ts:107-108` - `total(2022)).toBe(890000)`, `total(2026)).toBe(1050000)` | ✅ |
| BENS-02 | `round((atual-anterior)/anterior*100)`; anterior 0 → nada | `tests/unit/metrics.test.ts:97-98` - `variacaoNominal(100,122)).toBe(22)`, `variacaoNominal(0,10)).toBeNull()`; `tests/e2e/perfil.spec.ts:23` - "+18% sobre 2022" (17,98% arredondado: o arredondamento é exercitado) | ✅ |
| BENS-03 | só tipo e valor, nunca a descrição | `tests/unit/transformacoes.test.ts:151-152` - `toMatchObject({ tipo: "Casa", valor: 350000 })`, `not.toContain("RUA")` | ✅ |
| BENS-04 | casamento ambíguo descartado | `tests/unit/transformacoes.test.ts:131-132` - `toHaveLength(1)`, `sq_candidato: "10"` | ✅ |

### P1: Proveniência e privacidade

| ID | Spec-defined outcome | `file:line` + assertion | Result |
| -- | -------------------- | ----------------------- | ------ |
| PROV-01 | lote com fonte, URL, data, SHA-256, bytes, licença; registros ligados ao lote | `tests/integracao/coleta.test.ts:77-84` - lote `fonte = "camara_ceap"` `toMatchObject({ url, sha256: sha256De(zip), bytes: zip.length, licenca: LICENCA_CAMARA })`, `coleta_id` das despesas `toEqual([coleta.id, coleta.id])`. A data vem de `coletado_em NOT NULL` (`src/db/migrations/0001_init.ts:10`). | ✅ |
| PROV-02 | toda seção: rótulo, data da coleta, "Ver na fonte" | `tests/e2e/perfil.spec.ts:28-31` - nas seções gastos, votações e bens: `/^Fonte: .+ · coletado em \d{2}\/\d{2}\/\d{4}/` e link "Ver na fonte" | ✅ |
| PRIV-01 | `***.XXX.XXX-**` | `tests/unit/privacy.test.ts:6-7`; `tests/integracao/coleta.test.ts:96,102-103` - CPF bruto `123.456.789-01` do zip gravado como `***.456.789-**`, nada de `12345678901` | ✅ |
| PRIV-02 | PF → "Prestador pessoa física" | `tests/integracao/coleta.test.ts:97` - `fornecedor_nome: "Prestador pessoa física"`; `tests/unit/privacy.test.ts:30` | ✅ |
| PRIV-03 | descarta passageiro e CPF do parlamentar | `tests/integracao/coleta.test.ts:104-105` - `not.toContain("Passageira")`, `not.toContain("11122233344")` | ✅ |
| PRIV-04 | nem 11 nem 14 dígitos → sem documento | `tests/unit/privacy.test.ts:25-26` - `toEqual({ doc: null, classe: "desconhecido" })` | ✅ |
| PRIV-05 | rodapé "Controlador: …" e "Encarregado (LGPD): …" | `tests/e2e/perfil.spec.ts:39-40` - `/^Controlador: /`, `/^Encarregado \(LGPD\): /` | ✅ |

### P2: Contexto do mandato e fidelidade ao protótipo

| ID | Spec-defined outcome | `file:line` + assertion | Result |
| -- | -------------------- | ----------------------- | ------ |
| MAND-01 | lateral lista órgãos com cargo **sem data de fim**, **com o cargo** | `tests/e2e/perfil.spec.ts:62` - `getByText("Comissão de Finanças e Tributação")).toBeVisible()` | ⚠️ O cargo ("Titular") não é afirmado, e o seed não tem órgão com `data_fim`. Mutante N9 (remove `.where("data_fim", "is", null)`, `src/data/perfil.ts:240`) sobreviveu ao Vitest e ao e2e. |
| METOD-01 | `/metodologia` com "Versão {METODOLOGIA_VERSAO}." | `tests/e2e/perfil.spec.ts:76-77` - heading "Metodologia", `/^Versão 1\.0\./` | ✅ |
| NAV-01 | página do menu **ou abaixo dela** → `aria-current="page"` + sublinhado 2 px `#1F4FD1` | `tests/e2e/perfil.spec.ts:69-71` - em `/parlamentares/{id}`: `toHaveAttribute("aria-current", "page")`, `border-bottom-color` `rgb(31, 79, 209)`, Metodologia sem `aria-current` (N2 morto) | ⚠️ Só a subpágina é testada; na própria `/parlamentares` nada é afirmado. Mutante N1 (remove `pathname === href \|\|`, `src/components/nav-principal.tsx:26`) sobreviveu ao e2e. A largura de 2 px (`border-bottom-width`) também não é afirmada. |
| UI-02 | rodapé com fundo `#15181E` | `tests/e2e/perfil.spec.ts:42` - `toHaveCSS("background-color", "rgb(21, 24, 30)")` | ✅ |

### P1: Pedir correção

| ID | Spec-defined outcome | `file:line` + assertion | Result |
| -- | -------------------- | ----------------------- | ------ |
| CORR-01 | 20–4000 caracteres → grava com status "recebido" + "Pedido recebido." | `tests/integracao/perfil.test.ts:176-184` - redireciona para `?enviado=1`, linha `toMatchObject({ parlamentar_id, secao: "gastos", status: "recebido" })`; `:190-191` - 4001 caracteres → `r.erro).toBeTruthy()` (N8 morto); `tests/e2e/perfil.spec.ts:86` - "Pedido recebido." | ✅ (nota: a asserção acima de 4000 só checa que há erro; a spec não define a mensagem) |
| CORR-02 | < 20 → não grava + mensagem exata | `tests/integracao/perfil.test.ts:166-169` - `toEqual({ erro: "Descreva o erro com pelo menos 20 caracteres." })`, contagem de `pedido_correcao` igual | ✅ |
| CORR-03 | "Contestar" pré-seleciona a seção | `tests/e2e/perfil.spec.ts:82-83` - clique em Contestar de `section#gastos` → `getByLabel("Qual parte do perfil?")).toHaveValue("gastos")` | ✅ |

### P1: Coleta não invasiva

| ID | Spec-defined outcome | `file:line` + assertion | Result |
| -- | -------------------- | ----------------------- | ------ |
| COLETA-01 | UA `Auditaja/<v> (+<URL>; ...)` | `tests/unit/http.test.ts:38-39` - `ua).toBe(USER_AGENT)`, `toMatch(/^Auditaja\/.+\(\+https?:\/\//)` | ✅ |
| COLETA-02 | robots na 1ª vez; caminho proibido → `ColetaBloqueada` | `tests/unit/http.test.ts:36-37` - `rejects.toBeInstanceOf(ColetaBloqueada)`, `chamadas).toHaveLength(1)` | ✅ |
| COLETA-03 | 5xx/rede → bloqueia; 4xx/HTML → permite | `tests/unit/http.test.ts:61` (503 → bloqueia); `:66-67` (rede → bloqueia, 0 chamadas ao recurso); `:44` (404 → permite); `:56` (HTML → permite) | ⚠️ O teste do HTML não discrimina: o corpo `<html><body>Disallow: /</body></html>` não tem linha `User-agent`, então o parser também permitiria. Mutante N7 (remove a checagem `text/html`, `src/ingest/http.ts:65`) sobreviveu. |
| COLETA-04 | espera = max(1 s, Crawl-delay) | `tests/unit/http.test.ts:82-84` - maior espera em [4900, 5000] com Crawl-delay 5; `:94-96` - em [900, 1000] sem Crawl-delay | ✅ |
| COLETA-05 | 429/5xx: até 4 tentativas; Retry-After ou 2/4/8 s | `tests/unit/http.test.ts:105` - `esperas).toEqual([7000])`; `:111-113` - `rejects.toThrow(/HTTP 503/)`, `esperas).toEqual([2000, 4000, 8000])`, `contar(url)).toBe(4)`; `:119-120` - 500 → 200 resolve (M5, M10 mortos) | ✅ |
| COLETA-06 | 401/403 → `ColetaBloqueada`, sem nova tentativa | `tests/unit/http.test.ts:123-127` - `it.each([401, 403])`: `rejects.toBeInstanceOf(ColetaBloqueada)`, `contar(url)).toBe(1)` (M3 morto) | ✅ |
| COLETA-07 | recoleta substitui o ano **em uma transação**, sem duplicar | `tests/integracao/coleta.test.ts:110-123` - segunda coleta → `Number(n.n)).toBe(2)` no ano; outro ano continua com 3 | ⚠️ Sem duplicar: provado. Atomicidade: não testada. Mutante N6 (apaga numa transação e insere em outra, `src/ingest/camara.ts:236-239`) sobreviveu. |
| COLETA-08 | só nominais; sem votos ou orientações duplicados | `tests/unit/transformacoes.test.ts:87-95` - orientação `a\|PL` repetida → `orientacoes).toHaveLength(1)` (M6 morto) | ✅ |

### Edge Cases

| ID | Spec-defined outcome | `file:line` + assertion | Result |
| -- | -------------------- | ----------------------- | ------ |
| EDGE-01 | id não numérico ou inexistente → "Página não encontrada" + `noindex` | `tests/e2e/perfil.spec.ts:102-108` - `/parlamentares/1` e `/parlamentares/abc`: heading visível, `meta[name="robots"][content*="noindex"]` count > 0 | ✅ |
| EDGE-02 | "Nenhuma despesa publicada para {ano}." | `tests/e2e/perfil.spec.ts:91` - `/^Nenhuma despesa publicada para \d{4}\.$/` | ✅ |
| EDGE-03 | mensagem de ausência **e "—" no indicador** | `tests/e2e/perfil.spec.ts:92` - `/Não encontramos declarações de bens/`; `:93` - subtítulo "nenhuma declaração encontrada" | ⚠️ O valor "—" do indicador (`src/app/parlamentares/[id]/page.tsx:96`) não é afirmado. |
| EDGE-04 | 390 px sem rolagem horizontal | `playwright.config.ts:22` - projeto `celular` com `viewport: { width: 390, height: 844 }`; `tests/e2e/perfil.spec.ts:98-99` - `scrollWidth <= viewportSize().width` | ✅ |
| EDGE-05 | seed fora de `_test` → recusa, exit 1 | `tests/unit/seed-guard.test.ts:14-15` - `r.status).toBe(1)`, `stderr).toContain("Seed recusado")` | ✅ |

**Status**: ⚠️ 39 ✅, 7 ⚠️, 0 ❌, de 46.

---

## Discrimination Sensor

Worktree descartável em HEAD `c76b4d6`. Uma mutação por vez, aplicada por substituição exata de texto (o script confere que o trecho original aparece uma única vez), seguida de `pnpm test` completo (unit + integração no Postgres) e `git checkout -- <arquivo>`. Para a camada de UI (N1, N2, N9): `pnpm build` e `pnpm test:e2e` completos depois do Vitest.

### Os 6 sobreviventes da iteração 1

| Mutation | File:line | Description | Killed? |
| -------- | --------- | ----------- | ------- |
| M3 | `src/ingest/http.ts:90` | `401 \|\| 403` → só `403` | ✅ Killed (`http.test.ts:123`, caso 401) |
| M5 | `src/ingest/http.ts:98` | backoff `2000 * 2 ** (t-1)` → `1000` fixo | ✅ Killed (`http.test.ts:108`) |
| M6 | `src/ingest/camara.ts:145` | chave de orientação única por linha (sem deduplicação) | ✅ Killed (`transformacoes.test.ts`, "guarda só votações nominais e deduplica") |
| M8 | `src/data/perfil.ts:102` | `?ano=` sem despesas aceito | ✅ Killed (`perfil.test.ts:43`) |
| M9 | `src/data/perfil.ts:134` | `.limit(8)` → `.limit(80)` | ✅ Killed (`perfil.test.ts:59`) |
| M10 | `src/ingest/http.ts:20` | `MAX_TENTATIVAS` 4 → 9 | ✅ Killed (`http.test.ts:108`) |

### Mutações novas (código e testes adicionados desde a iteração 1)

| Mutation | File:line | Description | Killed? |
| -------- | --------- | ----------- | ------- |
| N1 | `src/components/nav-principal.tsx:26` | remove `pathname === href \|\|` (a página exata do menu deixa de ficar ativa) | ❌ Survived (Vitest 67/67, e2e 28/28) |
| N2 | `src/components/nav-principal.tsx:26` | remove `\|\| pathname.startsWith(\`${href}/\`)` | ✅ Killed (`perfil.spec.ts:65`, desktop e celular) |
| N3 | `src/lib/metrics.ts:78` | precedência `["federacao", "partido", "bloco"]` | ❌ Survived |
| N4 | `src/lib/metrics.ts:78` | precedência `["partido", "bloco", "federacao"]` | ✅ Killed (`metrics.test.ts:41`) |
| N5 | `src/data/perfil.ts:192` | presença conta toda linha de voto, inclusive `voto = ""` | ❌ Survived |
| N6 | `src/ingest/camara.ts:236-239` | apagar e inserir em transações separadas | ❌ Survived |
| N7 | `src/ingest/http.ts:65` | robots servido como `text/html` é lido pelo parser | ❌ Survived |
| N8 | `src/app/parlamentares/[id]/contestar/actions.ts:11` | `.max(4000)` → `.max(40000)` | ✅ Killed (`perfil.test.ts:187`) |
| N9 | `src/data/perfil.ts:240` | remove `.where("data_fim", "is", null)` dos órgãos | ❌ Survived (Vitest 67/67, e2e 28/28) |

**Sensor depth**: lightweight ampliado (15 mutações; coleta e privacidade são caminhos de conformidade legal)
**Sensor outcome**: 9/15 mortos. Os 6 sobreviventes da iteração 1 agora morrem; 6 das 9 novas sobreviveram → FAIL
**Isolation**: `git status --porcelain` do repositório real estava vazio antes e depois (comparados com `diff`, iguais). Worktree removido com `git worktree remove --force`; `git worktree list` mostra só o checkout principal. Nenhum `git stash`.

---

## Code Quality

| Principle | Status |
| --------- | ------ |
| Minimum code | ✅ A correção do build é um `<Suspense>` com fallback estático (`topo.tsx:24-26`, `nav-principal.tsx:18-20`) |
| Surgical changes | ✅ Desde a iteração 1, o código de produção só mudou em `nav-principal.tsx`, `topo.tsx` e no seed (deputada fora de exercício, para BUSCA-01). O resto são testes e `playwright.config.ts`. |
| No scope creep | ✅ O filtro de ausências, os órgãos, `/metodologia`, o menu e o rodapé, que não tinham critério na iteração 1, agora têm (VOTO-07, MAND-01, METOD-01, NAV-01, UI-02) |
| Matches patterns | ✅ |
| Spec-anchored outcome check | ⚠️ 7 parciais (acima) |
| Per-layer Coverage Expectation met | ⚠️ Cliente HTTP: o ramo HTML não discrimina. Camada de leitura: os filtros de voto vazio e de `data_fim` não são exercitados. |
| Every test maps to a spec requirement | ✅ Cada teste novo cita o ID do requisito no título |
| Documented guidelines followed: `AGENTS.md`, Test Coverage Matrix de tasks.md | ⚠️ ver acima |

Notas:
- `yazl` e `@types/yazl` entraram como devDependencies só para gerar o zip falso de `coleta.test.ts`. É aceitável, e não vão para o bundle.
- `tests/integracao/perfil.test.ts:89` apaga todas as despesas do `SEED.deputado` no fim do teste. O `afterAll` volta ao seed, mas se o teste falhar antes da linha 89 as linhas inseridas ficam até o `afterAll`. Não causa erro hoje; vale saber.

---

## Fix Plans

### Fix 1 (Major): VOTO-02, partido antes de federação (N3)
- **Root cause**: nenhum teste tem orientação de partido e de federação juntas.
- **Fix task**: em `tests/unit/metrics.test.ts`, `orientacaoDoPartido({ voto: "Sim", siglaPartido: "PSDB", orientacoes: [{ siglaBancada: "Fdr PSDB-CIDADAN", orientacao: "Não" }, { siglaBancada: "PSDB", orientacao: "Sim" }] })` → `toEqual({ orientacao: "Sim", tipo: "partido" })`. Ponha a federação primeiro no array, para a ordem de entrada não decidir o resultado.
- **Done when**: N3 morre.

### Fix 2 (Major): VOTO-01, voto vazio não conta como presença (N5)
- **Root cause**: o seed não tem linha de voto com `voto = ""`, o caso que o filtro existe para tratar.
- **Fix task**: em `tests/integracao/perfil.test.ts`, inserir uma votação de Plenário em 2026 com voto `""` da deputada (ou acrescentar ao seed, ajustando os números esperados) e afirmar `totalPlenario` +1 e `presentes` igual. Se for no seed, ajustar "67%" e "2 de 3" no e2e.
- **Done when**: N5 morre.

### Fix 3 (Major): COLETA-03, robots em HTML (N7)
- **Root cause**: o corpo HTML do teste não teria efeito mesmo se fosse lido como robots.txt.
- **Fix task**: em `tests/unit/http.test.ts:51`, usar o corpo `"User-agent: *\nDisallow: /"` com `content-type: text/html` e manter a asserção de que resolve. Lido como robots, esse corpo bloquearia tudo.
- **Done when**: N7 morre.

### Fix 4 (Major): NAV-01, página exata do menu (N1)
- **Fix task**: em `tests/e2e/perfil.spec.ts`, ir a `/parlamentares` (e a `/metodologia`) e afirmar `aria-current="page"` no item correspondente. Acrescentar `toHaveCSS("border-bottom-width", "2px")` no item ativo.
- **Done when**: N1 morre.

### Fix 5 (Minor): MAND-01, órgão encerrado e cargo (N9)
- **Fix task**: no seed, acrescentar à deputada um `orgao_membro` com `data_fim` preenchida (ex.: "Comissão Encerrada Fictícia"). No e2e, afirmar que ele tem `toHaveCount(0)` e que "Titular" aparece junto da Comissão de Finanças e Tributação.
- **Done when**: N9 morre.

### Fix 6 (Minor): COLETA-07, atomicidade (N6)
- **Fix task**: em `tests/integracao/coleta.test.ts`, depois da primeira coleta, rodar `coletarCeap` com um zip cuja linha quebre uma restrição na inserção (ex.: `ideCadastro` válido e `vlrLiquido` que estoure o tipo, ou um `fetchImpl` que entregue um CSV que faz `inserirEmBlocos` lançar erro). Afirmar `rejects` e que as 2 despesas do ano continuam no banco.
- **Done when**: N6 morre.

### Fix 7 (Cosmetic): EDGE-03, "—" no indicador
- **Fix task**: em `tests/e2e/perfil.spec.ts:93`, localizar o indicador de bens e afirmar que o valor é "—".

---

## Requirement Traceability Update

| Requirement | Previous | New |
| ----------- | -------- | --- |
| BUSCA-01, BUSCA-02, CEAP-03, CEAP-04, CEAP-05, VOTO-06, VOTO-07, BENS-01, PROV-01, PROV-02, PRIV-05, METOD-01, UI-02, CORR-01, CORR-02, CORR-03, COLETA-04, COLETA-05, COLETA-06, COLETA-08, EDGE-01, EDGE-02, EDGE-04, EDGE-05 | Implementing | ✅ Verified |
| BUSCA-03, CEAP-01, CEAP-02, VOTO-03, VOTO-04, VOTO-05, BENS-02, BENS-03, BENS-04, PRIV-01, PRIV-02, PRIV-03, PRIV-04, COLETA-01, COLETA-02 | Verified | ✅ Verified (mantido) |
| VOTO-01 | Verified | ❌ Needs Fix (N5) |
| VOTO-02, COLETA-03, COLETA-07, EDGE-03 | Implementing | ❌ Needs Fix |
| MAND-01, NAV-01 | Implementing | ❌ Needs Fix |

---

## Summary

**Overall**: ❌ Not Ready (iteração 2 de 3; resta uma rodada de correção e re-verificação antes de escalar ao usuário)

**Spec-anchored check**: 39/46 batem com a spec; 7 parciais; 0 sem evidência
**Sensor**: 9/15 mortos (6/6 da iteração 1 agora morrem; 3/9 das novas)
**Gate**: lint, typecheck, format, seed ✅; Vitest 67 passaram, 0 falharam, 0 pulados; build ✅; Playwright 28/28

**What works**: build de produção com Cache Components; cliente HTTP (401/403, backoff 2/4/8 s, 4 tentativas, Retry-After, Crawl-delay, rede); ingestão da CEAP de ponta a ponta com proveniência, máscara e recoleta sem duplicar; leitura do perfil (fallback de ano, limite de 8, teto nulo, totais de bens); busca (nome civil, em exercício, `%` e `_`); pedido de correção (curto, válido com status, acima de 4000); todos os edge cases menos o "—".

**Issues found**: 6 mutantes novos sobreviveram (N1, N3, N5, N6, N7, N9; Fixes 1–6); "—" do EDGE-03 não afirmado (Fix 7).

**Next steps**: Fixes 1–4 (Major) → Fixes 5–7 → re-verificação (iteração 3 de 3).
