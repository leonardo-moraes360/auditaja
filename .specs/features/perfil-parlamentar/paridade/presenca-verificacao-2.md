# Verificação 2: presença sem licenças (T30)

- Data: 11/11/2026
- Verificador independente e adversarial (autor ≠ verificador), mesmo rigor da verificação 1. Nada do autor foi tomado
  como evidência.
- Worktree `/home/leonardo/workspace/pessoal/auditaja-wt/presenca-licencas`, HEAD `758c9b0` (sem mudanças de código
  fora do commit; não rastreados só as pranchas e o relatório 1).
- Fonte da verdade: `prototipo/Presenca.dc.html` (1440 px) e `prototipo/PresencaMobile.dc.html` (390 px), com as mesmas
  exclusões da verificação 1.
- Nenhuma consulta nova à API da Câmara: usei as 5 respostas salvas em `scratchpad/verif/api/`.

## Problema de ambiente (antes de tudo)

Os servidores **3232 e 3233 não estavam com o build novo**. Os processos `next-server` nas portas 3232 (pid 1565490) e
3233 (pid 1572558) subiram às 14:08 e 14:09; o `.next/BUILD_ID` é das 14:22:32, depois do commit `758c9b0` (14:22:22).
Eles continuam servindo o código antigo: no 3232 o celular ainda dizia "Em licença o ano todo", o 122195 ainda listava
"08/07 a 08/07 · … · 0 votações" e o 3233 ainda mostrava o parágrafo "A presença ainda pode incluir…". Só o banco
(recoletado, com sexo) era novo.

Não parei nem reiniciei esses servidores. Para medir o build novo, subi dois servidores temporários do mesmo `.next`:
**3242** (banco `auditaja_presenca_dev`, pelo `.env.local`) e **3253** (banco `auditaja_presenca_test`, o mesmo do 3233).
A porta 3243 já estava ocupada por outro processo, que não toquei. Toda a rubrica abaixo foi medida no 3242 e no 3253, e
os dois servidores foram encerrados no fim. **Os servidores 3232 e 3233 precisam ser reiniciados** antes de qualquer outra
checagem neles.

## Rubrica

Na tabela, "pendente" quer dizer FAIL pendente de aceite do usuário. O item continua no denominador.

### Visual

| ID   | Resultado | Evidência medida (implementação) | Esperado (prancha) |
| ---- | --------- | -------------------------------- | ------------------ |
| PV01 | PASS | Cartão D (73806): fundo `#F6F6F3`, raio 12 px, padding 16 px, gap 6 px | Presenca:38 |
| PV02 | PASS | Título 13 px `#555B66`; valor Space Grotesk 26 px/700; detalhe 12 px `#555B66` | Presenca:39-41 |
| PV03 | PASS | Linha extra 12 px `#555B66`; "ver períodos" `#1F4FD1`, sublinhado | Presenca:42 |
| PV04 | PASS | Selo D: fundo `#FFFFFF`, texto `#3D424B`, `1px dashed #80858E`, 13 px/700, 5px 11px, raio 8 px | Presenca:68, 135 |
| PV05 | PASS | Selo M: mesmas cores e borda, 12 px/700, 3px 9px, raio 6 px | PresencaMobile:45, 79 |
| PV06 | PASS | Quadro D: fundo `#F6F6F3`, raio 12 px, padding 16 px, gap 10 px | Presenca:73 |
| PV07 | PASS | Título do quadro D 15 px/700, margem 0 | Presenca:74 |
| PV08 | PASS | `ul` sem marcador, gap 6 px; `li` 14 px, linha com quebra, gap 4/16 px; datas 200 px `tabular-nums` peso 400; motivo `#3D424B` | Presenca:75-77 |
| PV09 | PASS | Nota do quadro D 13 px `#3D424B`, line-height 19,5 px | Presenca:79 |
| PV10 | PASS | Quadro M: fundo `#F6F6F3`, raio 10 px, padding 12 px, gap 8 px, margin-top 8 px | PresencaMobile:50 |
| PV11 | PASS | Título do quadro M 14 px/700 | PresencaMobile:51 |
| PV12 | PASS | `ul` gap 8 px; `li` em coluna, gap 2 px, 13 px; datas 600 `tabular-nums`; motivo `#3D424B` | PresencaMobile:52-54 |
| PV13 | PASS | Nota do quadro M 12 px `#3D424B`, line-height 18 px | PresencaMobile:56 |
| PV14 | PASS | Cartão M: fundo, raio 10 px, padding 12 px, gap 4 px; 12 / 20 / 11 px | PresencaMobile:30 |
| PV15 | FAIL (pendente) | Parágrafos da metodologia 16 px / 26 px | 15 px / 1,6 (Presenca:122-123) |

