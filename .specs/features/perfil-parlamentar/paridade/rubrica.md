# Rubrica de paridade com o protótipo aprovado

Fonte da verdade: artifact `bd51453d-4873-432a-bc0d-eb0d462328ad` (versão `1794398523-e007`), artboards
`project/Main.dc.html` (desktop, 1440 px) e `project/Mobile.dc.html` (celular, 390 px). Cópias usadas na
verificação: `prototipo/Main.dc.html` e `prototipo/Mobile.dc.html` nesta pasta. As referências `Main:NN` e
`Mobile:NN` apontam linhas desses arquivos.

Página verificada: `/parlamentares/204540` (deputada de SP, com CEAP, votos e bens em 3 eleições), em 1440×900
(desktop) e 390×844 (celular).

## Como pontuar

- Cada item é binário: **PASS** ou **FAIL**. Não há meio ponto. Na dúvida, FAIL.
- Item com divergência aceita antes desta verificação (lista abaixo) vale **INTENCIONAL**: sai do denominador e
  aparece à parte, nunca some sem registro.
- Valores numéricos e nomes vêm de dados reais, então a rubrica compara o **formato** (rótulo, unidade, ordem,
  quantidade de partes), não o número.
- Cores e medidas são conferidas no estilo computado (`getComputedStyle`) com tolerância de ±2 px e cor exata
  (hex). Fonte é conferida pela família computada.
- O verificador pode acrescentar itens novos ao achar divergências que a rubrica não cobre. Item novo entra no
  denominador.

**Paridade = PASS ÷ (PASS + FAIL)**. Meta: ≥ 95%.

## Divergências intencionais já aceitas (não contam)

