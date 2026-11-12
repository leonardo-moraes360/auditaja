# Verificação 1 de paridade: padrão atípico nos gastos da cota

Fonte da verdade: artboards aprovados `prototipo/Atipico.dc.html` (desktop, 1440 px) e `prototipo/AtipicoMobile.dc.html`
(celular, 390 px), ambos com dados fictícios. `Atp:NN` e `Mob:NN` apontam linhas desses arquivos. As notas de projeto
do artboard ("Quando não há alerta", "Com mais de um alerta", "No mandato todo", Atp:91-98) e o rascunho da metodologia
(Atp:102-109) entram como especificação de comportamento e de texto, não como elementos a desenhar.

Build verificado: commit `bbdb22a` (branch `claude/project-thread-117h8c`), `.next` existente, `pnpm start --port 3404`
com `DATABASE_URL=postgres://…@127.0.0.1:5436/auditaja_atipico_test` (seed + fixture `tests/fixtures/atipico.ts`).

Páginas, em 1440×900 e 390×844:

- `/parlamentares/980000026?ano=2025` (dois avisos: salto em manutenção de escritório e acima dos colegas em hospedagem);
- `/parlamentares/980000026?ano=2024` (um aviso, acima dos colegas; sem 2023 coletado);
- `/parlamentares/980000026?ano=mandato` (resumo por ano);
- `/parlamentares/900000001?ano=2026` (nenhum aviso);
- `/metodologia#atipico` (abertura direta e pelo clique no link do aviso).

Medição: Playwright (Chrome do sistema), `innerText`, `getComputedStyle` e `getBoundingClientRect`, com espera pelo
`section#gastos` visível (a página transmite o perfil depois do esqueleto). CSV do link de notas com `curl`. "Ver mais"
(o fixture só tem 2 avisos) foi conferido renderizando `AvisosAtipicos` com 5 avisos fictícios via
`react-dom/server` (script em scratchpad, não versionado). Contraste calculado pela fórmula do WCAG 2.1.

## Rubrica

- Cada item é binário: **PASS** ou **FAIL**. Na dúvida, FAIL.
- Os números são fictícios no artboard e do fixture no app: compara-se formato, rótulos, ordem, estrutura, cor (hex
  exato no estilo computado), tamanho (±2 px) e comportamento.
- Nenhuma divergência deste trabalho foi aprovada formalmente. As que parecem intencionais estão listadas à parte em
  "Propostas como intencionais", mas **contam como FAIL** no número principal.
- Cores do diagrama e do ícone são conferidas uma vez (seção T) e valem para desktop e celular; as seções D e M
  conferem geometria e texto.

**Paridade = PASS ÷ (PASS + FAIL)**. Meta: ≥ 95%.

## T. Cores (desktop e celular)

| ID | Esperado | Ref. | Medido | Resultado |
| --- | --- | --- | --- | --- |
| T01 | Traço do ícone `#8A6100` | Atp:31, 62 | `#6B4B00` (`text-atipico`, `stroke=currentColor`) | FAIL |
| T02 | Tracejado do limite `#8A6100` | Atp:44, Mob:34 | `#6B4B00` (`border-atipico`) | FAIL |
| T03 | Trilho do diagrama `#D9D9D2` | Atp:41, Mob:32 | `#C9CAC2` (`bg-linha`) | FAIL |
| T04 | Fundo da caixa Q1–Q3 `#DCE4FA` | Atp:42, Mob:33 | `#E8EEFC` (`bg-secondary`) | FAIL |
| T05 | Borda da caixa 1 px `#6E8FE8` | Atp:42 | 1 px `#6E8FE8` | PASS |
| T06 | Marca da mediana `#1F4FD1` | Atp:43 | `#1F4FD1` | PASS |
| T07 | Ponto do parlamentar `#B4440E`, borda 2 px `#FFFFFF` | Atp:45, Mob:35 | `#B4440E`, 2 px `#FFFFFF` | PASS |
| T08 | Rótulos: mediana `#555B66`; limite `#6B4B00` 600; ponto `#7A2E09` 600 | Atp:47-51 | iguais | PASS |

