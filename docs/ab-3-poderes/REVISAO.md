# Revisão independente — três poderes (entregas X e Y)

Revisão só de produto: código, testes, migrações, páginas e `DECISOES.md`.
Ignorados: `METRICAS.md`, `.toolbelt/`, tickets e menções à ferramenta.

| Entrega | Branch de origem (só referência) |
| ------- | -------------------------------- |
| **X**   | `ab/3-poderes-baseline`          |
| **Y**   | `ab/3-poderes-com-tb`            |

Base de comparação: `piloto/toolbelt` (`df37530`).

---

## 1. O que foi possível verificar

Ambiente: Postgres 16 local na porta `5436` (sem Docker neste runner). Worktrees limpos por entrega; `pnpm install` em cada uma.

| Comando / checagem                         | X                                      | Y                                      |
| ------------------------------------------ | -------------------------------------- | -------------------------------------- |
| `pnpm install`                             | ok                                     | ok                                     |
| `pnpm lint`                                | ok                                     | ok                                     |
| `pnpm typecheck`                           | ok                                     | ok                                     |
| `pnpm format:check`                        | ok                                     | ok                                     |
| `pnpm db:migrate` + `pnpm db:seed:test`    | ok (migração `0014_tres_poderes`)      | ok (migração `0014_tres_poderes`)      |
| `pnpm test` (unit + integração)            | **falha** (1 teste web)                | **falha** (2 testes web)               |
| `pnpm build` (com `auditaja_test` semeado) | ok                                     | ok                                     |
| `pnpm build` (DB principal vazio)          | **falha** (`generateStaticParams` vazio em `/executivo/[id]`) | ok (sem rotas dinâmicas novas de perfil) |
| e2e Playwright `seo.spec.ts` (desktop)     | 12/12 ok                               | 12/12 ok                               |
| e2e completo / a11y / celular              | não rodado (tempo; smoke SEO ok)       | não rodado                             |
| Coleta real (`pnpm ingest executivo/judiciario` na rede) | não executada ponta a ponta; URLs de composição sondadas | não executada; URLs sondadas |

---

## 2. Notas por critério (0–10)

| Critério                                      | X   | Y   |
| --------------------------------------------- | --- | --- |
| Correção e completude das 3 tarefas           | 8,5 | 5,5 |
| Aderência aos padrões do Legislativo          | 7,0 | 7,5 |
| Privacidade (regras R*)                       | 8,0 | 8,0 |
| Qualidade e cobertura dos testes              | 7,0 | 5,5 |
| Escopo (sem ruído / sem quebrar o existente)  | 8,0 | 7,5 |
| Qualidade dos KPIs                            | 9,0 | 6,5 |
| Landing (DS, links, sitemap)                  | 9,0 | 7,0 |
| Fontes e escopo documentados                  | 7,5 | 7,0 |
| **Média simples**                             | **8,0** | **6,8** |

### Justificativas resumidas

**Correção e completude.** X entrega o pacote quase completo: modelo próprio (titular + despesa + bens; no Judiciário também sessão/voto), listas, **perfis** `/executivo/[id]` e `/judiciario/[id]`, landing `/poderes`, KPIs no perfil, seed, CLI de ingest, atualização de metodologia/fontes/nav/sitemap. Y cobre landing + listas `/poderes/{executivo,judiciario}` e estende `parlamentar`/`despesa_titular`, mas **não há página de perfil** para Executivo/Judiciário: a lista só mostra o id em texto, sem link; `perfilParlamentar` rejeita casas novas. A coleta de Y é snapshot/placeholder, não um parser de fonte estruturada.

**Aderência ao Legislativo.** Y segue o precedente do Senado (mesma tabela `parlamentar`, filtro explícito de casas legislativas em busca/SEO/`parlamentarExiste`) — mais alinhado ao modelo existente. X cria tabelas paralelas (mais próximo de um segundo produto), mas replica casca estática + Suspense, tokens (`font-heading`, `rounded-[14px]`, `bg-card`) e `ClienteEducado`/R3. Falta `import "server-only"` nos data modules novos de X.

