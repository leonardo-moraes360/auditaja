# Verificação 1 de paridade: emendas e sanções

Fonte da verdade: artboard aprovado `prototipo/Emendas.dc.html` (1440 px, dados fictícios), cópia nesta pasta.
`Emd:NN` aponta a linha desse arquivo.

Páginas verificadas (build de `93d6459`, `pnpm start`):

- dados reais, banco `auditaja_emendas_dev` (coletas de 11/11/2026), porta 3292: `/parlamentares/73433` e
  `/parlamentares/178829` (emendas); `/parlamentares/74383` (fornecedor com sanção no CEIS listado: CALGAN). Em
  `/parlamentares/73433` nenhum fornecedor sancionado aparece na lista (a Telefônica, no CEIS, está fora dos maiores
  fornecedores, partida em 6 grafias), então o aviso foi conferido em 74383 e no seed;
- seed, banco `auditaja_emendas_test`, porta 3293: `/parlamentares/900000001` (selos CEIS e CNEP, dois avisos, PF
  mascarada) e `/parlamentares/900000002` (sem emendas).

Medição: Playwright (Chromium 1228) em 1440×900 e 390×844, `getComputedStyle` e `getBoundingClientRect` dos elementos;
capturas da seção em cada largura. Valores numéricos e nomes vêm dos dados; a rubrica compara formato, rótulo, ordem,
cor, medida e fonte.

## Como pontuar

- Item binário: **PASS** ou **FAIL**. Na dúvida, FAIL.
- Divergência registrada na spec antes desta verificação vale **INTENCIONAL**: sai do denominador e fica listada.
- Cor exata (hex), medidas com ±2 px, fonte pela família computada.
- **Paridade = PASS ÷ (PASS + FAIL)**. Meta: ≥ 95%.

## Divergências intencionais (fora do denominador)

| ID | Divergência | Onde a spec registra | Aceita? |
| --- | --- | --- | --- |
| I1 | Dados reais do Portal em vez dos fictícios; sem a faixa "Proposta visual com dados fictícios" (Emd:20) | `spec.md:3` (fonte única: lote do Portal) e Goals (`spec.md:11`) | sim |
| I2 | Período a partir do orçamento de 2024; o artboard diz "orçamentos de 2023 a 2026" (Emd:52, 75) | `spec.md:36` (Assumptions) e EMD-03 | sim |
| I3 | "MÚLTIPLO" fora da lista de locais e explicado numa frase com valor e % | `spec.md:46` e EMDUI-10 | sim |
| I4 | "Ver a base do CEIS no Portal" no lugar de "Ver a sanção no Portal" (Emd:161) | `spec.md:26` (Out of Scope: detalhe da sanção, host com captcha) | sim |
| I5 | Botões de período são links com `aria-current="page"` (o artboard usa `<button aria-pressed>`, Emd:40-42) | EMDUI-03 e EMDUI-04 | sim |
| — | Coluna Tipo com a natureza jurídica da fonte ("Sociedade de Economia Mista", "Fundo Público da Administração Direta Municipal") em vez das categorias do artboard ("Fundo municipal", "Empresa", Emd:202-206) | **não registrada**: a spec diz só "tipo" (EMDUI-11); a regra está em comentário de `src/data/emendas.ts:17` | **não** → item C14 conta como FAIL |

## Itens

### Visual (estilo computado), 1440×900

