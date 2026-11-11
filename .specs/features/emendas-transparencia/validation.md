# Validation: emendas-transparencia — FAIL ❌

**Data**: 2026-11-11
**Spec**: `.specs/features/emendas-transparencia/spec.md` (43 critérios)
**Faixa do diff**: `e4e563d..93d6459` (branch `feat/emendas-transparencia`, 11 commits, 30 arquivos, +3187/−10)
**Verificador**: sub-agente independente (autor ≠ verificador), só leitura no worktree real; mutações em worktree temporário

---

## Veredito

**FAIL.** 42 de 43 critérios têm evidência `arquivo:linha` com o valor da spec; **EDGE-04 não tem evidência** (nenhum
teste e o mutante U03 sobrevive). O sensor de discriminação matou 25 de 31 mutantes; **6 sobreviveram**, todos em regras
que a spec define com precisão (Assumptions de sanção, SAN-01, SAN-02 e SAN-05). A paridade visual (relatório à parte,
`paridade/verificacao-1.md`) ficou em 81,8%, abaixo da meta de 95% dos Success Criteria.

---

## Conclusão das tarefas

`tasks.md` tem T1–T8 com todos os "Done when" marcados; nenhuma tarefa parcial ou bloqueada. A verificação de paridade (critério de
sucesso) é a deste relatório.

---

## Critérios de aceitação ancorados na spec

### P1: Coletar emendas em lote

| Critério | Resultado definido na spec | `arquivo:linha` + asserção | Resultado |
| --- | --- | --- | --- |
| EMD-01 | ZIP baixado 1 vez, pelo `ClienteEducado`, do servidor de arquivos da CGU | `tests/integracao/emendas.test.ts:144` `expect(pedidos.filter((u) => u === URL_EMENDAS)).toHaveLength(1)`; `:145` todos os pedidos começam com `https://dadosabertos-download.cgu.gov.br/` | ✅ PASS |
| EMD-02 | Linha em `coleta` com fonte `cgu_emendas`, URL, SHA-256, bytes, licença | `tests/integracao/emendas.test.ts:157` `toMatchObject({ url: URL_EMENDAS, sha256: sha256De(zip), bytes: zip.length, licenca: LICENCA_CGU })` (consulta filtra `fonte = 'cgu_emendas'`, `:154`) | ✅ PASS |
| EMD-03 | Só "Ano da Emenda" ≥ 2024 e tipo "Emenda Individual…" | `tests/integracao/emendas.test.ts:165` `toEqual(["202400010002", "202500010001"])` (fixture tem 2023 e bancada); `tests/unit/emendas.test.ts:55-58`, `:65` `ANO_INICIAL_EMENDAS === 2024` | ✅ PASS |
| EMD-04 | Autor casa com exatamente 1 deputado → `parlamentar_id` dele | `tests/integracao/emendas.test.ts:166` `rows.every((r) => r.parlamentar_id === SEED.deputada)`; `tests/unit/emendas.test.ts:42-43` | ✅ PASS |
| EMD-05 | 0 ou >1 deputados → descarta e conta no resumo impresso | `tests/integracao/emendas.test.ts:146` `toEqual({ emendas: 2, favorecidos: 4, autoresDescartados: 2 })`; `tests/unit/emendas.test.ts:46`, `:49` `toBeNull()`. Impressão: `scripts/ingest.ts:48` `console.log("emendas:", …)` (sem teste próprio; o objeto impresso é o asserido) | ✅ PASS |
| EMD-06 | "1.234,56" → 1234.56 exato em empenhado, liquidado, pago, restos pagos | `tests/unit/emendas.test.ts:18` `valorBr("1.234,56") === "1234.56"`; `tests/integracao/emendas.test.ts:172-175` `empenhado: "1000.00", liquidado: "800.00", pago: "500.00", rp_pagos: "100.00"` | ✅ PASS |
| EMD-07 | Favorecido da emenda gravada com tipo, UF, município, ano/mês, valor | `tests/integracao/emendas.test.ts:190-204` linhas exatas + `ano_mes: "202605"`, `tipo_favorecido`, `uf: "SP"`, `municipio: "CAMPINAS"`; favorecidos de 2023 e do homônimo ficam fora | ✅ PASS |
| EMD-08 | PF → nome "Beneficiário pessoa física"; doc só `***.ddd.ddd-**` ou nulo | `tests/integracao/emendas.test.ts:191-192` `[…, "Beneficiário pessoa física", null, "50.00"]` e `"***.113.861-**"`; `:208-210` sem "ACÁCIA", "FULANO", "12345678901"; `tests/unit/emendas.test.ts:71-80` | ✅ PASS |
| EMD-09 | 14 dígitos → formatado como CNPJ | `tests/integracao/emendas.test.ts:193` `"11.854.334/0001-49"`; `tests/unit/emendas.test.ts:83` | ✅ PASS |
| EMD-10 | Nova coleta substitui tudo numa transação, sem duplicar | `tests/integracao/emendas.test.ts:216-217` `contar("emenda") === 2`, `contar("emenda_favorecido") === 4` | ✅ PASS (atomicidade não é exercitada por falha no meio; o mutante M19 que remove o `delete` morre) |
| EMD-11 | CSV de favorecidos em streaming (latin1, `;`) | `tests/integracao/emendas.test.ts:231` `typeof it[Symbol.asyncIterator] === "function"`; `:233` primeira linha decodificada `"ACÁCIA GONÇALVES"` (fixture em latin1) | ✅ PASS |

