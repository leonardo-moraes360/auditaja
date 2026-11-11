# Perfil do senador: validação

**Result**: FAIL (rodada 2)

- **Data**: 2026-11-11
- **Spec**: `.specs/features/perfil-senador/spec.md` (45 requisitos), `design.md`, `tasks.md` (T1–T15), AD-004 em `.specs/STATE.md`
- **Faixa do diff**: total `e4e563d..96e0fc0` (18 commits, 48 arquivos, +5947/−123). Correções desta rodada:
  `187abaf..96e0fc0` (`c4222dd`, `3434d79`, `a2af0f6`, `4258b22`, `96e0fc0`; 21 arquivos, +1803/−92)
- **Verificador**: independente (autor ≠ verificador). Adversarial: na dúvida, FAIL; sem `file:line`, sem cobertura.
- **Ambiente**: Postgres em docker (5436). Testes em `auditaja_senado_test`, dados reais em `auditaja_senado_dev`
  (245 senadores, 81 em exercício). As páginas reais estão em `http://127.0.0.1:3243`. Gates e mutantes rodaram em
  worktrees temporários (`…/scratchpad/verif2/wt` e `wt2`, com e2e na porta 3245), já removidos. O worktree real ficou
  intacto: `git status --porcelain` vazio antes e depois, salvo estes relatórios. O seed do banco de teste foi
  reaplicado no fim.

## Por que FAIL

1. **A R3 é violada no banco real e na tela.** A razão social de fornecedores MEI traz o CPF completo do dono
   ("NOME SOBRENOME 12345678901"). São 62 notas da CEAPS, com 17 CPFs distintos e válidos (dígitos verificadores
   conferidos). Os CPFs aparecem no CSV de 14 senadores e na tabela "Maiores fornecedores" de 2 (10003806 e
   10004639). A verificação 1 não pegou isso.
2. **A paridade (a) ficou em 92,1%, abaixo de 95%** (`paridade/verificacao-2.md`). Ela só chega a 98,3% se o usuário
   aceitar as divergências I10–I14. Há ainda 2 FAIL sem cobertura (V23 e M14). Os dados contradizem o motivo da I12.
3. **O sensor tem 3 mutantes vivos que não são equivalentes.** São eles: M16, a coleta de órgãos da Câmara apagando as
   comissões do Senado; M17, o partido do dia no rótulo da liderança; e M19, o nascimento do detalhe que não chega ao
   banco.
4. **Ficam 2 GAP de requisito: SCAD-04 e SERR-03 no celular.**
5. **O banco real não foi recoletado com o código novo.** A tabela `coleta` ainda tem a linha `senado_api_detalhes`
   com a URL `…/senador/{codigo}`, e as 3 notas `desconhecido` ainda guardam o nome. Sem rede, a SCAD-05 e a nova
   SCEAPS-02 só têm evidência nas respostas gravadas dos testes.

## Gates

| Gate | Comando | Resultado |
| ---- | ------- | --------- |
| Unit + integração | `pnpm test` (TEST_DATABASE_URL = auditaja_senado_test, depois do seed) | 16 arquivos, **179 passaram**, 0 falharam, 0 pulados |
| e2e + axe | `pnpm build` e `E2E_PORT=3245 PW_CHROME=… pnpm test:e2e` | **131 passaram**, 0 falharam, 7 pulados. Os 6 da rodada 1 mais `senador.spec.ts:253` (celular), que tem justificativa: a explicação dos bens só existe no desktop, e o artboard SenadorMobile também não a tem |
| Build | `pnpm lint`, `pnpm typecheck`, `pnpm format:check`, `pnpm build` | os quatro com saída 0 |

**Não regressão do deputado: PASS.** A suíte inteira passa. Nesta rodada, o único teste do deputado que mudou foi
`tests/e2e/perfil.spec.ts:176`, com a versão da metodologia 1.4 → 1.6 (`4258b22`; o commit diz que a 1.5 está
reservada a outro ramo). Os componentes compartilhados que mudaram ficaram atrás de `senado` (`secoes.tsx:388`,
`:429-460`, `:815-905`, `:955-964`) ou seguem o protótipo comum: o gráfico com 211 px (`secoes.tsx:177`), que fecha
também a pendência X02 do deputado, e o avatar da lista (`foto.tsx`, `parlamentares/page.tsx`). Nenhuma asserção do
deputado ficou mais fraca.

