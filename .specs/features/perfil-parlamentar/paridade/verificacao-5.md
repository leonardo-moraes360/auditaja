# Verificação 5 de paridade com o protótipo

- Data: 11/11/2026
- URL: http://localhost:3020/parlamentares/204540 (dev server já em execução)
- Viewports: desktop 1440×900; celular 390×844 (`isMobile`, `hasTouch`, DPR 1). Chromium 1228 via Playwright.
- Protótipo: artifact `bd51453d-4873-432a-bc0d-eb0d462328ad`, versão `1794398523-e007` (`prototipo/Main.dc.html`,
  `prototipo/Mobile.dc.html`; medições em `proto-desktop.html` e `proto-mobile.html` por file://)
- Worktree: `git rev-parse --short HEAD` = `51fff11`; `git status --short | wc -l` = `38`
- Verificador independente; os relatórios das verificações 1 a 4 não foram lidos.
- Método: `getComputedStyle` e `getBoundingClientRect` nos dois lados (mesmos seletores semânticos), screenshots de página
  inteira comparados seção a seção, e ações reais (clique, toque, rolagem com roda do mouse, navegação, download). Scripts e
  imagens ficam em `/tmp/claude-1000/-home-leonardo-workspace-pessoal-auditaja/538dc8c5-62f8-4de1-ac53-a6fe2214758f/scratchpad/verif5/`.
- Deslocamento vertical fixo: o protótipo tem a faixa "dados fictícios" (32 px no desktop, 27 px no celular, I1). Descontada
  essa faixa, o celular coincide ao pixel até as abas (indicadores em y=183, abas em y=444 nos dois).

## Resultados

| ID  | Resultado | Evidência medida (implementação) | Esperado (protótipo) |
| --- | --- | --- | --- |
| V01 | PASS | `body` bg `#F6F6F3` (D e M) | `#F6F6F3` (Main:18) |
| V02 | PASS | `body` color `#15181E`; h1, h2 `#15181E` | `#15181E` |
| V03 | PASS | links das fontes e notas `#1F4FD1`; aba e filtro ativos `#1F4FD1` | `#1F4FD1` (Main:15) |
| V04 | PASS | família `Inter, "Inter Fallback", system-ui`; `document.fonts.check('16px Inter')` = true, face carregada | Inter |
| V05 | PASS | h1, todos os h2 e os 4 valores dos indicadores em `"Space Grotesk"` (face carregada) | Space Grotesk (Main:53, 66) |
| V06 | PASS | rótulos dos indicadores, trilha, datas e notas `#555B66` | `#555B66` |
| V07 | PASS | gastos, votações, bens, mandato e fontes: bg `#FFFFFF`, borda `1px solid #E2E2DC`, raio 16 px (D) e 14 px (M) | idem (Main:100, Mobile:64) |
| V08 | PASS | rodapé D: bg `#15181E`, texto `#D5D7DC`, links `#A9BEF5` (Metodologia, Política de privacidade, Licenças dos dados) | idem (Main:279-282) |
| V09 | PASS | h1 36 px (D), 24 px (M), peso 700, line-height 39,6 px no D | 36 / 24 px |
| V10 | PASS | h2 seção 22 px (D: gastos, votações, bens); lateral 18 px (Mandato, De onde vêm os dados, Encontrou um erro?); celular 18 px | 22 / 18 / 18 px |
| V11 | PASS | "Acompanhar atualizações": bg `#1F4FD1`, texto `#FFFFFF`, 212×44, raio 10 px, padding 0 18 px, 14 px/600 | idem (Main:58), 212×44 |
| V12 | PASS | "Contestar um dado": borda `1px #C9CAC2`, bg `#FFFFFF`, 167×44, raio 10 px | idem (Main:59), 167×44 |
| V13 | PASS | anos e votações: altura 36 px; ativo borda `#1F4FD1`, bg `#E8EEFC`, texto `#1F4FD1`, 600; inativo borda `#C9CAC2`, texto `#3D424B`; raio 8 px (anos) e pílula (votações) | idem (Main:104-106, 173-175) |
| V14 | PASS | 10 barras `#1F4FD1` (raio 4 px D, 3 px M); linha `border-top: 2px dashed #B4440E` | idem (Main:122, 126) |
| V15 | PASS | barras por tipo `#6E8FE8` sobre trilho `#F0F0EC`, 8 px, raio 4 px (D e M) | idem (Main:143) |
| V16 | PASS | igual: `#E8EEFC`/`#163A9C`; filtro "Divergiu": `#FDF0E7`/`#7A2E09` (Sim×Não e Não×Sim); "sem registro": `#F0F0EC`/`#3D424B` | idem (Main:304) |
| V17 | PASS | caixa "Encontrou um erro?": bg `#E8EEFC`, borda 0, raio 16 px (D) e 14 px (M) | idem (Main:269) |
| V18 | PASS | blocos bg `#F6F6F3`, borda 0, raio 12 px e padding 16 px (D, 265×138), raio 10 px e padding 12 px (M, 175×87, igual a Mobile:43); valores 26 px (D) e 20 px (M) | idem |
| V19 | PASS | busca: 360×44, raio 10 px, bg `#FAFAF8`, padding 0 14 px, 14 px | idem (Main:36) |
| V20 | PASS | "Em exercício": bg `#E6F4EA`, texto `#1E5B32`, 12 px/600, padding 4 10, raio pílula, 94×23 | idem (Main:50), 94×23 |
| L01 | PASS | logo x=120; menu x=274; busca x=960–1320 (360 px), alinhada à direita da coluna | idem (logo 120, busca 960–1320) |
| L02 | PASS | "Parlamentares" com `border-bottom: 2px solid #1F4FD1`, 15 px/500 | idem (Main:29) |
| L03 | PASS | trilha, cabeçalho e abas em x=144, largura 1152 (coluna 1200 com 24 px de cada lado, centralizada em 1440) | idem |
| L04 | PASS | trilha em y=93, 20 px abaixo do topo e 16 px acima do cartão | idem (y=125 com a faixa) |
| L05 | PASS | um cartão (144, 1152×356) com foto, identificação, ações à direita (x=1055–1267) e a grade de indicadores embaixo | idem (Main:45-86) |
| L06 | PASS | `<img>` 112×136, raio 12 px, x=173 | 112×136, raio 12 px |
| L07 | PASS | duas pílulas separadas na mesma linha (x=309 e 411, y=154), acima do h1 (y=187) | idem |
| L08 | PASS | 4 blocos de 265 px na mesma linha (y=314; x=173, 450, 726, 1003) | idem (x iguais) |
| L09 | PASS | abas entre cabeçalho e conteúdo (y=501, margem 20 px, borda inferior `#E2E2DC`); ativa com sublinhado 2 px `#1F4FD1` e texto `#1F4FD1`/600 | idem (Main:88-94) |
| L10 | PASS | coluna principal x=144, 832 px; lateral x=996, 300 px; gap 20 px | idem (832 e 300) |
| L11 | PASS | h2 em y=593 e filtro em y=592 na mesma linha, filtro terminando em x=950 (à direita) | idem |
| L12 | PASS | rótulo "32,0k" etc. acima de cada barra (11 px), meses abaixo (12 px) | idem (Main:124-133) |
| L13 | PASS | "Por tipo de despesa" x=169 (359 px) e "Maiores fornecedores" x=552 (399 px), mesma y | idem (mesmos x e larguras) |
| L14 | PASS | nas três seções: flex `space-between`, borda superior `1px #ECECE6`, padding-top 12 px, 12 px; links à direita | idem (Main:163-166) |
| L15 | PASS | data x=169 (84 px), proposição/ementa x=273 (483 px), "Partido"/"Votou" à direita (até x=951) | idem (mesmos x) |
| L16 | PASS | 3 cartões em grade (223 px cada), legenda (quadrados 12×12 `#B9C8F3` e `#1F4FD1`), barras pareadas 10 px, nome 190 px, valores 150 px à direita | idem (Main:202-226) |
| L17 | PASS | lateral: Mandato (y=567), De onde vêm os dados (y=1361), Encontrou um erro? (y=1883) | mesma ordem |
| L18 | PASS | rodapé com duas colunas de 576 px (x=120 e x=744) | idem |
| M01 | PASS | cabeçalho 61 px; logo x=16; botões "Buscar" (282) e "Menu" (330), 44×44; campo e menu ocultos antes do toque | idem (Mobile:22-31) |
| M02 | PASS | foto 72×88 (raio 10) em x=16, nome em x=102 na mesma faixa | idem |
| M03 | PASS | 2×2: (16,183), (199,183), (16,278), (199,278), 175×87 cada | idem, mesmas coordenadas |
| M04 | PASS | "Acompanhar" 174×44 e "Contestar dado" 176×44 lado a lado (y=379) | 174 e 176 (Mobile:49-50) |
| M05 | PASS | abas em uma linha (todas em y=444), `overflow-x: auto`, `nowrap`, bg branco, padding 0 8 px | idem (Mobile:54) |
| M06 | PASS | cabeçalho do perfil e abas com largura 390, sem raio; seções x=16, 358 px | idem |
| M07 | PASS | sem rótulos de valor; iniciais "J F M A M J J A S O" (11 px) | idem (Mobile:76-84) |
| M08 | PASS | proposição (x=33) e data "14/10" (x=328) na mesma y; ementa abaixo; depois "Votou" e "Partido" | idem (Mobile:102-106) |
| M09 | PASS | "Eleição AAAA" e total em negrito; uma barra de 10 px por eleição, trilho `#F0F0EC` | idem (Mobile:116-120) |
| M10 | PASS | `scrollWidth` = 390 | 390 |
| M11 | PASS | 4 tipos, nenhuma tabela de fornecedores, 3 votações, link "Ver as 126 votações" | idem (Mobile:86-110) |
| C01 | INTENCIONAL (I6) | menu: Parlamentares, Metodologia, Sobre | + "Gastos públicos" |
| C02 | PASS | "Parlamentares / Câmara dos Deputados / Maria Rosas", os dois primeiros são links (`/parlamentares`) | idem |
| C03 | PASS | "Deputada federal por São Paulo (SP) · Republicanos (REPUBLICANOS)" | mesmo formato |
| C04 | PASS | "Nome civil, cargo, UF e partido conforme a Câmara dos Deputados." | idem (frase do TSE fora por I4) |
| C05 | PASS | "Acompanhar atualizações" | idem |
| C06 | PASS | "Contestar um dado" | idem |
| C07 | PASS | "Cota parlamentar usada em 2026", "R$ 396.170", barra 74 %, "74% do teto acumulado até nov (R$ 536.002)" (ver X01) | mesmo formato |
| C08 | PASS | "Presença em votações nominais", "91%", "115 de 126 em 2026 · média da Câmara 76%" | idem |
| C09 | PASS | "Votou como o partido orientou", "91%", "Divergiu em 8 de 88 votações" | idem |
| C10 | PASS | "Bens declarados ao TSE (2026)", "R$ 3.812", "+14% sobre 2022, em valor nominal" | idem |
| C11 | PASS | Gastos da cota, Votações, Bens declarados, Mandato, Fontes | idem |
| C12 | PASS | 2026, 2025, 2024, 2023, Mandato todo | anos + "Mandato todo" |
| C13 | PASS | "Gasto mensal em 2026" à esquerda (x=169) e "Linha tracejada: teto mensal para SP (R$ 48.727)" à direita (termina em 951) | idem |
| C14 | PASS | 7 linhas "Nome … R$ X · N%" (ex.: "R$ 163.600 · 41%") | idem |
| C15 | PASS | tabela Fornecedor, CNPJ/CPF, Total (alinhado à direita); nome é link; nota "CPF de pessoa física aparece mascarado, como no Portal da Transparência." | idem |
| C16 | PASS | "Fonte: Câmara dos Deputados, Dados Abertos (CEAP) · coletado em 11/11/2026 09:30"; "Ver na fonte", "Baixar CSV", "Contestar" | idem |
| C17 | PASS | "Votações nominais recentes"; "Todas", "Divergiu do partido", "Ausências" | idem |
| C18 | PASS | "PLP 186/2026" link 15 px/600 `#15181E`; abaixo "ementa · Aprovada" 13 px `#555B66` | idem |
| C19 | PASS | "Partido: Sim" e "Votou: Sim" | idem |
| C20 | PASS | links "Ver todas as 126" e "Contestar" (mais "Ver na fonte") | "Ver todas as N", "Contestar" |
| C21 | PASS | "Bens declarados à Justiça Eleitoral", parágrafo explicativo idêntico, cartões "Eleição 2018/2022/2026" com total e nota ("+14% sobre 2022") | idem |
| C22 | PASS | "Ver na DivulgaCand", "Contestar" | idem |
| C23 | PASS | Casa, UF (São Paulo), Início, Fim previsto, Situação | idem |
| C24 | PASS | "Comissões como titular" em `<ul>` (7 itens) | idem |
| C25 | PASS | "Linha do tempo" em lista com marcadores de 10 px | idem |
| C26 | PASS | "De onde vêm os dados" na lateral, 5 fontes com link e detalhe, frase "Só usamos dados que os órgãos já publicam. Cada registro guarda link e data de coleta." | idem |
| C27 | INTENCIONAL (I7) | texto "…podem pedir correção. Registramos cada pedido e toda alteração.", botão "Pedir correção", "Pedidos de correção recebidos para este perfil: 0" | prazo de 5 dias e link "Histórico de correções" |
| C28 | PASS | "Controlador: [NOME DO CONTROLADOR] · CNPJ [CNPJ]", "Encarregado (LGPD): …", "Alertas são indícios estatísticos para verificação, não acusações.", Metodologia · Política de privacidade · Licenças dos dados | idem |
| C29 | PASS | selo "Em exercício · 2023–2027" (11 px, 153×20); "Deputada federal · SP · REPUBLICANOS" | idem (153×20) |
| C30 | PASS | "Cota em 2026", "Presença", "Seguiu o partido", "Bens (TSE 2026)" | idem |
| C31 | PASS | "Gastos da cota (CEAP) · 2026", "Votações recentes", "Bens declarados ao TSE"; abas Gastos, Votações, Bens, Mandato, Fontes | idem |
| C32 | PASS | "Ver todas as notas e fornecedores" e "Ver as 126 votações" | idem |
| B01 | PASS | D: digitar "Rosas" + Enter → `/parlamentares?q=Rosas`, 1 resultado (Maria Rosas); "SP" → 60+ resultados. M: tocar "Buscar", digitar, Enter → `/parlamentares?q=Rosas` | lista filtrada |
| B02 | PASS | clique em cada aba (D e M) → hash `#gastos`…`#fontes` e seção no topo (top=16 px; bens/fontes limitados pelo fim da página) | leva à seção |
| B03 | PASS | rolagem com roda: D alterna Gastos → Votações → Bens (Mandato e Fontes ficam lado a lado com Gastos e Votações e ativam ao clicar, e continuam ativas após rolar 100 px); M alterna Gastos → Votações → Bens → Mandato → Fontes | acompanha a seção visível |
| B04 | PASS | 2025, 2024, 2023 e Mandato todo trocam gráfico (12 meses; mandato com 4 anos), tipos, fornecedores e indicador 1 (R$ 484.643 em 2025; R$ 1.821.900 no mandato); filtro ativo acompanha; sem linha do teto fora de 2026 (I8). M via `?ano=` muda título para "· 2025" e "· mandato" | troca os dados |
| B05 | PASS | "Divergiu do partido": 5 linhas, todas com voto oposto à orientação e selo `#FDF0E7`; "Ausências": 5 linhas "sem registro" (rodapé "Ver todas as 11"); "Todas" volta; "Ver todas as 126" lista as 126 | filtra a lista |
| B06 | PASS | "Contestar um dado" → `/contestar` (seção "Outro"); "Contestar" de gastos, votações e bens → `?secao=gastos/votacoes/bens` com o `<select name=secao>` já nessa seção | formulário com a seção |
| B07 | PASS | "Pedir correção" (D e M) → `/parlamentares/204540/contestar` com o formulário | abre o formulário |
| B08 | PASS | "Ver na fonte" → `https://www.camara.leg.br/cotas/Ano-2026.csv.zip` (CEAP), CSV de votos da Câmara, `api/v2/deputados/204540`; `target=_blank rel=noopener noreferrer` | abre o original |
| B09 | PASS | "Buscar": `aria-expanded=true`, campo 358×44 em y=73 com foco; "Menu": `aria-expanded=true`, links Parlamentares, Metodologia, Sobre; toque em Metodologia → `/metodologia` | abre busca e menu |
| B10 | PASS | → `/parlamentares/204540/acompanhar` com instruções e o endereço do feed; `feed.xml` responde 200 `application/atom+xml` | tem efeito |
| B11 | PASS | "PLP 186/2026" → `https://dadosabertos.camara.leg.br/api/v2/votacoes/2635476-36`, nova aba | votação na fonte |
| B12 | PASS | download `ceap-204540-2026.csv` (411 notas, coluna `ano`=2026, meses 1–10); em `?ano=2025`, `ceap-204540-2025.csv` (518 notas de competência 2025, igual ao indicador "518 documentos") | CSV do ano |
| X01 | FAIL | indicador 1 diz "74% do teto acumulado até nov (R$ 536.002)", mas o gráfico e o CSV da deputada só vão até outubro (nenhuma nota em nov/2026). O mês vem do último mês publicado na base inteira (`data/perfil.ts`, `max(mes)` sem filtro de parlamentar), não da série exibida | Main:68 e Main:120-133: "até out" é o último mês do gráfico ao lado (teto R$ 428.373 = 10 × 42.837) |
| X02 | FAIL | caixa do gráfico mensal (D) com 200 px no total (`box-sizing: border-box`, `height: 200px`, `padding-top: 10px`): sobram 189 px para as barras | Main:121: `height: 200px` + `padding-top: 10px` + borda 1 px em content-box = 211 px no total, com 200 px para as barras |
| X03 | FAIL | marca "Auditaja" com `letter-spacing` −0,025em: −0,55 px no D e −0,475 px no M, onde fica 73 px de largura | Main:26 −0,02em (−0,44 px, 85 px); Mobile:25 sem letter-spacing (`normal`, 77 px) |

## Placar

- PASS: 91
- FAIL: 3 (X01, X02, X03)
- INTENCIONAL: 2 (C01 por I6, C27 por I7)
- **Paridade = 91 ÷ (91 + 3) = 96,8%** (meta ≥ 95%)

## Intencionais (fora do denominador)

| Item | Divergência intencional | Evidência |
| --- | --- | --- |
| C01 | I6: sem "Gastos públicos" no menu | menu com 3 itens (D) e no menu do celular |
| C27 | I7: sem o prazo de 5 dias e sem "Histórico de correções"; mostra a contagem | "Pedidos de correção recebidos para este perfil: 0" (D); no celular, só o texto curto e o botão |

Divergências intencionais que não estão ligadas a um item da rubrica, conferidas e registradas:

- I1: faixa "dados fictícios" ausente; nomes e valores reais (Maria Rosas, REPUBLICANOS, fornecedores em caixa alta, bens
  de R$ 916 a R$ 3.812, por isso "R$ 3.812" e "R$ 2.858 → R$ 3.812" no lugar de "mi" e "mil").
- I2: sem o alerta "Padrão atípico" (D e M).
- I3: placeholder "Buscar deputado por nome ou UF".
- I4: sem "Eleita em 2022 com N votos (TSE)".
- I5: borda da busca `#80858E`.
- I8: em 2025, 2024, 2023 e mandato não há linha do teto, legenda nem barra de %; o indicador 1 mostra "N documentos · sem
  teto conferido para AAAA".

## Observações (não pontuadas)

- Acréscimos de conteúdo que não contradizem o protótipo: link "Ver na fonte" e nota "A presença conta todas as votações
  nominais do Plenário no ano…" em Votações (D e M); "Ver todas as coletas" em Fontes; "Ver na fonte" na fonte do Mandato;
  "ver original" nas fontes de votações e bens no celular; "Política de privacidade" no rodapé do celular; seções Mandato e
  Fontes no celular (necessárias para B02, embora o artboard Mobile não as desenhe).
- Os filtros (ano e votações) são links, não botões, e navegam com `#gastos` ou `#votacoes`, então a página rola até a
  seção. O protótipo não define isso.
- No desktop, por rolagem, as abas Mandato e Fontes nunca ficam ativas porque essas seções dividem a tela com Gastos e
  Votações. Contei B03 como PASS porque a aba ativa sempre corresponde a uma seção visível.

## Adendo: mudanças depois desta medição

Feitas para o gate de testes passar, sem efeito nos itens pontuados acima:

- Rodapé do celular: a linha passa a trazer também o **nome** do encarregado, além do e-mail ("Controlador: … · Encarregado (LGPD): nome · e-mail"). O protótipo (Mobile:132) mostra só o e-mail, mas a LGPD (art. 41, § 1º) pede identidade e contato do encarregado publicados. Registrado como I9 na rubrica.
- `responsavel().doc` já traz o rótulo "CNPJ", para o rodapé e a política de privacidade mostrarem o mesmo texto.
- Testes e2e ajustados aos textos e ao layout do celular do protótipo.

Os três FAIL desta medição (X01 mês do teto acumulado, X02 altura útil do gráfico, X03 espaçamento do logo) ficam como pendências conhecidas.