## D. Desktop (1440 px)

| ID | Esperado | Ref. | Medido | Resultado |
| --- | --- | --- | --- | --- |
| D01 | Avisos dentro de `section#gastos`, depois do gráfico mensal e antes de "Por tipo de despesa" | Atp:24-78 | filhos do section: cabeçalho › figure › avisos › por tipo/fornecedores › fonte | PASS |
| D02 | Moldura: fundo `#FFF7E0`, borda 1 px `#F0D58C`, raio 12, padding 16/18 | Atp:30 | iguais | PASS |
| D03 | Ícone 22×22 à esquerda, gap 14; colegas = gráfico de linha, salto = seta para cima | Atp:30-31, 62 | 22×22, gap 14, mesmos paths | PASS |
| D04 | Coluna interna gap 10; selo e título com gap 4 | Atp:32-33 | 10 / 4 | PASS |
| D05 | Selo 12 px, 700, `letter-spacing` 0,04em, maiúsculas, `#6B4B00` | Atp:34 | 12 px, 700, 0,48 px, uppercase, `#6B4B00` | PASS |
| D06 | Selo colegas "Padrão atípico · acima dos colegas · ponto de partida para verificação" | Atp:34 | igual | PASS |
| D07 | Selo salto "Padrão atípico · salto em relação a {ano−1} · ponto de partida para verificação" | Atp:65 | "… salto em relação a 2024 · …" | PASS |
| D08 | Título 16 px, 700, `#3D2C00` | Atp:35 | 16 px, 700, `#3D2C00` (h3) | PASS |
| D09 | Título colegas "{Tipo}: gasto mensal muito acima do comum entre os deputados em {ano}" | Atp:35 | mesmo formato | PASS |
| D10 | Título salto "{Tipo}: gasto N vezes maior que no ano anterior" | Atp:66 | "…: gasto 13 vezes maior que no ano anterior" | PASS |
| D11 | Parágrafos 14 px, `#3D424B`, altura de linha 1,55 | Atp:37 | 14 px, `#3D424B`, 21,7 px | PASS |
| D12 | Texto colegas: "Este deputado gastou em média **X por mês** em {tipo} (T em M meses com notas). Entre os N deputados … metade gastou até … três em cada quatro até …. O valor passa do limite de atipicidade, de **L por mês**, em E no ano." | Atp:37 | "Média de **X por mês** (T em M meses com notas). Entre os N deputados … O limite de atipicidade é **L por mês**; no ano, o gasto passa dele em E." Abertura e fecho reescritos | FAIL |
| D13 | Diagrama: contêiner 56 px; trilho 2 px no topo 27 | Atp:40-41 | 56 / 2 px top 27 | PASS |
| D14 | Caixa Q1–Q3: topo 16, 24 px, raio 4 | Atp:42 | 16 / 24 / 4 | PASS |
| D15 | Mediana 2×28 px, topo 14 | Atp:43 | 2×28, topo 14 | PASS |
| D16 | Limite: tracejado 2 px, 44 px, topo 6 | Atp:44 | `dashed` 2 px, 44, topo 6 | PASS |
| D17 | Ponto 16×16, topo 20, centrado no valor | Atp:45 | 16×16, topo 20, `-ml-2` | PASS |
| D18 | Rótulo "R$ 0" na origem do eixo | Atp:48 | ausente | FAIL |
| D19 | Rótulo "Mediana R$ X/mês", 12 px | Atp:49 | "Mediana R$ 770/mês", 12 px | PASS |
| D20 | Rótulo "Limite R$ X/mês" | Atp:50 | "Limite R$ 1.645/mês" | PASS |
| D21 | Rótulo do ponto "Este deputado" | Atp:51 | "Este parlamentar" | FAIL |
| D22 | Rótulos sem sobreposição (segunda linha quando colidem) | Atp:47-51 | Limite desce para a linha 2 (18 px); sem sobreposição | PASS |
| D23 | Legenda "Caixa azul: metade do meio dos deputados (de A a B por mês). Tracejado: limite de atipicidade.", 12 px `#555B66` | Atp:53 | igual | PASS |
| D24 | Diagrama `role="img"` com `aria-label` com faixa, mediana, limite e valor | Atp:40 | presente, mesmos quatro números | PASS |
| D25 | Ressalva colegas: "Gasto atípico não é gasto irregular. Pode ter explicação, como base eleitoral longe da capital ou muitas agendas fora de Brasília. Vale olhar…" | Atp:56 | idêntica | PASS |
| D26 | Linha de links 14 px, 600, `#6B4B00`, gap 16 | Atp:57 | 14 px, 600, `#6B4B00`, gap 4/16 | PASS |
| D27 | Link de notas "Baixar as N notas de {tipo}" / "Baixar as N notas de {ano}" | Atp:57, 75 | "Baixar as notas (CSV)" (sem contagem nem tipo/ano) | FAIL |
| D28 | "Como calculamos (metodologia v1.9)" | Atp:57, 75 | igual | PASS |
| D29 | Link "Contestar" em cada aviso | Atp:57, 75 | ausente (só o "Contestar" geral no rodapé do bloco) | FAIL |
| D30 | Texto salto: "Foram **X** em {ano} contra Y em {ano−1}. Entre os N deputados … metade **variou** entre A e B. O limite de salto é **K vezes** o valor do ano anterior, e o aumento **passa de R$ 5 mil**." | Atp:68 | "… metade **ficou** entre 1% a mais e 3% a mais. … e o aumento **foi de R$ 37.000**." | FAIL |
| D31 | Três cartões no salto: "{ano−1}", "{ano} (jan–nov)", "Limite de salto K × {ano−1}" (fundo branco, raio 10, valor 20 px Space Grotesk) | Atp:69-73 | ausentes | FAIL |
| D32 | Ressalva salto: "Um salto pode ter explicação, como abrir um escritório novo no estado. Vale olhar…" | Atp:74 | "… como abrir um escritório novo ou mudar a forma de contratar um serviço. Vale olhar…" | FAIL |
| D33 | Avisos separados por 20 px (gap do section) | Atp:24, 30/61 | 12 px (wrapper `gap-3`) | FAIL |
| D34 | Ordem "do maior excesso sobre o limite para o menor" | Atp:95 | colegas ordena por excesso sobre o limite; salto ordena por `aumento` (total − ano anterior), não pelo excesso sobre o limite de salto. Neste fixture a ordem coincide, mas o critério difere | FAIL |
| D35 | Até três avisos abertos; os demais em "Ver mais N padrões atípicos" | Atp:95 | render com 5: abertos os 3 maiores; `<details>` "Ver mais 2 padrões atípicos" com os 2 menores | PASS |
| D36 | h3 "Por tipo de despesa" 15 px | Atp:80 | 15 px, 700 | PASS |
| D37 | Selo "Atípico" na lista: fundo `#FFF7E0`, borda `#F0D58C`, texto `#6B4B00`, 11 px 700, padding 2/7, pílula | Atp:84 | iguais | PASS |
| D38 | Selo só nos tipos com aviso no ano | Atp:84, 118-123 | 2025: os dois tipos; 2024: só hospedagem | PASS |
| D39 | Sem aviso: linha discreta abaixo do gráfico, com link "Como calculamos" | Atp:93 | `p` 14 px `#555B66` logo depois do gráfico, link → `/metodologia#atipico` | PASS |
| D40 | Texto "Nenhum tipo de despesa ficou acima do limite de atipicidade em {ano}." | Atp:93 | "… acima dos limites de padrão atípico em 2026." | FAIL |
| D41 | "Mandato todo": lista os anos com aviso, com link para cada um | Atp:97 | "Padrão atípico, comparado ano a ano: 2024 (1 aviso), 2025 (2 avisos). Como calculamos."; clique leva a `?ano=2024#gastos` com o aviso | PASS |
| D42 | "Como calculamos" aponta `/metodologia#atipico` e cai na seção | Atp:57 | href exato; após clique, `#atipico` a 16 px do topo (desktop e celular) | PASS |
| D43 | Link de notas baixa o CSV filtrado (`?ano=&tipo=`) | Atp:57 | `gastos.csv?ano=2025&tipo=HOSPEDAGEM…`, `attachment`, 10 linhas todas do tipo (21 sem `tipo`) | PASS |

