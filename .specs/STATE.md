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

## Handoff

- **Feature**: `.specs/features/perfil-parlamentar`
- **Phase / Task**: Execute concluído (retroativo); validação independente
- **Completed**: T1–T12
- **In-progress** (file:line): none
- **Next step**: Revisão humana do PR #1
- **Blockers**: none
- **Uncommitted files**: none
- **Branch**: feat/perfil-parlamentar
