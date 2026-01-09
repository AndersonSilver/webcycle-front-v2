# 🔐 Configuração do Google OAuth

## ⚠️ Erro: redirect_uri_mismatch

Este erro ocorre quando a URI de redirecionamento configurada no Google Cloud Console não corresponde à que o backend está enviando.

## 🔧 Solução

### 1. Verificar a URI de Callback do Backend

O backend deve ter uma rota de callback como:
```
http://localhost:3001/api/auth/google/callback
```

### 2. Configurar no Google Cloud Console

No Google Cloud Console, na seção **"URIs de redirecionamento autorizados"**, adicione:

**Para Desenvolvimento:**
```
http://localhost:3001/api/auth/google/callback
```

**Para Produção:**
```
https://api.seudominio.com/api/auth/google/callback
```

### 3. Verificar o Código do Frontend

O frontend está redirecionando para:
```typescript
const apiBase = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001';
window.location.href = `${apiBase}/api/auth/google`;
```

Isso está correto! O frontend redireciona para o backend, e o backend lida com o OAuth.

### 4. Configuração Completa no Google Cloud Console

**URIs de redirecionamento autorizados devem incluir:**

1. **Desenvolvimento:**
   ```
   http://localhost:3001/api/auth/google/callback
   ```

2. **Produção:**
   ```
   https://api.seudominio.com/api/auth/google/callback
   ```

**Importante:**
- ✅ A URI deve corresponder **exatamente** (incluindo protocolo, porta e caminho)
- ✅ Não use `localhost` em produção
- ✅ As mudanças podem levar alguns minutos para entrar em vigor
- ✅ Após adicionar, clique em **"Salvar"**

### 5. Verificar no Backend

Certifique-se de que o backend está configurado com:

**Variáveis de ambiente do backend:**
```env
GOOGLE_CLIENT_ID=seu-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=sua-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback
```

## 📋 Checklist

- [ ] URI de callback adicionada no Google Cloud Console
- [ ] URI corresponde exatamente (protocolo, domínio, porta, caminho)
- [ ] Clicou em "Salvar" no Google Cloud Console
- [ ] Backend configurado com `GOOGLE_CALLBACK_URL` correto
- [ ] Aguardou alguns minutos para as mudanças entrarem em vigor
- [ ] Testou novamente o login

## 🔍 Debug

Se ainda não funcionar:

1. Verifique os logs do backend para ver qual URI está sendo enviada
2. Compare com a URI configurada no Google Cloud Console
3. Certifique-se de que não há espaços ou caracteres extras
4. Verifique se está usando `http://` em desenvolvimento e `https://` em produção

