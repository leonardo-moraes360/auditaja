# Emendas parlamentares e sanções do Portal da Transparência Specification

> Proposta visual aprovada pelo usuário em 2026-11-11: artboard `Emendas.dc.html` no canvas do protótipo (https://claude.ai/artifact/QNug9fqzWeEMCm1avxeTBi). Fonte única: download em lote do Portal da Transparência (CGU), sem token da API.

## Problem Statement

O perfil do deputado mostra a cota, as votações e os bens, mas não mostra a parte do Orçamento da União que ele indica por emendas, que soma dezenas de milhões de reais por mandato. Também não diz se algum fornecedor pago com a cota tem sanção registrada nos cadastros oficiais da CGU. Os dois dados são públicos no Portal da Transparência, em arquivos grandes e sem ligação com o cadastro da Câmara.

## Goals

- [ ] O perfil de um deputado com emendas individuais na 57ª legislatura mostra empenhado, pago, transferências especiais, série por ano, áreas, locais e favorecidos, com fonte e data da base (R1).
- [ ] Nenhum nome ou CPF completo de favorecido pessoa física é gravado no banco (R3, AD-002).
- [ ] Fornecedores da cota com sanção no CEIS ou no CNEP aparecem marcados, com texto factual e datas, sem linguagem de acusação (R4).
- [ ] A coleta baixa cada arquivo uma única vez por execução, pelo `ClienteEducado`, sem passar pelo host com captcha (R7, AD-001).

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| API do Portal da Transparência (token) | Decisão do usuário pendente; o lote cobre a entrega. |
| Emendas de bancada e de comissão | Autoria coletiva: não pertencem a um deputado. |
| Arquivo de convênios (`EmendasParlamentares_Convenios.csv`) | Não aparece na proposta aprovada. |
| Senadores como autores de emenda | Senado é outra frente do projeto. |
| Coleta agendada e CI | Decisão do usuário: ficam para o fim do projeto. |
| Sanções de pessoa física (CEIS/CNEP tipo F) | Fornecedor PF da cota é gravado mascarado; não há como cruzar, e a R3 proíbe. |
| Página de detalhe de cada sanção no Portal | O host principal do Portal usa captcha; o link aponta para a página de download da base. |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| URL de download | Direto em `https://dadosabertos-download.cgu.gov.br/PortalDaTransparencia/saida/...`, destino do 302 de `/download-de-dados/...` | O host `portaldatransparencia.gov.br` responde com captcha até no `robots.txt`; não contornamos captcha, e o servidor de arquivos é o destino oficial do download | y |
| robots.txt do servidor de arquivos | 403 do S3 é tratado como arquivo ausente (permite) | Regra já existente no `ClienteEducado` para 4xx (RFC 9309 §2.3.1.3) | n |
| Período do mandato | Emendas com "Ano da Emenda" de 2024 em diante | Emendas ao orçamento de 2023 foram apresentadas em 2022, pela legislatura anterior | n |
| Ligação autor ↔ deputado | Nome do autor normalizado (`normalizarNome`) igual ao nome parlamentar de exatamente um deputado da base | O CSV não traz id da Câmara nem CPF; medido em 2026-11-11: 566 nomes casam, 0 homônimos | n |
| Valor pago | `Valor Pago` + `Valor Restos A Pagar Pagos` | Restos a pagar pagos são pagamento da mesma emenda em anos seguintes | n |
| Transferência especial | `Tipo de Emenda` igual a "Emenda Individual - Transferências Especiais" | Nome oficial das "emendas Pix" no arquivo | y |
| Favorecido pessoa física | Nome trocado por "Beneficiário pessoa física"; documento só se já vier mascarado no padrão `***.ddd.ddd-**` | AD-002 e R3 | y |
| Favorecido sem documento válido ("Sem informação", "Inválido", "Inscrição Genérica") | Mantém o nome publicado e grava documento nulo (exibido "—") | Não são pessoas físicas identificáveis | n |
| Sanção exibida | Só sanções de pessoa jurídica cujo CNPJ aparece em `despesa_ceap`; todas as datas de fim, inclusive já encerradas | Minimização (R2) e transparência sobre histórico | n |
| Nota "dentro do período" | `data_emissao` entre início e fim da sanção, inclusive; fim nulo = sem prazo | Definição objetiva e verificável | n |
| Arquivo de sanções do dia | Tenta a data de hoje (fuso de Brasília) e volta um dia por vez até 7 dias atrás (8 datas); só 404 passa para a data anterior | O arquivo leva a data de geração e pode não existir ainda de manhã | n |
| Rótulo de localidade | "MUNICÍPIO - UF" vira "Município (UF)"; "NOME (UF)" vira "Nome (UF)"; demais em caixa de título | Igual à proposta aprovada | n |
| Localidade "MÚLTIPLO" | Fica fora da lista de locais e aparece numa frase com valor e percentual | Nas bases de 11/11/2026, 79% do empenhado individual desde 2024 vem como "MÚLTIPLO"; listá-la como local não informa nada | n |
| Data da base | `coleta.observacao` guarda "base de DD/MM/AAAA": data da entrada `EmendasParlamentares.csv` no ZIP, ou a data do nome do arquivo CEIS/CNEP | O artboard mostra "base de" no rodapé e na nota do cruzamento | n |
| Coluna "Tipo" dos favorecidos | Natureza jurídica publicada pelo Portal ("Município", "Associação Privada"…); sem ela, o tipo do favorecido ("Pessoa física") | As categorias do artboard ("Fundo municipal", "Empresa") não existem na fonte; inventar um mapeamento seria dado nosso, não do Portal | n |
| Detalhe das transferências especiais | "vão direto ao caixa de estados e municípios, sem objeto definido" | O artboard dizia "do município"; a transferência especial também vai a estados (CF, art. 166-A) | n |
| Bloco "Como ligamos" | Sem "até a conferência manual" e com link para a metodologia | Não existe processo de conferência manual; prometer um seria falso | n |
| Órgão no aviso de sanção | "{categoria} {período}. Órgão sancionador: {órgão}." | O artboard dizia "aplicado pelo"; a concordância muda com a categoria ("Multa", "Impedimento") e com o órgão, e a fonte não traz gênero | n |
| Link de notas no aviso | "Ver a nota" / "Ver as N notas", com N = notas dentro do período da sanção; baixa `gastos.csv` filtrado por `de`/`ate`; sem nota no período, sem link | Igual ao artboard ("Ver as 4 notas") | n |
| Filtro da seção | `?emendas=AAAA` ou `?emendas=mandato`; padrão "mandato"; botões para os dois anos mais recentes com emenda | Proposta aprovada destaca "Mandato todo"; parâmetro próprio para não colidir com `?ano=` da cota | n |
| Versão da metodologia | Sobe para 1.5 (a 1.4 é da frente de presença, PR #6) | Nova regra pública de cruzamento | n |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Coletar emendas em lote ⭐ MVP

**User Story**: As a mantenedor, I want rodar `pnpm ingest emendas` so that o banco tenha as emendas individuais e os favorecidos dos deputados da base.

**Why P1**: Sem dado não há seção.

**Acceptance Criteria**:

1. WHEN `pnpm ingest emendas` roda THEN the system SHALL baixar `EmendasParlamentares.zip` uma única vez, pelo `ClienteEducado`, da URL do servidor de arquivos da CGU. <!-- EMD-01 -->
2. WHEN o arquivo é baixado THEN the system SHALL registrar uma linha em `coleta` com fonte `cgu_emendas`, URL, SHA-256, bytes e licença. <!-- EMD-02 -->
3. The system SHALL gravar só linhas de `EmendasParlamentares.csv` com "Ano da Emenda" ≥ 2024 e tipo começando por "Emenda Individual". <!-- EMD-03 -->
4. WHEN o nome normalizado do autor é igual ao nome parlamentar normalizado de exatamente um deputado THEN the system SHALL gravar a emenda com o `parlamentar_id` desse deputado. <!-- EMD-04 -->
5. IF o nome do autor casa com zero ou com mais de um deputado THEN the system SHALL descartar as linhas desse autor e contar o descarte no resumo impresso. <!-- EMD-05 -->
6. The system SHALL converter valores "1.234,56" em número decimal exato (1234.56) nos campos empenhado, liquidado, pago e restos a pagar pagos. <!-- EMD-06 -->
7. WHEN uma linha de `EmendasParlamentares_PorFavorecido.csv` pertence a uma emenda gravada THEN the system SHALL gravar o favorecido, o tipo, a UF, o município, o ano/mês e o valor recebido. <!-- EMD-07 -->
8. IF o favorecido é do tipo "Pessoa Fisica" THEN the system SHALL gravar o nome "Beneficiário pessoa física" e o documento só no formato `***.ddd.ddd-**`, ou nulo. <!-- EMD-08 -->
9. IF o documento do favorecido tem 14 dígitos THEN the system SHALL gravá-lo formatado como CNPJ. <!-- EMD-09 -->
10. WHEN a coleta roda de novo THEN the system SHALL substituir todas as emendas e favorecidos anteriores numa única transação, sem duplicar linhas. <!-- EMD-10 -->
11. The system SHALL ler o CSV de favorecidos em streaming (latin1, `;`), sem carregar o arquivo inteiro descompactado na memória. <!-- EMD-11 -->

**Independent Test**: com um ZIP de fixture em latin1 servido por `fetch` falso, rodar a coleta no banco de teste e conferir emendas, favorecidos, máscara de PF e descarte de homônimo.

---

### P1: Ver as emendas no perfil ⭐ MVP

**User Story**: As a cidadão, I want ver no perfil do deputado quanto ele indicou em emendas, quanto foi pago e para onde foi so that eu acompanhe o uso do Orçamento.

**Why P1**: É o objetivo da entrega.

**Acceptance Criteria**:

1. The system SHALL mostrar a aba "Emendas" entre "Gastos da cota" e "Votações", apontando para a seção `#emendas`. <!-- EMDUI-01 -->
2. The system SHALL mostrar a seção com título de nível 2 "Emendas parlamentares individuais" depois da seção de gastos e antes da de votações. <!-- EMDUI-02 -->
3. WHILE o período é "mandato" the system SHALL somar todas as emendas gravadas do deputado e marcar o link "Mandato todo" com `aria-current="page"`. <!-- EMDUI-03 -->
4. WHEN o usuário escolhe um ano THEN the system SHALL abrir `?emendas=AAAA#emendas` e somar só as emendas desse "Ano da Emenda". <!-- EMDUI-04 -->
5. The system SHALL mostrar o indicador "Empenhado" com a soma do empenhado em reais compactos e a quantidade de emendas distintas pelo código. <!-- EMDUI-05 -->
6. The system SHALL mostrar o indicador "Pago até agora" com a soma de pago e restos a pagar pagos, e o percentual arredondado sobre o empenhado. <!-- EMDUI-06 -->
7. The system SHALL mostrar o indicador "Transferências especiais (“emendas Pix”)" com a soma do empenhado desse tipo e o percentual sobre o empenhado total. <!-- EMDUI-07 -->
8. WHILE o período é "mandato" the system SHALL mostrar um gráfico de barras com empenhado e pago por "Ano da Emenda", com rótulo acessível que cita os anos. <!-- EMDUI-08 -->
9. The system SHALL listar as 5 áreas ("Nome Função") de maior empenhado, com valor e percentual sobre o total. <!-- EMDUI-09 -->
10. The system SHALL listar os 5 locais de aplicação de maior empenhado, sem a localidade "MÚLTIPLO", com o rótulo formatado conforme as Assumptions, e informar abaixo o valor e o percentual do empenhado marcado como "Múltiplo". <!-- EMDUI-10 -->
11. The system SHALL listar até 5 favorecidos de maior valor recebido nas emendas do período, com nome, documento, tipo, município e valor. <!-- EMDUI-11 -->
12. The system SHALL mostrar no rodapé da seção, no desktop, "Fonte: Portal da Transparência (CGU), Emendas Parlamentares, download em lote · base de DD/MM/AAAA" e a data da coleta, com links "Ver no Portal", "Baixar CSV" e "Contestar"; no celular, o rodapé curto das outras seções ("Fonte: Portal da Transparência, emendas · coletado em DD/MM/AAAA · ver original"). <!-- EMDUI-12 -->
13. IF o deputado não tem emenda gravada THEN the system SHALL mostrar na seção a frase "Nenhuma emenda individual deste deputado foi encontrada no Portal da Transparência a partir do orçamento de 2024." e omitir indicadores, gráfico e listas. <!-- EMDUI-13 -->
14. IF `?emendas=` traz valor que não é "mandato" nem um ano com emenda do deputado THEN the system SHALL usar o período "mandato". <!-- EMDUI-14 -->
15. WHEN o usuário abre "Baixar CSV" THEN the system SHALL devolver `text/csv` com uma linha por emenda e local de aplicação do período, como o Portal publica (código, ano, tipo, local, área, empenhado, liquidado, pago, restos pagos). <!-- EMDUI-15 -->

**Independent Test**: com o banco de teste semeado, abrir `/parlamentares/{id}`, conferir valores dos indicadores, trocar para um ano e conferir as somas; abrir um deputado sem emendas e ver a frase de vazio.

---

### P2: Marcar fornecedor da cota com sanção

**User Story**: As a cidadão, I want saber se um fornecedor pago com a cota tem sanção no CEIS ou no CNEP so that eu possa conferir o registro oficial.

**Why P2**: Cruzamento útil, mas a seção de emendas se sustenta sozinha.

**Acceptance Criteria**:

1. WHEN `pnpm ingest sancoes` roda THEN the system SHALL baixar os arquivos CEIS e CNEP mais recentes (até 7 dias atrás) e registrar cada um em `coleta` com fontes `cgu_ceis` e `cgu_cnep`. <!-- SAN-01 -->
2. The system SHALL gravar só sanções de tipo de pessoa "J" cujo CNPJ aparece em `despesa_ceap`. <!-- SAN-02 -->
3. WHEN a coleta de sanções roda de novo THEN the system SHALL substituir as sanções do mesmo cadastro numa transação. <!-- SAN-03 -->
4. WHEN um fornecedor listado em "Maiores fornecedores" tem sanção gravada THEN the system SHALL mostrar ao lado do nome o selo "Sanção no CEIS" ou "Sanção no CNEP". <!-- SAN-04 -->
5. WHEN um fornecedor listado tem sanção THEN the system SHALL mostrar um aviso com título "{fornecedor} tem sanção registrada no {cadastro}", categoria, período, órgão sancionador e quantas notas do período exibido têm data dentro do período da sanção. <!-- SAN-05 -->
6. The system SHALL incluir no aviso a frase "O registro é do cadastro oficial da CGU e não indica irregularidade do parlamentar." <!-- SAN-06 -->
7. IF a sanção não tem data final THEN the system SHALL escrever "sem data final" no período. <!-- SAN-07 -->

**Independent Test**: semear uma sanção para um CNPJ de fornecedor do deputado de teste e ver selo e aviso com contagem correta.

---

### P2: Metodologia e fontes

**User Story**: As a cidadão, I want ler como a emenda é ligada ao deputado e como o cruzamento de sanções é feito so that eu confie no número.

**Acceptance Criteria**:

1. The system SHALL mostrar `METODOLOGIA_VERSAO` igual a "1.5". <!-- MET-01 -->
2. The system SHALL ter na página `/metodologia` uma seção "Emendas parlamentares" com a regra de ligação por nome, o período a partir de 2024 e a definição de pago. <!-- MET-02 -->
3. The system SHALL ter na página `/metodologia` uma seção "Sanções de fornecedores" com a regra de cruzamento por CNPJ e a de nota dentro do período. <!-- MET-03 -->
4. The system SHALL listar no bloco "De onde vêm os dados" do perfil as fontes "Portal da Transparência · Emendas (lote)" e "Portal da Transparência · CEIS e CNEP (lote)". <!-- MET-04 -->
5. The system SHALL mostrar na lateral do perfil o bloco "Como ligamos a emenda ao deputado" com a regra de homônimos. <!-- MET-05 -->

---

## Edge Cases

- IF o servidor de arquivos responde 401 ou 403 ao arquivo THEN the system SHALL encerrar a coleta com `ColetaBloqueada` sem gravar nada. <!-- EDGE-01 -->
- IF nenhum arquivo de sanção existe nos últimos 7 dias THEN the system SHALL encerrar a coleta de sanções com erro e manter as sanções anteriores. <!-- EDGE-02 -->
- IF um valor monetário vem vazio THEN the system SHALL gravá-lo como 0. <!-- EDGE-03 -->
- WHEN o empenhado do período é 0 THEN the system SHALL mostrar "—" no detalhe do indicador "Pago até agora", omitir a barra de progresso e escrever "— do empenhado" no indicador de transferências especiais. <!-- EDGE-04 -->
- WHEN a seção é vista a 320 px de largura THEN the system SHALL não ter rolagem horizontal da página; a tabela de favorecidos rola dentro da própria caixa. <!-- EDGE-05 -->

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| EMD-01 | P1: Coletar emendas | Tasks | Implementing |
| EMD-02 | P1: Coletar emendas | Tasks | Implementing |
| EMD-03 | P1: Coletar emendas | Tasks | Implementing |
| EMD-04 | P1: Coletar emendas | Tasks | Implementing |
| EMD-05 | P1: Coletar emendas | Tasks | Implementing |
| EMD-06 | P1: Coletar emendas | Tasks | Implementing |
| EMD-07 | P1: Coletar emendas | Tasks | Implementing |
| EMD-08 | P1: Coletar emendas | Tasks | Implementing |
| EMD-09 | P1: Coletar emendas | Tasks | Implementing |
| EMD-10 | P1: Coletar emendas | Tasks | Implementing |
| EMD-11 | P1: Coletar emendas | Tasks | Implementing |
| EMDUI-01 | P1: Ver as emendas | Tasks | Implementing |
| EMDUI-02 | P1: Ver as emendas | Tasks | Implementing |
| EMDUI-03 | P1: Ver as emendas | Tasks | Implementing |
| EMDUI-04 | P1: Ver as emendas | Tasks | Implementing |
| EMDUI-05 | P1: Ver as emendas | Tasks | Implementing |
| EMDUI-06 | P1: Ver as emendas | Tasks | Implementing |
| EMDUI-07 | P1: Ver as emendas | Tasks | Implementing |
| EMDUI-08 | P1: Ver as emendas | Tasks | Implementing |
| EMDUI-09 | P1: Ver as emendas | Tasks | Implementing |
| EMDUI-10 | P1: Ver as emendas | Tasks | Implementing |
| EMDUI-11 | P1: Ver as emendas | Tasks | Implementing |
| EMDUI-12 | P1: Ver as emendas | Tasks | Implementing |
| EMDUI-13 | P1: Ver as emendas | Tasks | Implementing |
| EMDUI-14 | P1: Ver as emendas | Tasks | Implementing |
| EMDUI-15 | P1: Ver as emendas | Tasks | Implementing |
| SAN-01 | P2: Sanção de fornecedor | Tasks | Implementing |
| SAN-02 | P2: Sanção de fornecedor | Tasks | Implementing |
| SAN-03 | P2: Sanção de fornecedor | Tasks | Implementing |
| SAN-04 | P2: Sanção de fornecedor | Tasks | Implementing |
| SAN-05 | P2: Sanção de fornecedor | Tasks | Implementing |
| SAN-06 | P2: Sanção de fornecedor | Tasks | Implementing |
| SAN-07 | P2: Sanção de fornecedor | Tasks | Implementing |
| MET-01 | P2: Metodologia e fontes | Tasks | Implementing |
| MET-02 | P2: Metodologia e fontes | Tasks | Implementing |
| MET-03 | P2: Metodologia e fontes | Tasks | Implementing |
| MET-04 | P2: Metodologia e fontes | Tasks | Implementing |
| MET-05 | P2: Metodologia e fontes | Tasks | Implementing |
| EDGE-01 | Edge cases | Tasks | Implementing |
| EDGE-02 | Edge cases | Tasks | Implementing |
| EDGE-03 | Edge cases | Tasks | Implementing |
| EDGE-04 | Edge cases | Tasks | Implementing |
| EDGE-05 | Edge cases | Tasks | Implementing |

**Coverage:** 43 total, 43 mapped to tasks, 0 unmapped.

---

## Success Criteria

- [ ] `pnpm ingest emendas` e `pnpm ingest sancoes` rodam contra as bases reais de 11/11/2026 sem erro e com no máximo uma requisição por arquivo.
- [ ] Verificação adversarial independente com paridade ≥ 95% contra o artboard aprovado.
- [ ] `pnpm test`, `pnpm build`, `pnpm lint`, `pnpm typecheck` e o e2e com axe passam.