### Layout, desktop (1440 px)

| ID   | Resultado | Evidência medida | Esperado |
| ---- | --------- | ---------------- | -------- |
| PL01 | PASS | Linha extra é o 4º filho do cartão, abaixo do detalhe | Presenca:41-42 |
| PL02 | PASS | `#periodos` em y=1682, antes da fonte com "Ver todas as 126" (y=1884) | Presenca:73-83 |
| PL03 | PASS | "Partido: sem orientação" em x=631, selo em x=785 | Presenca:66-68 |
| PL04 | PASS | Datas (200 px) e motivo lado a lado | Presenca:76 |

### Layout, celular (390 px)

| ID   | Resultado | Evidência medida | Esperado |
| ---- | --------- | ---------------- | -------- |
| PL05 | PASS | Linha extra do cartão com `display: none` (73806, 74581, 204503) | PresencaMobile:30, 65-66 |
| PL06 | PASS | 73806: quadro em y=1289 e "Ver as 126 votações" em y=1478 (quadro antes do link); depois vem a fonte | PresencaMobile:50-58 |
| PL07 | PASS | Selo em x=33, "Partido: sem orientação" em x=192 | PresencaMobile:44-46 |
| PL08 | PASS | Período em coluna, datas em cima | PresencaMobile:53 |
| PL09 | PASS | Quadro dentro do cartão "Votações recentes", acima da fonte | PresencaMobile:50-59 |

### Conteúdo

| ID   | Resultado | Evidência medida | Esperado |
| ---- | --------- | ---------------- | -------- |
| PC01 | PASS | 73806: "3 de 5 em exercício em 2026 · média da Câmara 79%" | Presenca:41 |
| PC02 | PASS | 73806: "121 votações em licença não contam · ver períodos"; seed: "1 votação em licença não conta · ver períodos" | Presenca:42 |
| PC03 | PASS | 74581: "123 votações antes da posse não contam · ver períodos" | Presenca:95-96 |
| PC04 | PASS | 204503: "—", "Fora do exercício nas 126 votações de 2026", "Ver períodos" | Presenca:103-105 |
| PC05 | PASS | 900000002 D: "0 de 5 em 2026 · média da Câmara 50%", "Pode incluir períodos de licença" | Presenca:113-114 |
| PC06 | PASS | 62881 e 204494: sem linha extra nem quadro | Presenca:44 |
| PC07 | PASS | "Em licença · não conta" (73806, 204503), "Antes da posse · não conta" (74581), "Fora do exercício · não conta" (204448, 74141) | Presenca:140; PRES-03 |
| PC08 | PASS | "Períodos fora do exercício em 2026" | Presenca:74 |
| PC09 | PASS | "01/01 a 18/07" · "Licença para Tratamento de Saúde · 115 votações" | Presenca:76-77 |
| PC10 | PASS | Nota D idêntica, com "a deputada" para 73806 (sexo F agora preenchido) e 226075; "o deputado" para 74581 | Presenca:79 |
| PC11 | PASS | "Fora do exercício em 2026" | PresencaMobile:51 |
| PC12 | PASS | "Essas votações não contam na presença nem em "Ausências". Como calculamos" | PresencaMobile:56 |
| PC13 | PASS | "3 de 5 em exercício", "3 de 3 em exercício" | PresencaMobile:30, 66 |
| PC14 | FAIL (pendente) | 204503 M: "Em licença em todas as votações"; 74141 M: "Fora do exercício em todas as votações" | "Em licença o ano todo" (PresencaMobile:65) |
| PC15 | PASS | Fonte D: "Câmara dos Deputados, Dados Abertos (votações e histórico de situação dos deputados) · coletado em 11/11/2026 09:30". Nota: cita o histórico como a prancha; a forma "Dados Abertos (…)" em vez de "API v2 /…" segue o rótulo já aceito na verificação 5 | Presenca:82 |
| PC16 | PASS | "Ver todas as 126" e "Contestar" (mais "Ver na fonte", pré-existente) | Presenca:83 |
| PC17 | PASS | M: "Fonte: Câmara, Dados Abertos · coletado em 11/11/2026" (mais "· ver original", pré-existente) | PresencaMobile:59 |
| PC18 | FAIL (pendente) | 1º parágrafo da metodologia agora diz "licença, afastamento, suplência, vacância, suspensão ou antes da posse" | "licença, afastamento, suplência ou antes da posse" (Presenca:122). É a correção do A8 da rodada 1, mas diverge do texto aprovado |
| PC19 | FAIL (pendente) | 2º parágrafo ainda tem "Enquanto o histórico de um deputado não foi coletado…" | Presenca:123 |
| PC20 | PASS | Sem histórico (900000002): o parágrafo abaixo da lista sumiu (D e M) e não há `#periodos` | Presenca:109-115 (só o cartão muda) |
| PC21 | PASS | Filtros "Todas", "Divergiu do partido", "Ausências" | Presenca:53-55 |
| PC22 | PASS | "Ver as 126 votações" | PresencaMobile:58 |
| PC23 | FAIL (pendente) | **Novo nesta rodada.** Cartão M sem histórico: "0 de 5 · pode incluir licenças". Nenhuma prancha de celular mostra o caso sem histórico, e o cartão do celular nas pranchas nunca traz aviso. Nota: substitui o parágrafo do PC20; o usuário decide | Sem referência (PresencaMobile:30, 65-66) |

