# Validation: emendas-transparencia — FAIL ❌

**Data**: 2026-11-11 (rodada 3, última antes de escalar ao usuário)
**Spec**: `.specs/features/emendas-transparencia/spec.md` (43 critérios + 22 Assumptions)
**Faixa do diff**: `e4e563d..888d019` (branch `feat/emendas-transparencia`, 36 arquivos, +4084/−13); a correção da
rodada 2 é `9b04266..888d019` (8 arquivos, +79/−22)
**Verificador**: sub-agente independente (autor ≠ verificador), só leitura no worktree real; mutações em worktree
temporário

---

## Veredito

**FAIL.** A paridade chegou a **100%** (65 PASS, 0 FAIL, 9 INTENCIONAL; `paridade/verificacao-3.md`), o gate passa e
os 43 critérios têm evidência `arquivo:linha` com o valor da spec. Mas o sensor (30 mutantes) achou **8
sobreviventes**; 4 deles em regra que a spec define:

1. **N09** (Assumption "Data da base", EMDUI-12): o commit `888d019` diz que mata N09, e não mata. A fixture agora dá
   datas diferentes às entradas (`tests/integracao/emendas.test.ts:71-73`), mas a entrada certa
   (`EmendasParlamentares.csv`) é a **primeira** do ZIP (`:130`). Um `dataDaEntrada` que ignora o nome e devolve a
   primeira entrada (`src/ingest/arquivos.ts:106`) passa. N05 (ler a entrada errada pelo nome) agora morre.
2. **U30** (Assumption "Link de notas no aviso", SAN-05/C22): voltar o rótulo para o total do fornecedor
   (`rotuloNotas(f.documentos)` em `src/components/perfil/sancao.tsx:94`) passa no e2e, porque no seed o único
   fornecedor com link tem N = M = 1. É exatamente o defeito da rodada 2; hoje está certo só porque o código está
   certo (conferido em dados reais, 152605: "3 das 9" e "Ver as 3 notas").
3. **G01 e G02** (Assumptions "Nota dentro do período", que diz "inclusive", e "Link de notas", em que o link baixa o
   `gastos.csv` filtrado por `de`/`ate`): trocar `>=` por `>` ou `<=` por `<` em
   `src/app/parlamentares/[id]/gastos.csv/route.ts:46-47` passa. O teste C22 (`tests/e2e/emendas.spec.ts:275-288`)
   só usa datas longe dos limites (nota em 10/02; limites 01/02, 11/02 e 09/02). Com o mutante, uma nota emitida no
   primeiro ou no último dia da sanção conta em N mas some do CSV: "Ver a nota" baixaria um CSV vazio.

Os outros 4 são menores: U22 (paridade C09 com `toContainText`), B03 (limite exato de R$ 1 mi), G05 (filtro `ano`
do `gastos.csv`, anterior à feature) e G07 (validação do formato de `de`, equivalente para entradas válidas).

## Mudanças na spec desde a rodada 2 (registro honesto ou afrouxamento?)

| Mudança (`888d019`, `spec.md:51-52`) | Leitura |
| --- | --- |
| "Órgão no aviso de sanção": "{categoria} {período}. Órgão sancionador: {órgão}." | Registro honesto. "aplicado pelo" do artboard só concorda com categoria e órgão masculinos; nos dados há "Multa", "Prefeitura Municipal de Fernandópolis (SP)", "CONSELHO REGIONAL DE MEDICINA SP", e a fonte não traz gênero. A forma neutra mostra o mesmo dado, e SAN-05 só exige "órgão sancionador". Aceito como INTENCIONAL I9 |
| "Link de notas no aviso": N = notas dentro da sanção; baixa `gastos.csv` com `de`/`ate`; sem nota, sem link | Aperta a regra (fecha a lacuna de precisão C22 da rodada 2). Não afrouxa nada: o caso N = 0 não aparece no artboard. Aceito. É a regra que U30, G01 e G02 mostram sem teste que a discrimine |

---

## Conclusão das tarefas