| ID | Esperado no artboard | Ref. | Medido | Resultado |
| --- | --- | --- | --- | --- |
| V01 | Cartão da seção: fundo `#FFFFFF`, borda 1 px `#E2E2DC`, raio 16, padding 24, gap 20 | Emd:36 | `#FFFFFF`, 1 px `#E2E2DC`, 16 px, 24 px, 20 px | PASS |
| V02 | h2 22 px Space Grotesk, negrito | Emd:38 | 22 px, "Space Grotesk", 700 | PASS |
| V03 | Parágrafo 14 px `#3D424B`, altura de linha 1,5 | Emd:46 | 14 px, `#3D424B`, 21 px | PASS |
| V04 | Botão de período: 36 px, padding 0 12, raio 8, borda `#C9CAC2`, fundo `#FFFFFF`, texto `#3D424B` 13 px; gap 6 | Emd:39-41 | 36 px, 12 px, 8 px, `#C9CAC2`, `#FFFFFF`, `#3D424B`, 13 px; `gap-1.5` | PASS |
| V05 | Período ativo: borda `#1F4FD1`, fundo `#E8EEFC`, texto `#1F4FD1` 600 | Emd:42 | `#1F4FD1`, `#E8EEFC`, `#1F4FD1`, 600 | PASS |
| V06 | Indicador: fundo `#F6F6F3`, raio 12, padding 16, gap 6, sem borda | Emd:49 | `#F6F6F3`, 12 px, 16 px, 6 px, borda 0 | PASS |
| V07 | Indicador: título 13 px `#555B66`; valor Space Grotesk 26 px 700; detalhe 12 px `#555B66` | Emd:50-52 | 13 px `#555B66`; "Space Grotesk" 26 px 700; 12 px `#555B66` | PASS |
| V08 | Barra de pago: 8 px, trilho `#E2E2DC` raio 4, preenchimento `#1F4FD1` | Emd:57 | 8 px, `#E2E2DC`, 4 px, `#1F4FD1` | PASS |
| V09 | Legenda: quadrados 12×12 raio 3, `#B9C8F3` (Empenhado) e `#1F4FD1` (Pago); texto 13 px `#555B66` | Emd:68-72 | 12×12, 3 px, `#B9C8F3`, `#1F4FD1` | PASS |
| V10 | Barras do gráfico `#B9C8F3`/`#1F4FD1`, raio 4 4 0 0, largura 44% até 52 px | Emd:78-84 | `#B9C8F3`, `#1F4FD1`, 4 px, 52 px | PASS |
| V11 | Área do gráfico: 190 px, gap 32, padding 10/8, base 1 px `#C9CAC2` | Emd:75 | 190 px, 32 px, 10/8 px, `#C9CAC2` | PASS |
| V12 | Rótulos: valor 11 px `#555B66`; ano 12 px `#555B66` | Emd:79, 91 | 11 px `#555B66`; 12 px `#555B66` | PASS |
| V13 | Barras de área/local: trilho `#F0F0EC` 8 px raio 4, barra `#6E8FE8`; linha 13 px, valor `#555B66` | Emd:102-103 | `#F0F0EC`, 8 px, 4 px, `#6E8FE8` | PASS |
| V14 | h3 15 px negrito | Emd:99, 108, 120 | 15 px, 700 | PASS |
| V15 | Tabela 13 px; th 600 `#555B66` padding 6/8; linha borda 1 px `#ECECE6`; td padding 8; documento `tabular-nums` sem quebra; Recebido à direita | Emd:122-126 | 13 px; 600 `#555B66` 6/8 px; `#ECECE6`; 8 px; `tabular-nums nowrap`; `right` | PASS |
| V16 | Rodapé da fonte: 12 px `#555B66`, borda-topo 1 px `#ECECE6`, padding-top 12; links `#1F4FD1` | Emd:134-136 | 12 px `#555B66`, `#ECECE6`, 12 px, `#1F4FD1` | PASS |
| V17 | Selo: fundo `#FDF0E7`, texto `#7A2E09`, 12 px 600, padding 3/8, pílula | Emd:150 | `#FDF0E7`, `#7A2E09`, 12 px 600, 3/8 px, raio 9999 | PASS |
| V18 | Aviso: fundo `#FDF0E7`, raio 12, padding 16/18, gap 14; ícone 22 px `#B4440E`, margem-topo 2 | Emd:156-157 | `#FDF0E7`, 12 px, 16/18 px, 14 px; 22 px `#B4440E`, 2 px | PASS |
| V19 | Aviso: título 15 px negrito `#7A2E09`; texto 14 px `#3D424B` 1,5; links 14 px 600 `#B4440E` | Emd:159-161 | 15 px 700 `#7A2E09`; 14 px `#3D424B` 21 px; 14 px 600 `#B4440E` | PASS |
| V20 | Nota "Fonte do cruzamento" 12 px `#555B66` | Emd:164 | 12 px `#555B66` | PASS |
| V21 | "Como ligamos…": cartão branco, borda `#E2E2DC`, raio 16, padding 20, gap 10; h2 18 px Space Grotesk; texto 14 px `#3D424B` 1,5 | Emd:179-181 | `#FFFFFF`, `#E2E2DC`, 16 px, 20 px, 10 px; 18 px "Space Grotesk"; 14 px `#3D424B` 21 px | PASS |
| V22 | Abas: 15 px, padding 12/16; inativa 500 `#555B66`; ativa 600 `#1F4FD1` com borda inferior 2 px `#1F4FD1` | Emd:25-30 | 15 px, 12/16 px; 500 `#555B66`; 600 `#1F4FD1`, 2 px `#1F4FD1` | PASS |