## M. Celular (390 px)

| ID | Esperado | Ref. | Medido | Resultado |
| --- | --- | --- | --- | --- |
| M01 | Moldura raio 10, padding 12, mesmo fundo e borda | Mob:27 | 10 / 12 / `#FFF7E0` / `#F0D58C` | PASS |
| M02 | Sem ícone | Mob:27-28 | ícone `display:none` | PASS |
| M03 | Partes separadas por 8 px (inclusive selo → título) | Mob:27 | selo → título 4 px (`gap-1`); demais 10 px | FAIL |
| M04 | Selo 11 px, 700, maiúsculas, `#6B4B00` | Mob:28 | iguais | PASS |
| M05 | Selo só "Padrão atípico" | Mob:28 | "Padrão atípico · acima dos colegas" / "· salto em relação a 2024" | FAIL |
| M06 | Título 15 px, `#3D2C00`, altura de linha 1,35 | Mob:29 | 15 px, `#3D2C00`, 20,6 px | PASS |
| M07 | Título curto "{Tipo} muito acima do comum entre os deputados" | Mob:29 | título do desktop: "…: gasto mensal muito acima do comum entre os deputados em 2025" | FAIL |
| M08 | Parágrafo 13 px, `#3D424B`, altura de linha 1,5 | Mob:30 | 13 px, `#3D424B`, 19,5 px | PASS |
| M09 | Texto curto com totais anuais: "R$ T em {ano}. Metade dos N deputados gastou até X; o limite de atipicidade é L." | Mob:30 | "R$ 5.000 por mês em 2025. Metade dos 26 deputados gastou até R$ 770 por mês; o limite de atipicidade é R$ 1.645." (média mensal) | FAIL |
| M10 | Diagrama 28 px; trilho 2 px no topo 13 | Mob:31-32 | 28 / topo 13 | PASS |
| M11 | Caixa topo 6, 16 px, raio 3 | Mob:33 | 6 / 16 / 3 | PASS |
| M12 | Sem marca da mediana | Mob:31-36 | marca 2×20 `#1F4FD1` visível | FAIL |
| M13 | Tracejado 2 px, 28 px, topo 0 | Mob:34 | 2 px / 28 / 0 | PASS |
| M14 | Ponto 14×14, topo 7 | Mob:35 | 14×14, topo 7 | PASS |
| M15 | Sem rótulos nem legenda sob o diagrama | Mob:31-36 | rótulos e `figcaption` ocultos | PASS |
| M16 | Ressalva "Atípico não quer dizer irregular. É um ponto de partida para olhar as notas." | Mob:37 | idêntica (nos dois tipos de aviso) | PASS |
| M17 | Links empilhados, gap 4, 14 px, 600, `#6B4B00` | Mob:38-40 | coluna, gap 4, 14 px, 600, `#6B4B00` | PASS |
| M18 | Altura de cada link ≈ 37 px (padding 10 + linha) | Mob:39-40 | 44 px (`min-h-11`) | FAIL |
| M19 | Rótulos "Baixar as N notas" e "Como calculamos" | Mob:39-40 | "Baixar as notas (CSV)" e "Como calculamos (metodologia v1.9)" | FAIL |
| M20 | Aviso entre o gráfico mensal e a lista por tipo | Mob:22-43 | idem | PASS |
| M21 | Lista só com %; selo "Atípico" 11 px pílula (padding 1/6 ±2) | Mob:46 | só %, selo 11 px, padding 2/7 | PASS |

