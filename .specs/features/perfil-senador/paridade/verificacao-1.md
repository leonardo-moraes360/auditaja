# Verificação 1 de paridade do perfil do senador

- Data: 11/11/2026
- Servidor: http://127.0.0.1:3243 (produção do worktree `feat/senadores`, banco `auditaja_senado_dev` com a coleta real)
- Worktree: `git rev-parse --short HEAD` = `187abaf`; `git status --short` com 1 linha (`?? .specs/features/perfil-senador/paridade/`)
- Páginas: `/parlamentares/10005672` (Alan Rick, titular), `/parlamentares/10006358` (Ana Paula Lobato, 1ª suplente em
  exercício), `/parlamentares/10000022` (Esperidião Amin, só para o selo "contra" de V16), `/parlamentares?casa=senado`,
  `/parlamentares`, `/parlamentares?casa=xyz`.
- Viewports: 1440×900 e 390×844 (`isMobile`, `hasTouch`). Chromium 1228 via Playwright.
- Protótipo: `prototipo/Senador.dc.html`, `prototipo/SenadorMobile.dc.html`, `prototipo/ListaParlamentares.dc.html`,
  renderizados por file:// depois de expandir os `sc-for` com o `renderVals()` de cada artboard (sem a rede, então as
  fontes do protótipo caem no fallback; as famílias foram comparadas pela declaração, não pela face carregada).
- Método: `getComputedStyle` e `getBoundingClientRect` com os mesmos seletores semânticos nos dois lados; texto visível
  (`innerText`); ações reais (clique, toque, rolagem com roda, download). Nenhum formulário foi enviado.
- Scripts, JSONs e capturas: `/tmp/claude-1000/-home-leonardo-workspace-pessoal-auditaja/774d31fe-0b00-44bd-b576-a405d3cd5888/scratchpad/paridade/`
  (`render.js`, `medir.js`, `q1.js`…`q5.js`, `comp.js`, `mob.js`, `proto-*.json`/`p*-*.json` × `real-*.json`/`r*-*.json`).
- Deslocamento vertical fixo: a faixa "dados fictícios" do protótipo (32 px no D, 27 px no M, I1). Descontada a faixa, o
  cabeçalho, a trilha, os selos, o h1, os indicadores e as abas coincidem ao pixel (ex.: h1 x=309 nos dois; indicadores
  x=173/450/726/1003; abas x=144…646).

## Resultados

