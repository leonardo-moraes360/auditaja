# Perfil do deputado federal Specification

> Spec escrita depois da implementação (branch `feat/perfil-parlamentar`, PR #1). Descreve o comportamento entregue e as regras legais R1–R13 que ele cumpre; o Verifier confere cada critério contra o código e os testes.

## Problem Statement

O cidadão não tem um lugar único e confiável para ver como um deputado federal usa a cota parlamentar, como vota e quanto patrimônio declara. Os dados existem, espalhados entre Câmara e TSE, em formatos difíceis. O Auditaja reúne esses dados em um perfil, mostrando de onde veio cada número, sem expor terceiros e sem acusar ninguém.

## Goals

- [ ] Qualquer pessoa encontra um deputado em exercício pelo nome e abre o perfil em até 2 cliques a partir da página inicial.
- [ ] Toda seção do perfil mostra fonte, data de coleta e link para o original (R1).
- [ ] Nenhum CPF de terceiro aparece completo em banco ou tela (R3).
- [ ] A coleta segue robots.txt, 1 req/s por host e User-Agent identificado (R7).

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Senado Federal (senadores, CEAPS) | Decisão do usuário: MVP só com deputados federais. |
| Alerta de "padrão atípico" | Exige geolocalização de fornecedores e metodologia publicada (R4); etapa própria. |
| Coleta agendada (cron) | Coletores rodam à mão no MVP. |
| Painel de moderação dos pedidos de correção | O MVP só registra o pedido. |
| Contagem de votos recebidos na eleição | Exige arquivo do TSE muito grande; fora do MVP. |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Universo de deputados | Todos os que exerceram mandato na 57ª legislatura; a busca mostra só os em exercício por padrão | A API `/deputados` sem filtro devolve quem está em exercício hoje | y |
| Ano exibido nos gastos | Ano mais recente com despesas do deputado; `?ano=` escolhe outro ano disponível | Evita tela vazia em janeiro | n |
| Denominador da presença | Todas as votações nominais do Plenário no ano | Os arquivos não trazem período de exercício; a tela avisa que inclui licenças | n |
| Orientação aplicável | Partido, depois federação, depois bloco; Governo/Maioria/Minoria/Oposição não contam | Reflete quem orienta a bancada do partido no Plenário | n |
| Bloco com nome truncado | Partido que não aparece na abreviação fica sem orientação | Melhor sem dado do que com dado errado | n |
| Casamento TSE ↔ Câmara | Nome civil normalizado + data de nascimento; sem data, mesma UF; ambíguo é descartado | `deputados.csv` não traz CPF | n |
| Status HTTP de perfil inexistente | Página "não encontrada" com `noindex`; status 200 por causa do streaming | Limitação do `loading.tsx` com Cache Components | n |
| Fornecedor PF | Nome trocado por "Prestador pessoa física" | R3: nome também é dado de terceiro | n |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Encontrar um deputado ⭐ MVP

**User Story**: As a cidadão, I want buscar um deputado pelo nome so that eu chegue ao perfil dele sem saber o id.

**Why P1**: Sem busca não há como chegar ao perfil.

**Acceptance Criteria**:

1. WHEN o usuário busca um termo THEN the system SHALL listar deputados em exercício cujo nome parlamentar ou nome civil contém o termo, ignorando acentos e caixa. <!-- BUSCA-01 -->
2. IF o termo contém `%` ou `_` THEN the system SHALL tratá-los como caracteres literais, sem curinga. <!-- BUSCA-02 -->
3. WHEN o usuário clica num resultado THEN the system SHALL abrir `/parlamentares/{id}` com o nome do deputado no título de nível 1. <!-- BUSCA-03 -->
4. WHEN o termo buscado é a sigla de uma UF (sem diferenciar caixa) THEN the system SHALL incluir os deputados em exercício dessa UF, além dos que casam pelo nome. <!-- BUSCA-04 -->
5. The system SHALL exibir no campo de busca do topo o placeholder "Buscar deputado por nome ou UF" e no campo da página de parlamentares o rótulo "Nome ou UF" com placeholder "Ex.: Maria, Silva ou SP". <!-- BUSCA-05 -->

**Independent Test**: buscar "joao" no seed fictício e obter só "João Ilustrativo"; clicar em "Maria Exemplo" e ver o perfil.

---

### P1: Ver gastos da cota (CEAP) ⭐ MVP

**User Story**: As a cidadão, I want ver quanto e com quem o deputado gastou a cota so that eu possa conferir o uso do dinheiro público.

**Why P1**: É o principal dado de auditoria do MVP.

**Acceptance Criteria**:

1. WHEN o perfil abre THEN the system SHALL exibir o total líquido do ano como a soma de `valor_liquido` das despesas do deputado naquele ano. <!-- CEAP-01 -->
2. WHEN o perfil abre THEN the system SHALL agrupar os gastos por tipo de despesa, em ordem decrescente de valor. <!-- CEAP-02 -->
3. WHEN o perfil abre THEN the system SHALL listar até 5 maiores fornecedores com documento publicável e total, como no protótipo. <!-- CEAP-03 -->
4. IF o ano pedido em `?ano=` não tem despesas do deputado THEN the system SHALL exibir o ano mais recente que tem. <!-- CEAP-04 -->
5. WHEN o perfil abre e há teto conferido para a UF e o ano THEN the system SHALL exibir o total do ano como % do teto acumulado (teto mensal × meses até o último mês com dados). <!-- CEAP-05 -->
6. WHILE não houver teto conferido para a UF e o ano the system SHALL omitir a comparação com o teto. <!-- CEAP-06 -->

**Independent Test**: no seed, o total de 2026 é R$ 44.100 e o maior tipo é "Divulgação da atividade parlamentar".

---

### P1: Ver votações e alinhamento ⭐ MVP

**User Story**: As a cidadão, I want ver como o deputado votou e se seguiu a orientação do partido so that eu entenda seu comportamento no Plenário.

**Why P1**: Votos são o segundo eixo do perfil aprovado no protótipo.

**Acceptance Criteria**:

1. The system SHALL calcular a presença como votações nominais do Plenário no ano com voto não vazio do deputado, sobre as votações nominais do Plenário no ano em que ele estava em exercício (PRES-02); linha de voto vazia não conta como presença. <!-- VOTO-01 -->
2. The system SHALL escolher a orientação aplicável na ordem partido, federação, bloco, ignorando orientação vazia. <!-- VOTO-02 -->
3. The system SHALL contar no alinhamento só votações com orientação "Sim" ou "Não" e voto "Sim" ou "Não", e marcar como divergência quando forem diferentes. <!-- VOTO-03 -->
4. IF uma sigla de bloco é uma sigla completa de partido (ex.: "Psd") THEN the system SHALL casá-la só por igualdade, nunca como prefixo (PSD não casa PSDB). <!-- VOTO-04 -->
5. WHEN o usuário escolhe o filtro "Divergiu da orientação" THEN the system SHALL listar só votações em que voto e orientação são Sim/Não e diferentes. <!-- VOTO-05 -->
6. WHEN uma votação não tem voto do deputado THEN the system SHALL mostrar "Votou: sem registro" no lugar do voto. <!-- VOTO-06 -->
7. WHEN o usuário escolhe o filtro "Sem voto registrado" THEN the system SHALL listar só votações sem voto do deputado. <!-- VOTO-07 -->
8. WHEN a orientação é de um bloco com abreviação truncada (ex.: "Bl UniPpPsd...") e exatamente um bloco da legislatura na API da Câmara casa com ela THEN the system SHALL aplicá-la a todos os partidos desse bloco, inclusive os de federação e os fora da abreviação; sem bloco identificado, só aos partidos visíveis na abreviação. <!-- VOTO-08 -->
9. The system SHALL montar, a partir de `/deputados/{id}/historico` da API v2 da Câmara (só a legislatura atual, em ordem de data e hora), os dias inteiros fora do exercício: licença, afastamento, vacância e o trecho antes da primeira posse; saída às 00:00 tira o dia, saída em outro horário só a partir do dia seguinte, e posse ou reassunção devolve o dia inteiro. <!-- PRES-01 -->
10. WHEN uma votação cai num dia fora do exercício e o deputado não registrou voto nela THEN the system SHALL tirá-la do denominador da presença do deputado e da média da Câmara; voto registrado sempre conta. <!-- PRES-02 -->
11. WHEN uma votação está fora do exercício THEN the system SHALL marcá-la na lista ("Em licença · não conta", "Antes da posse · não conta" ou "Fora do exercício · não conta") e não listá-la no filtro "Ausências". <!-- PRES-03 -->
12. WHEN há períodos fora do exercício no ano das votações THEN the system SHALL mostrar, no cartão de presença do desktop, quantas votações não contam com link para os períodos, e abaixo da lista o quadro "Períodos fora do exercício" com datas, motivo da Câmara e número de votações; sem nenhuma votação em exercício o cartão mostra "—". <!-- PRES-04 -->
13. IF o histórico do deputado ainda não foi coletado THEN the system SHALL contar todas as votações do ano, como antes, e avisar que a presença pode incluir períodos de licença. <!-- PRES-05 -->

**Independent Test**: no seed, presença 50% (2 de 4 em exercício; a votação de julho cai na licença) e alinhamento 50% (1 de 2); o filtro de divergência mostra só a PEC fictícia.

---

### P1: Ver bens declarados ao TSE ⭐ MVP

**User Story**: As a cidadão, I want comparar o patrimônio declarado entre eleições so that eu acompanhe a evolução declarada.

**Why P1**: Terceiro eixo do protótipo aprovado.

**Acceptance Criteria**:

1. WHEN o perfil abre THEN the system SHALL mostrar o total declarado por eleição (2018, 2022, 2026) em que houver candidatura casada. <!-- BENS-01 -->
2. The system SHALL calcular a variação entre eleições como `round((atual - anterior) / anterior * 100)` e não exibir variação quando o anterior for 0. <!-- BENS-02 -->
3. The system SHALL armazenar e exibir só o tipo e o valor de cada bem, nunca a descrição livre. <!-- BENS-03 -->
4. IF um candidato do TSE casa com mais de um deputado THEN the system SHALL descartar o casamento. <!-- BENS-04 -->

**Independent Test**: no seed, bens em 2022 e 2026; teste de transformação garante que "RUA" da descrição não é gravado.

---

### P1: Proveniência e privacidade ⭐ MVP

**User Story**: As a cidadão e como titular de dados, I want saber de onde vem cada dado e ter terceiros protegidos so that a plataforma seja confiável e cumpra a LGPD.

**Why P1**: Regras R1, R2, R3 e R13 do estudo jurídico são condição para publicar.

**Acceptance Criteria**:

1. The system SHALL registrar para cada lote coletado fonte, URL, data de coleta, SHA-256, bytes e licença, e ligar cada registro a esse lote. <!-- PROV-01 -->
2. The system SHALL exibir em cada seção do perfil o rótulo da fonte, a data da coleta e um link "Ver na fonte". <!-- PROV-02 -->
3. The system SHALL mascarar CPF de fornecedor no formato `***.XXX.XXX-**`, mantendo só os 6 dígitos centrais. <!-- PRIV-01 -->
4. The system SHALL substituir o nome de fornecedor pessoa física por "Prestador pessoa física". <!-- PRIV-02 -->
5. The system SHALL descartar o nome de passageiros e o CPF do parlamentar presentes no arquivo da CEAP. <!-- PRIV-03 -->
6. IF o documento do fornecedor não tem 11 nem 14 dígitos THEN the system SHALL não exibir documento. <!-- PRIV-04 -->
7. The system SHALL exibir no rodapé as linhas "Controlador: …" e "Encarregado (LGPD): …". <!-- PRIV-05 -->
8. The system SHALL publicar em `/privacidade` a política de privacidade com data de atualização, controlador e encarregado lidos das mesmas variáveis do rodapé, dados tratados, finalidades e bases legais, compartilhamento, retenção, direitos do titular (art. 18), cookies e segurança, afirmando só o que o código faz. <!-- PRIV-06 -->
9. The system SHALL exibir no rodapé o link "Política de privacidade", entre "Metodologia" e "Fontes e licenças", como no protótipo. <!-- PRIV-07 -->

**Independent Test**: no seed, o perfil mostra `***.456.789-**`, a nota de fonte da CEAP e o rodapé com "Encarregado (LGPD)"; o link "Política de privacidade" do rodapé abre `/privacidade` com os mesmos responsáveis.

---

### P2: Contexto do mandato e fidelidade ao protótipo

**User Story**: As a cidadão, I want ver o mandato, entender a metodologia e navegar como no protótipo aprovado so that eu saiba onde estou e como os números são calculados.

**Why P2**: Completa o perfil aprovado; não bloqueia a auditoria dos dados.

**Acceptance Criteria**:

1. WHEN o perfil abre THEN the system SHALL listar na lateral os órgãos em que o deputado tem cargo sem data de fim, com o cargo. <!-- MAND-01 -->
2. The system SHALL publicar em `/metodologia` o texto da metodologia com a linha "Versão {METODOLOGIA_VERSAO}.". <!-- METOD-01 -->
3. WHILE o usuário está em uma página do menu principal (ou abaixo dela) the system SHALL marcar o item com `aria-current="page"` e sublinhado de 2 px na cor da marca `#1F4FD1`. <!-- NAV-01 -->
4. The system SHALL exibir o rodapé com fundo `#15181E`, como no protótipo. <!-- UI-02 -->
5. The system SHALL renderizar de forma estática a casca das páginas com dados (o componente da página não é assíncrono) e carregar a parte com dados dentro de `<Suspense>`, para a navegação ser instantânea. <!-- UI-03 -->
6. The system SHALL exibir `cursor: pointer` em todo botão e `cursor: not-allowed` quando o botão estiver desabilitado. <!-- UI-04 -->
7. The system SHALL atingir paridade ≥ 95% com o protótipo aprovado (desktop 1440 px e celular 390 px), medida pela rubrica `paridade/rubrica.md` por um verificador independente; divergências intencionais ficam listadas à parte. <!-- PAR-01 -->
8. The system SHALL exibir o cargo com o gênero informado pela Câmara (`siglaSexo` do deputados.csv), a UF por extenso e o nome do partido com a sigla. <!-- PAR-02 -->
9. The system SHALL exibir em cada votação a proposição principal (ex.: "PL 1234/2026", de votacoesObjetos) com a ementa e o resultado. <!-- PAR-03 -->
10. WHEN o usuário escolhe "Mandato todo" THEN the system SHALL somar a CEAP de todos os anos coletados e mostrar uma barra por ano. <!-- PAR-04 -->
11. The system SHALL oferecer "Baixar CSV" com as notas da CEAP do deputado no período, só com campos já minimizados na coleta (AD-002). <!-- PAR-05 -->
12. The system SHALL oferecer "Acompanhar atualizações" como feed Atom público por deputado, sem cadastro nem e-mail. <!-- PAR-06 -->
13. The system SHALL marcar a aba de seção da parte visível do perfil, e as abas Mandato e Fontes levam às seções da lateral. <!-- PAR-07 -->
14. WHILE a largura é de celular the system SHALL mostrar o topo com botões "Buscar" e "Menu", indicadores 2×2 e o resumo (4 tipos de despesa, 3 votações, links "Ver todas as notas e fornecedores" e "Ver as N votações"). <!-- PAR-08 -->

**Independent Test**: no seed, a lateral mostra "Comissão de Finanças e Tributação"; o item "Parlamentares" fica sublinhado no perfil; `/metodologia` mostra "Versão 1.0.".

---

### P1: Acessibilidade (WCAG 2.1 AA)

**User Story**: As a pessoa que usa leitor de tela, teclado, zoom ou tela pequena, I want usar todo o Auditaja so that a auditoria pública seja de fato pública.

**Why P1**: Plataforma cívica; acessibilidade é requisito de publicação.

**Acceptance Criteria**:

1. The system SHALL não ter violações axe-core das regras `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa` e `best-practice` em nenhuma página, em desktop e em 390 px. <!-- A11Y-01 -->
2. WHEN a janela tem 320 px de largura THEN the system SHALL não ter rolagem horizontal (`scrollWidth` ≤ 320) no perfil, na lista, em fontes e no formulário de correção. <!-- A11Y-02 -->
3. WHEN um elemento recebe foco pelo teclado THEN the system SHALL mostrar contorno sólido de 2 px na cor `#1F4FD1` (branco no rodapé escuro). <!-- A11Y-03 -->
4. IF o servidor recusa o pedido de correção THEN the system SHALL marcar o campo com `aria-invalid="true"` e ligá-lo à mensagem de erro por `aria-describedby`. <!-- A11Y-04 -->
5. WHEN o voto diverge da orientação THEN the system SHALL anunciar "(divergiu da orientação)" em texto, além da cor. <!-- A11Y-05 -->
6. The system SHALL desenhar a borda dos campos de formulário em `#80858E` (contraste ≥ 3:1 com fundo branco e com `#F6F6F3`). <!-- A11Y-06 -->

**Independent Test**: `tests/e2e/a11y.spec.ts` roda o axe em 12 rotas e confere reflow, foco, erro e divergência.

---

### P1: Pedir correção ⭐ MVP

**User Story**: As a parlamentar, assessoria ou cidadão, I want pedir a correção de um dado so that erros sejam corrigidos (R6).

**Why P1**: R6 exige canal de contestação desde o lançamento.

**Acceptance Criteria**:

1. WHEN o usuário envia descrição com 20 a 4000 caracteres THEN the system SHALL gravar o pedido com status "recebido" e mostrar "Pedido recebido.". <!-- CORR-01 -->
2. IF a descrição tem menos de 20 caracteres THEN the system SHALL não gravar e mostrar "Descreva o erro com pelo menos 20 caracteres.". <!-- CORR-02 -->
3. WHEN o link "Contestar" de uma seção é seguido THEN the system SHALL pré-selecionar essa seção no formulário. <!-- CORR-03 -->

**Independent Test**: enviar um pedido no seed e ver "Pedido recebido.".

---

### P1: Coleta não invasiva ⭐ MVP

**User Story**: As a operador do Auditaja, I want coletores que respeitem os sites públicos so that a coleta seja legal (R7) e não sobrecarregue os órgãos.

**Why P1**: Sem coleta não há dado; sem R7 não há coleta legítima.

**Acceptance Criteria**:

1. The system SHALL enviar em toda requisição o User-Agent `Auditaja/<versão> (+<URL de contato>; ...)`. <!-- COLETA-01 -->
2. WHEN um host é acessado pela primeira vez THEN the system SHALL ler `/robots.txt` e recusar caminhos proibidos com `ColetaBloqueada`. <!-- COLETA-02 -->
3. IF `/robots.txt` responde 5xx ou falha de rede THEN the system SHALL bloquear todo o host; IF responde 4xx ou HTML THEN the system SHALL permitir. <!-- COLETA-03 -->
4. The system SHALL esperar entre requisições ao mesmo host o maior valor entre 1 s e o `Crawl-delay`. <!-- COLETA-04 -->
5. IF a resposta é 429 ou 5xx THEN the system SHALL repetir até 4 tentativas, esperando `Retry-After` quando houver ou 2 s, 4 s, 8 s. <!-- COLETA-05 -->
6. IF a resposta é 401 ou 403 THEN the system SHALL parar com `ColetaBloqueada`, sem nova tentativa. <!-- COLETA-06 -->
7. WHEN o mesmo ano é coletado de novo THEN the system SHALL substituir os registros daquele ano em uma transação, sem duplicar. <!-- COLETA-07 -->
8. The system SHALL guardar só votações que têm votos nominais, sem votos ou orientações duplicados. <!-- COLETA-08 -->

**Independent Test**: testes do `ClienteEducado` com `fetch` falso cobrem robots, intervalo, backoff e bloqueio.

---

## Edge Cases

- IF o id do perfil não é numérico ou não existe THEN the system SHALL mostrar "Página não encontrada" com meta `noindex`. <!-- EDGE-01 -->
- IF o deputado não tem despesas no ano THEN the system SHALL mostrar "Nenhuma despesa publicada para {ano}.". <!-- EDGE-02 -->
- IF o deputado não tem bens casados THEN the system SHALL mostrar a mensagem de ausência e "—" no indicador. <!-- EDGE-03 -->
- WHEN a tela tem 390 px de largura THEN the system SHALL não ter rolagem horizontal na página (`scrollWidth` ≤ largura da janela). <!-- EDGE-04 -->
- IF o seed é executado contra banco cujo nome não termina em `_test` THEN the system SHALL recusar e sair com código 1. <!-- EDGE-05 -->

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| BUSCA-01 | P1: Encontrar um deputado | Tasks | Verified |
| BUSCA-02 | P1: Encontrar um deputado | Tasks | Verified |
| BUSCA-03 | P1: Encontrar um deputado | Tasks | Verified |
| BUSCA-04 | P1: Encontrar um deputado | Tasks | Verified |
| BUSCA-05 | P1: Encontrar um deputado | Tasks | Verified |
| CEAP-01 | P1: Ver gastos da cota | Tasks | Verified |
| CEAP-02 | P1: Ver gastos da cota | Tasks | Verified |
| CEAP-03 | P1: Ver gastos da cota | Tasks | Verified |
| CEAP-04 | P1: Ver gastos da cota | Tasks | Verified |
| CEAP-05 | P1: Ver gastos da cota | Tasks | Verified |
| CEAP-06 | P1: Ver gastos da cota | Tasks | Implemented |
| VOTO-01 | P1: Ver votações e alinhamento | Tasks | Verified |
| VOTO-02 | P1: Ver votações e alinhamento | Tasks | Verified |
| VOTO-03 | P1: Ver votações e alinhamento | Tasks | Verified |
| VOTO-04 | P1: Ver votações e alinhamento | Tasks | Verified |
| VOTO-05 | P1: Ver votações e alinhamento | Tasks | Verified |
| VOTO-07 | P1: Ver votações e alinhamento | Tasks | Verified |
| VOTO-08 | P1: Ver votações e alinhamento | Tasks | Implemented |
| VOTO-06 | P1: Ver votações e alinhamento | Tasks | Verified |
| PRES-01 | P1: Ver votações e alinhamento | Tasks | Implemented |
| PRES-02 | P1: Ver votações e alinhamento | Tasks | Implemented |
| PRES-03 | P1: Ver votações e alinhamento | Tasks | Implemented |
| PRES-04 | P1: Ver votações e alinhamento | Tasks | Implemented |
| PRES-05 | P1: Ver votações e alinhamento | Tasks | Implemented |
| BENS-01 | P1: Ver bens declarados | Tasks | Verified |
| BENS-02 | P1: Ver bens declarados | Tasks | Verified |
| BENS-03 | P1: Ver bens declarados | Tasks | Verified |
| BENS-04 | P1: Ver bens declarados | Tasks | Verified |
| PROV-01 | P1: Proveniência e privacidade | Tasks | Verified |
| PROV-02 | P1: Proveniência e privacidade | Tasks | Verified |
| PRIV-01 | P1: Proveniência e privacidade | Tasks | Verified |
| PRIV-02 | P1: Proveniência e privacidade | Tasks | Verified |
| PRIV-03 | P1: Proveniência e privacidade | Tasks | Verified |
| PRIV-04 | P1: Proveniência e privacidade | Tasks | Verified |
| PRIV-05 | P1: Proveniência e privacidade | Tasks | Verified |
| PRIV-06 | P1: Proveniência e privacidade | Tasks | Implementing |
| PRIV-07 | P1: Proveniência e privacidade | Tasks | Implementing |
| MAND-01 | P2: Contexto do mandato | Tasks | Verified |
| METOD-01 | P2: Contexto do mandato | Tasks | Verified |
| NAV-01 | P2: Contexto do mandato | Tasks | Verified |
| UI-02 | P2: Contexto do mandato | Tasks | Verified |
| UI-04 | P2: Contexto do mandato | Tasks | Verified |
| PAR-01 | P2: Contexto do mandato | T29 | Implemented |
| PAR-02 | P2: Contexto do mandato | T29 | Implemented |
| PAR-03 | P2: Contexto do mandato | T29 | Implemented |
| PAR-04 | P2: Contexto do mandato | T29 | Implemented |
| PAR-05 | P2: Contexto do mandato | T29 | Implemented |
| PAR-06 | P2: Contexto do mandato | T29 | Implemented |
| PAR-07 | P2: Contexto do mandato | T29 | Implemented |
| PAR-08 | P2: Contexto do mandato | T29 | Implemented |
| UI-03 | P2: Contexto do mandato | Tasks | Needs Fix |
| A11Y-01 | P1: Acessibilidade | Tasks | Implementing |
| A11Y-02 | P1: Acessibilidade | Tasks | Implementing |
| A11Y-03 | P1: Acessibilidade | Tasks | Implementing |
| A11Y-04 | P1: Acessibilidade | Tasks | Implementing |
| A11Y-05 | P1: Acessibilidade | Tasks | Implementing |
| A11Y-06 | P1: Acessibilidade | Tasks | Implementing |
| CORR-01 | P1: Pedir correção | Tasks | Verified |
| CORR-02 | P1: Pedir correção | Tasks | Verified |
| CORR-03 | P1: Pedir correção | Tasks | Verified |
| COLETA-01 | P1: Coleta não invasiva | Tasks | Verified |
| COLETA-02 | P1: Coleta não invasiva | Tasks | Verified |
| COLETA-03 | P1: Coleta não invasiva | Tasks | Verified |
| COLETA-04 | P1: Coleta não invasiva | Tasks | Verified |
| COLETA-05 | P1: Coleta não invasiva | Tasks | Verified |
| COLETA-06 | P1: Coleta não invasiva | Tasks | Verified |
| COLETA-07 | P1: Coleta não invasiva | Tasks | Verified |
| COLETA-08 | P1: Coleta não invasiva | Tasks | Verified |
| EDGE-01 | Edge cases | Tasks | Verified |
| EDGE-02 | Edge cases | Tasks | Verified |
| EDGE-03 | Edge cases | Tasks | Verified |
| EDGE-04 | Edge cases | Tasks | Verified |
| EDGE-05 | Edge cases | Tasks | Verified |

**Coverage:** 58 total, 58 mapped to tasks, 0 unmapped.

---

## Success Criteria

- [ ] Gate completo (lint, typecheck, format, Vitest, build, Playwright) passa sem falhas.
- [ ] Verifier independente marca PASS em `validation.md`, com evidência `file:line` por critério.
- [ ] Zero CPF completo de terceiro em `despesa_ceap` após a coleta real (`fornecedor_doc` sem 11 dígitos seguidos).
