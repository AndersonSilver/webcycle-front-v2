# 🔧 Instalar Docker Compose na VPS

## Opção 1: Usar Docker Compose integrado (Recomendado - mais novo)

Se você tem Docker instalado, pode usar `docker compose` (sem hífen):

```bash
# Verificar se Docker está instalado
docker --version

# Usar docker compose (sem hífen)
docker compose build psico_frontend psico_backend
docker compose up -d psico_frontend psico_backend psico_postgres_db
docker compose ps
docker compose logs -f
```

## Opção 2: Instalar docker-compose (com hífen)

Se preferir usar `docker-compose` (com hífen):

```bash
# Instalar docker-compose
apt update
apt install docker-compose -y

# Verificar instalação
docker-compose --version

# Agora pode usar normalmente
docker-compose build psico_frontend psico_backend
docker-compose up -d psico_frontend psico_backend psico_postgres_db
```

## Opção 3: Instalar versão mais recente do docker-compose

Para instalar a versão mais recente do docker-compose:

```bash
# Baixar a versão mais recente
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# Dar permissão de execução
chmod +x /usr/local/bin/docker-compose

# Verificar instalação
docker-compose --version

# Criar link simbólico (se necessário)
ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose
```

## ✅ Verificar qual usar

```bash
# Testar docker compose (sem hífen)
docker compose version

# Se funcionar, use:
docker compose build
docker compose up -d

# Se não funcionar, instale docker-compose (com hífen)
apt install docker-compose -y
docker-compose build
docker-compose up -d
```

## 🚀 Comandos após instalação

Depois de instalar, use os comandos normalmente:

```bash
# Construir os serviços PSICO
docker compose build psico_frontend psico_backend
# ou
docker-compose build psico_frontend psico_backend

# Iniciar os serviços
docker compose up -d psico_frontend psico_backend psico_postgres_db
# ou
docker-compose up -d psico_frontend psico_backend psico_postgres_db

# Ver status
docker compose ps
# ou
docker-compose ps

# Ver logs
docker compose logs -f psico_backend
# ou
docker-compose logs -f psico_backend
```