### P1: Ver as emendas no perfil

| Critério | Resultado definido na spec | `arquivo:linha` + asserção | Resultado |
| --- | --- | --- | --- |
| EMDUI-01 | Aba "Emendas" entre "Gastos da cota" e "Votações", `#emendas` | `tests/e2e/emendas.spec.ts:13` `toEqual(["#gastos", "#emendas", "#votacoes"])`; `:14` texto "Emendas" | ✅ PASS |
| EMDUI-02 | h2 "Emendas parlamentares individuais" entre gastos e votações | `tests/e2e/emendas.spec.ts:20` heading nível 2; `:24` `toEqual(["gastos", "emendas", "votacoes"])` | ✅ PASS |
| EMDUI-03 | Mandato soma tudo; "Mandato todo" com `aria-current="page"` | `tests/e2e/emendas.spec.ts:32` `toHaveAttribute("aria-current", "page")`; `tests/integracao/emendas-leitura.test.ts:37` `totais` = 11,1 mi / 7 mi / 2 mi / 9 emendas | ✅ PASS |
| EMDUI-04 | Ano → `?emendas=AAAA#emendas` e soma só aquele ano | `tests/e2e/emendas.spec.ts:83` URL `?emendas=2025#emendas$`; `:87` "R$ 4 mi"; `tests/integracao/emendas-leitura.test.ts:125` `{ empenhado: 4_000_000, pago: 3_000_000, especiais: 0, emendas: 3, multiplo: 0 }` | ✅ PASS |
| EMDUI-05 | "Empenhado" em reais compactos + nº de emendas distintas pelo código | `tests/e2e/emendas.spec.ts:35-36` `R$ 11,1 mi`, "9 emendas, orçamentos de 2024 a 2026" (seed tem 10 linhas e 9 códigos; M16 morre) | ✅ PASS |
| EMDUI-06 | "Pago até agora" = pago + restos pagos; % arredondado | `tests/e2e/emendas.spec.ts:38-39` `R$ 7 mi`, "63% do empenhado, incluindo restos a pagar"; `:89` "75%" no ano | ✅ PASS |
| EMDUI-07 | "Transferências especiais (“emendas Pix”)" + % sobre o total | `tests/e2e/emendas.spec.ts:41-43` título, `R$ 2 mi`, "18% do empenhado" | ✅ PASS |
| EMDUI-08 | Só no mandato: barras empenhado/pago por ano, rótulo acessível com os anos | `tests/e2e/emendas.spec.ts:44-47` aria-label "…de 2024 a 2026"; `:48-52` tabela por ano; `:90` gráfico ausente no ano; `tests/integracao/emendas-leitura.test.ts:50` `porAno` | ✅ PASS |
| EMDUI-09 | 5 áreas de maior empenhado, valor e % | `tests/integracao/emendas-leitura.test.ts:61` 5 áreas exatas; `tests/e2e/emendas.spec.ts:59-60` 5 itens, "Saúde R$ 6 mi · 54%" | ✅ PASS |
| EMDUI-10 | 5 locais sem "MÚLTIPLO", rótulo formatado, frase com valor e % do Múltiplo | `tests/integracao/emendas-leitura.test.ts:68` 5 locais formatados; `tests/e2e/emendas.spec.ts:62-68`, `:69` "R$ 1 mi (9% do empenhado) estão marcados como “Múltiplo”…" | ✅ PASS |
| EMDUI-11 | Até 5 favorecidos por valor: nome, documento, tipo, município, valor | `tests/integracao/emendas-leitura.test.ts:81` 5 registros exatos; `tests/e2e/emendas.spec.ts:71-76` | ✅ PASS ⚠️ a coluna Tipo some abaixo de 640 px (`secao-emendas.tsx:294`, `:310`) e o e2e só confere o tipo fora do celular (`emendas.spec.ts:76`); a spec não fala de largura |
| EMDUI-12 | Rodapé "Fonte: Portal da Transparência (CGU), Emendas Parlamentares, download em lote" + data + "Ver no Portal", "Baixar CSV", "Contestar" | `tests/e2e/emendas.spec.ts:100-114` texto e os 3 hrefs (desktop) | ✅ PASS ⚠️ no celular o teste sai em `:97-98` e a página mostra só "ver original" (sem "Baixar CSV" e "Contestar"); segue o padrão aprovado do protótipo de celular, mas a spec não tem a exceção |
| EMDUI-13 | Sem emenda → frase exata; sem indicadores, gráfico, listas | `tests/e2e/emendas.spec.ts:120-125` frase exata, 0 indicadores, 0 nav, 0 tabela; `tests/integracao/emendas-leitura.test.ts:155` `vazio === true` | ✅ PASS |
| EMDUI-14 | Valor inválido → "mandato" | `tests/unit/emendas.test.ts:116-120`; `tests/e2e/emendas.spec.ts:132-133` com `2019` e `abc` | ✅ PASS |
| EMDUI-15 | `text/csv`, uma linha por emenda do período com as 9 colunas | `tests/e2e/emendas.spec.ts:208` `text/csv; charset=utf-8`; `:211` cabeçalho; `:212-218` linhas de 2025 | ✅ PASS ⚠️ a rota grava uma linha por (emenda, local): o código `202590000003` aparece 2 vezes e o mandato tem 10 linhas para 9 emendas (`:219`). A spec diz "uma linha por emenda"; precisa dizer "por emenda e local" |

