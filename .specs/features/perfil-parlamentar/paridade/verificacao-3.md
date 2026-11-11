# Verificação 3 de paridade com o protótipo

- Data: 11/11/2026 12:52
- URL: http://localhost:3020/parlamentares/204540 (dev server já rodando)
- Viewports: desktop 1440×900; celular 390×844 com `isMobile` e `hasTouch` (Chromium 1228, Playwright)
- Protótipo: artifact `bd51453d-4873-432a-bc0d-eb0d462328ad`, versão `1794398523-e007` (`prototipo/Main.dc.html`,
  `prototipo/Mobile.dc.html`; medidas tiradas de `proto-desktop.html` e `proto-mobile.html` via `file://`)
- Worktree: `git rev-parse --short HEAD` = `51fff11`; `git status --short | wc -l` = `37`
- Método: `getComputedStyle` e bounding boxes nas mesmas consultas para protótipo e implementação, screenshots de
  página inteira lado a lado por seção, e ações reais (clique, rolagem em passos de 250 px, navegação, download).
  Scripts e capturas em `/tmp/claude-1000/-home-leonardo-workspace-pessoal-auditaja/538dc8c5-62f8-4de1-ac53-a6fe2214758f/scratchpad/verif3/`.
- Referências `Main:NN`/`Mobile:NN` sem "l." são as da rubrica; as cópias em `prototipo/` estão reformatadas, então os itens X citam a linha real da cópia ("l. NN").
- Verificador independente: não li `verificacao-1.md` nem `verificacao-2.md`.

Nota sobre a rubrica: durante esta verificação, `rubrica.md` mudou em disco (12:45) e passou a listar I6 (menu sem
"Gastos públicos") e I7 ("Encontrou um erro?" sem prazo e sem histórico). A instrução desta verificação diz que
só I1–I5 são intencionais. O placar principal segue essa instrução; o placar alternativo, com I6 e I7, está no fim.

## Resultados

