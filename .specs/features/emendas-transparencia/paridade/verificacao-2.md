# Verificação 2 de paridade: emendas e sanções

Fonte da verdade: artboard aprovado `prototipo/Emendas.dc.html` (1440 px, dados fictícios). `Emd:NN` aponta a linha
desse arquivo. Rubrica: a mesma da verificação 1 (`verificacao-1.md`), com dois itens novos (C27, C28).

Páginas verificadas (build de `f8e8a5a`, `pnpm start`):

- dados reais, banco `auditaja_emendas_dev` (coletas de 11/11/2026 14:31, já com `observacao = 'base de …'`),
  porta 3292: `/parlamentares/73433`, `/parlamentares/178829` (emendas) e `/parlamentares/74383` (CALGAN, CEIS);
- seed, banco `auditaja_emendas_test`, pelo e2e (`tests/e2e/emendas.spec.ts`, desktop e celular) e pelo sensor:
  900000001 (dois avisos), 900000002 (sem emendas), 900000003 (empenhado zero).

Medição: Playwright (Chromium 1228) em 1440×900 e 390×844, `innerText`, `getComputedStyle` e
`getBoundingClientRect`; capturas da seção em cada largura. O commit `f8e8a5a` não mexe em classes de estilo, exceto
a coluna Tipo (`secao-emendas.tsx:299`, `:315`). Os itens V e L foram aceitos da verificação 1 e reconferidos por
amostra nesta rodada: cartão (`#FFFFFF`, borda `#E2E2DC`, raio 16, padding 24, gap 20), h2 22 px Space Grotesk 700,
indicadores (`#F6F6F3`, raio 12, padding 16, gap 6; valor 26 px 700; detalhe 12 px `#555B66`), 3 × 253 px numa linha.

## Como pontuar

- Item binário: **PASS** ou **FAIL**. Na dúvida, FAIL.
- Só é **INTENCIONAL** a divergência que a spec registra com motivo; sai do denominador e fica listada.
- **Paridade = PASS ÷ (PASS + FAIL)**. Meta: ≥ 95%.

## Divergências intencionais (fora do denominador)

| ID | Divergência | Onde a spec registra | Aceita? |
| --- | --- | --- | --- |
| I1 | Dados reais em vez dos fictícios; sem a faixa de proposta visual | `spec.md:3`, Goals | sim |
| I2 | Período a partir do orçamento de 2024 ("orçamentos de 2024 a 2026") | Assumptions "Período do mandato", EMD-03 | sim |
| I3 | "MÚLTIPLO" fora da lista de locais, numa frase com valor e % | Assumptions "Localidade MÚLTIPLO", EMDUI-10 | sim |
| I4 | "Ver a base do CEIS no Portal" no lugar de "Ver a sanção no Portal" | Out of Scope (detalhe da sanção, captcha) | sim |
| I5 | Links com `aria-current="page"` no lugar de `<button aria-pressed>` | EMDUI-03, EMDUI-04 | sim |
| I6 (C05) | "vão direto ao caixa de **estados e municípios**" no lugar de "do município" (Emd:63) | Assumptions "Detalhe das transferências especiais" (CF art. 166-A) | sim: motivo factual, o resto da frase segue o artboard |
| I7 (C14) | Coluna Tipo com a natureza jurídica da fonte ("Sociedade de Economia Mista", "Fundo Público da Administração Direta Municipal") no lugar de "Fundo municipal", "Empresa" (Emd:202-206) | Assumptions "Coluna Tipo dos favorecidos" | sim: as categorias do artboard não existem na fonte |
| I8 (C26) | "Como ligamos…" sem "até a conferência manual" e com "Ver a metodologia" (Emd:181) | Assumptions "Bloco Como ligamos" | sim: não há processo de conferência manual |

Conferi se esses registros afrouxam a spec para passar: os três têm motivo verificável e nenhum tira informação que
a fonte tenha. O rodapé curto do celular (EMDUI-12) e o CSV por emenda e local (EMDUI-15) foram registrados como a
verificação 1 recomendou; o rodapé curto já era PASS (M05) pelo padrão do protótipo de celular.

## Itens que mudaram desde a verificação 1