`tasks.md` T1–T8 com "Done when" marcados; nenhuma parcial ou bloqueada. As correções das rodadas 1 e 2 vieram em
commits de correção (`f8e8a5a`, `888d019`), sem tarefa nova em `tasks.md`.

---

## Critérios de aceitação ancorados na spec

### P1: Coletar emendas em lote

| Critério | Resultado definido na spec | `arquivo:linha` + asserção | Resultado |
| --- | --- | --- | --- |
| EMD-01 | ZIP baixado 1 vez, pelo `ClienteEducado`, do servidor de arquivos | `tests/integracao/emendas.test.ts:148` `pedidos.filter((u) => u === URL_EMENDAS)).toHaveLength(1)`; `:149` todos começam com `https://dadosabertos-download.cgu.gov.br/` | ✅ PASS |
| EMD-02 | `coleta` com `cgu_emendas`, URL, SHA-256, bytes, licença | `tests/integracao/emendas.test.ts:161-167` `toMatchObject({ url, sha256: sha256De(zip), bytes: zip.length, licenca: LICENCA_CGU, observacao: "base de 10/11/2026" })` | ✅ PASS |
| EMD-03 | Só ano ≥ 2024 e tipo "Emenda Individual…" | `tests/integracao/emendas.test.ts:175` `toEqual(["202400010002", "202500010001"])`; `tests/unit/emendas.test.ts:58-69` | ✅ PASS |
| EMD-04 | Autor casa com 1 deputado → `parlamentar_id` dele | `tests/integracao/emendas.test.ts:176`; `tests/unit/emendas.test.ts:46-47` | ✅ PASS |
| EMD-05 | 0 ou >1 → descarta e conta no resumo | `tests/integracao/emendas.test.ts:150` `toEqual({ emendas: 2, favorecidos: 4, autoresDescartados: 2 })` | ✅ PASS |
| EMD-06 | "1.234,56" → 1234.56 nos 4 campos | `tests/unit/emendas.test.ts:22` `toBe("1234.56")`; `tests/integracao/emendas.test.ts:177-186` | ✅ PASS |
| EMD-07 | Favorecido com tipo, UF, município, ano/mês, valor | `tests/integracao/emendas.test.ts:200-215` | ✅ PASS |
| EMD-08 | PF → "Beneficiário pessoa física"; doc `***.ddd.ddd-**` ou nulo | `tests/integracao/emendas.test.ts:200-204`, `:218` `not.toContain("ACÁCIA")`; `tests/unit/emendas.test.ts:74-84` | ✅ PASS |
| EMD-09 | 14 dígitos → CNPJ formatado | `tests/integracao/emendas.test.ts:203` `"11.854.334/0001-49"`; `tests/unit/emendas.test.ts:86-90` | ✅ PASS |
| EMD-10 | Nova coleta substitui, sem duplicar | `tests/integracao/emendas.test.ts:226-227` `contar("emenda") === 2`, `contar("emenda_favorecido") === 4` | ✅ PASS |
| EMD-11 | Streaming latin1 `;` | `tests/integracao/emendas.test.ts:241-243` iterador assíncrono, `"ACÁCIA GONÇALVES"` | ✅ PASS |

### P1: Ver as emendas no perfil