| ID  | Resultado | Evidência medida | Esperado |
| --- | --------- | ---------------- | -------- |
| V01 | PASS | `body` bg `#F6F6F3` (desktop e celular) | `#F6F6F3` |
| V02 | PASS | `body` color `#15181E`; h1 `#15181E` | `#15181E` |
| V03 | PASS | "Ver na fonte", "Baixar CSV", links de fontes: `#1F4FD1`; marca no botão e abas `#1F4FD1` | `#1F4FD1` |
| V04 | PASS | `body` font-family `Inter` | Inter |
| V05 | PASS | h1, todos os h2 e valores dos indicadores: `"Space Grotesk"` | Space Grotesk |
| V06 | PASS | trilha, rótulos dos indicadores, legendas: `#555B66` | `#555B66` |
| V07 | PASS | seções: bg `#FFFFFF`, borda `1px #E2E2DC`, raio 16 px (desktop) e 14 px (celular) | idem |
| V08 | PASS | footer bg `#15181E`, color `#D5D7DC`, links `#A9BEF5` (desktop) | idem |
| V09 | PASS | h1 36 px (desktop), 24 px (celular) | 36 / 24 |
| V10 | PASS | h2 principais 22 px; lateral 18 px; celular 18 px ("Encontrou um erro?" 17 px nos dois) | 22 / 18 / 18 |
| V11 | PASS | "Acompanhar atualizações": bg `#1F4FD1`, texto `#FFFFFF`, 212×44, raio 10 px | idem |
| V12 | PASS | "Contestar um dado": borda `1px #C9CAC2`, bg `#FFFFFF`, 167×44, raio 10 px | idem |
| V13 | PASS | filtros 36 px; ativo ("2026", "Todas") borda `#1F4FD1`, bg `#E8EEFC`, texto `#1F4FD1`; inativo `#C9CAC2`/`#FFFFFF`/`#3D424B` | idem |
| V14 | PASS | barras `#1F4FD1` (raio 4 4 0 0); linha `border-top: 2px dashed #B4440E` | idem |
| V15 | PASS | barra `#6E8FE8`, trilho `#F0F0EC`, 8 px, raio 4 px | idem |
| V16 | PASS | igual `#E8EEFC`/`#163A9C`; contra (filtro "Divergiu") `#FDF0E7`/`#7A2E09`; "sem registro" `#F0F0EC`/`#3D424B` | idem |
| V17 | PASS | caixa bg `#E8EEFC`, borda 0, raio 16 px (desktop) / 14 px (celular) | idem |
| V18 | PASS | blocos `#F6F6F3`, raio 12 px (celular 10 px, igual ao protótipo), sem borda; valor 26 px / 20 px | idem |
| V19 | PASS | input 360×44, raio 10 px, bg `#FAFAF8` (borda `#80858E`: I5) | idem |
| V20 | PASS | selo bg `#E6F4EA`, texto `#1E5B32`, raio 999 px | idem |
| L01 | PASS | logo à esquerda, menu, busca 360 px à direita (alinhamento do contêiner: ver X01) | idem |
| L02 | PASS | "Parlamentares" com `border-bottom: 2px solid #1F4FD1` | idem |
| L03 | PASS | seções de x=144 a x=1296 (1152 = 1200 − 2×24), centralizadas | idem |
| L04 | PASS | trilha em y=94, cartão do perfil em y=129 | idem |
| L05 | PASS | um `section` 1152 px com foto, identificação, ações à direita (x=1055) e grade de indicadores embaixo | idem |
| L06 | PASS | `img` 112×136, raio 12 px | idem |
| L07 | PASS | "Em exercício" e "57ª legislatura · 2023–2027" em pílulas separadas (x=309 e x=411) acima do h1 | idem |
| L08 | PASS | 4 indicadores em y=336, x=189/466/742/1019 | uma linha |
| L09 | PASS | abas entre cabeçalho e seções; ativa com borda inferior 2 px `#1F4FD1`, texto `#1F4FD1` peso 600 | idem |
| L10 | PASS | principal x=144 w=832; lateral x=996 w=300 | idem |
| L11 | PASS | h2 à esquerda (x=169), filtros à direita (até x=950) na mesma linha | idem |
| L12 | PASS | rótulo "32,0k" acima de cada barra, "Jan…Out" abaixo | idem |
| L13 | PASS | "Por tipo de despesa" x=169 e "Maiores fornecedores" x=552 na mesma faixa | idem |
| L14 | PASS | rodapé de seção com `border-top: 1px #E2E2DC`, texto à esquerda, links à direita | idem |
| L15 | PASS | data x=169, proposição/ementa x=273, orientação e voto à direita | idem |
| L16 | PASS | cartões "Eleição AAAA" em grade; barras pareadas `#B9C8F3`/`#1F4FD1` com legenda | idem |
| L17 | PASS | lateral: Mandato (y=581), De onde vêm os dados (y=1473), Encontrou um erro? (y=2030) | nessa ordem |
| L18 | PASS | footer em `flex` com duas colunas (texto à esquerda, aviso e links à direita) | idem |
| M01 | PASS | topo 61 px; logo à esquerda; botões "Buscar" e "Menu" 44×44; menu e campo fechados | idem |
| M02 | PASS | foto 72×88 em x=16, nome em x=102, lado a lado | idem |
| M03 | PASS | indicadores em (28,195), (211,195), (28,296), (211,296) | 2×2 |
| M04 | PASS | "Acompanhar" 174×44 e "Contestar dado" 176×44 lado a lado (protótipo: 174 e 176) | idem |
| M05 | PASS | abas numa linha, `overflow-x: auto`, `nowrap` | idem |
| M06 | PASS | cabeçalho 390 px sem raio/borda lateral; seções x=16 w=358 | idem |
| M07 | PASS | sem rótulos de valor visíveis; meses "J F M A M J J A S O" | idem |
| M08 | PASS | "PLP 186/2026" e "14/10" na mesma linha, ementa abaixo, depois voto e partido | idem |
| M09 | PASS | uma barra por eleição (2018, 2022, 2026) com o total à direita | idem |
| M10 | PASS | `scrollWidth` 390 no padrão, `?ano=2025`, `?ano=mandato`, filtros de voto, lista completa e menu+busca abertos | 390 |
| M11 | PASS | 4 tipos, sem tabela de fornecedores, 3 votações, "Ver as 126 votações" | idem |
| C01 | FAIL | menu: Parlamentares, Metodologia, Sobre. Falta "Gastos públicos" (I6 na rubrica atual; fora de I1–I5) | Parlamentares, Gastos públicos, Metodologia, Sobre |
| C02 | PASS | "Parlamentares / Câmara dos Deputados / Maria Rosas", dois primeiros são links | idem |
| C03 | PASS | "Deputada federal por São Paulo (SP) · Republicanos (REPUBLICANOS)" | formato idem |
| C04 | PASS | "Nome civil, cargo, UF e partido conforme a Câmara dos Deputados." | idem |
| C05 | PASS | "Acompanhar atualizações" | idem |
| C06 | PASS | "Contestar um dado" | idem |
| C07 | PASS | "Cota parlamentar usada em 2026", "R$ 396.170", barra 74%, "74% do teto acumulado até nov (R$ 536.002)" | formato idem |
| C08 | PASS | "Presença em votações nominais", "115 de 126 em 2026 · média da Câmara 76%" | idem |
| C09 | PASS | "Votou como o partido orientou", "Divergiu em 8 de 88 votações" | idem |
| C10 | PASS | "Bens declarados ao TSE (2026)", "+14% sobre 2022, em valor nominal" | idem |
| C11 | PASS | Gastos da cota, Votações, Bens declarados, Mandato, Fontes | idem |
| C12 | PASS | 2026, 2025, 2024, 2023, Mandato todo | anos + "Mandato todo" |
| C13 | PASS | "Gasto mensal em 2026" à esquerda; "Linha tracejada: teto mensal para SP (R$ 48.727)" à direita (só em 2026: ver X05) | idem |
| C14 | PASS | "R$ 163.600 · 41%" | "R$ X · N%" |
| C15 | PASS | colunas Fornecedor, CNPJ/CPF, Total; nome como link; nota do CPF mascarado | idem |
| C16 | PASS | "… coletado em 11/11/2026 09:30" + "Ver na fonte", "Baixar CSV", "Contestar" | idem |
| C17 | PASS | "Votações nominais recentes"; "Todas", "Divergiu do partido", "Ausências" | idem |
| C18 | PASS | "PLP 186/2026" link 15 px peso 600, depois "ementa · Aprovada" | idem |
| C19 | PASS | "Partido: Sim" e "Votou: Sim" | idem |
| C20 | PASS | "Ver todas as 126" e "Contestar" (mais um "Ver na fonte" extra) | idem |
| C21 | PASS | título, texto explicativo, cartões "Eleição AAAA" com total e nota (texto da 1ª nota: ver X04) | idem |
| C22 | PASS | "Ver na DivulgaCand" e "Contestar" | idem |
| C23 | PASS | Casa, UF (São Paulo), Início, Fim previsto, Situação | idem |
| C24 | PASS | "Comissões como titular" em `ul` | idem |
| C25 | PASS | "Linha do tempo" com marcos 2026, 2023, 2022, 2018 | idem |
| C26 | PASS | "De onde vêm os dados" na lateral, fontes e "Só usamos dados que os órgãos já publicam…" | idem |
| C27 | FAIL | "…podem pedir correção. Registramos cada pedido e toda alteração." + "Pedir correção" + "Pedidos de correção deste perfil (0)": sem "Respondemos em até 5 dias úteis" e sem "Histórico de correções" (I7 na rubrica atual; fora de I1–I5) | texto com prazo, botão e "Histórico de correções deste perfil (N)" |
| C28 | PASS | Controlador · CNPJ; Encarregado (LGPD); aviso de alertas; Metodologia · Política de privacidade · Licenças dos dados | idem |
| C29 | PASS | "Em exercício · 2023–2027"; "Deputada federal · SP · REPUBLICANOS" | idem |
| C30 | PASS | "Cota em 2026", "Presença", "Seguiu o partido", "Bens (TSE 2026)" | idem |
| C31 | PASS | "Gastos da cota (CEAP) · 2026", "Votações recentes", "Bens declarados ao TSE"; abas Gastos, Votações, Bens, Mandato, Fontes | idem |
| C32 | PASS | "Ver todas as notas e fornecedores", "Ver as 126 votações" | idem |
| B01 | PASS | desktop: "Tabata" + Enter → `/parlamentares?q=Tabata`, 1 resultado; celular: "SP" → `/parlamentares?q=SP` | lista filtrada |
| B02 | PASS | 5 abas, desktop e celular: clique leva a `#gastos`, `#votacoes`, `#bens`, `#mandato`, `#fontes`, seção no topo (top 16–254 px) | idem |
| B03 | PASS | rolagem em passos de 250 px: desktop Gastos → Votações (1250) → Bens (2000); celular Gastos → Votações → Bens → Mandato (2000) → Fontes (2750) | acompanha |
| B04 | PASS | 2025, 2024, 2023, Mandato todo: URL `?ano=…`, gráfico, meses, tipos e link do CSV mudam (efeito colateral: X05, X06) | troca os gastos |
| B05 | PASS | "Divergiu do partido": 5 itens todos "divergiu da orientação" (selo laranja); "Ausências": 5 ausências; "Todas": lista padrão | filtra |
| B06 | PASS | "Contestar um dado" → `/contestar` (seção "outro"); "Contestar" de gastos/votações/bens → `?secao=…` com o `select` já na seção; idem no celular | abre com a seção |
| B07 | PASS | "Pedir correção" → `/contestar`, formulário presente | abre o formulário |
| B08 | PASS | "Ver na fonte" → `https://www.camara.leg.br/cotas/Ano-2026.csv.zip` (200, `target=_blank`); votações e mandato também 200 | abre o original |
| B09 | PASS | "Buscar" → `aria-expanded=true`, campo visível; "Menu" → `aria-expanded=true`, Parlamentares/Metodologia/Sobre visíveis | abre |
| B10 | PASS | → `/parlamentares/204540/acompanhar` com feed público | tem efeito |
| B11 | PASS | "PLP 186/2026" → `https://dadosabertos.camara.leg.br/api/v2/votacoes/2635476-36` (200, JSON, `_blank`) | abre na fonte |
| B12 | PASS | download `ceap-204540-2025.csv` (518 linhas, todas `ano=2025`) e `ceap-204540-2026.csv` (411 linhas) | baixa o ano |
| X01 | FAIL | topo e rodapé desktop com contêiner 24 px mais estreito: logo x=144 (protótipo 120), busca termina em x=1296 (1320), texto do rodapé começa em x=144 (120). No protótipo o contêiner é 1200 + padding (content-box, 1248 px); na implementação, 1200 px no total | Main.dc.html l. 37 (topo: `max-width:1200px; padding:14px 24px`, content-box) e l. 1016 (rodapé) |
| X02 | FAIL | `line-height` global 1.5 (Tailwind) em vez de `normal` do protótipo: h2 22 px com 34 px de altura (28), h2 18 px com 28 px (23), aba 47 px (45), rótulo do indicador celular 16 (15), bloco de indicador celular 93 px (87). Todo o ritmo vertical fica mais alto que a tolerância de ±2 px | Main.dc.html l. 18-31 e Mobile.dc.html raiz: nenhum `line-height` definido (fica `normal`) |
| X03 | FAIL | celular: rodapé de fonte é a versão longa do desktop ("Fonte: Câmara dos Deputados, Dados Abertos (CEAP) · coletado em …", 2 linhas) e uma linha extra de links "Ver na fonte · Baixar CSV · Contestar" / "Ver na fonte · Ver todas as 126 · Contestar" / "Ver na DivulgaCand · Contestar"; borda `#E2E2DC`, padding 16 px | Mobile.dc.html l. 411, 451, 484: "Fonte: Câmara, CEAP · coletado em … · ver original" numa linha, 11 px, borda `#ECECE6`, padding-top 10 px, sem links na votação e nos bens |
| X04 | FAIL | nota do primeiro cartão de bens: "candidatura a deputado federal" (substantivo e cargo no masculino para uma deputada; código `secoes.tsx:532` não passa por `feminino()`) | Main.dc.html l. 1066: "candidata a deputada estadual" |
| X05 | FAIL | `?ano=2025`, `2024`, `2023`: sem linha tracejada do teto e sem "Linha tracejada: teto mensal…"; indicador 1 vira "518 documentos · sem teto conferido para 2025" (sem barra nem %). Teto só cadastrado para 2026 (`data/teto-ceap.ts`) | Main.dc.html l. 493 (rubrica Main:104-126): teto e legenda para o ano filtrado |
| X06 | FAIL | o filtro de ano dos gastos também filtra votações e indicadores: em `?ano=2025` e `?ano=2024` a seção de votações mostra "Nenhuma votação neste filtro." e os indicadores 2 e 3 viram "— · 0 de 0 em 2025" e "— · Sem votações com orientação comparável" (celular: 0 itens em `#votacoes`) | Main:101-108 da rubrica: o filtro fica dentro da seção de gastos e só troca os gastos |

