# A/B real — braço BASELINE

Agente normal (sem toolbelt/`tb`). Branch base: `piloto/toolbelt`.
Data: 2026-11-15.

## Por tarefa

| tarefa | verification.command | suite oculta | tool calls (aprox.) | tempo de parede | arquivos tocados |
| --- | --- | --- | ---: | ---: | --- |
| format-numero-br | pass | pass | 12 | 18.4 s | `bench/fixtures/format-numero-br/format.js` |
| documento-cnpj | pass | pass | 6 | 8.2 s | `bench/fixtures/documento-cnpj/documento.js` |
| frase-case-camara | pass | pass | 5 | 3.9 s | `bench/fixtures/frase-case-camara/frase.js` |
| privacy-r3-mask | pass | pass | 5 | 8.2 s | `bench/fixtures/privacy-r3-mask/privacy.js` |

## Totais

| métrica | valor |
| --- | --- |
| pass@1 visível | 4/4 (100%) |
| pass@1 oculto | 4/4 (100%) |
| tool calls médias | 7.0 |
| tempo médio de parede | 9.7 s |
| tempo total de parede | 38.7 s |

## Notas

- Cada tarefa partiu de working tree limpa; a correção foi revertida (`git checkout --`) antes da próxima.
- `verification.command` e `pnpm test:hidden` (`verify.hidden_test_cmd`) só foram lidos/rodados depois da solução de cada tarefa.
- Correções alinhadas à lógica já correta em `packages/core` (`format.ts` / `privacy.ts`) e aos testes visíveis de cada fixture.
