# Fora do Ar

Página estática para substituir o Auditaja quando o site precisa ficar fora do ar, seja por manutenção programada ou por determinação legal/judicial.

## Características

- **Totalmente independente** do app Next.js, banco de dados ou build
- **Dois modos**: manutenção (503) ou judicial (451)
- **Textos configuráveis** por variáveis de ambiente (sem editar HTML)
- **Acessível**: HTML semântico, bom contraste, funciona com leitor de tela, responsivo
- **SEO seguro**: `noindex, nofollow` em todas as respostas
- **HTTP correto**: 503 com `Retry-After` ou 451 com `Link rel="blocked-by"` (RFC 7725)
- **Catch-all**: qualquer rota retorna a página com o status correto
- **Seguro**: roda como usuário não-root

## Build e execução

```bash
cd apps/fora-do-ar
docker build -t auditaja-fora-do-ar .
```

### Modo manutenção (padrão)

```bash
docker run -p 80:8080 \
  -e TIPO=manutencao \
  -e RETRY_AFTER=3600 \
  -e PREVISAO_RETORNO="14/11/2026 às 18:00" \
  -e MOTIVO="Atualização de infraestrutura" \
  -e CONTATO_EMAIL="contato@auditaja.org.br" \
  auditaja-fora-do-ar
```

- Retorna HTTP 503 Service Unavailable
- Header `Retry-After` com o valor em segundos (padrão: 3600 = 1 hora)

### Modo judicial

```bash
docker run -p 80:8080 \
  -e TIPO=judicial \
  -e BLOCKED_BY_URL=https://www.tjsp.jus.br \
  -e AUTORIDADE="Tribunal de Justiça do Estado de São Paulo" \
  -e NUMERO_PROCESSO="0000000-00.0000.0.00.0000" \
  -e DATA_DETERMINACAO="13/11/2026" \
  -e CONTATO_EMAIL="contato@auditaja.org.br" \
  auditaja-fora-do-ar
```

- Retorna HTTP 451 Unavailable For Legal Reasons (RFC 7725)
- Header `Link: <URL>; rel="blocked-by"` com a URL da autoridade

## Variáveis de ambiente

### Comuns

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `TIPO` | Modo: `manutencao` ou `judicial` | `manutencao` |
| `CONTATO_EMAIL` | E-mail de contato (opcional) | — |

### Modo manutenção

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `RETRY_AFTER` | Segundos para o header Retry-After | `3600` |
| `PREVISAO_RETORNO` | Data/hora prevista para retorno (opcional) | — |
| `MOTIVO` | Motivo breve da manutenção (opcional) | — |

### Modo judicial

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `BLOCKED_BY_URL` | URL da autoridade para o header Link | `https://example.gov.br` |
| `AUTORIDADE` | Nome da autoridade que determinou (opcional) | — |
| `NUMERO_PROCESSO` | Número do processo ou referência (opcional) | — |
| `DATA_DETERMINACAO` | Data da determinação (opcional) | — |

**Nota:** Variáveis opcionais não definidas ou vazias omitem a linha correspondente da página. Os valores são escapados para HTML automaticamente.

## Deploy no Coolify

A ideia é manter o serviço fora-do-ar sempre criado e publicado, e apenas mover o domínio entre os serviços para evitar downtime.

### Configuração inicial (uma vez)

1. No Coolify, crie um novo serviço para a página fora-do-ar:
   - **Build Pack**: Dockerfile
   - **Dockerfile Location**: `apps/fora-do-ar/Dockerfile`
   - **Porta**: 8080
2. Configure as variáveis de ambiente necessárias (TIPO, etc.)
3. Faça o deploy do serviço (ele fica rodando, mas sem domínio público)

### Ativar (colocar o site fora do ar)

1. No serviço do app Next.js, remova o domínio principal
2. No serviço fora-do-ar, adicione o domínio principal
3. O tráfego passa a ir para a página fora-do-ar imediatamente

### Desativar (voltar ao app)

1. No serviço fora-do-ar, remova o domínio principal
2. No serviço do app Next.js, adicione o domínio principal
3. O tráfego volta para o app Next.js imediatamente

**Vantagem:** Nenhum serviço é pausado ou reiniciado, apenas o roteamento muda. A troca é instantânea e sem downtime.

## Verificação

```bash
# Build
docker build -t auditaja-fora-do-ar .

# Modo manutenção com variáveis
docker run -d --name fora-test -p 8080:8080 \
  -e TIPO=manutencao \
  -e PREVISAO_RETORNO="14/11/2026 às 18:00" \
  -e MOTIVO="Atualização de infraestrutura" \
  -e CONTATO_EMAIL="contato@auditaja.org.br" \
  auditaja-fora-do-ar

curl -I http://localhost:8080/
# Deve retornar 503 com Retry-After

curl http://localhost:8080/ | grep -E "(Previsão|Motivo|contato)"
# Deve mostrar os valores configurados

docker stop fora-test && docker rm fora-test

# Modo judicial com variáveis
docker run -d --name fora-test -p 8080:8080 \
  -e TIPO=judicial \
  -e BLOCKED_BY_URL=https://www.tjsp.jus.br \
  -e AUTORIDADE="TJSP" \
  -e NUMERO_PROCESSO="1234567-89.2026.8.26.0000" \
  -e DATA_DETERMINACAO="13/11/2026" \
  auditaja-fora-do-ar

curl -I http://localhost:8080/
# Deve retornar 451 com Link rel="blocked-by"

curl http://localhost:8080/ | grep -E "(Autoridade|Referência|Data)"
# Deve mostrar os valores configurados

docker stop fora-test && docker rm fora-test

# Teste sem variáveis (linhas devem sumir)
docker run -d --name fora-test -p 8080:8080 -e TIPO=manutencao auditaja-fora-do-ar

curl http://localhost:8080/ | grep -c "Previsão"
# Deve retornar 0 (linha não existe)

docker stop fora-test && docker rm fora-test
```

## Estrutura

```
apps/fora-do-ar/
├── Dockerfile              # Imagem baseada em nginx:alpine (não-root)
├── entrypoint.sh           # Seleciona modo e substitui variáveis no startup
├── favicon.ico             # Ícone do site
├── judicial.html           # Template para modo judicial (451)
├── manutencao.html         # Template para modo manutenção (503)
├── nginx-judicial.conf     # Config nginx para modo judicial
├── nginx-manutencao.conf   # Config nginx para modo manutenção
├── styles.css              # Estilos compartilhados
└── README.md               # Esta documentação
```
