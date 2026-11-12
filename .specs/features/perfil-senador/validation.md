# Perfil do senador: validação

**Result**: PASS (rodada 4)

Condição antes de publicar o ramo: apagar as refs locais que ainda guardam o relatório antigo com o CPF parcial
(lacuna 1). Isso não muda o veredito do código nem do banco. Muda o que pode ir para o GitHub.

- **Data**: 2026-11-11
- **Spec**: `.specs/features/perfil-senador/spec.md` (45 requisitos, com as emendas de SCEAPS-02, SVOT-06 e SCAD-04
  confirmadas pelo usuário), `design.md`, `tasks.md` (T1–T16) e a AD-005 em `.specs/STATE.md`.
- **Faixa do diff**:
  - Total: `e4e563d..abc95ff` (26 commits).
  - Correções desde a rodada 3: `d733ab1..abc95ff` (`bb97def`, `3460770`, `3f7d10e`, `1c0910c`, `32679b9`,
    `abc95ff`). O histórico foi reescrito, então os hashes citados nas rodadas anteriores não existem mais neste ramo.
- **Verificador**: independente (autor ≠ verificador). Adversarial: na dúvida, FAIL. Sem `file:line`, sem cobertura.
- **Ambiente**:
  - Postgres em docker (porta 5436). Os testes usaram `auditaja_senado_test`. Os dados reais estão em
    `auditaja_senado_dev`: CEAPS 2026 recoletada às 15:46 com a máscara sem dígitos.
  - O servidor `:3243` ficou intacto. A paridade foi medida nele.
  - Gates e mutantes rodaram no worktree temporário `…/scratchpad/verif4/wt` (`git worktree add --detach … HEAD`), já
    removido. O e2e usou a porta 3245.
  - No real, `git status --porcelain` estava vazio antes. Depois, só aparecem estes relatórios.
  - O seed do banco de teste foi reaplicado no fim.

## Por que PASS

1. Os gates estão verdes: vitest 186/186, e2e 131 passados e 0 falhas, além de lint, typecheck, format e build. O e2e
   rodou completo 12 vezes (base e mutantes) sem nenhuma falha fora das esperadas.
2. Checagem ancorada na spec: **45 PASS, 0 GAP, 0 FAIL**. A SCAD-04 saiu do GAP pela emenda aprovada.
3. R3 no banco real e na tela: nenhum CPF completo e nenhuma máscara parcial em nenhuma das 55 colunas de texto, nem
   nos 90 CSVs.
4. Sensor: 35 execuções e 31 mortes. Os 4 vivos são M02 (equivalente) e M22n, M23 e M24 (só visuais, cobertos pela
   paridade).
5. Paridade: 100%, com as divergências aceitas fora do denominador (meta de 95%). A regressão do B03 foi corrigida.
6. Não regressão do deputado: a suíte inteira passa.

## Gates

| Gate | Comando | Resultado |
| ---- | ------- | --------- |
| Unit + integração | `pnpm test` (TEST_DATABASE_URL = auditaja_senado_test, depois do seed) | 16 arquivos, **186 passaram**, 0 falharam |
| e2e + axe | `pnpm build`, depois `E2E_PORT=3245 PW_CHROME=… pnpm test:e2e` | **131 passaram, 0 falharam, 7 pulados**. O teste instável da rodada 3 foi removido |
| Build | `pnpm lint`, `pnpm typecheck`, `pnpm format:check`, `pnpm build` | os quatro com saída 0 |

- **Estabilidade**: além da base, o e2e completo rodou 11 vezes, nos mutantes M02, M08, M10, M12, M12m, M17, M21a,
  M21b, M22n, M23 e M24. Em todas as execuções, só falharam os testes que o próprio mutante quebra.

**Não regressão do deputado: PASS.**

- Desde a rodada 3, nenhum teste pré-existente do deputado mudou.
- Na faixa total, os testes do deputado mudaram só nestes pontos, já avaliados nas rodadas anteriores:
  - o placeholder da busca (SUI-08, `tests/e2e/perfil.spec.ts`);
  - a versão da metodologia;
  - o filtro dos senadores do seed em `tests/integracao/coleta.test.ts`.
