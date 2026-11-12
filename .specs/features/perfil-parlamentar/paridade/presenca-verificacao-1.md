# Verificação 1: presença sem licenças (T30)

- Data: 11/11/2026
- Verificador independente e adversarial (autor ≠ verificador). Nada do autor foi tomado como evidência.
- Worktree: `/home/leonardo/workspace/pessoal/auditaja-wt/presenca-licencas`, branch `feat/presenca-sem-licencas`.
  No início havia `src/lib/exercicio.ts` e `tests/unit/exercicio.test.ts` modificados sem commit; durante a verificação
  o autor fez os commits `0f75ce7` (normalizar espaços do motivo) e `82d00a4` (porta do E2E). A regra lida e testada é a
  de `0f75ce7`/`82d00a4` (o arquivo não mudou depois disso).
- Fonte da verdade: `prototipo/Presenca.dc.html` (1440 px) e `prototipo/PresencaMobile.dc.html` (390 px). Não contam: os
  rótulos "1. …", "2. …", a coluna "Hoje", o aviso de dados fictícios, os números e os casos de borda como cartões
  separados (eles foram conferidos no perfil real do caso correspondente).
- Servidores: `http://localhost:3233` (seed fictício) e `http://localhost:3232` (banco `auditaja_presenca_dev`, dados
  reais). Nenhum foi parado ou reiniciado.
- Método: Playwright (Chromium 1228) em 1440×900 e 390×844, `innerText`, `getComputedStyle`, `getBoundingClientRect`,
  cliques reais. Consultas só de leitura ao banco. 5 históricos baixados da API da Câmara (226075, 204494, 73806, 122195,
  74581), 1 s entre requisições, User-Agent do projeto. Scripts e respostas em
  `/tmp/claude-1000/-home-leonardo-workspace-pessoal-auditaja/5becaf51-0e0a-464f-928b-ecef9b60c819/scratchpad/verif/`.
- Divergências pré-existentes, fora do escopo desta mudança e já registradas na verificação 5 ("Ver na fonte" no desktop,
  "ver original" no celular), não foram pontuadas.

## Rubrica

### Visual

| ID   | Resultado | Evidência medida (implementação) | Esperado (prancha) |
| ---- | --------- | -------------------------------- | ------------------ |
| PV01 | PASS | Cartão D (73806): fundo `#F6F6F3`, raio 12 px, padding 16 px, gap 6 px | Presenca:38 |
| PV02 | PASS | Título 13 px `#555B66`; valor Space Grotesk 26 px/700; detalhe 12 px `#555B66` | Presenca:39-41 |
| PV03 | PASS | Linha extra 12 px `#555B66`; link "ver períodos" `#1F4FD1`, sublinhado | Presenca:42 |
| PV04 | PASS | Selo fora D: fundo `#FFFFFF`, texto `#3D424B`, borda `1px dashed #80858E`, 13 px/700, padding 5px 11px, raio 8 px | Presenca:68, 135 |
| PV05 | PASS | Selo fora M: mesmas cores e borda, 12 px/700, padding 3px 9px, raio 6 px | PresencaMobile:45, 79 |
| PV06 | PASS | Quadro D: fundo `#F6F6F3`, raio 12 px, padding 16 px, gap 10 px | Presenca:73 |
| PV07 | PASS | Título do quadro D 15 px/700, margem 0 | Presenca:74 |
| PV08 | PASS | `ul` sem marcador, padding 0, gap 6 px; `li` 14 px, linha com quebra, gap 4/16 px; datas 200 px, `tabular-nums`, peso 400; motivo `#3D424B` | Presenca:75-77 |
| PV09 | PASS | Nota do quadro D 13 px `#3D424B`, line-height 19,5 px (1,5) | Presenca:79 |
| PV10 | PASS | Quadro M: fundo `#F6F6F3`, raio 10 px, padding 12 px, gap 8 px, margin-top 8 px | PresencaMobile:50 |
| PV11 | PASS | Título do quadro M 14 px/700 | PresencaMobile:51 |
| PV12 | PASS | `ul` gap 8 px; `li` em coluna, gap 2 px, 13 px; datas 600 `tabular-nums`; motivo `#3D424B` | PresencaMobile:52-54 |
| PV13 | PASS | Nota do quadro M 12 px `#3D424B`, line-height 18 px (1,5) | PresencaMobile:56 |
| PV14 | PASS | Cartão M: fundo `#F6F6F3`, raio 10 px, padding 12 px, gap 4 px; título 12 px, valor 20 px, detalhe 11 px | PresencaMobile:30 |
| PV15 | FAIL | Parágrafos da metodologia 16 px / line-height 26 px | 15 px / 1,6 (Presenca:122-123). Nota: provavelmente estilo da prancha e não do produto; só o usuário aceita |

