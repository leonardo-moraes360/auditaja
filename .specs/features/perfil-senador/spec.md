# Perfil do senador Specification

> Estende o perfil parlamentar (`.specs/features/perfil-parlamentar`), que cobre só deputados federais, para os 81 senadores. Visual de referência: artboards "Senador · desktop", "Senador · celular" e "Lista com Câmara e Senado" do canvas do protótipo (y = 8420).

## Problem Statement

O Auditaja só mostra deputados. O Senado gasta cota própria (CEAPS), vota em Plenário com regras diferentes (votações secretas, orientação por liderança) e tem mandato de 8 anos com suplentes. Sem os senadores, o cidadão audita só metade do Congresso. As fontes do Senado são públicas e não pedem chave, então dá para cobrir os senadores com as mesmas garantias (R1, R3, R4, R7) do perfil do deputado.

## Goals

- [ ] Os 81 senadores em exercício aparecem na busca e na lista, cada um com perfil em `/parlamentares/{id}`.
- [ ] O perfil do senador mostra cota (CEAPS), presença, alinhamento com a liderança, bens do TSE e mandato, cada bloco com fonte, data de coleta e link (R1).
- [ ] Nenhum CPF de terceiro aparece completo no banco ou na tela (R3).
- [ ] A coleta inteira do Senado faz no máximo 1 requisição por segundo por host e menos de 200 requisições por execução (R7).
- [ ] O perfil do deputado continua igual: nenhum teste existente do deputado muda de resultado.

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Teto da CEAPS por UF | O Senado não publica o teto por UF em formato aberto; não há valor conferido para comparar. |
| Votações em comissões do Senado | O perfil do deputado também só usa o Plenário. |
| Ex-senadores fora da 57ª legislatura | Mesmo recorte do deputado (legislatura atual). |
| Histórico de suplência (quem substituiu quem e quando) | Exige uma requisição por exercício; o bloco Mandato mostra só os suplentes atuais. |
| Discursos, autorias e relatorias | Não fazem parte do protótipo aprovado. |
| CI e coleta agendada | Fora do escopo desta entrega, como no MVP. |
| Página do portal `www12.senado.leg.br/.../dados-abertos-ceaps` | Redireciona para login; usamos a API administrativa pública. |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Identificador do senador | `parlamentar.id = 10_000_000 + CodigoParlamentar`; a URL segue `/parlamentares/{id}` | Ids da Câmara vão até ~240 mil; o deslocamento evita colisão sem mudar rota, feed, CSV e contestação | n |
| Universo de senadores | Lista da 57ª legislatura (`/senador/lista/legislatura/57`); `em_exercicio` vem de `/senador/lista/atual` | Mantém gastos e votos de quem exerceu e saiu, como suplentes | n |
| CPF já mascarado pelo Senado ("000.***.***-00") | Não gravar documento | O Senado mostra os 3 primeiros e os 2 últimos dígitos e a Câmara, os 6 do meio: guardar os dois deixaria remontar o CPF de quem fornece às duas Casas (R3) | n |
| Valor da cota | `valorReembolsado` da CEAPS vira `valor_documento` e `valor_liquido`; glosa e restituição = 0 | O Senado não publica glosa | n |
| Teto da cota | Não exibir comparação com teto para senadores | Sem valor conferido (CEAP-06 já cobre "sem teto") | n |
| Identidade da votação | `votacao.id = "SF-" + sequencialVotacao` | O mesmo número aparece em `/votacao` e em `/orientacaoBancada`, o que permite o casamento | n |
| Órgão das votações do Senado | `sigla_orgao = "PLEN-SF"` | Separa do Plenário da Câmara (`PLEN`) sem mudar as consultas do deputado | n |
| Voto secreto | Voto `Votou` conta como presença e nunca entra no alinhamento | O Senado não publica o voto | n |
| Presença | Presente: Sim, Não, Abstenção, Votou, P-NRV, Obstrução, Presidente (art. 51 RISF). Fora do denominador: licenças e afastamentos (lista em SPRES-02). Ausente: todo o resto (AP, MIS, NCom, AUS, MER, L1, L4, L6, NA) | Mesmo princípio do deputado: licença não é falta; missão e atividade parlamentar contam como ausência, com o motivo exibido | n |
| Orientação | Só a liderança do próprio partido (nome normalizado: Progressistas = PP, Podemos = PODE); Governo, Maioria, Minoria, Oposição, B.Feminina e blocos não contam | Equivale ao "partido" da Câmara; o Senado não orienta por federação | n |
| Valores da orientação | SIM → Sim, NÃO → Não, LIVRE → Liberado, OBSTRUÇÃO → Obstrução | Mesmo vocabulário exibido para deputados | n |
| Datas de nascimento | Uma requisição a `/senador/{codigo}` por senador da legislatura, para casar com o TSE | A lista não traz nascimento; 1 req/s fica em ~2 min | n |
| Comissões | Uma requisição a `/senador/{codigo}/comissoes` por senador em exercício; só participações sem data de fim e só da Casa SF | Mesmo recorte do deputado (órgãos atuais) | n |
| robots.txt | `legis.senado.leg.br` e `adm.senado.gov.br` respondem 403 ao robots.txt; seguimos a RFC 9309 (4xx = sem restrição), já implementada no `ClienteEducado` | Um 403 em qualquer outra URL encerra a coleta | n |
| Texto da busca do topo | Muda de "Buscar deputado por nome ou UF" para "Buscar deputado ou senador por nome ou UF" | O protótipo aprovado já usa esse texto; altera BUSCA-05 do perfil do deputado | n |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Coletar os senadores ⭐ MVP

