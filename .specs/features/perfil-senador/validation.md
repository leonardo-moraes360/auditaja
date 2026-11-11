# Perfil do senador: validação

**Result**: FAIL

- **Data**: 2026-11-11
- **Spec**: `.specs/features/perfil-senador/spec.md` (45 requisitos), `design.md`, `tasks.md`, AD-004 em `.specs/STATE.md`
- **Faixa do diff**: `e4e563d..187abaf` (commits `3032937` a `187abaf`, 13 commits, 40 arquivos, +4218/−105)
- **Verificador**: independente (autor ≠ verificador). Adversarial: na dúvida, FAIL; sem `file:line`, sem cobertura.
- **Ambiente**: Postgres em docker (5436). Testes em `auditaja_senado_test`. Dados reais em `auditaja_senado_dev`
  (245 senadores, 81 em exercício, CEAPS 2026, 67 votações, TSE 2022). Páginas reais em `http://127.0.0.1:3243`.
  Mutantes, build e e2e rodaram num worktree temporário (`/tmp/claude-1000/verif-senado/wt`, já removido). O worktree
  real não foi alterado: `git status --porcelain` igual ao início, só com estes relatórios novos em `.specs/`.

## Por que FAIL

1. **SCAD-05 não é cumprido.** A spec pede uma linha em `coleta` para cada resposta baixada. O código junta 2
   respostas numa linha e 162 respostas em outra, e grava nesta segunda uma URL com o marcador `{codigo}`.
2. **O sensor deixou 4 de 12 mutantes vivos (67% mortos).** Os testes não percebem quando a coleta da Câmara apaga
   dados do Senado. A AD-004 exige justamente o contrário.
3. **A paridade visual ficou em 82,5%**, abaixo da meta de 95% (`paridade/verificacao-1.md`).
4. **A meta 1 da spec ("os 81 senadores aparecem na lista") não é atingida.** `?casa=senado` mostra 60 cartões e o
   texto "60+ resultado(s)".

## Gates

| Gate | Comando | Resultado |
| ---- | ------- | --------- |
| Unit + integração | `pnpm test` (TEST_DATABASE_URL = auditaja_senado_test, depois do seed) | 16 arquivos, **170 passaram**, 0 falharam, 0 pulados |
| e2e + axe | `pnpm build` e `E2E_PORT=3242 … pnpm test:e2e` | **126 passaram**, 0 falharam, 6 pulados (todos por `test.skip(isMobile, …)` ou desktop-only, com justificativa: senador.spec.ts:7, :32; perfil.spec.ts:77, :228, :267, :277) |
| Build | `pnpm lint && pnpm typecheck && pnpm format:check` | os três com saída 0 |

**Não regressão do deputado: PASS.** A suíte inteira passa. O diff mexe em três testes do deputado, todos de forma
justificada. Em `tests/e2e/perfil.spec.ts:159` o placeholder muda, o que a SUI-08 manda. Em
`tests/e2e/perfil.spec.ts:176` a versão da metodologia passa a 1.4. Em `tests/integracao/coleta.test.ts:127` a conta
de "outros anos" passa a excluir os senadores do seed. Nenhuma asserção do deputado ficou mais fraca.

## Tarefas

As tarefas T1 a T12 de `tasks.md` estão todas marcadas `[x]`. A T12 diz que a coleta real foi "conferida à mão" e
não deixa evidência registrada. Conferi por SQL: 245 senadores, 81 em exercício, 70 titulares e 11 1º suplentes,
nenhum em exercício sem mandato, sexo ou nascimento.

## Checagem ancorada na spec

Legenda: **PASS** = o teste afirma o resultado definido pela spec. **GAP** = sem teste, ou com teste que não
discrimina o requisito. **FAIL** = o comportamento contraria a spec.

### Coletar os senadores

