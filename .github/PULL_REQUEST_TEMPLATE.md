<!--
Obrigado pela contribuição. Preencha o que se aplica e apague o resto.
Não cole dados pessoais (CPF, e-mail, telefone, endereço, nome de pessoa física que não seja parlamentar)
na descrição, em prints ou em logs: este repositório é público.
Vulnerabilidade? Não abra PR nem issue: use o reporte privado em Security → Report a vulnerability.
-->

## Resumo

<!-- O que muda e por quê, em poucas linhas. Ligue a issue: "Fecha #123". -->

## Tipo de mudança

- [ ] Correção de bug
- [ ] Funcionalidade nova
- [ ] Correção ou nova coleta de dado (`packages/ingest`)
- [ ] Mudança de metodologia ou de indicador
- [ ] Refatoração sem mudança de comportamento
- [ ] Documentação
- [ ] CI, dependências ou infraestrutura

## Como validar

<!-- Passos para quem revisa reproduzir: rota afetada, comando, dado de exemplo. Prints para mudança visual (desktop e celular, tema claro e escuro). -->

1.

## Checklist

- [ ] `pnpm lint`, `pnpm typecheck` e `pnpm format:check` passam
- [ ] `pnpm test` passa (com o Postgres de teste no ar: `pnpm db:up && pnpm db:seed:test`)
- [ ] `pnpm build && pnpm test:e2e` passa, quando a mudança toca o site
- [ ] Testes novos ou ajustados cobrem o que mudou, inclusive casos de erro e borda
- [ ] `CHANGELOG.md` atualizado em `## [Não publicado]`, quando a mudança é visível no site
- [ ] Mudança visual conferida no celular, no tema escuro e com teclado/leitor de tela

## Banco de dados

- [ ] Sem migração
- [ ] Com migração nova em `packages/db/src/migrations/` (nome: <!-- 00NN_nome -->)
  - [ ] Roda do zero (`pnpm db:seed:test`) e sobre um banco já existente
  - [ ] Não apaga nem reescreve dado coletado sem plano de volta descrito abaixo
  - [ ] Precisa de coleta nova depois do deploy (`pnpm ingest <comando>`): <!-- qual -->

## Privacidade e LGPD

<!-- Ver as regras R1–R13 do README e a página /privacidade. -->

- [ ] Não coleta, guarda nem exibe dado pessoal novo
- [ ] Se coleta ou exibe: é dado público da função do parlamentar, ou está mascarado/minimizado (R2, R3), e a `/privacidade` foi atualizada
- [ ] Todo dado novo mostra fonte e data de coleta (R1)
- [ ] Textos descrevem indicadores como pontos de partida para verificação, não como acusação (R4)
- [ ] Coleta nova respeita limites das fontes, sem acesso agressivo (R7)

## Metodologia

- [ ] Não muda cálculo, regra ou indicador
- [ ] Muda: `METODOLOGIA_VERSAO` (`packages/core/src/metrics.ts`) subiu, `/metodologia` explica a mudança e o `CHANGELOG.md` cita a nova versão

## Riscos e pendências

<!-- O que não foi verificado, efeitos colaterais conhecidos, variáveis de ambiente novas, passos manuais no deploy (Coolify). -->
