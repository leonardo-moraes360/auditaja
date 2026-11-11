# Verificação 4 de paridade do perfil do senador

- Data: 11/11/2026
- Verificador independente (autor ≠ verificador). Na dúvida, FAIL.
- Servidor: http://127.0.0.1:3243 (build do worktree `feat/senadores` anterior aos dois últimos commits de regex de CPF,
  que só mudam a ingestão; inclui a reversão da ordem do celular). Banco `auditaja_senado_dev`, CEAPS 2026 recoletada
  com a máscara sem dígitos.
- Páginas: `/parlamentares/10005672`, `/parlamentares/10006358`, `/parlamentares/10005988`, `/parlamentares`,
  `/parlamentares?casa=senado`, `/parlamentares?casa=xyz`.
- Viewports: 1440×900 e 390×844 (`isMobile`, `hasTouch`). Chromium 1228 via Playwright.
- Método: os mesmos scripts da verificação 3 (`q1.js`, `q2.js`, `q3.js`, `ql.js`, `qm.js`, `qo.js`, `b03.js`,
  `b03c.js`), rodados de novo e comparados folha a folha com os JSON da verificação 3 (`diff.py`). Mais um script novo,
  `b03d.js`, que compara a aba ativa com a seção que de fato está na linha de leitura (30% da altura). Scripts e JSON
  em `/tmp/claude-1000/-home-leonardo-workspace-pessoal-auditaja/774d31fe-0b00-44bd-b576-a405d3cd5888/scratchpad/verif4/par/`.

## Divergências usadas na pontuação

- Aceitas antes (valem): I1, I2, I4, I5, I6, I7, I9 e a I8 substituída pela SCEAPS-06.
- **Aceitas pelo usuário em 11/11/2026** (`divergencias-propostas.md`): I10 (C18), I11 (V12, V13, V14), I13 (P10) e
  I14 (M12 e a parte C32). Saem do denominador como INTENCIONAL.
- A I12 foi corrigida (C29 PASS desde a verificação 3) e já não está no arquivo.
- Ressalva de processo: a tabela "Divergências intencionais que valem aqui" de `rubrica.md:32-44` ainda vai só até a
  I9. A aceitação está registrada só em `divergencias-propostas.md`.

## O que mudou desde a verificação 3

Na comparação com os JSON da verificação 3, só mudou o que a reversão da ordem do celular explica, mais o horário de
coleta (recoleta da CEAPS):

| Arquivo | Mudança | Leitura |
| --- | --- | --- |
| `q1-m-*`, `q2-m-*`, `qo-*` (celular) | Bens e Mandato trocam de `y`: no Alan, Bens 1804 e Mandato 2018 (antes 1990 e 1804); na Ana, Bens 1765 e Mandato 1979 | Ordem do DOM de volta: Gastos, Votações, Bens, Mandato, Fontes, Encontrou um erro? |
| `q1-d-*` | `fontesPe[0].w` de 534 para 535 px | O texto do horário de coleta mudou ("15:2…" para "15:4…") |
| `q2-d-*`, `q3-d-*` | Só a linha "Fonte: … coletado em 11/11/2026 15:4x" | Recoleta. Nenhuma linha de fornecedor mudou nos três perfis |
| `q3-m-*`, `ql-*` (6 arquivos), `qm-real-d`, `qm-real-m` | Idênticos | Lista, Mandato do desktop e Mandato compacto (M13, M14) sem mudança |

Nenhum token de cor, fonte, raio, padding ou largura mudou fora disso. O `scrollWidth` do celular segue 390 (M10).

## B03 (aba ativa) no celular

`b03.js` rola até cada seção (topo a 15% da tela) e lê `aria-current`:

| Perfil | gastos | votacoes | mandato | bens | fontes |
| --- | --- | --- | --- | --- | --- |
| 10005672 (celular) | Gastos | Votações | Mandato | **Bens** | Fontes |
| 10006358 (celular) | Gastos | Votações | Mandato | **Bens** | Fontes |

A regressão da verificação 3 (Bens na tela com a aba Mandato) sumiu. No desktop, o resultado é o mesmo das
verificações 2 e 3 (a lateral só fica ativa por clique ou `#hash`, como diz `src/components/perfil/abas.tsx:18-22`).

`b03d.js` (clique em cada aba, leitura logo depois e de novo após rolar 60 px):

- Logo depois do clique, a aba ativa é sempre a clicada (B02 também PASS: topo da seção em 16 px).
- Depois de rolar 60 px, a aba ativa é sempre a seção que está na linha de 30%. Exemplo: clique em "Bens", rolagem de
  60 px, a aba passa a "Mandato" porque Bens tem 214 px e o Mandato já cruzou a linha. Isso segue a regra do componente
  (`abas.tsx:15-16`) e o Senador:88 ("a aba ativa acompanha a seção visível").

**B03: PASS.** Não há teste automático da aba ativa no celular (ver lacunas de `validation.md`).

A ordem do DOM voltou a ser a ordem visual (`qo-10005672.json`: `bens@1804`, `mandato@2018`). Com isso, a observação de
acessibilidade da verificação 3 (WCAG 1.3.2 e 2.4.3) fica resolvida.

## Placar

- Itens: 130, os mesmos das verificações 2 e 3.
- N/V: 3 (L19, C10 e B04). Continuam sem dados (só TSE 2022 e CEAPS 2026).
- INTENCIONAL (divergência aceita): 7. São V12, V13 e V14 (I11), C18 (I10), P10 (I13), M12 e C32 (I14).
  - M12 voltou a divergir de propósito: no celular, o Mandato vem depois de Bens (I14).
- FAIL: 0.
- PASS: 120. Entram aqui os 119 que já passavam na verificação 3 fora dos itens agora intencionais, mais o **B03**.

**Paridade = 120 ÷ (120 + 0) = 100%.** A meta de 95% é atingida.

Paridade pessimista, com N/V contado como FAIL: 120 ÷ 123 = 97,6%.

Conta com as aceitas de volta no denominador como FAIL, só para referência: 120 ÷ 127 = 94,5%.

## Itens INTENCIONAIS conferidos

| ID | Divergência aceita | O que a página mostra |
| --- | --- | --- |
| C18 | I10 | "—" na coluna CNPJ/CPF do prestador pessoa física |
| V12, V13, V14 | I11 | Bordas `#C9CAC2` (tokens iguais aos da verificação 3) |
| P10 | I13 | Busca do topo visível na lista (`ql-*` idênticos) |
| M12 | I14 | Celular: Gastos, Votações, Bens, Mandato, Fontes, Encontrou um erro? |
| C32 | I14 | Linha do tempo só com os marcos do mandato atual |

## N/V

| ID | Por quê | Como fechar |
| --- | --- | --- |
| L19, C10 | Só há bens do TSE 2022 | Medir no seed com um senador de duas eleições, ou coletar o TSE 2014/2018 |
| B04 | Só há CEAPS 2026 | `pnpm ingest ceaps 2025` quando houver rede |

## Mutantes só de paridade (sensor da `validation.md`)

- M23 (`gap` do Mandato compacto) e M24 (espaçamento da marca) sobrevivem ao e2e. A paridade os pega (M14 e V23).
- M22n (novo: `flex-col-reverse` no contêiner do perfil, a lateral sobe para antes de Gastos no celular) sobrevive ao
  e2e. Nenhum teste confere a ordem do celular desde que o teste da ordem saiu. Só a leitura humana do M12 pegaria: a
  I14 aceita "Mandato depois de Bens", não qualquer ordem.
