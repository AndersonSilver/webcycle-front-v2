# 🔧 Resolver Erros do Deploy PSICO

## ❌ Problemas Encontrados:

1. Variáveis de ambiente não definidas no `.env`
2. Serviço `psico_postgres_db` não encontrado no docker-compose.yml

## ✅ Solução Passo a Passo:

### 1. Verificar se os serviços PSICO foram adicionados ao docker-compose.yml

```bash
# Verificar se o serviço psico_postgres_db existe
grep -n "psico_postgres_db" docker-compose.yml

# Se não aparecer nada, você precisa adicionar os serviços
```

### 2. Adicionar os serviços PSICO ao docker-compose.yml

```bash
# Editar o arquivo
nano docker-compose.yml
```

**Adicione ANTES da linha `networks:` (por volta da linha 211):**

```yaml
  # ==================================================
  # PSICO - Frontend (Vite/React na porta 8082)
  # ==================================================
  psico_frontend:
    container_name: psico_frontend
    restart: always
    build:
      context: https://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@github.com/AndersonSilver/TB-PSICO-FRONT.git#main
      dockerfile: Dockerfile
      args:
        - VITE_API_URL=${PSICO_VITE_API_URL:-https://api.psico.com.br/api}
        - VITE_MERCADOPAGO_PUBLIC_KEY=${PSICO_VITE_MERCADOPAGO_PUBLIC_KEY}
        - VITE_GOOGLE_CLIENT_ID=${PSICO_VITE_GOOGLE_CLIENT_ID}
    environment:
      - NODE_ENV=production
      - PORT=80
    ports:
      - "8082:80"
    depends_on:
      - psico_backend
    networks:
      - webcycle_network
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:80/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # ==================================================
  # PSICO - Backend/API (na porta 8083)
  # ==================================================
  psico_backend:
    container_name: psico_backend
    restart: always
    build:
      context: https://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@github.com/AndersonSilver/TB-PSICO-BACK.git#main
      dockerfile: Dockerfile
      target: production
    environment:
      - DB_HOST=psico_postgres_db
      - DB_PORT=5432
      - DB_USERNAME=${PSICO_DB_USERNAME:-psicologia}
      - DB_PASSWORD=${PSICO_DB_PASSWORD:-30112020699130}
      - DB_DATABASE=${PSICO_DB_DATABASE:-tb_psico}
      - DB_SYNCHRONIZE=${PSICO_DB_SYNCHRONIZE:-false}
      - DB_LOGGING=${PSICO_DB_LOGGING:-false}
      - JWT_SECRET=${PSICO_JWT_SECRET}
      - JWT_EXPIRES_IN=${PSICO_JWT_EXPIRES_IN:-7d}
      - JWT_REFRESH_SECRET=${PSICO_JWT_REFRESH_SECRET}
      - JWT_REFRESH_EXPIRES_IN=${PSICO_JWT_REFRESH_EXPIRES_IN:-30d}
      - GOOGLE_CLIENT_ID=${PSICO_GOOGLE_CLIENT_ID}
      - GOOGLE_CLIENT_SECRET=${PSICO_GOOGLE_CLIENT_SECRET}
      - GOOGLE_CALLBACK_URL=${PSICO_GOOGLE_CALLBACK_URL}
      - MERCADOPAGO_ACCESS_TOKEN=${PSICO_MERCADOPAGO_ACCESS_TOKEN}
      - MERCADOPAGO_PUBLIC_KEY=${PSICO_MERCADOPAGO_PUBLIC_KEY}
      - MERCADOPAGO_WEBHOOK_SECRET=${PSICO_MERCADOPAGO_WEBHOOK_SECRET}
      - MERCADOPAGO_WEBHOOK_URL=${PSICO_MERCADOPAGO_WEBHOOK_URL}
      - AZURE_STORAGE_ACCOUNT_NAME=${PSICO_AZURE_STORAGE_ACCOUNT_NAME}
      - AZURE_STORAGE_ACCOUNT_KEY=${PSICO_AZURE_STORAGE_ACCOUNT_KEY}
      - AZURE_STORAGE_CONTAINER_NAME=${PSICO_AZURE_STORAGE_CONTAINER_NAME}
      - AZURE_STORAGE_CONNECTION_STRING=${PSICO_AZURE_STORAGE_CONNECTION_STRING}
      - SMTP_HOST=${PSICO_SMTP_HOST:-smtp.gmail.com}
      - SMTP_PORT=${PSICO_SMTP_PORT:-587}
      - SMTP_USER=${PSICO_SMTP_USER}
      - SMTP_PASS=${PSICO_SMTP_PASS}
      - SMTP_FROM=${PSICO_SMTP_FROM}
      - PORT=3001
      - NODE_ENV=production
      - FRONTEND_URL=${PSICO_FRONTEND_URL:-https://psico.com.br}
      - CORS_ORIGIN=${PSICO_CORS_ORIGIN:-https://psico.com.br}
      - SESSION_SECRET=${PSICO_SESSION_SECRET}
    ports:
      - "8083:3001"
    volumes:
      - psico_backend_uploads:/app/temp-uploads
    depends_on:
      - psico_postgres_db
    networks:
      - webcycle_network
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # ==================================================
  # PSICO - Banco de Dados PostgreSQL (porta 5435)
  # ==================================================
  psico_postgres_db:
    image: postgres:16-alpine
    container_name: psico_postgres_db
    restart: always
    environment:
      - POSTGRES_USER=${PSICO_DB_USERNAME:-psicologia}
      - POSTGRES_PASSWORD=${PSICO_DB_PASSWORD:-30112020699130}
      - POSTGRES_DB=${PSICO_DB_DATABASE:-tb_psico}
    ports:
      - "5435:5432"
    volumes:
      - psico_postgres_data:/var/lib/postgresql/data
    command: -c 'shared_preload_libraries=uuid-ossp'
    networks:
      - webcycle_network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${PSICO_DB_USERNAME:-psicologia}"]
      interval: 10s
      timeout: 5s
      retries: 5
```

