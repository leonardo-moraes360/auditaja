# Seguir o dinheiro das emendas Validation (checagem final)

**Date**: 2026-11-12
**Spec**: `.specs/features/seguir-dinheiro/spec.md`
**Diff range**: `main...claude/project-thread-xvyvww` (e67bae2..34a8984: specs + T1–T14 + correções caaf8e6, 245de02, be4af05, 90a39ab e 34a8984)
**Verifier**: sub-agente independente (autor ≠ verificador)

**Verdict**: PASS

Checagem final, só de S1 e S4, depois da 4ª rodada (decisão do coordenador). Os dois mutantes agora morrem:

- **S4** (LING-05): a montagem do CSV foi para `linhasCsvTrilha` (`src/lib/trilha-csv.ts:30`), com teste de linhas positivas e negativas.
- **S1**: a ordem "emendas com indício primeiro" passou a ser travada por um caso em que a emenda com indício tem valor menor.

Todos os 33 ACs têm evidência que discrimina; gates verdes; paridade com o canvas 100% (sem mudança de tela desde 245de02).

Sobreviventes acumulados nas 5 rodadas: todos mortos (rodada 1: 10; rodada 2: N10; rodada 3: R3, R4; rodada 4: S1, S4).

Fora dos ACs e pendente antes do merge: medir o desempenho de `taxasDeBase()` (`src/data/trilha.ts:138`) no banco real com a migração.

---

## Task Completion

| Task | Status | Notes |
| ---- | ------ | ----- |
| T1–T14 | ✅ Done | correções da rodada 1 em caaf8e6 (lógica) e 245de02 (tela e e2e) |

---

## Spec-Anchored Acceptance Criteria

