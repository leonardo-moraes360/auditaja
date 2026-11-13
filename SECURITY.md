# Política de segurança

O Auditaja publica dados de interesse público sobre parlamentares e trata dados de terceiros que aparecem nas fontes oficiais (fornecedores, favorecidos, passageiros). Uma falha de segurança aqui pode expor dados pessoais ou adulterar o que o cidadão lê como informação oficial, então todo relato é bem-vindo.

O projeto é mantido por uma pessoa, sem equipe de plantão. Os prazos abaixo são de melhor esforço, e não há programa de recompensa.

## Versões suportadas

O site ainda está na série 0.x ([Versionamento Semântico](https://semver.org/lang/pt-BR/)) e só existe uma versão em produção: a da branch `main`. Correções entram na `main` e vão para o ar no deploy seguinte; não há correção retroativa para versões antigas nem para forks.

| Versão                     | Suportada |
| -------------------------- | --------- |
| `main` (versão no ar)      | Sim       |
| Versões anteriores e forks | Não       |

A versão e o commit no ar aparecem no rodapé do site (`vX.Y.Z · <hash>`). Informe os dois no relato.

## Como relatar

**Não abra issue, PR ou discussão pública** para uma vulnerabilidade.

Use o relato privado do GitHub: [Report a vulnerability](https://github.com/leonardo-moraes360/auditaja/security/advisories/new) (aba **Security** do repositório). Só você e o mantenedor veem o relato, e a conversa, a correção e a divulgação acontecem no mesmo lugar.

Inclua, se puder:

- O que a falha permite (impacto) e quem é afetado.
- Endereço, rota ou arquivo envolvido, com versão e commit.
- Passos para reproduzir ou uma prova de conceito mínima.
- Se houve acesso a dado pessoal, quais tipos de dado e por quanto tempo ficaram com você (sem anexar os dados ao relato).

Relatos em português ou inglês.

## O que esperar

| Etapa                                  | Prazo (melhor esforço)                          |
| -------------------------------------- | ----------------------------------------------- |
| Confirmação de recebimento             | até 7 dias corridos                             |
| Avaliação inicial e severidade         | até 14 dias corridos                            |
| Contenção de exposição de dado pessoal | o quanto antes, com prioridade sobre o resto    |
| Correção de falha crítica ou alta      | meta de 30 dias após a confirmação              |
| Correção de falha média ou baixa       | meta de 90 dias, ou junto com o próximo release |

Você recebe notícia a cada mudança de estado (confirmada, em correção, corrigida, descartada) e o motivo quando o relato não for considerado vulnerabilidade.

Quando a falha expõe dado pessoal, a primeira medida é tirar o dado do ar (página, CSV, Markdown, cache) e só depois corrigir a causa. O mantenedor avalia se o caso é incidente de segurança com risco ou dano relevante aos titulares e, se for, faz a comunicação à ANPD e aos titulares prevista no art. 48 da LGPD.

## Escopo

Está dentro do escopo:

- **Site** (`apps/web`): páginas, rotas de API, formulários de contestação e acompanhamento, CSVs, perfis em Markdown, `llms.txt` e `llms-full.txt`, sitemap, cartões de compartilhamento e JSON-LD.
- **Exposição de dado pessoal**, inclusive contornar as regras de privacidade do projeto (ver "Regras legais aplicadas" no [README](README.md)): CPF de fornecedor ou favorecido pessoa física sem máscara, nome de pessoa física que deveria aparecer como "Prestador pessoa física", nome de passageiro da cota parlamentar, descrição livre de bens declarados, dados de quem enviou um pedido de correção, ou cruzamentos publicados que reidentifiquem uma pessoa física.
- **Injeção a partir dos dados de origem:** texto vindo de uma fonte oficial que fecha o `<script>` do JSON-LD, quebra o Markdown dos perfis ou do `llms.txt` (links, imagens ou instruções injetadas), executa script (XSS) ou vira fórmula ao abrir um CSV em planilha.
- **Adulteração de dado exibido:** qualquer forma de um terceiro fazer o site mostrar valor, fonte ou indício diferente do que está nos dados oficiais coletados.
- **Banco e servidor:** injeção de SQL, acesso não autorizado a dados ou a pedidos de correção, vazamento de segredo ou de variável de ambiente.
- **Coleta** (`packages/ingest`): falha que faça o coletor ignorar o `robots.txt`, o limite de requisições ou a parada em 401/403, ou que permita a uma resposta maliciosa de fonte gravar dado arbitrário ou executar código.
- **Cadeia de suprimentos do repositório:** workflows do GitHub Actions, actions e dependências (por exemplo, um workflow que exponha segredo ou rode código de PR de terceiro com permissão de escrita).

## Fora do escopo

- **Erro no conteúdo de um dado oficial** (valor, nome, partido, voto). Use o formulário "Contestar" do perfil ou fale com o órgão de origem; o Auditaja reproduz o que a fonte publica.
- **Dados públicos de parlamentares** que o site existe para mostrar (gastos, votos, bens, emendas) e a indexação deles por buscadores e robôs de IA, que é liberada de propósito.
- Negação de serviço, testes de carga, força bruta e qualquer teste que dependa de volume de requisições.
- Engenharia social, phishing e ataques físicos contra o mantenedor ou contra terceiros.
- Vulnerabilidades nos sistemas dos órgãos de origem (Câmara, Senado, TSE, CGU, Transferegov, Receita). Relate ao próprio órgão ou ao [CTIR Gov](https://www.gov.br/ctir/).
- Vulnerabilidades da hospedagem, do Coolify, do GitHub ou de dependências sem impacto demonstrado no Auditaja (relate ao projeto de origem; se a dependência afeta o Auditaja, o relato é bem-vindo).
- Relatórios automáticos de scanner sem prova de impacto, ausência de cabeçalho de segurança sem um ataque concreto, clickjacking em páginas sem ação sensível, self-XSS, enumeração de rotas públicas e versões de software expostas.
- Spam no formulário de contestação sem contorno de alguma proteção.

## Divulgação coordenada

- A falha fica em sigilo até a correção estar no ar ou até 90 dias depois da confirmação, o que vier primeiro. O prazo pode ser estendido de comum acordo se a correção depender de terceiros.
- Depois da correção, o mantenedor publica um security advisory no GitHub com descrição, versões afetadas e correção, e pede um CVE quando fizer sentido.
- Quem relatou recebe crédito no advisory, com o nome ou apelido que preferir, ou fica anônimo, se pedir.
- Se a falha já estiver sendo explorada ou for divulgada por outros, a correção e o aviso podem sair antes.

## Pesquisa de boa-fé (safe harbor)

Quem pesquisar e relatar uma vulnerabilidade de boa-fé, seguindo esta política, não terá ação civil nem representação criminal movida pelo mantenedor do Auditaja por causa dessa pesquisa. Boa-fé quer dizer:

- Testar só o Auditaja (o site e este repositório), de preferência numa instância local (`pnpm db:seed:test` sobe um banco com dados fictícios).
- Acessar o mínimo de dados para demonstrar a falha. Ao encontrar dado pessoal, parar, não copiar, não guardar e não repassar a ninguém, e informar no relato o que foi visto.
- Não alterar nem apagar dados, não enviar pedidos de correção em massa e não degradar o serviço.
- Não usar o Auditaja, nem os coletores dele, para sobrecarregar ou atacar os sistemas dos órgãos de origem.
- Não divulgar a falha antes do prazo de divulgação coordenada.
- Não exigir pagamento ou vantagem em troca do relato ou do silêncio.

Essa garantia vale só para o que o mantenedor pode autorizar: não cobre sistemas de terceiros (órgãos públicos, hospedagem, GitHub) e não vincula autoridades. Na dúvida sobre se um teste é aceitável, pergunte antes pelo relato privado.

## Para máquinas

O site publica `/.well-known/security.txt` ([RFC 9116](https://www.rfc-editor.org/rfc/rfc9116)) com o canal de relato e o link para esta política. O campo `Expires` é recalculado a cada build (180 dias depois do deploy).