| ID | Resultado definido pela spec | Evidência (teste e asserção) | Resultado |
| -- | ---------------------------- | ---------------------------- | --------- |
| SCAD-01 | `casa='senado'`, `id = 10000000 + código` | `tests/unit/senado-ingest.test.ts:31-32` `toEqual([10005672, 10005918, 10006358])`, `every(casa==="senado")`; `tests/unit/senado.test.ts:17` | PASS |
| SCAD-02 | `em_exercicio` só para quem está em `/lista/atual` | `tests/unit/senado-ingest.test.ts:42-43` (5672 true, 5918 false); o mutante M09 morre aqui | PASS |
| SCAD-03 | início e fim do mandato, participação, bloco, suplentes com ordem | `tests/unit/senado-ingest.test.ts:49-59` (`2023-02-01`, `2031-01-31`, `Titular`, `Bloco Parlamentar Aliança`, `[[1,"Gemil Junior",6343],[2,…]]`, `1º Suplente`) | PASS |
| SCAD-04 | sexo F/M e **nascimento vindo de `/senador/{codigo}`** | `tests/unit/senado-ingest.test.ts:63-67` só confere o `Map` passado pelo próprio teste. A extração de `DetalheParlamentar…DataNascimento` (`src/ingest/senado.ts:347`) não tem asserção: `tests/integracao/coleta-senado.test.ts:60-76` não lê `data_nascimento`. No banco real, nenhum dos 81 em exercício está sem nascimento | GAP (teste fraco) |
| SCAD-05 | **uma linha em `coleta` por resposta**, com URL, SHA-256 e licença | `src/ingest/senado.ts:355-370`: as respostas de legislatura e atual viram uma linha só (hash de hashes). Os 162 detalhes e comissões viram outra, com `url = …/senador/{codigo}`, que não é uma URL real (no banco real: `senado_api_detalhes`, `https://legis.senado.leg.br/dadosabertos/senador/{codigo}`). O teste `tests/integracao/coleta-senado.test.ts:66-72` confere só a linha da lista | **FAIL** |
| SCAD-06 | regravar sem duplicar senadores nem suplentes e sem alterar deputados | `tests/integracao/coleta-senado.test.ts:73-75` (deputados `toEqual(antes)`), `:80-82` (contagens iguais) | PASS |

### Gastos da CEAPS

| ID | Resultado definido pela spec | Evidência | Resultado |
| -- | ---------------------------- | --------- | --------- |
| SCEAPS-01 | nota de senador cadastrado com `valor_liquido = valorReembolsado` | `tests/unit/senado-ingest.test.ts:104-107` (`462.18`, glosa 0) | PASS |
| SCEAPS-02 | nome "Prestador pessoa física"; CPF de 11 dígitos mascarado no padrão da Receita; CPF mascarado na fonte → sem documento | `tests/unit/senado-ingest.test.ts:117-120` (`fornecedor_doc` null, nome genérico), `:125-127` (`***.456.789-**`, sem `12345678901`); o mutante M06 morre | PASS |
| SCEAPS-03 | sem `tipoDespesa` → "Não informado pelo Senado" | `tests/unit/senado-ingest.test.ts:132` | PASS |
| SCEAPS-04 | descartar e informar a quantidade descartada | `tests/unit/senado-ingest.test.ts:137-138`; `tests/integracao/coleta-senado.test.ts:90` `{ notas: 3, descartadas: 1 }` | PASS |
| SCEAPS-05 | título "Gastos da cota do senador (CEAPS)", total do ano, média = total ÷ meses com notas | `tests/integracao/perfil-senador.test.ts:39-40` (15000, 5000); `tests/e2e/senador.spec.ts:49-50`, `:67` | PASS |
| SCEAPS-06 | sem linha nem barra de teto; aviso de valor reembolsado sem glosa e sem teto | `tests/integracao/perfil-senador.test.ts:46-47`; `tests/e2e/senador.spec.ts:58`, `:69-73`; o mutante M07 morre | PASS |
| SCEAPS-07 | trocar as notas do ano de senadores sem tocar nas de deputados | `tests/integracao/coleta-senado.test.ts:90-101`; o mutante M05 morre | PASS |

### Votações, presença e alinhamento

