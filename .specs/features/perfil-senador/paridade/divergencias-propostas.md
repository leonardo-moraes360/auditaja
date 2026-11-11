# Divergências aceitas pelo usuário (11/11/2026, 18:53)

Itens da verificação nº 1 que não foram corrigidos porque a página segue uma regra da spec ou o visual já aprovado
do perfil do deputado. **Aceitos pelo usuário na thread em 11/11/2026 às 18:53** (resposta "1" à pergunta 1): saem do denominador da
paridade.

| ID | Item | Divergência | Motivo |
| --- | --- | --- | --- |
| I10 | C18 | Fornecedor pessoa física com CPF "—" em vez de `***.456.789-**` | SCEAPS-02: o Senado já publica o CPF mascarado com outros dígitos; guardar os dois remontaria o número (R3) |
| I11 | V12, V13, V14 | Bordas de botão secundário, filtros inativos e eixo do gráfico em `#C9CAC2` | Componentes compartilhados com o perfil do deputado, aprovado com `#C9CAC2`; o artboard do senador usou `#80858E` só por cópia da borda dos campos (I5) |
| I13 | P10 | Busca do topo visível na lista | O topo é global e igual em todas as páginas aprovadas |
| I14 | M12, C32 (parte) | No celular o bloco Mandato vem depois de Bens; a linha do tempo não mostra mandatos anteriores | Reordenar só com CSS deixaria a ordem visual diferente da ordem de leitura e de foco (WCAG 1.3.2 e 2.4.3) e confundiria a aba ativa, como mostrou a verificação nº 3; histórico de mandatos anteriores está fora do escopo (spec, Out of Scope) |

I12 (ordinal do suplente) saiu da lista: corrigido depois da verificação nº 2, com o sexo do cadastro do suplente.
