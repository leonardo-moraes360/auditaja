# Verificação 2 de paridade: padrão atípico nos gastos da cota

Fonte da verdade: os mesmos artboards da verificação 1, `prototipo/Atipico.dc.html` (1440 px) e
`prototipo/AtipicoMobile.dc.html` (390 px). `Atp:NN` e `Mob:NN` apontam linhas desses arquivos. Rubrica: a mesma de
`verificacao-1.md`, com os mesmos IDs. Itens novos nesta rodada: D44, M22 e A07.

Commit verificado: `e71a587` (branch `claude/project-thread-117h8c`).

## Antes de medir: o build entregue estava velho

O `.next` do worktree (BUILD_ID de 15:17:31) não trazia a classe `text-atipico-traco` nem `border-atipico-traco`. O CSS
gerado tinha só `atipico`, `atipico-borda`, `atipico-fundo` e `atipico-titulo`. Com esse build, o ícone saía
`#15181E` e o tracejado `#E2E2DC`. Um `pnpm build` comum também não resolveu: compilou em 80 ms usando o cache do
Turbopack e devolveu o mesmo CSS. Depois de apagar `.next/cache/turbopack` e rodar `pnpm build` de novo (compilou em
1,8 s), o CSS passou a trazer `atipico-traco`. **Toda a medição abaixo é desse build limpo.** O código de `e71a587`
está certo; quem publicar a partir de um `.next` com cache velho vai ver ícone e tracejado errados.

O fixture 980000026 tinha sumido do banco `auditaja_atipico_test` (o perfil dava 404). Rodei `semearAtipico` de novo,
como na rodada 1.

Páginas, medidas em 1440×900 e 390×844, com `DATABASE_URL=…/auditaja_atipico_test pnpm start --port 3404`:
`/parlamentares/980000026?ano=2025`, `?ano=2024`, `?ano=mandato`, `/parlamentares/900000001?ano=2026` e
`/metodologia#atipico`. Medição com Playwright (Chrome do sistema), `getComputedStyle` e `getBoundingClientRect`. O
"Ver mais" e a ordem pelo excesso foram conferidos renderizando `AvisosAtipicos` com 5 avisos fictícios via
`react-dom/server`: 4 de colegas e 1 de salto com aumento grande e excesso pequeno. CSV com `curl`. Os scripts ficam
no scratchpad e não foram versionados.

## Rubrica

- Cada item é binário: **PASS** ou **FAIL**. Na dúvida, FAIL.
- Compara formato, rótulos, ordem, estrutura, cor (hex exato), tamanho (±2 px) e comportamento. Os números não
  entram.
- Nenhuma divergência foi aprovada formalmente. As que o coordenador manteve de propósito estão em "Propostas como
  intencionais" e **contam como FAIL** no número principal.

**Paridade = PASS ÷ (PASS + FAIL)**. Meta: ≥ 95%.

## T. Cores (desktop e celular)

| ID | Esperado | Ref. | Medido (e71a587, build limpo) | Resultado |
| --- | --- | --- | --- | --- |
| T01 | Traço do ícone `#8A6100` | Atp:31, 62 | `#8A6100` | PASS |
| T02 | Tracejado do limite `#8A6100` | Atp:44, Mob:34 | `#8A6100` (desktop e celular) | PASS |
| T03 | Trilho `#D9D9D2` | Atp:41, Mob:32 | `#D9D9D2` | PASS |
| T04 | Caixa Q1–Q3 `#DCE4FA` | Atp:42, Mob:33 | `#DCE4FA` | PASS |
| T05 | Borda da caixa 1 px `#6E8FE8` | Atp:42 | igual | PASS |
| T06 | Mediana `#1F4FD1` | Atp:43 | igual | PASS |
| T07 | Ponto `#B4440E`, borda 2 px branca | Atp:45, Mob:35 | igual | PASS |
| T08 | Rótulos `#555B66` / `#6B4B00` 600 / `#7A2E09` 600 | Atp:47-51 | iguais; "R$ 0" `#555B66` | PASS |

## D. Desktop (1440 px)

