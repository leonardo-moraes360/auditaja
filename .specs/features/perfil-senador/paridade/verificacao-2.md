# Verificação 2 de paridade do perfil do senador

- Data: 11/11/2026
- Verificador independente (autor ≠ verificador). Na dúvida, FAIL.
- Servidor: http://127.0.0.1:3243 (produção do worktree `feat/senadores`, já com as correções, banco `auditaja_senado_dev`)
- Worktree: `git rev-parse --short HEAD` = `96e0fc0`; `git status --porcelain` vazio antes desta verificação
- Páginas: `/parlamentares/10005672` (Alan Rick, titular), `/parlamentares/10006358` (Ana Paula Lobato, 1ª suplente em
  exercício), `/parlamentares/10005988` (Soraya Thronicke, trocou de partido no ano), `/parlamentares/10000022` (para o
  filtro "Divergiu da liderança"), `/parlamentares?casa=senado`, `/parlamentares`, `/parlamentares?casa=xyz`.
- Viewports: 1440×900 e 390×844 (`isMobile`, `hasTouch`). Chromium 1228 via Playwright.
- Protótipo: os mesmos HTML renderizados da verificação 1 (`prototipo/*.dc.html` com os `sc-for` expandidos).
- Método: `getComputedStyle` e `getBoundingClientRect` com os seletores da verificação 1 (`q1.js`, `q2.js`) mais
  consultas novas para o Mandato, a lista e as votações; texto visível; comparação item a item com os JSON da
  verificação 1 para achar regressões. Scripts e JSON em
  `/tmp/claude-1000/-home-leonardo-workspace-pessoal-auditaja/774d31fe-0b00-44bd-b576-a405d3cd5888/scratchpad/verif2/par/`.
- Regressões: comparei os JSON da verificação 1 com os desta. Só mudaram as medidas ligadas às correções (altura do
  gráfico, Mandato, textos de correção, rótulo curto da liderança, ordem vertical). Nenhum token de cor, fonte, raio ou
  padding mudou nos itens que já passavam.

## Divergências usadas na pontuação

- Aceitas (valem): I1, I2, I4, I5, I6, I7, I9, e a I8 substituída pela SCEAPS-06.
- **Propostas e ainda não aceitas** (`divergencias-propostas.md`): I10 (C18), I11 (V12, V13, V14), I12 (C29), I13 (P10),
  I14 (M12 e parte de C32). Contam como FAIL na pontuação (a). Na pontuação (b), saem do denominador.

## O que mudou desde a verificação 1