- A suíte inteira passa.
- A reversão de `bb97def` tira as classes do celular que só valiam para o Senado (`page.tsx:276`, `secoes.tsx:562`,
  `:810`, `:927`, `:955`). O layout do deputado volta a ser o da `main`.

## Checagem ancorada na spec

Legenda:

- **PASS**: um teste afirma o resultado definido pela spec.
- **GAP**: não há teste, o teste não discrimina ou o comportamento é parcial.
- **FAIL**: o comportamento contraria a spec.

As linhas citadas foram conferidas no `HEAD` (`abc95ff`), e todos os testes citados passaram nesta rodada.

### Coletar os senadores

| ID | Evidência | Resultado |
| -- | --------- | --------- |
| SCAD-01 | `tests/unit/senado-ingest.test.ts:32`; `tests/unit/senado.test.ts:16` | PASS |
| SCAD-02 | `tests/unit/senado-ingest.test.ts:42`; M09 morto | PASS |
| SCAD-03 | `tests/unit/senado-ingest.test.ts:50` | PASS |
| SCAD-04 (emendada) | Sexo e nascimento: `tests/unit/senado-ingest.test.ts:64`, `:230`, `:233`; a ligação com o banco, `tests/integracao/coleta-senado.test.ts:76`; M19 morto. O detalhe só é pedido para quem está em exercício (`src/ingest/senado.ts:349-358`), como diz a emenda aprovada às 19:45 (`spec.md:46`, `:69`). No banco real, 81 de 81 senadores em exercício têm nascimento. Os outros 164 não têm, e 67 deles casam com o TSE pelo nome e pela UF (`src/ingest/tse.ts:46`), como diz a premissa emendada | PASS |
| SCAD-05 | `tests/integracao/coleta-senado.test.ts:82-109`; M15 morto. Ressalvas mantidas (lacuna 6) | PASS (com ressalvas) |
| SCAD-06 | `tests/integracao/coleta-senado.test.ts:62`, `:111` | PASS |

### Gastos da CEAPS

| ID | Evidência | Resultado |
| -- | --------- | --------- |
| SCEAPS-01 | `tests/unit/senado-ingest.test.ts:103` | PASS |
| SCEAPS-02 (emenda ratificada às 18:55) | `tests/unit/senado-ingest.test.ts:116`, `:125`, `:244`, `:262`; `tests/unit/privacy.test.ts:35-59`. M06, M18, M20, M20b e M25–M30 mortos. A máscara do nome não tem dígitos (`src/lib/privacy.ts:45`, `:54`) | PASS |
| SCEAPS-03 | `tests/unit/senado-ingest.test.ts:132` | PASS |
| SCEAPS-04 | `tests/unit/senado-ingest.test.ts:137`; `tests/integracao/coleta-senado.test.ts:118` | PASS |
| SCEAPS-05 | `tests/integracao/perfil-senador.test.ts:34`; `tests/e2e/senador.spec.ts:38` | PASS |
| SCEAPS-06 | `tests/integracao/perfil-senador.test.ts:43`; `tests/e2e/senador.spec.ts:61`; M07 morto | PASS |
| SCEAPS-07 | `tests/integracao/coleta-senado.test.ts:118`; M05 morto | PASS |

### Votações, presença e alinhamento

| ID | Evidência | Resultado |
| -- | --------- | --------- |
| SVOT-01 | `tests/unit/senado-ingest.test.ts:149`, `:163` | PASS |
| SVOT-02 | `tests/unit/senado-ingest.test.ts:169`; `tests/e2e/senador.spec.ts:100`; M17 morto | PASS |
| SVOT-03 | `tests/unit/senado-ingest.test.ts:177`; `tests/unit/senado.test.ts:34` | PASS |
| SVOT-04 | `tests/integracao/coleta-senado.test.ts:137` | PASS |
| SVOT-05 | `tests/integracao/perfil-senador.test.ts:50` | PASS |
| SVOT-06 (emenda ratificada às 18:55) | `tests/e2e/senador.spec.ts:82-89`; M10 e M13 mortos | PASS |
| SVOT-07 | `tests/unit/senado.test.ts:114`; `tests/e2e/senador.spec.ts:82` | PASS |
| SVOT-08 | `tests/e2e/senador.spec.ts:82`, `:38`; M08 morto | PASS |

