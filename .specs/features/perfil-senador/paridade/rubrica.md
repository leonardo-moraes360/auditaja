# Rubrica de paridade do perfil do senador com o protótipo aprovado

Fonte da verdade: artboards do canvas do protótipo (y = 8420), copiados nesta pasta em `prototipo/Senador.dc.html`
(desktop, 1440 px), `prototipo/SenadorMobile.dc.html` (celular, 390 px) e `prototipo/ListaParlamentares.dc.html`
(lista, desktop). As referências `Senador:NN`, `SenadorMobile:NN` e `ListaParlamentares:NN` apontam linhas desses
arquivos.

Páginas verificadas (dados reais do Senado, banco `auditaja_senado_dev`):

- `/parlamentares/10005672` (senador titular, com CEAPS, votos e bens 2022);
- `/parlamentares/10006358` (senadora, 1ª suplente em exercício);
- `/parlamentares/10000022` (senador com divergência da liderança, só para V16);
- `/parlamentares?casa=senado` e `/parlamentares`.

Viewports: 1440×900 (desktop) e 390×844 (celular, `isMobile`, `hasTouch`).

## Como pontuar

- Cada item é binário: **PASS** ou **FAIL**. Não há meio ponto. Na dúvida, FAIL.
- Item coberto por divergência intencional já aceita vale **INTENCIONAL**: sai do denominador e aparece à parte.
- Item que os dados reais não permitem exercitar (por exemplo, comparação de bens quando só há uma eleição no
  banco) vale **N/V** (não verificável): sai do denominador, mas é listado e o placar mostra também a paridade
  pessimista, com N/V contado como FAIL.
- Valores e nomes vêm de dados reais: compara-se o **formato** (rótulo, unidade, ordem, partes), não o número.
- Cores e medidas: `getComputedStyle` e `getBoundingClientRect` nos dois lados (protótipo renderizado por file://
  com as listas `sc-for` expandidas a partir do próprio `renderVals()` do artboard), tolerância ±2 px, cor exata
  (hex).
- Itens novos que o verificador achar entram no denominador.

**Paridade = PASS ÷ (PASS + FAIL)**. Meta: ≥ 95%.

## Divergências intencionais que valem aqui

| ID | Divergência | Situação no senador |
| --- | --- | --- |
| I1 | Dados reais em vez dos fictícios; some a faixa "dados fictícios" (Senador:20, SenadorMobile:20, ListaParlamentares:20) | vale |
| I2 | Alerta "Padrão atípico" adiado | vale (os artboards do senador não o desenham) |
| I3 | Busca diz só "deputado" | **não vale**: a busca precisa citar senador (SUI-08, Senador:35) |
| I4 | "Eleito em 2022 com N votos (TSE)" fora (Senador:55) | vale |
| I5 | Borda da busca `#80858E` | vale (o artboard do senador já usa `#80858E`) |
| I6 | Menu sem "Gastos públicos" | vale (o artboard do senador já não o tem) |
| I7 | "Encontrou um erro?" com a contagem de pedidos em vez de prazo e histórico | vale só para a contagem extra; o resto do texto conta |
| I8 | Teto só em 2026 | **substituída**: senador nunca tem linha, legenda nem barra de teto (SCEAPS-06) |
| I9 | Rodapé do celular com o nome do encarregado (SenadorMobile:134) | vale |

## Divergências aceitas pelo usuário em 11/11/2026

I10 (C18), I11 (V12, V13, V14), I13 (P10) e I14 (M12, C32 em parte): ver `divergencias-propostas.md`.

## Itens

### Visual (tokens), desktop e celular

