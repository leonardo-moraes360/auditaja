# Verificação 3 de paridade do perfil do senador

- Data: 11/11/2026
- Verificador independente (autor ≠ verificador). Na dúvida, FAIL.
- Servidor: http://127.0.0.1:3243 (build do worktree `feat/senadores` em `be9cf19`, banco `auditaja_senado_dev`
  recoletado às 15:27 com o código atual)
- Worktree: `git status --porcelain` vazio antes desta verificação
- Páginas: `/parlamentares/10005672` (Alan Rick, titular), `/parlamentares/10006358` (Ana Paula Lobato, 1ª suplente em
  exercício), `/parlamentares/10005988` (Soraya Thronicke), `/parlamentares?casa=senado`, `/parlamentares`,
  `/parlamentares?casa=xyz`.
- Viewports: 1440×900 e 390×844 (`isMobile`, `hasTouch`). Chromium 1228 via Playwright.
- Método: os mesmos scripts das verificações 1 e 2 (`q1.js`, `q2.js`, `q3.js`, `ql.js`, `qm.js`), rodados de novo e
  comparados folha a folha com os JSON da verificação 2 (`diff.py`). Mais dois scripts novos: `b03.js` (aba ativa
  durante a rolagem) e `qo.js` (ordem do DOM e ordem visual no celular). Scripts e JSON em
  `/tmp/claude-1000/-home-leonardo-workspace-pessoal-auditaja/774d31fe-0b00-44bd-b576-a405d3cd5888/scratchpad/verif3/par/`.
- Regressões: na comparação com a verificação 2, só mudaram as medidas ligadas às correções de `be9cf19`: a marca,
  a ordem no celular, o `gap` do Mandato compacto e o ordinal da suplente. Também mudaram os horários de coleta
  (houve recoleta). Nenhum token de cor, fonte, raio ou padding mudou nos outros itens. A lista (`ql-*`) e o Mandato
  do desktop (`qm-real-d`) ficaram idênticos byte a byte.

## Divergências usadas na pontuação

- Aceitas (valem): I1, I2, I4, I5, I6, I7, I9, e a I8 substituída pela SCEAPS-06.
- **Propostas e ainda não aceitas** (`divergencias-propostas.md`): I10 (C18), I11 (V12, V13, V14), I13 (P10) e
  I14, parte C32. Contam como FAIL na pontuação (a) e saem do denominador na pontuação (b).
- **Duas propostas já não divergem**, mas `divergencias-propostas.md` ainda as lista:
  - **I12 (C29)**: o ordinal agora concorda com o sexo cadastrado. A Lourdinha Pereira aparece como "2ª suplente"
    no desktop e como "(2ª)" no celular.
  - **I14, parte M12**: no celular, o Mandato vem antes de Bens.

  As duas devem sair do arquivo de divergências.

## O que mudou desde a verificação 2

| ID | Verificação 2 | Agora | Evidência medida |
| --- | --- | --- | --- |
| V23 | FAIL | **PASS** | Marca: `letter-spacing` −0,44 px e 85 px de largura no desktop (protótipo: −0,44 px e 85 px). No celular, `normal` e 77 px (protótipo: `normal` e 77 px) |
| M12 | FAIL (I14) | **PASS** | Ordem no celular: Gastos, Votações, Mandato (y=1821), Bens (2007), Fontes (2221), Encontrou um erro? (2643). Na Ana, a mesma ordem, com Mandato em 1782 e Bens em 1968 |
| M14 | FAIL | **PASS** | Mandato compacto com `gap` de 10 px. O `dl` fica em dy=50 e a seção tem 170 px, iguais ao protótipo (50 e 170) |
| C29 | FAIL (I12) | **PASS** | Desktop: "Lourdinha Pereira · 2ª suplente". Celular: "Suplentes Lourdinha Pereira (2ª)". Soraya: "Rodolfo Nogueira 1º suplente · Danny Fabricio 2º suplente" |
| **B03** | PASS | **FAIL (regressão)** | No celular, com Bens na linha de leitura, a aba ativa é **Mandato**. O `b03.js` rola até cada seção, deixando o topo dela a 15% da tela, e lê `aria-current`. Resultado: gastos→Gastos, votações→Votações, mandato→Mandato, **bens→Mandato**, fontes→Fontes. A causa está em `src/components/perfil/abas.tsx:24-30`: a função percorre os ids na ordem fixa de `ABAS` (Gastos, Votações, Bens, Mandato, Fontes) e fica com o último que passou da linha. Com o `order` do CSS, o Mandato fica acima de Bens, então ele "vence" sempre que Bens está na tela. O clique na aba "Bens" acerta, mas a primeira rolagem devolve a aba a Mandato. No desktop, o comportamento é o mesmo da verificação 2 |

