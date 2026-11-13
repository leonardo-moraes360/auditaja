# Changelog

Todas as mudanças relevantes do site ficam aqui. O formato segue o [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e as versões seguem o [Versionamento Semântico](https://semver.org/lang/pt-BR/). Enquanto o site não for lançado, a versão fica em 0.x; a 1.0.0 marca o lançamento público.

## [Não publicado]

### Adicionado

- SEO: `robots.txt` (libera todos os robôs, inclusive de IA), `sitemap.xml` com todos os perfis, canonical em todas as páginas, `noindex` na busca e nos formulários, title e description por perfil e por lista (Casa e UF).
- Dados estruturados (JSON-LD): `WebSite` com busca e `Organization` no site; `ProfilePage`, `Person`, `BreadcrumbList` e `Dataset` (CSVs) no perfil.
- Cartões de compartilhamento (Open Graph e X) gerados para o site e para cada perfil.
- Para agentes de IA: `/llms.txt`, `/llms-full.txt` e o perfil em Markdown em `/parlamentares/{id}.md`, anunciado no `<head>`; robôs de IA recebem a metadata no `<head>` sem streaming.

### Alterado

- Sem o `loading.tsx` da raiz, as páginas estáticas (início, metodologia, privacidade) chegam com o texto no HTML, legível por robôs sem JavaScript.

## [0.1.0] - 2026-11-12

Primeira versão numerada. Reúne o que já estava na `main` até o PR #16.

### Adicionado

- Perfil do deputado federal: cota parlamentar (CEAP), votações nominais, alinhamento com a orientação do partido e bens declarados ao TSE, com fonte e data de coleta em cada seção.
- Perfil do senador, emendas parlamentares (Portal da Transparência e Senado) e presença em Plenário sem contar licenças.
- Indicador de padrão atípico, sanções (CEIS/CNEP) e teto da CEAP por UF quando conferido.
- Formulário de contestação por perfil, política de privacidade e páginas de metodologia, fontes e sobre.
- Design system com tema claro e escuro, logo e favicon.
- Versão e hash curto do commit no rodapé.
