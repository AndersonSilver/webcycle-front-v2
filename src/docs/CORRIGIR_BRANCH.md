# 🔧 Corrigir Branch no docker-compose.yml

## ✅ Seu Repositório Está Correto!

Você subiu como `webcycle-back-v2`, então a URL está certa. O problema é apenas a **branch**.

## ❌ Erro Atual:

```yaml
context: ...webcycle-back-v2.git#master  # ❌ Branch master não existe
```

## ✅ Correção:

### 1. Editar docker-compose.yml

```bash
nano docker-compose.yml
```

### 2. Trocar `#master` por `#main`

**Encontre:**
```yaml
psico_backend:
  build:
    context: https://github_pat_TOKEN@github.com/AndersonSilver/webcycle-back-v2.git#master
```

**Substitua por:**
```yaml
psico_backend:
  build:
    context: https://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@github.com/AndersonSilver/webcycle-back-v2.git#main
    dockerfile: Dockerfile
    target: production
```

### 3. Verificar Qual Branch Existe

Se não souber qual branch usar, teste:

```bash
# Testar branch main
curl -L "https://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@github.com/AndersonSilver/webcycle-back-v2/raw/main/Dockerfile"

# Se retornar erro, testar master
curl -L "https://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@github.com/AndersonSilver/webcycle-back-v2/raw/master/Dockerfile"
```

### 4. Se Usar Outra Branch

Se seu repositório usa outra branch (ex: `develop`, `production`), use:

```yaml
context: ...webcycle-back-v2.git#nome-da-branch
```

## 🚀 Depois de Corrigir:

```bash
# Tentar build novamente
docker compose build psico_backend

# Se funcionar, construir frontend também
docker compose build psico_frontend psico_backend
```

## 📝 Resumo:

- ✅ Repositório correto: `webcycle-back-v2`
- ❌ Branch errada: `#master` 
- ✅ Branch correta: `#main` (ou a branch que você realmente usa)

