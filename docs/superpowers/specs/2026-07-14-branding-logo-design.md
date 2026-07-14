# Design: Logo do sistema (header + rodapé) na aba Conteúdo

**Data:** 2026-07-14  
**Projetos:** `webcycle-front-v2`, `webcycle-back-v2`  
**Status:** Aprovado em brainstorming

## Objetivo

Permitir que o admin altere a logo do site público (header e rodapé) na aba **Conteúdo** do painel admin, com opção de exibir ou ocultar o nome “Culture Builders” ao lado da imagem.

## Escopo

**Inclui:**
- Uma única logo compartilhada entre header e footer do site público
- Nova tab **Logos** em Gerenciar Conteúdo da Home
- Upload de imagem via fluxo existente (`uploadImage` → Azure)
- Toggle `showBrandName` para mostrar/ocultar o texto da marca
- Fallback para o ícone padrão atual quando não houver `logoUrl`

**Fora de escopo:**
- Logos distintas para header e footer
- Alterar logo do painel admin (sidebar/header interno)
- Edição do texto da marca (permanece “Culture Builders” hardcoded)
- Favicon ou metadados Open Graph

## Abordagem escolhida

Estender `home_page_content` com um objeto `branding`, reutilizando API, admin e upload já usados pelo Conteúdo da Home (Abordagem A do brainstorming).

## Modelo de dados

Novo campo JSONB em `HomePageContent`:

```ts
branding?: {
  logoUrl: string;       // URL Azure; string vazia = ícone padrão (iconImg)
  showBrandName: boolean; // true = exibe "Culture Builders" ao lado
}
```

**Defaults:**
- `logoUrl: ""`
- `showBrandName: true`  
→ comportamento idêntico ao atual.

### Backend (`webcycle-back-v2`)

1. Migration TypeORM adicionando coluna `branding` (jsonb, nullable)
2. Atualizar entity `HomePageContent`
3. Atualizar DTO `UpdateHomeContentDto` + validação de `branding`
4. Incluir `branding` em `getDefaultContent()` do `HomeContentController`
5. Endpoint público e admin de home-content já retornam o registro; garantir que `branding` seja persistido no PATCH parcial (mesmo padrão das outras seções)

### Frontend (`webcycle-front-v2`)

1. Estender interface `HomeContent` em `useHomeContent.ts` + default
2. Tipagem do `updateHomeContent` em `apiClient.ts`
3. Tab **Logos** em `AdminPanel.tsx` (estado, load, save)
4. Header e footer em `App.tsx` consomem `branding` via `useHomeContent`

## UI admin — tab Logos

- Posição: no início da lista de tabs (branding antes das seções da home)
- Preview da logo atual (ou placeholder do ícone padrão)
- Upload de imagem (mesmo padrão do carrossel)
- Ação para remover logo (limpa `logoUrl` → volta ao padrão)
- Toggle: “Exibir nome Culture Builders”
- Persistência via botão existente **Salvar Alterações**, enviando apenas `{ branding }` no PATCH da tab ativa

## Site público

| Condição | Resultado |
|----------|-----------|
| `logoUrl` preenchida | Usar imagem customizada |
| `logoUrl` vazia / ausente | Usar `iconImg` atual |
| `showBrandName === true` | Mostrar texto “Culture Builders” |
| `showBrandName === false` | Só a imagem |
| Falha ao carregar home-content | Fallback = ícone + nome (comportamento atual) |

Header e footer usam o **mesmo** `branding`.

## Fluxo de dados

```
Admin (tab Logos)
  → uploadImage(file) → Azure URL
  → updateHomeContent({ branding: { logoUrl, showBrandName } })
  → HomeContentController PATCH → home_page_content.branding

Site público
  → getHomeContent() / useHomeContent()
  → App header + footer renderizam logo + nome conforme branding
```

## Tratamento de erros

- Upload: toast de erro; não sobrescrever `logoUrl` até sucesso
- Save: toast de erro; manter estado do formulário
- GET content falhou: defaults com ícone + nome visível

## Testes manuais sugeridos

1. Sem branding salvo → header/footer iguais ao atual
2. Upload de logo + salvar → aparece no header e no footer
3. Desligar “Exibir nome” + salvar → só imagem nos dois lugares
4. Remover logo + salvar → volta ao ícone padrão (com/sem nome conforme toggle)
5. Recarregar a home como visitante → branding persiste

## Decisão explícita

Uma logo só (não separada por header/footer). Toggle de nome no admin. Painel admin interno não é afetado.