| ID | Esperado no artboard | Ref. | Medido (f8e8a5a) | V1 | V2 |
| --- | --- | --- | --- | --- | --- |
| C05 | "… vão direto ao caixa do município, sem objeto definido" | Emd:63 | "31% do empenhado · vão direto ao caixa de estados e municípios, sem objeto definido" | FAIL | INTENCIONAL (I6) |
| C06 | Valores com uma casa: "R$ 74,2 mi", "R$ 37,1 mi · 50%" | Emd:51, 192 | "R$ 110,6 mi", "R$ 104,4 mi", "R$ 56,7 mi · 51%", "R$ 9,2 mi" | FAIL | PASS |
| C09 | Nota sob o gráfico só "Em 2026 o ano ainda está em curso: …" | Emd:94 | texto igual | FAIL | PASS |
| C12 | "“Estado (UF)” e “Nacional” indicam emendas sem município definido no Orçamento." | Emd:115 | texto igual | FAIL | PASS |
| C14 | Categorias do artboard na coluna Tipo | Emd:202-206 | natureza jurídica da fonte | FAIL | INTENCIONAL (I7) |
| C16 | "Prefeituras e fundos municipais aparecem pelo nome. CPF de pessoa física aparece mascarado, como no Portal da Transparência." | Emd:131 | texto igual | FAIL | PASS |
| C17 | "… download em lote · base de DD/MM/AAAA · coletado em DD/MM/AAAA HH:MM" | Emd:135 | "… download em lote · base de 10/11/2026 · coletado em 11/11/2026 14:31" | FAIL | PASS |
| C21 | Ressalva inteira "… não indica irregularidade do parlamentar: a cota é reembolso de despesa, não contrato público." | Emd:160 | texto igual (74383 e seed) | FAIL | PASS |
| C22 | Link "Ver as N notas", com o mesmo N de "N das M notas … têm data dentro desse período" (Emd:160 diz "4 das 9", Emd:161 "Ver as 4 notas") | Emd:160-161 | "Ver as 3 notas" ao lado de "Nenhuma das 3 notas … tem data dentro desse período" (74383): o número é o total M, não o N dentro da sanção (`sancao.tsx:88` usa `f.documentos`); o link baixa todas as notas do ano | FAIL | **FAIL** |
| C24 | "Fonte do cruzamento: … CEIS e CNEP, download em lote · base de DD/MM/AAAA · comparação pelo CNPJ." | Emd:164 | "… download em lote · base de 11/11/2026 · comparação pelo CNPJ." | FAIL | PASS |
| C26 | "… a emenda fica de fora até a conferência manual." | Emd:181 | "… a emenda fica de fora. Ver a metodologia" | FAIL | INTENCIONAL (I8) |
| M06 | Tabela mantém as 5 colunas no celular | Emd:123 | 390 px: 5 `th` e `td` com `display: table-cell`; tabela de 593 px numa caixa de 324 px com `overflow-x: auto` | FAIL | PASS |

## Itens novos

| ID | Esperado no artboard | Ref. | Medido | Resultado |
| --- | --- | --- | --- | --- |
| C27 | Milhões sempre com uma casa, inclusive ",0": a função `mi` do artboard usa `toFixed(1)` ("R$ 5,0 mi") | Emd:192 (`mi = … toFixed(1)`) | `brlMi` usa só `maximumFractionDigits: 1` (`src/lib/emendas.ts:100`): "R$ 5 mi" (São Paulo (UF), 73433), "R$ 4 mi" (favorecidos de 73433 e 74383), "R$ 10 mi" (178829); os rótulos das barras do mesmo gráfico mantêm ",0" (`secao-emendas.tsx:17`, mínimo 1 casa) | **FAIL** |
| C28 | "…, aplicado pelo {órgão}." | Emd:160 | "…, aplicada por {órgão}." (`sancao.tsx:75`): "aplicada por CONSELHO REGIONAL DE MEDICINA SP", "aplicada por Ministério Exemplo"; divergência não registrada na spec | **FAIL** |

## Itens sem mudança

V01–V22 e L01–L12: PASS (verificação 1, estilos inalterados, amostra reconferida acima). C01–C04, C07, C08, C10, C11,
C13, C15, C18–C20, C23, C25: PASS (textos reconferidos em 73433, 178829, 74383). M01–M05: PASS (`scrollWidth` 390 nas
três páginas reais; caixa de favorecidos com `overflow-x: auto`; cartão de celular raio 14, padding 16, h2 18 px;
rodapé curto "Fonte: Portal da Transparência, emendas · coletado em 11/11/2026 · ver original").

## Conta

| | Quantidade |
| --- | --- |
| PASS | 62 (V 22, L 12, C 22, M 6) |
| FAIL | 3 (C22, C27, C28) |
| INTENCIONAL | 8 (I1–I8) |

**Paridade = 62 ÷ (62 + 3) = 95,4%.** Meta de 95%: **atingida**, com folga zero (mais um FAIL derruba para 93,8%).

Os três FAIL são de texto. C22 é o único que muda o sentido: ao lado de "Nenhuma das 3 notas … tem data dentro desse
período", "Ver as 3 notas" sugere 3 notas dentro da sanção. Para corrigir, o link usa o N dentro do período (e filtra
o CSV por esse intervalo) ou a spec registra que o link leva a todas as notas do período exibido. C27 e C28 são uma
linha cada (`toFixed(1)`/`minimumFractionDigits: 1`; "aplicada pelo" não serve para órgão feminino, então o caminho
honesto é registrar a forma neutra na spec).