| ID | Esperado no protótipo | Ref. |
| --- | --- | --- |
| V01 | Fundo da página `#F6F6F3` | Senador:14, 18 |
| V02 | Texto principal `#15181E` | Senador:18 |
| V03 | Marca e links `#1F4FD1` | Senador:15 |
| V04 | Corpo em Inter | Senador:18 |
| V05 | h1, h2 e valores dos indicadores em Space Grotesk | Senador:53, 66 |
| V06 | Texto secundário `#555B66` | Senador:65 |
| V07 | Cartões de seção: branco, borda 1 px `#E2E2DC`, raio 16 px (D) e 14 px (M) | Senador:99, SenadorMobile:64 |
| V08 | Rodapé `#15181E`, texto `#D5D7DC`, links `#A9BEF5` | Senador:281-284 |
| V09 | h1 36 px (D) e 24 px (M) | Senador:53, SenadorMobile:38 |
| V10 | h2 22 px (D principal), 18 px (lateral e M), 17 px ("Encontrou um erro?" no M) | Senador:101, 232, SenadorMobile:65, 129 |
| V11 | Botão primário `#1F4FD1`, branco, 44 px, raio 10 | Senador:58 |
| V12 | Botão secundário: borda **`#80858E`**, fundo branco, 44 px, raio 10 (D e M) | Senador:59, SenadorMobile:50 |
| V13 | Filtros de ano e de votações: 36 px; ativo `#1F4FD1`/`#E8EEFC`/600; inativo com borda **`#80858E`** e texto `#3D424B` | Senador:103-106, 168-170 |
| V14 | Barras do gasto `#1F4FD1`; linha de base do gráfico 1 px **`#80858E`** (D e M) | Senador:117, 121, SenadorMobile:67 |
| V15 | Barras por tipo `#6E8FE8` sobre trilho `#F0F0EC`, 8 px | Senador:138 |
| V16 | Selo do voto: igual `#E8EEFC`/`#163A9C`; contra `#FDF0E7`/`#7A2E09`; secreto, ausente ou sem orientação `#F0F0EC`/`#3D424B` | Senador:306-314 |
| V17 | Caixa "Encontrou um erro?" `#E8EEFC`, sem borda | Senador:272 |
| V18 | Indicadores `#F6F6F3`, raio 12 (D) e 10 (M), valor 26 px (D) e 20 px (M) | Senador:64-66, SenadorMobile:43 |
| V19 | Busca do topo 360×44, raio 10, fundo `#FAFAF8`, borda `#80858E` | Senador:35 |
| V20 | Selo "Em exercício" `#E6F4EA`/`#1E5B32`, pílula | Senador:49 |
| V21 | Selos do mandato e da participação `#F0F0EC`/`#3D424B`, 12 px/600, pílula | Senador:50-51 |
| V22 | Aviso da CEAPS: caixa `#F0F0EC`, raio 12, padding 14/18, ícone "i", 14 px `#3D424B` (D); raio 10, padding 12, 13 px, sem ícone (M) | Senador:110-113, SenadorMobile:66 |
| V23 | Marca "Auditaja" com `letter-spacing` −0,02em (D) e normal (M) | Senador:26, SenadorMobile:25 |
| V24 | Cartões de bens: borda `#E2E2DC`, raio 12, padding 14, total 22 px Space Grotesk | Senador:200-202 |

### Layout, desktop (1440 px)

| ID | Esperado no protótipo | Ref. |
| --- | --- | --- |
| L01 | Topo: logo, menu, busca à direita com até 360 px | Senador:22-37 |
| L02 | Item ativo do menu com sublinhado 2 px da marca | Senador:29 |
| L03 | Coluna de até 1200 px com 24 px de respiro, centralizada | Senador:40 |
| L04 | Trilha acima do cabeçalho | Senador:42 |
| L05 | Cabeçalho em um cartão: foto, identificação, ações à direita e indicadores embaixo | Senador:44-85 |
| L06 | Foto retangular 112×136, raio 12 | Senador:46 |
| L07 | Três selos em pílulas separadas acima do nome | Senador:48-52 |
| L08 | Quatro indicadores numa linha | Senador:63 |
| L09 | Abas entre cabeçalho e conteúdo, ativa sublinhada | Senador:87-93 |
| L10 | Duas colunas: principal 832 px, lateral 300 px | Senador:95-230 |
| L11 | Título de gastos e filtro de ano na mesma linha, filtro à direita | Senador:100-108 |
| L12 | Aviso da CEAPS entre o título e o gráfico | Senador:110 |
| L13 | Legenda do gráfico: "Gasto mensal em AAAA" à esquerda, "Valor reembolsado pelo Senado" à direita | Senador:116 |
| L14 | Gráfico com 200 px úteis para as barras (+ 10 px de respiro, 211 px no total), valor acima de cada barra, mês abaixo | Senador:117-129 |
| L15 | "Por tipo de despesa" e "Maiores fornecedores" lado a lado | Senador:132-156 |
| L16 | Nota de fonte no pé de cada seção: texto à esquerda, links à direita, borda superior `#ECECE6` | Senador:158-161, 189-192, 223-226 |
| L17 | Votação em linha: data, proposição/ementa, orientação e voto à direita | Senador:176-186 |
| L18 | Nota da votação secreta entre o título e a lista | Senador:173 |
| L19 | Bens: cartões em grade, comparação por tipo com barras pareadas e legenda | Senador:198-221 |
| L20 | Lateral, nesta ordem: Mandato, De onde vêm os dados, Encontrou um erro? | Senador:230-277 |
| L21 | Mandato: `dl` em duas colunas; suplentes com nome à esquerda e ordem à direita; nota; comissões; linha do tempo com marcadores de 10 px | Senador:233-257 |
| L22 | Rodapé em duas colunas | Senador:282 |

