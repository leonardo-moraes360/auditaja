# Verificação 3 de paridade: emendas e sanções

Fonte da verdade: artboard aprovado `prototipo/Emendas.dc.html` (1440 px, dados fictícios). `Emd:NN` aponta a linha
desse arquivo. Rubrica: a mesma das verificações 1 e 2 (`verificacao-1.md`, `verificacao-2.md`), com um item novo
(C29) e uma divergência intencional nova (I9).

Páginas verificadas (build de `888d019`, `pnpm build` + `pnpm start` no worktree real):

- dados reais, banco `auditaja_emendas_dev` (coletas de 11/11/2026 14:31), porta 3292: `/parlamentares/73433`,
  `/parlamentares/178829` (emendas), `/parlamentares/74383` (CALGAN, CEIS, 0 de 3 notas dentro da sanção) e
  `/parlamentares/152605` (TELEFONICA BRASIL, CEIS, 3 de 9 notas dentro da sanção: o caso plural com N ≠ M, que a
  verificação 2 não tinha);
- seed, banco `auditaja_emendas_test`, pelo e2e (`tests/e2e/emendas.spec.ts`, desktop e celular, 130 passaram):
  900000001 (dois avisos), 900000002 (sem emendas), 900000003 (empenhado zero).

Medição: Playwright (Chromium 1228) em 1440×900 e 390×844, `innerText`, `getComputedStyle` e
`getBoundingClientRect`; CSV do link de notas baixado com `curl`. O commit `888d019` não mexe em classes de estilo:
o link novo de notas reaproveita a classe do link anterior. Amostra reconferida nesta rodada: cartão (`#FFFFFF`,
borda `#E2E2DC`, raio 16, padding 24, gap 20), h2 22 px Space Grotesk 700, indicadores (`#F6F6F3`, raio 12,
padding 16, gap 6), 3 × 253 px numa linha (desktop) e 3 × 324 px empilhados (celular); aviso `#FDF0E7`, raio 12,
padding 16/18 (16/16 no celular), gap 14; título do aviso 15 px 700 `#7A2E09`; texto 14 px `#3D424B` 21 px; os três
links do aviso de 152605 em 14 px 600 `#B4440E`.

## Como pontuar

- Item binário: **PASS** ou **FAIL**. Na dúvida, FAIL.
- Só é **INTENCIONAL** a divergência que a spec registra com motivo; sai do denominador e fica listada.
- **Paridade = PASS ÷ (PASS + FAIL)**. Meta: ≥ 95%.

## Divergências intencionais (fora do denominador)

| ID | Divergência | Onde a spec registra | Aceita? |
| --- | --- | --- | --- |
| I1 | Dados reais em vez dos fictícios; sem a faixa de proposta visual | `spec.md:3`, Goals | sim |
| I2 | Período a partir do orçamento de 2024 | Assumptions "Período do mandato", EMD-03 | sim |
| I3 | "MÚLTIPLO" fora da lista de locais, numa frase com valor e % | Assumptions "Localidade MÚLTIPLO", EMDUI-10 | sim |
| I4 | "Ver a base do CEIS no Portal" no lugar de "Ver a sanção no Portal" | Out of Scope (detalhe da sanção, captcha) | sim |
| I5 | Links com `aria-current="page"` no lugar de `<button aria-pressed>` | EMDUI-03, EMDUI-04 | sim |
| I6 (C05) | "caixa de estados e municípios" no lugar de "do município" (Emd:63) | Assumptions "Detalhe das transferências especiais" | sim |
| I7 (C14) | Coluna Tipo com a natureza jurídica da fonte (Emd:202-206) | Assumptions "Coluna Tipo dos favorecidos" | sim |
| I8 (C26) | "Como ligamos…" sem "até a conferência manual", com link para a metodologia (Emd:181) | Assumptions "Bloco Como ligamos" | sim |
| I9 (C28) | "{categoria} {período}. Órgão sancionador: {órgão}." no lugar de "…, aplicado pelo {órgão}." (Emd:160) | Assumptions "Órgão no aviso de sanção" (`spec.md:51`) | sim (ver abaixo) |

**Julgamento das duas linhas novas da spec** (`spec.md:51-52`):

