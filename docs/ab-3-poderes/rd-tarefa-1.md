# Tarefa 1 — Incluir Poder Executivo e Poder Judiciário

## Objetivo
Estender o Auditaja além do Legislativo, incluindo titulares do Poder Executivo e do Poder Judiciário na esfera federal, com o mesmo modelo de pessoa+coleta, padrões de código e regras de privacidade R2/R3/R4.

## Escopo (decisão)
- Esfera: **federal**
- Executivo: Presidente, Vice-Presidente, Ministros de Estado
- Judiciário: Ministros do STF e do STJ
- Fora: estadual/municipal; Tribunais Regionais; cargos comissionados genéricos

## Escopo de arquivos
- packages/db (migração + types)
- packages/core (poderes, labels, offsets de id)
- packages/ingest (coletores stub/reais + CLI)
- apps/web (rotas/listagens mínimas se necessárias para não quebrar)
- docs/ab-3-poderes/DECISOES.md
- testes unitários relacionados

## Fora de escopo desta tarefa
- KPIs novos detalhados (tarefa 2)
- Landing page dos três poderes (tarefa 3)
- Alterar toolbelt / tests/hidden / thresholds

## Critérios de aceite
- Schema aceita casa/poder executivo e judiciário
- Ingest registra coleta (R1) e aplica privacy
- Documentação de escopo e fontes em DECISOES.md
- Testes/lint/typecheck do que for tocado passam
- tb review + tb drift OK contra este ticket