### Comportamento

| ID   | Resultado | Evidência medida | Esperado |
| ---- | --------- | ---------------- | -------- |
| PB01 | PASS | Clique em "ver períodos" → `#periodos`; título em y=32, sem nada sticky ou fixed por cima | Presenca:42, 73 |
| PB02 | PASS | "Como calculamos" → `/metodologia#presenca`, seção em y=16 | Presenca:79; PresencaMobile:56 |
| PB03 | PASS | Seed `?votos=ausencias`: só MPV 1300 e veto 9 (PLP 45 some); 73806: 2 ausências | Presenca:79 |
| PB04 | PASS | PLP 45 aparece em "Todas" com "Em licença · não conta" | Presenca:79, 140 |
| PB05 | PASS | Linha extra só com votações fora | Presenca:44 |
| PB06 | PASS | 73806: 126 − 121 = 5 | Presenca:44 |
| PB07 | PASS | 73806: 115 + 6 = 121; 226075: 113 + 2 = 115; 122195: 113 = 113 | Presenca:76-77 |
| PB08 | PASS | Página 79%; SQL independente sobre o banco recoletado (513 deputados) também 79% | Presenca:123 |
| PB09 | PASS | **Novo.** O quadro só lista períodos com votações: 122195 mostra só "01/01 a 07/07 · … · 113 votações" (somem "08/07" e "desde 06/11", com 0 votações) | Presenca:76-77; PresencaMobile:53-54 |

## Paridade

- 56 itens: PASS 51, FAIL 5 (PV15, PC14, PC18, PC19, PC23), todos pendentes de aceite do usuário.
- **Paridade = 51 ÷ 56 = 91,1%** (meta ≥ 95%: **não atingida**). Se o usuário aceitar os 5 itens pendentes, nenhum
  outro item falha.
- Diferença para a rodada 1: PL06, PC15 e PC20 passaram a PASS. PC14 e PC18 passaram a FAIL pendente, por causa das
  mudanças de texto pedidas nos achados A6 e A8. PC23 e PB09 são itens novos.

## Aceite do usuário (11/11/2026)

O usuário aceitou na thread os 5 itens pendentes (PV15, PC14, PC18, PC19, PC23) como divergências intencionais
(IP1 a IP5). Com eles fora do denominador: **paridade = 51 ÷ 51 = 100%** (meta ≥ 95% atingida).

| ID  | Item | Divergência aceita |
| --- | ---- | ------------------ |
| IP1 | PV15 | Metodologia em 16 px, como o resto da página |
| IP2 | PC14 | Celular: "Em licença em todas as votações" em vez de "o ano todo" |
| IP3 | PC18 | Metodologia cita vacância e suspensão |
| IP4 | PC19 | Metodologia explica a conta sem histórico coletado |
| IP5 | PC23 | Celular sem histórico: "N de M · pode incluir licenças" |

Depois desta verificação: B2 (testes de vizinhos não colados) e B3 (mudança de situação sem prefixo abre período)
foram corrigidos com testes no commit seguinte; B4, A3, A9 e A10 ficam registrados como limitações.

## Checagem adversarial

### Achados da rodada 1

| # | Situação | Evidência |
| - | -------- | --------- |
| A1 "Alteração de partido" vira motivo | Resolvido | Simulação de 204494 e banco: um período só, "13/12/2023–11/04/2024 Afastamento Conjunto Consecutivo"; nenhum motivo com "partido" no banco (605 períodos) |
| A2 testes M1/M2 | Resolvido | M1 e M2 agora morrem (tabela abaixo) |
| A3 votos dentro de períodos | **Aberto** | 220584 (28/05/2026, 8 votos) e 220659 (09/02/2026, 7 votos dentro da licença de 03/02 a 02/06) continuam iguais depois da recoleta |
| A4 sexo nulo | Resolvido (dados) | `sexo`: M 530, F 118; 73806 aparece como "a deputada" |
| A5 plural | Resolvido no código, sem caso real | `page.tsx`: "Fora do exercício na única votação de AAAA" quando `fora === 1`; nenhum deputado do banco cai nesse caso |
| A6 "o ano todo" | Texto trocado; vira o PC14 pendente | — |
| A7 períodos repetidos ou vazios | Resolvido | 226075: "12/09/2024–08/07/2026 Impossibilidade…" num período só; 122195 sem as linhas de 0 votações. Período de um dia com data única: o código faz isso (`intervalo`), mas não há caso real com votação para medir |
| A8 metodologia sem vacância e suspensão | Resolvido; vira o PC18 pendente | — |
| A9 média × perfil (`historico_coleta_id`) | Aberto (baixa) | Sem mudança em `perfil.ts` |
| A10 empate de `dataHora` | Aberto (baixa) | Sem desempate |

