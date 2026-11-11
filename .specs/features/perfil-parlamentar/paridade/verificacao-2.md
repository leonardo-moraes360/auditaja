# Verificação 2 de paridade com o protótipo

- Data: 2026-11-11
- URL: http://localhost:3020/parlamentares/204540 (dev server do worktree `paridade-prototipo`)
- Viewports: desktop 1440×900; celular 390×844 (`isMobile`, `hasTouch`), Chromium 1228 via Playwright
- Protótipo: artifact `bd51453d-4873-432a-bc0d-eb0d462328ad`, versão `1794398523-e007` (`prototipo/Main.dc.html`, `prototipo/Mobile.dc.html`; renderizados em `proto-desktop.html` e `proto-mobile.html`)
- Worktree: `git rev-parse --short HEAD` = `51fff11`; `git status --short | wc -l` = `34` (há alterações não commitadas, então o resultado vale para o estado em disco, não para o commit)
- Método: `getComputedStyle` e bounding boxes na implementação e no protótipo renderizado, screenshots de página inteira lado a lado nos dois tamanhos, cliques e toques reais (abas, filtros, Contestar, Pedir correção, Acompanhar, busca, Buscar e Menu no celular, download do CSV). Verificador independente: não li `verificacao-1.md`.
- Referências de linha `Main:NN` e `Mobile:NN` nos itens X apontam as linhas das cópias formatadas em `prototipo/`.

## Resultado

