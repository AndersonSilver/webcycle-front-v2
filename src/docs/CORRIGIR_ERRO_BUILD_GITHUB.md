# 🔧 Corrigir Erro de Build do GitHub

## ❌ Erro Encontrado:

```
failed to solve: dockerfile parse error on line 8: unknown instruction: <!DOCTYPE
```

Isso significa que o Docker está recebendo uma página HTML (erro 404 ou página de login) ao invés do código do repositório.

## 🔍 Possíveis Causas:

1. **URL do GitHub incorreta** no docker-compose.yml
2. **Token sem permissão** para acessar o repositório
3. **Repositório não existe** ou está privado
4. **Branch não existe** (ex: `#main` vs `#master`)

## ✅ Solução:

### 1. Verificar URLs no docker-compose.yml

```bash
# Editar o docker-compose.yml
nano docker-compose.yml
```

**Verifique se as URLs estão corretas:**

```yaml
psico_frontend:
  build:
    # ✅ CORRETO - deve apontar para TB-PSICO-FRONT
    context: https://github_pat_TOKEN@github.com/AndersonSilver/TB-PSICO-FRONT.git#main
    
psico_backend:
  build:
    # ✅ CORRETO - deve apontar para TB-PSICO-BACK
    context: https://github_pat_TOKEN@github.com/AndersonSilver/TB-PSICO-BACK.git#main
```

**❌ ERRADO (o que estava tentando):**
```yaml
# webcycle-back-v2.git <- Este é outro projeto!
```

### 2. Verificar se os Repositórios Existem

Teste as URLs manualmente:

```bash
# Testar acesso ao repositório frontend
curl -H "Authorization: token SEU_TOKEN" https://api.github.com/repos/AndersonSilver/TB-PSICO-FRONT

# Testar acesso ao repositório backend
curl -H "Authorization: token SEU_TOKEN" https://api.github.com/repos/AndersonSilver/TB-PSICO-BACK
```

### 3. Verificar Token do GitHub

O token precisa ter permissão `repo` (acesso completo aos repositórios).

**Verificar token:**
```bash
# No docker-compose.yml, verifique se o token está correto
grep "github_pat" docker-compose.yml
```

### 4. Verificar Branch

Se seus repositórios usam `master` ao invés de `main`:

```yaml
# Trocar #main por #master se necessário
context: https://github_pat_TOKEN@github.com/AndersonSilver/TB-PSICO-FRONT.git#master
```

### 5. Testar URL Manualmente

```bash
# Testar se consegue acessar o Dockerfile
curl -L "https://github_pat_TOKEN@github.com/AndersonSilver/TB-PSICO-FRONT/raw/main/Dockerfile"

# Se retornar HTML, o problema é:
# - Token inválido
# - Repositório não existe
# - Repositório privado sem acesso
```

## 🔧 Correção Rápida:

### Opção 1: Usar Build Local (Mais Fácil)

Se você tem o código na VPS, pode fazer build local:

```yaml
psico_frontend:
  build:
    context: ./TB-PSICO-FRONT  # Build local ao invés de GitHub
    dockerfile: Dockerfile
```

### Opção 2: Corrigir URLs do GitHub

```bash
# Editar docker-compose.yml
nano docker-compose.yml

# Substituir as URLs pelos repositórios corretos:
# TB-PSICO-FRONT.git (não webcycle-back-v2.git)
# TB-PSICO-BACK.git (não webcycle-back-v2.git)
```

### Opção 3: Verificar se Repositórios Estão Públicos

Se os repositórios estão privados, você precisa:
1. Token com permissão `repo`
2. Token válido e não expirado

## 📝 Exemplo Correto:

```yaml
psico_frontend:
  container_name: psico_frontend
  restart: always
  build:
    context: https://GITHUB_TOKEN@github.com/AndersonSilver/TB-PSICO-FRONT.git#main
    dockerfile: Dockerfile
    args:
      - VITE_API_URL=${PSICO_VITE_API_URL:-https://api.psico.com.br/api}
      - VITE_MERCADOPAGO_PUBLIC_KEY=${PSICO_VITE_MERCADOPAGO_PUBLIC_KEY}
      - VITE_GOOGLE_CLIENT_ID=${PSICO_VITE_GOOGLE_CLIENT_ID}

psico_backend:
  container_name: psico_backend
  restart: always
  build:
    context: https://GITHUB_TOKEN@github.com/AndersonSilver/TB-PSICO-BACK.git#main
    dockerfile: Dockerfile
    target: production
```

## 🚀 Depois de Corrigir:

```bash
# Validar configuração
docker compose config

# Tentar build novamente
docker compose build psico_frontend psico_backend

# Se ainda der erro, ver logs detalhados
docker compose build --progress=plain psico_frontend 2>&1 | tail -50
```

