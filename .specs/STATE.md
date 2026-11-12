# STATE

## Decisions

### AD-001
- **Decision**: Toda rede de coleta passa pelo `ClienteEducado` (`src/ingest/http.ts`), e a coleta prefere arquivos em lote a varrer APIs.
- **Reason**: R7 do estudo jurídico (robots.txt, limite de taxa, User-Agent identificado, sem contornar bloqueios) e menor carga nos órgãos.
- **Trade-off**: Dados com a defasagem do lote (em geral diária); não há coleta incremental fina.
- **Scope**: Todos os coletores, de qualquer fonte.
- **Date**: 2026-11-11
- **Status**: active

### AD-002
- **Decision**: Dado pessoal de terceiro é minimizado e mascarado na gravação, não na exibição: o banco nunca guarda CPF completo de terceiro, nome de fornecedor PF, nome de passageiro nem descrição livre de bem.
- **Reason**: R2 e R3; um vazamento do banco ou um bug de tela não expõe o que nunca foi gravado.
- **Trade-off**: Não dá para reprocessar a máscara sem coletar de novo; cruzamentos futuros por CPF de terceiro ficam impossíveis (o que a R3 já proíbe).
- **Scope**: Toda ingestão e todo esquema.
- **Date**: 2026-11-11
- **Status**: active

### AD-003
- **Decision**: Proveniência por lote: cada arquivo ou resposta coletada vira uma linha em `coleta` (URL, data, SHA-256, licença) e todo registro coletado aponta para ela por `coleta_id`.
- **Reason**: R1 exige fonte por registro; o hash permite provar que o arquivo é o publicado pelo órgão.
- **Trade-off**: A URL por registro só existe quando a fonte publica uma (documento da CEAP, URI da votação).
- **Scope**: Todas as tabelas de dado coletado.
- **Date**: 2026-11-11
- **Status**: active

### AD-004
- **Decision**: Arquivos do Portal da Transparência são baixados direto do servidor de arquivos da CGU (`dadosabertos-download.cgu.gov.br`), destino do redirecionamento de `/download-de-dados/...`, e nunca pelo host `portaldatransparencia.gov.br`, que responde com captcha (AWS WAF).
- **Reason**: R7 proíbe contornar captcha; o servidor de arquivos é o caminho oficial do download e não exige verificação.
- **Trade-off**: Se a CGU mudar o caminho dos arquivos, a URL fixa quebra e a coleta falha alto (sem fallback para o host com captcha).
- **Scope**: Coletores de emendas e sanções e qualquer base futura do Portal.
- **Date**: 2026-11-11
- **Status**: active

### AD-005
- **Decision**: Senadores ficam nas mesmas tabelas dos deputados, com `parlamentar.casa = 'senado'` e `id = 10.000.000 + CodigoParlamentar`; as votações do Senado usam `sigla_orgao = 'PLEN-SF'` e id `SF-{sequencialVotacao}`. Cada coleta só apaga e regrava dados da própria Casa (filtro por `casa`, nunca por faixa de id).
- **Reason**: Reaproveita perfil, rotas, feed, CSV e contestação sem duplicar código; o seed usa ids de deputado acima de 900 milhões, então faixa de id não separa as Casas.
- **Trade-off**: O id do senador na URL não é o código do Senado; `codigoSenado()` faz a conversão.
- **Scope**: Esquema, coletores, leitura e rotas do perfil.
- **Date**: 2026-11-11
- **Status**: active

## Handoff

- **Feature**: `.specs/features/perfil-senador`
- **Phase / Task**: Verificação nº 4 PASS (validation.md); merge da main (PRs #6 e #7) feito; push e PR com ok do usuário
- **Completed**: T1–T17
- **In-progress** (file:line): none
- **Next step**: revisão humana do PR do Senado
- **Blockers**: none
- **Uncommitted files**: none
- **Branch**: feat/senadores (worktree ../auditaja-wt/senadores; bancos auditaja_senado_test e auditaja_senado_dev; e2e com E2E_PORT=3242)
