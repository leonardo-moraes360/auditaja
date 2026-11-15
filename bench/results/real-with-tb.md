# A/B real — braço COM toolbelt (`tb`)

- Branch de entrega: `bench/real-with-tb`
- Base: `piloto/toolbelt` @ `df37530`
- Toolbelt: `go install github.com/leonardo-moraes360/toolbelt/cmd/tb@main` → `0.1.0-dev` (commit/build `unknown`)
- Agente: Cursor Cloud (Composer), edição manual das fixtures quebradas
- Protocolo: estado limpo entre tarefas (`git reset --hard origin/piloto/toolbelt`); fixtures restauradas ao final; este arquivo é a entrega

## Tabela por tarefa

| Tarefa | Visível (`verification.command`) | Suite oculta (`pnpm test:hidden` / `tb verify`) | Tool calls (aprox.) | Tempo de parede | Arquivos tocados | Comandos `tb` usados | `tb` ajudou? | Vezes que `tb` pegou antes do erro |
| ------ | -------------------------------- | ----------------------------------------------- | ------------------- | --------------- | ---------------- | -------------------- | ------------ | ---------------------------------- |
| privacy-r3-mask | PASS | PASS | ~12 | 35s | `bench/fixtures/privacy-r3-mask/privacy.js` | `mem list`, `graph index`, `graph search`, `drift`, `review`, `verify run` | Sim (R3 via `mem`; símbolo via `graph`) | 0 |
| format-numero-br | PASS | PASS | ~9 | 11s | `bench/fixtures/format-numero-br/format.js` | `mem list`, `graph search`, `drift`, `review`, `verify run` | Parcial (`graph` achou `numeroBr`; `pct` apontou `trilha.ts`) | 0 |
| frase-case-camara | PASS | PASS | ~7 | 9s | `bench/fixtures/frase-case-camara/frase.js` | `mem list`, `graph search`, `drift`, `review`, `verify run` | Parcial (localizou `fraseCase` em `format.ts`; `mem` sem invariante útil) | 0 |
| documento-cnpj | PASS | PASS | ~10 | 14s | `bench/fixtures/documento-cnpj/documento.js` | `mem list`, `graph search`, `mcp` (tools/list), `drift`, `review`, `verify run`, `mem check` | Sim (R3 + símbolos em `privacy.ts`; MCP ok) | 0 |

## Totais

| Métrica | Valor |
| ------- | ----- |
| pass@1 visível | **4/4 (100%)** |
| pass@1 oculto | **4/4 (100%)** |
| tool calls médias | **~9,5** |
| tempo médio de parede | **~17s** |
| vezes que `tb` pegou erro antes | **0** (todas na 1ª tentativa) |

## O que o `tb` ajudou

- `tb mem list`: reforçou R3 (máscara total sem dígitos / prestador PF) nas tarefas `privacy-r3-mask` e `documento-cnpj`.
- `TB_GRAPH=on tb graph index/search`: localizou símbolos reais em `packages/core` (`mascararCpfsNoTexto`, `numeroBr`, `fraseCase`, `formatarCnpj`, `documentoPublicavel`) sem vasculhar o monorepo.
- `tb verify run --test-cmd … --hidden-test-cmd pnpm test:hidden`: unificou verificação visível + oculta; veredicto PASS nas 4.
- `tb mcp`: servidor sobe; `tools/list` expõe `tb_graph_*`, `tb_run`, etc. (smoke JSON-RPC ok).

## O que atrapalhou / atritos

1. **Grafo ≠ fixture**: o graph indexa `packages/core` (TS), mas as tarefas editam `bench/fixtures/*/…js`. O grafo orienta o domínio, não o arquivo quebrado.
2. **Hit enganoso**: `tb graph search pct` devolveu `src/trilha.ts`, enquanto o bug da tarefa está em `format.js` / `format.ts`.
3. **`tb drift` / `tb review`**: exigem ticket (`--ticket`); sem commit o diff `HEAD..HEAD` fica vazio — precisei commit temporário por tarefa. Goldfish sempre “Nenhum finding” nestes diffs mínimos (pouco sinal).
4. **Suite oculta**: em estados com fixture `privacy` ainda quebrada (entre tarefas), `pnpm test:hidden` ainda imprimiu `suite oculta: invariantes R3 ok` — parece amarrada ao core/invariantes, não ao pass da fixture sob teste.
5. **`go install @main`**: versão `0.1.0-dev` com commit/build `unknown` (rastreio frágil).
6. **`tb graph neighbors`**: subcomando inexistente na CLI instalada (só `callers`/`deps`/`impact`/…).
7. **Guard/`verify` default** (doc do piloto): diff que toca paths hardcoded pode abortar antes dos testes; work-around `--base HEAD --head HEAD` usado de propósito.
8. **MCP graph**: ferramentas de grafo exigem `TB_GRAPH=on` no ambiente do servidor; só o CLI com env explícito foi usado de fato na navegação.

## Notas de método

- Não foram lidos `bench/agents/deterministic.mjs`, soluções esperadas aparte, nem o fonte de `tests/hidden/` antes de concluir as 4 tarefas.
- Cada tarefa: prompt de `bench/tasks/*/task.yaml` + fixture quebrada + teste visível + `tb mem`/`graph`/`verify`/`review`/`drift`.
- Commits temporários de fix foram descartados (`git reset --hard origin/piloto/toolbelt`); só este relatório permanece no branch.