## Tarefas

As tarefas T1 a T15 estão marcadas `[x]` em `tasks.md`. Conferi o "Done when" de cada correção:

- **T13**: "Mutantes M04 e M11 morrem". **Confirmado.** Os dois morrem em `tests/integracao/coleta-senado.test.ts:159`.
- **T14**: as correções de paridade estão aplicadas, menos as que viraram divergência proposta.
- **T15**: "Mutantes M02 e M12 morrem". **Parcial.**
  - O M12 morre no desktop (`tests/e2e/senador.spec.ts:241`).
  - O M02, reaplicado como na rodada 1, sobrevive, mas é equivalente. A nova guarda (`src/data/perfil.ts:353`) zera as
    orientações de toda votação secreta, e "Votou" só existe em votação secreta.
  - Para provar isso, rodei a variante M02b (M02 sem a guarda). Ela morre em `perfil-senador.test.ts:78` e `:201`.

`.specs/STATE.md` (Handoff) está desatualizado: ainda diz "T1–T12" e "Next step: Verifier".

**Emendas de spec feitas pelo autor** (`c4222dd` e `3434d79`), sem registro de aprovação do usuário:

- **SCEAPS-02**: passou de "IF é um CPF" para "IF não é um CNPJ válido". A emenda é mais restritiva e protege a R3.
- **SVOT-06**: passou a pedir "Votou (secreto)" no celular. A emenda alinha a spec ao artboard aprovado.

Aceito as duas nesta verificação, mas elas precisam ser ratificadas pelo usuário.

## Checagem ancorada na spec

Legenda: **PASS** = um teste afirma o resultado definido pela spec. **GAP** = sem teste, com teste que não
discrimina, ou com comportamento parcial. **FAIL** = o comportamento contraria a spec.

### Coletar os senadores

| ID | Resultado definido pela spec | Evidência | Resultado |
| -- | ---------------------------- | --------- | --------- |
| SCAD-01 | `casa='senado'`, `id = 10000000 + código` | `tests/unit/senado-ingest.test.ts:32`; `tests/unit/senado.test.ts:16` | PASS |
| SCAD-02 | `em_exercicio` só para quem está em `/lista/atual` | `tests/unit/senado-ingest.test.ts:42`; M09 morto | PASS |
| SCAD-03 | mandato, participação, bloco, suplentes com ordem | `tests/unit/senado-ingest.test.ts:50` | PASS |
| SCAD-04 | sexo F/M e **nascimento vindo de `/senador/{codigo}`** | A função nova `nascimentoDoDetalhe` (`src/ingest/senado.ts:161-165`) é testada em `tests/unit/senado-ingest.test.ts:229-241`. **A ligação em `coletarSenadores` (`src/ingest/senado.ts:368-371`) não é testada**: o mutante M19, que tira `nascimentos.set`, sobrevive a toda a suíte (179/179). Nenhum teste de integração lê `data_nascimento` depois da coleta | **GAP** (M19 vivo) |
| SCAD-05 | uma linha em `coleta` por resposta, com URL, SHA-256 e licença, e cada registro apontando para ela | `src/ingest/senado.ts:361-377`; `tests/integracao/coleta-senado.test.ts:80-107` (6 respostas viram 6 linhas novas, URLs reais, comissões e suplentes apontam para a sua). M15 morto. Ressalvas: `parlamentar.coleta_id` aponta só para a lista da legislatura, mas `data_nascimento` vem do detalhe e `em_exercicio` da lista atual; as linhas `senado_api_detalhe` ficam sem nenhum registro que as referencie; o banco real ainda tem a coleta antiga (lacuna 6) | PASS (com ressalvas) |
| SCAD-06 | regravar sem duplicar e sem alterar deputados | `tests/integracao/coleta-senado.test.ts:62-78`, `:109-114` | PASS |

### Gastos da CEAPS

