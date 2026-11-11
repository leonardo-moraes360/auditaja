# Verificação 4 de paridade com o protótipo

- Data: 11/11/2026 13:05
- Página: http://localhost:3020/parlamentares/204540 (Maria Rosas, SP)
- Viewports: desktop 1440×900; celular 390×844 (`isMobile`, `hasTouch`), Chromium 1228 via Playwright
- Protótipo: artifact `bd51453d-4873-432a-bc0d-eb0d462328ad`, versão `1794398523-e007` (`prototipo/Main.dc.html`,
  `prototipo/Mobile.dc.html`; medições em `proto-desktop.html` e `proto-mobile.html`)
- Worktree: `git rev-parse --short HEAD` = `51fff11`; `git status --short | wc -l` = 38
- Verificador independente; relatórios 1 a 3 não lidos. Scripts, JSON e screenshots em
  `/tmp/claude-1000/-home-leonardo-workspace-pessoal-auditaja/538dc8c5-62f8-4de1-ac53-a6fe2214758f/scratchpad/verif4/`

Método: `getComputedStyle` e `getBoundingClientRect` nos mesmos elementos da implementação e do protótipo
(`measure-d.js`, saída `impl-d.json`, `proto-d.json`, `impl-m.json`, `proto-m.json`); screenshots de página inteira
lado a lado; comportamentos executados de verdade (`beh1.js` a `beh6.js`): busca, clique em cada aba, rolagem,
anos 2026, 2025, 2023 e Mandato todo, os três filtros de votação, "Ver todas", os quatro "Contestar", "Pedir
correção", "Acompanhar", download do CSV em 2026 e 2025, menu e busca do celular.

## Resultado

