# Métricas — braço COM toolbelt (`ab/3-poderes-com-tb`)

Medição por tarefa. Tempos de parede via `date`. Tool calls são aproximadas (chamadas de ferramentas do agente nesta sessão).

## Preparo

| Item | Valor |
| ---- | ----- |
| Início absoluto | 2026-11-15T20:03:11+0000 |
| `tb` instalado | `go install …@main` → `0.1.0-dev` |
| Branch | `ab/3-poderes-com-tb` (a partir de `piloto/toolbelt`) |
| MCP | `tb mcp` listou ferramentas (`tb_graph_*`, `tb_version`, `tb_run`, …) |

## Tarefa 1 — Executivo + Judiciário no modelo

| Métrica | Valor |
| ------- | ----- |
| Início | 2026-11-15T20:05:45+0000 |
| Fim (commit) | 2026-11-15T20:10:46+0000 |
| Tempo de parede | ~5 min |
| Commit | `dfb7327` |
| Arquivos no commit | 19 |
| Linhas | +1054 / −13 |
| Tool calls (aprox.) | ~35 |
| Testes / lint / typecheck | unitários core+ingest OK; typecheck OK |
| Build | não exigido isolado nesta tarefa |

### O que o `tb` pegou

1. **`tb review` — critical falso positivo** sobre `tests/hidden/` (diff não tocava esses arquivos). Bloqueou a revisão com exit ≠ 0.
2. **`tb review` — warning `scope-missing`**: ticket sem linha `Scope:` / `Escopo:` no formato `(?mi)^(?:scope|escopo)\s*:`.
3. **`tb verify`**: PASS (testes core + hidden).
4. **`tb drift`**: sem out_of_scope nesta tarefa.
5. **`tb mem`**: invariantes R2/R3/R4 e escopo 3 poderes adicionadas; `mem check` OK.

### Atritos

- `tb mem add --rule` inválido; a regra é argumento posicional.
- Goldfish marca violação de invariante anti-cheat sem o path aparecer no diff.
- `tb graph impact` exige `--file` (docs/help confusos).
- Guard de `verify` com base padrão pode abortar se o diff tocar paths hardcoded; work-around `--base HEAD --head HEAD`.

## Tarefa 2 — KPIs por poder

| Métrica | Valor |
| ------- | ----- |
| Início | 2026-11-15T20:11:14+0000 |
| Fim (commit) | 2026-11-15T20:12:00+0000 |
| Tempo de parede | ~1 min |
| Commit | `b31130e` |
| Arquivos no commit | 5 |
| Linhas | +273 / −1 |
| Tool calls (aprox.) | ~12 |
| Testes | 178 no core (7 novos) PASS |
| `tb verify` | PASS |

### O que o `tb` pegou

1. **`tb drift`**: `docs/ab-3-poderes/rd-tarefa-1.md` e `rd-tarefa-2.md` fora do Scope declarado (tickets incluídos no commit sem estarem no Scope). Catch real de processo.
2. Mesmo falso positivo de `tests/hidden/` no review.

### Atritos

- Scope do ticket precisa listar explicitamente os próprios arquivos de ticket se forem commitados juntos.
- Matching de Scope parece por prefixo/caminho literal, não por intenção.

## Tarefa 3 — Landing `/poderes`

| Métrica | Valor |
| ------- | ----- |
| Início | 2026-11-15T20:12:10+0000 |
| Fim (commit) | 2026-11-15T20:13:54+0000 |
| Tempo de parede | ~2 min |
| Commit | `fc2b427` |
| Arquivos no commit | 8 |
| Linhas | +317 / −20 |
| Tool calls (aprox.) | ~18 |
| Lint / format / typecheck | PASS (após prettier) |
| Testes unitários | PASS (integração skipped: sem Docker/Postgres) |
| Build | PASS após correção de `new Date()` no prerender |

### O que o `tb` pegou

1. **`tb drift` / `tb review`**: `apps/web/src/app/page.tsx` (link na home) fora do Scope. Catch real; ticket atualizado depois.
2. **`tb verify`**: PASS, mas **não** teria pegado o erro de prerender (`new Date()`), porque `verify.test_cmd` só roda testes do core — o build do Next foi o que falhou primeiro.

### Atritos

- `verify` configurado só para `@auditaja/core` + hidden: gaps em build/lint/web.
- Sem Docker na VM: migração/seed/e2e não rodaram; métrica de “testes verdes” cobre unitários + typecheck + lint + build.

## Totais

| | |
| --- | --- |
| Tempo total (tarefas 1–3) | ~8–10 min de parede de implementação; sessão desde 20:03 |
| Commits de feature | 3 (+ commits de docs/métricas) |
| Tool calls (aprox. sessão) | ~90–110 |
| Catches úteis do `tb` | 3 (scope tickets; home fora do scope; scope-missing no ticket 1) |
| Falsos positivos | invariante `tests/hidden/` em toda review |
| Head SHA | ver commit final deste arquivo / `git rev-parse HEAD` |