### P2: Marcar fornecedor da cota com sanção

| Critério | Resultado definido na spec | `arquivo:linha` + asserção | Resultado |
| --- | --- | --- | --- |
| SAN-01 | CEIS e CNEP mais recentes (até 7 dias), `coleta` com `cgu_ceis`/`cgu_cnep`; só 404 recua (Assumptions) | `tests/integracao/sancoes.test.ts:111-115` sequência de URLs; `:123-126` coletas | ⚠️ PASS parcial: o mutante M09 (recuar em qualquer erro, não só 404) sobrevive |
| SAN-02 | Só tipo de pessoa "J" com CNPJ presente em `despesa_ceap` | `tests/integracao/sancoes.test.ts:132-157` só as 2 PJ da cota; `:158` sem o CPF | ❌ GAP: o mutante M10 (sem o filtro "J") sobrevive; a linha PF da fixture tem 11 dígitos e cai no filtro de 14 dígitos |
| SAN-03 | Nova coleta substitui cada cadastro numa transação | `tests/integracao/sancoes.test.ts:164` `toEqual(["101", "201"])` | ✅ PASS |
| SAN-04 | Selo "Sanção no CEIS"/"Sanção no CNEP" ao lado do fornecedor listado | `tests/e2e/emendas.spec.ts:162-164` | ✅ PASS |
| SAN-05 | Aviso: título, categoria, período, órgão e nº de notas com data dentro da sanção (limites inclusive; fim nulo = sem prazo, Assumptions) | `tests/e2e/emendas.spec.ts:172-184`; `tests/integracao/emendas-leitura.test.ts:168` `[…, 0]` e `[…, 1]`; `:185` `[0, 0]` | ❌ GAP: M12 (início exclusivo), M13 (fim exclusivo) e M14 (fim nulo tratado como encerrado) sobrevivem. Nenhuma nota cai num limite, e a única sanção sem fim (Gráfica, desde 01/05/2026) tem nota anterior ao início |
| SAN-06 | Frase "O registro é do cadastro oficial da CGU e não indica irregularidade do parlamentar." | `tests/e2e/emendas.spec.ts:186-188` | ✅ PASS |
| SAN-07 | Sem data final → "sem data final" | `tests/unit/emendas.test.ts:127` `"desde 01/05/2026, sem data final"`; `tests/e2e/emendas.spec.ts:182-184` | ✅ PASS |