**Adicione na seção `volumes:` (no final do arquivo):**

```yaml
volumes:
  postgres_data:
  prometheus_data:
  postgres_staging_data:
  grafana_data:
  redis_data:
  psico_data_new:
  psico_postgres_data:      # ADICIONAR
  psico_backend_uploads:    # ADICIONAR
```

### 3. Adicionar variáveis no arquivo .env

```bash
# Editar o .env
nano .env
```

**Adicione no final do arquivo:**

```bash
# ============================================
# VARIÁVEIS PSICO
# ============================================

# Banco de Dados
PSICO_DB_USERNAME=psicologia
PSICO_DB_PASSWORD=30112020699130
PSICO_DB_DATABASE=tb_psico

# JWT (OBRIGATÓRIO - gere valores seguros)
PSICO_JWT_SECRET=ALTERE_AQUI_com_secret_seguro
PSICO_JWT_REFRESH_SECRET=ALTERE_AQUI_com_refresh_secret_seguro
PSICO_SESSION_SECRET=ALTERE_AQUI_com_session_secret_seguro

# Google OAuth
PSICO_GOOGLE_CLIENT_ID=seu_google_client_id
PSICO_GOOGLE_CLIENT_SECRET=seu_google_client_secret
PSICO_GOOGLE_CALLBACK_URL=https://psico.com.br/api/auth/google/callback
PSICO_VITE_GOOGLE_CLIENT_ID=seu_google_client_id

# Mercado Pago
PSICO_MERCADOPAGO_ACCESS_TOKEN=seu_token
PSICO_MERCADOPAGO_PUBLIC_KEY=sua_public_key
PSICO_MERCADOPAGO_WEBHOOK_SECRET=seu_webhook_secret
PSICO_MERCADOPAGO_WEBHOOK_URL=https://psico.com.br/api/webhooks/mercadopago
PSICO_VITE_MERCADOPAGO_PUBLIC_KEY=sua_public_key

# Azure Storage
PSICO_AZURE_STORAGE_ACCOUNT_NAME=seu_account
PSICO_AZURE_STORAGE_ACCOUNT_KEY=sua_key
PSICO_AZURE_STORAGE_CONTAINER_NAME=seu_container
PSICO_AZURE_STORAGE_CONNECTION_STRING=sua_connection_string

# Email
PSICO_SMTP_HOST=smtp.gmail.com
PSICO_SMTP_USER=seu_email@gmail.com
PSICO_SMTP_PASS=sua_senha_app
PSICO_SMTP_FROM=noreply@psico.com.br

# URLs
PSICO_FRONTEND_URL=https://psico.com.br
PSICO_CORS_ORIGIN=https://psico.com.br
PSICO_VITE_API_URL=https://api.psico.com.br/api
```

### 4. Gerar Secrets Seguros

```bash
# Gerar JWT Secret
openssl rand -base64 64

# Gerar Refresh Secret
openssl rand -base64 64

# Gerar Session Secret
openssl rand -base64 32

# Copie os resultados e cole no .env substituindo ALTERE_AQUI
```

### 5. Validar e Construir

```bash
# Validar o docker-compose.yml
docker compose config

# Se não houver erros, construir
docker compose build psico_frontend psico_backend

# Iniciar os serviços
docker compose up -d psico_frontend psico_backend psico_postgres_db

# Verificar status
docker compose ps

# Ver logs
docker compose logs -f psico_backend
```

## ⚠️ Importante:

1. **Substitua as URLs do GitHub** pelos seus repositórios reais
2. **Preencha TODAS as variáveis** no `.env` (especialmente os secrets)
3. **Remova a linha `version: '3.7'`** do início do docker-compose.yml (está obsoleta)

## 🔍 Verificar se está funcionando:

```bash
# Health check do backend
curl http://localhost:8083/health

# Verificar frontend
curl http://localhost:8082

# Verificar banco
docker compose exec psico_postgres_db psql -U psicologia -d tb_psico -c "SELECT version();"
```

