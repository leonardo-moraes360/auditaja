# Perfil do senador: validação

**Result**: FAIL (rodada 3)

- **Data**: 2026-11-11
- **Spec**: `.specs/features/perfil-senador/spec.md` (45 requisitos), `design.md`, `tasks.md` (T1–T16) e a AD-004 em
  `.specs/STATE.md`.
- **Faixa do diff**:
  - Total: `e4e563d..be9cf19` (20 commits, 52 arquivos, +6270/−131).
  - Correções desta rodada: `b2943c6..be9cf19`, ou seja, só o `be9cf19` (T16; 13 arquivos, +152/−26).
- **Verificador**: independente (autor ≠ verificador). Adversarial: na dúvida, FAIL. Sem `file:line`, sem cobertura.
- **Ambiente**:
  - Postgres em docker (porta 5436). Os testes usam `auditaja_senado_test`. Os dados reais estão em
    `auditaja_senado_dev`, recoletado às 15:27 com o código de `be9cf19`.
  - O servidor `:3243` ficou intacto.
  - Gates e mutantes rodaram no worktree temporário `…/scratchpad/verif3/wt`, já removido. O e2e usou a porta 3245 e
    a sonda, a 3246.
  - No real, `git status --porcelain` estava vazio antes. Depois, só aparecem estes relatórios.
  - O seed do banco de teste foi reaplicado no fim.

## Por que FAIL

1. **A R3 é violável por remontagem.**
   - A máscara nova do CPF dentro da razão social de MEI (`src/lib/privacy.ts:45-52`) segue o padrão da Receita e
     mostra os **6 dígitos do meio**. O banco e a tela mostram isso, por exemplo, no perfil `10003806`.
   - O relatório da rodada 2, commitado em `b2943c6` (`validation.md:172` daquele commit), publicou o **mesmo
     fornecedor com os 3 primeiros e os 2 últimos dígitos**. Juntos, os dois dão o CPF inteiro.
   - É o mesmo risco que a premissa "CPF já mascarado pelo Senado" da spec quer evitar. E ele vale também contra a
     fonte: o Senado publica o CPF de pessoa física com os 3 primeiros e os 2 últimos dígitos.
   - Esta versão do relatório já não traz o exemplo, mas o histórico ainda traz. O ramo não foi publicado (não existe
     `origin/feat/senadores`).
2. **O gate e2e está vermelho.**
   - O teste novo `tests/e2e/senador.spec.ts:267-273` falhou na rodada base e em 10 de 10 tentativas isoladas.
   - Causa: ele chama `boundingBox()` antes de o `Suspense` (`src/app/parlamentares/[id]/page.tsx:47`) revelar o perfil.
     Na sonda, a primeira leitura devolveu `null` nas 3 seções, e 1,5 s depois as caixas estavam certas.
   - Na suíte completa, o teste às vezes passa (por exemplo, nas execuções dos mutantes M08, M17 e M22). O "Gate full
     passa" da T16 não se confirma.
3. **A paridade (a) é de 94,5%, abaixo da meta de 95%.**
   - V23, M12, M14 e C29 foram corrigidos.
   - A correção do M12 trouxe uma regressão no **B03**: no celular, com Bens na tela, a aba ativa é "Mandato"
     (`src/components/perfil/abas.tsx:24-30`).
4. **O mutante M22 sobrevive e não é equivalente.**
   - O M22 tira o `max-sm:contents` da lateral, e Bens vai para depois de "Encontrou um erro?".
   - O teste da ordem só confere votações < mandato < bens.
5. **A SCAD-04 está em GAP.**
   - O detalhe `/senador/{codigo}` só é pedido para os 81 senadores em exercício (`src/ingest/senado.ts:341-358`).
   - Por isso, 164 dos 245 senadores da legislatura ficam sem `data_nascimento`. Desses, 12 têm votos ou notas.
   - A premissa da spec diz "por senador da legislatura".

## Gates

| Gate | Comando | Resultado |
| ---- | ------- | --------- |
| Unit + integração | `pnpm test` (TEST_DATABASE_URL = auditaja_senado_test, depois do seed) | 16 arquivos, **183 passaram**, 0 falharam |
| e2e + axe | `pnpm build`, depois `E2E_PORT=3245 PW_CHROME=… pnpm test:e2e` | **131 passaram, 1 falhou, 8 pulados**. A falha é `[celular] senador.spec.ts:267` (`TypeError: Cannot read properties of null (reading 'y')`). Rodado isolado, falhou 10 de 10 vezes |
| Build | `pnpm lint`, `pnpm typecheck`, `pnpm format:check`, `pnpm build` | os quatro com saída 0 |