| ID | Resultado definido pela spec | Evidência | Resultado |
| -- | ---------------------------- | --------- | --------- |
| SCEAPS-01 | `valor_liquido = valorReembolsado` | `tests/unit/senado-ingest.test.ts:103` | PASS |
| SCEAPS-02 (emendada) | documento que não é CNPJ válido → "Prestador pessoa física"; CPF de 11 dígitos mascarado; nos outros casos, sem documento; nunca o CPF completo | `tests/unit/senado-ingest.test.ts:116`, `:125`, `:243-258`; M06 e M18 mortos. Ressalvas: "CNPJ válido" é só "14 dígitos" (`src/lib/privacy.ts:31`), sem conferir os dígitos verificadores. E o CPF completo entra pelo **nome** de fornecedor MEI, caso que esta cláusula não cobre (ver a R3) | PASS (literal) |
| SCEAPS-03 | sem tipo → "Não informado pelo Senado" | `tests/unit/senado-ingest.test.ts:132` | PASS |
| SCEAPS-04 | descartar e contar | `tests/unit/senado-ingest.test.ts:137`; `tests/integracao/coleta-senado.test.ts:116` | PASS |
| SCEAPS-05 | título, total e média mensal | `tests/integracao/perfil-senador.test.ts:34`; `tests/e2e/senador.spec.ts:38` | PASS |
| SCEAPS-06 | sem teto; aviso | `tests/integracao/perfil-senador.test.ts:43`; `tests/e2e/senador.spec.ts:61`; M07 morto | PASS |
| SCEAPS-07 | trocar notas de senadores sem tocar deputados | `tests/integracao/coleta-senado.test.ts:116`; M05 morto | PASS |

### Votações, presença e alinhamento

| ID | Resultado definido pela spec | Evidência | Resultado |
| -- | ---------------------------- | --------- | --------- |
| SVOT-01 | `SF-{seq}`, `PLEN-SF`, matéria, ementa, data, resultado, secreta | `tests/unit/senado-ingest.test.ts:149`, `:163` | PASS |
| SVOT-02 | voto com sigla e partido do dia | `tests/unit/senado-ingest.test.ts:169` | PASS |
| SVOT-03 | orientações ligadas e normalizadas | `tests/unit/senado-ingest.test.ts:177`; `tests/unit/senado.test.ts:34` | PASS |
| SVOT-04 | no máximo 2 requisições por ano | `tests/integracao/coleta-senado.test.ts:135` | PASS |
| SVOT-05 | `PLEN-SF` do ano mais recente, mais recentes primeiro | `tests/integracao/perfil-senador.test.ts:50` | PASS |
| SVOT-06 (emendada) | "Votou (voto secreto)" no D, "Votou (secreto)" no M, e "Orientação: não se aplica" | `tests/e2e/senador.spec.ts:82-89` (os dois viewports); M10 e M13 mortos | PASS |
| SVOT-07 | "Ausente: {motivo}"; "Não compareceu" | `tests/unit/senado.test.ts:114`; `tests/e2e/senador.spec.ts:82` | PASS |
| SVOT-08 | "Divergiu da liderança"; "Votou como a liderança orientou" | `tests/e2e/senador.spec.ts:82`, `:38`; M08 morto | PASS |

### Indicadores do senador

| ID | Resultado definido pela spec | Evidência | Resultado |
| -- | ---------------------------- | --------- | --------- |
| SPRES-01 | 7 siglas presentes | `tests/unit/senado.test.ts:68` | PASS |
| SPRES-02 | 21 siglas fora do denominador | `tests/unit/senado.test.ts:73`; M01 morto | PASS |
| SPRES-03 | presentes ÷ (registros − licenças); "{p} de {d} em {ano}" | `tests/unit/senado.test.ts:83`; `tests/integracao/perfil-senador.test.ts:65` | PASS |
| SPRES-04 | média simples dos senadores **em exercício** | `tests/integracao/perfil-senador.test.ts:209-214`: o seed tem o senador afastado 10009003, com 100% de presença, e a média continua 88 | PASS (lacuna da rodada 1 fechada) |
| SALI-01 | só a liderança do próprio partido no voto | `tests/unit/senado.test.ts:40`, `:52`; `tests/integracao/perfil-senador.test.ts:78`; M03 morto | PASS |
| SALI-02 | só Sim/Não com Sim/Não; "Divergiu em {d} de {n} votações abertas" | `tests/integracao/perfil-senador.test.ts:201-207` com orientação do PFX na secreta SF-seed-3 (`src/db/seed.ts:551-552`); M13 e M02b mortos | PASS (lacuna da rodada 1 fechada) |
| SALI-03 | ignorar Governo, Maioria etc. | `tests/unit/senado.test.ts:47`; M03 morto | PASS |