### Layout, 1440×900

| ID | Esperado no artboard | Ref. | Medido | Resultado |
| --- | --- | --- | --- | --- |
| L01 | Aba "Emendas" entre "Gastos da cota" e "Votações", levando a `#emendas` | Emd:25-27 | abas `#gastos`, `#emendas`, `#votacoes`, `#bens`, `#mandato`, `#fontes` | PASS |
| L02 | Título e botões de período na mesma linha, botões à direita | Emd:37-44 | mesma linha, `justify-between` | PASS |
| L03 | Ordem: título, parágrafo, indicadores, gráfico, áreas \| locais, favorecidos, rodapé | Emd:36-137 | mesma ordem | PASS |
| L04 | 3 indicadores numa linha (`auto-fit, minmax(200px, 1fr)`, gap 12) | Emd:48 | 3 × 253 px numa linha | PASS |
| L05 | "Por ano do orçamento" à esquerda, legenda à direita; anos sob as barras | Emd:68-93 | idem | PASS |
| L06 | Áreas e locais lado a lado (`flex 1 1 280px`, gap 24) | Emd:97-117 | 379 px + 379 px | PASS |
| L07 | Tabela de favorecidos numa caixa com rolagem horizontal | Emd:121 | `overflow-x: auto`, `role=region` | PASS |
| L08 | Rodapé: texto à esquerda e links à direita, com quebra (`flex-wrap`, `space-between`) | Emd:134 | idem; links quebram para a linha de baixo, à direita | PASS |
| L09 | Seção de emendas depois de "Gastos da cota" (o artboard mostra a seção e, abaixo, só o bloco de fornecedores que muda) | Emd:24-27, 140-143 | `gastos`, `emendas`, `votacoes` | PASS |
| L10 | Selo na mesma célula, ao lado do nome do fornecedor | Emd:150 | `span` com `ml-2` (8 px; artboard 10 px, dentro de ±2) | PASS |
| L11 | Aviso abaixo da tabela de fornecedores; nota do cruzamento abaixo do aviso | Emd:145-164 | idem | PASS |
| L12 | Lateral: "Como ligamos…" logo depois de "De onde vêm os dados" | Emd:169-182 | Mandato, De onde vêm os dados, Como ligamos…, Encontrou um erro? | PASS |

### Conteúdo e formato