### Indicadores do senador

| ID | Evidência | Resultado |
| -- | --------- | --------- |
| SPRES-01 | `tests/unit/senado.test.ts:68` | PASS |
| SPRES-02 | `tests/unit/senado.test.ts:73`; M01 morto | PASS |
| SPRES-03 | `tests/unit/senado.test.ts:83`; `tests/integracao/perfil-senador.test.ts:65` | PASS |
| SPRES-04 | `tests/integracao/perfil-senador.test.ts:72`, `:209` | PASS |
| SALI-01 | `tests/unit/senado.test.ts:40`, `:52`; M03 morto | PASS |
| SALI-02 | `tests/integracao/perfil-senador.test.ts:201`; M13 e M02b mortos | PASS |
| SALI-03 | `tests/unit/senado.test.ts:47` | PASS |

### Perfil e lista do senador

| ID | Evidência | Resultado |
| -- | --------- | --------- |
| SUI-01 | `tests/e2e/senador.spec.ts:6` | PASS |
| SUI-02 | `tests/e2e/senador.spec.ts:17`, `:31` | PASS |
| SUI-03 | `tests/e2e/senador.spec.ts:17`, `:31` | PASS |
| SUI-04 | `tests/e2e/senador.spec.ts:115-141`; `tests/integracao/perfil-senador.test.ts:87-99`; M21a, M21b e M21c mortos. A ordem no celular não é requisito (I14 aceita); o teste de ordem foi removido | PASS |
| SUI-05 | `tests/integracao/perfil-senador.test.ts:102`; `tests/e2e/senador.spec.ts:157` | PASS |
| SUI-06 | `tests/integracao/perfil-senador.test.ts:141`, `:153`, `:177`; M14 morto | PASS |
| SUI-07 | `tests/e2e/senador.spec.ts:185` | PASS |
| SUI-08 | `tests/e2e/senador.spec.ts:221` | PASS |
| SUI-09 | `tests/e2e/senador.spec.ts:212` | PASS |
| SUI-10 | `tests/e2e/senador.spec.ts:172` | PASS |
| SUI-11 | `tests/e2e/senador.spec.ts:231` | PASS |

### Bens

| ID | Evidência | Resultado |
| -- | --------- | --------- |
| SBENS-01 | `tests/unit/senado-ingest.test.ts:197` | PASS |
| SBENS-02 | `tests/integracao/perfil-senador.test.ts:113`; `tests/e2e/senador.spec.ts:256` | PASS |

### Casos de borda

| ID | Evidência | Resultado |
| -- | --------- | --------- |
| SERR-01 | `tests/unit/http.test.ts:124`; `tests/integracao/coleta-senado.test.ts:151` | PASS |
| SERR-02 | `tests/unit/senado.test.ts:26`; `tests/unit/senado-ingest.test.ts:77` | PASS |
| SERR-03 | `tests/e2e/senador.spec.ts:246` (desktop e celular); M12 e M12m mortos | PASS |
| SERR-04 | `tests/e2e/senador.spec.ts:246`; `tests/integracao/perfil-senador.test.ts:131`, `:216` | PASS |

**Placar**: 45 PASS, 0 GAP e 0 FAIL, de 45 requisitos.

### Metas da spec

| Meta | Resultado | Evidência |
| ---- | --------- | --------- |
| 81 senadores na busca e na lista | PASS | `ql-*-parlamentares_casa_senado.json` idênticos aos da rodada 3 (81 cartões) |
| Bloco com fonte, data e link | PASS | "Fonte: Senado Federal … coletado em 11/11/2026 15:4x" nos três perfis medidos |
| R3 | PASS | ver abaixo |
| R7 | PASS | 81 detalhes + 81 comissões + 2 listas + 1 CEAPS + 2 votações = 167 requisições, abaixo de 200 |
| Perfil do deputado igual | PASS | ver Gates |

## R3 no banco real (`auditaja_senado_dev`)

Varri as 55 colunas de texto de `public` com o script `…/scratchpad/verif4/r3.sql`. Ele procura:

- CPF completo pela regra antiga (com `.`, espaço ou `-`);
- CPF completo pela regra larga: até 3 símbolos quaisquer entre os grupos, para cobrir hífens, barras e separadores
  duplos;
- a máscara do Senado (3 primeiros e 2 últimos dígitos);
- a máscara da Receita (6 do meio);
- qualquer dígito colado a `**`;
- 10 dígitos isolados;
- e conta a máscara sem dígitos.

| Coluna | CPF completo | Máscara do Senado | Máscara da Receita | Dígito colado a `**` | Sem dígitos | Leitura |
| ------ | ------------ | ----------------- | ------------------ | -------------------- | ----------- | ------- |
| `despesa_ceap.fornecedor_nome` | **0** | **0** | **0** (eram 62) | **0** | 62 | Razão social de MEI com o CPF trocado por `***.***.***-**` |
| `candidatura.sq_candidato` e `bem_declarado.sq_candidato` | 38 e 390 | 0 | 0 | 0 | 0 | Falso positivo: sequencial do TSE. Os 38 valores distintos de 11 dígitos foram testados, e **0** têm dígitos verificadores de CPF válidos |
| `coleta.sha256` | 4 | 0 | 0 | 0 | 0 | Falso positivo: hash hexadecimal |
| demais 50 colunas | 0 | 0 | 0 | 0 | 0 | — |

- **Notas**: há 237 de `terceiro_pf`, todas com o nome "Prestador pessoa física" e `fornecedor_doc` nulo, e 16.268 de
  `pessoa_juridica`, todas com CNPJ formatado.
- **Tela**: baixei o `gastos.csv?ano=2026` dos **90 senadores com notas** (16.595 linhas). O resultado:
  - CPF completo pela regra larga: **0**;
  - máscara parcial: **0**;
  - linhas com `***.***.***-**`: 62.
  - Sobraram 5 linhas em que um dígito encosta num `*`. São falsos positivos: um nome que termina em `*`, seguido do
    CNPJ da coluna ao lado.
  - Das 237 linhas de "Prestador pessoa física", nenhuma tem documento.

**R3: PASS** no banco e na tela.

## A coleta só troca dados da própria Casa

Sem mudança desde a rodada 3. M04, M05, M11 e M16 continuam mortos.

## Sensor de discriminação

- **Ambiente**: um worktree temporário, criado com `git worktree add --detach …/verif4/wt HEAD` e preparado com
  `pnpm install --offline`. O script é `…/verif4/mutantes.py`, e cada substituição exige um número exato de
  ocorrências.
- **Execução**: para cada mutante, roda o seed e depois o vitest. Se o vitest não matar, roda `pnpm build` (saída 0 em
  todos) e o e2e completo. No fim, `git checkout -- src` e a confirmação de que `src` e `tests` ficaram limpos (nenhum
  mutante deixou sujeira).
- **M22 da rodada 3**: não se aplica mais, porque o `max-sm:contents` saiu do código em `bb97def`. No lugar dele entra o
  M22n.

