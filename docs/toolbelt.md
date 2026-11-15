# Toolbelt (`tb`) no Auditaja

Piloto da integração do [toolbelt](https://github.com/leonardo-moraes360/toolbelt) (CLI + servidor MCP) neste monorepo. O runtime do site **não** muda: só configs, docs, suite oculta de piloto e harness de bench.

Toolbelt usado nesta rodada: `go install github.com/leonardo-moraes360/toolbelt/cmd/tb@main`  
SHA: `c8aae0428695001ff765d8725fff2c592bdad303` (versão reportada `0.1.0-dev`, commit/build_time `unknown` via `go install`).

Rodada anterior (antes das correções): `531c9bc904fec1510e93da65f87930f84233fecb`.

## Pré-requisito

```bash
go install github.com/leonardo-moraes360/toolbelt/cmd/tb@main
export PATH="$PATH:$(go env GOPATH)/bin"
```

## O que foi integrado

| Caminho | Função |
| -------- | ------ |
| `.toolbelt/config.yaml` | Config local: `verify.*`, `graph.languages/docs/frameworks`, bench |
| `.toolbelt/invariants.yaml` | Invariantes (`tb mem`) com R2/R3/R4 e checks do projeto |
| `.toolbelt/thresholds.yaml` | Threshold visual 0.95 |
| `.toolbelt/screens.yaml` | Régua visual (home + /privacidade); refs ainda ausentes |
| `.toolbelt/guard.yaml` | Manifesto de paths (ainda não lido pelo `tb`, ver abaixo) |
| `.cursor/mcp.json` | Servidor MCP `tb mcp` |
| `tests/hidden/check.mjs` + `pnpm test:hidden` | Suite oculta configurável |
| `bench/tasks/*` | 4 tarefas reais derivadas de `@auditaja/core` |
| `bench/fixtures/*` | Fixtures quebradas + `node --test` |
| `bench/ab/*.yaml` | Variantes A/B baseline vs with-tb |
| `bench/agents/deterministic.mjs` | Agente do piloto (sem LLM na VM) |

## Como rodar

```bash
tb mem list
tb mem check --json

# Verify: comandos vêm do .toolbelt/config.yaml
# Use --base/--head sem tocar paths protegidos hardcoded (ex.: thresholds.yaml)
tb verify run --base HEAD --head HEAD --max-iter 1

# Ou explícito:
tb verify run --base HEAD --head HEAD \
  --test-cmd "pnpm --filter @auditaja/core test" \
  --hidden-test-cmd "pnpm test:hidden" \
  --max-iter 1

tb verify run --ruler visual --manifest .toolbelt/screens.yaml --skip-unavailable

# Graph multilinguagem no core (TS/JS)
TB_GRAPH=on tb graph index packages/core
TB_GRAPH=on tb graph stats --json
TB_GRAPH=on tb graph search mascararCpfs --json

# Fake portátil (subcomando embutido __fake-agent)
tb bench run --fake --task privacy-r3-mask -r 1

# Bench A/B (ajuste AUDITAJA_ROOT em bench/ab/*.yaml fora deste ambiente)
tb bench compare \
  --config-a bench/ab/baseline.yaml \
  --config-b bench/ab/with-tb.yaml \
  -r 1 \
  --output-dir bench/results \
  -o bench/results/compare.md
```

MCP: `.cursor/mcp.json` → `tb mcp`. Com `TB_GRAPH=on`, ferramentas `tb_graph_*` passam a indexar TS/JS.

## Graph (`packages/core`)

Após `TB_GRAPH=on tb graph index packages/core`:

| Métrica | Valor |
| -------- | ----- |
| nós | **120** |
| arestas | **448** |
| arquivos | 11 |
| funções | 102 |
| packages | 7 |
| calls / defines / imports | 325 / 117 / 6 |

Snapshot: `docs/toolbelt-graph-stats.json`. Ex.: `tb graph search mascararCpfs` acha `src/privacy.ts`.

## Bench compare (esta rodada)

Agente: **`bench/agents/deterministic.mjs`**. Não há `cursor-agent`/LLM CLI nesta VM (só `cursor-agent-store-fuse`, sem CLI de modelo). Tokens/custo continuam do agente de piloto; pass/fail é real via `node --test`.

| Métrica | baseline | with-tb | Δ (esta rodada) | Rodada anterior |
| -------- | -------- | ------- | --------------- | --------------- |
| pass@1 | 75.0% | 100.0% | +25.0 pp | 75% → 100% (igual) |
| tokens médios | 1742 | 1350 | −22.5% | 1742 → 1350 (igual) |
| tool calls médios | 8.5 | 4.5 | −4.0 | 8,5 → 4,5 (igual) |
| tempo médio | 0.1s | 0.1s | ~0 | igual |

`--fake` portátil agora sobe e devolve tokens (1000), mas sem `FilesToModify` no fake-config a tarefa real não passa (0%) — esperado para o fake default.

## Status dos problemas anteriores

### P0

| # | Problema | Status |
| --- | --- | --- |
| 1 | Suite oculta hardcoded em `go test` | **Resolvido** — `--hidden-test-cmd` / `verify.hidden_test_cmd` (`pnpm test:hidden` PASS) |
| 2 | `--fake` só no source do toolbelt | **Resolvido** — `tb __fake-agent` embutido; roda no auditaja |
| 3 | `tb graph` só `.go` | **Resolvido** — TS/JS no core: 120 nós / 448 arestas |

### P1

| # | Problema | Status |
| --- | --- | --- |
| 4 | `{prompt}` sem escape | **Resolvido** — quoting + `TB_BENCH_PROMPT`/`WORKDIR`/`TIMEOUT`; smoke multilinha/aspas/`$()` ok |
| 5 | `bench compare` sem `--agent` | **Aberto** — agente só via YAML A/B ou `--fake` |
| 6 | `.toolbelt/guard.yaml` não lido | **Aberto** — paths ainda hardcoded em `NewChecker` |
| 7 | Docs CLI desatualizados | **Aberto** — `docs/cli.md` ainda cita `tb graph index --path` |

### P2

| # | Problema | Status |
| --- | --- | --- |
| 8 | `go install` → commit/build `unknown` | **Aberto** |
| 9 | config/invariants mode `0600` | **Aberto** |
| 10 | Visual JSON `skipped=false` com telas em skip | **Aberto** |
| 11 | `bench.default_agent` no config ignorado | **Aberto** |
| 12 | A/B “sem tb vs com tb” sem modo pronto | **Aberto** (piloto via `TB_USE_MEM`) |

## Problemas novos (desta rodada)

1. **Guard aborta o `verify` antes dos testes** se o diff `base..head` tocar path protegido hardcoded (ex.: `.toolbelt/thresholds.yaml`). Com default `HEAD~1..HEAD`, um commit que só adiciona/ajusta thresholds devolve `FAIL` com `iterations: 0` e nem roda `test_cmd`/`hidden_test_cmd`. Work-around: `--base HEAD --head HEAD` ou base já contendo o arquivo.

2. **Fake default não resolve fixtures reais** — portátil sim, mas pass@1=0 sem `--fake-config` com `files_to_modify`; fácil confundir “fake quebrou” com “harness quebrou”.

## Limitações do piloto

- Sem LLM real na VM.
- Sem PNGs em `references/`: régua visual só valida skip.
- `AUDITAJA_ROOT` fixo nos YAML A/B para este ambiente cloud.