**Não regressão do deputado: PASS.**

- Nenhum teste do deputado mudou em `be9cf19`. Entrou só um teste novo da Câmara (`tests/unit/transformacoes.test.ts:229`).
- Todos os testes do deputado passam.
- O layout do celular está atrás de `senado` (`secoes.tsx:565`, `:814`, `:818`, `:934`, `:963`; `page.tsx:278`).
- A marca (`topo.tsx:20`) segue o protótipo comum e fecha também a X03 do deputado.
- A máscara no nome vale também para a coleta da Câmara (`src/ingest/camara.ts:100`). Os bancos da Câmara coletados
  antes deste commit só ficam limpos com uma recoleta. Não conferi, porque não posso usar outros bancos.

## Tarefas

T16 `[x]`:

- "Nenhum CPF de 11 dígitos sobra no nome": **confirmado** (ver a R3), mas a máscara escolhida permite a remontagem
  (FAIL 1).
- "Gate full passa": **não confirmado** (FAIL 2).

Processo:

- `divergencias-propostas.md` ainda lista a I12 e a parte M12 da I14, que já não divergem.
- O Handoff de `.specs/STATE.md` e a rastreabilidade da spec ainda dizem "T1–T12".
- As emendas de SCEAPS-02 e SVOT-06 (rodada 2) seguem sem a ratificação do usuário.

## Checagem ancorada na spec

Legenda:

- **PASS**: um teste afirma o resultado definido pela spec.
- **GAP**: não há teste, o teste não discrimina ou o comportamento é parcial.
- **FAIL**: o comportamento contraria a spec.

Os requisitos sem mudança em `be9cf19` mantêm a evidência da rodada 2. Todos os testes citados passaram nesta rodada.

### Coletar os senadores

| ID | Evidência | Resultado |
| -- | --------- | --------- |
| SCAD-01 | `tests/unit/senado-ingest.test.ts:32`; `tests/unit/senado.test.ts:16` | PASS |
| SCAD-02 | `tests/unit/senado-ingest.test.ts:42`; M09 morto | PASS |
| SCAD-03 | `tests/unit/senado-ingest.test.ts:50` | PASS |
| SCAD-04 | Agora a ligação é testada: `tests/integracao/coleta-senado.test.ts:76` (`data_nascimento = '1976-10-23'`), e o M19 morre. **A cobertura é parcial**: o detalhe só é pedido para quem está em exercício (`src/ingest/senado.ts:349-358`). No banco real, 81 de 245 senadores têm nascimento, e 12 dos que não têm têm votos ou notas. A premissa da spec ("uma requisição a `/senador/{codigo}` por senador da legislatura") conflita com a R7: seriam 245 + 81 + 2 = 328 requisições, acima de 200. Cabe ao usuário decidir | **GAP** |
| SCAD-05 | `tests/integracao/coleta-senado.test.ts:82-109`; M15 morto. No banco real, 164 linhas de cadastro com URLs reais. As ressalvas da rodada 2 continuam: `parlamentar.coleta_id` aponta só para a lista, e as coletas ficam fora da transação (`senado.ts:361-377`) | PASS (com ressalvas) |
| SCAD-06 | `tests/integracao/coleta-senado.test.ts:62`, `:111` | PASS |

### Gastos da CEAPS

| ID | Evidência | Resultado |
| -- | --------- | --------- |
| SCEAPS-01 | `tests/unit/senado-ingest.test.ts:103` | PASS |
| SCEAPS-02 (emendada) | `tests/unit/senado-ingest.test.ts:116`, `:125`, `:243-258` e `:261-272` (MEI); `tests/unit/privacy.test.ts:35-49`. M06, M18, M20 e M20b mortos. Continua a ressalva de que "CNPJ válido" é só "14 dígitos" (`privacy.ts:31`). A remontagem do FAIL 1 é da R3, não da letra deste requisito | PASS (literal) |
| SCEAPS-03 | `tests/unit/senado-ingest.test.ts:132` | PASS |
| SCEAPS-04 | `tests/unit/senado-ingest.test.ts:137`; `tests/integracao/coleta-senado.test.ts:118` | PASS |
| SCEAPS-05 | `tests/integracao/perfil-senador.test.ts:34`; `tests/e2e/senador.spec.ts:38` | PASS |
| SCEAPS-06 | `tests/integracao/perfil-senador.test.ts:43`; `tests/e2e/senador.spec.ts:61`; M07 morto | PASS |
| SCEAPS-07 | `tests/integracao/coleta-senado.test.ts:118`; M05 morto | PASS |

