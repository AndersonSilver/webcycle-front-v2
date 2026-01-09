# 🔐 Tratamento do Callback do Google OAuth

## ✅ O que foi implementado no Frontend

O frontend agora captura automaticamente o token quando o backend redireciona após o login com Google.

### Fluxo Completo:

1. **Usuário clica em "Login com Google"**
   - Frontend redireciona para: `http://localhost:3001/api/auth/google`

2. **Backend redireciona para Google**
   - Google autentica o usuário

3. **Google redireciona para o backend**
   - URL: `http://localhost:3001/api/auth/google/callback`

4. **Backend processa e redireciona para o frontend**
   - **IMPORTANTE:** O backend deve redirecionar para: `http://localhost:3000/?token=SEU_TOKEN_AQUI`
   - O token deve estar na query string `?token=...`

5. **Frontend captura o token automaticamente**
   - O código em `App.tsx` verifica se há `?token=` na URL
   - Salva o token no `localStorage`
   - Carrega os dados do usuário
   - Remove o token da URL para limpar a barra de endereços

## 🔧 Configuração do Backend

O backend precisa redirecionar para o frontend com o token na URL:

```typescript
// No callback do Google OAuth no backend
res.redirect(`http://localhost:3000/?token=${token}`);
```

**Ou usando variável de ambiente:**
```typescript
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
res.redirect(`${FRONTEND_URL}?token=${token}`);
```

## 📋 Checklist

- [x] Frontend captura token da URL automaticamente
- [x] Frontend salva token no localStorage
- [x] Frontend carrega dados do usuário após login
- [ ] **Backend redireciona para frontend com token na URL** ← Verificar isso!

## 🔍 Como Verificar

1. Faça login com Google
2. Após autenticar no Google, você deve ser redirecionado para: `http://localhost:3000/?token=...`
3. O frontend deve capturar o token e fazer login automaticamente
4. A URL deve ser limpa (sem o `?token=...`)

## ⚠️ Se não funcionar

Verifique no backend se o callback está redirecionando corretamente:

```typescript
// Exemplo de callback no backend (ajuste conforme sua implementação)
router.get('/google/callback', 
  passport.authenticate('google', { session: false }),
  async (req, res) => {
    const user = req.user;
    const token = generateToken(user); // Seu método de gerar token
    
    // Redirecionar para frontend COM o token
    res.redirect(`http://localhost:3000/?token=${token}`);
  }
);
```