| ID | Resultado | Evidência medida (implementação) | Esperado (protótipo) |
| --- | --- | --- | --- |
| V01 | PASS | `body` bg `#F6F6F3` (D e M) | `#F6F6F3` |
| V02 | PASS | `body` color `#15181E`; h1/h2 `#15181E` | `#15181E` |
| V03 | PASS | links das fontes `#1F4FD1`; aba e filtros ativos `#1F4FD1` | `#1F4FD1` |
| V04 | PASS | `Inter, "Inter Fallback", system-ui, sans-serif` | Inter |
| V05 | PASS | h1, h2 e os 4 valores dos indicadores em `"Space Grotesk", …` (D e M) | Space Grotesk |
| V06 | PASS | rótulos dos indicadores, trilha, datas e notas `#555B66` | `#555B66` |
| V07 | PASS | gastos, votações, bens, mandato, fontes: `#FFFFFF`, `1px #E2E2DC`, raio 16 (D) e 14 (M) | idem |
| V08 | PASS | rodapé `#15181E`, texto `#D5D7DC`, 3 links `#A9BEF5` | idem |
| V09 | PASS | h1 36 px (D), 24 px (M) | 36 / 24 |
| V10 | PASS | h2 22 px (gastos, votações, bens), 18 px (lateral e M), "Encontrou um erro?" 17 px no M | idem |
| V11 | PASS | "Acompanhar atualizações" `#1F4FD1`/branco, 212×44, raio 10 | idem, 212×44 |
| V12 | **FAIL** | "Contestar um dado" (D) e "Contestar dado" (M): borda `#C9CAC2` | borda `#80858E` (Senador:59, SenadorMobile:50) |
| V13 | **FAIL** | altura 36 px e ativo corretos; inativos ("Divergiu da liderança", "Ausências") com borda `#C9CAC2` | inativo com borda `#80858E` (Senador:104-106, 169-170) |
| V14 | **FAIL** | barras `#1F4FD1` corretas; linha de base do gráfico `1px #C9CAC2` (D e M) | `border-bottom: 1px solid #80858E` (Senador:117, SenadorMobile:67) |
| V15 | PASS | `#6E8FE8` sobre `#F0F0EC`, 8 px, raio 4 | idem |
| V16 | PASS | igual `#E8EEFC`/`#163A9C` ("Votou: Sim" com Liderança Sim; "Votou: Não" com Liderança Não); contra `#FDF0E7`/`#7A2E09` (Esperidião Amin, PLP 18/2021, PP Não × Sim); "Presente, não registrou voto" e "Sem registro" `#F0F0EC`/`#3D424B` | idem |
| V17 | PASS | `#E8EEFC`, borda 0, raio 16 (D) e 14 (M) | idem |
| V18 | PASS | D 265×124, `#F6F6F3`, raio 12, padding 16, valor 26 px; M 175×87, raio 10, padding 12, valor 20 px | idem, mesmas medidas |
| V19 | PASS | 360×44, raio 10, `#FAFAF8`, borda `#80858E`, padding 14 | idem |
| V20 | PASS | "Em exercício" `#E6F4EA`/`#1E5B32`, 12 px/600, 94×23; M "Em exercício · 2023–2031" 11 px, 152×20 | idem, 94×23 e 152×20 |
| V21 | PASS | "Mandato 2023–2031 · 57ª e 58ª legislaturas" 272×23 e "Titular" 57×23, `#F0F0EC`/`#3D424B`, 12 px/600 | idem, mesmas larguras |
| V22 | PASS | D: `#F0F0EC`, raio 12, padding 14/18, ícone, 14 px `#3D424B` (782×70); M: raio 10, padding 12, 13 px, ícone oculto (`hidden sm:block`) | idem |
| V23 | **FAIL** | `letter-spacing` −0,55 px no D (84 px de largura) e −0,475 px no M (73 px) | −0,02em = −0,44 px (85 px) no D; `normal` (77 px) no M (Senador:26, SenadorMobile:25) |
| V24 | PASS | cartão "Eleição 2022": borda `#E2E2DC`, raio 12, padding 14, total 22 px Space Grotesk | idem |
| L01 | PASS | logo x=120, menu x=274, busca x=960–1320 | idem (120, 275, 960) |
| L02 | PASS | "Parlamentares" com `border-bottom: 2px #1F4FD1` | idem |
| L03 | PASS | trilha, cabeçalho e abas x=144, 1152 px | idem |
| L04 | PASS | trilha y=93, 16 px acima do cartão | y=125 com a faixa |
| L05 | PASS | cartão 1152×342 (protótipo 353, diferença = linha dos votos do TSE fora por I4), ações x=1055–1267 | idem |
| L06 | PASS | `<img>` 112×136, raio 12, x=173 | idem |
| L07 | PASS | 3 pílulas na mesma linha (x=309, 411, 691) acima do h1 | idem (mesmos x) |
| L08 | PASS | 4 blocos de 265 px na mesma y | idem |
| L09 | PASS | abas x=144…646, ativa 2 px `#1F4FD1`, texto 600 | idem |
| L10 | PASS | principal x=144, 832 px; lateral x=996, 300 px | idem |
| L11 | PASS | h2 y=579 e filtro y=578, filtro termina em x=951 | idem |
| L12 | PASS | aviso logo abaixo do título, antes da legenda do gráfico | idem |
| L13 | PASS | "Gasto mensal em 2026" à esquerda e "Valor reembolsado pelo Senado" à direita (flex `space-between`, 782 px) | idem |
| L14 | **FAIL** | caixa do gráfico (D) com 200 px no total (`box-sizing: border-box`, `padding-top: 10px`): sobram 189 px para as barras. Valores acima (11 px) e meses abaixo (12 px) corretos | `height: 200px` + padding 10 + borda 1 em content-box = 211 px, 200 px úteis (Senador:117) |
| L15 | PASS | "Por tipo de despesa" x=169 (359 px) e "Maiores fornecedores" x=552 (399 px) | idem |
| L16 | PASS | gastos, votações e bens: flex `space-between`, `1px #ECECE6`, padding-top 12, 12 px `#555B66` | idem |
| L17 | PASS | data x=169 (84 px), proposição x=273, orientação e voto à direita (até x=951). Na 1ª linha do Alan Rick o par "Liderança do REPUBLICANOS: Sim" + "Presente, não registrou voto" (425 px) quebra para a linha de baixo, que é o mesmo `flex-wrap` do protótipo com rótulos reais mais longos | idem |
| L18 | PASS | nota da votação secreta entre título/filtros e a lista | idem |
| L19 | N/V | só há a eleição de 2022 no banco: um cartão, sem comparação nem legenda | 2 cartões + barras pareadas + legenda (Senador:198-221) |
| L20 | PASS | lateral: Mandato (y=574), De onde vêm os dados (1296), Encontrou um erro? (1745) | mesma ordem |
| L21 | PASS | `dl` em grid `80.8px 165.4px` (idêntico); suplentes flex `space-between`; nota; comissões em `ul`; marcadores 10×10 `#1F4FD1` | idem |
| L22 | PASS | rodapé em duas colunas, 1440×119 | idem (118) |
| M01 | PASS | logo x=48; "Buscar" (282) e "Menu" (330), 44×44 | idem |
| M02 | PASS | foto 72×88 raio 10 em x=16; nome x=102 | idem |
| M03 | PASS | 2×2: (16,183), (199,183), (16,278), (199,278), 175×87 | idem (com a faixa: y+27) |
| M04 | PASS | 174×44 e 176×44 lado a lado | idem |
| M05 | PASS | abas numa linha, `overflow-x: auto`, padding 0 8, bg branco | idem |
| M06 | PASS | cabeçalho e abas 390 px sem raio; cartões x=16, 358 px | idem |
| M07 | PASS | sem rótulos de valor; iniciais "J F M A M J J A S" 11 px | idem |
| M08 | PASS | "PLP 109/2025" (x=33) e "10/11" (x=330) na mesma linha; ementa abaixo; selo do voto (x=33) antes da orientação | idem |
| M09 | PASS | "Eleição 2022" + total em `strong` 13 px; barra 10 px sobre trilho `#F0F0EC` | idem |
| M10 | PASS | `scrollWidth` = 390 | 390 |
| M11 | PASS | 4 tipos, sem tabela de fornecedores, 3 votações, "Ver as 67 votações" | idem |
| M12 | **FAIL** | ordem: Gastos (y=521), Votações (1187), **Bens (1844), Mandato (2058)**, De onde vêm os dados (2687), Encontrou um erro? (3109) | Gastos, Votações, **Mandato, Bens**, Encontrou um erro? (SenadorMobile:64-132) |
| M13 | **FAIL** | no celular aparece o bloco inteiro do desktop: Casa, UF, Início, Fim previsto, Situação, Bloco, lista de suplentes, nota, 3 comissões e linha do tempo (613 px de altura) | `dl` compacto com Período "01/02/2023 a 31/01/2031", Situação, Bloco e Suplentes "Ana … (1ª) · Carlos … (2º)" (170 px) (SenadorMobile:106-113) |
| C01 | PASS | Parlamentares, Metodologia, Sobre | idem (Senador:28-32) |
| C02 | PASS | "Parlamentares / Senado Federal / Alan Rick", links `/parlamentares` e `/parlamentares?casa=senado` | idem |
| C03 | PASS | "Senador por Acre (AC) · Republicanos (REPUBLICANOS) · Bloco Parlamentar Aliança"; "Senadora por Maranhão (MA) · Partido Socialista Brasileiro (PSB) · …" | mesmo formato |
| C04 | PASS | "Nome civil, cargo, UF, partido e bloco conforme o Senado Federal." | idem, sem a frase dos votos (I4) |
| C05 | PASS | "Acompanhar atualizações" | idem |
| C06 | PASS | "Contestar um dado" | idem |
| C07 | PASS | "Cota do senador (CEAPS) em 2026", "R$ 240.512", "Média de R$ 26.724 por mês, jan a set"; sem barra | idem |
| C08 | PASS | "Presença em votações nominais", "67 de 67 em 2026 · média do Senado 89%" (Ana: "45 de 62 …") | idem |
| C09 | PASS | "Votou como a liderança orientou", "Divergiu em 0 de 17 votações abertas" | idem |
| C10 | N/V | rótulo "Bens declarados ao TSE (2022)" correto; a linha de variação vira "sem declaração anterior na série" porque só há 2022 no banco | "+41% sobre 2014, em valor nominal" (Senador:81) |
| C11 | PASS | Gastos da cota, Votações, Bens declarados, Mandato, Fontes | idem |
| C12 | PASS | "Mandato 2023–2031 · 57ª e 58ª legislaturas" + "Titular" (Alan) / "1º Suplente em exercício" (Ana) | idem / SUI-03 |
| C13 | PASS | "Gastos da cota do senador (CEAPS)"; filtro só "2026" (único ano com notas), sem "Mandato todo" | idem |
| C14 | PASS | texto do aviso idêntico | idem |
| C15 | PASS | a palavra "teto" só aparece no aviso; nenhuma linha tracejada, legenda ou barra (D e M) | idem |
| C16 | PASS | 5 linhas "Nome … R$ X · N%" | idem |
| C17 | PASS | Fornecedor, CNPJ/CPF, Total; nota "CPF de pessoa física aparece mascarado, como no Portal da Transparência." (+ "O nome do fornecedor baixa as notas dele.") | idem |
| C18 | **FAIL** | "Prestador pessoa física · — · R$ 24.000": coluna CNPJ/CPF com travessão | `***.456.789-**` (Senador:304). Decorre de SCEAPS-02 (fonte já mascarada → não gravar documento) |
| C19 | PASS | "Fonte: Senado Federal, Dados Abertos administrativos (CEAPS) · coletado em 11/11/2026 14:27"; Ver na fonte, Baixar CSV, Contestar | idem |
| C20 | PASS | "Votações nominais no Plenário"; Todas, Divergiu da liderança, Ausências | idem |
| C21 | PASS | texto idêntico | idem |
| C22 | PASS | "10/11/2026"; "PLP 109/2025" 15 px/600 `#15181E`, link; "… · Aprovada" | idem |
| C23 | PASS | "Liderança do REPUBLICANOS: Sim", "Orientação: não se aplica" (40 ocorrências na lista completa), "Votou: Sim", "Votou (voto secreto)" | idem |
| C24 | **FAIL** | lista resumida com 5 votações (D) | 6 votações (Senador:148 `hint-placeholder-count="6"`, Senador:309-314) |
| C25 | PASS | "Fonte: Senado Federal, Dados Abertos (/votacao e orientação de bancada) · coletado em …"; "Ver todas as 67", "Contestar" (+ "Ver na fonte") | idem |
| C26 | PASS | título, parágrafo idêntico (com a frase dos 8 anos), "Eleição 2022 · R$ 2,12 mi · candidato a senador" | idem |
| C27 | PASS | "Ver na DivulgaCand", "Contestar"; texto "Fonte: TSE, Dados Abertos (bens declarados), em lote · coletado em …" | "(candidatos, bens declarados), download em lote" — mesma estrutura |
| C28 | PASS | Casa, UF (Acre), Início, Fim previsto, Situação "Titular, em exercício" (Ana: "1º Suplente, em exercício"), Bloco | idem |
| C29 | **FAIL** | ordinal fixo no masculino: Ana Paula Lobato lista "Lourdinha Pereira · 2º suplente" | "Ana Suplente Fictícia · 1ª suplente" / "Carlos … · 2º suplente" (Senador:243-244) |
| C30 | PASS | nota idêntica | idem |
| C31 | **FAIL** | "Comissão de Agricultura e Reforma Agrária", "Comissão de Assuntos Econômicos" (nome longo, sem sigla) | "Assuntos Econômicos (CAE)", "Constituição, Justiça e Cidadania (CCJ)" (Senador:249-250) |
| C32 | **FAIL** | "2022 · Eleito senador (AC) · mandato 2023–2031"; na senadora suplente "2022 · Eleita 1º suplente (MA)" (gênero misturado); nenhum mandato anterior | "2022 · Eleito senador por MG" e "2015–2019 · Deputado federal (fora do escopo atual)" em `#B9C8F3` (Senador:255-256) |
| C33 | PASS | "Fonte: Senado, Dados Abertos /senador/{código} · TSE (candidaturas). Ver na fonte" | idem ("resultados" fora por I4) |
| C34 | PASS | 4 fontes (Senado Dados Abertos, CEAPS, TSE lote, Metodologia v1.4) com link e detalhe; frase final | idem |
| C35 | **FAIL** | "Parlamentares, assessorias e qualquer pessoa podem pedir correção. Registramos cada pedido e toda alteração." | "Senadores, assessorias e qualquer pessoa podem pedir correção de um dado deste perfil." (Senador:274); a contagem extra é I7 |
| C36 | PASS | Controlador · CNPJ; Encarregado; alertas; 3 links | idem |
| C37 | PASS | "Em exercício · 2023–2031"; "Senador · AC · REPUBLICANOS" / "Senadora · MA · PSB" | idem |
| C38 | PASS | "Cota em 2026 · R$ 241 mil · R$ 26,7 mil/mês"; "Presença · 67 de 67"; "Seguiu a liderança · 0 divergências"; "Bens (TSE 2022)" | idem |
| C39 | PASS | "Gastos da cota (CEAPS) · 2026" + aviso curto idêntico; "Votações recentes" + "Em votação secreta o Senado registra só que o senador votou."; "Bens declarados ao TSE" + nota idêntica | idem |
| C40 | PASS | "Ver todas as notas e fornecedores", "Ver as 67 votações" | idem |
| C41 | **FAIL** | "Liderança do REPUBLICANOS: Sim" no celular | "Liderança: Sim" (SenadorMobile:98) |
| C42 | **FAIL** | "Votou (voto secreto)" no celular | "Votou (secreto)" (SenadorMobile:151). Decorre de SVOT-06 |
| C43 | PASS | "Fonte: Senado, CEAPS · coletado em 11/11/2026 · ver original"; votações e bens no mesmo formato (com "ver original" a mais) | idem |
| C44 | **FAIL** | "Qualquer pessoa pode pedir correção." | "Qualquer pessoa pode pedir correção de um dado deste perfil." (SenadorMobile:130) |
| C45 | PASS | "Controlador: … · Encarregado (LGPD): nome · e-mail" (I9); "Alertas são indícios para verificação, não acusações. Metodologia · Política de privacidade" | idem |
| C46 | PASS | placeholder "Buscar deputado ou senador por nome ou UF" (D e M) | idem |
| P01 | PASS | "Parlamentares federais em exercício", 30 px/700 Space Grotesk | idem |
| P02 | **FAIL** | conteúdo x=160, 1120 px (`max-w-6xl` 1152 com `px-4`) | x=144, 1152 px (max 1200 + 24 px) (ListaParlamentares:36) |
| P03 | PASS | "Todos (81)", "Câmara dos Deputados (0)", "Senado Federal (81)"; 40 px, pílula; ativo `#1F4FD1`/`#E8EEFC`/600 + `aria-current=page`; inativo borda `#80858E` texto `#3D424B` | idem |
| P04 | **FAIL** | rótulos 14 px/500 corretos; campo e select 40 px raio 8 borda `#80858E`, mas **fonte 16 px** | fonte 14 px (ListaParlamentares:48, 52) |
| P05 | **FAIL** | "Filtrar" 40 px `#1F4FD1` raio 8, mas **16 px/500** | 14 px/600 (ListaParlamentares:54) |
| P06 | **FAIL** | "60+ resultado(s). Fonte: Senado Federal, Dados Abertos." e 60 cartões: 21 senadores (de "Randolfe Rodrigues" em diante na ordem alfabética) não aparecem sem busca | "81 resultado(s)." e os 81 (ListaParlamentares:57) |
| P07 | PASS | 3 colunas, gap 12 | 3 colunas, gap 12 |
| P08 | PASS | borda `#E2E2DC`, raio 10, padding 12, gap 12; nome 500; "Senador · REPUBLICANOS · AC", "Senadora · PSB · MA" | idem |
| P09 | **FAIL** | avatar 48×48 redondo (`rounded-full`) | 48×48 raio 8 (ListaParlamentares:63) |
| P10 | **FAIL** | topo com o campo "Buscar deputado ou senador…" visível acima do formulário da página | topo só com logo e menu (ListaParlamentares:22-34) |
| P11 | PASS | celular: `scrollWidth` 390, grade de 1 coluna (358 px) | — |
| B01 | PASS | D: "Lobato" + Enter → `/parlamentares?q=Lobato`, 1 cartão "Ana Paula Lobato · Senadora · PSB · MA". M: tocar "Buscar" (aria-expanded=true, foco no campo), "Alan" + Enter → `/parlamentares?q=Alan` | lista filtrada |
| B02 | PASS | D: hash `#votacoes`, `#bens`, `#mandato`, `#fontes`, `#gastos`, seção a 16 px do topo (bens limitado pelo fim da página); M: idem (fontes a 126 px, fim da página) | leva à seção |
| B03 | PASS | rolagem com roda (D): ativa Gastos da cota → Votações → Bens declarados | acompanha |
| B04 | N/V | só 2026 tem notas da CEAPS no banco, então o filtro tem um único ano | troca os dados |
| B05 | PASS | "Ausências" → `?votos=ausencias#votacoes`: Alan "Nenhuma votação neste filtro." (67/67), Ana 22 linhas "Sem registro"; "Divergiu da liderança" em Esperidião Amin mostra só o PLP 18/2021 (PP Não × Sim) | filtra |
| B06 | PASS | "Contestar um dado" → `/parlamentares/10005672/contestar`; "Contestar" de votações → `?secao=votacoes` com o `select[name=secao]` = `votacoes` | formulário com a seção |
| B07 | PASS | "Pedir correção" → `/parlamentares/10005672/contestar` com formulário | abre o formulário |
| B08 | PASS | `adm.senado.gov.br/…/despesas_ceaps/2026`, `legis.senado.leg.br/dadosabertos/votacao?dataInicio=2026-01-01&dataFim=2026-12-31`, `/senador/5672`, DivulgaCand, `target=_blank` | abre o original |
| B09 | PASS | "Buscar" e "Menu" com `aria-expanded=true`; menu Parlamentares, Metodologia, Sobre | idem |
| B10 | PASS | `/parlamentares/10005672/acompanhar` com instruções; `feed.xml` 200 `application/atom+xml` | tem efeito |
| B11 | PASS | "PLP 109/2025" → `www25.senado.leg.br/…/materia/173581`, nova aba, `rel=noopener noreferrer` | matéria na fonte |
| B12 | PASS | download `ceap-10005672-2026.csv`, cabeçalho `ano;mes;data_emissao;tipo_despesa;fornecedor;cnpj_cpf;…`, 129 notas | CSV do ano |
| B13 | PASS | clique no cartão "Alan Rick" → `/parlamentares/10005672`; `?casa=xyz` marca "Todos (81)" como atual | idem |

