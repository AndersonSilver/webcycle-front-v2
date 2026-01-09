# 🔍 Verificar URLs do GitHub no docker-compose.yml

## ❌ Erro:
```
failed to solve: dockerfile parse error on line 8: unknown instruction: <!DOCTYPE
```

Isso significa que o Docker está recebendo uma página HTML (erro 404) ao invés do código.

## ✅ Verificar e Corrigir:

### 1. Verificar URLs no docker-compose.yml

```bash
# Ver quais URLs estão configuradas
grep -A 2 "psico_frontend:" docker-compose.yml | grep "context:"
grep -A 2 "psico_backend:" docker-compose.yml | grep "context:"
```

### 2. URLs Corretas Devem Ser:

```yaml
# Frontend - deve apontar para TB-PSICO-FRONT
psico_frontend:
  build:
    context: https://github_pat_TOKEN@github.com/AndersonSilver/TB-PSICO-FRONT.git#main

# Backend - deve apontar para TB-PSICO-BACK  
psico_backend:
  build:
    context: https://github_pat_TOKEN@github.com/AndersonSilver/TB-PSICO-BACK.git#main
```

### 3. Verificar se Repositórios Existem

Teste manualmente:

```bash
# Testar acesso ao frontend
curl -L "https://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@github.com/AndersonSilver/TB-PSICO-FRONT/raw/main/Dockerfile"

# Testar acesso ao backend
curl -L "https://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@github.com/AndersonSilver/TB-PSICO-BACK/raw/main/Dockerfile"
```

**Se retornar HTML ou erro 404:**
- Repositório não existe
- Token sem acesso
- Branch errada (#main vs #master)

### 4. Editar docker-compose.yml

```bash
nano docker-compose.yml
```

**Verifique se as URLs estão assim:**

```yaml
psico_frontend:
  build:
    context: https://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@github.com/AndersonSilver/TB-PSICO-FRONT.git#main

psico_backend:
  build:
    context: https://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@github.com/AndersonSilver/TB-PSICO-BACK.git#main
```

**NÃO deve ter:**
- `webcycle-back-v2.git` (esse é outro projeto)
- URLs diferentes dos repositórios PSICO

### 5. Se os Repositórios Não Existem no GitHub

**Opção A:** Criar os repositórios no GitHub:
- `TB-PSICO-FRONT`
- `TB-PSICO-BACK`

**Opção B:** Usar build local (se você tem o código na VPS):

```yaml
psico_frontend:
  build:
    context: ./TB-PSICO-FRONT  # Build local
    dockerfile: Dockerfile

psico_backend:
  build:
    context: ./TB-PSICO-BACK   # Build local
    dockerfile: Dockerfile
    target: production
```

### 6. Verificar Branch

Se seus repositórios usam `master` ao invés de `main`:

```yaml
# Trocar #main por #master
context: ...TB-PSICO-FRONT.git#master
```

## 🚀 Depois de Corrigir:

```bash
# Validar configuração
docker compose config

# Tentar build novamente
docker compose build psico_frontend psico_backend
```