## Placar (principal, só I1–I5 intencionais)

- PASS: 91
- FAIL: 8 (C01, C27, X01–X06)
- INTENCIONAL: 5 (I1–I5, à parte; nenhum item pontuado foi retirado do denominador)
- **Paridade = 91 ÷ (91 + 8) = 91,9%** (meta ≥ 95%: não atingida)

Placar alternativo, se I6 e I7 (acrescentados à rubrica durante esta verificação) valerem: C01 e C27 viram
INTENCIONAL; PASS 91, FAIL 6, INTENCIONAL 7, **Paridade = 91 ÷ 97 = 93,8%** (também abaixo da meta).

## Intencionais (fora do denominador)

| ID  | Situação observada |
| --- | ------------------ |
| I1  | Dados reais (Maria Rosas, Republicanos, R$ 396.170 etc.); sem a faixa "dados fictícios" |
| I2  | Sem o alerta "Padrão atípico para verificação" nos dois tamanhos |
| I3  | Placeholder "Buscar deputado por nome ou UF" |
| I4  | Sem "Eleita em 2022 com N votos (TSE)" na linha de procedência |
| I5  | Borda do campo de busca `#80858E` |
| (I6) | Na rubrica atual, não nesta instrução: menu sem "Gastos públicos" (C01) |
| (I7) | Na rubrica atual, não nesta instrução: "Encontrou um erro?" sem prazo e sem histórico (C27) |

## Observações sem pontuação

- Conteúdo a mais em relação ao protótipo (não pontuado): nota "A presença conta todas as votações nominais…",
  "Ver na fonte" extra no rodapé de votações, "Ver todas as coletas" e "Metodologia v1.3" na lateral, frase
  "O nome do fornecedor baixa as notas dele." na tabela de fornecedores, seções Mandato e Fontes no celular
  (necessárias para B02, já que o protótipo celular tem as abas mas não as seções).
- Celular: o texto de "Encontrou um erro?" é o do desktop ("Parlamentares, assessorias e qualquer pessoa podem…")
  em vez de "Qualquer pessoa pode pedir correção." (Mobile.dc.html l. 503); não virou item para não duplicar C27/I7.
- "Pedir correção" com padding 0 18 px (131 → 135 px de largura) contra 0 16 px no protótipo (Main.dc.html l. 1005).
- Nome do fornecedor leva a um CSV filtrado pelo CNPJ (`gastos.csv?doc=…`), não a uma página; o protótipo usa `#`.
- "Votou: Não (divergiu da orientação)": o sufixo fica só para leitor de tela; visualmente o selo diz "Votou: Não".