### Perfil e lista do senador

| ID | Resultado definido pela spec | Evidência | Resultado |
| -- | ---------------------------- | --------- | --------- |
| SUI-01 | trilha | `tests/e2e/senador.spec.ts:6` | PASS |
| SUI-02 | "Senador(a) por {UF} ({UF})", partido, bloco | `tests/e2e/senador.spec.ts:17-24`, `:31` | PASS |
| SUI-03 | selos de mandato e participação | `tests/e2e/senador.spec.ts:17`, `:31` | PASS |
| SUI-04 | Casa, **UF**, início, fim, situação, bloco, suplentes com ordem | `tests/e2e/senador.spec.ts:111-136` ("Minas Gerais" em `:124`); celular compacto em `:115-120` | PASS (lacuna da rodada 1 fechada) |
| SUI-05 | Senado como fonte, com data e link | `tests/integracao/perfil-senador.test.ts:102`; `tests/e2e/senador.spec.ts:152`; `{código}` literal corrigido (`secoes.tsx:911-913`, asserção em `senador.spec.ts:133`) | PASS |
| SUI-06 | filtros com contagem; `?casa=senado` só senadores | `tests/integracao/perfil-senador.test.ts:141`, `:153`, `:177-197` (81 sem corte); M14 morto. Medido: "81 resultado(s)" e 81 cartões | PASS (meta "81 na lista" atingida) |
| SUI-07 | cartão "Senador(a)", partido, UF | `tests/e2e/senador.spec.ts:180` | PASS |
| SUI-08 | placeholder novo | `tests/e2e/senador.spec.ts:216` | PASS |
| SUI-09 | `?casa=` desconhecido = Todos | `tests/integracao/perfil-senador.test.ts:159`; `tests/e2e/senador.spec.ts:207` | PASS |
| SUI-10 | feed, contestar, CSV pelo id | `tests/e2e/senador.spec.ts:167` | PASS |
| SUI-11 | metodologia e fontes | `tests/e2e/senador.spec.ts:226` | PASS |

### Bens

| ID | Resultado definido pela spec | Evidência | Resultado |
| -- | ---------------------------- | --------- | --------- |
| SBENS-01 | casar TSE com senador | `tests/unit/senado-ingest.test.ts:197` | PASS |
| SBENS-02 | mesmo cálculo e a nota dos 8 anos | `tests/integracao/perfil-senador.test.ts:113`; `tests/e2e/senador.spec.ts:253-262` (só desktop: o artboard do celular também não tem a nota) | PASS |

### Casos de borda

| ID | Resultado definido pela spec | Evidência | Resultado |
| -- | ---------------------------- | --------- | --------- |
| SERR-01 | 401/403 → `ColetaBloqueada` | `tests/unit/http.test.ts:124`; `tests/integracao/coleta-senado.test.ts:149` | PASS |
| SERR-02 | objeto único = lista | `tests/unit/senado.test.ts:26`; `tests/unit/senado-ingest.test.ts:77` | PASS |
| SERR-03 | "Sem votações registradas em {ano}" no lugar da presença | Desktop: `src/app/parlamentares/[id]/page.tsx:211-212`, com asserção em `tests/e2e/senador.spec.ts:241-247`; M12 morto. **Celular**: `page.tsx:220-221` mostra "—" e "sem votações", e o próprio teste confirma isso (`senador.spec.ts:244`). A spec não prevê texto curto (ao contrário da SVOT-06 emendada), e não há artboard desse estado | **GAP** (celular diverge da spec) |
| SERR-04 | estado vazio de gastos | `tests/e2e/senador.spec.ts:246` ("Nenhuma despesa publicada para {ano}."); `tests/integracao/perfil-senador.test.ts:216` | PASS (lacuna da rodada 1 fechada) |

**Placar**: 43 PASS, 2 GAP (SCAD-04, SERR-03), 0 FAIL, de 45.

