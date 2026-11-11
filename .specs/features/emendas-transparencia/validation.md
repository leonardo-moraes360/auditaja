# Validation: emendas-transparencia — FAIL ❌

**Data**: 2026-11-11 (rodada 2)
**Spec**: `.specs/features/emendas-transparencia/spec.md` (43 critérios)
**Faixa do diff**: `e4e563d..f8e8a5a` (branch `feat/emendas-transparencia`, 13 commits, 32 arquivos, +3786/−12); a
correção da rodada 1 é `597974a..f8e8a5a` (13 arquivos, +260/−53)
**Verificador**: sub-agente independente (autor ≠ verificador), só leitura no worktree real; mutações em worktree
temporário

---

## Veredito

**FAIL.** As seis lacunas da rodada 1 foram fechadas de verdade: EDGE-04 tem teste e os mutantes U03, M09, M10, M12,
M13 e M14 agora morrem. Os 43 critérios têm evidência `arquivo:linha` com o valor da spec. Mas o sensor, refeito com
29 mutantes novos sobre o que a correção acrescentou, achou **7 sobreviventes**; 3 deles em regra que a spec define:

1. **N05 e N09**: a data da base das emendas (EMDUI-12 e Assumption "Data da base": "data da entrada
   `EmendasParlamentares.csv` no ZIP") não é discriminada. A fixture dá a mesma `mtime` a todas as entradas
   (`tests/integracao/emendas.test.ts:70`), então ler a entrada errada (`PorFavorecido`) ou a primeira entrada
   qualquer passa.
2. **U15**: o cabeçalho "Tipo" pode sumir no celular com as células visíveis (tabela desalinhada) sem falhar teste;
   `tests/e2e/emendas.spec.ts:76-77` só confere a célula (EMDUI-11).

Os outros 4 (U20–U23) são textos que só o artboard define (paridade) e o plural de "Ver as N notas", sem teste. A
paridade ficou em **95,4%** (62 PASS, 3 FAIL, 8 INTENCIONAL), na meta e sem folga; ver `paridade/verificacao-2.md`.

## Mudanças na spec (registro honesto ou afrouxamento?)

| Mudança (`f8e8a5a`) | Leitura |
| --- | --- |
| EDGE-04 passa a dizer "—" no detalhe, sem barra, e "— do empenhado" nas especiais | Aperta a regra (mais precisa); testada |
| EMDUI-12 ganha "· base de DD/MM/AAAA" no desktop e o rodapé curto no celular | Base: requisito novo, vindo do artboard. Celular: exceção que a rodada 1 pediu para registrar; tira "Baixar CSV" e "Contestar" do celular, mas segue o padrão aprovado do protótipo de celular. Aceito |
| EMDUI-15 "uma linha por emenda **e local**" | Registra o que a fonte publica e o que a rodada 1 apontou; não muda o código. Aceito |
| Assumptions: data da base, natureza jurídica, "estados e municípios", "Como ligamos" sem conferência manual | Todas com motivo verificável (fonte sem as categorias do artboard; CF art. 166-A; não existe conferência manual). Nenhuma esconde dado da fonte. Aceitas como INTENCIONAL na paridade |

Nenhuma mudança afrouxa um critério testável para passar. A spec ainda não diz qual número aparece em "Ver as N
notas" nem o que o link baixa (ver C22 na paridade).

---

## Conclusão das tarefas

`tasks.md` T1–T8 com "Done when" marcados; nenhuma tarefa parcial ou bloqueada. A correção da rodada 1 veio num
commit só (`f8e8a5a`), sem tarefa nova em `tasks.md`.

---

## Critérios de aceitação ancorados na spec

### P1: Coletar emendas em lote

| Critério | Resultado definido na spec | `arquivo:linha` + asserção | Resultado |
| --- | --- | --- | --- |
| EMD-01 | ZIP baixado 1 vez, pelo `ClienteEducado`, do servidor de arquivos | `tests/integracao/emendas.test.ts:145` `pedidos.filter((u) => u === URL_EMENDAS)).toHaveLength(1)`; `:146` todos começam com `https://dadosabertos-download.cgu.gov.br/` | ✅ PASS |
| EMD-02 | `coleta` com `cgu_emendas`, URL, SHA-256, bytes, licença | `tests/integracao/emendas.test.ts:158-164` `toMatchObject({ url, sha256: sha256De(zip), bytes: zip.length, licenca: LICENCA_CGU, observacao: "base de 10/11/2026" })` | ✅ PASS |
| EMD-03 | Só ano ≥ 2024 e tipo "Emenda Individual…" | `tests/integracao/emendas.test.ts:172` `toEqual(["202400010002", "202500010001"])`; `tests/unit/emendas.test.ts:57-68` | ✅ PASS |
| EMD-04 | Autor casa com 1 deputado → `parlamentar_id` dele | `tests/integracao/emendas.test.ts:173`; `tests/unit/emendas.test.ts:45-46` | ✅ PASS |
| EMD-05 | 0 ou >1 → descarta e conta no resumo | `tests/integracao/emendas.test.ts:147` `toEqual({ emendas: 2, favorecidos: 4, autoresDescartados: 2 })`; `tests/unit/emendas.test.ts:49`, `:52` | ✅ PASS |
| EMD-06 | "1.234,56" → 1234.56 nos 4 campos | `tests/unit/emendas.test.ts:21`; `tests/integracao/emendas.test.ts:174-183` | ✅ PASS |
| EMD-07 | Favorecido com tipo, UF, município, ano/mês, valor | `tests/integracao/emendas.test.ts:197-212` | ✅ PASS |
| EMD-08 | PF → "Beneficiário pessoa física"; doc `***.ddd.ddd-**` ou nulo | `tests/integracao/emendas.test.ts:197-201`, `:215-217`; `tests/unit/emendas.test.ts:73-83` | ✅ PASS |
| EMD-09 | 14 dígitos → CNPJ formatado | `tests/integracao/emendas.test.ts:197-201`; `tests/unit/emendas.test.ts:85-89` | ✅ PASS |
| EMD-10 | Nova coleta substitui, sem duplicar | `tests/integracao/emendas.test.ts:223-224` `contar("emenda") === 2`, `contar("emenda_favorecido") === 4` | ✅ PASS |
| EMD-11 | Streaming latin1 `;` | `tests/integracao/emendas.test.ts:238` iterador assíncrono; `:240` `"ACÁCIA GONÇALVES"` | ✅ PASS |

### P1: Ver as emendas no perfil

| Critério | Resultado definido na spec | `arquivo:linha` + asserção | Resultado |
| --- | --- | --- | --- |
| EMDUI-01 | Aba "Emendas" entre "Gastos da cota" e "Votações", `#emendas` | `tests/e2e/emendas.spec.ts:13` `toEqual(["#gastos", "#emendas", "#votacoes"])`; `:14` | ✅ PASS |
| EMDUI-02 | h2 "Emendas parlamentares individuais" entre gastos e votações | `tests/e2e/emendas.spec.ts:20`, `:24` | ✅ PASS |
| EMDUI-03 | Mandato soma tudo; "Mandato todo" com `aria-current="page"` | `tests/e2e/emendas.spec.ts:32`; `tests/integracao/emendas-leitura.test.ts:37-43` (11,1 mi / 7 mi / 2 mi / 9) | ✅ PASS |
| EMDUI-04 | `?emendas=AAAA#emendas`, soma do ano | `tests/e2e/emendas.spec.ts:84`, `:88`; `tests/integracao/emendas-leitura.test.ts:125` | ✅ PASS |
| EMDUI-05 | "Empenhado" compacto + nº de códigos distintos | `tests/e2e/emendas.spec.ts:35-36` `R$ 11,1 mi`, "9 emendas, orçamentos de 2024 a 2026" | ✅ PASS |
| EMDUI-06 | "Pago até agora" = pago + restos; % arredondado | `tests/e2e/emendas.spec.ts:38-40` `R$ 7 mi`, "63% do empenhado, incluindo restos a pagar"; `:90` "75%" | ✅ PASS |
| EMDUI-07 | "Transferências especiais (“emendas Pix”)" + % | `tests/e2e/emendas.spec.ts:41-43` | ✅ PASS |
| EMDUI-08 | Barras por ano só no mandato, rótulo com os anos | `tests/e2e/emendas.spec.ts:44-52`, `:91`; `tests/integracao/emendas-leitura.test.ts:50` | ✅ PASS |
| EMDUI-09 | 5 áreas, valor e % | `tests/integracao/emendas-leitura.test.ts:61`; `tests/e2e/emendas.spec.ts:59-60` | ✅ PASS |
| EMDUI-10 | 5 locais sem "MÚLTIPLO", rótulo, frase do Múltiplo | `tests/integracao/emendas-leitura.test.ts:68`; `tests/e2e/emendas.spec.ts:62-69` | ✅ PASS |
| EMDUI-11 | Até 5 favorecidos: nome, documento, tipo, município, valor | `tests/integracao/emendas-leitura.test.ts:81` (tipo = natureza jurídica, Assumption); `tests/e2e/emendas.spec.ts:71-77` (célula Tipo `toHaveText("Município")` e `toBeVisible()` nos dois projetos) | ⚠️ PASS com mutante vivo: **U15** (cabeçalho "Tipo" oculto no celular, células visíveis) |
| EMDUI-12 | Desktop: "…download em lote · base de DD/MM/AAAA" + coleta + 3 links; celular: rodapé curto | `tests/e2e/emendas.spec.ts:101-115` texto com "base de 09/11/2026 · coletado em 10/11/2026 05:12" e os 3 hrefs; `:98` celular; `tests/integracao/emendas.test.ts:158-164` `observacao: "base de 10/11/2026"` | ❌ GAP: **N05/N09** sobrevivem (a regra "entrada `EmendasParlamentares.csv`" não é discriminada). ⚠️ `:98` não confere "ver original" do rodapé curto |
| EMDUI-13 | Frase de vazio exata; sem indicadores, gráfico, listas | `tests/e2e/emendas.spec.ts:121-126`; `tests/integracao/emendas-leitura.test.ts:155` | ✅ PASS |
| EMDUI-14 | Valor inválido → "mandato" | `tests/unit/emendas.test.ts:119-123`; `tests/e2e/emendas.spec.ts:130-135` | ✅ PASS |
| EMDUI-15 | `text/csv`, uma linha por emenda e local do período, 9 colunas | `tests/e2e/emendas.spec.ts:209` `text/csv; charset=utf-8`; `:212` cabeçalho; `:213-218` 4 linhas de 2025 (código `202590000003` em 2 locais); `:220` mandato `1 + 10` | ✅ PASS (o texto da spec agora bate com o comportamento) |

### P2: Marcar fornecedor da cota com sanção

| Critério | Resultado definido na spec | `arquivo:linha` + asserção | Resultado |
| --- | --- | --- | --- |
| SAN-01 | CEIS e CNEP mais recentes (até 7 dias), `coleta` `cgu_ceis`/`cgu_cnep`; só 404 recua | `tests/integracao/sancoes.test.ts:113` sequência de URLs; `:125-138` coletas com `observacao: "base de 10/11/2026"` e `"base de 11/11/2026"`; `:195-196` 403 → `ColetaBloqueada` e um único pedido | ✅ PASS (M09 morre) |
| SAN-02 | Só tipo "J" com CNPJ na cota | `tests/integracao/sancoes.test.ts:144` lista exata (a linha "104", tipo F com CNPJ da cota, `:48`, fica fora); `:170` | ✅ PASS (M10 morre) |
| SAN-03 | Nova coleta substitui cada cadastro | `tests/integracao/sancoes.test.ts:176` | ✅ PASS |
| SAN-04 | Selo "Sanção no CEIS"/"no CNEP" | `tests/e2e/emendas.spec.ts:163-165` | ✅ PASS |
| SAN-05 | Título, categoria, período, órgão, nº de notas dentro da sanção (limites inclusive, fim nulo sem prazo) | `tests/e2e/emendas.spec.ts:173-185`; `tests/integracao/emendas-leitura.test.ts:168-173`; `:230-233` `[["CEIS", 2], ["CNEP", 2]]` com notas em 09/03, 10/03, 20/06, 21/06, 31/12 | ✅ PASS (M12, M13, M14 morrem) |
| SAN-06 | Frase "O registro é do cadastro oficial da CGU e não indica irregularidade do parlamentar." | `tests/e2e/emendas.spec.ts:186-190` (frase + complemento do artboard) | ✅ PASS |
| SAN-07 | "sem data final" | `tests/unit/emendas.test.ts:130`; `tests/e2e/emendas.spec.ts:183-185` | ✅ PASS |

### P2: Metodologia e fontes

| Critério | Resultado definido na spec | `arquivo:linha` + asserção | Resultado |
| --- | --- | --- | --- |
| MET-01 | "1.4" | `tests/e2e/emendas.spec.ts:225`; `tests/e2e/perfil.spec.ts:176` | ✅ PASS |
| MET-02 | Seção "Emendas parlamentares" | `tests/e2e/emendas.spec.ts:226-230` | ✅ PASS |
| MET-03 | Seção "Sanções de fornecedores" | `tests/e2e/emendas.spec.ts:231-234` | ✅ PASS |
| MET-04 | Duas fontes do Portal na lateral | `tests/e2e/emendas.spec.ts:240-241` | ✅ PASS |
| MET-05 | "Como ligamos…" com a regra de homônimos | `tests/e2e/emendas.spec.ts:244` "…a emenda fica de fora." | ✅ PASS |

### Edge cases

| Critério | Resultado definido na spec | `arquivo:linha` + asserção | Resultado |
| --- | --- | --- | --- |
| EDGE-01 | 401/403 → `ColetaBloqueada`, nada gravado | `tests/integracao/emendas.test.ts:230-232` | ✅ PASS (só 403 exercitado) |
| EDGE-02 | Sem arquivo em 7 dias → erro, mantém sanções | `tests/integracao/sancoes.test.ts:206-208` | ✅ PASS |
| EDGE-03 | Vazio → 0 | `tests/unit/emendas.test.ts:28-30`; `tests/integracao/emendas.test.ts:184-191` | ✅ PASS |
| EDGE-04 | Empenhado 0: "—" no detalhe de "Pago até agora", sem barra, "— do empenhado" nas especiais | `tests/e2e/emendas.spec.ts:251` `toHaveText("—")`; `:252` `getByRole("img")).toHaveCount(0)`; `:253-255` "— do empenhado · vão direto ao caixa de estados e municípios, sem objeto definido" (seed 900000003, `src/db/seed.ts:245`) | ✅ PASS (U03, U12, U29 morrem) |
| EDGE-05 | 320 px sem rolagem; tabela rola na caixa | `tests/e2e/emendas.spec.ts:142`, `:144` | ✅ PASS |

**Situação**: 43/43 com evidência; 41 sem ressalva; EMDUI-12 com lacuna (N05/N09) e EMDUI-11 com mutante vivo
(U15); 1 lacuna de precisão menor (rodapé curto do celular sem "ver original" asserido).

---

## Sensor de discriminação

Worktree temporário (`git worktree add --detach <scratchpad>/mut HEAD`), `pnpm install --frozen-lockfile --offline`,
`.env` e `.env.local` copiados, banco `auditaja_emendas_test`, um mutante por vez, arquivo restaurado com
`git checkout --` depois de cada um. M*/N*: `pnpm test` (vitest). U*: `pnpm build` + `playwright test
tests/e2e/emendas.spec.ts` (desktop e celular, porta 3282). Linha de base no worktree temporário: 162/162 vitest,
build ok, 38/38 e2e de emendas.

### Sobreviventes da rodada 1, refeitos

| # | `arquivo:linha` | Mutação | Resultado |
| --- | --- | --- | --- |
| M09 | `src/ingest/transparencia.ts:129` | recua em qualquer erro (`throw e` → ignora) | ✅ morto (`sancoes.test.ts:179`) |
| M10 | `src/ingest/transparencia.ts:164` | remove `l["TIPO DE PESSOA"] !== "J"` | ✅ morto (`sancoes.test.ts:141`) |
| M12 | `src/data/emendas.ts:157` | `data_emissao >= data_inicio` → `>` | ✅ morto (`emendas-leitura.test.ts:182`) |
| M13 | `src/data/emendas.ts:158` | `<= coalesce(…)` → `<` | ✅ morto (`emendas-leitura.test.ts:182`) |
| M14 | `src/data/emendas.ts:158` | fim nulo `'infinity'` → `'-infinity'` | ✅ morto (`emendas-leitura.test.ts:182`) |
| U03 | `src/components/perfil/secao-emendas.tsx:174` | empenhado 0 mostra "0% do empenhado…" | ✅ morto (`emendas.spec.ts:247`) |

### Mutantes novos (partes novas e vizinhas)

| # | `arquivo:linha` | Mutação | Resultado |
| --- | --- | --- | --- |
| N01 | `src/lib/emendas.ts:100` | `brlMi` com 2 casas | ✅ morto |
| N02 | `src/lib/emendas.ts:102` | `brlMi` abaixo de 1 mi sem `brlCompacto` | ✅ morto |
| N03 | `src/lib/emendas.ts:107` | `baseDaColeta` devolve o casamento inteiro (`[0]`) | ✅ morto |
| N04 | `src/lib/emendas.ts:113` | `dataLocalBr` com mês −1 | ✅ morto |
| N05 | `src/ingest/transparencia.ts:41` | data da base lida de `EmendasParlamentares_PorFavorecido.csv` | ❌ **sobreviveu** |
| N06 | `src/ingest/transparencia.ts:159` | base das sanções com dia e mês trocados | ✅ morto |
| N07 | `src/ingest/transparencia.ts:127` | base das sanções sempre a data de hoje, mesmo após recuo | ✅ morto |
| N08 | `src/data/emendas.ts:166` | `base: null` nas sanções | ✅ morto |
| N09 | `src/ingest/arquivos.ts:106` | `dataDaEntrada` ignora o nome e devolve a primeira entrada | ❌ **sobreviveu** |
| U11 | `src/components/perfil/secao-emendas.tsx:38` | barra com `progresso !== undefined` (mostra com `null`) | ✅ morto pelo typecheck do `pnpm build` (não por teste) |
| U29 | `src/components/perfil/secao-emendas.tsx:173` | `progresso={pctPago ?? 0}` (barra com empenhado 0) | ✅ morto (`emendas.spec.ts:252`) |
| U12 | `src/components/perfil/secao-emendas.tsx:179` | especiais com empenhado 0 mostram "0%" | ✅ morto |
| U13 | `src/components/perfil/secao-emendas.tsx:179` | volta "caixa do município" | ✅ morto |
| U14 | `src/components/perfil/secao-emendas.tsx:315` | célula Tipo oculta no celular | ✅ morto |
| U15 | `src/components/perfil/secao-emendas.tsx:299` | cabeçalho Tipo oculto no celular (células visíveis) | ❌ **sobreviveu** |
| U16 | `src/components/perfil/secao-emendas.tsx:120` | rodapé sem "· base de" | ✅ morto |
| U17 | `src/components/perfil/secao-emendas.tsx:163` | "Empenhado" com `brl` | ✅ morto |
| U18 | `src/components/perfil/secao-emendas.tsx:172` | "Pago" sem formato | ✅ morto |
| U19 | `src/components/perfil/secao-emendas.tsx:262` | áreas com `brl` | ✅ morto |
| U27 | `src/components/perfil/secao-emendas.tsx:274` | frase do Múltiplo com `brl` | ✅ morto |
| U28 | `src/components/perfil/secao-emendas.tsx:317` | "Recebido" com `brl` | ✅ morto |
| U20 | `src/components/perfil/secao-emendas.tsx:279` | volta "“(UF)” e “Nacional” … definido." | ❌ **sobreviveu** (só paridade) |
| U21 | `src/components/perfil/secao-emendas.tsx:325` | remove "Prefeituras e fundos municipais aparecem pelo nome." | ❌ **sobreviveu** (só paridade) |
| U22 | `src/components/perfil/secao-emendas.tsx:251` | volta "Valores em milhões de reais." | ❌ **sobreviveu** (só paridade) |
| U23 | `src/components/perfil/sancao.tsx:88` | "Ver as N notas" com N+1 (plural) | ❌ **sobreviveu** (o seed só tem fornecedor sancionado com 1 nota) |
| U24 | `src/components/perfil/sancao.tsx:88` | sempre o plural ("Ver as 1 notas") | ✅ morto |
| U25 | `src/components/perfil/sancao.tsx:76` | ressalva sem "a cota é reembolso…" | ✅ morto |
| U26 | `src/components/perfil/sancao.tsx:100` | nota do cruzamento sem "· base de" | ✅ morto |

**Profundidade**: ampliada (35 mutações: 6 refeitas e 29 novas; caminho crítico de dados pessoais e cruzamento de
sanções).
**Resultado**: 28/35 mortos, 7 sobreviventes (3 em regra da spec: N05, N09, U15). FAIL ❌

**Isolamento**: `git status --porcelain` do worktree real vazio antes; depois, igual, exceto os relatórios desta
verificação. Worktree temporário removido com `git worktree remove --force` e `git worktree prune`. Nenhum
`git stash`.

---

## Gate

| Comando | Resultado |
| --- | --- |
| `TEST_DATABASE_URL=…/auditaja_emendas_test pnpm test` | 16 arquivos, 162 passaram, 0 falharam |
| `pnpm typecheck`, `pnpm lint`, `pnpm build` | exit 0 |
| `pnpm test:e2e` (`E2E_PORT=3272`, Chromium 1228) | 128 passaram, 4 pulados, 0 falharam |

- **Testes antes da feature** (vitest): 113; **rodada 1**: 157; **agora**: 162 (+5: limites da sanção, 404/403,
  `brlMi`, `baseDaColeta`, `dataLocalBr`).
- **e2e**: 124 → 128 (2 testes novos × 2 projetos: EDGE-04 e C24).
- **Pulados**: os mesmos 4 de `tests/e2e/perfil.spec.ts` (`:77`, `:228`, `:267`, `:277`), anteriores à feature.
- **Integridade**: nenhum teste removido. Três asserções mudaram de valor junto com o texto do artboard
  (`emendas.spec.ts:102`, `:187`, `:191`); `:76-77` ficou mais forte (antes pulava a coluna Tipo no celular).

---

## Qualidade de código

| Princípio | Situação |
| --- | --- |
| Código mínimo / sem escopo extra | ✅ |
| Mudanças cirúrgicas | ✅ (o `innerJoin` com `coleta` em `sancoesDosFornecedores` é o mínimo para a base) |
| Segue os padrões do projeto | ✅ |
| Resultado asserido bate com a spec | ⚠️ data da base das emendas sem fixture que separe as entradas do ZIP |
| Cobertura por camada | ⚠️ "Ver as N notas" só tem o caso singular; rota `emendas.csv` segue sem teste de id inválido (apontado na rodada 1) |
| Todo teste mapeia um critério | ✅ (`emendas.spec.ts:258` "C24" e `tests/unit/emendas.test.ts:152` "C06, C17" mapeiam EMDUI-12/Assumptions e itens de paridade) |
| Guias documentados | `AGENTS.md` (Next.js 16); nenhum desvio achado |

---

## Achados fora dos critérios

1. `src/components/perfil/sancao.tsx:88`: o link mostra o total de notas do fornecedor no período (M), não o N dentro
   da sanção como no artboard. Em `/parlamentares/74383`: "Nenhuma das 3 notas … tem data dentro desse período" e,
   logo abaixo, "Ver as 3 notas" (paridade C22).
2. `src/components/perfil/sancao.tsx:100`: a nota do cruzamento usa só a base da primeira sanção (`itens[0]`). Quando
   CEIS e CNEP têm bases diferentes (a própria fixture tem 10/11 e 11/11, `sancoes.test.ts:125-138`), uma das datas
   some.
3. `src/lib/emendas.ts:98-103`: valores entre R$ 999.500 e R$ 1 mi saem como "R$ 1.000 mil" (`brlCompacto` arredonda
   para mil antes de trocar de unidade); milhões redondos saem sem ",0" ("R$ 5 mi"), ao contrário dos rótulos das
   barras ("37,0") e do artboard (paridade C27).
4. `src/components/perfil/secao-emendas.tsx:249-252`: sem o ano corrente na série, o `<span>` da nota fica vazio no
   DOM.
5. Os dois achados da rodada 1 (Telefônica partida em 6 grafias; `getFullYear()` sem fuso de Brasília em
   `secao-emendas.tsx:155`) continuam.

---

## Planos de correção

### Correção 1: data da base das emendas (Major, EMDUI-12/Assumptions) — N05, N09
- **Tarefa**: em `tests/integracao/emendas.test.ts`, gerar o ZIP com `mtime` diferente por entrada (por exemplo
  `EmendasParlamentares.csv` em 10/11/2026 e `…_PorFavorecido.csv` em 09/11/2026, com a de favorecidos primeiro no
  ZIP) e manter `observacao: "base de 10/11/2026"`.
- **Pronto quando**: N05 e N09 morrem.

### Correção 2: cabeçalho Tipo no celular (Minor, EMDUI-11) — U15
- **Tarefa**: em `tests/e2e/emendas.spec.ts:70-77`, asserir os 5 cabeçalhos visíveis
  (`["Favorecido", "CNPJ/CPF", "Tipo", "Município", "Recebido"]`) nos dois projetos.
- **Pronto quando**: U15 morre.

### Correção 3: "Ver as N notas" (Minor, SAN-05/paridade C22) — U23
- **Tarefa**: decidir o N (artboard: notas dentro da sanção) e registrar na spec; semear um fornecedor sancionado com
  2+ notas e asserir o texto do link e o CSV que ele baixa.
- **Pronto quando**: U23 morre e C22 vira PASS ou INTENCIONAL.

### Correção 4: textos só de paridade (Cosmetic) — U20, U21, U22
- **Tarefa**: asserir em `emendas.spec.ts` as três notas do artboard (Emd:94, 115, 131).

### Correção 5: paridade C27 e C28 (Cosmetic)
- C27: `brlMi` com `minimumFractionDigits: 1`, como o artboard (`toFixed(1)`) e os rótulos das barras.
- C28: registrar na spec a forma "aplicada por {órgão}" (o artigo do artboard depende do gênero do órgão) ou seguir
  o artboard.

---

## Atualização da rastreabilidade

| Requisito | Antes (rodada 1) | Depois (rodada 2) |
| --- | --- | --- |
| EMD-01..11, EMDUI-01..10, EMDUI-13..15, SAN-01..07, MET-01..05, EDGE-01..05 | Verified / Needs Fix (SAN-01, SAN-02, SAN-05, EDGE-04) | ✅ Verified |
| EMDUI-11 | Verified (⚠️) | ⚠️ Needs Fix (U15) |
| EMDUI-12 | Verified (⚠️) | ❌ Needs Fix (N05, N09) |

---

## Resumo

**Geral**: ❌ Not Ready (perto: 3 mutantes de teste e 3 itens de texto)

**Checagem ancorada na spec**: 43/43 com evidência; 41 sem ressalva; EMDUI-12 (N05/N09) e EMDUI-11 (U15) com mutante
vivo; 1 lacuna de precisão menor
**Sensor**: 28/35 mortos (rodada 1: 25/31); os 6 sobreviventes da rodada 1 agora morrem
**Gate**: 162 vitest + 128 e2e passaram; typecheck, lint e build ok
**Paridade**: 95,4% (62 PASS, 3 FAIL, 8 INTENCIONAL), meta atingida; ver `paridade/verificacao-2.md`

**Próximos passos**: correções 1 e 2 (só testes) fecham o veredito; 3 a 5 deixam a paridade com folga.