## Q. Metodologia (`/metodologia#atipico`)

| ID | Esperado | Ref. | Medido | Resultado |
| --- | --- | --- | --- | --- |
| Q01 | Seção com âncora `atipico` | Atp:57 (link) | `section#atipico`, `scroll-mt-4` | PASS |
| Q02 | h2 "Padrão atípico nos gastos da cota", 20 px Space Grotesk | Atp:104 | igual, 20 px, Space Grotesk 700 | PASS |
| Q03 | Quatro parágrafos corridos, sem subtítulos | Atp:105-108 | parágrafo de abertura + h3 "Acima dos colegas", "Salto em relação ao ano anterior", "Regras comuns" com um parágrafo cada | FAIL |
| Q04 | Parágrafos 15 px, `#3D424B`, altura de linha 1,6 | Atp:105 | 16 px, `#15181E`, 26 px (estilo do resto da página) | FAIL |
| Q05 | "Duas comparações, que enxergam coisas diferentes"; colegas da mesma Casa, deputados com deputados, senadores com senadores | Atp:105 | presente | PASS |
| Q06 | Média mensal: total do ano ÷ meses com notas | Atp:105 | "dividimos o que o parlamentar gastou no ano pelos meses em que ele apresentou alguma nota" | PASS |
| Q07 | Q1 e Q3 explicados; limite **Q3 + 3 × (Q3 − Q1)**, cerca externa de Tukey, sem média nem curva normal | Atp:106 | idem, fórmula em negrito com `FATOR_TUKEY` = 3 | PASS |
| Q08 | Salto: razão sobre o ano anterior, cerca de Tukey sobre o logaritmo, notas em ≥ 10 meses nos dois anos, aumento > R$ 5 mil | Atp:107 | idem ("R$ 5.000") | PASS |
| Q09 | Limite só com ≥ 20 parlamentares | Atp:108 | "pelo menos 20 parlamentares entram na comparação" | PASS |
| Q10 | Colegas: aviso só quando o gasto do ano passa do limite em mais de R$ 5 mil | Atp:108 | "no ano, o gasto fica mais de R$ 5.000 acima dele" | PASS |
| Q11 | "Os dois avisos mostram os números usados no cálculo"; ponto de partida, não diz que houve irregularidade | Atp:108 | ambos na abertura | PASS |
| Q12 | Só o conteúdo do rascunho | Atp:105-108 | acrescenta valor líquido/reembolsado, valores nominais, teste 2009–2026, métodos descartados (Benford, fornecedor único) e o caso sem ano anterior | FAIL |