| ID | Resultado | Evidência medida | Esperado |
| --- | --- | --- | --- |
| V01 | PASS | `body` bg `#F6F6F3` (desktop e celular) | `#F6F6F3` |
| V02 | PASS | `body` color `#15181E` | `#15181E` |
| V03 | PASS | link "Contestar" `#1F4FD1`; logo `fill-primary` | `#1F4FD1` |
| V04 | PASS | `body` font-family `Inter, "Inter Fallback", system-ui` | Inter |
| V05 | PASS | h1, todos os h2 e valores dos indicadores em `"Space Grotesk"` | Space Grotesk |
| V06 | PASS | rótulos dos indicadores, trilha, notas de fonte `#555B66` | `#555B66` |
| V07 | PASS | 6 cartões: bg `#FFFFFF`, borda 1px `#E2E2DC`, raio 16px (desktop) e 14px (celular) | branco, `#E2E2DC`, 16/14 |
| V08 | PASS | footer bg `#15181E`, texto `#D5D7DC`, 3 links `#A9BEF5` | idem |
| V09 | PASS | h1 36px (desktop), 24px (celular) | 36 / 24 |
| V10 | PASS | h2 principais 22px; Mandato e Fontes 18px; celular 18px ("Encontrou" 17px nos dois) | 22 / 18 |
| V11 | PASS | "Acompanhar atualizações": bg `#1F4FD1`, texto `#FFFFFF`, 44px, raio 10px | idem |
| V12 | PASS | "Contestar um dado": borda `#C9CAC2`, bg `#FFFFFF`, 44px, raio 10px | idem |
| V13 | PASS | filtros 36px; ativo borda `#1F4FD1`, bg `#E8EEFC`, texto `#1F4FD1`, peso 600 | idem |
| V14 | PASS | 10 barras `#1F4FD1`; teto `border-top: 2px dashed #B4440E` | idem |
| V15 | PASS | barras `#6E8FE8` sobre trilho `#F0F0EC`, 8px, raio 4px | idem |
| V16 | PASS | 11 combinações em 126 votações: igual ou Liberado `#E8EEFC`/`#163A9C`; contra `#FDF0E7`/`#7A2E09`; sem registro ou sem orientação `#F0F0EC`/`#3D424B` | idem |
| V17 | PASS | caixa bg `#E8EEFC`, borda 0px | idem |
| V18 | PASS | blocos `#F6F6F3`, raio 12px (celular 10px, como Mobile:43), sem borda, valor 26px / 20px | idem |
| V19 | PASS | busca 44px, raio 10px, bg `#FAFAF8` (borda `#80858E`, ver I5) | 44, 10, `#FAFAF8` |
| V20 | PASS | selo bg `#E6F4EA`, texto `#1E5B32`, raio pílula | idem |
| L01 | PASS | logo x=120, menu, busca x=960 w=360 à direita | idem (Main:23-37) |
| L02 | PASS | "Parlamentares" `border-bottom: 2px #1F4FD1` | idem |
| L03 | **FAIL** | contêiner `max-width: 1248px` + 24px: conteúdo com 1200px, cartão do perfil x=120 w=1200, Gastos w=879,7. Protótipo: `main` com 1200px **incluindo** o padding (`box-sizing: border-box`), conteúdo 1152px, perfil x=144 w=1152, Gastos w=831,7. Diferença de 48px na largura e 24px de recuo, visível nos screenshots (a coluna encosta no alinhamento do logo) | coluna de 1200px com respiro de 24px dentro dela (Main:41) |
| L04 | PASS | trilha y=93, acima do perfil (y=125) | idem |
| L05 | PASS | um `section` com foto, identificação, ações à direita e grade de indicadores | idem |
| L06 | PASS | foto 112×136, raio 12px | idem |
| L07 | PASS | dois selos separados acima do h1 | idem |
| L08 | PASS | 4 indicadores na mesma linha (y=314) | idem |
| L09 | PASS | abas entre perfil e conteúdo; ativa 2px `#1F4FD1`, texto `#1F4FD1` 600 | idem |
| L10 | PASS | principal x=120, lateral x=1020 (w=300,3, igual ao protótipo) | idem |
| L11 | PASS | h2 y=593 e filtros y=592 na mesma linha, filtros à direita | idem |
| L12 | PASS | rótulo "32,0k" acima de cada barra, mês abaixo | idem |
| L13 | PASS | "Por tipo" x=145 e "Maiores fornecedores" x=552, mesma y | idem |
| L14 | PASS | nota com `justify-content: space-between`, borda superior `#ECECE6`, padding 12px | idem |
| L15 | PASS | data w=84 à esquerda, proposição e ementa no meio, orientação e voto à direita | idem |
| L16 | PASS | 3 cartões em grade; barras pareadas `#B9C8F3` e `#1F4FD1`, 10px; legenda 2022/2026 | idem |
| L17 | PASS | lateral: Mandato (y=588), De onde vêm os dados (1382), Encontrou um erro? (1903) | idem |
| L18 | PASS | rodapé em duas colunas (x=120 e x=744) | idem |
| M01 | PASS | logo à esquerda; "Buscar" e "Menu" 44×44; menu e busca `hidden` ao carregar | idem |
| M02 | PASS | foto 72×88 raio 10 em x=16, h1 em x=102 | idem |
| M03 | PASS | indicadores 2×2 (175×87) | idem |
| M04 | PASS | "Acompanhar" 174px e "Contestar dado" 176px lado a lado | idem (174/176 no protótipo) |
| M05 | PASS | abas numa linha, `overflow-x: auto`, padding 8px | idem |
| M06 | PASS | perfil e abas de ponta a ponta (x=0 w=390, sem raio); cartões x=16 w=358 | idem |
| M07 | PASS | sem rótulos de valor; iniciais J F M A M J J A S O | idem |
| M08 | PASS | proposição e data "14/10" na mesma linha, ementa abaixo, voto antes de "Partido" | idem (conteúdo da ementa em X03) |
| M09 | PASS | uma barra por eleição com total (2018, 2022, 2026) | idem |
| M10 | PASS | `scrollWidth` 390 na carga, com menu aberto, na lista completa | 390 |
| M11 | PASS | 4 tipos visíveis (de 7), sem tabela de fornecedores, 3 votações, "Ver as 126 votações" | idem |
| C01 | INTENCIONAL (I6) | menu: Parlamentares, Metodologia, Sobre | com "Gastos públicos" |
| C02 | PASS | "Parlamentares / Câmara dos Deputados / Maria Rosas", 2 links | idem |
| C03 | PASS | "Deputada federal por São Paulo (SP) · Republicanos (REPUBLICANOS)" | idem |
| C04 | PASS | "Nome civil, cargo, UF e partido conforme a Câmara dos Deputados." | idem (sem TSE, I4) |
| C05 | PASS | "Acompanhar atualizações" | idem |
| C06 | PASS | "Contestar um dado" | idem |
| C07 | PASS | "Cota parlamentar usada em 2026", "R$ 396.170", barra, "74% do teto acumulado até nov (R$ 536.002)" | idem |
| C08 | PASS | "Presença em votações nominais", "115 de 126 em 2026 · média da Câmara 76%" | idem |
| C09 | PASS | "Votou como o partido orientou", "Divergiu em 8 de 88 votações" | idem |
| C10 | PASS | "Bens declarados ao TSE (2026)", "+14% sobre 2022, em valor nominal" | idem |
| C11 | PASS | Gastos da cota, Votações, Bens declarados, Mandato, Fontes | idem |
| C12 | PASS | 2026, 2025, 2024, 2023, Mandato todo | anos + "Mandato todo" |
| C13 | PASS | "Gasto mensal em 2026" / "Linha tracejada: teto mensal para SP (R$ 48.727)" | idem |
| C14 | PASS | "R$ 163.600 · 41%" | "R$ X · N%" |
| C15 | PASS | colunas Fornecedor, CNPJ/CPF, Total; nome é link; nota do CPF mascarado | idem (agrupamento em X04) |
| C16 | PASS | "coletado em 11/11/2026 09:30"; Ver na fonte, Baixar CSV, Contestar | idem |
| C17 | PASS | "Votações nominais recentes"; Todas, Divergiu do partido, Ausências | idem |
| C18 | PASS | "PLP 186/2026" link 15px 600, depois "ementa · Aprovada" | idem |
| C19 | PASS | "Partido: Sim" e "Votou: Sim" | idem |
| C20 | PASS | "Ver todas as 126" e "Contestar" (mais "Ver na fonte") | idem |
| C21 | PASS | título, texto explicativo, cartões "Eleição AAAA" com total e nota | idem |
| C22 | PASS | "Ver na DivulgaCand" e "Contestar" | idem |
| C23 | PASS | Casa, UF (São Paulo), Início, Fim previsto, Situação | idem |
| C24 | PASS | "Comissões como titular" em `ul` | idem |
| C25 | PASS | "Linha do tempo" com 4 marcos | idem |
| C26 | PASS | "De onde vêm os dados" com 5 fontes e a frase "Só usamos dados..." | idem |
| C27 | INTENCIONAL (I7) | sem prazo e sem histórico; "Pedidos de correção deste perfil (0)" | com prazo e histórico |
| C28 | PASS | controlador · CNPJ; encarregado; aviso dos alertas; 3 links | idem |
| C29 | PASS | "Em exercício · 2023–2027"; "Deputada federal · SP · REPUBLICANOS" | idem |
| C30 | PASS | "Cota em 2026", "Presença", "Seguiu o partido", "Bens (TSE 2026)" | idem |
| C31 | PASS | "Gastos da cota (CEAP) · 2026", "Votações recentes", "Bens declarados ao TSE"; abas curtas | idem |
| C32 | PASS | "Ver todas as notas e fornecedores" (abre 7 tipos e a tabela) e "Ver as 126 votações" (abre 126) | idem |
| B01 | PASS | "Rosas" + Enter (desktop e celular) → `/parlamentares?q=Rosas`, "1 resultado(s)", Maria Rosas | lista filtrada |
| B02 | PASS | clique em cada uma das 5 abas: hash muda e a seção fica a 16px do topo (Bens no desktop a 286px: fim da página), desktop e celular | rola até a seção |
| B03 | PASS | rolagem: celular percorre as 5 abas; desktop Gastos → Votações → Bens (Mandato e Fontes ficam ativas no clique; na rolagem a aba é a da coluna principal visível ao lado delas) | aba acompanha a seção visível |
| B04 | PASS | 2025: R$ 484.643, 12 barras, sem teto (I8); 2023: R$ 446.735; Mandato todo: 4 barras anuais; 2026 volta ao teto; aria-current segue o filtro | dados trocam |
| B05 | PASS | Divergiu: 5 de 8, todas com voto contrário à orientação; Ausências: 5 de 11, todas "sem registro"; "Ver todas as 126" lista 126 | lista filtrada |
| B06 | PASS | "Contestar um dado" → formulário (seção "Outro"); Contestar de Gastos, Votações e Bens → `?secao=` com o select na seção certa | formulário com a seção |
| B07 | PASS | "Pedir correção" → `/contestar`, h1 "Pedir correção" | abre o formulário |
| B08 | PASS | "Ver na fonte" (Gastos) → `camara.leg.br/cotas/Ano-2026.csv.zip`, `target=_blank`, HTTP 200 `application/zip` | abre o original |
| B09 | PASS | toque em "Menu" mostra Parlamentares, Metodologia, Sobre; "Buscar" mostra o campo e fecha o menu | abre busca e menu |
| B10 | PASS | `/acompanhar` explica o feed Atom `/parlamentares/204540/feed.xml` | tem efeito |
| B11 | PASS | "PLP 186/2026" → `dadosabertos.camara.leg.br/api/v2/votacoes/2635476-36`, `_blank`, HTTP 200 | abre a votação na fonte |
| B12 | PASS | `ceap-204540-2026.csv`: 411 notas, todas ano 2026; após 2025, `ceap-204540-2025.csv`: 518 notas, todas ano 2025 | baixa os gastos do ano |
| X01 | **FAIL** | "Pedir correção" com padding 18px e largura 135,5px nos dois tamanhos (classe `px-4` perde para o `px-[18px]` de `BOTAO_PRIMARIO`) | padding `0 16px`, largura 131,5px (Main:272, Mobile:129) |
| X02 | **FAIL** | celular: "Parlamentares, assessorias e qualquer pessoa podem pedir correção. Registramos cada pedido e toda alteração." + link de contagem (texto do desktop) | celular: "Qualquer pessoa pode pedir correção." (Mobile:128); I7 só tira o prazo |
| X03 | **FAIL** | celular: ementa seguida de " · Aprovada" / " · Rejeitado" em cada votação | celular só com a ementa, sem resultado (Mobile:103) |
| X04 | **FAIL** | "Maiores fornecedores" agrupa por nome + documento: o mesmo CNPJ aparece duas vezes no top 5 (2026: "RONI MOTORS LOCACOES LTDA" e "RONIMOTORS LOCAÇÕES LTDA", 37.331.288/0001-97; "VED Imóveis LTDA - EPP" e "VED IMOVEIS LTDA", 25.066.806/0001-03; repete em Mandato todo) | uma linha por fornecedor (Main:153-154) |
| X05 | **FAIL** | "Pedidos de correção deste perfil (0)" é link para o mesmo formulário de "Pedir correção" (`/parlamentares/204540/contestar`), não para os pedidos | link de histórico que leva aos registros (Main:273); I7 aceita mostrar só a contagem, não um link que promete a lista e abre o formulário |

