# Seguir o dinheiro das emendas Validation (versão enxuta, checagem final)

**Date**: 2026-11-13
**Spec**: `.specs/features/seguir-dinheiro/spec.md` (DENS-01..DENS-10; DENS-01, DENS-06 e DENS-08 revistos; TRI-07 e EDGE-04 revistos)
**Diff range**: `a542207..cc56ec1` (spec 0de0ed8, leitura 3eca0e0, tela d73445c, correções 7db6cb6 e cc56ec1; o merge b80c111 é só da main)
**Verifier**: sub-agente independente (autor ≠ verificador)

**Verdict**: PASS

Checagem final (rodada 3 de 3), feita só sobre os pontos abertos na rodada 2. Todos foram fechados.

1. **Nome de município sobreposto ao valor pago no celular: corrigido.**
   - Na linha do município, o `<summary>` passou a quebrar linha (`flex-wrap`, `src/components/perfil/secao-trilha.tsx:768`). O nome ganhou `flex-1 break-words` (`:770`) e o valor vai para baixo do nome no celular (`order-last basis-full`, `:778`).
   - Medi a sobreposição com um detector próprio (transbordo de cada filho do `<summary>`, interseção entre filhos e texto do nome além da própria caixa). Calibrado no 7db6cb6, ele acusa 125 linhas a 320 px e 10 a 390 px no perfil 10001186.
   - Em cc56ec1, o mesmo detector acusa **0** em 126 municípios do 10001186 e em 38 do 204494, a 320, 390 e 1440 px.
   - O e2e novo (`tests/e2e/trilha.spec.ts:339`) checa que nada transborda a 320 e a 390 px, com um nome longo na fixture.
2. **N07 (TRI-05) morto** por `tests/e2e/trilha.spec.ts:323`: `"Sem pagamento registrado: R$ 1,8 mi"`, visível, na emenda `fundo`, que tem pago 0.
3. **N10 (DENS-01) morto** por `tests/e2e/trilha.spec.ts:331`: `toHaveText(["Sorocaba (SP)", "Uberaba (MG)"])`. A integração cobre o mesmo caso em `tests/integracao/trilha-leitura.test.ts:389`.
4. **Spec**:
   - DENS-01 agora diz de onde vem a área.
   - O link do elo 3 diz que é a base completa.
   - O teste de `tests/integracao/transferegov.test.ts:228` deixou de olhar `coleta_id` e não falha mais por acaso.

Paridade com os artboards enxutos: **56/56 = 100%**, contando as divergências deliberadas aceitas.

---

## Task Completion

| Task | Status | Notes |
| ---- | ------ | ----- |
| T15 | ✅ Done | `avaliacao` em três estados (`src/lib/trilha.ts:217`, `src/data/trilha.ts:425,538-542`) |
| T16 | ✅ Done | correções em 7db6cb6 e cc56ec1 |
| T17 | ✅ Done | este relatório: PASS; `validate_state.py` sai com 0 |

---

## Spec-Anchored Acceptance Criteria

Cada linha do DOM tem versões de desktop e de celular, e uma delas fica escondida por CSS. O e2e roda nos dois projetos (`desktop` e `celular` a 390 px), e as asserções de texto exigem visibilidade.

### DENS (versão enxuta)