| Critério | Resultado definido na spec | `arquivo:linha` + asserção | Resultado |
| --- | --- | --- | --- |
| EMDUI-01 | Aba "Emendas" entre "Gastos da cota" e "Votações", `#emendas` | `tests/e2e/emendas.spec.ts:13` `toEqual(["#gastos", "#emendas", "#votacoes"])` | ✅ PASS |
| EMDUI-02 | h2 "Emendas parlamentares individuais" entre gastos e votações | `tests/e2e/emendas.spec.ts:17-25` | ✅ PASS |
| EMDUI-03 | Mandato soma tudo; "Mandato todo" com `aria-current="page"` | `tests/e2e/emendas.spec.ts:32`; `tests/integracao/emendas-leitura.test.ts:37-43` | ✅ PASS |
| EMDUI-04 | `?emendas=AAAA#emendas`, soma do ano | `tests/e2e/emendas.spec.ts:93` `aria-current`; `:96-98` `R$ 4,0 mi`, "3 emendas do orçamento de 2025", "75%"; `tests/integracao/emendas-leitura.test.ts:125` | ✅ PASS |
| EMDUI-05 | "Empenhado" compacto + nº de códigos distintos | `tests/e2e/emendas.spec.ts:35-36` `R$ 11,1 mi`, "9 emendas, orçamentos de 2024 a 2026" | ✅ PASS |
| EMDUI-06 | "Pago até agora" = pago + restos; % arredondado | `tests/e2e/emendas.spec.ts:38-40` `R$ 7,0 mi`, "63% do empenhado, incluindo restos a pagar" | ✅ PASS |
| EMDUI-07 | "Transferências especiais (“emendas Pix”)" + % | `tests/e2e/emendas.spec.ts:41-43` `R$ 2,0 mi`, "18% do empenhado" | ✅ PASS |
| EMDUI-08 | Barras por ano só no mandato, rótulo com os anos | `tests/e2e/emendas.spec.ts:44-52`; `:99` `toHaveCount(0)` no ano | ✅ PASS |
| EMDUI-09 | 5 áreas, valor e % | `tests/e2e/emendas.spec.ts:59-60` `toHaveCount(5)`, `Saúde R$ 6,0 mi · 54%`; `tests/integracao/emendas-leitura.test.ts:61` | ✅ PASS |
| EMDUI-10 | 5 locais sem "MÚLTIPLO", rótulo, frase do Múltiplo | `tests/e2e/emendas.spec.ts:62-69`; `tests/integracao/emendas-leitura.test.ts:68` | ✅ PASS |
| EMDUI-11 | Até 5 favorecidos: nome, documento, tipo, município, valor | `tests/e2e/emendas.spec.ts:71-77`, `:85`: célula Tipo `toHaveText("Município")` e `columnheader "Tipo"` `toBeVisible()` nos dois projetos | ✅ PASS (U15 morre) |
| EMDUI-12 | Desktop: "…download em lote · base de DD/MM/AAAA" + coleta + 3 links; celular: rodapé curto | `tests/e2e/emendas.spec.ts:109-123`; `:106` celular; `tests/integracao/emendas.test.ts:166` `observacao: "base de 10/11/2026"` | ❌ GAP: **N09** sobrevive (a regra "entrada `EmendasParlamentares.csv`" não é discriminada contra "primeira entrada"). ⚠️ `:106` segue sem "ver original" |
| EMDUI-13 | Frase de vazio exata; sem indicadores, gráfico, listas | `tests/e2e/emendas.spec.ts:129-134` | ✅ PASS |
| EMDUI-14 | Valor inválido → "mandato" | `tests/unit/emendas.test.ts:120-124`; `tests/e2e/emendas.spec.ts:137-144` | ✅ PASS |
| EMDUI-15 | `text/csv`, uma linha por emenda e local do período, 9 colunas | `tests/e2e/emendas.spec.ts:219` `text/csv; charset=utf-8`; `:222` cabeçalho; `:223-228` 4 linhas; `:230` `1 + 10` | ✅ PASS |

### P2: Marcar fornecedor da cota com sanção