| ID  | Divergência                                                                                                 | Onde foi aceita                             |
| --- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| I1  | Dados reais da Câmara e do TSE em vez dos fictícios; o aviso "dados fictícios" (Main:20, Mobile:20) some    | Objetivo do MVP                             |
| I2  | Alerta "Padrão atípico para verificação" (Main:110-117, Mobile:69-76) adiado                                | `spec.md`, Out of Scope                     |
| I3  | Senado fora do MVP: busca diz só "deputado" (Main:36)                                                       | `spec.md`, Out of Scope                     |
| I4  | "Eleita em 2022 com N votos (TSE)" (Main:55) fora: arquivo de votação do TSE grande demais                  | `spec.md`, Out of Scope                     |
| I5  | Borda do campo de busca `#80858E` em vez de `#C9CAC2` (Main:36): `#C9CAC2` dá 1,6:1 e reprova o WCAG 1.4.11 | Ronda de acessibilidade, `a11y.md` achado 1 |
| I6 | Menu sem "Gastos públicos" (Main:30): não há dado de outros gastos públicos no MVP; um link vazio enganaria | Aprovado pelo usuário na thread em 11/11/2026 |
| I7 | "Encontrou um erro?" sem o prazo "Respondemos em até 5 dias úteis" e sem "Histórico de correções" (Main:271-273, Mobile:128): o MVP não tem moderação nem histórico público, então mostra só a contagem de pedidos | Aprovado pelo usuário na thread em 11/11/2026 |
| I8 | Linha do teto, legenda e barra de % do teto só em 2026 (Main:120-122, 67): só há teto conferido para 2026; nos outros anos a comparação é omitida | `spec.md`, CEAP-06 (PR #3) |
| I9 | Rodapé do celular traz o nome do encarregado além do e-mail (Mobile:132) | LGPD art. 41, § 1º; registrado depois da verificação 5 |

## Itens

### Visual (tokens), desktop e celular

| ID  | Esperado no protótipo                                                                                                                      | Ref.                     |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------ |
| V01 | Fundo da página `#F6F6F3`                                                                                                                  | Main:18                  |
| V02 | Texto principal `#15181E`                                                                                                                  | Main:18                  |
| V03 | Cor da marca e dos links `#1F4FD1`                                                                                                         | Main:15                  |
| V04 | Corpo em Inter                                                                                                                             | Main:18                  |
| V05 | Títulos (h1, h2) e valores dos indicadores em Space Grotesk                                                                                | Main:53, 66              |
| V06 | Texto secundário `#555B66`                                                                                                                 | Main:65                  |
| V07 | Cartões de seção: fundo branco, borda 1 px `#E2E2DC`, raio 16 px (desktop) e 14 px (celular)                                               | Main:100, Mobile:66      |
| V08 | Rodapé: fundo `#15181E`, texto `#D5D7DC`, links `#A9BEF5`                                                                                  | Main:279-282             |
| V09 | h1 com 36 px no desktop e 24 px no celular                                                                                                 | Main:53, Mobile:36       |
| V10 | h2 de seção com 22 px no desktop, 18 px na lateral e no celular                                                                            | Main:102, 236, Mobile:67 |
| V11 | Botão primário: fundo `#1F4FD1`, texto branco, 44 px de altura, raio 10 px                                                                 | Main:58                  |
| V12 | Botão secundário: borda `#C9CAC2`, fundo branco, 44 px de altura, raio 10 px                                                               | Main:59                  |
| V13 | Filtros (ano, votações): 36 px de altura; ativo com borda `#1F4FD1`, fundo `#E8EEFC`, texto `#1F4FD1`                                      | Main:104, 173            |
| V14 | Barras do gasto mensal `#1F4FD1`; linha do teto tracejada 2 px `#B4440E`                                                                   | Main:122, 126            |
| V15 | Barras por tipo `#6E8FE8` sobre trilho `#F0F0EC`, 8 px de altura                                                                           | Main:143                 |
| V16 | Selo do voto: igual à orientação `#E8EEFC`/`#163A9C`; contra `#FDF0E7`/`#7A2E09`; ausente ou sem orientação comparável `#F0F0EC`/`#3D424B` | Main:304                 |
| V17 | Caixa "Encontrou um erro?" com fundo `#E8EEFC`, sem borda                                                                                  | Main:269                 |
| V18 | Indicadores: blocos `#F6F6F3`, raio 12 px, sem borda, valor com 26 px (desktop) e 20 px (celular)                                          | Main:64-66, Mobile:42    |
| V19 | Campo de busca do topo: 44 px de altura, raio 10 px, fundo `#FAFAF8`                                                                       | Main:36                  |
| V20 | Selo "Em exercício" verde: fundo `#E6F4EA`, texto `#1E5B32`, formato pílula                                                                | Main:50                  |

### Layout, desktop (1440 px)

| ID  | Esperado no protótipo                                                                                                                        | Ref.         |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| L01 | Topo: logo à esquerda, menu, busca alinhada à direita com até 360 px                                                                         | Main:23-37   |
| L02 | Item ativo do menu com sublinhado de 2 px na cor da marca                                                                                    | Main:29      |
| L03 | Conteúdo em coluna de no máximo 1200 px, centralizada, com 24 px de respiro lateral                                                          | Main:41      |
| L04 | Trilha acima do cabeçalho do perfil                                                                                                          | Main:43      |
| L05 | Cabeçalho do perfil é um único cartão com foto, identificação, ações à direita e, embaixo, a grade de indicadores                            | Main:45-86   |
| L06 | Foto retangular 112×136 px com raio 12 px (não circular)                                                                                     | Main:47      |
| L07 | Selos "Em exercício" e "57ª legislatura · 2023–2027" em pílulas separadas acima do nome                                                      | Main:49-52   |
| L08 | Quatro indicadores numa única linha                                                                                                          | Main:63      |
| L09 | Abas de seção entre o cabeçalho e o conteúdo, com a aba ativa sublinhada (2 px, marca, texto marca)                                          | Main:88-94   |
| L10 | Duas colunas: principal à esquerda, lateral à direita                                                                                        | Main:96-234  |
| L11 | Gastos: título e filtro de ano na mesma linha, filtro à direita                                                                              | Main:101-108 |
| L12 | Gráfico mensal com o valor acima de cada barra e o mês abaixo                                                                                | Main:124-133 |
| L13 | "Por tipo de despesa" e "Maiores fornecedores" lado a lado                                                                                   | Main:137-161 |
| L14 | Nota de fonte no pé de cada seção: texto à esquerda, links à direita, borda superior                                                         | Main:163-166 |
| L15 | Votação em linha: data numa coluna à esquerda, proposição e ementa no meio, orientação e voto à direita                                      | Main:180-190 |
| L16 | Bens: cartões por eleição em grade, depois comparação por tipo com barras pareadas (ano anterior claro `#B9C8F3`, atual `#1F4FD1`) e legenda | Main:202-226 |
| L17 | Lateral com, nesta ordem: Mandato, De onde vêm os dados, Encontrou um erro?                                                                  | Main:234-275 |
| L18 | Rodapé em duas colunas                                                                                                                       | Main:280     |

### Layout, celular (390 px)

| ID  | Esperado no protótipo                                                                                                | Ref.           |
| --- | -------------------------------------------------------------------------------------------------------------------- | -------------- |
| M01 | Topo numa linha: logo à esquerda, botões de ícone "Buscar" e "Menu" (44×44) à direita; sem menu nem campo abertos    | Mobile:24-34   |
| M02 | Foto 72×88 ao lado do nome (lado a lado, não empilhada)                                                              | Mobile:37-44   |
| M03 | Indicadores em grade 2×2                                                                                             | Mobile:45      |
| M04 | Botões "Acompanhar" e "Contestar dado" lado a lado, mesma largura                                                    | Mobile:51-54   |
| M05 | Abas de seção numa linha, com rolagem horizontal                                                                     | Mobile:57      |
| M06 | Cabeçalho do perfil e abas de ponta a ponta (sem cartão), seções em cartões com 16 px de margem                      | Mobile:36, 65  |
| M07 | Gráfico mensal sem valores sobre as barras, com a inicial de cada mês                                                | Mobile:78-88   |
| M08 | Votação: proposição e data na mesma linha, ementa abaixo, depois voto e orientação                                   | Mobile:99-107  |
| M09 | Bens: uma barra horizontal por eleição com o total                                                                   | Mobile:114-119 |
| M10 | Página sem rolagem horizontal                                                                                        | —              |
| M11 | Resumo, não listas longas: até 4 tipos de despesa, sem tabela de fornecedores, 3 votações e link "Ver as N votações" | Mobile:89-110  |

### Conteúdo

| ID  | Esperado no protótipo                                                                                                                                                                                     | Ref.                      |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| C01 | Menu: Parlamentares, Gastos públicos, Metodologia, Sobre                                                                                                                                                  | Main:29-32                |
| C02 | Trilha "Parlamentares / Câmara dos Deputados / Nome", com links nos dois primeiros                                                                                                                        | Main:43                   |
| C03 | Linha do cargo com UF por extenso e sigla e nome do partido com sigla: "Deputada federal por São Paulo (SP) · Partido Fictício (PFX)"                                                                     | Main:54                   |
| C04 | Linha de procedência: "Nome civil, cargo, UF e partido conforme a Câmara dos Deputados."                                                                                                                  | Main:55                   |
| C05 | Botão "Acompanhar atualizações"                                                                                                                                                                           | Main:58                   |
| C06 | Botão "Contestar um dado"                                                                                                                                                                                 | Main:59                   |
| C07 | Indicador 1: "Cota parlamentar usada em AAAA", valor em reais por extenso (R$ 357.000), barra do % do teto, "N% do teto acumulado até mês (R$ X)"                                                         | Main:64-69                |
| C08 | Indicador 2: "Presença em votações nominais", "N de M em AAAA · média da Câmara N%"                                                                                                                       | Main:70-74                |
| C09 | Indicador 3: "Votou como o partido orientou", "Divergiu em N de M votações"                                                                                                                               | Main:75-79                |
| C10 | Indicador 4: "Bens declarados ao TSE (AAAA)", "+N% sobre AAAA, em valor nominal"                                                                                                                          | Main:80-84                |
| C11 | Abas: Gastos da cota, Votações, Bens declarados, Mandato, Fontes                                                                                                                                          | Main:89-93                |
| C12 | Filtro de gastos com os anos e "Mandato todo"                                                                                                                                                             | Main:104-106              |
| C13 | Legenda do gráfico: "Gasto mensal em AAAA" à esquerda e "Linha tracejada: teto mensal para UF (R$ X)" à direita                                                                                           | Main:120                  |
| C14 | "Por tipo de despesa" com "R$ X · N%"                                                                                                                                                                     | Main:139-142              |
| C15 | "Maiores fornecedores" (Fornecedor, CNPJ/CPF, Total) com nome como link, e nota do CPF mascarado                                                                                                          | Main:148-159              |
| C16 | Fonte da CEAP com "coletado em DD/MM/AAAA HH:MM" e links "Ver na fonte", "Baixar CSV", "Contestar"                                                                                                        | Main:164-165              |
| C17 | Título "Votações nominais recentes"; filtros "Todas", "Divergiu do partido", "Ausências"                                                                                                                  | Main:171-175              |
| C18 | Cada votação: proposição (ex.: "PL 1.234/2026") como link em destaque, depois "ementa · resultado"                                                                                                        | Main:183-184              |
| C19 | "Partido: X" e "Votou: Y"                                                                                                                                                                                 | Main:187-188              |
| C20 | Fonte das votações com links "Ver todas as N" e "Contestar"                                                                                                                                               | Main:194-195              |
| C21 | Bens: título "Bens declarados à Justiça Eleitoral", texto explicativo, cartões "Eleição AAAA" com total e nota de variação                                                                                | Main:200-209              |
| C22 | Fonte dos bens com links "Ver na DivulgaCand" e "Contestar"                                                                                                                                               | Main:228-229              |
| C23 | Mandato: Casa, UF por extenso, Início, Fim previsto, Situação                                                                                                                                             | Main:237-243              |
| C24 | "Comissões como titular" em lista                                                                                                                                                                         | Main:244-248              |
| C25 | "Linha do tempo" do mandato                                                                                                                                                                               | Main:249-254              |
| C26 | Seção "De onde vêm os dados" na lateral, com as fontes e a frase "Só usamos dados que os órgãos já publicam..."                                                                                           | Main:258-267              |
| C27 | "Encontrou um erro?": texto com "Respondemos em até 5 dias úteis e registramos toda alteração.", botão "Pedir correção" e link "Histórico de correções deste perfil (N)"                                  | Main:269-274              |
| C28 | Rodapé: "Controlador: ... · CNPJ ..." e "Encarregado (LGPD): ..."; "Alertas são indícios estatísticos para verificação, não acusações."; links Metodologia · Política de privacidade · Licenças dos dados | Main:281-282              |
| C29 | Celular: selo "Em exercício · 2023–2027"; linha "Deputada federal · SP · PFX"                                                                                                                             | Mobile:40-42              |
| C30 | Celular: rótulos curtos dos indicadores: "Cota em AAAA", "Presença", "Seguiu o partido", "Bens (TSE AAAA)"                                                                                                | Mobile:46-49              |
| C31 | Celular: títulos "Gastos da cota (CEAP) · AAAA", "Votações recentes", "Bens declarados ao TSE"; abas "Gastos, Votações, Bens, Mandato, Fontes"                                                            | Mobile:58-62, 67, 97, 113 |
| C32 | Celular: links "Ver todas as notas e fornecedores" e "Ver as N votações"                                                                                                                                  | Mobile:94, 109            |

### Comportamento

| ID  | Esperado                                                                                     | Ref.         |
| --- | -------------------------------------------------------------------------------------------- | ------------ |
| B01 | Busca do topo leva à lista de parlamentares filtrada                                         | Main:34      |
| B02 | Cada aba de seção leva à sua seção na página (inclusive Mandato e Fontes)                    | Main:89-93   |
| B03 | A aba ativa acompanha a seção visível                                                        | Main:89      |
| B04 | Filtro de ano troca os dados de gastos                                                       | Main:104-106 |
| B05 | Filtros de votações filtram a lista                                                          | Main:173-175 |
| B06 | "Contestar um dado" e "Contestar" de cada seção abrem o formulário de correção (com a seção) | Main:59, 165 |
| B07 | "Pedir correção" abre o formulário                                                           | Main:272     |
| B08 | "Ver na fonte" abre o original                                                               | Main:165     |
| B09 | Celular: "Buscar" abre a busca e "Menu" abre o menu                                          | Mobile:30-31 |
| B10 | "Acompanhar atualizações" tem efeito                                                         | Main:58      |
| B11 | Link da votação abre a votação na fonte                                                      | Main:183     |
| B12 | "Baixar CSV" baixa os gastos do ano                                                          | Main:165     |