| ID | Verificação 1 | Agora | Evidência medida |
| --- | --- | --- | --- |
| V12 | FAIL | **FAIL** (I11 proposta) | "Contestar um dado" (D) e "Contestar dado" (M): borda `#C9CAC2`; protótipo `#80858E` |
| V13 | FAIL | **FAIL** (I11 proposta) | "Divergiu da liderança" e "Ausências" inativos: borda `#C9CAC2` |
| V14 | FAIL | **FAIL** (I11 proposta) | linha de base do gráfico `1px #C9CAC2` (D e M) |
| V23 | FAIL | **FAIL** | marca com `letter-spacing` −0,55 px no D (84 px de largura) e −0,475 px no M (73 px); protótipo −0,44 px (85 px) e `normal` (77 px). Não foi corrigido nem proposto como divergência |
| L14 | FAIL | PASS | gráfico D com 211 px (`border-box`, padding-top 10, borda 1): 200 px úteis, igual ao protótipo |
| M12 | FAIL | **FAIL** (I14 proposta) | celular: Bens (y=1821) antes de Mandato (y=2035) |
| M13 | FAIL | PASS | celular: `dl` compacto "Período 01/02/2023 a 31/01/2031", "Situação", "Bloco", "Suplentes Gemil Junior (1º) · Coronel Casagrande (2º)", 103 px de altura (protótipo 103) |
| C18 | FAIL | **FAIL** (I10 proposta) | "Prestador pessoa física · — · R$ …" |
| C24 | FAIL | PASS | 6 votações no resumo do desktop (Alan, Ana e Soraya) |
| C29 | FAIL | **FAIL** (I12 proposta) | Ana Paula Lobato: "Lourdinha Pereira · 2º suplente" (D) e "Lourdinha Pereira (2º)" (M) |
| C31 | FAIL | PASS | "Agricultura e Reforma Agrária (CRA)", "Assuntos Econômicos (CAE)", "Educação e Cultura (CE)" |
| C32 | FAIL | **FAIL** (I14 proposta, parte) | "2023 · Posse para o mandato 2023–2031" e "2022 · Eleito senador por AC" passam; "2022 · Eleita 1ª suplente de senador por MA" na Ana. Falta o mandato anterior em cor clara |
| C35 | FAIL | PASS | "Senadores, assessorias e qualquer pessoa podem pedir correção de um dado deste perfil." |
| C41 | FAIL | PASS | celular: "Liderança: Sim" / "Liderança: Não" / "Liderança: Liberado" |
| C42 | FAIL | PASS | celular: "Votou (secreto)"; desktop: "Votou (voto secreto)". A SVOT-06 foi emendada pelo autor para isso (ver a ressalva em `validation.md`) |
| C44 | FAIL | PASS | celular: "Qualquer pessoa pode pedir correção de um dado deste perfil." |
| P02 | FAIL | PASS | lista: conteúdo x=144, 1152 px (D) |
| P04 | FAIL | PASS | campo e select com fonte 14 px, 40 px, raio 8, borda `#80858E` |
| P05 | FAIL | PASS | "Filtrar" 14 px/600, 40 px, raio 8, `#1F4FD1` |
| P06 | FAIL | PASS | `?casa=senado`: "81 resultado(s). Fonte: Senado Federal, Dados Abertos." e 81 cartões (D e M) |
| P09 | FAIL | PASS | avatar 48×48 com raio 8 |
| P10 | FAIL | **FAIL** (I13 proposta) | a busca do topo "Buscar deputado ou senador por nome ou UF" continua visível na lista (D) |

## Item novo

| ID | Esperado no protótipo | Página | Resultado |
| --- | --- | --- | --- |
| M14 | Mandato compacto do celular: seção com `gap: 10px`, `dl` 33 px abaixo do topo do título (SenadorMobile:106) | `gap` 14 px (`gap-3.5` do cartão compartilhado com o desktop): o `dl` fica 4 px mais baixo (dy 54 contra 50) e a seção tem 174 px contra 170 | **FAIL** (passa da tolerância de ±2 px) |

## Conferências de regressão nos itens que já passavam

- V01–V11, V15–V22, V24: tokens iguais aos da verificação 1 (D e M).
- L17: a linha da votação segue com data, proposição, orientação e voto. O rótulo longo usa agora o partido do dia
  ("Liderança do PODE: Sim" nas votações de 24/03/2026 da Soraya Thronicke, que hoje é do PSB). A lacuna 6 da
  verificação 1 está corrigida na tela.
- L21: o Mandato do desktop bate ao pixel com o protótipo. O `dl` fica em dy=58, Suplentes em 235, a lista em 266,
  a nota em 320, Comissões em 392 e Linha do tempo em 500 (no protótipo, 496: a lista real tem 3 comissões contra 2).
- B05: "Divergiu da liderança" no Esperidião Amin mostra 1 linha (PLP 18/2021). "Ausências" mostra "Nenhuma votação
  neste filtro." no Alan e 6 linhas na Ana.
- B13: `?casa=xyz` marca "Todos (81)" com `aria-current=page`.
- M10 e P11: `scrollWidth` = 390 no perfil e na lista.

Os demais itens (B01–B04, B06–B12) dependem de código que não mudou desde `187abaf`. Mantêm o resultado da
verificação 1.

## Placar

- Itens: 130 (os 129 da verificação 1 mais o M14)
- N/V: 3 (L19, C10, B04). Seguem sem dados: só há TSE 2022 e CEAPS 2026 no banco real.
- FAIL: 10 (V12, V13, V14, V23, M12, M14, C18, C29, C32, P10)
  - 8 cobertos por divergência proposta e não aceita: V12, V13, V14 (I11); M12, C32 (I14); C18 (I10); C29 (I12);
    P10 (I13)
  - 2 sem cobertura: V23 e M14
- PASS: 117

**(a) Divergências propostas contadas como FAIL: 117 ÷ (117 + 10) = 92,1%.** A meta de 95% não é atingida.

