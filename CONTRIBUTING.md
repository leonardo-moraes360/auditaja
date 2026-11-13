# Como contribuir

Obrigado pelo interesse em contribuir com o Auditaja! Este guia explica como participar do projeto, seja corrigindo um erro, propondo uma funcionalidade ou melhorando a documentação.

## Sumário

- [Configurando o ambiente](#configurando-o-ambiente)
- [Fluxo de contribuição](#fluxo-de-contribuição)
- [Padrão de commits](#padrão-de-commits)
- [Checks obrigatórios](#checks-obrigatórios)
- [Padrões de código](#padrões-de-código)
- [Acessibilidade](#acessibilidade)
- [Contribuindo com dados](#contribuindo-com-dados)
- [Processo de revisão](#processo-de-revisão)
- [Licenças](#licenças)

## Configurando o ambiente

O projeto é um monorepo com pnpm. Requisitos: Node.js 20+, pnpm 11+ e Docker (para o PostgreSQL).

```bash
# Clone o repositório
git clone https://github.com/leonardo-moraes360/auditaja.git
cd auditaja

# Instale as dependências
pnpm install

# Configure as variáveis de ambiente
cp .env.example .env
cp .env.example apps/web/.env.local

# Suba o banco de dados
pnpm db:up

# Rode as migrações e semeie dados de teste
pnpm db:seed:test

# Inicie o servidor de desenvolvimento
pnpm dev
```

O site estará em http://localhost:3000.

Para a documentação técnica completa (estrutura do monorepo, coleta de dados, regras de privacidade, SEO), veja o [AGENTS.md](AGENTS.md).

## Fluxo de contribuição

1. **Encontre ou crie uma issue.** Antes de começar, verifique se já existe uma [issue aberta](https://github.com/leonardo-moraes360/auditaja/issues) para o que você quer fazer. Se não existir, [abra uma](https://github.com/leonardo-moraes360/auditaja/issues/new/choose) para discutir a ideia antes de investir tempo no código.

2. **Crie uma branch a partir da `main`.** Use um nome descritivo:
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feat/descricao-curta   # funcionalidade nova
   git checkout -b fix/descricao-curta    # correção de bug
   git checkout -b docs/descricao-curta   # documentação
   ```

3. **Faça suas mudanças.** Siga os [padrões de código](#padrões-de-código) e adicione testes quando aplicável.

4. **Rode os checks localmente** antes de enviar:
   ```bash
   pnpm lint && pnpm typecheck && pnpm format:check
   pnpm test
   pnpm build && pnpm test:e2e  # se a mudança toca o site
   ```

5. **Faça commits atômicos** seguindo o [padrão de commits](#padrão-de-commits).

6. **Abra um pull request** contra a branch `main`. Use o [template de PR](.github/PULL_REQUEST_TEMPLATE.md) e preencha a checklist.

7. **Aguarde a revisão.** O mantenedor vai revisar seu PR. Pode haver pedidos de ajustes — isso é normal e faz parte do processo colaborativo.

## Padrão de commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/pt-br/). A estrutura é:

```
<tipo>(<escopo opcional>): <descrição curta>

<corpo opcional>

<rodapé opcional>
```

### Tipos principais

| Tipo       | Quando usar                                     |
| ---------- | ----------------------------------------------- |
| `feat`     | Funcionalidade nova                             |
| `fix`      | Correção de bug                                 |
| `docs`     | Mudança só na documentação                      |
| `style`    | Formatação, sem mudança de lógica               |
| `refactor` | Refatoração sem mudança de comportamento        |
| `perf`     | Melhoria de performance                         |
| `test`     | Adição ou correção de testes                    |
| `chore`    | Tarefas de manutenção (deps, CI, configs)       |
| `ci`       | Mudanças no CI/CD                               |

### Exemplos

```
feat(perfil): adicionar gráfico de gastos por mês
fix(votacoes): corrigir cálculo de alinhamento com o partido
docs(readme): atualizar instruções de instalação
chore(deps): atualizar Playwright para 1.50
```

A descrição deve ser em português, minúscula, sem ponto final, no imperativo ("adicionar", não "adicionado" nem "adiciona").

## Checks obrigatórios

Todo PR precisa passar nos checks do CI antes de ser mergeado. Os jobs são:

| Job        | O que verifica                                              |
| ---------- | ----------------------------------------------------------- |
| `static`   | Auditoria de deps, lint, formatação, typecheck e build      |
| `test`     | Testes unitários e de integração (Vitest)                   |
| `e2e`      | Testes end-to-end no desktop e celular (Playwright)         |

Para reproduzir localmente:

```bash
pnpm lint && pnpm typecheck && pnpm format:check
pnpm test
pnpm build && pnpm test:e2e
```

Se os testes de integração forem pulados, verifique se o banco está no ar (`pnpm db:up`).

## Padrões de código

- **TypeScript em todo lugar.** Evite `any`; prefira tipos explícitos.
- **ESLint e Prettier.** O lint e a formatação são verificados no CI. Rode `pnpm format` para formatar automaticamente.
- **Sem comentários óbvios.** Não comente o que o código já diz. Comentários explicam o "porquê", não o "o quê".
- **Testes.** Mudanças de lógica precisam de testes. Inclua casos de erro e borda.
- **Nomes em português.** Variáveis, funções e componentes usam português, seguindo o padrão do projeto. Mensagens de commit são em português; código pode misturar com inglês quando fizer sentido (ex.: nomes de bibliotecas).

## Acessibilidade

O Auditaja deve ser acessível a todas as pessoas. Ao contribuir com mudanças visuais:

- **Teste com teclado.** Toda interação deve funcionar sem mouse.
- **Teste com leitor de tela.** Use NVDA (Windows), VoiceOver (macOS/iOS) ou Orca (Linux).
- **Contraste adequado.** Texto sobre fundo deve ter razão de contraste de pelo menos 4.5:1 (AA).
- **Tema escuro.** Confira se a mudança funciona no tema claro e no escuro.
- **Celular.** Teste em viewport de celular (o CI roda e2e em "celular").
- **Textos alternativos.** Imagens precisam de `alt` descritivo; ícones decorativos usam `aria-hidden`.
- **Semântica.** Use elementos HTML corretos (`<button>`, `<a>`, `<nav>`, `<main>`, `<h1>`–`<h6>`).

Se tiver dúvidas, consulte as [Diretrizes de Acessibilidade para Conteúdo Web (WCAG) 2.2](https://www.w3.org/WAI/standards-guidelines/wcag/).

## Contribuindo com dados

O Auditaja coleta dados de fontes públicas oficiais. Se você quer adicionar uma nova fonte de dados:

### Requisitos obrigatórios

1. **Fonte oficial.** O dado deve vir de portal de dados abertos ou página oficial de órgão público (Câmara, Senado, TSE, CGU, etc.). Não aceitamos dados de sites de terceiros, redes sociais ou fontes não verificáveis.

2. **Proveniência registrada.** Toda coleta deve registrar na tabela `coleta`: URL da fonte, data da coleta, hash SHA-256 do arquivo e licença. O site mostra a fonte em cada seção — isso não é opcional.

3. **Minimização de dados pessoais.** Não coletamos CPF de parlamentar, nome de passageiros da CEAP, descrição livre de bens (pode conter endereço) nem qualquer dado pessoal além do necessário. Veja as regras R1–R13 no [AGENTS.md](AGENTS.md).

4. **Coleta educada.** Os coletores usam o `ClienteEducado` (`packages/ingest/src/http.ts`): User-Agent identificado, respeito ao `robots.txt`, máximo de 1 requisição por segundo (ou o `Crawl-delay`), backoff em 429/5xx e parada em 401/403.

5. **Link para o documento.** A issue ou PR deve incluir o link para a documentação da fonte (API, formato do arquivo, dicionário de dados).

### Como propor

1. Abra uma [issue de sugestão](https://github.com/leonardo-moraes360/auditaja/issues/new?template=feature.yml) explicando:
   - Qual dado você quer adicionar.
   - De onde ele viria (link da fonte oficial).
   - Por que é útil para a fiscalização cidadã.

2. Aguarde a discussão. Nem toda fonte faz sentido para o escopo do projeto.

3. Se aprovado, implemente o coletor em `packages/ingest` seguindo os padrões existentes.

### Correção de dado existente

Se um dado no site está diferente da fonte oficial:

- **Use o formulário "Contestar"** no perfil do parlamentar. O pedido não é público e você não precisa informar e-mail.
- Ou abra uma [issue de correção de dado](https://github.com/leonardo-moraes360/auditaja/issues/new?template=correcao-de-dado.yml) com o link da fonte que comprova.

Se a fonte oficial está errada, o caminho é pedir a correção ao órgão que publica o dado.

## Processo de revisão

1. **Revisão inicial.** O mantenedor verifica se o PR segue este guia, se os checks passam e se a mudança faz sentido para o projeto.

2. **Feedback.** Pode haver comentários pedindo ajustes. Responda aos comentários e faça as mudanças solicitadas na mesma branch.

3. **Aprovação e merge.** Quando tudo estiver certo, o mantenedor aprova e faz o merge. O deploy para produção acontece automaticamente depois.

### Tempo de resposta

O projeto é mantido por voluntários. PRs são revisados conforme a disponibilidade — pode levar alguns dias. PRs maiores ou mais complexos demoram mais.

Para acelerar a revisão:
- Mantenha o PR pequeno e focado em uma coisa só.
- Preencha o template de PR completamente.
- Garanta que todos os checks passam.
- Inclua prints para mudanças visuais (desktop, celular, tema claro, tema escuro).

## Licenças

Ao contribuir com o Auditaja, você concorda que suas contribuições serão licenciadas sob as mesmas licenças do projeto:

| O quê                              | Licença                                                                 |
| ---------------------------------- | ----------------------------------------------------------------------- |
| Código-fonte                       | [GNU AGPL-3.0 ou posterior](LICENSE)                                    |
| Dados e textos produzidos pelo Auditaja | [CC BY 4.0](LICENSE-DATA)                                          |

### Inbound = Outbound

Não usamos CLA (Contributor License Agreement). Contribuições entram sob a mesma licença do projeto, seguindo o modelo [inbound=outbound](https://opensource.guide/legal/#does-my-project-need-an-additional-contributor-agreement).

Isso significa que:
- Código que você contribui fica sob AGPL-3.0-or-later.
- Documentação e dados que você contribui ficam sob CC BY 4.0.
- Você mantém os direitos autorais do que escreveu.
- Você garante que tem o direito de contribuir esse código (é seu ou tem permissão).

### DCO (Developer Certificate of Origin)

Ao enviar um commit, você declara que tem o direito de submeter a contribuição sob as licenças do projeto, conforme o [Developer Certificate of Origin](https://developercertificate.org/):

> Eu certifico que: (a) a contribuição foi criada total ou parcialmente por mim e eu tenho o direito de submetê-la sob a licença de código aberto indicada no arquivo; ou (b) a contribuição é baseada em trabalho anterior que, até onde eu sei, é coberto por uma licença de código aberto compatível e eu tenho o direito sob essa licença de submeter esse trabalho com modificações; ou (c) a contribuição foi fornecida diretamente a mim por outra pessoa que certificou (a), (b) ou (c) e eu não a modifiquei.

---

Dúvidas? Abra uma [issue de sugestão](https://github.com/leonardo-moraes360/auditaja/issues/new?template=feature.yml) ou comente em uma issue existente.
