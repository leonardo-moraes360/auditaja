# Seguir o dinheiro das emendas Specification

> Decisões D1, D3 e D4 tomadas pelo usuário em 2026-11-12. Proposta visual: artboards `SeguirDinheiro.dc.html` (desktop, aprovado pelo usuário em 2026-11-12) e `SeguirDinheiroMobile.dc.html` (celular, aprovado em 2026-11-12) no canvas do protótipo (https://claude.ai/artifact/QNug9fqzWeEMCm1avxeTBi, y=19460). Referências: vídeo "ep 1: grafos" (`pesquisa/2026-11-12-video-rastro-dinheiro-grafos.md`) e transcrição do ep. 3 colada pelo usuário em 2026-11-12 (vazamento temporal, cofre com impressão digital, denominador honesto, erro do próprio método). Proposta visual: a fazer no canvas do protótipo depois das decisões.

## Problem Statement

O perfil já mostra, em blocos separados, a cota, as emendas com seus favorecidos e as sanções. O cidadão não consegue ver o caminho seguinte: quem recebeu o dinheiro da emenda, que empresa o favorecido pagou com ele, há quanto tempo essa empresa existe e se ela também aparece na campanha de quem indicou a emenda. Cada elo está numa base pública diferente (Portal da Transparência, Transferegov, Receita, TSE) e hoje nenhuma ligação entre elas é feita.

Medido no banco local em 2026-11-12: R$ 66,5 bi em favorecidos de emendas (2020–2026, 633 parlamentares). R$ 45,3 bi vão a municípios e fundos municipais, R$ 3,5 bi a associações privadas e R$ 1,7 bi direto a 9.874 empresas (LTDA, EI, S.A. fechada).

## Goals

- [ ] Para cada emenda individual do parlamentar, o perfil mostra a trilha até onde a fonte oficial permite: emenda, favorecido, e (quando houver) as empresas pagas pelo favorecido com aquele recurso, sempre com fonte e data por elo (R1).
- [ ] Toda ligação entre bases é feita por identificador (CNPJ, código da emenda, número do plano de ação, `sq_candidato`), nunca por nome.
- [ ] Os sinais "empresa recém-aberta" e "ciclo fechado" aparecem como indício, com regra e limiar publicados na metodologia e a frase de não imputação (R4).
- [ ] Nenhum dado de pessoa física terceira (sócio, doador, fornecedor PF) é gravado nem cruzado (R3, AD-002).

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Banco de grafos, Parquet/DuckDB, travessia de 3–5 saltos | O Postgres atual cobre 2 saltos com junções; o vídeo usa outra arquitetura para outro produto (fichas agregadas, sem nomes). |
| Sinais probabilísticos (modelo) e nota por executor | R4 pede regra pública e versionada; modelo com pesos secretos não cumpre. |
| Cruzar sócio PF da empresa com doador PF de campanha | R3 proíbe cruzar ou enriquecer CPF de terceiro, e o QSA só traz CPF mascarado. |
| Quadro societário (QSA), inclusive o caso do sócio ser o próprio parlamentar | R3 e R2 para sócio PF; e o lote da Receita não pode ser coletado por robô (ver abaixo). |
| Download automático do lote CNPJ da Receita (inclusive scripts como `receita-federal-cnpj-downloader`) | `arquivos.receitafederal.gov.br/robots.txt` responde `Disallow: /` (conferido em 2026-11-12); a R7 proíbe coletar por robô. O arquivo entra só por download humano e importação local (D1). |
| Contratos do PNCP ligados à emenda | O PNCP não diz com que recurso o contrato foi pago; ligar "município recebeu emenda" a "município contratou empresa" seria coincidência de órgão, não trilha do dinheiro. Fica como ideia adiada. |
| Doações de pessoa jurídica | Proibidas desde 2015 (STF, ADI 4650); não existem nas bases do TSE de 2016 em diante. |
| Grupos que se movem juntos (fracionamento entre entidades) | Exige modelo de janela e similaridade; fica para uma segunda versão, depois de medir. |
| Emendas de bancada e de comissão | Autoria coletiva; já fora do perfil hoje. |
| Envio de representação ao Ministério Público | O Auditaja aponta indício; quem decide é o cidadão ou o órgão. |
| Busca ou página por CNPJ com indícios | A empresa é terceiro, não agente público: o indício só aparece no perfil do parlamentar que indicou a emenda. Uma consulta por CNPJ também ensinaria a regra a quem quer escapar dela (ep. 3). |
| Painel de indícios por estado, Casa ou partido | Ranking agregado pede denominador e amostra mínima que ainda não medimos; partido em período eleitoral pede a R8. Ideia adiada. |
| Modelo nulo, teste de acaso e correção por múltiplos testes | Servem a sinais estatísticos; os sinais da v1 são regras determinísticas. A taxa de base (LING-07) cumpre o papel de contexto. |
| Situação cadastral (baixada, inapta) como sinal | O lote da Receita traz a situação de hoje, não a da data do pagamento; usá-la seria vazamento temporal (ep. 3). |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| D1. Fonte da data de abertura do CNPJ | O usuário baixa à mão pelo navegador o lote mensal "Estabelecimentos" da Receita e roda `pnpm ingest receita --arquivo <zip>`; o importador grava só os CNPJs que já estão no banco | robots.txt `Disallow: /` impede coleta por robô (R7); download humano de dado aberto não é coleta automatizada | y (usuário, 2026-11-12) |
| D4. Limiar de "empresa recém-aberta" | Início de atividade menos de 180 dias antes do primeiro pagamento que a empresa recebeu ligado à emenda | O backlog propôs 90 dias para a cota; emenda tem ciclo mais longo (empenho, plano de ação, pagamento). Escolhido pelo usuário | y (usuário, 2026-11-12) |
| D12. Matriz e filial | A data considerada é a do estabelecimento matriz do CNPJ básico (8 primeiros dígitos), não a da filial | Filial nova de empresa antiga daria falso positivo | n |
| D3. Definição de "ciclo fechado" | CNPJ que recebeu dinheiro da emenda (favorecido direto ou fornecedor pago pelo ente com a emenda Pix) e que também aparece como fornecedor PJ nas despesas de campanha do mesmo parlamentar, casado por `sq_candidato` | Doação PJ não existe desde 2015 e doador PF não pode ser cruzado (R3); a ligação permitida é empresa da emenda = empresa da campanha | y (usuário, 2026-11-12) |
| D5. Segundo salto (favorecido → empresa) | Só emendas Pix (transferências especiais), pela API pública do Transferegov: plano de ação (`/planos-acao-especiais`, código da emenda) → relatório de gestão (`/relatorios-gestao-novos-especiais`) → documentos de liquidação (`/relatorios-gestao-documento-liquidacao-especiais`, CNPJ, valor e data do pagamento) | Medido em 12/11/2026: os lançamentos bancários (`gestao-financeira-lancamentos-especiais`, 746.885 linhas) vêm com favorecido mascarado (`***`); os documentos de liquidação (106.333 linhas) trazem o recebedor. Convênios (discricionárias) não têm pagamento na API nova; ficam para depois | n |
| D6. Campos bancários do Transferegov | Nunca gravados (banco, agência, conta) | R2: não são imprescindíveis ao controle social | y (R2) |
| D7. Favorecido PF no segundo salto | Agregado numa linha "Pessoas físicas (N)" com valor, sem nome nem documento | Mesma regra do CPF oculto (migração 0011) | y (regra vigente) |
| D8. Eleição usada no ciclo fechado | A eleição que elegeu o parlamentar para o mandato da emenda (2022 para a 57ª legislatura; 2018 ou 2022 para senador, conforme o mandato) | É a campanha que antecede a indicação | n |
| D9. Onde aparece | Nova seção "Para onde foi o dinheiro" no perfil, dentro do bloco de emendas, com trilha por emenda e os avisos no topo da seção | Mantém o padrão de perfil único; sem página nova | n |
| D10. Coleta do Transferegov | Pelo `ClienteEducado`, paginada, uma página por vez, com cache em `.cache/ingest`; sem `robots.txt` (404) conta como permitido | AD-001, R7. Volume a medir no Design | n |
| D13. Indício calculado na leitura ou congelado | Calculado na leitura, como o padrão atípico; cada aviso cita os `coleta_id` (com SHA-256) de todos os elos usados | Reproduz o cálculo a partir dos arquivos publicados (AD-003) sem tabela nova; congelar histórico de avisos fica para quando houver contestação pública | n |
| D14. Onde fica o CSV da trilha (LING-05) | Rota própria `/parlamentares/{id}/trilha.csv`, ligada pelo "Baixar CSV da trilha" da seção; o CSV de emendas do perfil não muda | Uma linha por elo (recebedor de cada plano) não cabe no CSV de emendas, que é uma linha por emenda | y (Execute, 2026-11-13) |
| D11. Versão da metodologia | Sobe para a próxima livre na data do merge (hoje 1.10 → 1.11) | Regras novas e públicas | n |

**Open questions:** none - D1, D3 e D4 decididos pelo usuário; o resto é padrão registrado acima.

---

## User Stories

### P1: Trilha emenda → favorecido → empresa ⭐ MVP

**User Story**: Como cidadão, quero ver, para cada emenda Pix do parlamentar, quais empresas o município pagou com aquele dinheiro, para saber onde ele terminou.

**Why P1**: É o elo que nenhuma base oficial mostra junto e o que dá sentido aos sinais.

**Acceptance Criteria**:

1. WHEN `pnpm ingest transferegov-pix` roda THEN the system SHALL gravar, para cada plano de ação de emenda Pix de parlamentar da base, os documentos de liquidação informados pelo ente nos relatórios de gestão, com CNPJ do recebedor, valor, data e `coleta_id` (R1). <!-- TRI-01 -->
2. The system SHALL ligar o plano de ação à emenda pelo código da emenda publicado no próprio Transferegov, nunca pelo nome do autor ou do ente. <!-- TRI-02 -->
3. The system SHALL nunca gravar banco, agência, conta, nome nem documento de favorecido pessoa física vindos do Transferegov. <!-- TRI-03 -->
4. WHEN o perfil tem emenda Pix com pagamento coletado THEN the system SHALL mostrar a trilha emenda → ente → empresas pagas, com valor por empresa e link para a fonte de cada elo. <!-- TRI-04 -->
5. WHEN a soma dos pagamentos de um plano é menor que o valor transferido THEN the system SHALL mostrar o saldo como "Sem pagamento registrado: R$ X". <!-- TRI-05 -->
6. IF a API do Transferegov responder erro ou 429 THEN the system SHALL parar a coleta com `ColetaBloqueada`, sem apagar dados da coleta anterior. <!-- TRI-06 -->
7. The system SHALL agregar favorecidos PF do segundo salto numa linha "N pagamentos a pessoas físicas" com o valor somado, sem nome nem documento (texto revisto em 13/11: N conta pagamentos, não pessoas). <!-- TRI-07 -->

**Independent Test**: semear uma emenda Pix com plano, dois pagamentos a PJ e um a PF; o perfil mostra as duas empresas, a linha de PF sem nome e o saldo.

---

### P1: Empresa recém-aberta ⭐ MVP

**User Story**: Como cidadão, quero saber quando uma empresa que recebeu dinheiro de emenda foi aberta pouco antes de receber, porque isso merece um olhar.

**Why P1**: Sinal objetivo, de regra simples e dado oficial.

**Acceptance Criteria**:

1. WHEN `pnpm ingest receita --arquivo <zip>` importa um lote "Estabelecimentos" baixado à mão THEN the system SHALL gravar CNPJ, data de início de atividade e CNAE principal só dos CNPJs que já existem no banco como favorecido ou fornecedor, com `coleta_id` e SHA-256 do arquivo (R1). <!-- CNPJ-01 -->
2. The system SHALL nunca gravar campos do arquivo de sócios, endereço, telefone ou e-mail da Receita. <!-- CNPJ-02 -->
3. WHEN a data de início de atividade do estabelecimento matriz (D12) de um CNPJ é menos de D4 dias anterior ao primeiro pagamento ligado à emenda THEN the system SHALL marcar o indício "empresa recém-aberta" com as duas datas e o intervalo em dias. <!-- CNPJ-03 -->
4. WHEN o intervalo é igual ou maior que D4 dias THEN the system SHALL não marcar o indício. <!-- CNPJ-04 -->
5. IF o CNPJ não está no lote importado THEN the system SHALL mostrar "Data de abertura não encontrada na base da Receita de {mês}" e não marcar indício. <!-- CNPJ-05 -->
6. The system SHALL mostrar a data da base da Receita usada ("base de MM/AAAA") ao lado de toda data de abertura. <!-- CNPJ-06 -->
7. The system SHALL nunca baixar arquivos de `arquivos.receitafederal.gov.br` por código; o importador só lê arquivo local. <!-- CNPJ-07 -->

**Independent Test**: semear CNPJ aberto 179 e 180 dias antes do pagamento (com D4 = 180); só o primeiro recebe o indício.

---

### P2: Ciclo fechado com a campanha

**User Story**: Como cidadão, quero saber se uma empresa que recebeu dinheiro da emenda também prestou serviço à campanha de quem indicou a emenda.

**Why P2**: Depende de nova coleta do TSE (prestação de contas, 500 MB por eleição).

**Acceptance Criteria**:

1. WHEN `pnpm ingest tse-contas {ano}` roda THEN the system SHALL gravar despesas de campanha com fornecedor PJ (CNPJ, valor, data) dos candidatos já casados em `candidatura`, ligadas por `sq_candidato`. <!-- CICLO-01 -->
2. The system SHALL nunca gravar nome nem CPF de doador ou fornecedor pessoa física da campanha. <!-- CICLO-02 -->
3. WHEN um CNPJ recebeu dinheiro de emenda do parlamentar e aparece nas despesas da campanha D8 do mesmo parlamentar THEN the system SHALL marcar o indício "ciclo fechado" com os dois valores, as duas datas e as duas fontes. <!-- CICLO-03 -->
4. IF o mesmo CNPJ aparece na campanha de outro parlamentar THEN the system SHALL não marcar o indício no perfil do parlamentar da emenda. <!-- CICLO-04 -->

**Independent Test**: semear um CNPJ na despesa de campanha e num pagamento da emenda do mesmo parlamentar, e outro só na campanha de outro; só o primeiro marca.

---

### P1: Linguagem e metodologia dos indícios ⭐ MVP

**User Story**: Como parlamentar ou empresa citada, quero que o aviso diga exatamente o que foi comparado e que não me acuse.

**Why P1**: R4 e risco de honra (terceiros não são agentes públicos).

**Acceptance Criteria**:

1. The system SHALL usar só os termos "indício" ou "padrão atípico" e incluir em cada aviso a frase "Indício não é prova de irregularidade." <!-- LING-01 -->
2. The system SHALL mostrar em cada aviso a regra, o limiar, os dados comparados e o link para a seção da metodologia. <!-- LING-02 -->
3. The system SHALL publicar na metodologia uma seção por sinal, com fonte, regra, limiar e exemplo, na versão D11. <!-- LING-03 -->
4. The system SHALL oferecer "Contestar" em cada aviso, ligado ao fluxo de correção existente. <!-- LING-04 -->
5. The system SHALL incluir os elos e os indícios no CSV do perfil, com colunas `indicio` e `versao_metodologia`. <!-- LING-05 -->
6. The system SHALL avaliar cada sinal só com fatos datados até a data do pagamento avaliado (data de abertura, data da despesa de campanha), nunca com dado publicado depois dela. <!-- LING-06 -->
7. The system SHALL mostrar ao lado de cada sinal a taxa de base: "M de N" com o universo explícito (empresas pagas com emenda Pix na base, para "recém-aberta"; parlamentares com emenda Pix, para "ciclo fechado"). <!-- LING-07 -->
8. The system SHALL publicar na metodologia, por sinal, as causas conhecidas de falso positivo (empresa nova legítima, MEI, fornecedor único da região, gráfica ou serviço comum a campanha e prefeitura). <!-- LING-08 -->
9. The system SHALL citar em cada aviso a data e o SHA-256 dos arquivos de cada elo, com link para a coleta. <!-- LING-09 -->

**Independent Test**: renderizar um aviso de cada tipo e conferir termos, frase, limiar e link.

---

### P1: Versão enxuta (densidade de informação) ⭐ MVP

> Aprovada pelo usuário em 13/11/2026 (artboards `SeguirDinheiroEnxuto.dc.html` e `SeguirDinheiroEnxutoMobile.dc.html` no canvas do protótipo, x=2470, y=19460), depois da ronda de UX, design e copy (`pesquisa/2026-11-13-ronda-trilha/`). Com dados reais, uma emenda Pix chega a 96 municípios e a seção aprovada ocupava 34 telas no desktop.

**User Story**: Como cidadão, quero ver para onde foi o dinheiro de cada emenda sem rolar dezenas de telas, abrindo só o que me interessa.

**Acceptance Criteria**:

1. The system SHALL mostrar cada emenda Pix numa linha com código, área, número de municípios ou estados (com a UF), valor transferido e porcentagem paga; WHEN a emenda tem indício THEN ela abre aberta e vem antes das outras; as demais vêm fechadas. <!-- DENS-01 -->
2. WHEN uma emenda está aberta THEN the system SHALL mostrar os três elos uma vez, cada um com o seu valor: reservado no Orçamento (empenhado, Portal da Transparência), transferido a N municípios ou estados (Transferegov) e pago pelos municípios (Transferegov), com o saldo "Sem pagamento registrado: R$ X" quando houver (TRI-05). <!-- DENS-02 -->
3. The system SHALL listar os municípios ou estados da emenda em ordem de valor pago, mostrar no máximo 10 com pagamento e oferecer "Ver os outros N municípios com pagamento"; os que não têm pagamento ficam numa linha só, "N municípios sem pagamento registrado · R$ X". <!-- DENS-03 -->
4. WHEN o cidadão abre um município THEN the system SHALL mostrar quem ele pagou (nome, CNPJ, abertura, 1º pagamento, valor), os pagamentos a pessoas físicas numa linha somada e um selo em cada empresa com indício ("recém-aberta" ou "também na campanha"). <!-- DENS-04 -->
5. The system SHALL agrupar os indícios num cartão por sinal, com título, número de casos, taxa de base, regra e "Indício não é prova de irregularidade." uma vez por cartão, e uma linha por empresa com nome, CNPJ, valor, uma frase com as datas e "Ver na trilha"; os arquivos usados com data e SHA-256 ficam ao abrir. <!-- DENS-05 -->
6. IF a base da Receita não foi importada THEN the system SHALL tratar "empresa recém-aberta" como não avaliado; IF as despesas de campanha da eleição do mandato não foram importadas THEN "ciclo fechado" também; WHEN nenhum sinal foi avaliado THEN o indicador mostra "Não avaliados", nunca "0", com uma nota que diz que isso não quer dizer que não haja indício. <!-- DENS-06 -->
7. The system SHALL mostrar "Baixar CSV" e "Contestar" no topo da seção. <!-- DENS-07 -->
8. The system SHALL mostrar as notas sobre pessoas físicas, matriz, base da Receita e fontes uma vez por seção, não por município. <!-- DENS-08 -->
9. WHEN o cidadão segue "Ver na trilha" THEN the system SHALL levar ao município que pagou a empresa, já aberto. <!-- DENS-09 -->
10. The system SHALL descrever o ciclo fechado só com o que o dado mostra ("aparece nas despesas declaradas da campanha"), usar "município ou estado" nos rótulos de quem recebeu e não acentuar razão social com palavras ambíguas (por exemplo, "para" nunca vira "Pará"). <!-- DENS-10 -->

**Independent Test**: perfil fictício com uma emenda de 15 municípios (12 com pagamento, 3 sem) e um perfil sem base da Receita nem do TSE; a seção mostra 10 municípios, o botão dos outros 2, a linha dos 3 sem pagamento e "Não avaliados".

---

## Edge Cases

- IF um plano de ação de emenda Pix não traz código de emenda THEN the system SHALL não ligá-lo a nenhum parlamentar e contar o caso no log da coleta. <!-- EDGE-01 -->
- IF o CNPJ vem com dígito verificador inválido THEN the system SHALL descartar o elo e registrar no log. <!-- EDGE-02 -->
- WHEN o favorecido do segundo salto é outro ente público THEN the system SHALL mostrá-lo na trilha sem avaliar "empresa recém-aberta". <!-- EDGE-03 -->
- WHEN a matriz do CNPJ básico não está no lote THEN the system SHALL usar a data do próprio estabelecimento e dizer "data da filial; matriz não encontrada". <!-- EDGE-05 -->
- IF o lote importado é de um mês anterior ao lote vigente THEN the system SHALL recusar a importação com mensagem que cita os dois meses. <!-- EDGE-06 -->
- WHEN o parlamentar não tem emenda Pix THEN the system SHALL mostrar "{Este deputado|Esta deputada|Este senador|Esta senadora} não indicou transferências especiais no período" e esconder a trilha (gênero e Casa revistos em 13/11). <!-- EDGE-04 -->

## Implicit-requirement sweep

| Dimension | Coverage |
| --------- | -------- |
| Input validation & bounds | EDGE-02, EDGE-05, EDGE-06, CNPJ-05 |
| Failure / partial-failure | TRI-06 |
| Idempotency / retry | Cada coleta apaga e regrava só os seus registros (padrão das coletas atuais); repetir dá o mesmo resultado |
| Auth boundaries & rate limits | Fontes sem chave; ritmo do `ClienteEducado`; 429 para a coleta (TRI-06) |
| Concurrency / ordering | Indícios dependem da ordem emendas → Transferegov → Receita → TSE; o cálculo é feito na leitura (como o padrão atípico), então a ordem de coleta não altera o resultado final |
| Data lifecycle | N/A because os dados seguem a retenção das demais coletas; cada coleta substitui a anterior da mesma fonte; o lote da Receita vigente substitui o anterior |
| Observability | Log da coleta com contagem de elos ligados, descartados e sem código (EDGE-01, EDGE-02) |
| External-dependency failure | TRI-06 |
| State-transition integrity | N/A because não há estado com transições, só coletas e leitura |

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| TRI-01 | P1: Trilha | Execute | Implemented |
| TRI-02 | P1: Trilha | Execute | Implemented |
| TRI-03 | P1: Trilha | Execute | Implemented |
| TRI-04 | P1: Trilha | Execute | Implemented |
| TRI-05 | P1: Trilha | Execute | Implemented |
| TRI-06 | P1: Trilha | Execute | Implemented |
| TRI-07 | P1: Trilha | Execute | Implemented |
| CNPJ-01 | P1: Recém-aberta | Execute | Implemented |
| CNPJ-02 | P1: Recém-aberta | Execute | Implemented |
| CNPJ-03 | P1: Recém-aberta | Execute | Implemented |
| CNPJ-04 | P1: Recém-aberta | Execute | Implemented |
| CNPJ-05 | P1: Recém-aberta | Execute | Implemented |
| CNPJ-06 | P1: Recém-aberta | Execute | Implemented |
| CNPJ-07 | P1: Recém-aberta | Execute | Implemented |
| CICLO-01 | P2: Ciclo fechado | Execute | Implemented |
| CICLO-02 | P2: Ciclo fechado | Execute | Implemented |
| CICLO-03 | P2: Ciclo fechado | Execute | Implemented |
| CICLO-04 | P2: Ciclo fechado | Execute | Implemented |
| LING-01 | P1: Linguagem | Execute | Implemented |
| LING-02 | P1: Linguagem | Execute | Implemented |
| LING-03 | P1: Linguagem | Execute | Implemented |
| LING-04 | P1: Linguagem | Execute | Implemented |
| LING-05 | P1: Linguagem | Execute | Implemented |
| LING-06 | P1: Linguagem | Execute | Implemented |
| LING-07 | P1: Linguagem | Execute | Implemented |
| LING-08 | P1: Linguagem | Execute | Implemented |
| LING-09 | P1: Linguagem | Execute | Implemented |
| EDGE-01 | Edge cases | Execute | Implemented |
| EDGE-02 | Edge cases | Execute | Implemented |
| EDGE-03 | Edge cases | Execute | Implemented |
| EDGE-04 | Edge cases | Execute | Implemented |
| EDGE-05 | Edge cases | Execute | Implemented |
| EDGE-06 | Edge cases | Execute | Implemented |
| DENS-01 | P1: Versão enxuta | Execute | Pending |
| DENS-02 | P1: Versão enxuta | Execute | Pending |
| DENS-03 | P1: Versão enxuta | Execute | Pending |
| DENS-04 | P1: Versão enxuta | Execute | Pending |
| DENS-05 | P1: Versão enxuta | Execute | Pending |
| DENS-06 | P1: Versão enxuta | Execute | Pending |
| DENS-07 | P1: Versão enxuta | Execute | Pending |
| DENS-08 | P1: Versão enxuta | Execute | Pending |
| DENS-09 | P1: Versão enxuta | Execute | Pending |
| DENS-10 | P1: Versão enxuta | Execute | Pending |
**Coverage:** 43 total, 33 mapped to tasks (T1–T14), 10 mapped to T15–T18

---

## Success Criteria

- [ ] Para uma amostra de 10 emendas Pix, a soma dos pagamentos na trilha bate com o Transferegov centavo a centavo.
- [ ] Zero elos ligados por nome: toda junção usa CNPJ, código da emenda, plano de ação ou `sq_candidato`.
- [ ] Zero CPF, nome de PF ou dado bancário no banco vindo das novas coletas.