### Achados novos

| # | Severidade | Achado | Reprodução |
| - | ---------- | ------ | ---------- |
| B1 | Alta (ambiente) | 3232 e 3233 rodam o código anterior ao `758c9b0` (ver "Problema de ambiente"). Quem conferir nesses servidores verá os defeitos antigos | `ps -o lstart -p 1565490 1572558` × `ls -l --time-style=full-iso .next/BUILD_ID` |
| B2 | Média | `juntarVizinhos` sem teste de contiguidade: os mutantes M20 (junta mesmo com intervalo entre os períodos) e M21 (aceita 1 dia de intervalo) sobrevivem. Nos dados reais, M20 juntaria os dois períodos de 204448 ("05/02 a 22/02" e "desde 03/03", ambos "Afastamento de Suplente (automático)"). Assim, as 10 votações de 24/02, 25/02 e 02/03, em que o deputado estava em exercício, sairiam da conta. Também juntaria os períodos de 2024 e 2025 de 73806 | Tabela de mutantes; banco `periodo_fora_exercicio` de 204448 |
| B3 | Baixa | O filtro de registro avulso pula qualquer evento sem "Saída -"/"DIVERSO -" enquanto o deputado está fora, **mesmo quando a situação muda**. Uma passagem de Licença para VACANCIA com descrição nula fica como "Licença" (selo e motivo errados; a contagem não muda). Simulado; nos 5 históricos salvos, todo evento com mudança real de situação tem esse prefixo (ou "Entrada -" para Exercício) | `tsx`: `[posse, Licença 'Saída - A - Saúde' 01/03 10:00, VACANCIA null 01/04]` → um período só, "Licença", desde 02/03 |
| B4 | Baixa | O ramo de `Exercício` não olha se o evento é um movimento: um `Exercício` avulso ("Alteração de partido") registrado durante uma licença fecharia o período. Nos históricos salvos só aparece na 56ª legislatura (204494, 03/06/2019), com o deputado em exercício | `exercicio.ts`, `if (e.situacao === SITUACAO_EXERCICIO)` |
| B5 | Info | Sem regressões nos números: média 79%, contagens por perfil, filtro "Ausências", âncoras e links iguais aos da rodada 1; banco sem períodos sobrepostos (0 pares); banco recoletado igual à simulação da regra nova para os 5 históricos salvos | Consultas e scripts em `scratchpad/verif/` |

## Testes unitários

`pnpm vitest run tests/unit`: **11 arquivos, 118 testes, todos passam** (eram 114; agora são 25 em `exercicio.test.ts`).

Mutantes de `src/lib/exercicio.ts` (cópia no scratchpad via alias do Vite; o projeto não foi alterado), contra
`tests/unit/exercicio.test.ts`:

| Mutante | Resultado |
| ------- | --------- |
| M1 `fechar` exige `fim > inicio` (some período de 1 dia) | morto (2 falhas) |
| M2 motivo novo sempre no dia do evento | morto (1) |
| M3 saída às 00:00 só no dia seguinte | morto (6) |
| M5 reassunção tira o próprio dia | morto (15) |
| M7 voto dentro da licença não conta | morto (1) |
| M11 CONVOCADO antes da posse abre período | morto (1) |
| M13 sem o filtro de registro avulso | morto (1) |
| M14 `movimento` sempre verdadeiro | morto (1) |
| M15 `movimento` só aceita "Saída" | morto (1) |
| M16 `movimento` só aceita "DIVERSO" | morto (3) |
| M17 sem `juntarVizinhos` | morto (1) |
| M18 junta ignorando o motivo | morto (1) |
| M19 junta ignorando a situação | morto (1) |
| **M20 junta sem exigir períodos colados** | **sobrevive** (25/25) |
| **M21 junta com 1 dia de intervalo** | **sobrevive** (25/25) |
| M22 junta mas mantém o `fim` do primeiro | morto (1) |

Faltam testes para: dois períodos iguais separados por dias em exercício (devem continuar separados, B2), mudança de
situação sem prefixo durante um período (B3), `Exercício` avulso durante uma licença (B4) e empate de `dataHora` (A10).