### Votações, presença e alinhamento

| ID | Evidência | Resultado |
| -- | --------- | --------- |
| SVOT-01 | `tests/unit/senado-ingest.test.ts:149`, `:163` | PASS |
| SVOT-02 | `tests/unit/senado-ingest.test.ts:169`. O partido do dia aparece na tela: `tests/e2e/senador.spec.ts:100` ("Liderança do PFW: Sim"; seed em `src/db/seed.ts:529` e `:549`). M17 morto | PASS |
| SVOT-03 | `tests/unit/senado-ingest.test.ts:177`; `tests/unit/senado.test.ts:34` | PASS |
| SVOT-04 | `tests/integracao/coleta-senado.test.ts:137` | PASS |
| SVOT-05 | `tests/integracao/perfil-senador.test.ts:50` | PASS |
| SVOT-06 (emendada) | `tests/e2e/senador.spec.ts:82-89`; M10 e M13 mortos | PASS |
| SVOT-07 | `tests/unit/senado.test.ts:114`; `tests/e2e/senador.spec.ts:82` | PASS |
| SVOT-08 | `tests/e2e/senador.spec.ts:82`, `:38`; M08 morto | PASS |

### Indicadores do senador

| ID | Evidência | Resultado |
| -- | --------- | --------- |
| SPRES-01 | `tests/unit/senado.test.ts:68` | PASS |
| SPRES-02 | `tests/unit/senado.test.ts:73`; M01 morto | PASS |
| SPRES-03 | `tests/unit/senado.test.ts:83`; `tests/integracao/perfil-senador.test.ts:65` | PASS |
| SPRES-04 | `tests/integracao/perfil-senador.test.ts:209-214` | PASS |
| SALI-01 | `tests/unit/senado.test.ts:40`, `:52`; M03 morto | PASS |
| SALI-02 | `tests/integracao/perfil-senador.test.ts:201-207`; M13 e M02b mortos | PASS |
| SALI-03 | `tests/unit/senado.test.ts:47` | PASS |

### Perfil e lista do senador

| ID | Evidência | Resultado |
| -- | --------- | --------- |
| SUI-01 | `tests/e2e/senador.spec.ts:6` | PASS |
| SUI-02 | `tests/e2e/senador.spec.ts:17-24`, `:31` | PASS |
| SUI-03 | `tests/e2e/senador.spec.ts:17`, `:31` | PASS |
| SUI-04 | `tests/e2e/senador.spec.ts:115-141` (ordinal pelo gênero em `:124` e `:134`; UF); `tests/integracao/perfil-senador.test.ts:96-99` (`left join` em `src/data/perfil.ts:434`). M21a, M21b e M21c mortos. O teste da ordem no celular (`:267`) não conta como evidência: falha por corrida e não discrimina o M22 | PASS (conteúdo) |
| SUI-05 | `tests/integracao/perfil-senador.test.ts:102`; `tests/e2e/senador.spec.ts:157` | PASS |
| SUI-06 | `tests/integracao/perfil-senador.test.ts:141`, `:153`, `:177-197`; M14 morto. A lista real é idêntica à da rodada 2, com 81 cartões | PASS |
| SUI-07 | `tests/e2e/senador.spec.ts:185` | PASS |
| SUI-08 | `tests/e2e/senador.spec.ts:221` | PASS |
| SUI-09 | `tests/e2e/senador.spec.ts:212` | PASS |
| SUI-10 | `tests/e2e/senador.spec.ts:172` | PASS |
| SUI-11 | `tests/e2e/senador.spec.ts:231` | PASS |

### Bens

| ID | Evidência | Resultado |
| -- | --------- | --------- |
| SBENS-01 | `tests/unit/senado-ingest.test.ts:197`. No banco real, só casa quem tem nascimento (ver SCAD-04) | PASS |
| SBENS-02 | `tests/integracao/perfil-senador.test.ts:113`; `tests/e2e/senador.spec.ts:256` | PASS |

