# 🚀 Guia de Migração: Mock Data → API Real

Este guia documenta a migração do frontend de dados mockados (localStorage) para chamadas reais à API.

## ✅ O que já foi feito

### 1. Serviço de API Criado
- ✅ **Arquivo:** `src/services/apiClient.ts`
- ✅ Cliente HTTP centralizado com todas as rotas da API
- ✅ Gerenciamento automático de tokens JWT
- ✅ Tratamento de erros e redirecionamento em caso de token expirado

### 2. Componente Login Atualizado
- ✅ **Arquivo:** `src/app/components/Login.tsx`
- ✅ Substituído `localStorage` por chamadas reais à API
- ✅ Login com email/senha funcionando
- ✅ Registro de usuário funcionando
- ✅ Login com Google configurado (redirecionamento)

## 📋 Próximos Passos

### Componentes que ainda precisam ser migrados:

1. **CourseCatalog** (`src/app/components/CourseCatalog.tsx`)
   - Substituir `courses` importado de `data/courses.ts`
   - Usar `apiClient.getCourses()` com filtros
   - Implementar busca com `apiClient.searchCourses()`

2. **CourseDetail** (`src/app/components/CourseDetail.tsx`)
   - Substituir dados mockados
   - Usar `apiClient.getCourseById()`
   - Carregar avaliações com `apiClient.getCourseReviews()`
   - Verificar favoritos com `apiClient.checkFavorite()`

3. **Cart** (`src/app/components/Cart.tsx`)
   - Substituir estado local por `apiClient.getCart()`
   - Adicionar item: `apiClient.addToCart()`
   - Remover item: `apiClient.removeFromCart()`
   - Limpar carrinho: `apiClient.clearCart()`
   - Aplicar cupom: `apiClient.applyCoupon()`

4. **Checkout** (`src/app/components/Checkout.tsx`)
   - Substituir simulação de pagamento
   - Usar `apiClient.checkout()`
   - Confirmar pagamento: `apiClient.confirmPurchase()`
   - Validar cupom: `apiClient.validateCoupon()`

5. **MyCourses** (`src/app/components/MyCourses.tsx`)
   - Substituir `localStorage.getItem('purchasedCourses')`
   - Usar `apiClient.getMyCourses()`
   - Carregar progresso: `apiClient.getCourseProgress()`

6. **CoursePlayer** (`src/app/components/CoursePlayer.tsx`)
   - Carregar aula: `apiClient.getLessonById()`
   - Verificar acesso antes de mostrar vídeo
   - Atualizar progresso: `apiClient.updateWatchTime()`
   - Completar aula: `apiClient.completeLesson()`
   - Carregar materiais: `apiClient.getLessonMaterials()`

7. **AdminPanel** (`src/app/components/AdminPanel.tsx`)
   - Substituir todos os `localStorage` por chamadas à API
   - Dashboard: `apiClient.getAdminDashboard()` (precisa criar no apiClient)
   - CRUD de cursos, módulos, aulas
   - Gestão de alunos, compras, cupons

## 🔧 Como usar o apiClient

### Exemplo básico:

```typescript
import { apiClient } from '../../services/apiClient';

// Em um componente React
const [courses, setCourses] = useState([]);
const [loading, setLoading] = useState(false);

useEffect(() => {
  const loadCourses = async () => {
    setLoading(true);
    try {
      const response = await apiClient.getCourses({
        page: 1,
        limit: 12,
        category: 'psicologia'
      });
      setCourses(response.courses);
    } catch (error) {
      console.error('Erro ao carregar cursos:', error);
      toast.error('Erro ao carregar cursos');
    } finally {
      setLoading(false);
    }
  };
  
  loadCourses();
}, []);
```

### Tratamento de erros:

```typescript
try {
  await apiClient.addToCart(courseId);
  toast.success('Curso adicionado ao carrinho!');
} catch (error) {
  if (error instanceof Error) {
    toast.error(error.message);
  } else {
    toast.error('Erro desconhecido');
  }
}
```

## 📝 Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
VITE_API_URL=http://localhost:3000/api
```

Para produção, atualize para:
```env
VITE_API_URL=https://api.tb-psico.com/api
```

## ⚠️ Importante

1. **Token JWT**: O `apiClient` gerencia automaticamente o token. Ele é salvo no `localStorage` após login e incluído em todas as requisições.

2. **Autenticação**: Se o token expirar (401), o usuário é automaticamente redirecionado para `/login`.

3. **Validação**: Sempre valide os dados no frontend antes de enviar para a API (melhor UX), mas lembre-se que o backend SEMPRE valida também.

4. **Loading States**: Sempre mostre estados de loading durante as requisições.

5. **Error Handling**: Trate todos os erros e mostre mensagens amigáveis ao usuário.

## 🎯 Checklist de Migração

Para cada componente:

- [ ] Remover imports de dados mockados
- [ ] Adicionar import do `apiClient`
- [ ] Substituir `localStorage` por chamadas à API
- [ ] Adicionar estados de loading
- [ ] Implementar tratamento de erros
- [ ] Testar fluxo completo
- [ ] Verificar se token está sendo usado corretamente

## 📚 Documentação

- **API Completa:** Ver `API_DOCUMENTATION.md`
- **Estrutura Backend:** Ver `backend-structure.md`
- **Exemplos Práticos:** Ver seção "Exemplos Práticos" na documentação da API

