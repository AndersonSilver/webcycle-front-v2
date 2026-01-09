# 🔧 Corrigir URLs no docker-compose.yml

## ❌ Erros Encontrados:

1. **Backend apontando para repositório errado:**
   - ❌ `webcycle-back-v2.git` 
   - ✅ Deveria ser `TB-PSICO-BACK.git`

2. **Branch errada:**
   - ❌ `#master` (não existe)
   - ✅ Deveria ser `#main`

## ✅ Correção:

### 1. Editar docker-compose.yml

```bash
nano docker-compose.yml
```

### 2. Procurar e Corrigir o Backend

**Encontre esta linha (está errada):**
```yaml
psico_backend:
  build:
    context: https://github_pat_TOKEN@github.com/AndersonSilver/webcycle-back-v2.git#master
```

**Substitua por:**
```yaml
psico_backend:
  build:
    context: https://GITHUB_TOKEN@github.com/AndersonSilver/TB-PSICO-BACK.git#main
    dockerfile: Dockerfile
    target: production
```

### 3. Verificar Frontend Também

**Deve estar assim:**
```yaml
psico_frontend:
  build:
    context: https://GITHUB_TOKEN@github.com/AndersonSilver/TB-PSICO-FRONT.git#main
    dockerfile: Dockerfile
```

### 4. Verificar Rapidamente

```bash
# Verificar URLs do backend
grep -A 3 "psico_backend:" docker-compose.yml | grep "context:"

# Deve mostrar:
# context: ...TB-PSICO-BACK.git#main

# Verificar URLs do frontend
grep -A 3 "psico_frontend:" docker-compose.yml | grep "context:"

# Deve mostrar:
# context: ...TB-PSICO-FRONT.git#main
```

## 🚀 Depois de Corrigir:

```bash
# Validar configuração
docker compose config

# Tentar build novamente
docker compose build psico_frontend psico_backend
```

## 📝 Resumo das Correções:

| Serviço | ❌ Errado | ✅ Correto |
|---------|-----------|------------|
| Backend | `webcycle-back-v2.git#master` | `TB-PSICO-BACK.git#main` |
| Frontend | Verificar se está correto | `TB-PSICO-FRONT.git#main` |

## ⚠️ Se Ainda Der Erro:

Se o repositório realmente usar `master` ao invés de `main`:

```yaml
# Trocar #main por #master
context: ...TB-PSICO-BACK.git#master
```

Mas primeiro teste com `#main` que é o padrão do GitHub.

