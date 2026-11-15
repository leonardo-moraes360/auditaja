# Métricas — braço baseline (`ab/3-poderes-baseline`)

Medidas por tarefa. Tool calls são aproximadas (chamadas de ferramentas do agente). Tempo de parede via `date -u`. Arquivos/linhas = `git show --stat` do commit da tarefa.

Ambiente: sem Docker neste host — migração/seed e testes de integração que exigem Postgres não rodaram; unitários, lint, typecheck e build passaram.

## Tarefa 1 — Executivo e Judiciário

| Métrica | Valor |
| ------- | ----- |
| Início | 2026-11-15T20:05:04Z |
| Fim | 2026-11-15T20:10:34Z |
| Tempo de parede | ~5 min 30 s |
| Tool calls (aprox.) | ~55 |
| Arquivos no commit | 23 |
| Linhas (+/−) | +1542 / −4 |
| Testes | OK (unitários core/ingest/web; integração Postgres não disponível) |
| Lint | OK |
| Build | OK |
| Commit | `54e016d70bbfdc88a1e37d656411f40465cdc844` |

## Tarefa 2 — KPIs

| Métrica | Valor |
| ------- | ----- |
| Início | 2026-11-15T20:11:08Z |
| Fim | 2026-11-15T20:13:01Z |
| Tempo de parede | ~1 min 53 s |
| Tool calls (aprox.) | ~22 |
| Arquivos no commit | 9 |
| Linhas (+/−) | +418 / −10 |
| Testes | OK (178 testes em `@auditaja/core`, incl. KPIs) |
| Lint | OK |
| Build | OK (typecheck + lint; build revalidado na tarefa 3) |
| Commit | `6ec38e7da2aaee169dda1fd0f9f2aed21a943ac1` |

## Tarefa 3 — Landing `/poderes`

| Métrica | Valor |
| ------- | ----- |
| Início | 2026-11-15T20:13:04Z |
| Fim | 2026-11-15T20:14:09Z |
| Tempo de parede | ~1 min 5 s |
| Tool calls (aprox.) | ~18 |
| Arquivos no commit | 7 |
| Linhas (+/−) | +169 / −2 |
| Testes | OK (paginas + unitários web/core/ingest/db) |
| Lint | OK |
| Build | OK (`/poderes` no output) |
| Commit | `e0bf1c75229ac0716d72a6febce9fa4635d5aecd` |

## Totais (três tarefas)

| Métrica | Valor |
| ------- | ----- |
| Início geral | 2026-11-15T20:03:21Z |
| Fim (antes do push das métricas) | 2026-11-15T20:14:09Z |
| Tempo de parede total | ~10 min 48 s |
| Tool calls (aprox.) | ~95 |
| Arquivos distintos tocados | ~30 |
| Linhas líquidas nos 3 commits | +2129 / −16 |
