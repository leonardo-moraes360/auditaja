# Perfil do senador Design

**Spec**: `.specs/features/perfil-senador/spec.md`
**Status**: Draft

## Visão geral

O senador entra nas mesmas tabelas do deputado. A casa fica em `parlamentar.casa` e nas votações em `sigla_orgao = 'PLEN-SF'`. A leitura (`src/data/perfil.ts`) e a tela escolhem regras e textos pela casa; nenhuma consulta do deputado muda de filtro, o que protege os testes existentes.

```
legis.senado.leg.br/dadosabertos ──┐
  /senador/lista/legislatura/57     │
  /senador/lista/atual              │   src/ingest/senado.ts      parlamentar (casa='senado')
  /senador/{cod}  /…/comissoes      ├─► (ClienteEducado, 1 req/s) ─► suplente, orgao_membro
  /votacao?dataInicio&dataFim       │   transformações puras em    votacao (PLEN-SF), voto
  /plenario/votacao/orientacaoBancada│  src/lib/senado.ts          orientacao
adm.senado.gov.br/…/despesas_ceaps/{ano}┘                          despesa_ceap
                                                   │
                       src/data/perfil.ts (casa-aware) ─► página /parlamentares/[id], lista
```

## Decisões

| Tema | Decisão | Alternativa descartada |
| ---- | ------- | ---------------------- |
| Id | `10_000_000 + CodigoParlamentar` (`idSenador()` em `src/lib/senado.ts`) | Chave composta (casa, código): exigiria mudar todas as FKs, rotas, feed e contestação |
| Esquema | Migração `0008_senado`: `casa in ('camara','senado')`; colunas `mandato_inicio`, `mandato_fim`, `participacao`, `bloco` em `parlamentar`; tabela `suplente(parlamentar_id, ordem, nome, codigo)`; `votacao.secreta boolean default false` | Tabelas separadas para o Senado: duplicaria leitura e tela |
| CEAPS | Mesma tabela `despesa_ceap`; `valor_documento = valor_liquido = valorReembolsado`, glosa/restituição 0, `ide_documento = id` da API | Tabela própria: o perfil teria de somar duas fontes |
| Votações | Uma requisição `/votacao` por ano (todas as votações com os 81 votos) e uma `/orientacaoBancada/{ini}/{fim}` | `/senador/{cod}/votacoes` foi desativado em 2026-02; 81 requisições por ano |
| Presença | Função pura `presencaSenado(votos)` com três conjuntos de siglas (presente, licença, ausente) | Reusar `voto <> ''` da Câmara: o Senado registra ausência com sigla, não com vazio |
| Alinhamento | `orientacaoDaLideranca(partido, orientacoes)` em `src/lib/senado.ts` e o mesmo `alinhamento()` de `metrics.ts` alimentado com a orientação já escolhida | Reusar `tipoBancadaParaPartido`: confundiria "Progressistas" com prefixos e aceitaria blocos |
| Tela | `parlamentar.casa` decide rótulos (`rotulos.ts`), blocos condicionais em `secoes.tsx` e a trilha | Página separada `/senadores/[id]`: duplicaria o perfil inteiro |
| Lista | `?casa=camara|senado`, contagens por casa em uma consulta agrupada | Abas por rota |

## Componentes

- `src/lib/senado.ts` (puro): `idSenador`, `codigoSenado`, `comoLista` (SERR-02), `sexoDoSenado`, `normalizarOrientacao`, `partidoDaLideranca`, `orientacaoDaLideranca`, `classificarVotoSenado`, `presencaSenado`, `rotuloVotoSenado`.
- `src/ingest/senado.ts`: `montarSenadores`, `montarSuplentes`, `montarComissoes`, `montarDespesasCeaps`, `montarVotacoesSenado`, `montarOrientacoesSenado` (puras, testadas com respostas gravadas em `tests/fixtures/senado/`) e `coletarSenadores`, `coletarCeaps`, `coletarVotacoesSenado` (rede + transação).
- `src/data/perfil.ts`: ramo do Senado para presença, média, alinhamento, teto e mandato; `contarPorCasa()` e filtro `casa` em `buscarParlamentares`.
- `src/components/perfil/secoes.tsx` e `src/app/parlamentares/[id]/page.tsx`: textos e blocos por casa.
- `src/app/parlamentares/page.tsx`: filtros por casa e cartão com cargo.
- `src/app/metodologia/page.tsx`, `src/app/fontes/page.tsx`: seção do Senado.
- `src/db/seed.ts`: um senador fictício com CEAPS, votos (aberto, secreto, ausência com motivo, licença) e suplentes.

## Tratamento de erros

- 401/403 em URL de dados: `ColetaBloqueada` do `ClienteEducado` (já testado); a coleta para sem gravar nada (transação só depois de baixar tudo).
- Resposta da API com objeto único onde se espera lista: `comoLista`.
- Nota da CEAPS de senador não cadastrado: descartada e contada no retorno.

## Riscos

- Ramos paralelos (`feat/presenca-sem-licencas`, `feat/emendas-transparencia`) mexem nos mesmos arquivos de leitura e tela; quem fizer merge depois rebaseia.
- `sequencialVotacao` como chave assume que é único no Senado; o teste de integração confere que as 67 votações de 2026 geram 67 ids distintos.