| ID | Resultado definido pela spec | Evidência | Resultado |
| -- | ---------------------------- | --------- | --------- |
| SVOT-01 | `SF-{seq}`, `PLEN-SF`, matéria, ementa, data, resultado, secreta | `tests/unit/senado-ingest.test.ts:148-164` | PASS |
| SVOT-02 | voto com a sigla do Senado e o partido do dia | `tests/unit/senado-ingest.test.ts:168-172` | PASS |
| SVOT-03 | orientações ligadas pelo sequencial; SIM/NÃO/LIVRE/OBSTRUÇÃO normalizados | `tests/unit/senado-ingest.test.ts:182-190`; `tests/unit/senado.test.ts:35-38` | PASS |
| SVOT-04 | no máximo 2 requisições por ano | `tests/integracao/coleta-senado.test.ts:111` `toHaveLength(2)` | PASS |
| SVOT-05 | `PLEN-SF` do ano mais recente, mais recentes primeiro | `tests/integracao/perfil-senador.test.ts:54-60` | PASS |
| SVOT-06 | "Votou (voto secreto)" e "Orientação: não se aplica" | `tests/e2e/senador.spec.ts:85-86`; `tests/unit/senado.test.ts:112`; o mutante M10 morre | PASS |
| SVOT-07 | "Ausente: {motivo}" para AP, MIS, MER, AUS; "Não compareceu" para NCom | `tests/unit/senado.test.ts:115-119`; `tests/e2e/senador.spec.ts:87` | PASS |
| SVOT-08 | filtro "Divergiu da liderança"; indicador "Votou como a liderança orientou" | `tests/e2e/senador.spec.ts:94`, `:52`; o mutante M08 morre | PASS |

### Indicadores do senador

| ID | Resultado definido pela spec | Evidência | Resultado |
| -- | ---------------------------- | --------- | --------- |
| SPRES-01 | 7 siglas contam como presença | `tests/unit/senado.test.ts:69-71` | PASS |
| SPRES-02 | 21 siglas saem do denominador | `tests/unit/senado.test.ts:74-76`; o mutante M01 morre | PASS |
| SPRES-03 | presentes ÷ (registros − licenças); texto "{p} de {d} em {ano}" | `tests/unit/senado.test.ts:84-85` (4/6 = 67%); `tests/integracao/perfil-senador.test.ts:68-69`; `tests/e2e/senador.spec.ts:51` "3 de 4 em 2026 · média do Senado 88%" | PASS |
| SPRES-04 | média simples **dos senadores em exercício** | `tests/integracao/perfil-senador.test.ts:75` (88). No seed os dois senadores com votos estão em exercício, então o filtro `em_exercicio` (`src/data/perfil.ts:186`) não é posto à prova | GAP (parcial) |
| SALI-01 | só a liderança do próprio partido, com nome normalizado | `tests/unit/senado.test.ts:41-45`, `:58-63`; `tests/integracao/perfil-senador.test.ts:82-84` | PASS |
| SALI-02 | só orientação Sim/Não com voto Sim/Não; "Divergiu em {d} de {n} votações abertas" | `tests/unit/senado.test.ts:94-106` cobre a função pura; `tests/e2e/senador.spec.ts:53`. **O mutante M02 sobreviveu**: o seed não tem orientação em votação secreta (`src/db/seed.ts:509-514`), então tratar "Votou" como voto que segue a liderança dentro de `perfilParlamentar` passa | GAP (mutante vivo) |
| SALI-03 | ignorar Governo, Maioria, Minoria, Oposição, B.Feminina e blocos | `tests/unit/senado.test.ts:48-50`, `:63`; `tests/integracao/perfil-senador.test.ts:81-82` (Governo "Não" ignorado em SF-seed-2); o mutante M03 morre | PASS |

### Perfil e lista do senador