| AC | Spec-defined outcome | `file:line` + assertion | Result |
| -- | -------------------- | ----------------------- | ------ |
| TRI-01 | liquidações com CNPJ, valor, data, `coleta_id` | `tests/integracao/transferegov.test.ts:218` - `expect(pg.map(...)).toEqual([[1,501,"pj","19681377000181",...,"587900.00","2026-04-01"],...])` | ✅ PASS |
| TRI-02 | liga pelo código, nunca pelo nome | `tests/integracao/transferegov.test.ts:184` - só o plano 501 é gravado (o 503 tem o mesmo nome de autor) | ✅ PASS |
| TRI-03 | nada de banco/agência/conta/nome/doc PF | `tests/integracao/transferegov.test.ts:229` - `not.toContain(...)`; `:234` - colunas proibidas `toEqual([])` | ✅ PASS |
| TRI-04 | emenda → ente → empresas, valor por empresa, link de cada elo | `tests/integracao/trilha-leitura.test.ts:77`; `tests/e2e/trilha.spec.ts:112` - hrefs dos 3 elos `toEqual([portal, planos-acao-especiais?id_plano_acao=97001, relatorios-gestao-novos-especiais?...])` | ✅ PASS |
| TRI-05 | "Sem pagamento registrado: R$ X" | `tests/integracao/trilha-leitura.test.ts:94` - `[1_609_000, 391_000]`; `tests/e2e/trilha.spec.ts:128,142` - `table [data-saldo]` e cartões visíveis com `/Sem pagamento registrado:\s*R\$ 391 mil/` | ✅ PASS |
| TRI-06 | erro/429 → `ColetaBloqueada`, coleta anterior intacta | `tests/integracao/transferegov-paginas.test.ts:57`; `tests/integracao/transferegov.test.ts:246` | ✅ PASS |
| TRI-07 | "Pessoas físicas (N)" com valor somado | `tests/integracao/trilha-leitura.test.ts:86`; `tests/e2e/trilha.spec.ts:127,140` - `toHaveText(/Pessoas físicas \(3\).*R\$ 12 mil/)`, visível por projeto | ✅ PASS |
| CNPJ-01 | só CNPJs do banco, `coleta_id` e SHA-256 | `tests/integracao/receita.test.ts:156,197` | ✅ PASS |
| CNPJ-02 | nada de sócios/endereço/telefone/e-mail | `tests/integracao/receita.test.ts:217` | ✅ PASS |
| CNPJ-03 | matriz < 180 dias antes do 1º pagamento **ligado à emenda** | `tests/unit/trilha.test.ts:23`; `tests/integracao/trilha-leitura.test.ts:127`; `:238` - dois planos: `[novaDoisPlanos, doTerceiro, "2025-03-01", 59, 100_000, "MUNICIPIO DE CAMPINAS"]`, um só aviso | ✅ PASS |
| CNPJ-04 | ≥ 180 não marca | `tests/unit/trilha.test.ts:26`; `tests/integracao/trilha-leitura.test.ts:132` | ✅ PASS |
| CNPJ-05 | "Data de abertura não encontrada na base da Receita de {mês}" | `tests/e2e/trilha.spec.ts:126,138` - por projeto; no desktop, célula `[data-abertura]` com o texto exato | ✅ PASS |
| CNPJ-06 | "base de MM/AAAA" ao lado de toda data de abertura | `tests/e2e/trilha.spec.ts:132` - cabeçalho `"Abertura da matriz (base de 10/2026)"`; `:123-125` - cartões `"abriu em 12/02/2025 (base de 10/2026)"`; `:51,56` - avisos do celular e do desktop | ✅ PASS |
| CNPJ-07 | importador só lê arquivo local | `tests/integracao/receita.test.ts:249,258` | ✅ PASS |
| CICLO-01 | despesas PJ por `sq_candidato` | `tests/integracao/tse-contas.test.ts:165` - `foraDaBase: 2` (inclui a candidatura de 2026 da linha `:111`) e linhas `toEqual` | ✅ PASS |
| CICLO-02 | nunca nome/CPF de PF | `tests/integracao/tse-contas.test.ts:205` | ✅ PASS |
| CICLO-03 | dois valores, duas datas, duas fontes | `tests/integracao/trilha-leitura.test.ts:140` | ✅ PASS |
| CICLO-04 | campanha de outro parlamentar não marca | `tests/unit/trilha.test.ts:80`; `tests/integracao/trilha-leitura.test.ts:186` | ✅ PASS |
| LING-01 | só "indício"/"padrão atípico" + frase | `tests/e2e/trilha.spec.ts:42,44` - frase visível e `not.toMatch(/fraude|corrup|desvi|suspeit|ilegal|crime/i)` | ✅ PASS |
| LING-02 | regra, limiar, dados, link metodologia | `tests/e2e/trilha.spec.ts:52-64,80` | ✅ PASS |
| LING-03 | seção por sinal, v1.11 | `tests/e2e/trilha.spec.ts:231` | ✅ PASS |
| LING-04 | "Contestar" no fluxo existente | `tests/e2e/trilha.spec.ts:189` | ✅ PASS |
| LING-05 | colunas `indicio` e `versao_metodologia`; D14: CSV em rota própria `trilha.csv` | `tests/e2e/trilha.spec.ts:203` - `col` contém `indicio` e `versao_metodologia`; `:218` linha da construtora; `tests/integracao/trilha-leitura.test.ts:290-301` - `indicio(campinas, limiar180)` = `""`, `limiar179` = `"recem-aberta"`, `grafica` = `"ciclo-fechado"`, `distribuidoraFilial` = `""`, linhas sem CNPJ vazias, `versao_metodologia` = `"1.11"` | ✅ PASS |
| LING-06 | só fatos datados até o pagamento | `tests/unit/trilha.test.ts:33,85,95,99` (`:99` - `despesaCampanha: 20`, `ultimaDespesa: "2022-09-15"`); `tests/integracao/trilha-leitura.test.ts:264`, `:221` e `:246` | ✅ PASS |
| LING-07 | "M de N" com universo explícito | `tests/integracao/trilha-leitura.test.ts:221` - `{recemAberta: [3, 10], ciclo: [2, 5]}`; `tests/e2e/trilha.spec.ts:53,59` - "3 de 10 (30,0%)" | ✅ PASS |
| LING-08 | causas de falso positivo | `tests/e2e/trilha.spec.ts:231` ("MEI", "gráficas") | ✅ PASS |
| LING-09 | data e SHA-256 de cada elo | `tests/integracao/trilha-leitura.test.ts:195`; `tests/e2e/trilha.spec.ts:86` (no celular, abre o `<details>`) | ✅ PASS |
| EDGE-01 | sem código: não liga e conta no log | `tests/integracao/transferegov.test.ts:161` - `semCodigo: 1` | ✅ PASS |
| EDGE-02 | DV inválido descartado | `tests/unit/trilha.test.ts:121`; `tests/integracao/transferegov.test.ts:161` | ✅ PASS |
| EDGE-03 | outro ente público, sem avaliar | `tests/integracao/trilha-leitura.test.ts:116` (CNAE 84) e `:257` (beneficiário sem CNAE 84; filial com matriz CNAE 84) | ✅ PASS |
| EDGE-04 | frase exata, trilha escondida | `tests/integracao/trilha-leitura.test.ts:44`; `tests/e2e/trilha.spec.ts:161` | ✅ PASS |
| EDGE-05 | data da filial + aviso | `tests/unit/trilha.test.ts:47`; `tests/e2e/trilha.spec.ts:125,137` | ✅ PASS |
| EDGE-06 | recusa lote anterior citando os dois meses | `tests/integracao/receita.test.ts:231` | ✅ PASS |

**Status**: ✅ 33/33 com evidência que discrimina.

---

## Discrimination Sensor

Checagem final: worktree temporária `git worktree add --detach <scratchpad>/mutantes 34a8984` com `node_modules` copiado; testes com `vitest` em `tests/integracao/trilha-leitura.test.ts`; removida com `git worktree remove --force`. `git status --porcelain` da worktree real igual ao de antes (só `?? .specs/features/seguir-dinheiro/validation.md`), HEAD 34a8984, porta 3405 livre.

| # | File:line | Mutação | Killed? |
| - | --------- | ------- | ------- |
| S1 | `src/data/trilha.ts:479` | emendas com indício deixam de vir primeiro | ✅ (`tests/integracao/trilha-leitura.test.ts:273`) |
| S4 | `src/lib/trilha-csv.ts:34` | CSV marca o indício da emenda em todos os recebedores | ✅ (`tests/integracao/trilha-leitura.test.ts:282`) |

