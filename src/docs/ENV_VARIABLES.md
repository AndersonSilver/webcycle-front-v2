# 🔧 Variáveis de Ambiente

## Variáveis Necessárias

### Obrigatória

#### `VITE_API_URL`
**Descrição:** URL base da API do backend  
**Tipo:** String  
**Padrão:** `http://localhost:3001/api`  
**Exemplo:**
```env
VITE_API_URL=http://localhost:3001/api
```

**Onde é usada:**
- `src/services/apiClient.ts` - URL base para todas as requisições HTTP
- `src/app/components/Login.tsx` - URL para redirecionamento OAuth do Google

**Valores por ambiente:**

**Desenvolvimento:**
```env
VITE_API_URL=http://localhost:3001/api
```

**Produção:**
```env
VITE_API_URL=https://api.seudominio.com/api
```

---

### Opcional

#### `VITE_MERCADOPAGO_PUBLIC_KEY`
**Descrição:** Chave pública do Mercado Pago para Checkout Transparente  
**Tipo:** String  
**Padrão:** `TEST-ad96dc9a-0c0b-4e0f-8b0a-8b0a8b0a8b0a` (chave de teste padrão)  
**Exemplo:**
```env
VITE_MERCADOPAGO_PUBLIC_KEY=TEST-1234567890-123456-abcdefghijklmnopqrstuvwxyz
```

**Onde é usada:**
- `src/app/components/Checkout.tsx` - Inicialização do formulário de cartão do Mercado Pago

**Como obter:**
1. Acesse: https://www.mercadopago.com.br/developers/panel
2. Vá em **"Suas integrações"** > Sua aplicação
3. Na aba **"Credenciais de teste"**, copie a **Public Key**
4. Formato: `TEST-1234567890-123456-abcdefghijklmnopqrstuvwxyz`

**Valores por ambiente:**

**Desenvolvimento (Teste):**
```env
VITE_MERCADOPAGO_PUBLIC_KEY=TEST-SUA_PUBLIC_KEY_DE_TESTE
```

**Produção:**
```env
VITE_MERCADOPAGO_PUBLIC_KEY=APP_USR-SUA_PUBLIC_KEY_DE_PRODUCAO
```

---

## Como Configurar

### 1. Criar arquivo `.env`

Na raiz do projeto (mesmo nível do `package.json`), crie um arquivo `.env`:

```env
VITE_API_URL=http://localhost:3001/api
```

### 2. Ajustar a porta

Se seu backend está rodando em outra porta, ajuste:

```env
VITE_API_URL=http://localhost:4000/api
```

### 3. Reiniciar o servidor

Após criar ou modificar o `.env`, **reinicie o servidor Vite**:

```bash
# Pare o servidor (Ctrl+C)
# E inicie novamente
yarn dev
```

---

## Importante

- ✅ O arquivo `.env` já está no `.gitignore` e **não será commitado**
- ✅ Apenas variáveis que começam com `VITE_` são expostas ao código frontend
- ✅ O arquivo `.env.example` serve como template e pode ser commitado
- ⚠️ **Nunca** commite o arquivo `.env` com credenciais reais

---

## Verificação

Para verificar se a variável está sendo carregada corretamente, abra o console do navegador e verifique os logs `[API]` que mostram a URL completa sendo usada.