**User Story**: As a mantenedor, I want coletar senadores, mandatos e suplentes da API do Senado so that eles tenham perfil no Auditaja.

**Why P1**: Sem o cadastro não há perfil.

**Acceptance Criteria**:

1. WHEN a coleta `senadores` roda THEN the system SHALL gravar cada senador da 57ª legislatura com `casa = 'senado'` e `id = 10000000 + CodigoParlamentar`. <!-- SCAD-01 -->
2. WHEN a coleta `senadores` roda THEN the system SHALL marcar `em_exercicio = true` só para os códigos presentes em `/senador/lista/atual`. <!-- SCAD-02 -->
3. WHEN a coleta `senadores` roda THEN the system SHALL gravar início e fim do mandato, participação ("Titular", "1º Suplente"…), nome do bloco e os suplentes atuais com sua ordem. <!-- SCAD-03 -->
4. WHEN a coleta `senadores` roda THEN the system SHALL gravar sexo "F" ou "M" a partir de `SexoParlamentar` ("Feminino"/"Masculino") e a data de nascimento de `/senador/{codigo}`. <!-- SCAD-04 -->
5. The system SHALL registrar uma linha em `coleta` por resposta baixada do Senado, com URL, SHA-256 e licença, e apontar cada registro para ela. <!-- SCAD-05 -->
6. WHEN a coleta `senadores` roda de novo THEN the system SHALL substituir os dados do Senado sem duplicar senadores nem suplentes e sem alterar deputados. <!-- SCAD-06 -->

**Independent Test**: com respostas gravadas da API, a coleta grava o senador 5672 com id 10005672, mandato 2023-02-01 a 2031-01-31 e 2 suplentes; rodar duas vezes deixa as mesmas contagens.

---

### P1: Gastos da CEAPS ⭐ MVP

**User Story**: As a cidadão, I want ver a cota do senador so that eu confira o uso do dinheiro como faço com deputados.

**Why P1**: Principal dado de auditoria.

**Acceptance Criteria**:

1. WHEN a coleta `ceaps {ano}` roda THEN the system SHALL gravar cada nota da API `despesas_ceaps/{ano}` cujo `codSenador` corresponde a um senador cadastrado, com `valor_liquido = valorReembolsado`. <!-- SCEAPS-01 -->
2. IF o `cpfCnpj` da nota não é um CNPJ válido THEN the system SHALL gravar o nome "Prestador pessoa física" e, como documento, o CPF mascarado no padrão da Receita quando a fonte traz os 11 dígitos, ou nenhum documento nos outros casos (CPF já mascarado pela fonte, como "000.***.***-00", documento malformado ou ausente); nunca o CPF completo. <!-- SCEAPS-02 -->
3. IF a nota não tem `tipoDespesa` THEN the system SHALL gravá-la com o tipo "Não informado pelo Senado". <!-- SCEAPS-03 -->
4. IF o `codSenador` não corresponde a senador cadastrado THEN the system SHALL descartar a nota e informar a quantidade descartada no resultado da coleta. <!-- SCEAPS-04 -->
5. WHEN o perfil de um senador abre THEN the system SHALL exibir o título "Gastos da cota do senador (CEAPS)", o total do ano e a média mensal (total ÷ meses com notas no ano). <!-- SCEAPS-05 -->
6. WHILE o perfil é de senador the system SHALL omitir a linha e a barra de teto e exibir o aviso de que o Senado publica o valor reembolsado, sem glosa e sem teto por estado em formato aberto. <!-- SCEAPS-06 -->
7. WHEN a coleta `ceaps {ano}` roda de novo THEN the system SHALL substituir as notas daquele ano de senadores sem tocar nas notas de deputados. <!-- SCEAPS-07 -->