| ID | Resultado definido pela spec | Evidência | Resultado |
| -- | ---------------------------- | --------- | --------- |
| SUI-01 | trilha "Parlamentares / Senado Federal / {nome}" | `tests/e2e/senador.spec.ts:10-14` | PASS |
| SUI-02 | "Senador(a) por {UF por extenso} ({UF})", partido, bloco | `tests/e2e/senador.spec.ts:24`, `:35` | PASS |
| SUI-03 | selo "Mandato {início}–{fim}" e selo da participação | `tests/e2e/senador.spec.ts:25-26`, `:34`; `tests/unit/rotulos.test.ts` (seloParticipacao) | PASS |
| SUI-04 | Casa, **UF**, início, fim, situação, bloco, suplentes com ordem | `tests/e2e/senador.spec.ts:107-115`; `tests/integracao/perfil-senador.test.ts:90-99`. Nenhum teste confere a UF por extenso no bloco Mandato | GAP (parcial: UF) |
| SUI-05 | Senado como fonte do cadastro, das votações e da CEAPS, com data de coleta e link | `tests/integracao/perfil-senador.test.ts:104-110`; `tests/e2e/senador.spec.ts:121-130` | PASS (ver SCAD-05: a proveniência dos detalhes aponta para `{codigo}`) |
| SUI-06 | filtros Todos/Câmara/Senado com contagem; `?casa=senado` só senadores | `tests/integracao/perfil-senador.test.ts:144-156`; `tests/e2e/senador.spec.ts:150-158` | PASS (a meta "81 na lista" falha: ver lacuna 4) |
| SUI-07 | cartão com "Senador(a)", partido, UF | `tests/e2e/senador.spec.ts:156-157` | PASS |
| SUI-08 | placeholder "Buscar deputado ou senador por nome ou UF" | `tests/e2e/senador.spec.ts:186`; `tests/e2e/perfil.spec.ts:159` | PASS |
| SUI-09 | `?casa=` desconhecido = Todos | `tests/integracao/perfil-senador.test.ts:161-165`; `tests/e2e/senador.spec.ts:175-179` | PASS |
| SUI-10 | feed, contestar e CSV pelo mesmo id | `tests/e2e/senador.spec.ts:134-143` (feed 200 com o nome, CSV com a nota, páginas abrem). O envio da contestação não é testado para senador | PASS |
| SUI-11 | metodologia com as regras do Senado; fontes listam o Senado | `tests/e2e/senador.spec.ts:194-204` | PASS |

### Bens

| ID | Resultado definido pela spec | Evidência | Resultado |
| -- | ---------------------------- | --------- | --------- |
| SBENS-01 | casar TSE com senador por nome civil e nascimento | `tests/unit/senado-ingest.test.ts:195-223` | PASS |
| SBENS-02 | bloco de bens com o mesmo cálculo e **a nota dos 8 anos** | `tests/integracao/perfil-senador.test.ts:116-119` confere os dados. Nenhum teste procura "8 anos" (`grep -rn "8 anos" tests/` vazio). O texto está em `src/components/perfil/secoes.tsx:552-553` | GAP (nota sem teste) |

### Casos de borda

| ID | Resultado definido pela spec | Evidência | Resultado |
| -- | ---------------------------- | --------- | --------- |
| SERR-01 | 401/403 → `ColetaBloqueada`, sem nova tentativa | `tests/unit/http.test.ts:124-127` (`it.each([401, 403])`); `tests/integracao/coleta-senado.test.ts:121-125` | PASS |
| SERR-02 | objeto único = lista de um item | `tests/unit/senado.test.ts:27`; `tests/unit/senado-ingest.test.ts:75-85` | PASS |
| SERR-03 | mostrar "Sem votações registradas em {ano}" | `tests/integracao/perfil-senador.test.ts:126-127` confere só `denominadorPresenca = 0`. Nenhum teste lê o texto. **O mutante M12 sobreviveu** | GAP (mutante vivo) |
| SERR-04 | bloco de gastos com o estado vazio do deputado | `tests/integracao/perfil-senador.test.ts:134-136` confere os dados. A tela da senadora sem notas (10009002) só passa pelo axe (`tests/e2e/a11y.spec.ts:27`), sem asserção do texto vazio | GAP (teste fraco) |

**Placar**: 37 PASS, 7 GAP, 1 FAIL, de 45.

### Metas da spec (Goals)