| ID | Esperado | Ref. | Medido | Resultado |
| --- | --- | --- | --- | --- |
| D01 | Avisos depois do gráfico e antes de "Por tipo de despesa" | Atp:24-78 | igual | PASS |
| D02 | Moldura `#FFF7E0` / 1 px `#F0D58C` / raio 12 / padding 16 18 | Atp:30 | igual | PASS |
| D03 | Ícone 22 px, gap 14, ícones distintos por tipo | Atp:30-31, 62 | igual | PASS |
| D04 | Coluna interna gap 10; selo e título com gap 4 | Atp:32-33 | 10 / 4 | PASS |
| D05 | Selo 12 px 700, 0,04em, maiúsculas, `#6B4B00` | Atp:34 | igual | PASS |
| D06 | Selo colegas completo | Atp:34 | "Padrão atípico · acima dos colegas · ponto de partida para verificação" | PASS |
| D07 | Selo salto completo | Atp:65 | "… · salto em relação a 2024 · ponto de partida para verificação" | PASS |
| D08 | Título 16 px 700 `#3D2C00` | Atp:35 | igual | PASS |
| D09 | Título colegas "{Tipo}: gasto mensal muito acima do comum entre os deputados em {ano}" | Atp:35 | igual | PASS |
| D10 | Título salto "{Tipo}: gasto N vezes maior que no ano anterior" | Atp:66 | igual | PASS |
| D11 | Parágrafos 14 px `#3D424B`, altura de linha 1,55 | Atp:37 | 14 px, 21,7 px | PASS |
| D12 | "Este deputado gastou em média **X por mês** em {tipo} (T em M meses com notas). Entre os N deputados … três em cada quatro até …. O valor passa do limite de atipicidade, de **L por mês**, em E no ano." | Atp:37 | mesmo texto, com "hospedagem" e os negritos no lugar. Com `sexo="F"` vira "Esta deputada" (conferido no render) | PASS |
| D13 | Diagrama 56 px; trilho 2 px, topo 27 | Atp:40-41 | igual | PASS |
| D14 | Caixa topo 16, 24 px, raio 4 | Atp:42 | igual | PASS |
| D15 | Mediana 2×28, topo 14 | Atp:43 | igual | PASS |
| D16 | Tracejado 2 px, 44 px, topo 6 | Atp:44 | igual | PASS |
| D17 | Ponto 16×16, topo 20 | Atp:45 | igual | PASS |
| D18 | Rótulo "R$ 0" na origem | Atp:48 | "R$ 0" em x = 0 do diagrama | PASS |
| D19 | "Mediana R$ X/mês" | Atp:49 | igual | PASS |
| D20 | "Limite R$ X/mês" | Atp:50 | igual | PASS |
| D21 | "Este deputado" | Atp:51 | "Este deputado" | PASS |
| D22 | Rótulos sem sobreposição | Atp:47-51 | "R$ 0" termina 11 px antes de "Mediana"; o "Limite" desce para a segunda linha | PASS |
| D23 | Legenda da caixa e do tracejado, 12 px `#555B66` | Atp:53 | igual | PASS |
| D24 | `role="img"` com `aria-label` completo | Atp:40 | presente ("… este deputado R$ 5.000") | PASS |
| D25 | Ressalva colegas idêntica | Atp:56 | idêntica | PASS |
| D26 | Links 14 px 600 `#6B4B00`, gap 16 | Atp:57 | igual | PASS |
| D27 | "Baixar as N notas de {tipo}" / "… de {ano}" | Atp:57, 75 | "Baixar as 10 notas de hospedagem" / "Baixar as 10 notas de 2025"; 10 = linhas do CSV | PASS |
| D28 | "Como calculamos (metodologia v1.9)" | Atp:57 | igual | PASS |
| D29 | "Contestar" em cada aviso | Atp:57, 75 | presente nos dois avisos | PASS |
| D30 | "… metade variou entre A e B. O limite de salto é **K vezes** o valor do ano anterior, e o aumento passa de R$ 5 mil." | Atp:68 | "… metade variou entre 1% a mais e 3% a mais. O limite de salto é **1,1 vezes** o valor do ano anterior, e o aumento passa de R$ 5.000." (ver observação 1) | PASS |
| D31 | Três cartões do salto: "{ano−1}", "{ano} (jan–mês)", "Limite de salto" com "K × {ano−1}"; fundo branco, raio 10, padding 10 12, gap 2, rótulo 12 px `#555B66`, valor 20 px Space Grotesk 700, limite `#6B4B00`, gap 12, base 160 px | Atp:69-73 | "2024 / R$ 3.000", "2025 (jan–out) / R$ 40.000", "Limite de salto / 1,1 × 2024"; estilos iguais; 3 por linha (227,9 px) | PASS |
| D32 | "Um salto pode ter explicação, como abrir um escritório novo no estado. Vale olhar…" | Atp:74 | idêntica | PASS |
| D33 | 20 px entre avisos | Atp:24 | 20 px | PASS |
| D34 | Ordem do maior excesso sobre o limite para o menor | Atp:95 | os dois tipos ordenados por `excessoAno`. No salto, `excessoAno` = total − limite × ano anterior. No render, o salto com excesso de R$ 15 mil (aumento de R$ 90 mil) ficou depois dos avisos de colegas com R$ 40 mil e R$ 20 mil, e antes do de R$ 10 mil | PASS |
| D35 | Três abertos e "Ver mais N padrões atípicos" | Atp:95 | 3 abertos; "Ver mais 2 padrões atípicos" com os 2 menores | PASS |
| D36 | h3 "Por tipo de despesa" 15 px | Atp:80 | igual | PASS |
| D37 | Selo "Atípico" da lista | Atp:84 | igual à rodada 1 | PASS |
| D38 | Selo só nos tipos com aviso no ano | Atp:84 | 2025: dois tipos; 2024: um | PASS |
| D39 | Sem aviso: linha discreta abaixo do gráfico com "Como calculamos" | Atp:93 | igual | PASS |
| D40 | "Nenhum tipo de despesa ficou acima do limite de atipicidade em {ano}." | Atp:93 | "Nenhum tipo de despesa ficou acima do limite de atipicidade em 2026. Como calculamos." | PASS |
| D41 | Mandato todo: anos com aviso, com link | Atp:97 | "2024 (1 aviso), 2025 (2 avisos)"; o clique leva a `?ano=2024#gastos` | PASS |
| D42 | "Como calculamos" → `/metodologia#atipico` | Atp:57 | o clique cai com a seção a 16 px do topo | PASS |
| D43 | Notas → CSV filtrado `?ano=&tipo=` | Atp:57 | hospedagem: 10 linhas, todas do tipo; manutenção: 10 | PASS |
| D44 (novo) | "Contestar" leva a uma página válida | Atp:57 | `/parlamentares/980000026/contestar?secao=gastos` → 200 | PASS |