### Layout, desktop (1440 px)

| ID   | Resultado | Evidência medida | Esperado |
| ---- | --------- | ---------------- | -------- |
| PL01 | PASS | Linha extra é o 4º filho do cartão, abaixo do detalhe | Presenca:41-42 |
| PL02 | PASS | `#periodos` (y=1682) depois da lista e antes da fonte com "Ver todas as 126" (y=1861) | Presenca:73-83 |
| PL03 | PASS | Linha fora do exercício: "Partido: sem orientação" em x=631, selo em x=785 (à direita) | Presenca:66-68 |
| PL04 | PASS | Período em linha: datas (200 px) e motivo lado a lado | Presenca:76 |

### Layout, celular (390 px)

| ID   | Resultado | Evidência medida | Esperado |
| ---- | --------- | ---------------- | -------- |
| PL05 | PASS | Linha extra do cartão com `display: none` (73806, 74581, 204503) | PresencaMobile:30, 65-66 (sem linha extra) |
| PL06 | FAIL | 73806: link "Ver as 126 votações" em y=1281 e quadro em y=1318; o quadro vem **depois** do link | Quadro entre a lista e "Ver as 126 votações" (PresencaMobile:50-58) |
| PL07 | PASS | Selo em x=33, "Partido: sem orientação" em x=192 (selo primeiro) | PresencaMobile:44-46 |
| PL08 | PASS | Período em coluna: datas em cima, motivo embaixo (ambos 300 px de largura) | PresencaMobile:53 |
| PL09 | PASS | Quadro dentro do cartão "Votações recentes", acima da fonte | PresencaMobile:50-59 |

### Conteúdo