**Privacidade.** Ambas aplicam `documentoPublicavel` / `nomeFornecedorPublicavel` nas despesas e não modelam CPF do titular nem descrição livre de bens. Y evita coluna `descricao` em `despesa_titular` (melhor minimização). X grava `descricao` livre em despesa/sessão (risco se a fonte trouxer texto sensível). Nenhuma entrega vazou CPF completo nos testes de montagem. Ambas poluem as notas de fonte do perfil legislativo com coletas dos novos poderes (R1 de apresentação, não R3).

**Testes.** X: unitários sólidos de KPIs/ingest/páginas novas; 1 regressão de integração (`PROV-02`). Y: unitários de KPIs/ingest ok; 2 regressões (`PROV-02` + índice SEO); nenhuma suíte de página para `/poderes*`. Nenhum dos dois acrescenta e2e específico dos três poderes.

**Escopo.** X não mistura Executivo/Judiciário em `/parlamentares` (tabelas separadas). Y filtra listas/SEO do Legislativo de propósito, mas deixa o teste de SEO desalinhado e o produto de perfil incompleto. Diff de Y é menor; o de X inclui CHANGELOG/AGENTS/metodologia/fontes.

**KPIs.** X define presença e concordância com a maioria no Judiciário (análogo realista a presença/alinhamento) e concentraçã/média/bens no Executivo, e **mostra** isso no perfil. Y reutiliza bem as funções do Legislativo para gastos/concentração/bens, mas o Judiciário fica só em gastos, e os KPIs quase não aparecem fora da landing agregada.

**Landing.** Ambas usam o design system, entram no menu/home/sitemap. X ainda indexa perfis no sitemap e liga lista→perfil. Y indexa só as listas; as listas não navegam para detalhe.

**Fontes/doc.** Ambas têm `DECISOES.md` claro (esfera federal, cargos, fora de escopo). X atualiza `/fontes` e `/metodologia#tres-poderes`. URLs de composição usadas na ingest de X (e a de ministérios em Y) não respondem como JSON/HTML útil (ver bugs).

---

## 3. Bugs concretos

### Entrega X

1. **Regressão PROV-02 — coletas dos novos poderes aparecem no perfil legislativo**  
   `apps/web/src/data/perfil.ts` (~176–193, `coletasRecentes`): só exclui a “outra Casa” legislativa; fontes `planalto_composicao_executivo`, `cgu_viagens_executivo`, `stf_composicao`, `stf_sessoes` (seed em `packages/db/src/seed.ts` ~918–1035) entram nas notas de fonte do deputado. Quebra `apps/web/tests/integracao/perfil.test.ts:237`.

2. **URL de composição do Executivo inexistente (404)**  
   `packages/ingest/src/executivo.ts:19` — `…/composicao-do-governo.json` responde 404. `coletarExecutivo` (L107–114) faz `JSON.parse` do download: coleta real falha.

3. **URL “JSON” do STF devolve HTML**  
   `packages/ingest/src/judiciario.ts:15` — `tip=JSON` responde `text/html`. `coletarJudiciario` (L124–128) assume JSON: coleta real falha.

4. **`generateStaticParams` vazio derruba o build sem dados**  
   `apps/web/src/app/executivo/[id]/page.tsx:17–23` e `apps/web/src/app/judiciario/[id]/page.tsx:17–23`: se a tabela existe e está vazia, retorna `[]` (o `catch` com `[{ id: "0" }]` não cobre esse caso). Com Cache Components, o build falha. Mesmo padrão do Legislativo, mas as rotas novas tornam o deploy “banco migrado / ainda sem ingest” frágil.

5. **Data layer sem `server-only`**  
   `apps/web/src/data/executivo.ts:1` e `apps/web/src/data/judiciario.ts:1` — demais módulos em `src/data` importam `server-only`; estes não.

6. **Descrição livre em despesa (minimização)**  
   `packages/db/src/migrations/0014_tres_poderes.ts:39` e `:95` — coluna `descricao` text not null em `despesa_executivo` / `despesa_judiciario`. Se a fonte de viagem trouxer passageiro/detalhe pessoal, não há sanitização além do trim (`packages/ingest/src/executivo.ts:95`).