| # | Mutação | Resultado | Teste que matou |
| - | ------- | --------- | --------------- |
| M01 | tira `LS` das licenças | Morto | vitest |
| M02 | "Votou" vira a orientação no alinhamento | **Vivo, equivalente** (a guarda do M13 tira o voto secreto antes) | — |
| M02b | M02 sem a guarda | Morto | vitest |
| M03–M07 | rodada 1 | Mortos | vitest |
| M08 | "Divergiu do partido" | Morto | `senador.spec.ts:82` [D] |
| M09 | todos em exercício | Morto | vitest |
| M10 | votação secreta sem "Orientação: não se aplica" | Morto | `senador.spec.ts:82` [D e M] |
| M11 | votações da Câmara apagam as `PLEN-SF` | Morto | vitest |
| M12 / M12m | "0 de 0" no desktop / "sem votações" no celular | Mortos | `senador.spec.ts:246` [D] / [M] |
| M13–M16 | rodadas 2 e 3 | Mortos | vitest |
| M17 | liderança com o partido atual | Morto | `senador.spec.ts:82` [D] |
| M18, M19 | rodadas 2 e 3 | Mortos | vitest |
| M20 | desliga a máscara no nome | Morto | `privacy.test.ts:36` e outros |
| M20b | a máscara só pega 11 dígitos sem pontuação | Morto | `privacy.test.ts:36`, `:45`, `:49` |
| M21a, M21b, M21c | ordinal do suplente | Mortos | `senador.spec.ts:115` [M] e [D]; `perfil-senador.test.ts:87` |
| **M22n (novo)** | contêiner do perfil com `flex-col-reverse`: no celular, a lateral sobe para antes de Gastos | **Vivo (só visual)** | nenhum. Nenhum teste confere a ordem do celular |
| M23 | `gap` do Mandato compacto volta a 14 px | Vivo (só visual) | nenhum. A paridade cobre (M14) |
| M24 | marca volta a `tracking-tight` | Vivo (só visual) | nenhum. A paridade cobre (V23) |
| **M25 (novo)** | volta o regex da rodada 3 (sem hífen entre grupos, sem barra, um separador só) | Morto | `privacy.test.ts:45`, `:49` |
| **M26 (novo)** | volta a máscara parcial da Receita no nome | Morto | `privacy.test.ts:36`, `:45`, `:49` |
| **M27 (novo)** | tira o `(?<!\d)` | Morto | `privacy.test.ts:56` |
| **M28 (novo)** | tira o `(?!\d)` | Morto | `privacy.test.ts:56` |
| **M29 (novo)** | `{0,3}` vira `?` (um separador só) | Morto | `privacy.test.ts:45`, `:49` |
| **M30 (novo)** | tira a barra dos separadores | Morto | `privacy.test.ts:49` |

**Resultado: 35 execuções, 31 mortes.**

- Ficaram 4 vivos: M02, que é equivalente, e M22n, M23 e M24, que são só visuais.
- Nenhum vivo muda o resultado de um requisito da spec.
- Sem contar o equivalente e os 3 visuais: 31 de 31. Contando tudo: 31 de 35 (89%).
- **Sensor: PASS**, com a ressalva da lacuna 3 (M22n).

## Paridade visual

Detalhes em `paridade/verificacao-4.md`. São 130 itens:

- 3 N/V;
- 7 INTENCIONAIS, com as divergências aceitas: V12, V13, V14, C18, P10, M12 e C32;
- 120 PASS;
- 0 FAIL.

**Paridade = 120 ÷ 120 = 100%.** A meta de 95% é atingida.

- Pessimista, com N/V contado como FAIL: 97,6%.
- **B03 corrigido**: no celular, a aba ativa acompanha a seção na linha de leitura, nos dois perfis medidos.
- A ordem do DOM voltou a ser a ordem visual. Com isso, o risco de WCAG 1.3.2 e 2.4.3 da rodada 3 fica resolvido.

## Lacunas ranqueadas

1. **O CPF parcial do relatório antigo ainda está no repositório local.**
   - A ref `refs/heads/backup/feat-senadores-antes-da-limpeza` e a ref `refs/original/refs/heads/feat/senadores`
     apontam para `65ce785`. As duas contêm o antigo `b2943c6`, cujo `.specs/features/perfil-senador/validation.md`
     traz 1 máscara do Senado de um fornecedor real.
   - O reflog (289 entradas) também mantém esse objeto.
   - O `HEAD` está limpo, e `origin` não tem ramo do Senado.
   - Risco: um `git push --all`, um `push --mirror` ou um clone do diretório publicaria o dado.
   - Correção, que cabe ao usuário por ser uma remoção:
     - `git branch -D backup/feat-senadores-antes-da-limpeza`;
     - `git update-ref -d refs/original/refs/heads/feat/senadores`;
     - `git reflog expire --expire=now --all && git gc --prune=now`.
   - Os rascunhos da rodada 3 em `…/scratchpad/verif3/` (`csv/`, `p10003806.html`, `p10004639.html`) também guardam a
     máscara antiga e podem ser apagados.
