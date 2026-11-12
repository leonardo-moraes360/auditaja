# Verificação 4 de paridade: emendas e sanções

Fonte da verdade: artboard aprovado `prototipo/Emendas.dc.html` (1440 px, dados fictícios). `Emd:NN` aponta a linha
desse arquivo. Rubrica: a mesma das verificações 1 a 3 (`verificacao-1.md` define V01–V22, L01–L12, C01–C26 e
M01–M06; `verificacao-2.md` e `verificacao-3.md` acrescentam C27–C29 e I6–I9). Nenhum item novo nesta rodada.

Páginas verificadas (build de `4ec5758`, `pnpm build` + `pnpm start` no worktree real):

- dados reais, banco `auditaja_emendas_dev` (coleta de emendas de 11/11/2026 15:47, depois de `b77e095`; CEIS e
  CNEP de 15:48), porta 3292: `/parlamentares/73433`, `/parlamentares/178829`, `/parlamentares/74383` (CALGAN,
  CEIS, 0 de 3 notas) e `/parlamentares/152605` (TELEFONICA BRASIL, CEIS, 3 de 9 notas), em 1440×900 e 390×844;
- seed, banco `auditaja_emendas_test`, pelo e2e (`pnpm test:e2e`, desktop e celular: 132 passaram, 4 pulados de
  `perfil.spec.ts`, anteriores à feature): 900000001, 900000002 e 900000003.

Medição: Playwright (Chromium 1228), `innerText`, `getComputedStyle` e `getBoundingClientRect`
(script em scratchpad, não versionado); CSV do link de notas com `curl`.

## O que mudou desde a verificação 3

Os commits `1a5ddc7..4ec5758` não mexem em classe de estilo nem em texto da seção. Mudam:

| Commit | Efeito visível | Itens afetados |
| --- | --- | --- |
| `b77e095`, `b57c537` | CPF solto no nome de favorecido PJ (MEI) e de sancionado vira `***.***.***-**` | C13 e C15 (tabela de favorecidos), C20 (título do aviso usa o nome do fornecedor da cota). Nos quatro perfis reais, nenhum dos 5 maiores favorecidos é MEI, e `innerText` não tem nenhum número com forma de CPF; o texto exibido é o mesmo da rodada 3 |
| `4ec5758` | "Metodologia v1.5" na lateral; "Versão 1.5." em `/metodologia` | C25 (lateral). O artboard não mostra o número da versão (Emd:211-212 lista só as fontes) |
| `1a5ddc7` | `gastos.csv` ignora data inexistente | C29: o link de 152605 segue com cabeçalho + 3 linhas (contra 9 sem `de`/`ate`) |

## Divergências intencionais (fora do denominador)

As mesmas I1–I9 da verificação 3, sem mudança na spec que as sustenta (`git diff 088fc3e..HEAD -- spec.md` só troca
"1.4" por "1.5" em MET-01 e na Assumption "Versão da metodologia", que agora explica o motivo: a 1.4 é da frente de
presença). A troca de versão não é divergência do artboard.

## Itens reconferidos