| Meta | Resultado | Evidência |
| ---- | --------- | --------- |
| 81 senadores na busca e na lista, cada um com perfil | **FAIL** na lista | `src/data/perfil.ts:53` `.limit(opts.limite ?? 60)` e sem paginação: `/parlamentares?casa=senado` real mostra 60 cartões e "60+ resultado(s)". Os 21 últimos em ordem alfabética só aparecem pela busca |
| Bloco com fonte, data e link | PASS, com ressalva | ver SCAD-05 e lacuna 7 |
| R3: nenhum CPF de terceiro completo | PASS | ver "R3 no banco real" |
| R7: até 1 req/s por host e menos de 200 requisições | PASS por construção | `src/ingest/senado.ts:333-353`: 2 + 2×81 requisições do cadastro, 1 da CEAPS e 2 das votações = 167 (mais 2 de robots.txt); todas pelo `ClienteEducado` |
| Perfil do deputado igual | PASS | gates acima |

## R3 no banco real (`auditaja_senado_dev`)

- As notas da CEAPS de senadores somam 16.505: 16.268 de pessoa jurídica, 234 `terceiro_pf` e 3 `desconhecido`.
- As 234 notas `terceiro_pf` têm `fornecedor_doc` nulo e o nome "Prestador pessoa física" (`count(fornecedor_nome <> 'Prestador pessoa física') = 0`).
- Procurei em todas as colunas de texto de todas as tabelas um CPF completo, com ou sem pontuação
  (`[0-9]{3}\.?[0-9]{3}\.?[0-9]{3}-?[0-9]{2}`, sem `/`): **0 linhas**.
- Procurei também a máscara do Senado (`999.***` ou `***.999`): **0 linhas**.
- As 3 notas `desconhecido` têm documento vazio e nome de empresa ("DPO Hoteis Ltda", "POSTO DE GASOLINA MUNIZ LTDA").
  Não são pessoa física, mas mostram um risco: se a fonte trouxer um CPF malformado, sem 11 dígitos e sem `*`, o nome
  é gravado (`src/ingest/senado.ts:205-215`). Fica como lacuna menor.

**R3: PASS.**

## A coleta só troca dados da própria Casa

| Direção | Código | Teste | Mutante |
| ------- | ------ | ----- | ------- |
| Senado → suplente, órgãos, CEAPS, votações | `src/ingest/senado.ts:382`, `:384`, `:404`, `:439-443` | `tests/integracao/coleta-senado.test.ts:73-75`, `:94`, `:112` | M05 morto |
| Câmara → CEAP | `src/ingest/camara.ts:328-334` (filtra `casa = 'camara'`) | **nenhum**: o teste da CEAP da Câmara usa um ano sem notas de senador | **M04 vivo** |
| Câmara → votações | `src/ingest/camara.ts:375-381` (`sigla_orgao <> 'PLEN-SF'`) | **nenhum** | **M11 vivo** |
| Câmara → órgãos | `src/ingest/camara.ts:400-406` | nenhum (não mutado) | — |

O código está certo hoje, mas nada protege a direção Câmara → Senado.

Há também um desvio menor da AD-004. A coleta de votações da Câmara separa as Casas pelo órgão (`<> 'PLEN-SF'`),
não por `casa`.

## Sensor de discriminação

Os mutantes rodaram numa cópia isolada (`git worktree add --detach /tmp/claude-1000/verif-senado/wt HEAD`). Para cada
um: seed, depois `vitest run`. Quando o vitest não morria e o mutante era de tela, também `pnpm build` e e2e. O arquivo
era restaurado com `git checkout` dentro da cópia.