## Placar

| PASS | FAIL | INTENCIONAL | Paridade |
| --- | --- | --- | --- |
| 90 | 6 | 2 | 90 ÷ 96 = **93,8%** (meta ≥ 95%) |

FAIL: L03, X01, X02, X03, X04, X05.

## Intencionais

- C01: I6, menu sem "Gastos públicos".
- C27: I7, sem prazo e sem "Histórico de correções"; mostra a contagem de pedidos.
- Aplicadas dentro de itens que passaram: I1 (dados reais, sem aviso de dados fictícios), I2 (sem alerta atípico),
  I3 (placeholder só "deputado"), I4 (sem votos do TSE em C04), I5 (borda `#80858E` da busca, fora de V19), I8
  (teto, legenda e barra só em 2026: em 2025 e 2023 a legenda some e o indicador mostra "N documentos · sem teto
  conferido").

## Observações sem pontuação

- C07: o indicador diz "até nov" e soma o teto até novembro (último mês publicado na base inteira), mas o gráfico
  da deputada para em outubro. No protótipo o mês do teto e a última barra coincidem ("até out"). Decorre da regra
  de dados, por isso não virou item.
- A seção de votações tem uma linha a mais ("A presença conta todas as votações nominais...") e "Ver na fonte" nas
  notas de votações e bens do celular; o protótipo não tem, mas não muda layout nem leitura.
- O logo usa `letter-spacing` -0,025em nos dois tamanhos (protótipo: -0,02em no desktop, normal no celular):
  diferença de 1 a 4 px de largura, tratada como trivial.
- No celular, abrir "Buscar" não põe o foco no campo.