### Metas da spec (Goals)

| Meta | Resultado | Evidência |
| ---- | --------- | --------- |
| 81 senadores na busca e na lista, cada um com perfil | PASS | `src/data/perfil.ts:54` (limite de 100 para o Senado); `/parlamentares?casa=senado` mostra 81 cartões e "81 resultado(s)" (D e M). Observação: "Todos" ainda mostra "60+ resultado(s)" e 60 cartões |
| Bloco com fonte, data e link | PASS, com ressalva | SCAD-05 cumprida no código. O banco real ainda tem a linha antiga com `{codigo}` (lacuna 6) |
| **R3: nenhum CPF de terceiro completo no banco ou na tela** | **FAIL** | ver "R3 no banco real" |
| R7: até 1 req/s e menos de 200 requisições | PASS por construção | sem mudança no número de requisições: 2 + 2×81 + 1 + 2 = 167 (`src/ingest/senado.ts:344-358`) |
| Perfil do deputado igual | PASS | gates acima |

## R3 no banco real (`auditaja_senado_dev`)

Fiz uma varredura de todas as 55 colunas de texto do esquema `public`. O script está em
`…/scratchpad/verif2/r3.sql`. Procurei um CPF de 11 dígitos isolado, com ou sem pontuação, e a máscara do Senado.

| Coluna | CPF completo | Máscara do Senado | Leitura |
| ------ | ------------ | ----------------- | ------- |
| `despesa_ceap.fornecedor_nome` | **62 linhas** | 0 | **17 CPFs distintos, todos com dígitos verificadores válidos**, na razão social de fornecedores MEI. Exemplo omitido do relatório (dado de terceiro). Todas as 62 notas estão como `pessoa_juridica`, porque o documento é um CNPJ válido, e por isso o nome é gravado inteiro (`src/ingest/senado.ts:226`, `nomeFornecedorPublicavel` em `src/lib/privacy.ts:40-42`) |
| `candidatura.sq_candidato`, `bem_declarado.sq_candidato` | 38 e 390 | 0 | Falso positivo: é o identificador sequencial do TSE (11 ou 12 dígitos), não um CPF |
| demais 52 colunas | 0 | 0 | — |

Exposição na tela, conferida no servidor 3243:

- `/parlamentares/{id}/gastos.csv?ano=2026` traz o CPF completo para **14 senadores** (10000581, 10000825, 10003806,
  10004639, 10005672, 10005718, 10005748, 10005793, 10005906, 10005988, 10005990, 10006305, 10006338, 10006372).
- A tabela "Maiores fornecedores" do perfil mostra o CPF completo para **2 senadores**: 10003806 e 10004639.

Outras conferências:

- As 234 notas `terceiro_pf` têm `fornecedor_doc` nulo e o nome "Prestador pessoa física".
- As 3 notas `desconhecido` ainda têm nome de empresa. A correção da T13 não rodou contra o banco real.

**R3: FAIL.** O código novo não resolve o caso: o MEI tem CNPJ válido e o nome passa direto. A leitura da Câmara usa
o mesmo `nomeFornecedorPublicavel`, então o perfil do deputado provavelmente tem o mesmo problema. Não conferi,
porque não posso usar outros bancos.

## A coleta só troca dados da própria Casa

| Direção | Código | Teste | Mutante |
| ------- | ------ | ----- | ------- |
| Senado → suplente, órgãos, CEAPS, votações | `src/ingest/senado.ts:387-390`, `:409`, `:442-447` | `tests/integracao/coleta-senado.test.ts:62`, `:116`, `:135` | M05 morto |
| Câmara → CEAP | `src/ingest/camara.ts:328-334` | `tests/integracao/coleta-senado.test.ts:159-188` | **M04 morto** (era vivo) |
| Câmara → votações | `src/ingest/camara.ts:375-381` (`<> 'PLEN-SF'`) | `tests/integracao/coleta-senado.test.ts:159-188` | **M11 morto** (era vivo) |
| Câmara → órgãos | `src/ingest/camara.ts:400-406` | **nenhum** (o teste AD-004 não chama `coletarOrgaos`) | **M16 vivo** |