### P2: Metodologia e fontes

| Critério | Resultado definido na spec | `arquivo:linha` + asserção | Resultado |
| --- | --- | --- | --- |
| MET-01 | `METODOLOGIA_VERSAO` = "1.4" | `tests/e2e/emendas.spec.ts:224` "Versão 1.4. Toda mudança gera nova versão."; `tests/e2e/perfil.spec.ts:176` `/^Versão 1\.4\./` | ✅ PASS |
| MET-02 | Seção "Emendas parlamentares": ligação por nome, desde 2024, definição de pago | `tests/e2e/emendas.spec.ts:226-229` | ✅ PASS |
| MET-03 | Seção "Sanções de fornecedores": CNPJ e nota dentro do período | `tests/e2e/emendas.spec.ts:231-233` | ✅ PASS |
| MET-04 | Fontes "Portal da Transparência · Emendas (lote)" e "· CEIS e CNEP (lote)" | `tests/e2e/emendas.spec.ts:239-240` | ✅ PASS |
| MET-05 | Bloco "Como ligamos a emenda ao deputado" com a regra de homônimos | `tests/e2e/emendas.spec.ts:243` | ✅ PASS |

### Edge cases

| Critério | Resultado definido na spec | `arquivo:linha` + asserção | Resultado |
| --- | --- | --- | --- |
| EDGE-01 | 401/403 → `ColetaBloqueada`, nada gravado | `tests/integracao/emendas.test.ts:223-225` `rejects.toBeInstanceOf(ColetaBloqueada)` e contagens iguais | ✅ PASS (só 403 é exercitado) |
| EDGE-02 | Sem arquivo nos 7 dias → erro e mantém as sanções | `tests/integracao/sancoes.test.ts:172-174` mensagem, 8 pedidos, sanções mantidas | ✅ PASS |
| EDGE-03 | Valor vazio → 0 | `tests/unit/emendas.test.ts:25-27`; `tests/integracao/emendas.test.ts:181-183` `"0.00"` | ✅ PASS |
| EDGE-04 | Empenhado 0 → % pago "—" | sem teste. O cabeçalho de `tests/integracao/emendas-leitura.test.ts:6` cita EDGE-04, mas nenhum `it` cobre; o código está em `src/components/perfil/secao-emendas.tsx:172` | ❌ GAP (sem evidência; U03 sobrevive) |
| EDGE-05 | 320 px sem rolagem horizontal; tabela rola na caixa | `tests/e2e/emendas.spec.ts:141` `scrollWidth <= 320`; `:143` `overflow-x-auto` | ✅ PASS |