Histórico das rodadas (mortos/injetados): rodada 1, 24/34; rodada 2, 20/21; rodada 3, 3/5; rodada 4, 4/6; checagem final, 2/2. Cada sobrevivente de uma rodada foi reaplicado na seguinte e morreu. Total de mutações distintas: 53 (68 injeções, 15 delas reaplicações).

**Sensor depth**: P0-full manual
**Result**: 2/2 killed na checagem final; nenhum sobrevivente em aberto - PASS ✅

---

## Paridade com o canvas

Sem mudança de tela desde 245de02 (be4af05, 90a39ab e 34a8984 só mexem em fixture, testes, spec e na rota do CSV); medição da rodada 2 mantida. O e2e conta 5 avisos.

60 elementos (34 no desktop a 1440 px, 26 no celular a 390 px).

- **Corrigido desde a rodada 1**:
  - a tabela da emenda de Sorocaba agora cabe (`scrollWidth` = `clientWidth` = 748 em todas as `[role=region]` abertas, a 1440 px);
  - "Emenda X · Área" voltou a ser `<h4>` (10 títulos na seção).
- **Divergência deliberada aceita**: o celular mostra 3 trilhas antes de "Ver as outras"; o canvas mostra 1. É aceitável: os avisos apontam por âncora para as trilhas com indício, que precisam estar abertas no DOM, e dentro de um `<details>` fechado a âncora não abre o conteúdo em todos os navegadores. O custo é só altura de página.
- As demais divergências deliberadas já conhecidas continuam aceitas: 12 dígitos, cartão irmão, texto do saldo, texto da taxa, "Ver a trilha" em `<details>`, tokens do DS.

**Paridade**: 60/60 = **100%** (59/60 = 98,3% se a divergência deliberada do celular for contada).

- 320 px: `scrollWidth` = 320 com todos os `<details>` abertos.
- axe (wcag2a/aa, 21a/aa, 22aa, best-practice) na seção, com todos os `<details>` abertos, a 1440, 390 e 320 px: 0 violações.
- Lateral "Como seguimos o dinheiro" e "O que não mostramos" visíveis a 1440 px.

---

## Code Quality

| Principle | Status |
| --------- | ------ |
| Minimum code | ✅ |
| Surgical changes | ✅ |
| No scope creep | ✅ |
| Matches patterns | ✅ |
| Spec-anchored outcome check | ✅ (LING-05 sinalizado) |
| Per-layer Coverage Expectation | ✅ (e2e por projeto, com texto visível) |
| Every test maps to a spec requirement | ✅ |
| Documented guidelines followed: `AGENTS.md` | ✅ |

Pendente, fora dos ACs: `taxasDeBase()` (`src/data/trilha.ts:138`) roda duas agregações sobre a base inteira a cada visita de perfil. Medir no banco real com a migração antes do merge.

---

## Edge Cases

- [x] EDGE-01 a EDGE-06

---

## Gate Check

- **Comandos**: `pnpm lint`, `pnpm typecheck`, `TEST_DATABASE_URL=… pnpm test`, seed, `pnpm build`, `E2E_PORT=3405 PW_CHROME=/usr/bin/google-chrome pnpm test:e2e`
- **Lint**: 0 problemas. **Typecheck**: ok.
- **Vitest**: 401 passaram, 0 falharam, 0 pulados (33 arquivos), em 34a8984
- **Playwright**: 218 passaram, 0 falharam, 8 pulados (já existiam em `perfil.spec.ts` e `senador.spec.ts`), em 34a8984 (suíte completa)
- **Testes antes da feature**: 321 vitest / 198 e2e
- **Testes depois da feature**: 401 vitest / 218 e2e
- **Delta**: +80 vitest, +20 e2e

---

## Fix Plans

Nenhum fix de AC em aberto.

### Pendente (fora dos ACs, antes do merge)

- Desempenho de `taxasDeBase()` (`src/data/trilha.ts:138`): duas agregações sobre a base inteira a cada visita de perfil. Medir no banco real com a migração.

---

## Requirement Traceability Update

| Requirement | Previous Status | New Status |
| ----------- | --------------- | ---------- |
| CNPJ-06 | ❌ Needs Fix | ✅ Verified |
| EDGE-03 | ⚠️ | ✅ Verified |
| LING-07 | ⚠️ | ✅ Verified |
| LING-06, CICLO-03 | ⚠️ | ✅ Verified |
| LING-05 | ❌ | ✅ Verified |
| demais 30 | Implemented | ✅ Verified |

---

## Summary

**Overall**: ✅ Ready (com a medição de desempenho pendente antes do merge)

**Spec-anchored check**: 33/33 com evidência que discrimina
**Sensor**: checagem final 2/2 killed; nenhum sobrevivente em aberto
**Gate**: lint ok, typecheck ok, 401 vitest, 218 e2e (8 pulados antigos)
**Paridade com o canvas**: 100% (98,3% contando a divergência deliberada do celular)