## M. Celular (390 px)

| ID | Esperado | Ref. | Medido | Resultado |
| --- | --- | --- | --- | --- |
| M01 | Moldura raio 10, padding 12 | Mob:27 | igual | PASS |
| M02 | Sem ícone | Mob:27 | oculto | PASS |
| M03 | Partes a 8 px | Mob:27 | selo → título 8 px; demais 10 px (±2) | PASS |
| M04 | Selo 11 px 700 maiúsculas `#6B4B00` | Mob:28 | igual | PASS |
| M05 | Selo só "Padrão atípico" | Mob:28 | "PADRÃO ATÍPICO" | PASS |
| M06 | Título 15 px `#3D2C00`, altura de linha 1,35 | Mob:29 | 15 px, 20,25 px | PASS |
| M07 | Título curto "{Tipo} muito acima do comum entre os deputados" | Mob:29 | "Hospedagem muito acima do comum entre os deputados" | PASS |
| M08 | Parágrafo 13 px `#3D424B`, altura de linha 1,5 | Mob:30 | igual | PASS |
| M09 | Texto curto com totais anuais | Mob:30 | "R$ 5.000 por mês em 2025. Metade dos 26 deputados gastou até R$ 770 por mês; o limite de atipicidade é R$ 1.645 por mês." | FAIL |
| M10 | Diagrama 28 px, trilho topo 13 | Mob:31-32 | igual | PASS |
| M11 | Caixa topo 6, 16 px, raio 3 | Mob:33 | igual | PASS |
| M12 | Sem marca da mediana | Mob:31-36 | `display:none` | PASS |
| M13 | Tracejado 2 px, 28 px, topo 0 | Mob:34 | igual | PASS |
| M14 | Ponto 14×14, topo 7 | Mob:35 | igual | PASS |
| M15 | Sem rótulos nem legenda | Mob:31-36 | ocultos | PASS |
| M16 | Ressalva curta idêntica | Mob:37 | idêntica | PASS |
| M17 | Links empilhados, gap 4, 14 px 600 `#6B4B00` | Mob:38 | igual | PASS |
| M18 | Altura dos links ≈ 37 px | Mob:39-40 | 44 px | FAIL |
| M19 | "Baixar as N notas" e "Como calculamos" | Mob:39-40 | "Baixar as 10 notas" e "Como calculamos" | PASS |
| M20 | Aviso entre o gráfico e a lista | Mob:22-43 | igual | PASS |
| M21 | Lista só com %; selo "Atípico" | Mob:46 | igual | PASS |
| M22 (novo) | Só os dois links do artboard, sem "Contestar" | Mob:38-41 | "Contestar" oculto no celular | PASS |

## Q. Metodologia (`/metodologia#atipico`)

Sem mudança desde a rodada 1 (`git diff bbdb22a e71a587` não toca `src/app/metodologia`).