### Casos de borda

| ID | Evidência | Resultado |
| -- | --------- | --------- |
| SERR-01 | `tests/unit/http.test.ts:124`; `tests/integracao/coleta-senado.test.ts:151` | PASS |
| SERR-02 | `tests/unit/senado.test.ts:26`; `tests/unit/senado-ingest.test.ts:77` | PASS |
| SERR-03 | No celular, agora aparece o texto completo (`src/app/parlamentares/[id]/page.tsx:221`). O teste `tests/e2e/senador.spec.ts:246-251` cobre os dois viewports. M12 (desktop) e M12m (celular, novo) mortos | PASS (fechado) |
| SERR-04 | `tests/e2e/senador.spec.ts:252`; `tests/integracao/perfil-senador.test.ts:216` | PASS |

**Placar**: 44 PASS, 1 GAP (SCAD-04) e 0 FAIL, de 45 requisitos.

### Metas da spec

| Meta | Resultado | Evidência |
| ---- | --------- | --------- |
| 81 senadores na busca e na lista | PASS | `/parlamentares?casa=senado` mostra 81 cartões |
| Bloco com fonte, data e link | PASS | Recoleta das 15:27, com as URLs reais `/senador/{código}.json` |
| **R3** | **FAIL** | Nenhum CPF completo, mas o CPF pode ser remontado (FAIL 1) |
| R7 | PASS | 164 requisições do cadastro + 1 da CEAPS + 2 das votações = 167 |
| Perfil do deputado igual | PASS | ver Gates |

## R3 no banco real (`auditaja_senado_dev`)

Varri as 55 colunas de texto de `public` com o script `…/scratchpad/verif3/r3.sql`. Ele procura:

- CPF de 11 dígitos, com ou sem `.`, espaço ou `-`;
- a máscara do Senado (3 primeiros e 2 últimos dígitos);
- a máscara da Receita;
- sequências de 10 dígitos (CPF sem o zero à esquerda).

| Coluna | CPF completo | Máscara do Senado | Máscara da Receita | Leitura |
| ------ | ------------ | ----------------- | ------------------ | ------- |
| `despesa_ceap.fornecedor_nome` | **0** (eram 62) | 0 | 62 | Razão social de MEI no formato "NOME \*\*\*.ddd.ddd-\*\*" |
| `candidatura.sq_candidato`, `bem_declarado.sq_candidato` | 38 e 390 | 0 | 0 | Falso positivo: sequencial do TSE |
| `coleta.sha256` | 4 | 0 | 0 | Falso positivo: hash hexadecimal |
| demais 50 colunas | 0 | 0 | 0 | — |

- **Notas**: há 237 de `terceiro_pf`, todas com documento nulo e o nome "Prestador pessoa física", e 16.268 de
  `pessoa_juridica`. Não sobrou nenhuma `desconhecido` (lacuna 6 da rodada 2 fechada).
- **Tela**: baixei o `gastos.csv?ano=2026` dos **90 senadores com notas**. Nenhum tem CPF completo ou a máscara do
  Senado, e 62 linhas trazem a máscara da Receita no nome. Nos perfis `10003806` e `10004639`, a tabela "Maiores
  fornecedores" mostra a mesma máscara.

**R3: FAIL por remontagem.** Para corrigir:

- Trocar a máscara no nome por uma sem dígitos (`***.***.***-**`) ou retirar o CPF (`src/lib/privacy.ts:51-52`).
- Ajustar os testes `tests/unit/privacy.test.ts:36-44`, `senado-ingest.test.ts:261` e `transformacoes.test.ts:229`.
- Recoletar.
- Antes de publicar o ramo, decidir com o usuário se o exemplo sai do histórico de `b2943c6`.

## A coleta só troca dados da própria Casa

| Direção | Código | Teste | Mutante |
| ------- | ------ | ----- | ------- |
| Senado → suplente, órgãos, CEAPS, votações | `src/ingest/senado.ts:387-390`, `:409`, `:442-447` | `coleta-senado.test.ts:62`, `:118`, `:137` | M05 morto |
| Câmara → CEAP | `src/ingest/camara.ts:328-334` | `coleta-senado.test.ts:161-216` | M04 morto |
| Câmara → votações | `src/ingest/camara.ts:375-381` | idem | M11 morto |
| Câmara → órgãos | `src/ingest/camara.ts:400-406` | idem: `coletarOrgaos` em `:213`, e os órgãos do senador conferidos em `:173-182` | **M16 morto** (vivo na rodada 2) |