| ID   | Resultado | Evidência medida | Esperado |
| ---- | --------- | ---------------- | -------- |
| PC01 | PASS | 73806: "3 de 5 em exercício em 2026 · média da Câmara 79%" | Presenca:41 |
| PC02 | PASS | 73806: "121 votações em licença não contam · ver períodos"; seed: "1 votação em licença não conta · ver períodos" | Presenca:42 |
| PC03 | PASS | 74581 (suplente): "3 de 3 em exercício…", "123 votações antes da posse não contam · ver períodos" | Presenca:95-96 |
| PC04 | PASS | 204503 (licenciado o ano todo): "—", "Fora do exercício nas 126 votações de 2026", "Ver períodos" | Presenca:103-105 |
| PC05 | PASS | 900000002 (sem histórico): "0 de 5 em 2026 · média da Câmara 50%", "Pode incluir períodos de licença" | Presenca:113-114 |
| PC06 | PASS | 62881 e 204494 (histórico sem período no ano): só "N de 126 em exercício em 2026 · média…", sem linha extra nem quadro | Presenca:44 |
| PC07 | PASS | Selos "Em licença · não conta" (73806), "Antes da posse · não conta" (74581), "Fora do exercício · não conta" (74141, 204448) | Presenca:140; PRES-03 |
| PC08 | PASS | "Períodos fora do exercício em 2026" | Presenca:74 |
| PC09 | PASS | "01/01 a 18/07" · "Licença para Tratamento de Saúde · 115 votações" | Presenca:76-77 |
| PC10 | PASS | Nota do quadro D idêntica, com "a deputada" no seed (sexo F) e link "Como calculamos" | Presenca:79 |
| PC11 | PASS | Título M "Fora do exercício em 2026" | PresencaMobile:51 |
| PC12 | PASS | "Essas votações não contam na presença nem em "Ausências". Como calculamos" | PresencaMobile:56 |
| PC13 | PASS | Cartão M "3 de 5 em exercício", "3 de 3 em exercício" | PresencaMobile:30, 66 |
| PC14 | PASS | Cartão M 204503 "Em licença o ano todo" | PresencaMobile:65 |
| PC15 | FAIL | Fonte D "Câmara dos Deputados, Dados Abertos (votações) · coletado em 11/11/2026 09:30": não cita o histórico | "Câmara dos Deputados, API v2 /votacoes e /deputados/{id}/historico" (Presenca:82) |
| PC16 | PASS | Links "Ver todas as 126" e "Contestar" (mais "Ver na fonte", pré-existente) | Presenca:83 |
| PC17 | PASS | Fonte M "Fonte: Câmara, Dados Abertos · coletado em 11/11/2026" (mais "· ver original", pré-existente) | PresencaMobile:59 |
| PC18 | PASS | Metodologia, 1º parágrafo idêntico ao da prancha | Presenca:122 |
| PC19 | FAIL | 2º parágrafo tem a frase a mais "Enquanto o histórico de um deputado não foi coletado, a conta dele usa todas as votações do ano, e o perfil avisa." | Só "A média da Câmara é a média simples… calculada do mesmo jeito." (Presenca:123) |
| PC20 | FAIL | Sem histórico, aparece abaixo da lista (D e M) o parágrafo novo "A presença ainda pode incluir períodos de licença: o histórico de situação do deputado não foi coletado." | Nenhuma prancha tem esse elemento; o caso sem histórico (Presenca:109-115) só muda o cartão. Nota: no celular a linha do cartão some, então o parágrafo é o único aviso ali; só o usuário aceita |
| PC21 | PASS | Filtros "Todas", "Divergiu do partido", "Ausências" | Presenca:53-55 |
| PC22 | PASS | Celular: "Ver as 126 votações" | PresencaMobile:58 |

### Comportamento

| ID   | Resultado | Evidência medida | Esperado |
| ---- | --------- | ---------------- | -------- |
| PB01 | PASS | Clique em "ver períodos" (73806) → `location.hash = #periodos`, título do quadro em y=32, não coberto (`elementFromPoint` cai no h3; nenhum elemento sticky/fixed) | Presenca:42, 73 |
| PB02 | PASS | "Como calculamos" → `/metodologia#presenca`, seção em y=16 | Presenca:79; PresencaMobile:56 |
| PB03 | PASS | Seed `?votos=ausencias`: só MPV 1300 e veto 9 (PLP 45 em licença some); 73806: 2 ausências, ambas em 12/08 (em exercício) | Presenca:79 |
| PB04 | PASS | Votações fora aparecem em "Todas", com selo | Presenca:79, 140 |
| PB05 | PASS | Linha extra só com votações fora (ausente em 62881 e 204494) | Presenca:44 |
| PB06 | PASS | Denominador só em exercício: 73806 126 − 121 = 5 | Presenca:44 |
| PB07 | PASS | Votações por período somam o total fora: 73806 115 + 6 = 121; 226075 113 + 2 = 115 | Presenca:76-77 |
| PB08 | PASS | Média da Câmara 79% na página; cálculo independente (SQL próprio, 513 deputados em exercício, `pres ÷ (126 − fora)`) também 79% | Presenca:123 |

## Paridade

- PASS 49, FAIL 5 (PV15, PL06, PC15, PC19, PC20).
- **Paridade = 49 ÷ 54 = 90,7%** (meta ≥ 95%: **não atingida**).

