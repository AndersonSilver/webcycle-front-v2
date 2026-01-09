# 🔧 Solução para Erros de Cache do Vite

Se você está vendo erros como:
- `Failed to resolve import`
- `Identifier has already been declared`
- Outros erros estranhos que não fazem sentido

## Solução Rápida

1. **Pare o servidor** (Ctrl+C)

2. **Limpe o cache do Vite:**
```bash
# Windows PowerShell
Remove-Item -Recurse -Force node_modules/.vite

# Ou manualmente delete a pasta:
# node_modules/.vite
```

3. **Reinicie o servidor:**
```bash
yarn dev
```

## Se ainda não funcionar

1. **Limpe completamente:**
```bash
# Remover node_modules e reinstalar
Remove-Item -Recurse -Force node_modules
yarn install
yarn dev
```

2. **Verifique se os arquivos existem:**
   - `src/services/apiClient.ts` ✅
   - `src/app/App.tsx` ✅
   - `src/app/components/CoursePlayer.tsx` ✅

3. **Verifique os imports:**
   - `App.tsx`: `import { apiClient } from "../services/apiClient";` ✅
   - `CoursePlayer.tsx`: `import { apiClient } from "../../services/apiClient";` ✅

## Erros Corrigidos

✅ Caminho de importação no `App.tsx` corrigido
✅ Função duplicada `handleMarkComplete` removida do `CoursePlayer.tsx`