**Independent Test**: no seed, o senador fictício tem total de 2026 = soma das notas e média = total ÷ meses distintos; a tela não mostra "teto".

---

### P1: Votações, presença e alinhamento ⭐ MVP

**User Story**: As a cidadão, I want ver como o senador vota e se comparece so that eu compare com o que ele diz.

**Why P1**: Segundo dado central do perfil.

**Acceptance Criteria**:

1. WHEN a coleta `votacoes-senado {ano}` roda THEN the system SHALL gravar cada votação nominal do Plenário do Senado no ano com id `SF-{sequencialVotacao}`, `sigla_orgao = 'PLEN-SF'`, identificação da matéria (ex.: "PEC 221/2019"), ementa, data, resultado e se é secreta. <!-- SVOT-01 -->
2. WHEN a coleta `votacoes-senado {ano}` roda THEN the system SHALL gravar o voto de cada senador cadastrado com a sigla publicada pelo Senado e o partido no dia. <!-- SVOT-02 -->
3. WHEN a coleta `votacoes-senado {ano}` roda THEN the system SHALL gravar as orientações de liderança do período, ligadas à votação pelo `sequencialVotacao`, com os valores normalizados (SIM → Sim, NÃO → Não, LIVRE → Liberado, OBSTRUÇÃO → Obstrução). <!-- SVOT-03 -->
4. The system SHALL fazer no máximo 2 requisições por ano coletado de votações do Senado (uma de votações com votos, uma de orientações). <!-- SVOT-04 -->
5. WHEN o perfil de um senador abre THEN the system SHALL listar as votações do `PLEN-SF` do ano mais recente com votações, mais recentes primeiro. <!-- SVOT-05 -->
6. WHEN a votação é secreta THEN the system SHALL exibir "Votou (voto secreto)" no desktop e "Votou (secreto)" no celular se o voto é `Votou`, e "Orientação: não se aplica". <!-- SVOT-06 -->
7. WHEN o voto é uma ausência justificada THEN the system SHALL exibir "Ausente: " seguido do motivo (AP → "atividade parlamentar", MIS → "missão oficial", MER → "Parlamento do Mercosul", AUS → "ausência comunicada"); NCom SHALL aparecer como "Não compareceu". <!-- SVOT-07 -->
8. The system SHALL rotular o filtro de divergência do senador como "Divergiu da liderança" e o indicador como "Votou como a liderança orientou". <!-- SVOT-08 -->

**Independent Test**: com as respostas gravadas de 14/10/2026, a PEC 221/2019 vira `SF-4420` com 81 votos e orientação "Sim" do PT; uma votação secreta mostra "Votou (voto secreto)".

---

### P1: Indicadores do senador ⭐ MVP

**User Story**: As a cidadão, I want números de presença e alinhamento calculados com regras públicas so that eu possa confiar neles.

**Why P1**: São os indicadores do topo do perfil.

**Acceptance Criteria**:

1. The system SHALL contar como presença os votos Sim, Não, Abstenção, Votou, P-NRV, Obstrução e "Presidente (art. 51 RISF)". <!-- SPRES-01 -->
2. The system SHALL retirar do denominador da presença os votos AFO, DJ, EP, EPR, LL, LS, LP, LPA, LSP, LAP, LAF, LA, LG, LGA, LN, LCS, LEG, LC, L2, L3 e L5 (licenças e afastamentos). <!-- SPRES-02 -->
3. The system SHALL calcular a presença como presentes ÷ (votações com registro do senador − licenças e afastamentos), em %, e exibir "{presentes} de {denominador} em {ano}". <!-- SPRES-03 -->
4. The system SHALL calcular a média do Senado como a média simples da presença dos senadores em exercício pela mesma regra. <!-- SPRES-04 -->
5. The system SHALL considerar como orientação aplicável só a da liderança cujo nome normalizado corresponde ao partido do senador no voto (Progressistas = PP, Podemos = PODE, Republicanos = REPUBLICANOS). <!-- SALI-01 -->
6. The system SHALL calcular o alinhamento só nas votações em que a orientação aplicável é Sim ou Não e o voto é Sim ou Não, e exibir "Divergiu em {d} de {n} votações abertas". <!-- SALI-02 -->
7. The system SHALL ignorar orientações de Governo, Maioria, Minoria, Oposição, B.Feminina e blocos. <!-- SALI-03 -->