### Entrega Y

1. **Regressão PROV-02 — mesmo vazamento de fontes no perfil legislativo**  
   Mesma função `coletasRecentes` em `apps/web/src/data/perfil.ts` (~180–193). Seed grava `gov_executivo_composicao` / `judiciario_composicao` (`packages/db/src/seed.ts:911–912`). Quebra `apps/web/tests/integracao/perfil.test.ts:237`.

2. **Teste de SEO do índice desalinhado do filtro de casas**  
   `apps/web/src/data/seo.ts:22` restringe a `CASAS_LEGISLATIVO`, mas `apps/web/tests/integracao/seo.test.ts:34–38` compara o índice com `count(*)` de **toda** a tabela `parlamentar` (inclui executivo/stf/stj do seed). CI de integração falha.

3. **Sem perfil de titular — tarefa 1 incompleta na UI**  
   `apps/web/src/app/poderes/executivo/page.tsx:47–57` e `…/judiciario/page.tsx` (lista análoga): renderizam nome/cargo e `id {t.id}` **sem** `Link` para detalhe. `apps/web/src/data/perfil.ts:307` — `if (!bruto || !ehCasaLegislativo(bruto.casa)) return null`. Não há rota de perfil alternativa.

4. **R1 frágil na coleta: SHA da página HTML com payload local**  
   `packages/ingest/src/executivo.ts:113–120` (e espelho em `judiciario.ts:99–107`): grava titulares do snapshot `COMPOSICAO_*_REFERENCIA`, mas se o `baixar` “funciona”, substitui `sha256`/`bytes` pelo da página baixada — proveniência não corresponde ao conteúdo inserido.

5. **URL de composição ministerial 404**  
   `packages/ingest/src/executivo.ts:13` — `…/composicao/ministerios` responde 404 na sondagem. O coletor cai no snapshot (L86–101) com nomes genéricos (“Presidente da República”), inadequados como dados de produto.

6. **`titularExiste` sem uso de perfil**  
   `apps/web/src/data/existe.ts:17–25` introduz `titularExiste` para todas as casas, mas nenhuma página de perfil o consome — sinal de feature pela metade.

---

## 4. Veredito

**Usar a entrega X como base.**

É a única que fecha o ciclo pessoa → lista → perfil → KPI → sitemap com sessões/votos no Judiciário e documentação de metodologia/fontes no site. Os buracos (URLs de ingest, filtro de `coleta` no perfil legislativo, `server-only`, build com tabela vazia) são corrigíveis sem redesenhar o produto.

**Portar de Y (seletivamente):**

- Filtro explícito e tipagem de casas (`CASAS_LEGISLATIVO` / `poderDaCasa` / `cargoTitular`) como referência se no futuro unificar pessoa numa só tabela.
- Evitar `descricao` livre em despesa (modelo `despesa_titular` de Y) ou sanitizar na ingest.
- Inclusão do STJ **só se** o escopo de produto quiser ir além do STF (X documentou STF-only de propósito).
- Estilo de KPIs que reutiliza `alinhamento` / `variacaoNominal` de `metrics.ts` em vez de duplicar taxas à mão — desde que continuem wired na UI.

**Não portar de Y:** coleta por snapshot com nomes placeholder; landing/listas sem perfil; ausência de modelo de sessão/voto no Judiciário.

---

## 5. O que não foi possível verificar

- Suite e2e completa (só smoke SEO desktop).
- Ingest ponta a ponta com download real + gravação (só sondagem HTTP das URLs de composição).
- Deploy Coolify / build de CI GitHub Actions nos branches das entregas.
- Comparação visual/a11y das landings além da inspeção de código e HTTP 200.
- Conteúdo real das páginas de perfil de X após o reset do banco para a migração de Y (perfis de X foram exercitados via build estático + testes unitários de página + e2e SEO antes do reset; integração e seed de X rodaram com sucesso).
