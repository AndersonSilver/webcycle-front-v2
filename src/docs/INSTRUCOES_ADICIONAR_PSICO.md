# 📝 Instruções para Adicionar Serviços PSICO ao docker-compose.yml

## 🎯 O que fazer:

### 1. Editar o docker-compose.yml na VPS

```bash
# Na VPS
nano docker-compose.yml
```

### 2. Adicionar os serviços PSICO

Cole os serviços do arquivo `SERVICOS_PSICO_ADICIONAR.yml` **ANTES** da seção `networks:` (por volta da linha 211).

### 3. Adicionar os volumes

Na seção `volumes:` (no final do arquivo), adicione:

```yaml
volumes:
  postgres_data:
  prometheus_data:
  postgres_staging_data:
  grafana_data:
  redis_data:
  psico_data_new:
  # ADICIONAR ESTES DOIS:
  psico_postgres_data:
  psico_backend_uploads:
```

### 4. Atualizar a versão (opcional)

Se quiser, mude a versão de `3.7` para `3.8` no início do arquivo.

## 🔧 Configurar Variáveis de Ambiente

Crie ou edite o arquivo `.env` na VPS e adicione as variáveis do PSICO:

```bash
nano .env
```

Adicione estas variáveis (substitua pelos valores reais):

```bash
# ============================================
# VARIÁVEIS PSICO
# ============================================

# Banco de Dados
PSICO_DB_USERNAME=psicologia
PSICO_DB_PASSWORD=sua_senha_segura
PSICO_DB_DATABASE=tb_psico

# JWT
PSICO_JWT_SECRET=seu_jwt_secret_aqui
PSICO_JWT_REFRESH_SECRET=seu_refresh_secret_aqui
PSICO_SESSION_SECRET=seu_session_secret_aqui

# Google OAuth
PSICO_GOOGLE_CLIENT_ID=seu_client_id
PSICO_GOOGLE_CLIENT_SECRET=seu_client_secret
PSICO_GOOGLE_CALLBACK_URL=https://psico.com.br/api/auth/google/callback
PSICO_VITE_GOOGLE_CLIENT_ID=seu_client_id

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

## 🚀 Deploy

Depois de adicionar os serviços:

```bash
# Construir as novas imagens
docker-compose build psico_frontend psico_backend

# Iniciar os novos serviços
docker-compose up -d psico_frontend psico_backend psico_postgres_db

# Verificar status
docker-compose ps

# Ver logs
docker-compose logs -f psico_backend
docker-compose logs -f psico_frontend
```

## 📊 Portas Configuradas

- **PSICO Frontend:** `http://seu-ip:8082`
- **PSICO Backend:** `http://seu-ip:8083`
- **PSICO PostgreSQL:** `porta 5435`

## ⚠️ Importante

1. **Substitua as URLs do GitHub** no docker-compose.yml pelos seus repositórios reais:
   - `TB-PSICO-FRONT.git` → seu repositório frontend
   - `TB-PSICO-BACK.git` → seu repositório backend

2. **Use o mesmo token do GitHub** que você já usa nos outros serviços

3. **Configure o Nginx Proxy Manager** para rotear:
   - `psico.com.br` → `psico_frontend:80`
   - `api.psico.com.br` → `psico_backend:3001`

4. **Execute as migrações** após o primeiro deploy:
   ```bash
   docker-compose exec psico_backend yarn migration:run
   ```

## 🔍 Verificar se está funcionando

```bash
# Health check do backend
curl http://localhost:8083/health

# Verificar frontend
curl http://localhost:8082

# Verificar banco
docker-compose exec psico_postgres_db psql -U psicologia -d tb_psico -c "SELECT version();"
```

