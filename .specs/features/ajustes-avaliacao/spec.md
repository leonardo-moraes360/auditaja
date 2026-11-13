# Ajustes depois da avaliação com cidadãos (12/11/2026)

Origem: avaliação UX/design/copy e simulação com três perfis de escolaridade (relatório fora do git,
`pesquisa/2026-11-12-avaliacao-interface-e-cidadaos.md`). Proposta visual aprovada no canvas
(artboards AjustesPerfil, AjustesPerfilMobile, AjustesHome).

## Requisitos

1. The system SHALL cruzar CEIS/CNEP com todos os fornecedores PJ do período exibido, não só os 5 maiores; fornecedor fora dos maiores entra no aviso só com nota dentro do período da sanção. <!-- AJ-01 -->
2. The system SHALL mostrar no topo do perfil a faixa "Pontos para verificar" com, para cada ano coletado, empresas pagas com a cota que estavam numa lista de empresas punidas na data da nota e gastos fora do padrão (padrão atípico), com link para o ano e a seção. <!-- AJ-02 -->
3. WHEN não há ponto em nenhum ano coletado THEN the system SHALL dizer que a checagem foi feita ("Nenhum ponto para verificar …"). <!-- AJ-03 -->
4. WHEN o período exibido não tem nota paga a empresa punida THEN the system SHALL dizer quantas empresas foram conferidas, a base CEIS/CNEP e apontar outros anos com caso. <!-- AJ-04 -->
5. The system SHALL marcar no seletor de ano dos gastos os anos com ponto para verificar. <!-- AJ-05 -->
6. The system SHALL mostrar a variação de bens em reais ("Em 2018 eram R$ X"), sem percentual. <!-- AJ-06 -->
7. The system SHALL mostrar em "Onde o dinheiro foi aplicado" a parte sem local definido (Múltiplo) como fatia explicada, antes dos locais. <!-- AJ-07 -->
8. WHILE a tela é menor que sm THEN the system SHALL mostrar os favorecidos de emendas em cartões com o valor à vista; seletor de ano, filtros de votação e links de fonte/CSV/correção ficam visíveis, com alvo de 44 px. <!-- AJ-08 -->
9. The system SHALL usar "Pedir correção" e "Receber atualizações" em todos os botões, rótulos simples nos números ("Votou em X de Y votações", "Votou diferente", "O partido pediu: Sim") e um glossário curto na lateral. <!-- AJ-09 -->
10. The system SHALL apresentar a home para deputados e senadores, com entrada por estado. <!-- AJ-10 -->

## Rodada 2 (13/11/2026)

11. The system SHALL achar o parlamentar com as palavras do nome em qualquer ordem, sem diferenciar acento, e pelo nome do estado ("Bahia"). <!-- AJ-11 -->
12. WHEN a busca não acha nenhum nome THEN the system SHALL sugerir nomes parecidos (pg_trgm, grafia aproximada: k/c, w/v, y/i, h mudo, letra dobrada), para buscas com 4 letras ou mais. <!-- AJ-12 -->
13. The system SHALL oferecer "Emendas e sanções" no formulário de correção e chamar a cota do senador de CEAPS. <!-- AJ-13 -->
14. The system SHALL oferecer o CSV de quem recebeu os pagamentos das emendas (um pagamento por linha, pessoa física sem documento). <!-- AJ-14 -->
15. The system SHALL mostrar em /fontes o arquivo coletado e o SHA-256 inteiro; a lista diz "Mostrando X de Y"; categorias longas da CEAPS ganham nome curto, com o oficial no `title` e no CSV. <!-- AJ-15 -->

## Fora

- Resumo simples de cada votação (sem fonte de dados).
- Controlador e encarregado do rodapé: variáveis `NEXT_PUBLIC_*`, a definir pelo responsável.
