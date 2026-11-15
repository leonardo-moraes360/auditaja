# Decisões — A/B três poderes (com toolbelt)

## Escopo escolhido

| Poder | Esfera | Cargos cobertos | Fora de escopo (nesta rodada) |
| ----- | ------ | --------------- | ----------------------------- |
| Legislativo | Federal | Deputados federais, Senadores | Assembleias, Câmaras municipais |
| Executivo | Federal | Presidente, Vice-presidente, Ministros de Estado | Governadores, prefeitos, cargos comissionados |
| Judiciário | Federal | Ministros do STF e do STJ | TRF, TJ, TRT, tribunais superiores demais (TST, TSE, STM) |

Justificativa: o MVP legislativo já é federal e centrado em pessoa+coleta; Executivo/Judiciário seguem o mesmo recorte para comparar indicadores entre poderes sem misturar esferas.

## Modelo de dados

- Continua a tabela `parlamentar` como hub de pessoa pública (como na extensão do Senado).
- `casa` passa a aceitar `executivo`, `stf`, `stj` além de `camara` e `senado`.
- Colunas `cargo` e `orgao` descrevem o papel (ex.: `ministro` + `Fazenda`).
- Ids: Executivo `20_000_000 + código`, STF `30_000_000 +`, STJ `31_000_000 +` (Senado permanece `10_000_000 +`).
- Nova tabela `despesa_titular` para gastos do Executivo/Judiciário (R3 no fornecedor PF), separada da CEAP/CEAPS.
- Listagens `/parlamentares` e SEO do Legislativo **excluem** as novas casas (não quebrar o produto atual).

## Fontes públicas oficiais

| Poder | Fonte | Uso |
| ----- | ----- | --- |
| Legislativo | Câmara, Senado, TSE, CGU | Já existentes |
| Executivo | gov.br composição ministerial; Portal da Transparência (CGU) para despesas | `pnpm ingest executivo` |
| Judiciário | Portais de composição do STF e do STJ; CGU para despesas | `pnpm ingest judiciario` |

Toda coleta registra `coleta` (R1: URL, SHA-256, licença). Coletores usam `ClienteEducado` (R7).

## Privacidade (R2, R3, R4)

- R2: sem CPF do titular; sem descrição livre de bens; sem nomes de passageiros.
- R3: CPF de fornecedor PF → doc nulo + nome genérico; CPFs em razão social mascarados.
- R4: indicadores são pontos de partida para verificação; textos neutros.

## KPIs (tarefa 2)

Ver seção seguinte e `packages/core/src/metrics-poderes.ts`.

## Landing (tarefa 3)

Rota `/poderes` com apanhado dos três poderes; design system existente.