A separação continua sendo pelo órgão nas votações das duas Casas (`<> 'PLEN-SF'` na Câmara e `= 'PLEN-SF'` no
Senado). A AD-004 manda separar por `casa`. É um desvio menor, que segue sem correção.

## Sensor de discriminação

O sensor rodou num worktree temporário, criado com `git worktree add --detach …/verif2/wt HEAD` e
`pnpm install --offline`. O script é `…/verif2/mutantes.py`, e cada substituição exige exatamente uma ocorrência do
trecho.

Para cada mutante: seed, depois `vitest run`. Se o vitest não matasse, rodavam `pnpm build` (saída 0 em todos) e o e2e
completo. O arquivo era restaurado com `git checkout` dentro da cópia. O M19 rodou num segundo worktree temporário
(`wt2`), só com vitest. Os dois worktrees foram removidos.

| # | File:line | Mutação | Resultado | Teste que matou |
| - | --------- | ------- | --------- | --------------- |
| M01 | `src/lib/senado.ts:84` | tira `LS` das licenças | Morto | `tests/unit/senado.test.ts:83`; `tests/integracao/perfil-senador.test.ts:65`, `:72`, `:209` |
| M02 | `src/data/perfil.ts:358` | "Votou" vira a orientação da liderança no alinhamento (como na rodada 1) | **Vivo, equivalente** | A guarda nova (`perfil.ts:353`) zera as orientações da votação secreta, e "Votou" só existe nela |
| M02b | `src/data/perfil.ts:353` + `:358` | M02 sem a guarda | Morto | `tests/integracao/perfil-senador.test.ts:78`, `:201`, `:50` |
| M03 | `src/lib/senado.ts:77` | sem orientação do partido, vale a do Governo | Morto | `tests/unit/senado.test.ts:52` |
| M04 | `src/ingest/camara.ts:330-332` | CEAP da Câmara apaga as notas do ano sem filtro de Casa | **Morto** | `tests/integracao/coleta-senado.test.ts:159` |
| M05 | `src/ingest/senado.ts:409` | CEAPS do Senado apaga sem filtro de Casa | Morto | `tests/integracao/coleta-senado.test.ts:116` |
| M06 | `src/ingest/senado.ts:216-219` | grava o CPF que a fonte já mascarou | Morto | `tests/unit/senado-ingest.test.ts:116` |
| M07 | `src/data/perfil.ts:289` | teto da UF para senador | Morto | `tests/integracao/perfil-senador.test.ts:43` |
| M08 | `src/components/perfil/secoes.tsx:384` | "Divergiu do partido" no senador | Morto (e2e) | `tests/e2e/senador.spec.ts:82` [desktop] |
| M09 | `src/ingest/senado.ts:135` | todo senador da legislatura em exercício | Morto | `tests/unit/senado-ingest.test.ts:42` |
| M10 | `src/components/perfil/secoes.tsx:431` | votação secreta sem "Orientação: não se aplica" | Morto (e2e) | `tests/e2e/senador.spec.ts:82` [desktop e celular] |
| M11 | `src/ingest/camara.ts:378` | votações da Câmara apagam também as `PLEN-SF` | **Morto** | `tests/integracao/coleta-senado.test.ts:159` |
| M12 | `src/app/parlamentares/[id]/page.tsx:212` | "Sem votações registradas" vira "0 de 0 em {ano}" | **Morto** (e2e) | `tests/e2e/senador.spec.ts:241` [desktop] |
| M13 (novo) | `src/data/perfil.ts:353` | tira a guarda: a orientação volta a aparecer na leitura da votação secreta | Morto | `tests/integracao/perfil-senador.test.ts:201`, `:50` |
| M14 (novo) | `src/data/perfil.ts:54` | volta o limite de 60 para o Senado | Morto | `tests/integracao/perfil-senador.test.ts:177` |
| M15 (novo) | `src/ingest/senado.ts:374` | comissões sem coleta própria (apontam para a lista atual) | Morto | `tests/integracao/coleta-senado.test.ts:80` |
| M16 (novo) | `src/ingest/camara.ts:403-404` | coleta de órgãos da Câmara apaga as comissões dos senadores | **Vivo** | nenhum (vitest 179/179, e2e 131/131) |
| M17 (novo) | `src/components/perfil/secoes.tsx:429` | rótulo "Liderança do {partido}" volta a usar o partido atual | **Vivo** | nenhum (vitest e e2e passam) |
| M18 (novo) | `src/ingest/senado.ts:217` | documento malformado volta a gravar o nome (R3) | Morto | `tests/unit/senado-ingest.test.ts:244` |
| M19 (novo) | `src/ingest/senado.ts:370` | o nascimento do detalhe não é passado ao cadastro | **Vivo** | nenhum (vitest 179/179) |