## Conferências de regressão nos itens que já passavam

- V01–V22 e V24: tokens iguais aos da verificação 2, no desktop e no celular.
- M06 e M10: no celular, os cartões mudaram só no `y`. `x` e largura continuam os mesmos, e o `scrollWidth` é 390
  no perfil do Alan e no da Ana.
- L17 e C23: no resumo de 6 votações da Soraya, "Liderança do PSB: Sim". As votações em que ela era do PODE já não
  estão entre as 6 mais recentes. O partido do dia passou a ter teste: `tests/e2e/senador.spec.ts:100`.
- L20 e L21: o Mandato do desktop é idêntico ao da verificação 2 (`qm-real-d.json`, mesmo arquivo).
- P01–P11 e B13: os JSON da lista são idênticos aos da verificação 2, no desktop e no celular.
- B02: o clique em cada aba leva à seção certa no celular (topo da seção em 16 px).

Os demais itens (B01, B04–B12) dependem de código que não mudou em `be9cf19` e mantêm o resultado da verificação 2.

## Observação fora do placar (acessibilidade)

A ordem visual do celular vem de `order` com `display: contents` (`src/app/parlamentares/[id]/page.tsx:278`,
`src/components/perfil/secoes.tsx:565`, `:814`, `:818`, `:934`, `:963`). Por isso, a ordem do DOM deixou de ser a ordem visual. No DOM, Bens (com 3 links focáveis) vem antes
do Mandato, mas na tela aparece depois. Quem navega pelo teclado ou por leitor de tela percorre Bens e depois "volta"
ao Mandato. Isso é um risco para os critérios WCAG 1.3.2 e 2.4.3, e o axe não detecta. A mesma causa explica a
regressão do B03.

## Placar

- Itens: 130, os mesmos da verificação 2.
- N/V: 3 (L19, C10 e B04). Continuam sem dados, porque o banco real só tem TSE 2022 e CEAPS 2026.
- FAIL: 7.
  - 6 estão cobertos por divergência proposta e não aceita: V12, V13 e V14 (I11), C18 (I10), C32 (I14, parte) e
    P10 (I13).
  - 1 não tem cobertura: **B03**, uma regressão nova.
- PASS: 120.

**(a) Divergências propostas contadas como FAIL: 120 ÷ (120 + 7) = 94,5%.** A meta de 95% não é atingida.

**(b) Se o usuário aceitar I10, I11, I13 e a parte C32 da I14, os 6 itens saem do denominador: 120 ÷ (120 + 1) =
99,2%.** A meta é atingida.

Paridade pessimista, com N/V contado como FAIL: (a) 120 ÷ 130 = 92,3%; (b) 120 ÷ 124 = 96,8%.

Sem a regressão do B03, a pontuação (a) seria 121 ÷ 127 = 95,3%.

## FAILs explicados

| ID | O protótipo pede | A página mostra | Onde mexer | Observação do verificador |
| --- | --- | --- | --- | --- |
| B03 | A aba ativa acompanha a seção visível (Senador:88) | No celular, Bens visível com a aba Mandato ativa | `src/components/perfil/abas.tsx:24-30`: escolher a seção pelo `getBoundingClientRect().top`, não pela ordem de `ABAS`. A outra saída é ter um Mandato compacto próprio, com `sm:hidden`, na posição certa do DOM, o que resolve também a ordem de foco | Regressão criada pela correção do M12. Nenhum teste cobre a aba ativa no perfil do senador no celular |
| V12, V13, V14 | Borda `#80858E` | `#C9CAC2` | `src/components/perfil/estilos.ts:6`, `:13`; `secoes.tsx:177` | I11: cabe ao usuário decidir |
| C18 | `***.456.789-**` na coluna CNPJ/CPF | "—" | não mexer | I10 é sólida (R3 e SCEAPS-02). Recomendo aceitar |
| C32 | Mandato anterior em cor clara | só os marcos do mandato atual | — | A parte C32 da I14 é coerente com o Out of Scope. Recomendo aceitar |
| P10 | Lista sem a busca do topo | busca visível | `src/components/topo.tsx` | I13: cabe ao usuário decidir |

## N/V

| ID | Por quê | Como fechar |
| --- | --- | --- |
| L19, C10 | Só há bens do TSE 2022 | Medir no seed com um senador de duas eleições, ou coletar o TSE 2014/2018 |
| B04 | Só há CEAPS 2026 | `pnpm ingest ceaps 2025` quando houver rede |