| # | File:line | Mutação | Resultado | Teste que matou |
| - | --------- | ------- | --------- | --------------- |
| M01 | `src/lib/senado.ts:84` | tira `LS` de `LICENCAS_SENADO` | Morto | `tests/unit/senado.test.ts:73`, `:83`; `tests/integracao/perfil-senador.test.ts:65`, `:72` |
| M02 | `src/data/perfil.ts:353-354` | voto "Votou" (secreto) entra no alinhamento como se seguisse a liderança | **Vivo** | nenhum (unit e e2e passam) |
| M03 | `src/lib/senado.ts:77` | sem orientação do partido, vale a do Governo | Morto | `tests/unit/senado.test.ts:52` |
| M04 | `src/ingest/camara.ts:330-332` | CEAP da Câmara apaga as notas do ano **sem** filtro de Casa | **Vivo** | nenhum |
| M05 | `src/ingest/senado.ts:404` | CEAPS do Senado apaga as notas do ano sem filtro de Casa | Morto | `tests/integracao/coleta-senado.test.ts:85` |
| M06 | `src/ingest/senado.ts:207` | grava o CPF que a fonte já mascarou | Morto | `tests/unit/senado-ingest.test.ts:114` |
| M07 | `src/data/perfil.ts:288` | mostra o teto da UF para senador | Morto | `tests/integracao/perfil-senador.test.ts:43` |
| M08 | `src/components/perfil/secoes.tsx:384` | rótulo "Divergiu do partido" no senador | Morto (e2e) | `tests/e2e/senador.spec.ts:82` |
| M09 | `src/ingest/senado.ts:134` | marca todo senador da legislatura em exercício | Morto | `tests/unit/senado-ingest.test.ts:40` |
| M10 | `src/components/perfil/secoes.tsx:429-430` | votação secreta mostra a orientação em vez de "não se aplica" | Morto (e2e) | `tests/e2e/senador.spec.ts:82` |
| M11 | `src/ingest/camara.ts:378` | votações da Câmara apagam também as `PLEN-SF` do ano | **Vivo** | nenhum |
| M12 | `src/app/parlamentares/[id]/page.tsx:212` | "Sem votações registradas em {ano}" vira "0 de 0 em {ano}" | **Vivo** | nenhum (unit e e2e passam) |

**Sensor**: 12 mutantes, 8 mortos e 4 vivos (M02, M04, M11, M12). Sensor FAIL.

## Paridade visual

Detalhes em `paridade/rubrica.md` e `paridade/verificacao-1.md`.

**Paridade = 104 ÷ (104 + 22) = 82,5%**, abaixo da meta de 95%.

- Foram 129 itens.
- 3 itens ficaram como N/V, não verificáveis com os dados reais: L19, C10 e B04.
- Duas divergências decorrem da própria spec, C18 (CPF "—", SCEAPS-02) e C42 ("Votou (voto secreto)", SVOT-06).
  Precisam ser registradas como intencionais. Mesmo registradas, a paridade fica em 83,9%.

## Lacunas ranqueadas

1. **SCAD-05: a proveniência não é por resposta.**
   - `src/ingest/senado.ts:355-370`: as listas de legislatura e atual dividem uma linha. Os 162 detalhes e comissões
     dividem outra, com URL `…/senador/{codigo}`.
   - Correção: chamar `registrarColeta` para cada resposta (URL real e SHA-256 de cada uma) e apontar `parlamentar`
     e `orgao_membro` para a coleta da resposta de onde vieram. Também cabe um teste de integração que conte
     `coleta` por `fonte` (2 + 2×N linhas).
2. **A coleta da Câmara não tem teste que proteja os dados do Senado (M04 e M11 vivos; viola o espírito da AD-004).**
   - Código: `src/ingest/camara.ts:328-334` e `:375-381`.
   - Correção: em `tests/integracao/coleta.test.ts`, rodar `coletarCeap` e `coletarVotacoes` da Câmara em 2026 com o
     seed do senador e conferir que as notas de `SEED.senador` e as votações `PLEN-SF` ficam iguais. O mesmo vale
     para `coletarOrgaos`. Trocar o filtro das votações por casa ou por `sigla_orgao = 'PLEN'`, como manda a AD-004.
3. **Paridade de 82,5%, abaixo de 95%.** São 22 FAIL. Os principais:
   - bordas `#C9CAC2` onde o protótipo pede `#80858E`: `src/components/perfil/estilos.ts:6`, `:13` e
     `src/components/perfil/secoes.tsx:177`;
   - ordem e compactação do Mandato no celular: `src/app/parlamentares/[id]/page.tsx:275-281` e
     `src/components/perfil/secoes.tsx:791-860`;
   - 6 votações no resumo: `src/components/perfil/secoes.tsx:387`;
   - comissão com nome curto e sigla: `secoes.tsx:842-843`;
   - "Senadores, assessorias…": `secoes.tsx:914`;
   - "Liderança: Sim" no celular: `secoes.tsx:432`;
   - layout da lista: `src/app/parlamentares/page.tsx:14`, `:87`, `:94`, `:103`, `src/components/perfil/foto.tsx:9`
     e a busca do topo na lista.

   Correção: aplicar a lista de `paridade/verificacao-1.md` e registrar C18 e C42 como I10 e I11.