## Placar

- Itens: 129 (V 24, L 22, M 13, C 46, P 11, B 13)
- PASS: 104
- FAIL: 22 (V12, V13, V14, V23, L14, M12, M13, C18, C24, C29, C31, C32, C35, C41, C42, C44, P02, P04, P05, P06, P09, P10)
- INTENCIONAL: 0 itens pontuados (as divergências aceitas que valem aqui não caem em nenhum item; ver abaixo)
- N/V: 3 (L19, C10, B04)
- **Paridade = 104 ÷ (104 + 22) = 82,5%** (meta ≥ 95%: **não atingida**)
- Paridade pessimista (N/V como FAIL) = 104 ÷ 129 = 80,6%
- Mesmo registrando C18 e C42 como intencionais (ambos vêm da spec), ficaria 104 ÷ 124 = 83,9%.

## FAILs explicados

| ID | O protótipo pede | A página mostra | Onde mexer |
| --- | --- | --- | --- |
| V12 | Botão secundário com borda `#80858E` (Senador:59, SenadorMobile:50) | `#C9CAC2` (token `--linha`) | `src/components/perfil/estilos.ts:6` (`border-linha` → `border-input`) |
| V13 | Filtros inativos com borda `#80858E` (Senador:104-106, 169-170) | `#C9CAC2` | `src/components/perfil/estilos.ts:13` |
| V14 | Linha de base do gráfico `1px #80858E` (Senador:117, SenadorMobile:67) | `1px #C9CAC2` | `src/components/perfil/secoes.tsx:177` |
| V23 | Marca com `letter-spacing` −0,02em no D e normal no M (Senador:26, SenadorMobile:25) | `tracking-tight` (−0,025em) nos dois | `src/components/topo.tsx:20` (pendência X03 da verificação 5 do deputado, não corrigida) |
| L14 | 200 px úteis para as barras + 10 px de respiro (Senador:117, content-box) | 200 px no total com `border-box`, 189 px úteis | `src/components/perfil/secoes.tsx:177` (pendência X02 do deputado) |
| M12 | Celular: Mandato antes de Bens (SenadorMobile:106-126) | Bens antes de Mandato (a ordem do DOM é a do desktop) | `src/app/parlamentares/[id]/page.tsx:275-281` (ex.: `order` no celular para senador) |
| M13 | Celular: Mandato compacto com "Período", "Situação", "Bloco" e "Suplentes" numa linha (SenadorMobile:106-113) | o bloco completo do desktop (613 px) | `src/components/perfil/secoes.tsx:791-860` (`Lateral`) |
| C18 | Prestador pessoa física com CPF mascarado `***.456.789-**` (Senador:304) | "—" | Conflito com SCEAPS-02 (fonte já mascarada → sem documento, para não permitir remontar o CPF entre Casas). Recomendo registrar como intencional (I10) em vez de mudar o código |
| C24 | 6 votações na lista resumida (Senador:148, 309-314) | 5 | `src/components/perfil/secoes.tsx:387` (`slice(0, 5)`, compartilhado com o deputado, cujo protótipo pede 5) |
| C29 | Ordinal do suplente concorda com o gênero ("1ª suplente") (Senador:243) | sempre "º" ("Lourdinha Pereira · 2º suplente") | `src/components/perfil/secoes.tsx:827`; exige saber o sexo do suplente (a coleta não grava) ou um texto neutro aprovado |
| C31 | Comissão com nome curto e sigla: "Assuntos Econômicos (CAE)" (Senador:249-250) | "Comissão de Assuntos Econômicos", sem sigla | `src/components/perfil/secoes.tsx:842-843` |
| C32 | "2022 · Eleito senador por MG" e mandato anterior em cor clara (Senador:255-256) | "2022 · Eleito senador (AC) · mandato 2023–2031"; senadora suplente: "Eleita 1º suplente (MA)"; nenhum mandato anterior | `src/components/perfil/secoes.tsx:670-697` (`feminino`, `marcoCandidatura`) |
| C35 | "Senadores, assessorias e qualquer pessoa podem pedir correção de um dado deste perfil." (Senador:274) | "Parlamentares, assessorias e qualquer pessoa podem pedir correção. Registramos cada pedido e toda alteração." | `src/components/perfil/secoes.tsx:914` |
| C41 | Celular: "Liderança: Sim" (SenadorMobile:98) | "Liderança do REPUBLICANOS: Sim" | `src/components/perfil/secoes.tsx:432` (versão curta com `Dois`) |
| C42 | Celular: "Votou (secreto)" (SenadorMobile:151) | "Votou (voto secreto)" | Conflito com SVOT-06, que fixa "Votou (voto secreto)"; recomendo registrar como intencional |
| C44 | Celular: "Qualquer pessoa pode pedir correção de um dado deste perfil." (SenadorMobile:130) | "Qualquer pessoa pode pedir correção." | `src/components/perfil/secoes.tsx:913` |
| P02 | Coluna de 1200 px com 24 px (conteúdo 1152 em x=144) (ListaParlamentares:36) | 1120 px em x=160 | `src/app/parlamentares/page.tsx:14` (`max-w-6xl px-4`) |
| P04 | Campo e select com fonte 14 px (ListaParlamentares:48, 52) | 16 px | `src/app/parlamentares/page.tsx:87, 94` |
| P05 | "Filtrar" 14 px/600 (ListaParlamentares:54) | 16 px/500 | `src/app/parlamentares/page.tsx:103` |
| P06 | "81 resultado(s)." e os 81 senadores (ListaParlamentares:57) | "60+ resultado(s)." e 60 cartões | `src/data/perfil.ts:53` (`limit(60)`) e `src/app/parlamentares/page.tsx:111`; sem paginação, 21 senadores só aparecem pela busca |
| P09 | Avatar 48×48 com raio 8 (ListaParlamentares:63) | redondo | `src/components/perfil/foto.tsx:9` |
| P10 | Topo da lista sem campo de busca (ListaParlamentares:22-34) | busca do topo visível | `src/components/topo.tsx` (esconder na rota `/parlamentares`) |