| Critério | Resultado definido na spec | `arquivo:linha` + asserção | Resultado |
| --- | --- | --- | --- |
| SAN-01 | CEIS e CNEP mais recentes (até 7 dias), `coleta` `cgu_ceis`/`cgu_cnep` | `tests/integracao/sancoes.test.ts:113`, `:125-138`, `:195-196` | ✅ PASS |
| SAN-02 | Só tipo "J" com CNPJ na cota | `tests/integracao/sancoes.test.ts:144`, `:170` | ✅ PASS |
| SAN-03 | Nova coleta substitui cada cadastro | `tests/integracao/sancoes.test.ts:176` | ✅ PASS |
| SAN-04 | Selo "Sanção no CEIS"/"no CNEP" | `tests/e2e/emendas.spec.ts:171-172` | ✅ PASS |
| SAN-05 | Título, categoria, período, órgão sancionador, nº de notas dentro da sanção; link conforme a Assumption "Link de notas" | `tests/e2e/emendas.spec.ts:184-192` texto com "Órgão sancionador: …" e a contagem; `:199-202` `href` com `&de=2026-02-01&ate=2027-02-01`; `:204` sem link quando N = 0; `:275-288` CSV filtrado; `tests/integracao/emendas-leitura.test.ts:230-233`; `tests/unit/emendas.test.ts:174-175` `rotuloNotas` | ⚠️ PASS com mutantes vivos: **U30** (rótulo com o total M), **G01/G02** (limites do CSV não inclusivos) |
| SAN-06 | Frase "O registro é do cadastro oficial da CGU e não indica irregularidade do parlamentar." | `tests/e2e/emendas.spec.ts:194-197` | ✅ PASS |
| SAN-07 | "sem data final" | `tests/unit/emendas.test.ts:131`; `tests/e2e/emendas.spec.ts:192` | ✅ PASS |

### P2: Metodologia e fontes

| Critério | Resultado definido na spec | `arquivo:linha` + asserção | Resultado |
| --- | --- | --- | --- |
| MET-01 | "1.4" | `tests/e2e/emendas.spec.ts:235` "Versão 1.4. …" | ✅ PASS |
| MET-02 | Seção "Emendas parlamentares" | `tests/e2e/emendas.spec.ts:236-240` | ✅ PASS |
| MET-03 | Seção "Sanções de fornecedores" | `tests/e2e/emendas.spec.ts:241-244` | ✅ PASS |
| MET-04 | Duas fontes do Portal na lateral | `tests/e2e/emendas.spec.ts:250-251` | ✅ PASS |
| MET-05 | "Como ligamos…" com a regra de homônimos | `tests/e2e/emendas.spec.ts:254` | ✅ PASS |

### Edge cases

| Critério | Resultado definido na spec | `arquivo:linha` + asserção | Resultado |
| --- | --- | --- | --- |
| EDGE-01 | 401/403 → `ColetaBloqueada`, nada gravado | `tests/integracao/emendas.test.ts:230-235` | ✅ PASS (só 403 exercitado) |
| EDGE-02 | Sem arquivo em 7 dias → erro, mantém sanções | `tests/integracao/sancoes.test.ts:206-208` | ✅ PASS |
| EDGE-03 | Vazio → 0 | `tests/unit/emendas.test.ts:29-31` | ✅ PASS |
| EDGE-04 | Empenhado 0: "—", sem barra, "— do empenhado" | `tests/e2e/emendas.spec.ts:261-265` | ✅ PASS |
| EDGE-05 | 320 px sem rolagem; tabela rola na caixa | `tests/e2e/emendas.spec.ts:150` `scrollWidth <= 320` | ✅ PASS |

**Situação**: 43/43 com evidência; 41 sem ressalva; EMDUI-12 com lacuna (N09) e SAN-05 com mutantes vivos (U30,
G01, G02); 1 lacuna de precisão menor (rodapé curto do celular sem "ver original").

---

## Sensor de discriminação

Worktree temporário (`git worktree add --detach <scratchpad>/mut HEAD`), `pnpm install --frozen-lockfile --offline`,
`.env*` copiados, banco `auditaja_emendas_test`, um mutante por vez, troca de texto exata (uma ocorrência) e
`git checkout --` depois de cada um. Mutantes de lógica: `pnpm test`. Mutantes de UI e de rota: `pnpm build` +
`playwright test tests/e2e/emendas.spec.ts tests/e2e/perfil.spec.ts` (desktop e celular, porta 3282).

### Sobreviventes da rodada 2, refeitos