### Layout, celular (390 px)

| ID | Esperado no protótipo | Ref. |
| --- | --- | --- |
| M01 | Topo: logo e botões "Buscar" e "Menu" 44×44 | SenadorMobile:22-31 |
| M02 | Foto 72×88 ao lado do nome | SenadorMobile:34-40 |
| M03 | Indicadores 2×2 | SenadorMobile:42 |
| M04 | "Acompanhar" e "Contestar dado" lado a lado | SenadorMobile:48-51 |
| M05 | Abas numa linha com rolagem horizontal | SenadorMobile:54 |
| M06 | Cabeçalho e abas de ponta a ponta; seções em cartões com 16 px de margem | SenadorMobile:33, 62 |
| M07 | Gráfico sem valores, com a inicial do mês | SenadorMobile:67-76 |
| M08 | Votação: proposição e data na mesma linha, ementa, depois voto e orientação | SenadorMobile:93-99 |
| M09 | Bens: uma barra por eleição com o total | SenadorMobile:118-123 |
| M10 | Sem rolagem horizontal | — |
| M11 | Resumo: até 4 tipos, sem fornecedores, 3 votações e "Ver as N votações" | SenadorMobile:77-102 |
| M12 | Ordem das seções: Gastos, Votações, **Mandato**, **Bens**, Encontrou um erro? | SenadorMobile:64-132 |
| M13 | Mandato compacto: "Período" (DD/MM/AAAA a DD/MM/AAAA), "Situação", "Bloco", "Suplentes" numa linha ("Nome (1ª) · Nome (2º)") | SenadorMobile:106-113 |

### Conteúdo

