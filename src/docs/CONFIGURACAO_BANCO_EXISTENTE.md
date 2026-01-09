# ✅ Configuração PSICO usando Banco Existente

Você já tem o banco `postgres_db_psico` configurado! Vamos usar ele.

## 📋 Configuração do Banco Existente:

- **Container:** `psico_postgres_db`
- **Serviço:** `postgres_db_psico`
- **Porta Externa:** `5434`
- **Porta Interna:** `5432`
- **Usuário:** `psicologia`
- **Senha:** `30112020699130`
- **Database:** `psicologia-client`
- **Volume:** `psico_data_new`
- **Network:** `webcycle_network`

## 🔧 O que fazer:

### 1. Adicionar apenas Frontend e Backend ao docker-compose.yml

Use o arquivo `SERVICOS_PSICO_USANDO_BANCO_EXISTENTE.yml` que contém apenas:
- `psico_frontend`
- `psico_backend`

**NÃO precisa adicionar um novo banco PostgreSQL!**

### 2. Configuração do Backend

O backend já está configurado para usar o banco existente:

```yaml
environment:
  - DB_HOST=psico_postgres_db      # Nome do container
  - DB_PORT=5432                    # Porta interna
  - DB_USERNAME=psicologia          # Usuário existente
  - DB_PASSWORD=30112020699130      # Senha existente
  - DB_DATABASE=psicologia-client   # Database existente
```

### 3. Dependência

O backend depende do serviço existente:

```yaml
depends_on:
  - postgres_db_psico  # Serviço existente
```

### 4. Adicionar apenas um volume

Na seção `volumes:`, adicione apenas:

```yaml
volumes:
  postgres_data:
  prometheus_data:
  postgres_staging_data:
  grafana_data:
  redis_data:
  psico_data_new:        # Já existe!
  psico_backend_uploads: # ADICIONAR APENAS ESTE
```

## 🚀 Deploy

```bash
# Construir apenas frontend e backend
docker compose build psico_frontend psico_backend

# Iniciar (o banco já está rodando)
docker compose up -d psico_frontend psico_backend

# Verificar
docker compose ps

# Ver logs
docker compose logs -f psico_backend
```

## ⚠️ Importante:

1. **Não crie um novo banco** - use o `postgres_db_psico` existente
2. **O banco já está na mesma network** (`webcycle_network`)
3. **Use o database `psicologia-client`** que já existe
4. **A porta externa 5434** continua funcionando normalmente

## 🔍 Verificar Conexão:

```bash
# Testar conexão do backend com o banco
docker compose exec psico_backend sh
# Dentro do container:
node -e "console.log(process.env.DB_HOST)"
# Deve mostrar: psico_postgres_db

# Testar conexão direta ao banco
docker compose exec psico_postgres_db psql -U psicologia -d psicologia-client -c "SELECT version();"
```

## 📝 Variáveis no .env

Você ainda precisa adicionar as variáveis PSICO no `.env`, mas **NÃO precisa** das variáveis de banco (já estão hardcoded):

```bash
# NÃO precisa destas (já configuradas no docker-compose.yml):
# PSICO_DB_USERNAME=psicologia
# PSICO_DB_PASSWORD=30112020699130
# PSICO_DB_DATABASE=psicologia-client

# Precisa apenas destas:
PSICO_JWT_SECRET=seu_jwt_secret
PSICO_JWT_REFRESH_SECRET=seu_refresh_secret
PSICO_SESSION_SECRET=seu_session_secret
PSICO_GOOGLE_CLIENT_ID=seu_client_id
PSICO_GOOGLE_CLIENT_SECRET=seu_client_secret
# ... resto das variáveis
```