| # | `arquivo:linha` | Mutação | Resultado |
| --- | --- | --- | --- |
| N05 | `src/ingest/transparencia.ts:41` | data da base lida de `EmendasParlamentares_PorFavorecido.csv` | ✅ morto (`emendas.test.ts` EMD-02) |
| N09 | `src/ingest/arquivos.ts:106` | `dataDaEntrada` ignora o nome e devolve a primeira entrada | ❌ **sobreviveu** (a entrada certa é a primeira do ZIP, `emendas.test.ts:130`) |
| N09b | `src/ingest/arquivos.ts:106` | filtro do nome invertido (devolve a primeira entrada que **não** é a pedida) | ✅ morto |
| U15 | `src/components/perfil/secao-emendas.tsx:299` | cabeçalho Tipo oculto no celular | ✅ morto (`emendas.spec.ts:77`) |
| U20 | `src/components/perfil/secao-emendas.tsx:279` | volta "“(UF)” e “Nacional” … definido." | ✅ morto (`:78`) |
| U21 | `src/components/perfil/secao-emendas.tsx:325` | remove "Prefeituras e fundos municipais aparecem pelo nome." | ✅ morto (`:79-81`) |
| U22 | `src/components/perfil/secao-emendas.tsx:251` | volta "Valores em milhões de reais." antes da frase | ❌ **sobreviveu** (`:82-84` usa `toContainText`) |
| U23 | `src/components/perfil/sancao.tsx:94` | `rotuloNotas(s.notas + 1)` | ✅ morto (`:199`) |

### Mutantes novos

| # | `arquivo:linha` | Mutação | Resultado |
| --- | --- | --- | --- |
| R01 | `src/lib/emendas.ts:118` | `rotuloNotas` plural com N+1 | ✅ morto (`unit/emendas.test.ts:175`) |
| R02 | `src/lib/emendas.ts:118` | singular só para `n === 2` | ✅ morto |
| B01 | `src/lib/emendas.ts:100` | `brlMi` sem `minimumFractionDigits` (volta "R$ 7 mi") | ✅ morto |
| B02 | `src/lib/emendas.ts:100` | `brlMi` com duas casas | ✅ morto |
| B03 | `src/lib/emendas.ts:99` | `>= 1_000_000` → `> 1_000_000` | ❌ **sobreviveu** (sem caso no limite) |
| S01 | `src/data/emendas.ts:155` | contagem sem o filtro do período exibido (`ano in anosCeap`) | ✅ morto |
| S02 | `src/lib/emendas.ts:89` | concordância `n >= 1 ? "têm"` | ✅ morto |
| U30 | `src/components/perfil/sancao.tsx:94` | `rotuloNotas(f.documentos)` (total M, o defeito da rodada 2) | ❌ **sobreviveu** (seed com N = M = 1) |
| U31 | `src/components/perfil/sancao.tsx:88` | condição `f.documentos > 0` no lugar de `s.notas > 0` | ✅ morto (`emendas.spec.ts:204`) |
| U32 | `src/components/perfil/sancao.tsx:88` | `s.notas >= 0` | ✅ morto (`:204`) |
| U33 | `src/components/perfil/secoes.tsx:296` | `href` sem `&ate=` | ✅ morto (`:199-202`) |
| U34 | `src/components/perfil/sancao.tsx:90` | `de` e `ate` trocados no `href` | ✅ morto |
| U35 | `src/components/perfil/sancao.tsx:75` | volta "…, aplicada por {órgão}." | ✅ morto (`:185`, `:192`) |
| U36 | `src/components/perfil/sancao.tsx:75` | "Órgão sancionador: {cadastro}" | ✅ morto |
| U37 | `src/components/perfil/sancao.tsx:75` | "Órgão: {órgão}" no lugar de "Órgão sancionador:" | ✅ morto |
| G01 | `src/app/parlamentares/[id]/gastos.csv/route.ts:46` | `>= de` → `> de` | ❌ **sobreviveu** |
| G02 | `src/app/parlamentares/[id]/gastos.csv/route.ts:47` | `<= ate` → `< ate` | ❌ **sobreviveu** |
| G03 | `…/gastos.csv/route.ts:46` | remove o filtro `de` | ✅ morto (`emendas.spec.ts:282-285`) |
| G04 | `…/gastos.csv/route.ts:47` | remove o filtro `ate` | ✅ morto (`:286-287`) |
| G05 | `…/gastos.csv/route.ts:44` | remove o filtro `ano` (anterior à feature) | ❌ sobreviveu (fora do diff: o seed só tem notas de 2026; `perfil.spec.ts:236` não confere linhas) |
| G06 | `…/gastos.csv/route.ts:45` | remove o filtro `doc` (anterior à feature) | ✅ morto (`emendas.spec.ts:279-280`) |
| G07 | `…/gastos.csv/route.ts:46` | `de` sem validar o formato | ❌ sobreviveu (equivalente para entradas válidas; a spec não define entrada inválida) |