| ID | Esperado no protótipo | Ref. |
| --- | --- | --- |
| C01 | Menu: Parlamentares, Metodologia, Sobre | Senador:28-32 |
| C02 | Trilha "Parlamentares / Senado Federal / Nome", com links nos dois primeiros | Senador:42 |
| C03 | "Senador(a) por {UF por extenso} ({UF}) · {Partido} ({SIGLA}) · {Bloco}" | Senador:54 |
| C04 | "Nome civil, cargo, UF, partido e bloco conforme o Senado Federal." (votos do TSE fora por I4) | Senador:55 |
| C05 | Botão "Acompanhar atualizações" | Senador:58 |
| C06 | Botão "Contestar um dado" | Senador:59 |
| C07 | Indicador 1: "Cota do senador (CEAPS) em AAAA", valor em reais, "Média de R$ X por mês, mmm a mmm", sem barra de teto | Senador:64-67 |
| C08 | Indicador 2: "Presença em votações nominais", "N de M em AAAA · média do Senado N%" | Senador:69-72 |
| C09 | Indicador 3: "Votou como a liderança orientou", "Divergiu em N de M votações abertas" | Senador:74-77 |
| C10 | Indicador 4: "Bens declarados ao TSE (AAAA)", "+N% sobre AAAA, em valor nominal" | Senador:79-82 |
| C11 | Abas: Gastos da cota, Votações, Bens declarados, Mandato, Fontes | Senador:88-92 |
| C12 | Selos "Mandato AAAA–AAAA · 57ª e 58ª legislaturas" e participação ("Titular"; SUI-03 "1º Suplente em exercício") | Senador:50-51 |
| C13 | Título "Gastos da cota do senador (CEAPS)" e filtro só com anos (sem "Mandato todo") | Senador:101-106 |
| C14 | Texto do aviso: "O Senado publica o valor reembolsado de cada nota, sem glosa, e não divulga em formato aberto o teto da cota por estado. Por isso este bloco não compara o gasto com um teto." | Senador:112 |
| C15 | Nenhuma linha, legenda ou barra de teto (I8 substituída, SCEAPS-06) | Senador:116-129 |
| C16 | "Por tipo de despesa" com "R$ X · N%" | Senador:134-140 |
| C17 | "Maiores fornecedores" (Fornecedor, CNPJ/CPF, Total) e a nota do CPF mascarado | Senador:143-154 |
| C18 | Linha "Prestador pessoa física" com o CPF mascarado na coluna CNPJ/CPF (`***.456.789-**`) | Senador:304 |
| C19 | Fonte da CEAPS "Fonte: Senado Federal, Dados Abertos administrativos (CEAPS) · coletado em DD/MM/AAAA HH:MM" com "Ver na fonte", "Baixar CSV", "Contestar" | Senador:159-160 |
| C20 | "Votações nominais no Plenário"; filtros "Todas", "Divergiu da liderança", "Ausências" | Senador:166-170 |
| C21 | Nota da votação secreta (texto integral) | Senador:173 |
| C22 | Cada votação: data DD/MM/AAAA, proposição como link 15 px/600, "ementa · resultado" | Senador:177-180 |
| C23 | "Liderança do {SIGLA}: X" ou "Orientação: não se aplica"; voto "Votou: X", "Votou (voto secreto)", "Ausente: motivo" | Senador:183-184, 307-314 |
| C24 | Lista resumida com 6 votações | Senador:148, 309-314 |
| C25 | Fonte das votações com "Ver todas as N" e "Contestar" | Senador:190-191 |
| C26 | Bens: título, parágrafo com a frase dos 8 anos, cartões "Eleição AAAA" com total e nota | Senador:196-203 |
| C27 | Fonte dos bens com "Ver na DivulgaCand" e "Contestar" | Senador:224-225 |
| C28 | Mandato: Casa, UF por extenso, Início, Fim previsto, Situação ("Titular, em exercício"), Bloco | Senador:234-239 |
| C29 | Suplentes "Nome — 1ª suplente / 2º suplente", com o ordinal concordando com o gênero | Senador:243-244 |
| C30 | Nota "Quando um suplente assume…" | Senador:246 |
| C31 | "Comissões como titular" com nome e sigla ("Assuntos Econômicos (CAE)") | Senador:247-251 |
| C32 | Linha do tempo: "AAAA · Posse para o mandato AAAA–AAAA", "AAAA · Eleito senador por UF" e mandato anterior em cor clara | Senador:253-257 |
| C33 | Fonte do mandato "Fonte: Senado, Dados Abertos /senador/{código} · TSE (…)" | Senador:258 |
| C34 | "De onde vêm os dados": 4 fontes (nome em link e detalhe) e a frase final | Senador:262-269 |
| C35 | "Encontrou um erro?": "Senadores, assessorias e qualquer pessoa podem pedir correção de um dado deste perfil." e "Pedir correção" | Senador:273-275 |
| C36 | Rodapé: Controlador, Encarregado, aviso de alertas, Metodologia · Política de privacidade · Licenças dos dados | Senador:283-284 |
| C37 | Celular: selo "Em exercício · AAAA–AAAA"; "Senador · UF · SIGLA" | SenadorMobile:37-39 |
| C38 | Celular: "Cota em AAAA" (R$ N mil, R$ N mil/mês), "Presença" (N de M), "Seguiu a liderança" (N divergências), "Bens (TSE AAAA)" | SenadorMobile:43-46 |
| C39 | Celular: "Gastos da cota (CEAPS) · AAAA" com aviso curto; "Votações recentes" com nota curta; "Bens declarados ao TSE" com nota nominal | SenadorMobile:65-66, 90-91, 117, 124 |
| C40 | Celular: "Ver todas as notas e fornecedores" e "Ver as N votações" | SenadorMobile:85, 102 |
| C41 | Celular: orientação curta "Liderança: X" | SenadorMobile:98 |
| C42 | Celular: voto secreto "Votou (secreto)" | SenadorMobile:151 |
| C43 | Celular: fontes curtas ("Fonte: Senado, CEAPS · coletado em DD/MM/AAAA · ver original", etc.) | SenadorMobile:86, 103, 125 |
| C44 | Celular: "Qualquer pessoa pode pedir correção de um dado deste perfil." | SenadorMobile:130 |
| C45 | Celular: rodapé curto (Controlador · Encarregado; alertas; Metodologia) | SenadorMobile:134 |
| C46 | Placeholder da busca "Buscar deputado ou senador por nome ou UF" (I3 não vale) | Senador:35 |

