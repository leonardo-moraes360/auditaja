# Decisões — três poderes (braço baseline)

## Escopo (tarefa 1)

**Esfera:** federal apenas, no mesmo recorte do Legislativo atual (Câmara e Senado).

| Poder       | Cargos no MVP                                     | Fora do MVP                                   |
| ----------- | ------------------------------------------------- | --------------------------------------------- |
| Legislativo | Deputados federais e senadores (já existentes)    | Assembleias e Câmaras municipais              |
| Executivo   | Presidente, Vice-Presidente e Ministros de Estado | Governadores, prefeitos, secretários          |
| Judiciário  | Ministros do STF                                  | STJ/TST/TSE/STM, tribunais regionais, 1º grau |

## Fontes (alinhadas ao que o projeto já usa)

- **Executivo — composição:** página pública de composição do governo (gov.br / Presidência), registrada em `coleta` (R1).
- **Executivo — gastos:** lotes do Portal da Transparência (CGU), mesmo host `dadosabertos-download.cgu.gov.br` das emendas e sanções (viagens a serviço e cartão de pagamento).
- **Executivo — bens:** TSE (`bem_candidato`), só para cargos eletivos (Presidente/Vice), sem descrição livre (R2).
- **Judiciário — composição e sessões:** portal público do STF (composição da Corte e transparência de sessões/votos quando publicados).
- **Judiciário — despesas:** transparência do STF (diárias, auxílios, passagens publicadas).

Coleta via `ClienteEducado` (R7). CPF de terceiro não é gravado; nome de PF vira "Prestador pessoa física" (R3).

## Modelo de dados

Tabelas paralelas a `parlamentar` / `despesa_ceap` / `voto`, sem alterar o esquema do Legislativo:

- `executivo`, `despesa_executivo`, `bem_executivo`
- `judiciario`, `despesa_judiciario`, `sessao_judiciario`, `voto_judiciario`

Ids sintéticos: Executivo a partir de 20_000_000; Judiciário a partir de 30_000_000 (evita colisão com Câmara e Senado).

## KPIs (tarefa 2)

Implementados em `packages/core/src/kpis-poderes.ts` (metodologia 1.12), com testes em `packages/core/tests/unit/kpis-poderes.test.ts`.

| Poder       | KPI                                                                              | Análogo legislativo      |
| ----------- | -------------------------------------------------------------------------------- | ------------------------ |
| Legislativo | uso de cota, presença, alinhamento, bens                                         | já em `metrics` / perfil |
| Executivo   | `taxaUsoVerba`, `mediaMensalGastos`, `concentracaoFornecedor`, `variacaoNominal` | cota + bens              |
| Judiciário  | `presencaSessoes`, `concordanciaMaioria`, `mediaMensalGastos`                    | presença + alinhamento   |

A concordância com a maioria do colegiado usa o voto majoritário de **toda** a sessão (não só o do titular do perfil).

## Landing (tarefa 3)

Rota `/poderes`: apanhado dos três poderes com o design system existente (tipografia `font-heading`, superfícies, bordas).