4. **A meta "81 senadores na lista" não é atingida.**
   - `src/data/perfil.ts:53` (`limit 60`) e `src/app/parlamentares/page.tsx:111` ("60+").
   - Correção: tirar o limite quando `casa = 'senado'` (são só 81) ou paginar. Acrescentar um e2e/integração com mais
     de 60 senadores, ou conferir no seed que `buscarParlamentares({casa:'senado'})` não corta.
5. **SALI-02: a exclusão do voto secreto do alinhamento não é testada de ponta a ponta (M02 vivo).**
   - Código: `src/db/seed.ts:509-514`.
   - Correção: no seed, pôr uma orientação do PFX em `SF-seed-3` (secreta) e manter em
     `tests/integracao/perfil-senador.test.ts:81` o resultado `{comparaveis: 2, iguais: 1}`.
6. **"Liderança do {partido}" usa o partido atual, não o do dia.**
   - `src/components/perfil/secoes.tsx:432` usa `parlamentar.sigla_partido`, mas a orientação escolhida vem de
     `voto.sigla_partido` (`src/data/perfil.ts:356`).
   - No banco real, 10 senadores votaram por outro partido. Exemplo: Soraya Thronicke (10005988) votou como PODE em
     24/03/2026 sob orientação de "Podemos", e a página mostra "Liderança do PSB: Sim".
   - Correção: devolver o partido do voto em `listaVotacoes` e usá-lo no rótulo, com um teste para o caso de troca de
     partido.
7. **O texto "{código}" aparece literalmente na tela.**
   - `src/components/perfil/secoes.tsx:870`: "Fonte: Senado, Dados Abertos /senador/{código} · TSE (candidaturas)." é
     uma string JS, sem interpolação.
   - Correção: interpolar `codigoSenado(p.id)`.
8. **SERR-03: o texto não é testado (M12 vivo).**
   - Código: `src/app/parlamentares/[id]/page.tsx:211-212`.
   - Correção: e2e em `/parlamentares/10009002` depois de apagar os votos, ou um seed com senador sem votos, que
     confira "Sem votações registradas em 2026".
9. **SCAD-04: a extração do nascimento a partir de `/senador/{codigo}` não é testada.**
   - Código: `src/ingest/senado.ts:347`.
   - Correção: em `tests/integracao/coleta-senado.test.ts`, conferir `data_nascimento` de 10005672 vindo de
     `senador-5672.json`.
10. **SBENS-02 e SERR-04: textos sem asserção.**
    - Correção: e2e que confira a nota "a cada 8 anos" (`secoes.tsx:552`) e o estado vazio "Nenhuma despesa
      publicada para 2026." na senadora 10009002.
11. **SPRES-04 e SUI-04: asserções parciais.**
    - Correção: no seed, um senador fora de exercício com votos, que não pode entrar na média. No e2e do Mandato,
      conferir "Minas Gerais".
12. **R3, borda.**
    - `src/ingest/senado.ts:205-215`: um documento malformado sem `*` cai em `desconhecido` e guarda o nome do
      fornecedor.
    - Correção: tratar como `terceiro_pf` todo documento que não seja CNPJ válido, ou gravar o nome só para CNPJ.

Observações fora do placar:

- "Senador por Acre" e "Senadora por Maranhão" seguem a spec ao pé da letra, mas soam mal: o natural é "pelo Acre"
  e "pelo Maranhão".
- Todos os prestadores pessoa física de um senador viram uma linha só, "Prestador pessoa física", entre os maiores
  fornecedores (o agrupamento em `src/data/perfil.ts:262-266` usa nome + documento nulo).
