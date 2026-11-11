# Validation: emendas-transparencia — FAIL ❌ (rodada 5)

**Data**: 2026-11-11 (rodada 5, focada nas lacunas de teste da rodada 4)
**Faixa**: `d12a683..b8aaf47` (1 commit, só `tests/`: `tests/unit/privacy.test.ts`, `tests/unit/privacidade-nomes.test.ts`,
`tests/e2e/emendas.spec.ts`; +45/−0)
**Verificador**: sub-agente independente (autor ≠ verificador), só leitura no worktree real; mutações em worktree
temporário

---

## Veredito da rodada 5

**FAIL**, por um mutante novo que sobrevive (Minor, só teste). Os 7 sobreviventes da rodada 4 em código da feature
(P03, P04, P06, P07, P10, D01, D06) **morrem todos**, cada um num teste que cita a regra; 4 das 5 variações novas
morrem; o gate passa inteiro; o banco dev não tem CPF em nenhum dos três campos; a paridade da rodada 4 continua
valendo (100%), porque nenhum arquivo de `src/` mudou.

O que sobra: **N1**, regex de CPF com o último grupo `\d{1,2}` em vez de `\d{2}` (`src/lib/privacy.ts:45`). Com ele,
números de **10 dígitos** passam a ser mascarados, contra a docstring "11 dígitos" (`src/lib/privacy.ts:44`) e "CPF
solto". Nenhum teste tem número de 10 dígitos no nome. Não é vazamento (mascara a mais, não a menos), mas tem efeito
real: o banco dev tem 5 linhas de `despesa_ceap.fornecedor_nome` com 10 dígitos soltos (ex.: "JD COMUNICACAO,
MARKETING E MIDIA LTDA 2000004245") que o mutante estragaria. O código real está certo; falta o teste.

G05 (filtro `ano` do `gastos.csv`, anterior à feature e fora do diff) segue vivo, como nas rodadas 3 e 4; não pesa
no veredito.

## 1. Código de produção e paridade

- `git diff d12a683..HEAD -- src` → 0 linhas; `git diff --stat d12a683..HEAD` → só os 3 arquivos de teste acima.
- `git show b8aaf47`: só adiciona asserções (nenhuma removida ou afrouxada). `tests/unit/privacy.test.ts:35-49` é o
  bloco de `feat/senadores`; `tests/unit/privacidade-nomes.test.ts` é novo; `tests/e2e/emendas.spec.ts:300-305`
  acrescenta o laço de datas inválidas dentro do teste C22 existente.
- **Paridade**: `paridade/verificacao-4.md` (65 PASS, 0 FAIL, 9 INTENCIONAL = 100%) continua valendo: sem mudança em
  `src/`, e o e2e que cobre cada item passa (gate abaixo).

## 2. Sensor

Worktree temporário (`git worktree add --detach <scratchpad>/mut HEAD`), `pnpm install --frozen-lockfile --offline`,
`.env` e `.env.local` copiados, banco `auditaja_emendas_test`. Um mutante por vez, troca exata conferida por script
(uma ocorrência) e `git checkout --` depois. Mutantes de `privacy.ts`: `vitest run` inteiro. Mutantes da rota:
`pnpm build` + `playwright test tests/e2e/emendas.spec.ts` (desktop e celular, porta 3282). Em cada morto, conferi no
log o teste e a asserção que falharam.

### Sobreviventes da rodada 4, refeitos

| # | `arquivo:linha` | Mutação | Resultado (teste que falhou) |
| --- | --- | --- | --- |
| P03 | `src/lib/privacy.ts:45` | sem `(?<!\d)` | ✅ morto: `unit/privacidade-nomes.test.ts:13-16` "não mascara CNPJ colado ao nome…" e `unit/privacy.test.ts:45-47` "não mexe em CNPJ…" |
| P04 | `src/lib/privacy.ts:45` | sem `(?!\d)` | ✅ morto: idem (`privacidade-nomes.test.ts:14`, `privacy.test.ts:46`) |
| P06 | `src/lib/privacy.ts:45` | separadores só `.` e `-` | ✅ morto: `privacidade-nomes.test.ts:10-11` "mascara CPF escrito com espaços"; `privacy.test.ts:43` |
| P07 | `src/lib/privacy.ts:45` | sem a flag `g` | ✅ morto: `privacidade-nomes.test.ts:7-8` "mascara todos os CPFs…"; `:18-20` "favorecido de emenda com dois CPFs" |
| P10 | `src/lib/privacy.ts:41` | `nomeFornecedorPublicavel` sem `mascararCpfsNoTexto` | ✅ morto: `privacy.test.ts:36-43` "mascara CPF solto na razão social de MEI…" |
| D01 | `src/app/parlamentares/[id]/gastos.csv/route.ts:8` | sem a volta pela data ISO | ✅ morto: `e2e/emendas.spec.ts:301-303` C22, `&de=2026-02-30` → 500 (esperado 200), nos dois projetos |
| D06 | `…/gastos.csv/route.ts:53` | `de` volta ao regex antigo | ✅ morto: `e2e/emendas.spec.ts:303` C22, `&de=2026-02-30` → 500 |
| G05 | `…/gastos.csv/route.ts:51` | remove o filtro `ano` | ❌ sobreviveu (anterior à feature, fora do diff) |

### Variações novas

| # | `arquivo:linha` | Mutação | Resultado (teste que falhou) |
| --- | --- | --- | --- |
| N1 | `src/lib/privacy.ts:45` | último grupo `\d{2}` → `\d{1,2}` (aceita 10 dígitos) | ❌ **sobreviveu** (172/172 passam) |
| N2 | `src/lib/privacy.ts:45` | último separador `[-.\s]?` → `[-.]?` | ✅ morto: `privacidade-nomes.test.ts:10-11`; `privacy.test.ts:43` |
| N3 | `src/lib/privacy.ts:45` | segundo separador `[.\s]?` → `[.]?` | ✅ morto: idem |
| N4 | `…/gastos.csv/route.ts:8` | compara só o ano (`slice(0, 4)`) na volta pela data ISO | ✅ morto: `e2e/emendas.spec.ts:303` C22, `&de=2026-02-30` → 500 |
| N5 | `…/gastos.csv/route.ts:8` | `&&` → `\|\|` entre a checagem `NaN` e a volta ISO | ✅ morto: `e2e/emendas.spec.ts:303` C22, `&de=2026-02-30` → 500 |

**Resultado**: 11/12 mortos em código da feature (P03, P04, P06, P07, P10, D01, D06, N2, N3, N4, N5); 1 sobrevivente
novo (N1); G05 fora do diff. FAIL ❌

**Isolamento**: `git status --porcelain` do worktree real vazio antes e depois do sensor e do gate (só este relatório
muda). Nenhum `git stash`. Worktree temporário removido (`git worktree remove --force`, `git worktree prune`). Os
servidores do Playwright (3282 no sensor, 3272 no gate) pararam sozinhos; 3243 é de outra frente e não foi tocado.

## 3. Gate (worktree real, `b8aaf47`)

| Comando | Resultado |
| --- | --- |
| `TEST_DATABASE_URL=…/auditaja_emendas_test pnpm test` | 18 arquivos, 172 passaram, 0 falharam (rodada 4: 166; +6 de `b8aaf47`) |
| `pnpm typecheck`, `pnpm lint`, `pnpm build` | exit 0 |
| `pnpm test:e2e` (`E2E_PORT=3272`, Chromium 1228) | 132 passaram, 4 pulados (os mesmos de `perfil.spec.ts`), 0 falharam |

O número de e2e não muda porque as asserções novas entraram no teste C22 existente (`emendas.spec.ts:290`).

## 4. Banco dev (`auditaja_emendas_dev`)

Regex de CPF solto (11 dígitos com `.`, espaço ou `-`, sem dígito colado), no Postgres:

| Tabela.coluna | Linhas | Com CPF | Já mascaradas (`***.***.***-**`) |
| --- | --- | --- | --- |
| `despesa_ceap.fornecedor_nome` | 123.497 | **0** | 389 |
| `emenda_favorecido.favorecido_nome` | 114.669 | **0** | 57 |
| `sancao.nome` | 22 | **0** | 0 |

O achado 1 da rodada 4 (389 CPFs na CEAP) está resolvido: a CEAP foi recoletada e as mesmas 389 linhas agora
aparecem mascaradas. 5 nomes da CEAP têm 10 dígitos soltos e estão inalterados (é o caso que N1 quebraria).

## Plano de correção (só teste)

### Correção 5: número de 10 dígitos no nome não é CPF (Minor, regra do `mascararCpfsNoTexto`) — N1
- **Tarefa**: em `tests/unit/privacidade-nomes.test.ts:13`, asserir que "JD COMUNICACAO LTDA 2000004245" (10 dígitos)
  sai inalterado, e de preferência também "X 123.456.789-0".
- **Pronto quando**: N1 morre; P03, P04, P06, P07 seguem mortos.

## Rodada 5, continuação (`fd59ce8`)

`fd59ce8` só acrescenta 2 asserções em `tests/unit/privacidade-nomes.test.ts:17-19` ("MIDIA LTDA 2000004245" e
"A 123.456.789-0" saem inalterados); `git diff 819217a..HEAD -- src` → 0 linhas. Sensor em worktree temporário novo
(mesmo método), `vitest run` inteiro:

| # | `arquivo:linha` | Mutação | Resultado (teste que falhou) |
| --- | --- | --- | --- |
| N1 | `src/lib/privacy.ts:45` | último grupo `\d{2}` → `\d{1,2}` (aceita 10 dígitos) | ✅ morto: `privacidade-nomes.test.ts:13`, `:18-19` "não mascara CNPJ colado ao nome nem trechos de um número maior" |
| N6 | `src/lib/privacy.ts:45` | primeiro grupo `\d{3}` → `\d{2,3}` (aceita 10 dígitos) | ✅ morto: idem (`:18-19`) |
| N7 | `src/lib/privacy.ts:45` | último grupo `\d{2}` → `\d{2,3}` (aceita **12** dígitos soltos) | ❌ **sobreviveu** (172/172 passam) |

N7 mascara um número solto de 12 dígitos ("X 123456789012"), que não é CPF; os casos de `:14-16` têm 13 e 14 dígitos
e não o pegam. Mesma natureza de N1 (mascara a mais, não vaza). `pnpm test` no worktree real: 18 arquivos, 172
passaram (as asserções novas entraram num `it` existente). `git status --porcelain` vazio antes e depois; worktree
temporário removido.

**Veredito mantido: FAIL** (Minor, só teste). G05 segue registrado como anterior à feature e fora do escopo.

### Correção 6: número de 12 dígitos no nome não é CPF — N7
- **Tarefa**: em `tests/unit/privacidade-nomes.test.ts:13`, asserir que "X 123456789012" sai inalterado.
- **Pronto quando**: N7 morre; N1 e N6 seguem mortos.

## Rodada 5, segunda continuação (`c81b6b5`)

`c81b6b5` acrescenta `tests/unit/privacidade-nomes.test.ts:21-27` (tabela de 8 a 14 dígitos soltos; só 11 viram
`***.***.***-**`). `git diff 819217a..HEAD -- src` → 0 linhas. Sensor em worktree temporário novo, `vitest run` inteiro:

| # | Mutação em `src/lib/privacy.ts:45` | Resultado (teste que falhou) |
| --- | --- | --- |
| N7 | último grupo `\d{2}` → `\d{2,3}` | ✅ morto: `privacidade-nomes.test.ts:21-27` ("12 dígitos: expected 'X ***.***.***-**'") |
| N8 | segundo grupo `\d{3}` → `\d{3,4}` | ✅ morto: `:21-27` (12 dígitos) |
| N12 | último separador obrigatório (`[-.\s]` sem `?`) | ✅ morto: `:21-27` (11 dígitos), `:7-8`, `:28-30`; `unit/privacy.test.ts:36`; `unit/emendas.test.ts:93`; `integracao/sancoes.test.ts:151` |
| N13 | primeiro grupo `\d{3}` → `\d{3,}` | ✅ morto: `:13-19`, `:21-27`; `unit/privacy.test.ts:45` |
| N14 | terceiro grupo `\d{3}` → `\d{2,3}` | ✅ morto: `:13-19`, `:21-27` |
| N9 | primeiro separador `[.\s]?` → `[.\s]*` (aceita vários separadores, ex. "123  456 789 01") | ❌ **sobreviveu** (173/173) |
| N10 | primeiro separador `[.\s]?` → `[-.\s]?` (aceita hífen, ex. "123-456-789-01") | ❌ **sobreviveu** (173/173) |

Os quantificadores ficaram todos cobertos; os separadores, não. N9 e N10 **mascaram a mais** do que o código real, e
isso mostra que o código real deixa inteiro um CPF escrito como "123-456-789-01" ou "123  456.789-01". Nenhum teste
afirma o comportamento nesses formatos, nem para mascarar nem para não mascarar. No banco dev não há nenhum nome nesses
formatos (0 em `despesa_ceap`, `emenda_favorecido` e `sancao`, conferido com regex de separadores repetidos ou com
hífen), então hoje não há vazamento. `pnpm test` no worktree real: 18 arquivos, 173 passaram. `git status
--porcelain` vazio antes e depois; worktree temporário removido.

**Veredito mantido: FAIL** (Minor). G05 segue registrado como anterior à feature e fora do escopo.

### Correção 7: separadores do CPF no nome — N9, N10
- **Tarefa**: decidir a regra para "123-456-789-01" e para separador repetido (decisão de produto: com a R3, o
  natural é mascarar, e aí é mudança de código); depois asserir o comportamento escolhido em
  `tests/unit/privacidade-nomes.test.ts`.
- **Pronto quando**: N9 e N10 morrem (ou ficam equivalentes ao código corrigido).

## Resumo da rodada 5

**Geral**: ❌ Not Ready por um teste. Código, paridade (100%), gate e banco dev estão OK.
**Sensor**: N1, N6, N7, N8, N12, N13, N14 mortos; sobreviventes N9 e N10 (separadores em `src/lib/privacy.ts:45`); G05 fora do diff.
**Gate**: 172 vitest + 132 e2e passaram; typecheck, lint e build ok.

---

# Histórico: rodada 4

**Data**: 2026-11-11 (rodada 4, autorizada pelo usuário depois do limite de 3)
**Spec**: `.specs/features/emendas-transparencia/spec.md` (43 critérios + 22 Assumptions)
**Faixa do diff**: `e4e563d..4ec5758` (branch `feat/emendas-transparencia`); o que mudou desde a rodada 3 é
`088fc3e..4ec5758` (4 commits, 12 arquivos, +113/−18: `1a5ddc7`, `b77e095`, `b57c537`, `4ec5758`)
**Verificador**: sub-agente independente (autor ≠ verificador), só leitura no worktree real; mutações em worktree
temporário

---

## Veredito (rodada 4)

**FAIL**, só por lacunas de teste. O código de produção está certo em todos os casos que conferi à mão e em dados
reais. O gate passa, os 43 critérios têm evidência `arquivo:linha` com o valor da spec e a paridade é **100%**
(`paridade/verificacao-4.md`). Os 6 sobreviventes da rodada 3 que estão no diff (N09, U30, G01, G02, U22, B03)
morrem agora, e o 500 com `?ate=2026-13-99` acabou (200, conferido no seed e em dados reais).

O código novo desta rodada, porém, tem regras que nenhum teste discrimina. Sobreviveram 8 dos 24 mutantes não
equivalentes, 7 deles em código novo:

1. **R3/AD-002, CPF no nome** (`src/lib/privacy.ts:45`, `:54`). Os testes só usam CPF colado ("52182290915") ou
   pontuado ("521.822.909-15"), um por nome. Passam sem que nenhum teste falhe: um regex que não aceita espaço
   (**P06**, "FULANO 521 822 909 15" fica com o CPF inteiro) e um regex sem a flag `g` (**P07**, o segundo CPF do
   nome fica inteiro). As duas formas são mascaradas hoje, mas só porque o código está certo.
2. **CNPJ no nome não pode ser mascarado** (docstring de `src/lib/privacy.ts:47-52`, "CNPJ (14 dígitos) não é
   afetado"). Tirar o `(?<!\d)` (**P03**) ou o `(?!\d)` (**P04**) passa sem que nenhum teste falhe. Com o mutante,
   "00469171000326HOTEL PHENICIA LTDA" (nome real da cota, um dos 14 nomes com 12 ou mais dígitos seguidos no banco
   dev) vira "00***.***.***-**HOTEL…". O único caso de raiz de CNPJ testado (`tests/unit/emendas.test.ts:101-104`,
   "11.854.334 DEILSON") tem 8 dígitos, e esse regex nunca o casaria, com ou sem as âncoras.
3. **`dataIsoValida`** (`src/app/parlamentares/[id]/gastos.csv/route.ts:8`, `:53`). O teste novo
   (`tests/e2e/emendas.spec.ts:300-302`) só usa `ate=2026-13-99`, que a checagem `NaN` já barra. Passam sem que
   nenhum teste falhe: tirar a volta pela data ISO (**D01**: `?de=2026-02-30` vira data válida para o JS e o Postgres
   devolve 500, `date/time field value out of range`, conferido no banco) e voltar o `de` ao regex antigo (**D06**:
   `?de=2026-13-99` volta a dar 500). Ou seja, metade da correção do achado 1 da rodada 3 não tem teste.
4. **Nome de fornecedor da cota** (`src/lib/privacy.ts:41`, fora dos 43 critérios, mas mudado neste diff): tirar
   `mascararCpfsNoTexto` (**P10**) passa sem que nenhum teste falhe nesta branch. `feat/senadores` tem o teste
   (`tests/unit/privacy.test.ts:38-43` lá), que só chega no merge.

Os outros dois: G05 (filtro `ano` do `gastos.csv`, anterior à feature, sobrevive como na rodada 3) e D03 (tirar o
regex de `dataIsoValida`), que é **equivalente**: `toISOString().slice(0, 10) === s` já obriga o formato
`AAAA-MM-DD`.

## Mudanças na spec desde a rodada 3

| Mudança (`4ec5758`, `spec.md:54`, `:140`) | Leitura |
| --- | --- |
| MET-01 e Assumption "Versão da metodologia": "1.4" → "1.5", "a 1.4 é da frente de presença, PR #6" | Registro honesto: não afrouxa nada, só evita colidir com outra frente. Código (`src/lib/metrics.ts:6`), e2e (`emendas.spec.ts:235`, `:252`; `perfil.spec.ts:176`) e página real ("Versão 1.5.", "Metodologia v1.5") batem |

---

## Conclusão das tarefas

`tasks.md` T1–T8 com "Done when" marcados; nenhuma parcial ou bloqueada. As correções das rodadas 1 a 3 e o
mascaramento de CPF vieram em commits de correção, sem tarefa nova em `tasks.md`.

---

## Critérios de aceitação ancorados na spec

Linhas reconferidas em `4ec5758`. Em relação à rodada 3, os testes de `tests/integracao/emendas.test.ts` depois da
linha 130 desceram 1 linha, e os de `tests/unit/emendas.test.ts` depois da 91 desceram 14.

### P1: Coletar emendas em lote

| Critério | Resultado definido na spec | `arquivo:linha` + asserção | Resultado |
| --- | --- | --- | --- |
| EMD-01 | ZIP baixado 1 vez, pelo `ClienteEducado`, do servidor de arquivos | `tests/integracao/emendas.test.ts:149` `pedidos.filter((u) => u === URL_EMENDAS)).toHaveLength(1)`; `:150` todos começam com `https://dadosabertos-download.cgu.gov.br/` | ✅ PASS |
| EMD-02 | `coleta` com `cgu_emendas`, URL, SHA-256, bytes, licença | `tests/integracao/emendas.test.ts:162-168` `toMatchObject({ url, sha256: sha256De(zip), bytes: zip.length, licenca: LICENCA_CGU, observacao: "base de 10/11/2026" })`, com o ZIP montado com a entrada de favorecidos primeiro (`:131`) | ✅ PASS (N09 morre) |
| EMD-03 | Só ano ≥ 2024 e tipo "Emenda Individual…" | `tests/integracao/emendas.test.ts:176` `toEqual(["202400010002", "202500010001"])`; `tests/unit/emendas.test.ts:58-69` | ✅ PASS |
| EMD-04 | Autor casa com 1 deputado → `parlamentar_id` dele | `tests/integracao/emendas.test.ts:177`; `tests/unit/emendas.test.ts:45-47` | ✅ PASS |
| EMD-05 | 0 ou >1 → descarta e conta no resumo | `tests/integracao/emendas.test.ts:151` `toEqual({ emendas: 2, favorecidos: 4, autoresDescartados: 2 })` | ✅ PASS |
| EMD-06 | "1.234,56" → 1234.56 nos 4 campos | `tests/unit/emendas.test.ts:22` `toBe("1234.56")`; `tests/integracao/emendas.test.ts:178-187` | ✅ PASS |
| EMD-07 | Favorecido com tipo, UF, município, ano/mês, valor | `tests/integracao/emendas.test.ts:201-216` | ✅ PASS |
| EMD-08 | PF → "Beneficiário pessoa física"; doc `***.ddd.ddd-**` ou nulo | `tests/integracao/emendas.test.ts:201-205`, `:219-221` `not.toContain("ACÁCIA")`, `"FULANO"`, `"12345678901"`; `tests/unit/emendas.test.ts:74-84` | ✅ PASS |
| EMD-09 | 14 dígitos → CNPJ formatado | `tests/integracao/emendas.test.ts:204` `"11.854.334/0001-49"`; `tests/unit/emendas.test.ts:86-90` | ✅ PASS |
| EMD-10 | Nova coleta substitui, sem duplicar | `tests/integracao/emendas.test.ts:227-228` `contar("emenda") === 2`, `contar("emenda_favorecido") === 4` | ✅ PASS |
| EMD-11 | Streaming latin1 `;` | `tests/integracao/emendas.test.ts:242-244` iterador assíncrono, `"ACÁCIA GONÇALVES"` | ✅ PASS |

### R3/AD-002: nenhum CPF completo nem parcial de pessoa física no nome de favorecido ou de sancionado

| Regra | Resultado definido | `arquivo:linha` + asserção | Resultado |
| --- | --- | --- | --- |
| Favorecido PJ (MEI) com CPF no nome | Nenhum dígito do CPF: `***.***.***-**` | `tests/unit/emendas.test.ts:93-96` `toEqual({ nome: "ALCIONE LUIZ SEBOLD ***.***.***-**", … })`; `:97-100` "FULANO 521.822.909-15" → `"FULANO ***.***.***-**"` | ⚠️ PASS com mutantes vivos: **P06** (CPF com espaços), **P07** (segundo CPF) |
| Sancionado com CPF no nome | Idem | `tests/integracao/sancoes.test.ts:38` fixture `"POSTO ILUSTRATIVO LTDA 12345678901"`; `:151` `nome: "POSTO ILUSTRATIVO LTDA ***.***.***-**"` | ✅ PASS (P02 morre) |
| Raiz de CNPJ / CNPJ no nome não é mascarado | Nome inalterado | `tests/unit/emendas.test.ts:101-104` `"11.854.334 DEILSON"` inalterado | ❌ GAP: **P03**, **P04** (nenhum caso com 14 dígitos seguidos no nome) |
| Favorecido PF | Nome trocado; doc só `***.ddd.ddd-**` | `tests/unit/emendas.test.ts:74-84`; `tests/integracao/emendas.test.ts:219-221` | ✅ PASS |
| Dados reais (banco dev, coleta de 11/11/2026 15:47, depois de `b77e095`) | 0 CPF no nome | `emenda_favorecido`: 0 nomes com 11 dígitos em forma de CPF, 57 com `***.***.***-**`, 0 com máscara parcial, 0 com 9–10 dígitos; `sancao`: 0; 7.963 linhas PF, todas com o rótulo genérico, 0 doc fora do padrão; `innerText` dos 4 perfis reais sem nenhum CPF | ✅ conferido |

### P1: Ver as emendas no perfil

| Critério | Resultado definido na spec | `arquivo:linha` + asserção | Resultado |
| --- | --- | --- | --- |
| EMDUI-01 | Aba "Emendas" entre "Gastos da cota" e "Votações", `#emendas` | `tests/e2e/emendas.spec.ts:13` `toEqual(["#gastos", "#emendas", "#votacoes"])` | ✅ PASS |
| EMDUI-02 | h2 "Emendas parlamentares individuais" entre gastos e votações | `tests/e2e/emendas.spec.ts:17-25` | ✅ PASS |
| EMDUI-03 | Mandato soma tudo; "Mandato todo" com `aria-current="page"` | `tests/e2e/emendas.spec.ts:32`; `tests/integracao/emendas-leitura.test.ts:37-43` | ✅ PASS |
| EMDUI-04 | `?emendas=AAAA#emendas`, soma do ano | `tests/e2e/emendas.spec.ts:93`, `:96-98` `R$ 4,0 mi`, "3 emendas do orçamento de 2025", "75%"; `tests/integracao/emendas-leitura.test.ts:125` | ✅ PASS |
| EMDUI-05 | "Empenhado" compacto + nº de códigos distintos | `tests/e2e/emendas.spec.ts:35-36` `R$ 11,1 mi`, "9 emendas, orçamentos de 2024 a 2026" | ✅ PASS |
| EMDUI-06 | "Pago até agora" = pago + restos; % arredondado | `tests/e2e/emendas.spec.ts:38-40` `R$ 7,0 mi`, "63% do empenhado, incluindo restos a pagar" | ✅ PASS |
| EMDUI-07 | "Transferências especiais (“emendas Pix”)" + % | `tests/e2e/emendas.spec.ts:41-43` `R$ 2,0 mi`, "18% do empenhado" | ✅ PASS |
| EMDUI-08 | Barras por ano só no mandato, rótulo com os anos | `tests/e2e/emendas.spec.ts:44-52`; `:99` `toHaveCount(0)` no ano | ✅ PASS |
| EMDUI-09 | 5 áreas, valor e % | `tests/e2e/emendas.spec.ts:59-60`; `tests/integracao/emendas-leitura.test.ts:61` | ✅ PASS |
| EMDUI-10 | 5 locais sem "MÚLTIPLO", rótulo, frase do Múltiplo | `tests/e2e/emendas.spec.ts:62-69`; `tests/integracao/emendas-leitura.test.ts:68` | ✅ PASS |
| EMDUI-11 | Até 5 favorecidos: nome, documento, tipo, município, valor | `tests/e2e/emendas.spec.ts:71-77`, `:85` | ✅ PASS |
| EMDUI-12 | Desktop: "…download em lote · base de DD/MM/AAAA" + coleta + 3 links; celular: rodapé curto | `tests/e2e/emendas.spec.ts:109-123`; `:106` celular; `tests/integracao/emendas.test.ts:167` `observacao: "base de 10/11/2026"` | ✅ PASS (N09 morre). ⚠️ precisão menor: `:106` segue sem "ver original" |
| EMDUI-13 | Frase de vazio exata; sem indicadores, gráfico, listas | `tests/e2e/emendas.spec.ts:129-134` | ✅ PASS |
| EMDUI-14 | Valor inválido → "mandato" | `tests/unit/emendas.test.ts:133-140`; `tests/e2e/emendas.spec.ts:137-144` | ✅ PASS |
| EMDUI-15 | `text/csv`, uma linha por emenda e local do período, 9 colunas | `tests/e2e/emendas.spec.ts:219`, `:222`, `:223-228`, `:230` | ✅ PASS |

### P2: Marcar fornecedor da cota com sanção

| Critério | Resultado definido na spec | `arquivo:linha` + asserção | Resultado |
| --- | --- | --- | --- |
| SAN-01 | CEIS e CNEP mais recentes (até 7 dias), `coleta` `cgu_ceis`/`cgu_cnep` | `tests/integracao/sancoes.test.ts:113`, `:125-138`, `:195-196` | ✅ PASS |
| SAN-02 | Só tipo "J" com CNPJ na cota | `tests/integracao/sancoes.test.ts:144`, `:170` | ✅ PASS |
| SAN-03 | Nova coleta substitui cada cadastro | `tests/integracao/sancoes.test.ts:176` | ✅ PASS |
| SAN-04 | Selo "Sanção no CEIS"/"no CNEP" | `tests/e2e/emendas.spec.ts:171-172` | ✅ PASS |
| SAN-05 | Título, categoria, período, órgão, nº de notas dentro da sanção; link conforme "Link de notas" | `tests/e2e/emendas.spec.ts:184-192`, `:199-204`; `tests/unit/sancao.test.ts:32-35` `"3 das 9 notas …"`, `">Ver as 3 notas</a>"`, `not.toContain("Ver as 9 notas")`, `href` com `de`/`ate`; `:39-40` sem link com N = 0; `tests/e2e/emendas.spec.ts:296-299` limites inclusivos (`de=2026-02-10` → 1, `de=2026-02-11` → 0, `ate=2026-02-10` → 1, `ate=2026-02-09` → 0) | ✅ PASS (U30, G01, G02 morrem) |
| SAN-06 | Frase da ressalva | `tests/e2e/emendas.spec.ts:194-197` | ✅ PASS |
| SAN-07 | "sem data final" | `tests/unit/emendas.test.ts:143-147`; `tests/e2e/emendas.spec.ts:192` | ✅ PASS |

### P2: Metodologia e fontes

| Critério | Resultado definido na spec | `arquivo:linha` + asserção | Resultado |
| --- | --- | --- | --- |
| MET-01 | "1.5" | `tests/e2e/emendas.spec.ts:235` `getByText("Versão 1.5. Toda mudança gera nova versão.")`; `:252` "Metodologia v1.5"; `tests/e2e/perfil.spec.ts:176` `/^Versão 1\.5\./` | ✅ PASS (V01, V02 morrem) |
| MET-02 | Seção "Emendas parlamentares" | `tests/e2e/emendas.spec.ts:236-240` | ✅ PASS |
| MET-03 | Seção "Sanções de fornecedores" | `tests/e2e/emendas.spec.ts:241-244` | ✅ PASS |
| MET-04 | Duas fontes do Portal na lateral | `tests/e2e/emendas.spec.ts:250-251` | ✅ PASS |
| MET-05 | "Como ligamos…" com a regra de homônimos | `tests/e2e/emendas.spec.ts:254` | ✅ PASS |

### Edge cases

| Critério | Resultado definido na spec | `arquivo:linha` + asserção | Resultado |
| --- | --- | --- | --- |
| EDGE-01 | 401/403 → `ColetaBloqueada`, nada gravado | `tests/integracao/emendas.test.ts:231-236` | ✅ PASS (só 403 exercitado) |
| EDGE-02 | Sem arquivo em 7 dias → erro, mantém sanções | `tests/integracao/sancoes.test.ts:206-208` | ✅ PASS |
| EDGE-03 | Vazio → 0 | `tests/unit/emendas.test.ts:28-31` | ✅ PASS |
| EDGE-04 | Empenhado 0: "—", sem barra, "— do empenhado" | `tests/e2e/emendas.spec.ts:261-265` | ✅ PASS |
| EDGE-05 | 320 px sem rolagem; tabela rola na caixa | `tests/e2e/emendas.spec.ts:150` `scrollWidth <= 320` | ✅ PASS |

**Situação**: 43/43 com evidência e valor da spec; nenhum critério da spec com mutante vivo. As lacunas estão nas
regras de privacidade (R3/AD-002) e na validação de data que entraram depois da rodada 3. Seguem as mesmas duas
lacunas de precisão menores: rodapé curto do celular sem "ver original" e EDGE-01 sem o caso 401.

---

## Sensor de discriminação

Worktree temporário (`git worktree add --detach <scratchpad>/mut HEAD`), `pnpm install --frozen-lockfile --offline`,
`.env` e `.env.local` copiados, banco `auditaja_emendas_test`, um mutante por vez, troca de texto exata (uma
ocorrência, conferida pelo script) e `git checkout --` depois de cada um. Mutantes de lógica: `pnpm test`. Mutantes
de rota e de UI: `pnpm build` + `playwright test tests/e2e/emendas.spec.ts tests/e2e/perfil.spec.ts` (desktop e
celular, porta 3282). Em cada mutante morto, conferi no log que quem falhou foi o teste esperado.

### Sobreviventes da rodada 3, refeitos

| # | `arquivo:linha` | Mutação | Resultado |
| --- | --- | --- | --- |
| N09 | `src/ingest/arquivos.ts:106` | `dataDaEntrada` ignora o nome e devolve a primeira entrada | ✅ morto (`integracao/emendas.test.ts:162` EMD-02) |
| U30 | `src/components/perfil/sancao.tsx:94` | `rotuloNotas(f.documentos)` (total M) | ✅ morto (`unit/sancao.test.ts:32-34`) |
| B03 | `src/lib/emendas.ts:100` | `>= 1_000_000` → `> 1_000_000` | ✅ morto (`unit/emendas.test.ts:173`) |
| U22 | `src/components/perfil/secao-emendas.tsx:249` | volta "Valores em milhões de reais." antes da frase | ✅ morto (`e2e/emendas.spec.ts:82`) |
| G01 | `src/app/parlamentares/[id]/gastos.csv/route.ts:53` | `>= de` → `> de` | ✅ morto (`e2e/emendas.spec.ts:296`) |
| G02 | `…/gastos.csv/route.ts:54` | `<= ate` → `< ate` | ✅ morto (`e2e/emendas.spec.ts:297`) |
| G05 | `…/gastos.csv/route.ts:51` | remove o filtro `ano` (anterior à feature) | ❌ sobreviveu (fora do diff, como na rodada 3) |

### Mutantes novos

| # | `arquivo:linha` | Mutação | Resultado |
| --- | --- | --- | --- |
| P01 | `src/lib/emendas.ts:52` | favorecido PJ sem `mascararCpfsNoTexto` | ✅ morto (`unit/emendas.test.ts:93`) |
| P02 | `src/ingest/transparencia.ts:169` | nome do sancionado sem `mascararCpfsNoTexto` | ✅ morto (`integracao/sancoes.test.ts:151`) |
| P03 | `src/lib/privacy.ts:45` | regex sem `(?<!\d)` (casa os 11 últimos dígitos de um CNPJ colado) | ❌ **sobreviveu** |
| P04 | `src/lib/privacy.ts:45` | regex sem `(?!\d)` (casa os 11 primeiros dígitos de um CNPJ colado) | ❌ **sobreviveu** |
| P05 | `src/lib/privacy.ts:45` | regex largo `\d{2,3}…\d{0,2}` (mascara raiz de CNPJ "11.854.334") | ✅ morto (`unit/emendas.test.ts:101-104`) |
| P06 | `src/lib/privacy.ts:45` | separadores só `.` e `-` (CPF com espaços passa inteiro) | ❌ **sobreviveu** |
| P07 | `src/lib/privacy.ts:45` | regex sem a flag `g` (só o primeiro CPF do nome é mascarado) | ❌ **sobreviveu** |
| P08 | `src/lib/privacy.ts:54` | máscara parcial da Receita (`***.ddd.ddd-**`) no lugar da total | ✅ morto (`unit/emendas.test.ts:93`, `integracao/sancoes.test.ts:151`) |
| P09 | `src/lib/privacy.ts:54` | mantém os 3 primeiros dígitos (máscara do Senado) | ✅ morto (idem) |
| P10 | `src/lib/privacy.ts:41` | `nomeFornecedorPublicavel` sem `mascararCpfsNoTexto` (cota) | ❌ **sobreviveu** (sem teste nesta branch) |
| D01 | `…/gastos.csv/route.ts:8` | `dataIsoValida` sem a volta pela data ISO (aceita `2026-02-30`, que dá 500 no Postgres) | ❌ **sobreviveu** |
| D02 | `…/gastos.csv/route.ts:8` | sem a checagem `NaN` (`toISOString` lança) | ✅ morto (`e2e/emendas.spec.ts:300-302`) |
| D03 | `…/gastos.csv/route.ts:6` | sem o regex de formato | ⚪ equivalente (a volta pela data ISO já exige `AAAA-MM-DD`) |
| D04 | `…/gastos.csv/route.ts:6` | `dataIsoValida` sempre `false` | ✅ morto (`e2e/emendas.spec.ts:282-287`, `:296-299`) |
| D05 | `…/gastos.csv/route.ts:54` | `ate` volta ao regex antigo | ✅ morto (`e2e/emendas.spec.ts:300-302`) |
| D06 | `…/gastos.csv/route.ts:53` | `de` volta ao regex antigo (`?de=2026-13-99` → 500) | ❌ **sobreviveu** |
| V01 | `src/lib/metrics.ts:6` | `METODOLOGIA_VERSAO = "1.4"` | ✅ morto (`e2e/emendas.spec.ts:235`, `:252`; `perfil.spec.ts:176`) |
| V02 | `src/lib/metrics.ts:6` | `METODOLOGIA_VERSAO = "1.5.1"` | ✅ morto (`e2e/emendas.spec.ts:235`) |

**Profundidade**: ampliada (25 mutações: 7 refeitas e 18 novas; caminho de dados pessoais).
**Resultado**: 16/24 mortos (D03 equivalente fora da conta), 8 sobreviventes; 7 em código desta rodada (P03, P04,
P06, P07, P10, D01, D06). FAIL ❌

**Conferência do código real** (fora do sensor, com `tsx` sobre `src/lib/privacy.ts` sem mutação):
"FULANO 521 822 909 15" → "FULANO ***.***.***-**"; "A 52182290915 B 12345678901" → os dois mascarados;
"00469171000326HOTEL", "HOTEL 00469171000326", "FULANO 0043951400030" (13 dígitos) e "11.854.334/0001-49 X"
inalterados. O comportamento está certo; falta o teste que o proteja.

**Isolamento**: `git status --porcelain` do worktree real vazio antes; depois, igual, exceto os dois relatórios
desta verificação. Worktree temporário removido com `git worktree remove --force` e `git worktree prune`. Nenhum
`git stash`. Servidores que subi (3292 do worktree real, conferido por `readlink /proc/PID/cwd`; 3272 e 3282 do
Playwright) parados; 3290 e 3243 são de outras frentes e não foram tocados.

---

## Gate

| Comando | Resultado |
| --- | --- |
| `TEST_DATABASE_URL=…/auditaja_emendas_test pnpm test` | 17 arquivos, 166 passaram, 0 falharam, 0 pulados |
| `pnpm typecheck`, `pnpm lint`, `pnpm build` | exit 0 |
| `pnpm test:e2e` (`E2E_PORT=3272`, Chromium 1228) | 132 passaram, 4 pulados, 0 falharam |

- **Testes antes da feature** (vitest): 113; rodada 3: 163; **agora**: 166 (+3: `unit/sancao.test.ts` × 2 e o caso
  de MEI em `unit/emendas.test.ts:92`).
- **e2e**: 130 → 132 (limites de `de`/`ate` × 2 projetos).
- **Pulados**: os mesmos 4 de `tests/e2e/perfil.spec.ts`, anteriores à feature.
- **Integridade**: nenhum teste removido. Asserções que mudaram: "1.4" → "1.5" (MET-01, registrado na spec) e
  `figure` com `toContainText` → `figure > span` com `toHaveText` (mais forte). A fixture do sancionado ganhou um CPF
  no nome e a asserção passou a exigir a máscara (mais forte).

---

## Qualidade de código

| Princípio | Situação |
| --- | --- |
| Código mínimo / sem escopo extra | ✅ |
| Mudanças cirúrgicas | ✅ (`src/lib/privacy.ts` idêntico ao de `feat/senadores`: `git diff feat/senadores HEAD -- src/lib/privacy.ts` vazio) |
| Segue os padrões do projeto | ✅ |
| Resultado asserido bate com a spec | ✅ nos 43 critérios; ⚠️ nas regras de R3 do regex (P03, P04, P06, P07) |
| Cobertura por camada | ⚠️ `dataIsoValida` sem caso de rolagem de data (D01) nem de `de` inválido (D06); `nomeFornecedorPublicavel` sem teste nesta branch (P10) |
| Todo teste mapeia um critério | ✅ (`unit/sancao.test.ts` → Assumption "Link de notas"; `e2e/emendas.spec.ts:290` → Assumptions "Nota dentro do período" e "Link de notas") |
| Guias documentados | `AGENTS.md` (Next.js 16); nenhum desvio achado |

---

## Achados fora dos critérios

1. **Banco dev com CPF em nome de fornecedor da cota.** `despesa_ceap` de `auditaja_emendas_dev` tem 389 linhas com
   11 dígitos em forma de CPF em `fornecedor_nome`. A CEAP foi coletada às 12:30 UTC de 11/11/2026, antes de
   `b77e095`, e a regra nova só vale na próxima coleta. Nenhum desses nomes aparece no `innerText` dos 4 perfis
   conferidos. Recoletar a CEAP antes de publicar a base.
2. **Máscara parcial que já vem no nome não é tocada**: "FULANO ***.822.909-**" fica como está, porque o regex só
   casa dígitos. Nas bases de 11/11/2026 isso não acontece (0 em favorecidos, 0 em sancionados). Se a R3 vale para
   "nem parcial" também no nome, falta a regra.
3. **Risco entre frentes**: a docstring de `mascararCpfsNoTexto` explica que as máscaras parciais da Receita (6 do
   meio) e do Senado (3 primeiros e 2 últimos) juntas remontam o CPF. Esta branch grava o documento de favorecido PF
   e de fornecedor PF da cota com a máscara da Receita (EMD-08, `mascararCpf`). Se outra frente publicar a máscara
   do Senado para a mesma pessoa, o número se remonta. Não é lacuna desta feature, que segue a spec; fica para o
   orquestrador decidir no merge.
4. `favorecidoPublicavel` mantém o nome publicado quando o tipo é "Inscrição Genérica" ou "Sem informação",
   conforme a Assumption da spec. Nas bases reais isso inclui nomes de pessoas estrangeiras ("… - NIF 54442674H",
   "…_CC53132264") e "PESSOA FISICA - TED 13543". Não há CPF, mas há nome de pessoa natural. Decisão de produto.
5. Seguem da rodada 3: N do aviso casa o CNPJ pelos dígitos e o CSV pelo texto exato de `fornecedor_doc`; a nota do
   cruzamento usa só a base da primeira sanção; `getFullYear()` sem fuso de Brasília em `secao-emendas.tsx`.

---

## Planos de correção (todos só de teste)

### Correção 1: CPF no nome em todas as formas aceitas pelo regex (Major, R3/AD-002) — P06, P07
- **Tarefa**: teste unitário de `mascararCpfsNoTexto` (ou de `favorecidoPublicavel`) com "FULANO 521 822 909 15" →
  "FULANO ***.***.***-**" e "A 52182290915 B 12345678901" → "A ***.***.***-** B ***.***.***-**".
- **Pronto quando**: P06 e P07 morrem.

### Correção 2: CNPJ colado no nome não é mascarado (Major, regra do `mascararCpfsNoTexto`) — P03, P04
- **Tarefa**: asserir que "00469171000326HOTEL PHENICIA LTDA" e "HOTEL 00469171000326" saem inalterados.
- **Pronto quando**: P03 e P04 morrem; P05 segue morto.

### Correção 3: data inexistente em `de` e data que rola (Minor, achado 1 da rodada 3) — D01, D06
- **Tarefa**: em `tests/e2e/emendas.spec.ts:290`, pedir `&de=2026-13-99` e `&de=2026-02-30` (ou `&ate=2026-02-30`) e
  asserir status 200 com cabeçalho + 1 linha.
- **Pronto quando**: D01 e D06 morrem.

### Correção 4: nome de fornecedor da cota (Minor, fora dos critérios) — P10
- **Tarefa**: trazer para esta branch o caso de `tests/unit/privacy.test.ts:38-43` de `feat/senadores`, ou confirmar
  que o merge com `feat/senadores` vem antes.
- **Pronto quando**: P10 morre.

---

## Atualização da rastreabilidade

| Requisito | Antes (rodada 3) | Depois (rodada 4) |
| --- | --- | --- |
| EMD-01..11, EMDUI-01..15, SAN-01..07, MET-01..05, EDGE-01..05 | Verified, exceto EMDUI-12 e SAN-05 (Needs Fix) | ✅ Verified (43/43) |
| R3/AD-002 (Goals, nome de favorecido e de sancionado) | — | ⚠️ Needs Fix (P03, P04, P06, P07: só teste) |

---

## Resumo

**Geral**: ❌ Not Ready. Os 43 critérios estão verificados e a paridade é 100%. Faltam 4 correções, todas só de
teste, para as regras de privacidade e de data que entraram depois da rodada 3.

**Checagem ancorada na spec**: 43/43 com evidência e valor da spec; 2 lacunas de precisão menores (rodapé curto do
celular, EDGE-01 401)
**Sensor**: 16/24 mortos (+1 equivalente); dos 8 sobreviventes da rodada 3, os 6 do diff morrem (N09, U30, G01,
G02, U22, B03), G05 segue vivo (fora do diff) e G07 deixou de existir (a linha virou `dataIsoValida`)
**Gate**: 166 vitest + 132 e2e passaram; typecheck, lint e build ok
**Paridade**: 100% (65 PASS, 0 FAIL, 9 INTENCIONAL); ver `paridade/verificacao-4.md`

**Próximos passos**: aplicar as correções 1 a 3 (teste) e decidir sobre a 4 e os achados 1 a 3 antes do merge.
