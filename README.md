# Auditaja

**Audite seu país, exerça sua cidadania!**

O Auditaja é uma plataforma aberta que reúne e organiza informações públicas sobre parlamentares brasileiros. Nosso objetivo é facilitar o acompanhamento cidadão dos gastos, votos e patrimônios dos representantes eleitos — tudo com fonte, data e link para o documento original.

## O que você encontra aqui

O site mostra, para cada **deputado federal**:

- **Gastos da cota parlamentar (CEAP):** viagens, alimentação, combustível, consultorias e outros reembolsos pagos pela Câmara.
- **Votações nominais no Plenário:** como o parlamentar votou em cada projeto, e se seguiu ou não a orientação do partido.
- **Bens declarados ao TSE:** patrimônio informado nas candidaturas (2018, 2022 e 2026).
- **Emendas parlamentares:** para onde foram os recursos indicados pelo deputado, incluindo a "trilha do dinheiro" das emendas Pix.

Cada número vem com a fonte oficial e a data em que foi coletado. Os indicadores (como "alinhamento com o partido" ou "padrão atípico") são pontos de partida para investigação — não são acusações. Se algo parecer errado, há um formulário para contestar o dado.

## De onde vêm os dados

Todas as informações são coletadas de portais públicos oficiais:

| Fonte                                                            | O que fornece                                          |
| ---------------------------------------------------------------- | ------------------------------------------------------ |
| [Câmara dos Deputados](https://dadosabertos.camara.leg.br/)      | Perfis, gastos CEAP, votações, orientações partidárias |
| [TSE](https://dadosabertos.tse.jus.br/)                          | Bens declarados nas candidaturas                       |
| [Portal da Transparência](https://portaldatransparencia.gov.br/) | Emendas parlamentares                                  |
| [Transferegov](https://transferegov.gestao.gov.br/)              | Pagamentos das emendas Pix                             |

A licença de cada fonte está registrada em `/fontes` no site.

### Limitações conhecidas

- **Senado:** fora do MVP atual (apenas deputados federais).
- **Presença:** inclui períodos de licença, pois os arquivos da Câmara não informam o período de exercício.
- **Teto da CEAP:** o Ato da Mesa nº 244/2026 atualizou os valores, mas não estão na página do ato — então a comparação com o teto está desativada.
- **Orientação de blocos:** a Câmara publica nomes truncados; partidos que não aparecem na abreviação ficam sem orientação.

## Status do projeto

**Versão atual: 0.x (pré-lançamento)**

O site ainda não foi lançado publicamente. Estamos desenvolvendo e validando as funcionalidades. A versão e o commit aparecem no rodapé.

## Para desenvolvedores

Quer rodar o projeto localmente ou contribuir? Veja o [guia técnico em AGENTS.md](AGENTS.md#como-rodar).

Resumo rápido:

```bash
pnpm install
cp .env.example .env && cp .env.example apps/web/.env.local
pnpm db:up           # Postgres em 127.0.0.1:5436
pnpm db:migrate
pnpm db:seed:test    # dados fictícios para desenvolvimento
pnpm dev
```

A stack é **Next.js 16**, **React 19**, **Tailwind CSS 4**, **PostgreSQL 16** e **Kysely**, em monorepo com pnpm.

## Como contribuir

Contribuições são bem-vindas! Leia o [CONTRIBUTING.md](CONTRIBUTING.md) para saber como configurar o ambiente, abrir PRs e seguir os padrões do projeto. Esperamos que todos sigam nosso [Código de Conduta](CODE_OF_CONDUCT.md).

Resumo rápido:

1. Confira as [issues abertas](https://github.com/leonardo-moraes360/auditaja/issues) ou [proponha uma melhoria](https://github.com/leonardo-moraes360/auditaja/issues/new?template=feature.yml).
2. Siga o padrão de [Conventional Commits](https://www.conventionalcommits.org/pt-br/) (`feat:`, `fix:`, `docs:`...).
3. Rode os checks antes de abrir o PR: `pnpm lint && pnpm typecheck && pnpm format:check && pnpm test`.

### Encontrou um erro nos dados?

Use o formulário "Contestar" no perfil do parlamentar, ou abra uma [issue de correção de dado](https://github.com/leonardo-moraes360/auditaja/issues/new?template=correcao-de-dado.yml).

### Encontrou uma vulnerabilidade?

**Não abra issue pública.** Veja [SECURITY.md](SECURITY.md) e use o [relato privado do GitHub](https://github.com/leonardo-moraes360/auditaja/security/advisories/new).

## Segurança

O projeto trata dados de interesse público e dados pessoais de terceiros (fornecedores, por exemplo). Falhas de segurança devem ser relatadas em particular.

Detalhes completos em [SECURITY.md](SECURITY.md), incluindo escopo, prazos e safe harbor para pesquisadores de boa-fé.

## Licenças

| O quê                                   | Licença                                                                                                         |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Código-fonte                            | [GNU AGPL-3.0 ou posterior](LICENSE) — quem colocar no ar uma versão modificada precisa disponibilizar o código |
| Dados e textos produzidos pelo Auditaja | [CC BY 4.0](LICENSE-DATA) — reuso livre, inclusive comercial, citando "Auditaja", o link e a data               |
| Dados de origem                         | Seguem a licença de cada órgão (Câmara, Senado, TSE, CGU), listada em `/fontes`                                 |
| Nome e logo                             | Não estão licenciados                                                                                           |

Contribuições entram sob as mesmas licenças. Relicenciamento futuro exigirá DCO ou CLA.

---

Feito com dados públicos, código aberto e vontade de transparência.