## A. Acessibilidade

| ID | Esperado | Ref. | Medido | Resultado |
| --- | --- | --- | --- | --- |
| A01 | Contraste ≥ 4,5:1 nos textos dos avisos (fundo `#FFF7E0`) | — | `#6B4B00` 7,46; `#3D2C00` 12,60; `#3D424B` 9,44; `#555B66` 6,39; `#7A2E09` 8,83 | PASS |
| A02 | Contraste ≥ 4,5:1 na linha sem aviso e no resumo do mandato (fundo branco) | — | `#555B66` 6,83; link `#1F4FD1` 6,78 | PASS |
| A03 | Links do aviso ≥ 44 px no celular | — | 44 px de altura, 298 px de largura | PASS |
| A04 | "Ver mais" ≥ 44 px no celular | — | `min-h-11` (44 px) no `summary` (render, não medido no app: fixture sem 4+ avisos) | PASS |
| A05 | Links da linha sem aviso e do resumo do mandato ≥ 44 px no celular | Atp:93, 97 | 16 px de altura ("Como calculamos", "2024 (1 aviso)", "2025 (2 avisos)"). Links em frase têm exceção no WCAG 2.5.8, mas a meta pedida é ≥ 44 px | FAIL |
| A06 | Ícone e rótulos visuais do diagrama fora da árvore de acessibilidade (o `aria-label` cobre) | Atp:31, 40 | `aria-hidden` no ícone e nos rótulos | PASS |