| AC | Spec-defined outcome | `file:line` + assertion | Result |
| -- | -------------------- | ----------------------- | ------ |
| DENS-01 | código, área (só se a função não for "Encargos especiais"), nº de municípios com UF, transferido, % pago; emenda com indício aberta e primeiro | `tests/e2e/trilha.spec.ts:154`: `abertas` `toEqual([campinas, sorocaba])`, resumo do celular `"1 município (SP) · R$ 1,8 mi · 0% pago"`; `:243`: `not.toContainText("Encargos")`; `:331`: `["Sorocaba (SP)", "Uberaba (MG)"]`; `tests/integracao/trilha-leitura.test.ts:50,273,389` | ✅ PASS (N06 e N10 mortos) |
| DENS-02 | três elos uma vez, com valor, fonte e saldo | `tests/e2e/trilha.spec.ts:154`: `[data-saldo-emenda]` `"Sem pagamento registrado: R$ 391 mil"`, hrefs dos 3 elos `toEqual([...])` | ✅ PASS |
| DENS-03 | ordem por valor pago; no máximo 10; "Ver os outros N"; "N municípios sem pagamento registrado · R$ X" | `tests/e2e/trilha.spec.ts:235`: nomes `toEqual(nomes.slice(0, 10))` pela `ORDEM_PAGO_QUINTO`; `"3 municípios sem pagamento registrado · R$ 3,4 mi"`; `tests/integracao/trilha-leitura.test.ts:341` | ✅ PASS (R02 morto) |
| DENS-04 | município abre quem pagou; PF numa linha; selo por indício | `tests/e2e/trilha.spec.ts:192`; `:339` (linha legível a 320 e 390 px); `tests/integracao/trilha-leitura.test.ts:77` | ✅ PASS |
| DENS-05 | cartão por sinal: título, casos, taxa, regra, frase uma vez, linha por empresa, arquivos | `tests/e2e/trilha.spec.ts:33`: taxa `toBeVisible()`, frase uma vez por cartão (`toBe(1)`), href `#…-97001-pagos`; `:140` | ✅ PASS (R19 morto) |
| DENS-06 | "Ainda não importamos…" só sem a base; sem dado do perfil, dizer isso com o mês ou o ano da base; "Não avaliados"; "Isso não quer dizer que não haja indício." | `tests/unit/trilha.test.ts:217`; `tests/integracao/trilha-leitura.test.ts:331,367`; `tests/e2e/trilha.spec.ts:235`: nota exata, `not.toContainText("Ainda não importamos")` | ✅ PASS (N01, N02b, N03 e N11 mortos) |
| DENS-07 | "Baixar CSV" e "Contestar" no topo | `tests/e2e/trilha.spec.ts:33`: `yTopo` `toBeLessThan` o y do indicador | ✅ PASS (R11 morto) |
| DENS-08 | notas de PF, matriz e fontes uma vez; base da Receita ao lado de cada data | `tests/e2e/trilha.spec.ts:287`: `toBe(1)` com tudo aberto | ✅ PASS (R16 morto) |
| DENS-09 | "Ver na trilha" leva ao município, já aberto | `tests/e2e/trilha.spec.ts:299`: fecha o município, clica, `open` e `toBeInViewport` | ✅ PASS (N05 morto) |
| DENS-10 | "aparece nas despesas declaradas"; "município ou estado"; "para" sem acento | `tests/e2e/trilha.spec.ts:33`; `tests/unit/trilha.test.ts:206` | ✅ PASS |

### Antigos que a reescrita podia quebrar

| AC | Spec-defined outcome | `file:line` + assertion | Result |
| -- | -------------------- | ----------------------- | ------ |
| TRI-04 | link de cada elo | `tests/e2e/trilha.spec.ts:154`: 3 hrefs `toEqual([...])` | ✅ PASS |
| TRI-05 | "Sem pagamento registrado: R$ X" | `tests/e2e/trilha.spec.ts:154` (pago > 0) e `:323` (pago = 0, `"Sem pagamento registrado: R$ 1,8 mi"`); `tests/integracao/trilha-leitura.test.ts:90` | ✅ PASS (N07 morto) |
| TRI-07 | "N pagamentos a pessoas físicas" | `tests/e2e/trilha.spec.ts:192` | ✅ PASS |
| CNPJ-05 | "Data de abertura não encontrada na base da Receita de {mês}" | `tests/e2e/trilha.spec.ts:192` | ✅ PASS |
| CNPJ-06 | "base de MM/AAAA" ao lado de toda data de abertura | `tests/e2e/trilha.spec.ts:33` (frase do caso), `:192` (cabeçalho e celular) | ✅ PASS (N08 morto) |
| EDGE-04 | 4 formas, com gênero e Casa | `tests/unit/trilha.test.ts:242`; `tests/e2e/trilha.spec.ts:356` | ✅ PASS (R21 morto) |
| EDGE-05 | data da filial, com aviso | `tests/e2e/trilha.spec.ts:192`; `tests/integracao/trilha-leitura.test.ts:105` | ✅ PASS |
| LING-01 | só "indício"; frase de não imputação | `tests/e2e/trilha.spec.ts:33` | ✅ PASS |
| LING-02 | regra, limiar, dados e link da metodologia em cada aviso | `tests/e2e/trilha.spec.ts:33` (desktop e celular, href por sinal) | ✅ PASS (R20 e N12 mortos) |
| LING-04 | Contestar em cada aviso | `tests/e2e/trilha.spec.ts:33`, e o teste "LING-04" no fim do arquivo | ✅ PASS |
| LING-07 | taxa "M de N" ao lado de cada sinal | `tests/e2e/trilha.spec.ts:33` (visível nos dois projetos) | ✅ PASS (R19 e N09 mortos) |
| LING-09 | data e SHA-256, com link | `tests/e2e/trilha.spec.ts:140`; `tests/integracao/trilha-leitura.test.ts:207` | ✅ PASS |

