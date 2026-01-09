# 🔧 Configuração do Backend

## ⚠️ Erro 404 ao Criar Curso

Se você está recebendo um erro **404 Not Found** ao tentar criar um curso, isso significa que o backend não está respondendo corretamente.

### Possíveis Causas:

1. **Backend não está rodando**
   - Verifique se o servidor backend está iniciado
   - O backend deve estar rodando na porta configurada (padrão: `http://localhost:3000`)

2. **Rota não configurada no backend**
   - Verifique se a rota `POST /api/courses` está implementada no backend
   - Verifique se o middleware de autenticação admin está configurado

3. **Porta diferente**
   - Verifique se o backend está rodando na mesma porta configurada no `.env`
   - Padrão: `VITE_API_URL=http://localhost:3000/api`

4. **CORS não configurado**
   - O backend precisa permitir requisições do frontend
   - Verifique as configurações de CORS no backend

### Como Verificar:

1. **Verifique se o backend está rodando:**
   ```bash
   # No terminal do backend
   curl http://localhost:3000/api/courses
   ```

2. **Verifique os logs do console:**
   - Abra o console do navegador (F12)
   - Veja os logs `[API]` que mostram a URL completa sendo chamada
   - Verifique se há erros de rede

3. **Verifique a variável de ambiente:**
   - Crie um arquivo `.env` na raiz do projeto frontend:
   ```env
   VITE_API_URL=http://localhost:3000/api
   ```
   - Substitua `3000` pela porta onde seu backend está rodando

### Endpoint Esperado:

Conforme a documentação (`API_DOCUMENTATION.md`):

**POST** `/api/courses`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "title": "Novo Curso",
  "subtitle": "Subtítulo",
  "description": "Descrição completa...",
  "price": 199.90,
  "originalPrice": 299.90,
  "category": "psicologia",
  "image": "https://...",
  "instructor": "Tiago Bonifacio",
  "duration": "10 horas",
  "level": "iniciante"
}
```

### Próximos Passos:

1. Certifique-se de que o backend está rodando
2. Verifique se a rota está implementada
3. Verifique se o token de autenticação está sendo enviado
4. Verifique os logs do console para mais detalhes