## Propostas como intencionais (precisam de aprovação)

Contam como FAIL acima. Se aprovadas, saem do denominador.

| ID | Divergência | Por que parece intencional |
| --- | --- | --- |
| D12 | Texto do aviso de colegas começa com "Média de" e fecha com "O limite de atipicidade é L por mês; no ano, o gasto passa dele em E" | Evita "Este deputado" (o mesmo componente serve senadores) e mantém todos os números do artboard |
| D21 | Rótulo do ponto "Este parlamentar" em vez de "Este deputado" | Mesmo motivo: o componente atende Câmara e Senado |
| D32 | Ressalva do salto genérica ("abrir um escritório novo ou mudar a forma de contratar um serviço") | O exemplo do artboard só faz sentido para manutenção de escritório; o aviso vale para qualquer tipo |
| D40 | "acima dos limites de padrão atípico" em vez de "acima do limite de atipicidade" | Há dois limites (colegas e salto); a frase do artboard só cobre o primeiro |
| M05 | Selo do celular inclui o tipo de aviso ("· acima dos colegas" / "· salto em relação a …") | O artboard do celular só mostra o aviso de colegas; sem o tipo, os dois avisos ficam indistinguíveis |
| M09 | Texto curto do celular em média mensal, não em total anual | O limite é calculado sobre a média mensal (metodologia); o total anual do artboard do celular contradiz o desktop e o método |
| M18 | Links do aviso no celular com 44 px em vez de ≈ 37 px | Alvo de toque mínimo de 44 px |
| Q03 | Metodologia com abertura e três subtítulos | Acompanha a estrutura das outras seções longas da página |
| Q04 | Parágrafos da metodologia em 16 px `#15181E` | Estilo do resto de `/metodologia`; o artboard é um rascunho de texto num cartão |
| Q12 | Metodologia com conteúdo além do rascunho (base de valores, teste 2009–2026, métodos descartados, sem ano anterior) | Transparência do método; não contradiz o rascunho |

## Observações fora da contagem

- O nome do tipo vem com `fraseCase`, que deixa "distrito federal" em minúsculas ("Hospedagem, exceto do parlamentar no
  distrito federal"), no título do aviso e na lista. O artboard usa "no DF". Vem de código anterior a esta feature.
- No celular o filtro de ano (`nav` com 2025/2024/Mandato todo) fica oculto (`hidden sm:flex`), então "Mandato todo" só
  é alcançável pela URL. Também anterior a esta feature.
- A ordem observada no fixture de 2025 é salto (aumento R$ 37.000; excesso sobre o limite de salto ≈ R$ 36.700) e
  depois colegas (excesso R$ 33.550). D34 falha pelo critério, não pela ordem deste caso.

## Resultado

| Seção | PASS | FAIL | Total |
| --- | --- | --- | --- |
| T. Cores | 4 | 4 | 8 |
| D. Desktop | 32 | 11 | 43 |
| M. Celular | 14 | 7 | 21 |
| Q. Metodologia | 9 | 3 | 12 |
| A. Acessibilidade | 5 | 1 | 6 |
| **Total** | **64** | **26** | **90** |

**Paridade = 64 ÷ 90 = 71,1%** (meta ≥ 95%: não atingida).

Se as 10 propostas como intencionais forem aprovadas: 64 ÷ 80 = **80,0%** (ainda abaixo da meta).

FAILs que restariam (16): T01, T02, T03, T04, D18, D27, D29, D30, D31, D33, D34, M03, M07, M12, M19, A05.