| ID | Esperado | Ref. | Medido | Resultado |
| --- | --- | --- | --- | --- |
| Q01 | Âncora `atipico` | — | presente | PASS |
| Q02 | h2 "Padrão atípico nos gastos da cota", 20 px Space Grotesk | Atp:104 | igual | PASS |
| Q03 | Quatro parágrafos corridos, sem subtítulos | Atp:105-108 | abertura + 3 h3 | FAIL |
| Q04 | Parágrafos 15 px `#3D424B`, altura de linha 1,6 | Atp:105 | 16 px `#15181E`, 26 px | FAIL |
| Q05 | Duas comparações; mesma Casa | Atp:105 | presente | PASS |
| Q06 | Média mensal (total ÷ meses com notas) | Atp:105 | presente | PASS |
| Q07 | Q1/Q3; **Q3 + 3 × (Q3 − Q1)**; Tukey; sem média | Atp:106 | presente | PASS |
| Q08 | Salto: razão, log, ≥ 10 meses, aumento > R$ 5 mil | Atp:107 | presente | PASS |
| Q09 | Mínimo de 20 | Atp:108 | presente | PASS |
| Q10 | Piso de R$ 5 mil na comparação com colegas | Atp:108 | presente | PASS |
| Q11 | Os avisos mostram os números; não diz que houve irregularidade | Atp:108 | presente | PASS |
| Q12 | Só o conteúdo do rascunho | Atp:105-108 | acrescenta o teste 2009–2026, os métodos descartados e a base de valores | FAIL |

## A. Acessibilidade

| ID | Esperado | Medido | Resultado |
| --- | --- | --- | --- |
| A01 | Contraste ≥ 4,5:1 nos textos dos avisos | menor: `#555B66` sobre `#FFF7E0`, 6,39:1 | PASS |
| A02 | Contraste na linha sem aviso e no resumo | 6,83:1 e 6,78:1 | PASS |
| A03 | Links do aviso ≥ 44 px no celular | 44 px | PASS |
| A04 | "Ver mais" ≥ 44 px no celular | `min-h-11` no `summary` | PASS |
| A05 | Links em frase ≥ 44 px no celular | "Como calculamos", "2024 (1 aviso)", "2025 (2 avisos)": 44 px | PASS |
| A06 | Ícone e rótulos visuais com `aria-hidden` | presente | PASS |
| A07 (novo) | Contraste nos cartões do salto (fundo branco) | `#555B66` 6,83:1; `#15181E` 17,8:1; `#6B4B00` 7,98:1 | PASS |

## Propostas como intencionais (precisam de aprovação)

O coordenador manteve estas de propósito. Contam como FAIL acima.

| ID | Divergência | Justificativa dada |
| --- | --- | --- |
| M09 | Texto curto do celular em média mensal, não em total anual | O método aprovado pelo usuário é a média mensal; o artboard do celular é anterior a ele |
| M18 | Links do aviso no celular com 44 px em vez de ≈ 37 px | Regra de acessibilidade do projeto (alvo de toque de 44 px) |
| Q03 | Metodologia com abertura e três subtítulos | Segue a estrutura das outras seções da página |
| Q04 | Parágrafos da metodologia 16 px `#15181E` | Segue o estilo do resto de `/metodologia` |
| Q12 | Conteúdo além do rascunho (teste histórico, métodos descartados) | Documenta o teste histórico |

## Observações fora da contagem

1. Valores fixos do texto saem no formato monetário do projeto, "R$ 5.000", e não "R$ 5 mil" como no artboard (D30,
   Q08, Q10). Na rodada 1, Q08 e Q10 já foram aceitos com esse formato; mantive o mesmo critério em D30.
2. Build: ver a seção "Antes de medir". Antes de publicar, convém um build sem o cache do Turbopack.
3. No celular, o título curto do salto ("Manutenção de escritório de apoio à atividade parlamentar: 13 vezes mais que
   em 2024") e os cartões do salto (empilhados, 298 px) não têm artboard de referência. Não foram pontuados.
4. Continuam de antes desta feature: "distrito federal" em minúsculas no nome do tipo, e o filtro de ano oculto no
   celular.
5. Os links de ano do resumo do mandato passaram de peso 400 para 600, e no celular agora quebram para a linha de
   baixo de "comparado ano a ano:". Nenhum artboard mostra esse resumo; não foi pontuado.

## Resultado

| Seção | PASS | FAIL | Total |
| --- | --- | --- | --- |
| T. Cores | 8 | 0 | 8 |
| D. Desktop | 44 | 0 | 44 |
| M. Celular | 20 | 2 | 22 |
| Q. Metodologia | 9 | 3 | 12 |
| A. Acessibilidade | 7 | 0 | 7 |
| **Total** | **88** | **5** | **93** |

**Paridade = 88 ÷ 93 = 94,6%** (meta ≥ 95%: não atingida por 0,4 ponto, só por causa das 5 intencionais).

Se as 5 propostas como intencionais forem aprovadas: 88 ÷ 88 = **100%**.

Rodada 1 → rodada 2: 71,1% → 94,6%. Os 21 FAILs não intencionais da rodada 1 viraram PASS.

## Aprovação

Em 12/11/2026 às 15:29 (horário de Brasília), o usuário aprovou na thread do projeto as 5 divergências propostas como intencionais (M09, M18, Q03, Q04, Q12). Com elas fora do denominador, a paridade desta rodada é de **100% (88 de 88)**.