## Checagem adversarial da regra (fora da porcentagem)

Conferência com a API: para os 5 deputados baixados, `periodosForaDoExercicio` (rodado via `tsx` sobre o JSON da API)
gera exatamente os períodos gravados no banco real. Dia de saída às 00:00, saída em outro horário (dia seguinte),
reassunção em qualquer horário, renovações seguidas, legislaturas misturadas (73806 traz 49 e 57; 74581 traz 51 a 57) e
eventos fora de ordem (os 5 vêm desordenados da API) estão corretos.

| # | Severidade | Achado | Reprodução |
| - | ---------- | ------ | ---------- |
| A1 | Média | Evento "Alteração de partido" durante uma licença vira um período novo cujo **motivo** é "Alteração de partido". A contagem fica certa, mas o quadro mostraria um motivo falso. Hoje acontece em 2024 (2 deputados), então não aparece no quadro de 2026, mas acontece de novo na próxima troca de partido durante licença | API 204494: `2024-02-07T00:00 Licença 'Alteração de partido'` → períodos "13/12/2023–06/02/2024 Afastamento Conjunto Consecutivo" e "07/02–11/04/2024 Alteração de partido". Banco: `select * from periodo_fora_exercicio where motivo='Alteração de partido'` (204494, 204566) |
| A2 | Média | Testes não pegam dois erros plausíveis (detalhes na seção de testes). Um deles (perder período de 1 dia) mudaria números reais | M1 e M2 abaixo |
| A3 | Média (dados) | 15 votos registrados dentro de períodos fora do exercício. 220584 votou nas 8 votações de 28/05/2026, 1º dia da licença; 220659 votou nas 7 votações de 09/02/2026, dentro da licença de 03/02 a 02/06/2026. O voto conta, então o numerador não sofre, mas mostra que o histórico pode não bater com o exercício real; nesses dias uma votação perdida sai do denominador. Não deu para baixar o histórico de 220659 (limite de 5): falta investigar se falta uma reassunção ou se a licença foi registrada retroativamente | `select v.parlamentar_id, vt.data, v.voto from voto v join votacao vt … join periodo_fora_exercicio pf … where v.voto<>''` |
| A4 | Média (ambiente) | O banco real tem `sexo` nulo nos 648 deputados; o código cai no masculino. Roseana Sarney (73806) aparece como "o deputado estava em exercício" no quadro. Falta rodar a coleta de sexo nesse banco; o código podia ter um texto neutro para `sexo` nulo | `select sexo, count(*) from parlamentar group by 1` → `|648`; desktop 73806, nota do quadro |
| A5 | Baixa | Plural fixo no caso "sem nenhuma votação em exercício": com uma única votação fora sai "Fora do exercício nas 1 votações de AAAA" | `src/app/parlamentares/[id]/page.tsx`, `detalhe`: `` `Fora do exercício nas ${fora} votações de ${votacoes.ano}` `` |
| A6 | Baixa | "o ano todo" no celular nem sempre é verdade: só quer dizer zero votações em exercício. 74141 (renúncia em 03/01/2026) esteve em exercício em 01 e 02/01 e mostra "Fora do exercício o ano todo" | 390 px, `/parlamentares/74141` |
| A7 | Baixa | Períodos repetidos ou vazios no quadro: um CONVOCADO no meio de uma SUPLENCIA quebra períodos idênticos (226075: "12/09–18/09/2024" e "19/09/2024–28/12/2025", ambos "Impossibilidade de Assumir o Mandato"); período de 1 dia sai como "08/07 a 08/07"; períodos sem votação aparecem com "· 0 votações" (122195: "08/07 a 08/07 · Convocação Eleito ou Suplente · 0 votações", "desde 06/11 · … · 0 votações"). As pranchas só mostram períodos com votações | Desktop `/parlamentares/122195`; simulação de 226075 |
| A8 | Baixa | A metodologia e a nota do quadro falam em "licença, afastamento, suplência ou antes da posse", mas também saem da conta vacância (24 períodos) e suspensão (3 períodos, por exemplo 152605 de 12/12/2025 a 11/06/2026). A spec (PRES-01) cita vacância; suspensão não está em lugar nenhum | `select situacao, count(*) from periodo_fora_exercicio group by 1` |
| A9 | Baixa | Média e perfil usam critérios diferentes para saber se há histórico: o perfil só usa os períodos se `historico_coleta_id` não for nulo; o SQL da média usa os períodos que existirem. Só diverge com períodos sem coleta marcada (hoje 648 de 648 coletados). A média também só entra quem está `em_exercicio` hoje | `src/data/perfil.ts`, `presencaMediaDaCamara` × `perfilParlamentar` |
| A10 | Baixa | Empate de `dataHora` mantém a ordem da API, que não vem ordenada; não há desempate (por exemplo, `Exercício` por último). 226075 tem 2 eventos em `2025-12-29T19:52` (inofensivos aqui) | `toSorted` só por `dataHora` |
| A11 | Info | Selo e contraste: o selo diz "não conta" em texto (não depende só da borda); texto `#3D424B`/`#FFFFFF` 10,1:1; borda tracejada `#80858E`/`#FFFFFF` 3,71:1 (≥ 3:1, WCAG 1.4.11); links sublinhados. "ver períodos" só aparece quando há votações fora, e nesse caso o quadro `#periodos` sempre existe (períodos de votações do ano estão em `periodosNoAno`). Situações SUPLENCIA, CONVOCADO, SUSPENSO e VACANCIA tiram do exercício e caem em "Fora do exercício" | Medições acima |
| A12 | Info | O motivo vem do último trecho da descrição da Câmara. A prancha mostra "Afastamento com prazo determinado" (trecho do meio), mas na API real o último trecho é, por exemplo, "Afastamento Conjunto Consecutivo", pouco claro para o leitor. Não está errado pela spec ("motivo da Câmara"); fica registrado para o usuário | API 73806 |
| A13 | Info | Ano sem votações não ocorre no perfil: o ano das votações é o maior ano com votação no banco inteiro. Se `elegiveis = 0` e `fora = 0`, a página mostraria "0 de 0 em exercício em AAAA" (caso teórico) | `perfil.ts`, `anoVotos` |