### Lista de parlamentares

| ID | Esperado no protótipo | Ref. |
| --- | --- | --- |
| P01 | h1 "Parlamentares federais em exercício", 30 px Space Grotesk | ListaParlamentares:37 |
| P02 | Coluna de 1200 px com 24 px de respiro (conteúdo 1152 px em x=144) | ListaParlamentares:36 |
| P03 | Filtros "Todos (N)", "Câmara dos Deputados (N)", "Senado Federal (N)": pílulas 40 px; ativo `#1F4FD1`/`#E8EEFC`/600 com `aria-current`; inativo borda `#80858E` | ListaParlamentares:39-43 |
| P04 | Formulário: rótulos "Nome ou UF" e "UF" 14 px/500; campo e select 40 px, raio 8, borda `#80858E`, **fonte 14 px** | ListaParlamentares:45-53 |
| P05 | Botão "Filtrar" 40 px `#1F4FD1`, raio 8, **14 px/600** | ListaParlamentares:54 |
| P06 | "N resultado(s). Fonte: Senado Federal, Dados Abertos." com a contagem total e todos os N cartões | ListaParlamentares:57 |
| P07 | Grade `minmax(280px, 1fr)` (3 colunas em 1440), gap 12 | ListaParlamentares:59 |
| P08 | Cartão: borda `#E2E2DC`, raio 10, padding 12, nome 500, detalhe 14 px `#555B66` "Senador · SIGLA · UF" | ListaParlamentares:62-66, 72 |
| P09 | Avatar do cartão 48×48 **quadrado com raio 8** | ListaParlamentares:63 |
| P10 | Topo da lista sem campo de busca (a busca é o formulário da página) | ListaParlamentares:22-34 |
| P11 | Celular: sem rolagem horizontal, cartões em uma coluna | — |

### Comportamento

| ID | Esperado | Ref. |
| --- | --- | --- |
| B01 | Busca do topo leva à lista filtrada (D e M) | Senador:34 |
| B02 | Cada aba leva à sua seção (D e M) | Senador:88-92 |
| B03 | A aba ativa acompanha a seção visível | Senador:88 |
| B04 | Filtro de ano troca os dados de gastos | Senador:103-106 |
| B05 | Filtros de votações filtram a lista | Senador:168-170 |
| B06 | "Contestar um dado" e "Contestar" de cada seção abrem o formulário com a seção | Senador:59, 160 |
| B07 | "Pedir correção" abre o formulário | Senador:275 |
| B08 | "Ver na fonte" abre o original em nova aba | Senador:160 |
| B09 | Celular: "Buscar" abre a busca e "Menu" abre o menu | SenadorMobile:28-29 |
| B10 | "Acompanhar atualizações" tem efeito (feed) | Senador:58 |
| B11 | Link da proposição abre a matéria na fonte | Senador:179 |
| B12 | "Baixar CSV" baixa as notas do ano | Senador:160 |
| B13 | Lista: cartão abre o perfil; `?casa=` inválido cai em "Todos" | ListaParlamentares:42, 62 |