| ID  | Resultado | Evidência medida | Esperado |
| --- | --- | --- | --- |
| V01 | PASS | `body` background `#F6F6F3` (desktop e celular) | `#F6F6F3` |
| V02 | PASS | `body` color `#15181E` | `#15181E` |
| V03 | PASS | Links "Ver na fonte", "Baixar CSV", "Contestar", "Ver todas as notas e fornecedores" com `#1F4FD1`; logo e botão primário `#1F4FD1` | `#1F4FD1` |
| V04 | PASS | `body` font-family `Inter, "Inter Fallback", system-ui` | Inter |
| V05 | PASS | h1, todos os h2 e os 4 valores dos indicadores com font-family `"Space Grotesk"` | Space Grotesk |
| V06 | PASS | Rótulos dos indicadores, trilha e linha de procedência com `#555B66` | `#555B66` |
| V07 | PASS | Cartões: fundo `#FFFFFF`, borda 1 px `#E2E2DC`, raio 18 px no desktop (16 ± 2) e 14 px no celular | branco, 1 px `#E2E2DC`, 16 / 14 px |
| V08 | PASS | `footer` fundo `#15181E`, texto `#D5D7DC`, links `#A9BEF5` | idem |
| V09 | PASS | h1 com 36 px (desktop) e 24 px (celular) | 36 / 24 px |
| V10 | PASS | h2 principal 22 px; Mandato e De onde vêm os dados 18 px; celular 18 px | 22 / 18 / 18 px |
| V11 | PASS | "Acompanhar atualizações": fundo `#1F4FD1`, texto `#FFFFFF`, 212×44, raio 10 px | `#1F4FD1`, branco, 44 px, raio 10 |
| V12 | PASS | "Contestar um dado": borda 1 px `#C9CAC2`, fundo `#FFFFFF`, 44 px, raio 10 px | idem |
| V13 | PASS | Filtros de ano e de votações com 36 px; o ativo tem borda `#1F4FD1`, fundo `#E8EEFC`, texto `#1F4FD1` | idem |
| V14 | PASS | Barras `#1F4FD1`; teto `border-top: 2px dashed #B4440E` | idem |
| V15 | PASS | Barras por tipo `#6E8FE8`, 8 px de altura, trilho `#F0F0EC` | idem |
| V16 | PASS | Igual: `#E8EEFC`/`#163A9C`; divergiu (filtro "Divergiu do partido"): `#FDF0E7`/`#7A2E09`; sem registro (filtro "Ausências"): `#F0F0EC`/`#3D424B` | idem |
| V17 | PASS | Caixa "Encontrou um erro?": fundo `#E8EEFC`, borda 0 | `#E8EEFC`, sem borda |
| V18 | PASS | Blocos `#F6F6F3`, borda 0, raio 14 px no desktop (12 ± 2) e 10 px no celular; valor com 26 px / 20 px | `#F6F6F3`, raio 12, sem borda, 26 / 20 px |
| V19 | PASS | `input` 360×44, raio 10 px, fundo `#FAFAF8` | 44 px, raio 10, `#FAFAF8` |
| V20 | PASS | Selo com fundo `#E6F4EA`, texto `#1E5B32` e raio 999 px (pílula) | idem |
| L01 | PASS | Logo em x=144, menu em x=298, campo de busca à direita (x=936, 360 px de largura) | logo, menu, busca à direita com até 360 px |
| L02 | PASS | "Parlamentares" com `border-bottom: 2px solid #1F4FD1` | 2 px na cor da marca |
| L03 | PASS | Cartões de x=144 a x=1296 (1152 px); coluna de 1200 px centralizada com 24 px de padding, igual ao protótipo | máx. 1200 px, centralizada, 24 px |
| L04 | PASS | `nav[aria-label=Trilha]` em y=94, acima do cartão do perfil (y=129) | trilha acima |
| L05 | PASS | Uma `section` (1152×363) com foto, identificação, ações à direita (x=1055) e a grade de indicadores embaixo | cartão único |
| L06 | PASS | `img` 112×136, raio 14 px (12 ± 2), `object-fit: cover` | 112×136, raio 12, retangular |
| L07 | PASS | Duas pílulas separadas ("Em exercício" em x=309, "57ª legislatura · 2023–2027" em x=411) acima do h1 | pílulas separadas |
| L08 | PASS | 4 blocos de 265 px na mesma linha (y=320) | 4 numa linha |
| L09 | PASS | Abas em y=512, entre o cabeçalho (fim em y=492) e o conteúdo (y=581); ativa com `2px solid #1F4FD1` e texto `#1F4FD1` | idem |
| L10 | PASS | Coluna principal com x=144 e 832 px; lateral com x=996 e 300 px | duas colunas |
| L11 | PASS | h2 em y=606; filtro de ano à direita (x=582 a 950) na mesma linha | título e filtro na mesma linha |
| L12 | PASS | 10 rótulos de valor acima das barras ("32,0k"…) e meses abaixo ("Jan"…"Out") | valor acima, mês abaixo |
| L13 | PASS | "Por tipo de despesa" (x=169) e "Maiores fornecedores" (x=552) com o mesmo y=936 | lado a lado |
| L14 | **FAIL** | Nas 3 notas de fonte o texto ocupa 611–632 px da linha de 782 px e os links quebram para uma segunda linha alinhada à esquerda (texto em y=1374, links em y=1398, x=169). Não ficam links à direita. O texto ficou mais longo ("valores líquidos em 2026", "(votações, votos e orientações)", hora nos bens) | texto à esquerda e links à direita na mesma linha, com borda superior (Main:598-614) |
| L15 | PASS | Data em x=169, proposição e ementa em x=273, "Partido…" (x=729) e selo (x=858) à direita | 3 colunas |
| L16 | PASS | 3 cartões "Eleição AAAA" em grade; barras pareadas `#B9C8F3`/`#1F4FD1`; legenda 2022 e 2026 | idem |
| L17 | PASS | Lateral: Mandato (y=581), De onde vêm os dados (y=1481), Encontrou um erro? (y=2046) | nessa ordem |
| L18 | PASS | Rodapé com bloco de controlador à esquerda e alertas e links à direita (x=744) | duas colunas |
| M01 | PASS | Topo de 61 px: logo, botões "Buscar" e "Menu" de 44×44 em x=282 e x=330; nenhum campo ou menu aberto ao carregar | idem |
| M02 | PASS | Foto 72×88 em x=16 e h1 em x=102, na mesma linha | lado a lado |
| M03 | PASS | Blocos em (28,195), (211,195), (28,296), (211,296): grade 2×2 | 2×2 |
| M04 | PASS | "Acompanhar" com 174×44 e "Contestar dado" com 176×44, ambos em y=390 | lado a lado, mesma largura |
| M05 | PASS | `nav` com `overflow-x: auto`, 5 abas numa linha (y=455) | uma linha, rolagem horizontal |
| M06 | PASS | Cabeçalho do perfil de x=0 a 390, sem raio nem borda lateral; abas de ponta a ponta; seções com x=16 e 358 px | idem |
| M07 | PASS | Nenhum texto de valor dentro do gráfico; rótulos "J,F,M,A,M,J,J,A,S,O" | sem valores, iniciais |
| M08 | PASS | Proposição à esquerda e data "14/10" à direita na mesma linha; ementa abaixo; depois selo e "Partido" | idem |
| M09 | PASS | 3 linhas "Eleição AAAA" com total e barra | 1 barra por eleição |
| M10 | PASS | `scrollWidth` = 390 = `innerWidth` | sem rolagem horizontal |
| M11 | PASS | 4 tipos de despesa, tabela de fornecedores com 0×0 (oculta), 3 votações, link "Ver as 126 votações" | idem |
| C01 | **FAIL** | Menu com "Parlamentares", "Metodologia" e "Sobre", sem "Gastos públicos" (desktop e menu do celular) | Parlamentares, Gastos públicos, Metodologia, Sobre (Main:72-79) |
| C02 | PASS | "Parlamentares / Câmara dos Deputados / Maria Rosas", com os dois primeiros como links | idem |
| C03 | PASS | "Deputada federal por São Paulo (SP) · Republicanos (REPUBLICANOS)" | formato idêntico |
| C04 | PASS | "Nome civil, cargo, UF e partido conforme a Câmara dos Deputados." (o trecho do TSE fica fora pelo I4) | idem |
| C05 | PASS | "Acompanhar atualizações" | idem |
| C06 | PASS | "Contestar um dado" | idem |
| C07 | PASS | "Cota parlamentar usada em 2026", "R$ 396.170", barra, "74% do teto acumulado até nov (R$ 536.002)" | formato idêntico |
| C08 | PASS | "Presença em votações nominais", "115 de 126 em 2026 · média da Câmara 76%" | idem |
| C09 | PASS | "Votou como o partido orientou", "Divergiu em 8 de 88 votações" | idem |
| C10 | PASS | "Bens declarados ao TSE (2026)", "+14% sobre 2022, em valor nominal" | idem |
| C11 | PASS | Gastos da cota, Votações, Bens declarados, Mandato, Fontes | idem |
| C12 | PASS | 2026, 2025, 2024, 2023, Mandato todo | anos e "Mandato todo" |
| C13 | PASS | "Gasto mensal em 2026" à esquerda e "Linha tracejada: teto mensal para SP (R$ 48.727)" à direita | idem |
| C14 | PASS | "R$ 163.600 · 41%" etc. | "R$ X · N%" |
| C15 | PASS | Tabela Fornecedor / CNPJ/CPF / Total, 5 linhas, nome como link e nota "CPF de pessoa física aparece mascarado…" | idem |
| C16 | PASS | "… coletado em 11/11/2026 12:24" com Ver na fonte, Baixar CSV e Contestar | idem |
| C17 | PASS | "Votações nominais recentes"; Todas, Divergiu do partido, Ausências | idem |
| C18 | **FAIL** | Proposição como link (ok), mas a linha "ementa · resultado" tem `-webkit-line-clamp: 2` e `overflow: hidden` (scrollHeight 98 > clientHeight 39): em 3 das 5 votações o resultado ("· Aprovada") fica cortado e não aparece | "ementa · resultado" visível (Main:707-708) |
| C19 | **FAIL** | Rótulo "Partido (bloco): Sim" em todas as linhas; selo de divergência "Votou: Não (divergiu da orientação)" | "Partido: X" e "Votou: Y" (Main:711-714) |
| C20 | PASS | "Ver todas as 126" e "Contestar" (e mais "Ver na fonte") | idem |
| C21 | PASS | "Bens declarados à Justiça Eleitoral", texto explicativo, 3 cartões "Eleição AAAA" com total e nota | idem |
| C22 | PASS | "Ver na DivulgaCand" e "Contestar" | idem |
| C23 | PASS | dt: Casa, UF, Início, Fim previsto, Situação; UF "São Paulo" | idem |
| C24 | PASS | "Comissões como titular" em `ul` (7 itens, disc) | lista |
| C25 | PASS | "Linha do tempo" em `ol` (4 itens) | idem |
| C26 | PASS | Seção na lateral com 5 fontes e "Só usamos dados que os órgãos já publicam. Cada registro guarda link e data de coleta." | idem |
| C27 | **FAIL** | Texto "Parlamentares, assessorias e qualquer pessoa podem pedir correção. Registramos cada pedido e toda alteração." (falta "Respondemos em até 5 dias úteis"); link "Pedidos de correção deste perfil (0)" em vez de "Histórico de correções deste perfil (N)". No celular, o mesmo texto em vez de "Qualquer pessoa pode pedir correção. Respondemos em até 5 dias úteis." | "Respondemos em até 5 dias úteis e registramos toda alteração.", "Pedir correção", "Histórico de correções deste perfil (N)" (Main:986-1007, Mobile:502-503) |
| C28 | PASS | "Controlador: [NOME DO CONTROLADOR] · CNPJ [CNPJ]", "Encarregado (LGPD): …", frase dos alertas, Metodologia · Política de privacidade · Licenças dos dados | idem |
| C29 | PASS | Celular: "Em exercício · 2023–2027"; "Deputada federal · SP · REPUBLICANOS" | idem |
| C30 | PASS | Cota em 2026, Presença, Seguiu o partido, Bens (TSE 2026) | idem |
| C31 | PASS | "Gastos da cota (CEAP) · 2026", "Votações recentes", "Bens declarados ao TSE"; abas Gastos, Votações, Bens, Mandato, Fontes | idem |
| C32 | PASS | "Ver todas as notas e fornecedores" e "Ver as 126 votações" | idem |
| B01 | PASS | Digitar "Rosas" e Enter leva a `/parlamentares?q=Rosas`, com "1 resultado(s) … Maria Rosas" | lista filtrada |
| B02 | PASS | Cada aba muda o hash (#votacoes, #bens, #mandato, #fontes, #gastos) e a seção fica a 16 px do topo (desktop e toque no celular) | leva à seção |
| B03 | **FAIL** | Desktop: depois de clicar em "Bens declarados", a aba ativa (`aria-current`) é "Votações"; em "Mandato" é "Gastos da cota"; em "Fontes" é "Votações". Ao rolar até o fim, Bens, Mandato e Fontes nunca ficam ativas. (No celular funciona.) | aba ativa acompanha a seção visível |
| B04 | PASS | Clicar em 2025 leva a `?ano=2025#gastos`: "Gasto mensal em 2025" com 12 barras novas; "Mandato todo" mostra "Gasto anual no mandato" | troca os dados |
| B05 | PASS | "Divergiu do partido" mostra só selos de divergência; "Ausências" mostra só "sem registro"; "Todas" volta à lista; o filtro ativo muda | filtra a lista |
| B06 | PASS | "Contestar um dado" abre `/contestar`; os "Contestar" de gastos, votações e bens abrem o formulário com `select secao` = gastos / votacoes / bens | formulário com a seção |
| B07 | PASS | "Pedir correção" abre `/contestar` com o formulário (secao=outro) | abre o formulário |
| B08 | **FAIL** | "Ver na fonte" dos gastos aponta para `https://www.camara.leg.br/cotas/Ano-2023.csv.zip` com 2026 selecionado e também com `?ano=2025`, então não é o original dos dados exibidos (os de votações e mandato estão corretos) | abre o original da seção exibida |
| B09 | PASS | Toque em "Buscar" abre o campo "Buscar deputado por nome ou UF", e Enter leva a `/parlamentares?q=Rosas`; toque em "Menu" abre Parlamentares / Metodologia / Sobre | abre busca e menu |
| B10 | PASS | Abre `/parlamentares/204540/acompanhar` com o feed público explicado | tem efeito |
| B11 | PASS | "PLP 186/2026" leva a `https://dadosabertos.camara.leg.br/api/v2/votacoes/2635476-36` em nova aba | abre a votação na fonte |
| B12 | PASS | Baixa `ceap-204540-2026.csv` com 413 linhas, cabeçalho `ano;mes;data_emissao;…` e linhas de 2026 | baixa os gastos do ano |
| X01 | **FAIL** | Celular: rodapé escuro de ponta a ponta (`#15181E`, 390×224, texto 16 px `#D5D7DC`, 3 links, controlador com CNPJ) | Celular: rodapé claro dentro da coluna, 12 px `#555B66`, "Controlador: [NOME] · Encarregado (LGPD): [E-MAIL]", "Alertas são indícios para verificação, não acusações." e só o link Metodologia (Mobile:524-527) |
| X02 | **FAIL** | Borda do campo de busca do topo `1px solid #80858E` | `1px solid #C9CAC2` (Main:96) |
| X03 | **FAIL** | Cartões da lateral (Mandato, De onde vêm os dados) com padding de 24 px (área útil de 250 px) | padding de 20 px, área útil de 258 px (Main:842, 941) |

## Placar

- PASS: 86
- FAIL: 10 (L14, C01, C18, C19, C27, B03, B08, X01, X02, X03)
- INTENCIONAL: 4 (I1–I4)
- **Paridade = 86 ÷ (86 + 10) = 89,6%** (meta ≥ 95%: não atingida)

## Intencionais (fora do denominador)

| ID | Situação observada |
| --- | --- |
| I1 | Dados reais (Maria Rosas, REPUBLICANOS, foto oficial, valores da CEAP e do TSE) e sem a faixa "dados fictícios". Diferenças só de dados (tamanho dos textos, ementas longas, valores de bens pequenos, barras acima do teto) não foram contadas. |
| I2 | O alerta "Padrão atípico para verificação" não aparece em gastos (desktop e celular). |
| I3 | O placeholder da busca é "Buscar deputado por nome ou UF", sem "senador". |
| I4 | A linha de procedência não traz "Eleita em 2022 com N votos (TSE)". |

## Observações que não viraram item

- O logo do topo começa em x=144 na implementação e em x=120 no protótipo. A diferença vem de um artefato do protótipo: o `header` usa `max-width` sem `box-sizing`. O alinhamento da implementação com o conteúdo é coerente, então não contei.
- Raios de 18 px (cartões), 14 px (foto e indicadores) e 10 px (filtros de ano) ficam 2 px acima do protótipo, no limite da tolerância de ±2 px.
- No celular a página mostra Mandato e De onde vêm os dados inteiros. O protótipo do celular só tem as abas, sem as seções, mas as abas exigem destino (B02), então não contei.
- O h2 tem 34 px de altura de linha, contra 28 px no protótipo (line-height maior): diferença pequena, não contei.