**Situação**: ❌ 1 critério sem evidência (EDGE-04), 2 com mutantes sobreviventes (SAN-02, SAN-05), 1 parcial (SAN-01),
3 lacunas de precisão da spec (EMDUI-11, EMDUI-12, EMDUI-15).

---

## Sensor de discriminação

Worktree temporário (`git worktree add --detach … HEAD`) em
`/tmp/claude-1000/…/scratchpad/mut`, `pnpm install --frozen-lockfile`, `.env` e `.env.local` copiados, banco
`auditaja_emendas_test`, um mutante por vez. Mutantes M* rodaram `pnpm test` (vitest); mutantes U* rodaram
`pnpm build` + `playwright test tests/e2e/emendas.spec.ts` (desktop e celular, porta 3282). Linha de base no
worktree temporário: 157/157 passando.

| # | `arquivo:linha` | Mutação | Resultado |
| --- | --- | --- | --- |
| M01 | `src/ingest/transparencia.ts:49` | `ano >= ANO_INICIAL_EMENDAS` → `ano >= 2023` | ✅ morto |
| M02 | `src/ingest/transparencia.ts:49` | remove `!ehEmendaIndividual(tipo)` | ✅ morto |
| M03 | `src/lib/emendas.ts:30` | homônimo: `m.set(k, p.id)` (último vence) | ✅ morto |
| M04 | `src/lib/emendas.ts:48` | PF grava qualquer documento (`c \|\| null`) | ✅ morto |
| M05 | `src/data/emendas.ts:50` | total pago sem `rp_pagos` | ✅ morto |
| M06 | `src/data/emendas.ts:70` | locais incluem "MÚLTIPLO" | ✅ morto |
| M07 | `src/data/emendas.ts:7` | `LIMITE = 5` → `6` | ✅ morto |
| M08 | `src/ingest/transparencia.ts:108` | `DIAS_DE_RECUO = 7` → `6` | ✅ morto |
| M09 | `src/ingest/transparencia.ts:127` | recua em qualquer erro, não só HTTP 404 | ❌ **sobreviveu** |
| M10 | `src/ingest/transparencia.ts:161` | remove `l["TIPO DE PESSOA"] !== "J"` | ❌ **sobreviveu** |
| M11 | `src/ingest/transparencia.ts:161` | remove `!cnpjs.has(cnpj)` (CNPJ fora da cota) | ✅ morto |
| M12 | `src/data/emendas.ts:149` | `data_emissao >= data_inicio` → `>` | ❌ **sobreviveu** |
| M13 | `src/data/emendas.ts:150` | `data_emissao <= coalesce(data_fim…)` → `<` | ❌ **sobreviveu** |
| M14 | `src/data/emendas.ts:150` | fim nulo `'infinity'` → `'-infinity'` | ❌ **sobreviveu** |
| M15 | `src/lib/emendas.ts:81` | período aceita ano sem emenda | ✅ morto |
| M16 | `src/data/emendas.ts:52` | `count(distinct codigo)` → `count(codigo)` | ✅ morto |
| M17 | `src/data/emendas.ts:51` | filtro de especiais invertido (`<>`) | ✅ morto |
| M18 | `src/data/emendas.ts:147` | contagem de notas ignora o período exibido | ✅ morto |
| M19 | `src/ingest/transparencia.ts:98-99` | nova coleta não apaga as anteriores | ✅ morto |
| M20 | `src/lib/emendas.ts:14` | `valorBr` não tira o ponto de milhar | ✅ morto |
| M21 | `src/lib/emendas.ts:94` | tira ", sem data final" | ✅ morto |
| U01 | `src/components/perfil/secao-emendas.tsx:95` | remove `aria-current` de "Mandato todo" | ✅ morto |
| U02 | `src/components/perfil/secao-emendas.tsx:110-111` | frase de vazio com "2023" | ✅ morto |
| U03 | `src/components/perfil/secao-emendas.tsx:172` | empenhado 0 mostra "0% do empenhado" em vez de "—" | ❌ **sobreviveu** |
| U04 | `src/components/perfil/sancao.tsx:15` | selo nunca aparece | ✅ morto |
| U05 | `src/components/perfil/secao-emendas.tsx:75` | 3 botões de ano em vez de 2 | ✅ morto |
| U06 | `src/components/perfil/abas.tsx:7` | aba Emendas depois de Votações | ✅ morto |
| U07 | `src/app/parlamentares/[id]/emendas.csv/route.ts:26` | CSV ignora o período | ✅ morto |
| U08 | `src/components/perfil/sancao.tsx:75-76` | remove a ressalva do aviso | ✅ morto |
| U09 | `src/components/perfil/secoes.tsx:703` | fonte "CEIS e CNEP" renomeada | ✅ morto |
| U10 | `src/components/perfil/secao-emendas.tsx:108` | vazio renderiza o conteúdo | ✅ morto pelo typecheck do `pnpm build` (não por teste) |