Continua o desvio menor: nas votações, a separação é pelo órgão (`camara.ts:378`), e não por `casa`, como a AD-004 manda.

## Sensor de discriminação

- **Ambiente**: um worktree temporário, criado com `git worktree add --detach …/verif3/wt HEAD` e preparado com
  `pnpm install --offline`. O script é `…/verif3/mutantes.py`, e cada substituição exige um número exato de
  ocorrências.
- **Execução**: para cada mutante, roda o seed e depois o vitest. Se o vitest não matar, roda `pnpm build` (saída 0 em
  todos) e o e2e completo. No fim, `git checkout -- src`.
- **Regra de contagem**: como o `senador.spec.ts:267` falha sozinho na rodada base, falhar só nele não conta como morte.

| # | Mutação | Resultado | Teste que matou |
| - | ------- | --------- | --------------- |
| M01 | tira `LS` das licenças | Morto | vitest |
| M02 | "Votou" vira a orientação no alinhamento | **Vivo, equivalente** (como na rodada 2) | só o `:267`, que não conta |
| M02b | M02 sem a guarda | Morto | vitest |
| M03–M07 | rodada 1 | Mortos | vitest |
| M08 | "Divergiu do partido" | Morto | `senador.spec.ts:82` [D] |
| M09 | todos em exercício | Morto | vitest |
| M10 | votação secreta sem "Orientação: não se aplica" | Morto | `senador.spec.ts:82` [D e M] |
| M11 | votações da Câmara apagam as `PLEN-SF` | Morto | vitest |
| M12 | desktop mostra "0 de 0 em {ano}" | Morto | `senador.spec.ts:246` [D] |
| M12m (novo) | celular volta a "sem votações" | Morto | `senador.spec.ts:246` [M] |
| M13–M15 | rodada 2 | Mortos | vitest |
| **M16** | coleta de órgãos da Câmara apaga as comissões dos senadores | **Morto** | `coleta-senado.test.ts:161` |
| **M17** | liderança com o partido atual | **Morto** | `senador.spec.ts:82` [D], em `:100` |
| M18 | documento malformado grava o nome | Morto | vitest |
| **M19** | o nascimento não chega ao banco | **Morto** | `coleta-senado.test.ts:76` |
| **M20 (novo)** | desliga a máscara de CPF no nome do fornecedor | **Morto** | `privacy.test.ts:36`, `senado-ingest.test.ts:262`, `transformacoes.test.ts:229` |
| M20b (novo) | a máscara só pega 11 dígitos sem pontuação | Morto | `privacy.test.ts:36` |
| M21a (novo) | celular com ordinal sempre "º" | Morto | `senador.spec.ts:115` [M] |
| M21b (novo) | desktop com ordinal sempre "º" | Morto | `senador.spec.ts:115` [D] |
| M21c (novo) | leitura sem o `sexo` do suplente | Morto | `perfil-senador.test.ts:96` |
| **M22 (novo)** | lateral sem `max-sm:contents`: Bens vai para o fim | **Vivo, não equivalente** | nenhum. O e2e passa inteiro, inclusive o `:267` |
| M23 (novo) | `gap` do Mandato compacto volta a 14 px | Vivo (só visual) | nenhum. A paridade cobre (M14) |
| M24 (novo) | marca volta a `tracking-tight` | Vivo (só visual) | nenhum. A paridade cobre (V23) |

**Resultado: 29 execuções, 25 mortes.**

- Ficaram 4 vivos: M02, que é equivalente; M22, que não é; e M23 e M24, que são só de paridade.
- Sem contar o equivalente e os 2 visuais: 25 de 26 (96%). Contando tudo: 25 de 29 (86%).
- **M16, M17 e M19 morreram.**
- **Sensor: FAIL por causa do M22.**

## Paridade visual

Detalhes em `paridade/verificacao-3.md`. São 130 itens: 3 N/V, 120 PASS e 7 FAIL.