**(b) Se o usuário aceitar I10 a I14, os 8 itens saem do denominador: 117 ÷ (117 + 2) = 98,3%.** A meta é atingida.

Paridade pessimista, com N/V como FAIL: (a) 117 ÷ 130 = 90,0%; (b) 117 ÷ 122 = 95,9%.

## FAILs explicados

| ID | O protótipo pede | A página mostra | Onde mexer | Observação do verificador sobre a divergência proposta |
| --- | --- | --- | --- | --- |
| V12 | Borda `#80858E` no botão secundário (Senador:59, SenadorMobile:50) | `#C9CAC2` | `src/components/perfil/estilos.ts:6` | I11: plausível, mas o motivo ("cópia da borda dos campos") é uma interpretação do autor sobre o artboard aprovado. Cabe ao usuário decidir |
| V13 | Filtros inativos com borda `#80858E` (Senador:104-106, 169-170) | `#C9CAC2` | `src/components/perfil/estilos.ts:13` | I11 |
| V14 | Linha de base `1px #80858E` (Senador:117, SenadorMobile:67) | `#C9CAC2` | `src/components/perfil/secoes.tsx:177` (`border-linha`) | I11 |
| V23 | `letter-spacing` −0,02em (D) e `normal` (M) (Senador:26, SenadorMobile:25) | `tracking-tight` (−0,025em) nos dois | `src/components/topo.tsx:20`: trocar por `tracking-normal sm:tracking-[-0.02em]` | Sem divergência proposta. A pendência X03 do deputado continua aberta |
| M12 | Celular: Gastos, Votações, **Mandato**, **Bens** (SenadorMobile:64-126) | Bens antes de Mandato | `src/app/parlamentares/[id]/page.tsx` (ordem das colunas). Dá para pôr `order` no celular ou repetir o Mandato compacto antes de Bens com `sm:hidden` | I14 diz que a lateral é "uma coluna só", mas isso é escolha de implementação, não restrição. O conserto é barato e o artboard do senador foi aprovado com essa ordem. Recomendo corrigir em vez de aceitar |
| M14 (novo) | `gap` 10 px na seção do Mandato do celular (SenadorMobile:106) | `gap` 14 px | `src/components/perfil/secoes.tsx:811`: `gap-2.5 sm:gap-3.5` só para o senador | Sem divergência proposta |
| C18 | `***.456.789-**` na coluna CNPJ/CPF (Senador:304) | "—" | não mexer | I10 é sólida: a SCEAPS-02 e a R3 proíbem guardar os dois pedaços do CPF. Recomendo aceitar |
| C29 | "1ª suplente" quando a suplente é mulher (Senador:243) | sempre "º" ("Lourdinha Pereira · 2º suplente") | `src/components/perfil/secoes.tsx:831` e `:867` | **O motivo da I12 é falso nos dados reais.** No banco, os 150 suplentes casam com uma linha de `parlamentar` por `10000000 + codigo`, todos com `sexo` (42 F). A Lourdinha Pereira tem `sexo = 'F'`. Basta um `left join` na leitura dos suplentes. Recomendo corrigir e não aceitar a I12 |
| C32 | Mandato anterior em cor clara (Senador:256) | só os marcos do mandato atual | — | I14 (parte) é coerente com o Out of Scope da spec ("Ex-senadores fora da 57ª legislatura"). Recomendo aceitar esta parte |
| P10 | Lista sem a busca do topo (ListaParlamentares:22-34) | busca visível | `src/components/topo.tsx` | I13: plausível, porque o topo é global. Cabe ao usuário decidir |

## N/V

| ID | Por quê | Como fechar |
| --- | --- | --- |
| L19 | Só há bens do TSE 2022 | Medir no seed com um senador de duas eleições, ou coletar o TSE 2014/2018 |
| C10 | Idem | Idem |
| B04 | Só há CEAPS 2026 | `pnpm ingest ceaps 2025` quando houver rede |

## Achado fora da rubrica, ligado à tela (ver `validation.md`, lacuna 1)

A tabela "Maiores fornecedores" mostra **CPF completo** dentro do nome de fornecedores MEI (razão social "NOME
SOBRENOME 12345678901"). Isso aparece no perfil de 2 senadores (10003806, 10004639) e no CSV de 14. A paridade
visual não pontua isso, mas é uma violação da R3 na tela.