2. **R3 contra a fonte, para a Câmara (fora deste banco).**
   - O documento do prestador PF segue a máscara da Receita, que mostra os 6 dígitos do meio (`src/lib/privacy.ts`,
     `mascararCpf`).
   - O Senado publica o CPF de pessoa física com os 3 primeiros e os 2 últimos dígitos.
   - Se a mesma pessoa física fornece a um deputado com o CPF completo na fonte da Câmara e a um senador, a tela do
     Auditaja mais a fonte pública do Senado remontam o número.
   - É o mesmo raciocínio da premissa da spec (`spec.md:37`) e da lacuna 1 da rodada 3. Não aparece em
     `auditaja_senado_dev`, que não tem notas da Câmara (0 máscaras da Receita).
   - Cabe ao usuário decidir se o documento PF da Câmara e o da SCEAPS-02 também devem ficar sem dígitos.
3. **Nada automático guarda a ordem do celular nem a aba ativa.**
   - O M22n vive: uma inversão inteira da ordem do celular passa no e2e. O B03 regrediu na rodada 3 sem nenhum teste
     falhar e hoje só a paridade manual o confere (`src/components/perfil/abas.tsx:23-35`).
   - Correção: um e2e no celular que role até Bens e confira `aria-current="location"` na aba "Bens", e que confira a
     ordem gastos < votações < bens < mandato < fontes.
4. **Exemplo de máscara do Senado no código e na spec.**
   - Em `spec.md:37`, `spec.md:86` e `src/ingest/senado.ts:199`, o exemplo de "CPF já mascarado pelo Senado" usa
     dígitos que não são os da fixture fictícia (`tests/fixtures/senado/ceaps-2026.json` usa só zeros).
   - Sem rede, não dá para saber se é o CPF de uma pessoa real. Na dúvida, troque pelo exemplo fictício da fixture.
5. **Processo.**
   - `.specs/STATE.md:40` e `:43` ainda dizem "aguardando decisões do usuário" e "verificação nº 4", embora as
     decisões já tenham sido tomadas.
   - `tasks.md:427` (T16) ainda descreve a "ordem do celular (Mandato antes de Bens)", que foi revertida, e as
     correções da rodada 3 (`bb97def`, `1c0910c`, `32679b9`) não têm tarefa.
   - `paridade/rubrica.md:32-44` não lista as divergências I10, I11, I13 e I14 aceitas.
6. **Ressalvas antigas que continuam** (não bloqueiam):
   - SCAD-05: `parlamentar.coleta_id` aponta só para a lista, e as coletas ficam fora da transação
     (`src/ingest/senado.ts:361-377`).
   - "CNPJ válido" é só "14 dígitos" (`src/lib/privacy.ts:31`).
   - A AD-005 separa as votações pelo órgão, não pela `casa` (`src/ingest/camara.ts:378`).

---

## Rodada 3 (resumo)

**Veredito**: FAIL, na faixa `e4e563d..be9cf19` (o hash é de antes da reescrita).

- **Requisitos**: 44 PASS e 1 GAP (SCAD-04).
- **Gates**: vitest 183/183. No e2e, 131 passaram e 1 falhou: o teste de ordem do celular, por corrida com o
  `Suspense`.
- **Sensor**: 25 de 29 mortos. O M22 ficou vivo e não era equivalente.
- **Paridade**: (a) 94,5%, com a regressão do B03.
- **R3**: FAIL, porque a máscara da Receita no nome, junto com a máscara do Senado publicada no relatório da rodada 2,
  remontava o CPF.

O que a rodada 4 encontrou dessas lacunas:

- A máscara no nome ficou sem dígitos, e o regex foi ampliado.
- O teste instável e a reordenação via CSS saíram (I14).
- O B03 foi corrigido.
- O M22 não se aplica mais.
- A SCAD-04 foi emendada.
- O histórico do ramo foi reescrito, mas ficaram refs locais (lacuna 1).

## Rodada 2 (resumo)

**Veredito**: FAIL.

- **Requisitos**: 43 PASS e 2 GAP.
- **Sensor**: 16 de 20 mortos.
- **Paridade**: (a) 92,1%.
- **R3**: FAIL, com CPF completo na razão social de MEI em 62 notas.

## Rodada 1 (resumo)

**Veredito**: FAIL.

- **Requisitos**: 37 PASS, 7 GAP e 1 FAIL (SCAD-05).
- **Sensor**: 8 de 12 mortos.
- **Paridade**: 82,5%.
- **Limite de 60 resultados**: FAIL.
