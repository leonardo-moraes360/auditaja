# Changelog

Todas as mudanças relevantes do site ficam aqui. O formato segue o [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e as versões seguem o [Versionamento Semântico](https://semver.org/lang/pt-BR/). Enquanto o site não for lançado, a versão fica em 0.x; a 1.0.0 marca o lançamento público.

## [Não publicado]

### Adicionado

- "Para onde foi o dinheiro das emendas Pix" no perfil: emenda, ente e empresas pagas pelo ente (Transferegov), com os indícios "empresa recém-aberta" (menos de 180 dias entre a abertura da matriz e o primeiro pagamento) e "ciclo fechado" (empresa da emenda também fornecedora da campanha), cada um com regra, taxa de base e arquivos de origem. Metodologia 1.11 e CSV da trilha.
- Coletas `transferegov-pix`, `tse-contas` e importação local do lote Estabelecimentos da Receita (`receita --arquivo`).

## [0.1.0] - 2026-11-12

Primeira versão numerada. Reúne o que já estava na `main` até o PR #16.

### Adicionado

- Perfil do deputado federal: cota parlamentar (CEAP), votações nominais, alinhamento com a orientação do partido e bens declarados ao TSE, com fonte e data de coleta em cada seção.
- Perfil do senador, emendas parlamentares (Portal da Transparência e Senado) e presença em Plenário sem contar licenças.
- Indicador de padrão atípico, sanções (CEIS/CNEP) e teto da CEAP por UF quando conferido.
- Formulário de contestação por perfil, política de privacidade e páginas de metodologia, fontes e sobre.
- Design system com tema claro e escuro, logo e favicon.
- Versão e hash curto do commit no rodapé.