**Profundidade**: ampliada (31 mutações; a feature grava dados pessoais e cruza sanções, tratado como caminho crítico de
integridade de dados).
**Result**: 25/31 mortos, 6 sobreviventes — FAIL ❌

**Isolamento**: `git status --porcelain` do worktree real vazio antes e depois (`diff` sem diferença); worktree temporário
removido com `git worktree remove --force` e `git worktree prune`. Nenhum `git stash`.

---

## Gate

| Comando | Resultado |
| --- | --- |
| `TEST_DATABASE_URL=…/auditaja_emendas_test pnpm test` | 16 arquivos, 157 passaram, 0 falharam |
| `pnpm typecheck && pnpm lint && pnpm build` | exit 0 |
| `pnpm test:e2e` (`E2E_PORT=3272`, Chromium 1228) | 124 passaram, 4 pulados, 0 falharam |

- **Testes antes da feature** (vitest): 113; **depois**: 157; **delta**: +44 (unit 21, integração 7 + 11 + 5).
- **e2e novos**: 16 testes em `tests/e2e/emendas.spec.ts`, rodados nos projetos desktop e celular.
- **Pulados**: os 4 são de `tests/e2e/perfil.spec.ts` (`:77`, `:228`, `:267`, `:277`), anteriores à feature e pulados
  por projeto (celular/desktop) de propósito.
- **Integridade**: o único teste antigo alterado é `tests/e2e/perfil.spec.ts:176` (versão 1.3 → 1.4, exigido por MET-01)
  e `tests/integracao/perfil.test.ts:169-171` (3 fontes novas na lista); nenhuma asserção ficou mais fraca.

---

## Qualidade de código

| Princípio | Situação |
| --- | --- |
| Código mínimo / sem escopo extra | ✅ (o link "Baixar as notas" no aviso é extra à spec, mas substitui "Ver as N notas" do artboard) |
| Mudanças cirúrgicas | ✅ |
| Segue os padrões do projeto (`ClienteEducado`, `registrarColeta`, `NotaFonte`, `classeFiltro`) | ✅ |
| Resultado asserido bate com a spec | ⚠️ SAN-02 e SAN-05 asserem os valores certos, mas os dados de teste não separam as regras (mutantes vivos) |
| Cobertura por camada (domínio 1:1; rota com caminho feliz, borda e erro) | ⚠️ `emendas.csv` não tem teste de id inválido (404 em `route.ts:15`) nem de deputado sem emenda |
| Todo teste mapeia um critério | ✅ ("PF aparece com rótulo genérico", `emendas-leitura.test.ts:133`, e "rótulo de localidade", `tests/unit/emendas.test.ts:96`, mapeiam Assumptions) |
| Guias documentados | `AGENTS.md` (Next.js 16) e padrões do perfil; nenhum desvio achado |

---

## Achados fora dos critérios