| ID | Esperado | Ref. | Medido (4ec5758) | Resultado |
| --- | --- | --- | --- | --- |
| V01 | Cartão `#FFFFFF`, borda 1 px `#E2E2DC`, raio 16, padding 24, gap 20 | Emd:36 | igual nas 4 páginas | PASS |
| V02 | h2 22 px Space Grotesk 700 | Emd:38 | igual | PASS |
| V06 | Indicador `#F6F6F3`, raio 12, padding 16, gap 6, sem borda | Emd:49 | igual | PASS |
| V17 | Selo `#FDF0E7`/`#7A2E09`, 12 px 600 | Emd:150 | igual (74383, 152605) | PASS |
| V18 | Aviso `#FDF0E7`, raio 12, padding 16/18, gap 14 | Emd:156 | igual | PASS |
| V19 | Título 15 px 700 `#7A2E09`; links 14 px 600 `#B4440E` | Emd:159-161 | igual; 152605 com 3 links | PASS |
| L01 | Abas `#gastos`, `#emendas`, `#votacoes` | Emd:25-27 | igual | PASS |
| L04 | 3 indicadores numa linha | Emd:48 | 3 × 253 px na mesma altura | PASS |
| C03–C05 | Indicadores | Emd:50-63 | "R$ 110,6 mi · 51 emendas, orçamentos de 2024 a 2026", "94% do empenhado, incluindo restos a pagar", "… vão direto ao caixa de estados e municípios, sem objeto definido" (I6) | PASS |
| C09 | Nota do gráfico só com a frase do ano corrente | Emd:94 | `figure > span` = "Em 2026 o ano ainda está em curso: …" | PASS |
| C12, C16 | Notas de locais e da tabela, texto do artboard | Emd:115, 131 | iguais ao artboard | PASS |
| C13, C15 | Tabela de 5 colunas, até 5 linhas; PF mascarada | Emd:123-127, 206 | 5 `th` com `table-cell` nas duas larguras; nenhum CPF no texto da página | PASS |
| C17 | "… download em lote · base de DD/MM/AAAA · coletado em …" | Emd:135 | "… base de 10/11/2026 · coletado em 11/11/2026 15:47" | PASS |
| C20–C22 | Título, texto e "Ver as N notas" | Emd:159-161 | 152605: "3 das 9 notas … têm data dentro desse período", link "Ver as 3 notas"; 74383: "Nenhuma das 3 …", sem link | PASS |
| C24 | "Fonte do cruzamento: … base de DD/MM/AAAA · comparação pelo CNPJ." | Emd:164 | "… base de 11/11/2026 · comparação pelo CNPJ." | PASS |
| C25 | Fontes do Portal na lateral | Emd:211-212 | "Portal da Transparência · Emendas (lote)", "… CEIS e CNEP (lote)", "Metodologia v1.5" | PASS |
| C27 | Milhões com uma casa | Emd:192 | "R$ 5,0 mi", "R$ 4,0 mi", "R$ 10,0 mi" | PASS |
| C29 | O link leva às N notas | Emd:160-161 | `…&de=2026-10-07&ate=2027-10-07`: cabeçalho + 3 linhas | PASS |
| M01 | Sem rolagem horizontal | EDGE-05 | `scrollWidth` 390 nas 4 páginas | PASS |
| M02, M06 | Tabela rola na caixa, 5 colunas | Emd:121-123 | caixa 324 px, tabela 593 px, `overflow-x: auto`; Tipo visível | PASS |
| M04 | Cartão de celular raio 14, padding 16, h2 18 px | rubrica do perfil | igual | PASS |
| M05 | Rodapé curto "… · coletado em DD/MM/AAAA · ver original" | `Mobile.dc.html` 411 | "Fonte: Portal da Transparência, emendas · coletado em 11/11/2026 · ver original" | PASS |

Itens não listados acima (V03–V05, V07–V16, V20–V22, L02–L03, L05–L12, C01–C02, C06–C08, C10–C11, C14, C18–C19,
C23, C26, C28, M03): sem mudança de código nem de texto desde `088fc3e`, e o e2e que os cobre passa. PASS como na
verificação 3 (C14, C26 e C28 seguem INTENCIONAL: I7, I8, I9).

## Conta

| | Quantidade |
| --- | --- |
| PASS | 65 (V 22, L 12, C 25, M 6) |
| FAIL | 0 |
| INTENCIONAL | 9 (I1–I9) |

**Paridade = 65 ÷ (65 + 0) = 100%.** Meta de 95%: **atingida**.

As três ressalvas da verificação 3 (C09/U22, C22/U30, C27/B03) estão fechadas: os três mutantes morrem nesta rodada
(`validation.md`, sensor).