Os ACs que a reescrita não tocou (TRI-01..03, TRI-06, CNPJ-01..04, CNPJ-07, CICLO-*, LING-03, LING-05, LING-06, LING-08, EDGE-01..03, EDGE-06) mantêm a evidência da validação anterior e passam no gate.

**Status**: ✅ Todos os ACs têm evidência que discrimina.

---

## Discrimination Sensor

**Isolamento**, nas três rodadas:

- worktree temporária com `git worktree add --detach <scratchpad>/mutantes2 <HEAD da rodada>`, com `node_modules` copiado;
- para cada mutante: seed, `pnpm build` e e2e da trilha na porta 3405; os mutantes da leitura passaram antes pelo vitest de `tests/unit/trilha.test.ts` e `tests/integracao/trilha-leitura.test.ts`;
- `git checkout -- src tests` entre mutantes;
- no fim, `git worktree remove --force` e `git worktree prune`.

O `git status --porcelain` da worktree real ficou igual antes e depois em cada rodada (só ` M validation.md`). HEAD continua cc56ec1. A porta 3405 ficou livre e os servidores 3406 e 3410 não foram tocados.

### Rodada 3 (cc56ec1)

| # | File:line | Mutação | Killed? |
| - | --------- | ------- | ------- |
| F07 | `src/components/perfil/secao-trilha.tsx:661` | saldo do elo 3 só com pago > 0 (o N07 de novo) | ✅ (`tests/e2e/trilha.spec.ts:323`) |
| F10 | `src/components/perfil/secao-trilha.tsx:772` | UF de cada município escondida quando a emenda tem várias UFs (o N10 de novo) | ✅ (`:331`) |
| FW1 | `src/components/perfil/secao-trilha.tsx:768` | sem `flex-wrap` no `<summary>` do município | ✅ (`:339`) |
| FW2 | `src/components/perfil/secao-trilha.tsx:778` | sem `order-last basis-full` no valor | ➖ equivalente na prática (ver abaixo) |
| FW3 | `src/components/perfil/secao-trilha.tsx:770` | nome sem `flex-1 break-words` | ➖ equivalente na prática (ver abaixo) |

**Por que FW2 e FW3 são equivalentes na prática.** Cada um tira só uma das camadas da correção; as outras duas continuam lá. Com um build de cada mutante sobre a cópia do banco real (`auditaja_trilha_medida`), o detector, que acusa o defeito original (125 e 10 linhas), deu 0 transbordos e 0 sobreposições nos 126 municípios do perfil 10001186, a 320, 390 e 1440 px. FW1 também deu 0 ali. Ele só aparece com o nome muito longo da fixture, e o e2e o pega. Nenhum comportamento observável muda, então não abro tarefa de correção.

### Histórico

- **Rodada 1 (d73445c)**: 15/21 mortos. Sobreviveram M02, M11, M16, M19, M20 e M21.
- **Rodada 2 (7db6cb6)**: 16/18 mortos (1 equivalente descartado). Os 6 da rodada 1 morreram; sobreviveram N07 e N10.
- **Rodada 3 (cc56ec1)**: N07 e N10 mortos, e FW1 morto. FW2 e FW3 são equivalentes na prática.

Nenhum sobrevivente com efeito observável está em aberto.

**Sensor depth**: P0-full manual (45 injeções nas 3 rodadas)
**Result**: PASS ✅

---

## Paridade com os artboards enxutos

Conferida em builds isolados na porta 3405, sobre `auditaja_trilha_test` (fixture) e `auditaja_trilha_medida` (cópia do banco real).

**Desktop (35/35)**. Presentes e fiéis:

- título, CSV e Contestar no topo;
- os três indicadores, inclusive "Não avaliados";
- a nota de não avaliado;
- os cartões por sinal;
- a tabela de emendas e os três elos (o 3 com link);
- municípios com o chevron certo;
- recebedores com selo e a linha de PF;
- "Ver os outros N" e a linha dos sem pagamento;
- nota de rodapé e lateral.

Divergências deliberadas, aceitas:

- saldo no elo 3;
- base da Receita no cabeçalho da coluna e na frase;
- área omitida quando é "Encargos especiais";
- textos da taxa mais explícitos.