**Independent Test**: testes unitários das funções puras com casos de cada sigla; no seed, presença e alinhamento batem com a conta à mão.

---

### P1: Perfil e lista do senador ⭐ MVP

**User Story**: As a cidadão, I want ver o senador no mesmo formato do deputado so that eu não precise aprender outra tela.

**Why P1**: Entrega visível da feature.

**Acceptance Criteria**:

1. WHEN o perfil de um senador abre THEN the system SHALL exibir a trilha "Parlamentares / Senado Federal / {nome}". <!-- SUI-01 -->
2. WHEN o perfil de um senador abre THEN the system SHALL exibir "Senador por {UF por extenso} ({UF})" (ou "Senadora" quando sexo = F), o partido e o nome do bloco. <!-- SUI-02 -->
3. WHEN o perfil de um senador abre THEN the system SHALL exibir o selo "Mandato {ano início}–{ano fim}" e o selo da participação ("Titular" ou "1º Suplente em exercício"). <!-- SUI-03 -->
4. WHEN o perfil de um senador abre THEN the system SHALL exibir no bloco Mandato: Casa "Senado Federal", UF, início, fim previsto, situação, bloco e a lista de suplentes com a ordem. <!-- SUI-04 -->
5. WHEN o perfil de um senador abre THEN the system SHALL citar como fonte do cadastro, das votações e da CEAPS o Senado Federal, com data de coleta e link para a resposta original (R1). <!-- SUI-05 -->
6. WHEN a lista de parlamentares abre THEN the system SHALL exibir os filtros "Todos", "Câmara dos Deputados" e "Senado Federal" com a contagem de parlamentares em exercício de cada um, e `?casa=senado` SHALL listar só senadores. <!-- SUI-06 -->
7. WHEN a lista mostra um senador THEN the system SHALL exibir no cartão "Senador" ou "Senadora", partido e UF. <!-- SUI-07 -->
8. The system SHALL exibir no campo de busca do topo o placeholder "Buscar deputado ou senador por nome ou UF". <!-- SUI-08 -->
9. IF `?casa=` traz valor diferente de `camara` ou `senado` THEN the system SHALL tratar como "Todos". <!-- SUI-09 -->
10. WHILE o perfil é de senador the system SHALL manter acompanhar (feed Atom), contestar e baixar CSV funcionando pelo mesmo id. <!-- SUI-10 -->
11. The system SHALL descrever na página de metodologia as regras de presença e alinhamento do Senado e listar o Senado na página de fontes. <!-- SUI-11 -->

**Independent Test**: e2e no seed: abrir a lista com `?casa=senado`, clicar no senador fictício e ver trilha, mandato, suplentes e CEAPS sem teto; axe sem violações.

---

### P2: Bens do senador no TSE

**User Story**: As a cidadão, I want ver os bens declarados pelo senador so that eu acompanhe a evolução patrimonial.

**Why P2**: O coletor do TSE já existe; o ganho vem do cadastro com nome civil e nascimento.

**Acceptance Criteria**:

1. WHEN a coleta `bens {ano}` roda depois da coleta de senadores THEN the system SHALL casar candidaturas do TSE com senadores pela mesma regra do deputado (nome civil normalizado + data de nascimento). <!-- SBENS-01 -->
2. WHEN o perfil do senador tem bens THEN the system SHALL exibir o bloco de bens com o mesmo cálculo do deputado e a nota de que senadores disputam eleição a cada 8 anos. <!-- SBENS-02 -->

**Independent Test**: teste unitário de `casarCandidaturas` com um senador e uma candidatura a SENADOR.

---

## Edge Cases