| ID | Esperado no artboard | Ref. | Medido | Resultado |
| --- | --- | --- | --- | --- |
| C01 | Parágrafo explicativo, texto igual | Emd:46 | texto igual | PASS |
| C02 | Botões "2026", "2025", "Mandato todo" (2 anos mais recentes + mandato) | Emd:40-42 | "2026", "2025", "Mandato todo" | PASS |
| C03 | "Empenhado no mandato" + "N emendas, orçamentos de A a B" | Emd:50-52 | "51 emendas, orçamentos de 2024 a 2026" (I2) | PASS |
| C04 | "Pago até agora", barra com `aria-label` "N% do valor empenhado já foi pago", "N% do empenhado, incluindo restos a pagar" | Emd:55-58 | idem ("94% …") | PASS |
| C05 | "Transferências especiais (“emendas Pix”)", detalhe "N% do empenhado · vão direto ao caixa do município, sem objeto definido" | Emd:61-63 | "31% do empenhado · repassadas direto a estados e municípios, sem finalidade definida" | FAIL |
| C06 | Valores compactos com uma casa decimal: "R$ 74,2 mi", "R$ 37,1 mi · 50%" | Emd:51, 192 | "R$ 110,58 mi", "R$ 104,41 mi", "R$ 56,69 mi · 51%" (duas casas) | FAIL |
| C07 | `aria-label` "Gráfico de barras: valor empenhado e pago por ano do orçamento, de A a B" | Emd:75 | idem, "de 2024 a 2026" (I2) | PASS |
| C08 | Rótulo das barras em milhões com uma casa ("17,1") | Emd:79, 195 | "35,9", "37,1", "31,7" | PASS |
| C09 | Nota sob o gráfico: só "Em 2026 o ano ainda está em curso: …" | Emd:94 | "Valores em milhões de reais. Em 2026 o ano ainda está em curso: …" | FAIL |
| C10 | Áreas: 5 linhas "nome" + "R$ X mi · N%" | Emd:100-104 | 5 linhas no formato (casas decimais contadas em C06) | PASS |
| C11 | Locais: 5 linhas "Município (UF)"/"Estado (UF)"/"Nacional" + valor | Emd:109-113 | "São Paulo (UF)", "Nacional", "Birigui (SP)" … | PASS |
| C12 | Nota dos locais: "“Estado (UF)” e “Nacional” indicam emendas sem município definido no Orçamento." | Emd:115 | "“(UF)” e “Nacional” indicam emendas sem município definido." (a frase do Múltiplo antes dela é I3) | FAIL |
| C13 | Tabela com 5 colunas: Favorecido, CNPJ/CPF, Tipo, Município, Recebido; até 5 linhas | Emd:123-127 | idem, 5 linhas | PASS |
| C14 | Coluna Tipo com as categorias do artboard | Emd:202-206 | natureza jurídica da fonte (divergência não registrada na spec) | FAIL |
| C15 | PF: "Beneficiário pessoa física", CPF `***.456.789-**`, tipo "Pessoa física" | Emd:206 | seed 900000001, 2024: idem | PASS |
| C16 | Nota da tabela: "Prefeituras e fundos municipais aparecem pelo nome. CPF de pessoa física aparece mascarado, como no Portal da Transparência." | Emd:131 | "CPF de pessoa física aparece mascarado, como no Portal da Transparência, e o nome não é exibido." | FAIL |
| C17 | Rodapé: "Fonte: Portal da Transparência (CGU), Emendas Parlamentares, download em lote · base de DD/MM/AAAA · coletado em DD/MM/AAAA HH:MM" | Emd:135 | "… download em lote · coletado em 11/11/2026 14:03" (sem "base de") | FAIL |
| C18 | Links do rodapé: "Ver no Portal", "Baixar CSV", "Contestar" | Emd:136 | idem | PASS |
| C19 | Selo "Sanção no CEIS" | Emd:150 | "Sanção no CEIS" (74383 e seed); "Sanção no CNEP" no seed | PASS |
| C20 | Título do aviso "{Fornecedor} tem sanção registrada no {cadastro}" | Emd:159 | "CALGAN EDITORA GRAFICA LTDA tem sanção registrada no CEIS" | PASS |
| C21 | Texto do aviso: categoria, período, órgão, "N das M notas pagas a essa empresa têm data dentro desse período." e a ressalva inteira "… não indica irregularidade do parlamentar: a cota é reembolso de despesa, não contrato público." | Emd:160 | ressalva termina em "parlamentar."; falta "a cota é reembolso de despesa, não contrato público" | FAIL |
| C22 | Link "Ver as N notas" | Emd:161 | "Baixar as notas" (baixa o CSV; não registrado na spec) | FAIL |
| C23 | Link "Como cruzamos (metodologia)" | Emd:161 | idem, `/metodologia#sancoes` | PASS |
| C24 | "Fonte do cruzamento: Portal da Transparência (CGU), CEIS e CNEP, download em lote · base de DD/MM/AAAA · comparação pelo CNPJ." | Emd:164 | "… download em lote · comparação pelo CNPJ." (sem "base de") | FAIL |
| C25 | Lateral: "Portal da Transparência · Emendas (lote)" e "Portal da Transparência · CEIS e CNEP (lote)", com detalhe, entre as fontes da Câmara e a do TSE | Emd:211-212 | idem; detalhe "Emendas e pagamentos por favorecido · coletado em 11/11/2026" e "Empresas sancionadas · coletado em …" (mesmo padrão "coletado em" das outras fontes, aprovado no item C26 da rubrica do perfil) | PASS |
| C26 | "Como ligamos…": "… Quando dois deputados têm o mesmo nome, a emenda fica de fora até a conferência manual." | Emd:181 | "… a emenda fica de fora. Ver a metodologia" (sem "até a conferência manual", com link) | FAIL |