## Testes unitários

`pnpm vitest run tests/unit` no worktree: **11 arquivos, 114 testes, todos passam** (1,05 s).

Discriminação: rodei `tests/unit/exercicio.test.ts` (21 testes) contra cópias com mutações de `src/lib/exercicio.ts`
(cópia no scratchpad, por alias do Vite; o projeto não foi alterado):

| Mutante | Resultado |
| ------- | --------- |
| M1 `fechar` exige `fim > inicio` (some período de 1 dia) | **sobrevive** (21/21 passam). No dado real, sumiriam o CONVOCADO de 08/07/2026 (122195) e o de 11/09/2024 (226075), e votações nesses dias voltariam a contar |
| M2 motivo novo sempre começa no dia do evento (tira o dia de uma saída feita à tarde) | **sobrevive** (21/21) |
| M3 saída às 00:00 só no dia seguinte | morto (4 falhas) |
| M4 saída sempre no próprio dia | morto (3) |
| M5 reassunção tira o próprio dia | morto (11) |
| M6 sem ordenar os eventos | morto (1) |
| M7 voto dentro da licença não conta | morto (1) |
| M8 renovações não se juntam | morto (1) |
| M9 sem recorte do período ao ano | morto (2) |
| M10 tipos misturados viram "licenca" | morto (1) |
| M11 CONVOCADO antes da posse abre um período | morto (2) |
| M12 `periodoDoDia` exclui o último dia | morto (2) |

Faltam testes para: período de 1 dia, motivo novo no dia de uma saída feita à tarde, "Alteração de partido" durante a
licença (A1), plural com 1 votação (A5) e empate de `dataHora` (A10).