1. Em dados reais, `/parlamentares/73433` não mostra selo nem aviso: a Telefônica (CEIS desde 07/10/2026) aparece em
   6 grafias de nome e nenhuma entra na lista de maiores fornecedores. Está de acordo com SAN-04 ("fornecedor listado"),
   mas fornecedor sancionado partido em várias grafias some. O caso real com aviso usado na paridade foi
   `/parlamentares/74383` (CALGAN, CEIS).
2. `secao-emendas.tsx:153` decide a nota "ano ainda em curso" com `new Date().getFullYear()` no servidor, sem fuso de
   Brasília; entre 21h e 24h de 31/12 (UTC−3) o ano muda antes.

---

## Planos de correção

### Correção 1: EDGE-04 sem teste (Major)
- **Causa**: nenhum teste com empenhado total 0.
- **Tarefa**: semear um deputado com emendas de empenhado 0 (ou testar `ConteudoEmendas` com `totais.empenhado = 0`) e
  asserir "—" no indicador "Pago até agora" e ausência de barra.
- **Pronto quando**: U03 morre.

### Correção 2: limites da contagem de notas (Major, SAN-05)
- **Causa**: nenhuma nota no dia de início ou de fim; a sanção sem fim não tem nota depois do início.
- **Tarefa**: no seed, notas em `data_inicio` e em `data_fim` exatos e uma nota posterior ao início de uma sanção sem fim;
  asserir as contagens em `emendas-leitura.test.ts`.
- **Pronto quando**: M12, M13 e M14 morrem.

### Correção 3: filtro de tipo de pessoa "J" (Major, SAN-02)
- **Tarefa**: na fixture do CEIS, linha com `TIPO DE PESSOA` "F" e um documento de 14 dígitos igual a um CNPJ da cota;
  asserir que não é gravada.
- **Pronto quando**: M10 morre.

### Correção 4: recuo só em 404 (Minor, SAN-01/Assumptions)
- **Tarefa**: fixture em que a data de hoje responde 500; asserir que a coleta falha e não pede o dia anterior.
- **Pronto quando**: M09 morre.

### Correção 5: precisão da spec (Minor)
- EMDUI-15: trocar "uma linha por emenda" por "uma linha por emenda e local de aplicação".
- EMDUI-12 e EMDUI-11: registrar que no celular o rodapé é a versão curta com "ver original" e que a coluna Tipo some,
  ou mostrar os links e a coluna também no celular.

---

## Atualização da rastreabilidade

| Requisito | Antes | Depois |
| --- | --- | --- |
| EMD-01..11, EMDUI-01..15, SAN-03, SAN-04, SAN-06, SAN-07, MET-01..05, EDGE-01..03, EDGE-05 | Implementing | ✅ Verified |
| SAN-01 | Implementing | ⚠️ Needs Fix (M09) |
| SAN-02 | Implementing | ❌ Needs Fix (M10) |
| SAN-05 | Implementing | ❌ Needs Fix (M12–M14) |
| EDGE-04 | Implementing | ❌ Needs Fix (sem teste) |

---

## Resumo

**Geral**: ❌ Not Ready

**Checagem ancorada na spec**: 39/43 sem ressalva, 1 sem evidência (EDGE-04), 3 com mutante vivo (SAN-01, SAN-02,
SAN-05); 3 lacunas de precisão (EMDUI-11, EMDUI-12, EMDUI-15)
**Sensor**: 25/31 mortos
**Gate**: 157 vitest + 124 e2e passaram; typecheck, lint e build ok
**Paridade**: 81,8% (54 PASS, 12 FAIL, 5 INTENCIONAL), meta 95% — ver `paridade/verificacao-1.md`

**O que funciona**: coleta com uma requisição por arquivo, máscara de PF, homônimos, filtros de ano e tipo, somas,
período por `?emendas=`, CSV, selo e aviso, metodologia 1.4, acessibilidade (axe) e 320 px sem rolagem.

**Próximos passos**: correções 1–4 nos testes (sem mudar código de produção), correção 5 na spec, e os itens FAIL de
paridade (textos e formato de valor) ou o registro deles como divergência na spec; depois, nova verificação.