- **(a) Com as divergências propostas contadas como FAIL: 120 ÷ 127 = 94,5%.** Fica abaixo da meta de 95%.
- **(b) Se o usuário aceitar I10, I11, I13 e a parte C32 da I14: 120 ÷ 121 = 99,2%.**
- Passaram a PASS: V23, M12, M14 e C29.
- **Regressão nova: B03.**
- Já não divergem, mas continuam no arquivo de propostas: a **I12** e a **parte M12 da I14**.

## Lacunas ranqueadas

1. **R3: a máscara do nome permite remontar o CPF.**
   - Onde: `src/lib/privacy.ts:45-52`. O exemplo remontável está no histórico de `b2943c6`.
   - Correção: usar uma máscara sem dígitos no nome e recoletar a CEAPS e a CEAP. Antes de publicar o ramo, decidir
     com o usuário se o exemplo sai do histórico.
2. **O e2e está vermelho.**
   - Onde: `tests/e2e/senador.spec.ts:267-273`. O teste mede as seções antes de o `Suspense` terminar.
   - Correção: `await expect(page.locator("section#bens")).toBeVisible()` antes de medir, e rodar a suíte de novo.
3. **Regressão do B03, que deixa a paridade (a) em 94,5%.**
   - Onde: `src/components/perfil/abas.tsx:24-30`.
   - Correção: escolher a aba pela posição na tela, e não pela ordem de `ABAS`. Outra saída é um Mandato compacto com
     `sm:hidden` na posição certa do DOM, o que resolve também a ordem de foco (WCAG 1.3.2 e 2.4.3), que hoje está
     invertida: no DOM, Bens vem antes do Mandato.
   - Acrescentar um e2e da aba ativa no celular.
4. **M22 vivo.**
   - Onde: o teste em `tests/e2e/senador.spec.ts:271-273` e o código em `src/components/perfil/secoes.tsx:814`.
   - Correção: o teste também deve conferir bens < fontes < erro.
5. **SCAD-04: só os senadores em exercício têm nascimento.**
   - Onde: `src/ingest/senado.ts:341-358`. Hoje, 164 senadores ficam sem a data, e 12 deles têm votos ou notas.
   - Correção: depende do usuário. Ou emendar a spec, ou pedir também o detalhe de quem tem votos ou notas, respeitando
     a R7.
6. **Processo.**
   - Atualizar `divergencias-propostas.md`: tirar a I12 e a parte M12 da I14.
   - Levar ao usuário I10, I11, I13 e a C32.
   - Ratificar as emendas de SCEAPS-02 e SVOT-06.
   - Atualizar `.specs/STATE.md` e a rastreabilidade da spec.
7. **Ressalvas da rodada 2 que continuam.**
   - SCAD-05: `senado.ts:361-377`.
   - "CNPJ válido" com 14 dígitos: `privacy.ts:31`.
   - A AD-004 separando votações por órgão: `camara.ts:378`.

---

## Rodada 2 (resumo)

**Result**: FAIL, na faixa `e4e563d..96e0fc0`.

- **Requisitos**: 43 PASS e 2 GAP (SCAD-04 e SERR-03 no celular).
- **Gates**: vitest 179/179; e2e com 131 testes passando e 7 pulados.
- **Sensor**: 16 de 20 mutantes mortos. Ficaram vivos M02 (equivalente), M16, M17 e M19.
- **Paridade**: (a) 92,1% e (b) 98,3%.
- **R3**: FAIL, com CPF completo na razão social de MEI em 62 notas.
- **Banco real**: não tinha sido recoletado.

O que a rodada 3 encontrou dessas lacunas:

- O CPF completo foi corrigido, mas a máscara nova permite a remontagem.
- M16, M17 e M19 morrem.
- A SERR-03 foi fechada.
- V23, M14, C29 e M12 foram corrigidos.
- O banco foi recoletado.

## Rodada 1 (resumo)

**Result**: FAIL, na faixa `e4e563d..187abaf` (13 commits).

- **Requisitos**: 37 PASS, 7 GAP e 1 FAIL (SCAD-05).
- **Gates**: vitest 170/170; e2e com 126 testes passando e 6 pulados.
- **Sensor**: 8 de 12 mutantes mortos. Ficaram vivos M02, M04, M11 e M12.
- **Paridade**: 82,5%.
- **Limite de 60 resultados**: FAIL.
- **R3**: deu PASS, mas a rodada 2 achou o CPF de MEI.

As rodadas 2 e 3 corrigiram tudo isso, menos o que aparece nas lacunas acima.