**Celular (21/21)**. Presentes:

- título, CSV e Contestar;
- dois indicadores, sem o de indícios;
- cartão de indícios, com um bloco por sinal (divergência exigida por LING-02 e LING-07);
- emendas com resumo;
- municípios em `<details>` com "pagou R$ X" em linha própria, sem sobreposição;
- "Ver os outros N" e a linha dos sem pagamento;
- "Como seguimos o dinheiro".

**Paridade**: 56/56 = **100%**.

**Altura da seção**, no estado inicial (a 1440 px, a seção fica na coluna de 832 px):

| Perfil | 1440 px | 390 px |
| ------ | ------- | ------ |
| 970000001 | 3.216 px | 4.448 px |
| 970000005 | 720 px | 946 px |
| 10001186 | 1.064 px | 1.374 px |
| 204494 | 1.064 px | 1.414 px |

Os dois perfis da fixture foram medidos na rodada 2. A cc56ec1 só muda a linha de município, que já nasce fechada.

**320 px, tudo aberto**: `scrollWidth` = 320 nos perfis 10001186 e 204494 (cc56ec1) e nos 970000001 e 970000005 (rodada 2 e e2e `tests/e2e/trilha.spec.ts:339` em cc56ec1). Temas claro e escuro. Sem sobreposição.

**axe** (wcag2a/aa, 21a/aa, 22aa, best-practice), com tudo aberto, a 320, 390 e 1440 px, temas claro e escuro: **0 violações**.

- Em cc56ec1: 10001186 e 204494, e os perfis da fixture pelo e2e.
- Na rodada 2: 970000001 e 970000005.

**Tema escuro**: aplicado por `localStorage.tema = "escuro"`; a classe `dark` foi conferida.

---

## Code Quality

| Principle | Status |
| --------- | ------ |
| Minimum code | ✅ |
| Surgical changes | ✅ |
| No scope creep | ✅ |
| Matches patterns | ✅ (nota: o comentário "UF mais frequente" em `src/data/trilha.ts` ainda diz outra coisa que o código; é cosmético) |
| Spec-anchored outcome check | ✅ |
| Per-layer Coverage Expectation | ✅ |
| Every test maps to a spec requirement | ✅ |
| Documented guidelines followed: `AGENTS.md` | ✅ |

---

## Edge Cases

- [x] EDGE-01..06

---

## Gate Check

Lint, typecheck e vitest rodaram na worktree real (cc56ec1). O e2e completo rodou numa cópia isolada de cc56ec1, para não reconstruir o `.next` dos servidores 3406 e 3410.

- **Lint**: 0 problemas. **Typecheck**: ok.
- **Vitest**: 421 passaram, 0 falharam (34 arquivos).
- **Playwright**: 242 passaram, 0 falharam, 8 pulados. Os pulados já existiam (`test.skip(isMobile …)` em `tests/e2e/perfil.spec.ts` e `tests/e2e/senador.spec.ts`) e são justificados.
- **Contagem**: 401 vitest e 218 e2e em 34a8984; 421 vitest e 242 e2e agora. Delta: +20 / +24, parte vinda do merge da main. Nenhum teste foi removido sem substituto.

---

## Fix Plans

Nenhum em aberto.

---

## Requirement Traceability Update

| Requirement | Previous Status | New Status |
| ----------- | --------------- | ---------- |
| DENS-01..DENS-10 | Pending / Needs Fix | ✅ Verified |
| TRI-05, LING-02, LING-07, EDGE-04, CNPJ-06 | Needs Fix / ⚠️ | ✅ Verified |
| TRI-04, TRI-07, CNPJ-05, EDGE-05, LING-01, LING-04, LING-09 | Implemented | ✅ Verified |

---

## Summary

**Overall**: ✅ Ready

- **Spec-anchored check**: todos os ACs com evidência que discrimina.
- **Sensor**: rodada 3 com F07, F10 e FW1 mortos e FW2 e FW3 equivalentes na prática; nenhum sobrevivente com efeito em aberto nas 3 rodadas.
- **Gate**: lint ok, typecheck ok, 421 vitest, 242 e2e (8 pulados antigos).
- **Paridade**: 100%.

**What works**: a versão enxuta inteira, com estas medidas:

- seção do perfil real 10001186 com 1.064 px a 1440 e 1.374 px a 390;
- 320 px sem rolagem e sem sobreposição;
- axe limpo nos dois temas.
