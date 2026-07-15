# Branding Logo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir edição de uma logo única (header + footer) e toggle do nome da marca na aba Conteúdo do admin.

**Architecture:** Campo JSONB `branding` em `home_page_content`; tab Logos no AdminPanel; header/footer em App.tsx leem via `useHomeContent`. Upload reutiliza `apiClient.uploadImage`.

**Tech Stack:** TypeORM + Express (back), React + Vite (front), Azure Blob upload existente.

**Spec:** `docs/superpowers/specs/2026-07-14-branding-logo-design.md`

---

## File map

| File | Responsibility |
|------|----------------|
| `webcycle-back-v2/src/migrations/1700000000020-AddBrandingToHomePageContent.ts` | Migration coluna `branding` |
| `webcycle-back-v2/src/entities/HomePageContent.entity.ts` | Campo `branding` |
| `webcycle-back-v2/src/dto/home-content.dto.ts` | `BrandingDto` + Update DTO |
| `webcycle-back-v2/src/controllers/HomeContentController.ts` | Persistência + default |
| `webcycle-front-v2/src/hooks/useHomeContent.ts` | Tipo + default branding |
| `webcycle-front-v2/src/services/apiClient.ts` | Tipos get/update |
| `webcycle-front-v2/src/app/components/AdminPanel.tsx` | Tab Logos UI |
| `webcycle-front-v2/src/app/App.tsx` | Render header/footer |

---

### Task 1: Backend — migration + entity + DTO + controller

**Files:**
- Create: `webcycle-back-v2/src/migrations/1700000000020-AddBrandingToHomePageContent.ts`
- Modify: `webcycle-back-v2/src/entities/HomePageContent.entity.ts`
- Modify: `webcycle-back-v2/src/dto/home-content.dto.ts`
- Modify: `webcycle-back-v2/src/controllers/HomeContentController.ts`

- [x] **Step 1:** Migration adicionando coluna `branding` jsonb nullable (padrão da 0019)
- [x] **Step 2:** Entity com `branding?: { logoUrl: string; showBrandName: boolean }`
- [x] **Step 3:** `BrandingDto` com `@IsString() logoUrl`, `@IsBoolean() showBrandName`; opcional em `UpdateHomeContentDto`
- [x] **Step 4:** `updateContent` persiste `branding`; `getDefaultContent` inclui `{ logoUrl: '', showBrandName: true }`

### Task 2: Frontend — tipos e hook

**Files:**
- Modify: `webcycle-front-v2/src/hooks/useHomeContent.ts`
- Modify: `webcycle-front-v2/src/services/apiClient.ts`

- [x] **Step 1:** Interface + default `branding`
- [x] **Step 2:** Tipar `getHomeContent`, `getAdminHomeContent`, `updateHomeContent`

### Task 3: AdminPanel — tab Logos

**Files:**
- Modify: `webcycle-front-v2/src/app/components/AdminPanel.tsx`

- [x] **Step 1:** Estado `brandingLogoUrl`, `brandingShowBrandName`, `brandingLogoUploading`; tab type inclui `"logos"`
- [x] **Step 2:** `loadHomeContent` / `saveHomeContent` para branding
- [x] **Step 3:** UI tab no início: preview, upload, remover, checkbox showBrandName

### Task 4: App — header e footer

**Files:**
- Modify: `webcycle-front-v2/src/app/App.tsx`

- [x] **Step 1:** `logoSrc = homeContent.branding?.logoUrl || iconImg`
- [x] **Step 2:** Condicionar texto “Culture Builders” com `showBrandName !== false`

### Task 5: Verificar

- [x] Confirmar TypeScript sem erros óbvios nos arquivos tocados
- [x] Migration executada com sucesso no banco local
- [ ] Checklist manual da spec (upload, toggle, remover, persistência) — validar no browser

**Commits:** apenas se o usuário pedir (regra do workspace).