### Celular, 390×844 (o artboard é só desktop; confere reflow e padrão de celular do projeto)

| ID | Esperado | Ref. | Medido | Resultado |
| --- | --- | --- | --- | --- |
| M01 | Sem rolagem horizontal da página | EDGE-05 | `scrollWidth` 390 em 73433, 178829, 74383, 900000001, 900000002 | PASS |
| M02 | Tabela de favorecidos rola dentro da caixa | Emd:121 | tabela de 496 px numa caixa de 324 px com `overflow-x: auto` | PASS |
| M03 | Indicadores, gráfico, áreas e locais empilhados sem texto cortado | Emd:48, 97 | captura: 1 indicador por linha, gráfico 150 px, áreas e locais em sequência | PASS |
| M04 | Cartão de celular: raio 14, padding 16, h2 18 px (padrão V07/V10 da rubrica do perfil) | rubrica do perfil V07, V10 | 14 px, 16 px, 18 px | PASS |
| M05 | Rodapé curto do celular: "Fonte: Portal da Transparência, emendas · coletado em DD/MM/AAAA · ver original", 11 px, borda `#ECECE6`, padding-top 10 (padrão do protótipo de celular do perfil) | `Mobile.dc.html` 411 | idem | PASS |
| M06 | Tabela mantém as 5 colunas do artboard (a caixa já rola) | Emd:123 | coluna Tipo some (`display: none` abaixo de 640 px) | FAIL |

## Conta

| | Quantidade |
| --- | --- |
| PASS | 54 (V 22, L 12, C 15, M 5) |
| FAIL | 12 (C05, C06, C09, C12, C14, C16, C17, C21, C22, C24, C26, M06) |
| INTENCIONAL | 5 (I1–I5) |

**Paridade = 54 ÷ (54 + 12) = 81,8%.** Meta de 95%: **não atingida.**

Para chegar a 95% (no máximo 3 FAIL em 66), 9 dos 12 itens precisam virar PASS: ou o texto passa a seguir o artboard,
ou a divergência é registrada na spec com o motivo (e aí vira INTENCIONAL). Candidatos naturais a registro, porque a
versão implementada parece mais correta que o artboard: C05 ("emendas Pix" também vão a estados), C26 (não há
conferência manual), C14 (a fonte não traz as categorias do artboard), C22 (o CSV é o que existe para "ver as notas") e
M06. Os demais (C06, C09, C12, C16, C17, C21, C24) são texto ou formato que podem seguir o artboard; C17 e C24 dependem
de guardar a data da base, que o arquivo do Portal traz no nome (CEIS e CNEP) ou não traz (Emendas).