## N/V (fora do denominador, listados)

| ID | Por quê | Como fechar |
| --- | --- | --- |
| L19 | O banco real só tem bens do TSE 2022 (uma eleição por senador) | Medir no seed (`auditaja_senado_test`) com um senador de duas eleições |
| C10 | Idem: não há "+N% sobre AAAA" | Idem |
| B04 | Só 2026 tem notas da CEAPS | Coletar `ceaps 2025` ou medir no seed |

## Divergências intencionais conferidas (sem item pontuado)

- I1: sem a faixa "dados fictícios"; nomes e valores reais.
- I2: sem alerta "Padrão atípico" (o artboard do senador também não tem).
- I4: sem "Eleito em 2022 com N votos (TSE)" na procedência e sem "resultados" na fonte do mandato.
- I5/I6: atendidas pelo próprio artboard (borda `#80858E`, menu sem "Gastos públicos").
- I7: "Pedidos de correção recebidos para este perfil: 0" a mais (o texto em si conta em C35).
- I8 (substituída): nenhum teto em senador, D e M (C15).
- I9: nome do encarregado no rodapé do celular.

## Observações (não pontuadas)

- "Senador por Acre (AC)" e "Senadora por Maranhão (MA)": o formato segue SUI-02 ("por {UF por extenso}"), mas em
  português o certo é "pelo Acre" e "pelo Maranhão" (também "pelo Amapá/Amazonas/Ceará/Espírito Santo/Pará/Paraná/Piauí/
  Rio de Janeiro/Rio Grande do Norte/Rio Grande do Sul/Tocantins/Distrito Federal", "pela Bahia/Paraíba"). O protótipo
  só mostra Minas Gerais, então não acusa o problema.
- Acréscimos que não contradizem o protótipo: "Ver na fonte" nas votações e no mandato; nota "A presença não conta as
  votações em que o senador estava de licença ou afastado."; "O nome do fornecedor baixa as notas dele." e nomes de
  fornecedor como link; "Ver todas as coletas"; seção "De onde vêm os dados" no celular (necessária para a aba Fontes);
  rótulos "Presente, não registrou voto", "Sem registro" e "Liderança: sem orientação", que o protótipo não desenha.
- Rótulo de variação de bens difere entre D ("sem declaração anterior na série") e M ("primeira declaração").
- A lista com `casa` vazio diz "Fonte: Câmara dos Deputados (API v2) e Senado Federal (Dados Abertos)." e mostra
  "Câmara dos Deputados (0)" porque o banco de desenvolvimento só tem o Senado; contagem conferida, formato correto.