**Sensor**: 20 execuções, contando M02 e M02b como duas.

- Morreram 16: M01, M02b, M03–M15 e M18.
- Ficaram vivos 4: M02 é equivalente; M16, M17 e M19 não são.
- Sem contar o equivalente, 16 de 19 morreram (84%). Na conta estrita, 16 de 20 (80%).
- Os 4 vivos da rodada 1 já não sobrevivem: M04, M11 e M12 morrem, e M02 virou equivalente.

**Sensor FAIL**, por M16, M17 e M19.

## Paridade visual

Detalhes em `paridade/verificacao-2.md`. São 130 itens (129 mais o novo M14), com 3 N/V, 117 PASS e 10 FAIL.

- **(a) Com as divergências propostas I10–I14 contadas como FAIL: 117 ÷ 127 = 92,1%.** Fica abaixo da meta de 95%.
- **(b) Se o usuário aceitar I10–I14, os 8 itens saem do denominador: 117 ÷ 119 = 98,3%.** Atinge a meta.
- Ficam 2 FAIL sem cobertura: V23 (`letter-spacing` da marca) e M14 (o `gap` do Mandato compacto).
- Os dados contradizem o motivo da I12. Os 150 suplentes têm `sexo` em `parlamentar` (por `10000000 + codigo`), e a
  Lourdinha Pereira é `F`. A I14 também é contestável na parte M12: a ordem do celular dá para corrigir com CSS.

## Lacunas ranqueadas

1. **R3: CPF completo de dono de MEI na razão social do fornecedor** (banco, CSV de 14 senadores, perfil de 2).
   - Código: `src/ingest/senado.ts:226` e `src/lib/privacy.ts:40-42`. Só pessoa física passa pelo rótulo genérico, e o
     nome de pessoa jurídica é gravado como veio.
   - Correção: em `nomeFornecedorPublicavel`, ou numa função nova aplicada também à coleta da Câmara
     (`src/ingest/camara.ts`, `linhaCeap`), trocar toda sequência de 11 dígitos isolada, com ou sem pontuação, pela
     máscara da Receita.
   - Depois, uma migração ou recoleta para limpar as 62 notas do banco real, e um teste unitário com
     "NOME 12345678901" e CNPJ válido.
   - Conferir também o banco da Câmara.
2. **A ligação do nascimento não é testada (M19 vivo, SCAD-04).**
   - Código: `src/ingest/senado.ts:368-371`.
   - Correção: em `tests/integracao/coleta-senado.test.ts:62-78`, conferir `data_nascimento = '1976-10-23'` de 10005672
     depois de `coletarSenadores`.
3. **A coleta de órgãos da Câmara não tem teste de proteção do Senado (M16 vivo, AD-004).**
   - Código: `src/ingest/camara.ts:400-406`.
   - Correção: no teste `AD-004` (`tests/integracao/coleta-senado.test.ts:159`), chamar também `coletarOrgaos` com um
     CSV mínimo e conferir que `orgao_membro` dos senadores fica igual.
   - Aproveitar para trocar os filtros de votação por `casa`, como a AD-004 manda (`camara.ts:378`, `senado.ts:443-447`).
4. **O rótulo "Liderança do {partido do dia}" não é testado (M17 vivo).**
   - Código: `src/components/perfil/secoes.tsx:429` e `src/data/perfil.ts:382`.
   - Correção: no seed, um voto do senador com `sigla_partido` diferente do atual e com orientação dessa liderança. No
     e2e desktop, conferir "Liderança do {sigla do dia}: …". No integração, conferir `partidoNoVoto`.
