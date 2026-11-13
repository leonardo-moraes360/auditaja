# Fora do Ar

Página estática para substituir o Auditaja quando o site precisa ficar fora do ar, seja por manutenção programada ou por determinação legal/judicial.

## Características

- **Totalmente independente** do app Next.js, banco de dados ou build
- **Dois modos**: manutenção (503) ou judicial (451)
- **Acessível**: HTML semântico, bom contraste, funciona com leitor de tela, responsivo
- **SEO seguro**: `noindex, nofollow` em todas as respostas
- **HTTP correto**: 503 com `Retry-After` ou 451 com `Link rel="blocked-by"` (RFC 7725)
- **Catch-all**: qualquer rota retorna a página com o status correto

## Build e execução

```bash
cd apps/fora-do-ar
docker build -t auditaja-fora-do-ar .
```

### Modo manutenção (padrão)

```bash
docker run -p 8080:80 \
  -e TIPO=manutencao \
  -e RETRY_AFTER=3600 \
  auditaja-fora-do-ar
```

- Retorna HTTP 503 Service Unavailable
- Header `Retry-After` com o valor em segundos (padrão: 3600 = 1 hora)

### Modo judicial

```bash
docker run -p 8080:80 \
  -e TIPO=judicial \
  -e BLOCKED_BY_URL=https://www.tjsp.jus.br \
  auditaja-fora-do-ar
```

- Retorna HTTP 451 Unavailable For Legal Reasons (RFC 7725)
- Header `Link: <URL>; rel="blocked-by"` com a URL da autoridade

## Variáveis de ambiente

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `TIPO` | Modo: `manutencao` ou `judicial` | `manutencao` |
| `RETRY_AFTER` | Segundos para o header Retry-After (modo manutenção) | `3600` |
| `BLOCKED_BY_URL` | URL da autoridade para o header Link (modo judicial) | `https://example.gov.br` |

## Personalização do conteúdo

Os arquivos HTML (`manutencao.html` e `judicial.html`) contêm placeholders em comentários HTML que podem ser editados antes do build ou substituídos no container:

### manutencao.html

- `<!-- PREVISAO_RETORNO -->`: Data/hora prevista para retorno
- `<!-- MOTIVO_MANUTENCAO -->`: Motivo breve da manutenção
- `<!-- CONTATO_EMAIL -->`: E-mail de contato

### judicial.html

- `<!-- AUTORIDADE -->`: Nome da autoridade que determinou
- `<!-- NUMERO_PROCESSO -->`: Número do processo ou referência
- `<!-- DATA_DETERMINACAO -->`: Data da determinação
- `<!-- CONTATO_EMAIL -->`: E-mail de contato

Para personalizar em runtime, monte um arquivo editado:

```bash
docker run -p 8080:80 \
  -e TIPO=manutencao \
  -v $(pwd)/minha-pagina.html:/usr/share/nginx/html/manutencao.html:ro \
  auditaja-fora-do-ar
```

## Deploy no Coolify

Para substituir o app principal pelo modo fora-do-ar:

### Ativar

1. No Coolify, vá ao projeto Auditaja
2. Pause ou delete o deployment atual do app Next.js
3. Crie um novo deployment apontando para `apps/fora-do-ar/Dockerfile`:
   - **Build Pack**: Dockerfile
   - **Dockerfile Location**: `apps/fora-do-ar/Dockerfile`
   - **Variáveis de ambiente**: configure `TIPO`, `RETRY_AFTER` ou `BLOCKED_BY_URL`
4. Aponte o domínio para o novo deployment

### Desativar (voltar ao app)

1. Pause ou delete o deployment da página fora-do-ar
2. Reative o deployment do app Next.js
3. Aponte o domínio de volta para o app

## Verificação

```bash
# Build
docker build -t auditaja-fora-do-ar .

# Modo manutenção
docker run -d --name fora-test -p 8080:80 -e TIPO=manutencao auditaja-fora-do-ar

curl -I http://localhost:8080/
# Deve retornar 503 com Retry-After

curl -I http://localhost:8080/parlamentares/123
# Deve retornar 503

curl -I http://localhost:8080/api/qualquer-coisa
# Deve retornar 503

docker stop fora-test && docker rm fora-test

# Modo judicial
docker run -d --name fora-test -p 8080:80 -e TIPO=judicial -e BLOCKED_BY_URL=https://www.tjsp.jus.br auditaja-fora-do-ar

curl -I http://localhost:8080/
# Deve retornar 451 com Link rel="blocked-by"

docker stop fora-test && docker rm fora-test
```

## Estrutura

```
apps/fora-do-ar/
├── Dockerfile              # Imagem baseada em nginx:alpine
├── entrypoint.sh           # Script que seleciona o modo no startup
├── favicon.ico             # Ícone do site
├── judicial.html           # Página para modo judicial (451)
├── manutencao.html         # Página para modo manutenção (503)
├── nginx-judicial.conf     # Config nginx para modo judicial
├── nginx-manutencao.conf   # Config nginx para modo manutenção
├── styles.css              # Estilos compartilhados
└── README.md               # Esta documentação
```
