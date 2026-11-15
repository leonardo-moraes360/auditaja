# Toolbelt (`tb`) no Auditaja

Piloto da integração do [toolbelt](https://github.com/leonardo-moraes360/toolbelt) (CLI + servidor MCP) neste monorepo. O runtime do site **não** muda: só configs, docs e harness de bench.

Toolbelt usado: `go install github.com/leonardo-moraes360/toolbelt/cmd/tb@main` (commit `531c9bc904fec1510e93da65f87930f84233fecb`, versão reportada `0.1.0-dev`).

## Pré-requisito

```bash
go install github.com/leonardo-moraes360/toolbelt/cmd/tb@main
export PATH="$PATH:$(go env GOPATH)/bin"
```

## O que foi integrado

| Caminho | Função |
| -------- | ------ |
| `.toolbelt/config.yaml` | Config local (`tb init`) |
| `.toolbelt/invariants.yaml` | Invariantes (`tb mem`) com R2/R3/R4 e checks do projeto |
| `.toolbelt/thresholds.yaml` | Threshold visual 0.95 |
| `.toolbelt/screens.yaml` | Régua visual (home + /privacidade); refs ainda ausentes |
| `.toolbelt/guard.yaml` | Manifesto de paths protegidos (ver atrito abaixo) |
| `.cursor/mcp.json` | Servidor MCP `tb mcp` para agentes Cursor |
| `bench/tasks/*` | 4 tarefas reais derivadas de `@auditaja/core` |
| `bench/fixtures/*` | Fixtures quebradas + `node --test` |
| `bench/ab/*.yaml` | Variantes A/B baseline vs with-tb |
| `bench/agents/deterministic.mjs` | Agente usado no piloto (sem LLM na VM) |

## Como rodar

```bash
# Invariantes
tb mem list
tb mem check --json

# Verify com a régua de testes do monorepo (não use o default go test)
tb verify run --test-cmd "pnpm --filter @auditaja/core test" --max-iter 1

# Régua visual (skip gracioso sem PNGs de referência)
tb verify run --ruler visual --manifest .toolbelt/screens.yaml --skip-unavailable

# Guard no diff
tb guard check HEAD~1..HEAD --json

# Bench A/B (ajuste AUDITAJA_ROOT em bench/ab/*.yaml se o clone nao estiver em /agent/repos/auditaja)
tb bench list
tb bench compare \
  --config-a bench/ab/baseline.yaml \
  --config-b bench/ab/with-tb.yaml \
  -r 1 \
  --output-dir bench/results \
  -o bench/results/compare.md
```

MCP (Cursor): `.cursor/mcp.json` aponta para `tb mcp`. Ferramentas expostas: `tb_run`, `tb_version`, `tb_echo`, `tb_env`, e as de grafo (`tb_graph_*`, exigem `TB_GRAPH=on`).

## Tarefas de bench

Derivadas do código real de `packages/core`:

1. `privacy-r3-mask` — mascara R3 de CPF (`privacy.ts`)
2. `format-numero-br` — `numeroBr` + `pct` (`format.ts`)
3. `frase-case-camara` — `fraseCase` com virgula colada da Camara
4. `documento-cnpj` — `formatarCnpj` / `documentoPublicavel`

## Resultado do compare (piloto)

Agente: **`bench/agents/deterministic.mjs`** (Node determinístico). Não há `cursor-agent`/LLM CLI nesta VM; tokens/tool_calls são contabilizados pelo agente de piloto (não por API de modelo). Isso limita a validade externa dos números de token/custo, mas exercita o harness `tb bench compare` de ponta a ponta com pass/fail real via `node --test`.

Snapshot commitado: `docs/toolbelt-bench-compare.md` (+ JSONL).

| Métrica | baseline (sem mem) | with-tb (com `tb mem`) | Δ |
| -------- | ------------------ | ---------------------- | --- |
| sucesso (pass@1) | 75.0% | 100.0% | +25.0 pp |
| tempo médio | 0.1s | 0.1s | ~0 |
| tokens médio | 1742 | 1350 | −22.5% |
| tool calls médio | 8.5 | 4.5 | −4.0 |

A diferença de sucesso vem da tarefa `privacy-r3-mask`: sem invariantes R3 o agente aplica mascara parcial (`***.456.789-**`); com `tb mem list` aplica mascara total.

## Problemas do toolbelt (priorizados)

Achados neste repo real; **não** corrigidos aqui.

### P0 — bloqueiam uso sério fora de Go

1. **`tb verify` suite oculta hardcoded em Go**  
   `HiddenTest` é sempre `go test ./tests/hidden/...`. Basta existir `tests/hidden/` para marcar `hidden_available=true` e falhar em monorepo TS/JS (mesmo com `--test-cmd` certo nos testes visíveis). Não há flag para o comando oculto. Repro: criar `tests/hidden/` vazio e rodar `tb verify run --test-cmd "pnpm test"`.

2. **`tb bench run --fake` só funciona dentro do source do toolbelt**  
   O comando fake é `go run ./cmd/fake-agent ...`, relativo ao CWD. Em auditaja: `go.mod file not found`. Repro: `tb bench run --fake --task privacy-r3-mask` na raiz do auditaja.

3. **`tb graph` só indexa `.go`**  
   Em `packages/core/src` (TypeScript): `0 nós, 0 arestas`. Inútil para este monorepo até haver parser TS/JS.

### P1 — atrito alto no dia a dia

4. **`{prompt}` interpolado sem escape em `sh -c`**  
   Prompts multilinha ou com aspas/`$` quebram ou expandem variáveis de shell. Work-around no piloto: prompts de uma linha sem aspas.

5. **`tb bench compare --config-a/b` não tem `--agent`**  
   Sem `--fake`, o agente precisa vir no YAML (`agent.command`). Fácil de errar; com comando vazio a variante falha silenciosamente ou não roda.

6. **`.toolbelt/guard.yaml` não é lido**  
   Docs descrevem o manifesto; `guard.NewChecker` usa paths hardcoded (`tests/hidden/*`, `benchmarks/*`, `.toolbelt/thresholds.yaml`). O `guard.yaml` deste piloto é documentação-morta até o tb carregar o arquivo.

7. **Docs CLI desatualizados vs flags reais**  
   Ex.: `tb graph index --path` na doc; CLI aceita `tb graph index [path]`. README ainda mistura status Fase 0/1/2.

### P2 — qualidade / polish

8. **`go install` perde commit/build_time** — `tb version` mostra `unknown` (ok para módulos sem ldflags).

9. **Config/invariants com mode `0600`** — ok localmente; pode atritar checkout compartilhado/CI se um step rodar com outro uid.

10. **Régua visual: `skipped=false` no JSON** mesmo com todas as telas em skip por referência ausente; veredicto `PASS` (comportamento documentado como skip gracioso, mas o campo top-level confunde).

11. **`bench.default_agent` no `config.yaml` não é consumido** pelo `tb bench run` (só CLI/`--agent` ou YAML A/B).

12. **Comparar A/B “sem tb vs com tb”** não tem modo pronto: feature flags são genéricas; o piloto modelou via `TB_USE_MEM` + agente próprio.

## Limitações do piloto

- Sem LLM real na VM: números de token/custo são do agente determinístico.
- Sem PNGs em `references/`: régua visual só valida skip.
- `AUDITAJA_ROOT` fixo nos YAML A/B para este ambiente cloud.