- IF o Senado responde 401 ou 403 numa URL de dados THEN the system SHALL encerrar a coleta com `ColetaBloqueada`, sem nova tentativa. <!-- SERR-01 -->
- IF uma resposta de lista vem com um único item como objeto em vez de lista THEN the system SHALL tratá-la como lista de um item. <!-- SERR-02 -->
- WHEN um senador não tem votações no ano THEN the system SHALL exibir "Sem votações registradas em {ano}" no lugar da presença. <!-- SERR-03 -->
- WHEN um senador não tem notas da CEAPS THEN the system SHALL exibir o bloco de gastos com o estado vazio já usado para deputados. <!-- SERR-04 -->

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| SCAD-01 | P1: Coletar os senadores | Tasks | Implementing |
| SCAD-02 | P1: Coletar os senadores | Tasks | Implementing |
| SCAD-03 | P1: Coletar os senadores | Tasks | Implementing |
| SCAD-04 | P1: Coletar os senadores | Tasks | Implementing |
| SCAD-05 | P1: Coletar os senadores | Tasks | Implementing |
| SCAD-06 | P1: Coletar os senadores | Tasks | Implementing |
| SCEAPS-01 | P1: Gastos da CEAPS | Tasks | Implementing |
| SCEAPS-02 | P1: Gastos da CEAPS | Tasks | Implementing |
| SCEAPS-03 | P1: Gastos da CEAPS | Tasks | Implementing |
| SCEAPS-04 | P1: Gastos da CEAPS | Tasks | Implementing |
| SCEAPS-05 | P1: Gastos da CEAPS | Tasks | Implementing |
| SCEAPS-06 | P1: Gastos da CEAPS | Tasks | Implementing |
| SCEAPS-07 | P1: Gastos da CEAPS | Tasks | Implementing |
| SVOT-01 | P1: Votações | Tasks | Implementing |
| SVOT-02 | P1: Votações | Tasks | Implementing |
| SVOT-03 | P1: Votações | Tasks | Implementing |
| SVOT-04 | P1: Votações | Tasks | Implementing |
| SVOT-05 | P1: Votações | Tasks | Implementing |
| SVOT-06 | P1: Votações | Tasks | Implementing |
| SVOT-07 | P1: Votações | Tasks | Implementing |
| SVOT-08 | P1: Votações | Tasks | Implementing |
| SPRES-01 | P1: Indicadores | Tasks | Implementing |
| SPRES-02 | P1: Indicadores | Tasks | Implementing |
| SPRES-03 | P1: Indicadores | Tasks | Implementing |
| SPRES-04 | P1: Indicadores | Tasks | Implementing |
| SALI-01 | P1: Indicadores | Tasks | Implementing |
| SALI-02 | P1: Indicadores | Tasks | Implementing |
| SALI-03 | P1: Indicadores | Tasks | Implementing |
| SUI-01 | P1: Perfil e lista | Tasks | Implementing |
| SUI-02 | P1: Perfil e lista | Tasks | Implementing |
| SUI-03 | P1: Perfil e lista | Tasks | Implementing |
| SUI-04 | P1: Perfil e lista | Tasks | Implementing |
| SUI-05 | P1: Perfil e lista | Tasks | Implementing |
| SUI-06 | P1: Perfil e lista | Tasks | Implementing |
| SUI-07 | P1: Perfil e lista | Tasks | Implementing |
| SUI-08 | P1: Perfil e lista | Tasks | Implementing |
| SUI-09 | P1: Perfil e lista | Tasks | Implementing |
| SUI-10 | P1: Perfil e lista | Tasks | Implementing |
| SUI-11 | P1: Perfil e lista | Tasks | Implementing |
| SBENS-01 | P2: Bens | Tasks | Implementing |
| SBENS-02 | P2: Bens | Tasks | Implementing |
| SERR-01 | Edge cases | Tasks | Implementing |
| SERR-02 | Edge cases | Tasks | Implementing |
| SERR-03 | Edge cases | Tasks | Implementing |
| SERR-04 | Edge cases | Tasks | Implementing |

**Coverage:** 45 total, 45 mapped to tasks (T1–T16), 0 unmapped

---

## Success Criteria

- [ ] `pnpm ingest senado 2026` termina em menos de 5 minutos com menos de 200 requisições e grava 81 senadores em exercício.
- [ ] O perfil de um senador real abre com os quatro indicadores preenchidos.
- [ ] Paridade ≥ 95% com os artboards do Senado no canvas, medida pela rubrica de paridade.
- [ ] Toda a suíte existente (unit, integração, e2e, axe) continua passando.