**Profundidade**: ampliada (30 mutações: 8 refeitas e 22 novas; caminho de dados pessoais e de cruzamento de
sanções).
**Resultado**: 22/30 mortos, 8 sobreviventes (4 em regra da spec: N09, U30, G01, G02). FAIL ❌

**Isolamento**: `git status --porcelain` do worktree real vazio antes; depois, igual, exceto os relatórios desta
verificação. Worktree temporário removido com `git worktree remove --force` e `git worktree prune`. Nenhum
`git stash`. Servidores das portas 3282 e 3292 (deste worktree, conferido por `readlink /proc/PID/cwd`) parados.

---

## Gate

| Comando | Resultado |
| --- | --- |
| `TEST_DATABASE_URL=…/auditaja_emendas_test pnpm test` | 16 arquivos, 163 passaram, 0 falharam |
| `pnpm typecheck`, `pnpm lint`, `pnpm build` | exit 0 |
| `pnpm test:e2e` (`E2E_PORT=3272`, Chromium 1228) | 130 passaram, 4 pulados, 0 falharam |

- **Testes antes da feature** (vitest): 113; rodada 2: 162; **agora**: 163 (+1: `rotuloNotas`).
- **e2e**: 128 → 130 (C22 do CSV × 2 projetos).
- **Pulados**: os mesmos 4 de `tests/e2e/perfil.spec.ts`, anteriores à feature.
- **Integridade**: nenhum teste removido. As asserções que mudaram de valor acompanham mudanças registradas
  ("R$ 7 mi" → "R$ 7,0 mi", C27; "aplicada por" → "Órgão sancionador:", I9; `href` com `de`/`ate`, Assumption "Link
  de notas"). Nenhuma ficou mais fraca.
- **Rota `gastos.csv` existente**: sem `de`/`ate` a consulta é a mesma de `e4e563d` (as duas linhas novas só
  acrescentam `where`). Conferido em dados reais (152605): `?ano=2026` 71 linhas, `?ano=2026&doc=…` 10, nome do
  arquivo igual; `perfil.spec.ts:228-241` passa. Nada do comportamento anterior quebrou.

---

## Qualidade de código

| Princípio | Situação |
| --- | --- |
| Código mínimo / sem escopo extra | ✅ |
| Mudanças cirúrgicas | ✅ (a rota existente ganhou só dois filtros opcionais) |
| Segue os padrões do projeto | ✅ |
| Resultado asserido bate com a spec | ⚠️ data da base (N09) e limites inclusivos do CSV (G01/G02) sem caso que discrimine |
| Cobertura por camada | ⚠️ link de notas sem caso N ≠ M; rota `gastos.csv` sem caso de data inválida |
| Todo teste mapeia um critério | ✅ (`emendas.spec.ts:275` "C22" e `unit/emendas.test.ts:172` mapeiam a Assumption "Link de notas") |
| Guias documentados | `AGENTS.md` (Next.js 16); nenhum desvio achado |

---

## Achados fora dos critérios

1. `src/app/parlamentares/[id]/gastos.csv/route.ts:46-47`: uma data com o formato certo e valor inválido
   (`?ate=2026-13-99`, `?de=2026-02-30`) passa no regex e faz o Postgres falhar: **500** (conferido em 3292). Sem
   `de`/`ate` nada muda, e o link gerado pela página sempre traz datas válidas. Sugestão: validar a data ou ignorar
   o parâmetro inválido, como já se faz com `ano`.
2. `src/data/emendas.ts:156` × `src/components/perfil/secoes.tsx:294`: N casa o fornecedor pelos dígitos do CNPJ;
   o CSV, pelo texto exato de `fornecedor_doc`. Hoje não diverge (0 CNPJs com mais de uma grafia no banco dev), mas
   uma grafia diferente faria o CSV ter menos linhas que N.
3. Seguem da rodada 2: a nota do cruzamento usa só a base da primeira sanção (`sancao.tsx:107`); valores entre
   R$ 999.500 e R$ 1 mi saem "R$ 1.000 mil"; `<span>` vazio sob o gráfico sem o ano corrente; `getFullYear()` sem
   fuso de Brasília em `secao-emendas.tsx`.

---

## Planos de correção

### Correção 1: data da base pela entrada certa (Major, EMDUI-12/Assumption "Data da base") — N09
- **Tarefa**: em `tests/integracao/emendas.test.ts:130`, montar o ZIP com `EmendasParlamentares_PorFavorecido.csv`
  **antes** de `EmendasParlamentares.csv` (as datas por entrada já estão em `:71-73`).
- **Pronto quando**: N09 morre e N05 continua morto.

### Correção 2: link de notas com N ≠ M (Major, SAN-05/Assumption "Link de notas") — U30
- **Tarefa**: no seed, dar ao fornecedor sancionado com link ao menos 3 notas no período exibido, só parte delas
  dentro da sanção (por exemplo, 2 de 3); asserir "2 das 3 notas …" e o link "Ver as 2 notas".
- **Pronto quando**: U30 e U23 morrem.

### Correção 3: limites inclusivos do CSV (Major, Assumptions "Nota dentro do período" e "Link de notas") — G01, G02
- **Tarefa**: em `tests/e2e/emendas.spec.ts:275-288`, pedir o CSV com `de` e `ate` iguais à data da nota
  (`de=2026-02-10&ate=2026-02-10`) e asserir cabeçalho + 1 linha.
- **Pronto quando**: G01 e G02 morrem.

### Correção 4 (Minor/Cosmetic) — U22, B03
- U22: asserir o `<span>` da nota do gráfico com `toHaveText` exato.
- B03: `expect(brlMi(1_000_000)).toMatch(/^R\$\s1,0 mi$/)`.

---

## Atualização da rastreabilidade

| Requisito | Antes (rodada 2) | Depois (rodada 3) |
| --- | --- | --- |
| EMD-01..11, EMDUI-01..11, EMDUI-13..15, SAN-01..04, SAN-06, SAN-07, MET-01..05, EDGE-01..05 | Verified (EMDUI-11 Needs Fix) | ✅ Verified |
| EMDUI-12 | ❌ Needs Fix (N05, N09) | ❌ Needs Fix (N09) |
| SAN-05 | Verified | ⚠️ Needs Fix (U30, G01, G02) |

---

## Resumo

**Geral**: ❌ Not Ready. Faltam 3 correções, todas só de teste (fixture, seed e uma asserção de limite); o código de
produção está certo nos casos conferidos em dados reais.

**Checagem ancorada na spec**: 43/43 com evidência; 41 sem ressalva; EMDUI-12 (N09) e SAN-05 (U30, G01, G02) com
mutante vivo; 1 lacuna de precisão menor
**Sensor**: 22/30 mortos; dos 7 sobreviventes da rodada 2, 5 morrem agora (N05, U15, U20, U21, U23); N09 e U22
continuam vivos
**Gate**: 163 vitest + 130 e2e passaram; typecheck, lint e build ok
**Paridade**: 100% (65 PASS, 0 FAIL, 9 INTENCIONAL); ver `paridade/verificacao-3.md`

**Próximos passos**: esta é a 3ª rodada; pelo limite de 3 iterações, escalar ao usuário com as correções 1 a 3.