- *Órgão no aviso de sanção*: registro honesto. "aplicado pelo" só concorda com categoria masculina e órgão
  masculino; nos dados reais há "Multa" (seed), "Impedimento/proibição…" e órgãos como "Prefeitura Municipal de
  Fernandópolis (SP)" (152605) e "CONSELHO REGIONAL DE MEDICINA SP" (74383), e a fonte não traz gênero. A forma
  neutra mostra a mesma informação (o órgão), não esconde nada e não afrouxa SAN-05, que só exige "órgão
  sancionador". Vale INTENCIONAL.
- *Link de notas no aviso*: não é afrouxamento; aperta a regra que a verificação 2 marcou como sem precisão (C22).
  Define N (notas dentro da sanção, o mesmo N do texto), o que o link baixa (`gastos.csv` com `de`/`ate`) e o caso
  sem nota (sem link). O artboard só mostra o caso com N > 0 ("4 das 9" e "Ver as 4 notas"); o caso N = 0 não está
  no artboard, então não há divergência a pontuar.

## Itens que mudaram desde a verificação 2

| ID | Esperado no artboard | Ref. | Medido (888d019) | V2 | V3 |
| --- | --- | --- | --- | --- | --- |
| C22 | Link "Ver as N notas" com o mesmo N de "N das M notas … têm data dentro desse período" | Emd:160-161 | 152605: "3 das 9 notas pagas a essa empresa em 2026 têm data dentro desse período" e link "Ver as 3 notas"; seed 900000001: "A única nota … tem data dentro" e "Ver a nota"; 74383 (0 de 3) e seed Gráfica (0 de 1): sem link, como a spec registra | FAIL | **PASS** |
| C27 | Milhões sempre com uma casa ("R$ 5,0 mi") | Emd:192 | "São Paulo (UF) R$ 5,0 mi" (73433); "R$ 4,0 mi", "R$ 3,0 mi", "R$ 2,0 mi" nos favorecidos (73433, 178829, 74383); "R$ 10,0 mi" (178829) | FAIL | **PASS** |
| C28 | "…, aplicado pelo {órgão}." | Emd:160 | "…. Órgão sancionador: CONSELHO REGIONAL DE MEDICINA SP." (74383), "…: Prefeitura Municipal de Fernandópolis (SP)." (152605), "…: Ministério Exemplo." (seed) | FAIL | **INTENCIONAL (I9)** |

## Item novo

| ID | Esperado no artboard | Ref. | Medido | Resultado |
| --- | --- | --- | --- | --- |
| C29 | O link "Ver as N notas" leva às N notas da frase (no artboard, as 4 notas dentro da sanção) | Emd:160-161 | 152605: `href` `/parlamentares/152605/gastos.csv?ano=2026&doc=02.558.157%2F0001-62&de=2026-10-07&ate=2027-10-07`; o CSV tem cabeçalho + 3 linhas (as 3 notas de 13/10/2026), contra 9 notas do fornecedor sem `de`/`ate`; nome do arquivo `ceap-152605-2026-fornecedor.csv` | PASS |

## Itens sem mudança

V01–V22 e L01–L12: PASS (estilos inalterados; amostra reconferida acima, inclusive V19 com três links). C01–C04,
C06–C13, C15–C21, C23–C25: PASS (textos reconferidos em 73433, 178829, 74383 e 152605; C09, C12 e C16 com o texto do
artboard; C17 "… download em lote · base de 10/11/2026 · coletado em 11/11/2026 14:31"; C24 "… base de 11/11/2026 ·
comparação pelo CNPJ."). M01–M06: PASS (`scrollWidth` 390 nas quatro páginas reais; os 5 `th` da tabela de
favorecidos com `display: table-cell` a 390 px, Tipo incluído; rodapé curto "Fonte: Portal da Transparência,
emendas · coletado em 11/11/2026 · ver original").

## Conta

| | Quantidade |
| --- | --- |
| PASS | 65 (V 22, L 12, C 25, M 6) |
| FAIL | 0 |
| INTENCIONAL | 9 (I1–I9) |

**Paridade = 65 ÷ (65 + 0) = 100%.** Meta de 95%: **atingida**.

Ressalva para a manutenção: três itens de paridade estão certos hoje, mas um teste não os protege (ver
`validation.md`, sensor). C09 (U22): a asserção usa `toContainText`, então volta a passar se alguém recolocar
"Valores em milhões de reais." antes da frase. C22 (U30): se o rótulo voltar a usar o total M, o e2e não percebe,
porque no seed N = M = 1. C27 no limite exato de R$ 1.000.000 (B03) não tem caso de teste.
