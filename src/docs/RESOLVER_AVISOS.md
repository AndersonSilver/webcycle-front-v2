# ⚠️ Resolver Avisos do Docker Compose

## 🔧 Avisos Encontrados:

1. Variáveis não definidas no `.env`
2. Linha `version` obsoleta

## ✅ Solução Rápida:

### 1. Remover linha `version` obsoleta

```bash
# Editar docker-compose.yml
nano docker-compose.yml

# Remover ou comentar a primeira linha:
# version: '3.7'  <- Remover esta linha
```

### 2. Adicionar variáveis faltantes no .env (Opcional)

Os avisos são apenas informativos. O build vai funcionar mesmo sem essas variáveis, mas é melhor adicionar:

```bash
# Editar .env
nano .env
```

**Adicione estas variáveis (se ainda não tiver):**

```bash
# PSICO - Variáveis VITE para Frontend
PSICO_VITE_MERCADOPAGO_PUBLIC_KEY=sua_public_key_mercadopago
PSICO_VITE_GOOGLE_CLIENT_ID=seu_google_client_id
PSICO_VITE_API_URL=https://api.psico.com.br/api
```

## 🚀 Continuar o Build

Mesmo com os avisos, o build deve continuar normalmente:

```bash
# O build vai funcionar mesmo com os avisos
docker compose build psico_frontend psico_backend

# Se quiser ignorar os avisos completamente, pode continuar
docker compose up -d psico_frontend psico_backend
```

## 📝 Nota Importante:

- **Os avisos NÃO impedem o build** - são apenas informativos
- **As variáveis VITE são opcionais** - o frontend vai usar valores padrão se não estiverem definidas
- **A linha `version` é ignorada** - não causa problemas, mas é melhor remover

## ✅ Verificar se está funcionando:

```bash
# Ver logs do build
docker compose build psico_frontend psico_backend 2>&1 | tail -20

# Se o build completar com sucesso, iniciar os serviços
docker compose up -d psico_frontend psico_backend

# Verificar status
docker compose ps | grep psico

# Ver logs
docker compose logs -f psico_backend
```