5. **Paridade (a) de 92,1%.**
   - Corrigir V23 (`src/components/topo.tsx:20`: `tracking-normal sm:tracking-[-0.02em]`).
   - Corrigir M14 (`src/components/perfil/secoes.tsx:811`: `gap-2.5` no celular do senador).
   - Corrigir C29 em vez de pedir a I12: fazer um `left join parlamentar` nos suplentes e usar `ª` quando
     `sexo = 'F'`, em `secoes.tsx:831` e `:867`.
   - Avaliar se M12 dá para corrigir com `order` no celular (`src/app/parlamentares/[id]/page.tsx`).
   - Levar ao usuário I10, I11, I13 e a parte C32 da I14.
6. **O banco real ainda tem a coleta antiga.** As linhas são `senado_api_detalhes` com `…/senador/{codigo}` e
   `senado_api_senadores` com o hash de hashes, mais as 3 notas `desconhecido` com nome.
   - Correção: rodar `pnpm ingest senado 2026` com rede antes de publicar, e conferir em `coleta` 2 + 2×81 linhas do
     cadastro.
7. **SERR-03 no celular.**
   - Código: `src/app/parlamentares/[id]/page.tsx:220-221`.
   - Correção: emendar a SERR-03 como foi feito com a SVOT-06 (texto curto no celular, com aprovação do usuário) ou
     mostrar o texto completo.
8. **SCAD-05, ressalva de proveniência.**
   - `parlamentar.coleta_id` aponta só para a lista da legislatura (`src/ingest/senado.ts:377`), embora o nascimento
     venha do detalhe e a situação da lista atual. As coletas de detalhe ficam órfãs.
   - As coletas são registradas fora da transação (`:361-377`), então uma falha na gravação deixa linhas de `coleta`
     sem dados.
   - Correção: registrar dentro da transação e documentar no design qual coleta cada coluna cita.
9. **SCEAPS-02, ressalva.**
   - "CNPJ válido" é só "14 dígitos" (`src/lib/privacy.ts:31`).
   - Correção: conferir os dígitos verificadores, ou deixar explícito na spec que "válido" é o formato.
10. **Processo.**
    - Ratificar com o usuário as emendas de SCEAPS-02 e SVOT-06.
    - Atualizar o Handoff de `.specs/STATE.md` (diz T1–T12).

Observações fora do placar:

- Continuam valendo as da rodada 1: "Senador por Acre" em vez de "pelo Acre", e os prestadores pessoa física
  agrupados numa linha só.
- A lista "Todos" com o banco só do Senado diz "60+ resultado(s)" para 81 em exercício. Com a Câmara coletada isso é
  esperado, mas o texto "60+" engana enquanto só houver o Senado.

---

## Rodada 1 (resumo)

**Result**: FAIL, na faixa `e4e563d..187abaf`, com 13 commits.

- **Placar de requisitos**: 37 PASS, 7 GAP (SCAD-04, SPRES-04, SALI-02, SUI-04, SBENS-02, SERR-03, SERR-04) e 1 FAIL
  (SCAD-05: proveniência agregada e URL `…/senador/{codigo}`).
- **Gates**: vitest 170/170 e e2e 126 passaram, com 6 pulados.
- **Sensor**: 12 mutantes, 8 mortos e 4 vivos (M02, M04, M11, M12).
- **Paridade**: 82,5% (104 ÷ 126), com 22 FAIL e 3 N/V.
- **Meta "81 senadores na lista"**: FAIL, por causa do limite de 60.
- **R3**: foi dada como PASS, mas a varredura não pegou o CPF de MEI na razão social (rodada 2, lacuna 1).
- **Lacunas ranqueadas da rodada 1**:
  1. SCAD-05;
  2. a proteção Câmara → Senado (M04, M11);
  3. a paridade;
  4. o limite de 60;
  5. SALI-02 (M02);
  6. o partido do dia no rótulo;
  7. o `{código}` literal;
  8. SERR-03 (M12);
  9. SCAD-04;
  10. SBENS-02 e SERR-04;
  11. SPRES-04 e SUI-04;
  12. a R3 de documento malformado.
- **Situação na rodada 2**: as lacunas 1, 2, 4, 5, 6, 7, 8, 10, 11 e 12 foram corrigidas no código. A 3 ficou
  parcial. A 9 e a 6 estão corrigidas, mas sem teste que discrimine (M19 e M17 vivos).
