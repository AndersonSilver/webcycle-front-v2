# Checkout Buyer Contact Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Exibir nome/e-mail (somente leitura) e telefone obrigatório no checkout, salvar o telefone no perfil e enviá-lo ao Mercado Pago.

**Architecture:** Front carrega o perfil no Checkout, valida o telefone e chama `updateProfile({ phone })` antes de `POST /purchases/checkout`. Back reutiliza `PaymentService.payerPhone`, convertendo `user.phone` em DDD + número, e rejeita checkout sem telefone válido.

**Tech Stack:** React + Vite (`webcycle-front-v2`), Express + TypeORM + Mercado Pago SDK (`webcycle-back-v2`).

**Spec:** `docs/superpowers/specs/2026-07-15-checkout-buyer-contact-design.md`

## Global Constraints

- Nome e e-mail: somente leitura no checkout; não alterar via este fluxo.
- Telefone: obrigatório; ≥ 10 e ≤ 11 dígitos após normalização.
- Falha em `updateProfile` bloqueia o pagamento.
- Copy da UI em português (pt-BR).
- Não inventar novos endpoints; usar `GET /auth/me` e `PUT /auth/profile`.

---

## File map

| File | Responsibility |
|------|----------------|
| `webcycle-front-v2/src/utils/phone.ts` | Normalizar/validar telefone BR (front) |
| `webcycle-front-v2/src/app/components/Checkout.tsx` | Estado + UI + save + gate no `handleCheckout` |
| `webcycle-back-v2/src/utils/phone.ts` | Normalizar + split DDD/número para MP |
| `webcycle-back-v2/src/controllers/PurchaseController.ts` | Guard de phone + `payerPhone` no `createPayment` |
| `webcycle-back-v2/src/controllers/PurchaseController.ts` (processPayment) | Mesmo `payerPhone` se ainda chamar createPayment com cartão |

---

### Task 1: Front — util de telefone

**Files:**
- Create: `webcycle-front-v2/src/utils/phone.ts`

**Interfaces:**
- Produces:
  - `normalizePhoneDigits(input: string): string`
  - `isValidBrazilianPhone(input: string): boolean` — true se digits length ∈ [10, 11]

- [ ] **Step 1: Create util**

```ts
/** Keep only digits from a phone string. */
export function normalizePhoneDigits(input: string): string {
  return (input || '').replace(/\D/g, '');
}

/** Brazilian landline/mobile: DDD (2) + number (8 or 9). */
export function isValidBrazilianPhone(input: string): boolean {
  const digits = normalizePhoneDigits(input);
  return digits.length >= 10 && digits.length <= 11;
}
```

- [ ] **Step 2: Smoke-check in Node**

Run from `webcycle-front-v2`:

```bash
node --input-type=module -e "
import { normalizePhoneDigits, isValidBrazilianPhone } from './src/utils/phone.ts';
console.assert(normalizePhoneDigits('(11) 97984-9146') === '11979849146');
console.assert(isValidBrazilianPhone('(11) 97984-9146') === true);
console.assert(isValidBrazilianPhone('1197984914') === true);
console.assert(isValidBrazilianPhone('123') === false);
console.log('ok');
"
```

If the project cannot import `.ts` via Node, run with `npx tsx` instead:

```bash
npx tsx -e "
import { normalizePhoneDigits, isValidBrazilianPhone } from './src/utils/phone.ts';
console.assert(normalizePhoneDigits('(11) 97984-9146') === '11979849146');
console.assert(isValidBrazilianPhone('123') === false);
console.log('ok');
"
```

Expected: `ok`

- [ ] **Step 3: Commit (front)**

```bash
cd "webcycle-front-v2"
git add src/utils/phone.ts
git commit -m "$(cat <<'EOF'
feat: add Brazilian phone normalize/validate helpers

EOF
)"
```

---

### Task 2: Front — Checkout UI + save phone before payment

**Files:**
- Modify: `webcycle-front-v2/src/app/components/Checkout.tsx`

**Interfaces:**
- Consumes: `normalizePhoneDigits`, `isValidBrazilianPhone` from `../../utils/phone`
- Consumes: `apiClient.getProfile()`, `apiClient.updateProfile({ phone })`
- Produces: buyer fields state; gate inside `handleCheckout`

- [ ] **Step 1: Add state and load buyer profile**

Near existing `shippingAddress` state (~line 45), add:

```tsx
const [buyerName, setBuyerName] = useState("");
const [buyerEmail, setBuyerEmail] = useState("");
const [buyerPhone, setBuyerPhone] = useState("");
const [buyerProfileLoaded, setBuyerProfileLoaded] = useState(false);
```

Add import:

```tsx
import { User } from "lucide-react"; // if MapPin already imported, add User to that import
import { isValidBrazilianPhone, normalizePhoneDigits } from "../../utils/phone";
```

Create `loadBuyerProfile`:

```tsx
const loadBuyerProfile = useCallback(async () => {
  try {
    const response = await apiClient.getProfile();
    const user = response.user;
    if (user) {
      setBuyerName(user.name || "");
      setBuyerEmail(user.email || "");
      setBuyerPhone(user.phone || "");
    }
  } catch (error) {
    console.error("Erro ao carregar dados do comprador:", error);
    toast.error("Não foi possível carregar seus dados. Atualize a página.");
  } finally {
    setBuyerProfileLoaded(true);
  }
}, []);
```

Call it on mount (alongside existing product/address effects):

```tsx
useEffect(() => {
  loadBuyerProfile();
}, [loadBuyerProfile]);
```

Note: `loadShippingAddress` already calls `getProfile` for physical products — keep both for clarity (two GETs is acceptable YAGNI). Optionally later merge; do **not** merge in this task unless trivial.

- [ ] **Step 2: Gate + save phone in `handleCheckout`**

At the start of `handleCheckout`, after the empty-cart check and **before** address validation / `apiClient.checkout`:

```tsx
if (!isValidBrazilianPhone(buyerPhone)) {
  toast.error("Informe um telefone válido com DDD (10 ou 11 dígitos)");
  setIsProcessing(false);
  return;
}

const normalizedPhone = normalizePhoneDigits(buyerPhone);

try {
  await apiClient.updateProfile({ phone: normalizedPhone });
  setBuyerPhone(normalizedPhone);
} catch (error) {
  console.error("Erro ao salvar telefone no perfil:", error);
  handleApiError(error, "Erro ao salvar telefone no perfil");
  setIsProcessing(false);
  return;
}
```

Ensure `setIsProcessing(true)` already ran before these checks (keep current order: set processing true first, then validations that set it false on failure).

Do **not** soft-fail: if profile update fails, never call `apiClient.checkout`.

- [ ] **Step 3: Render buyer fields UI**

In the left payment column, **before** the shipping address block (before `products.some(p => p.type === 'physical')` card, ~line 1109), insert:

```tsx
{buyerProfileLoaded && (
  <Card className="bg-gray-700/90 backdrop-blur-sm border-2 border-gray-600">
    <CardHeader className="pb-3">
      <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-white">
        <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        Dados do Comprador
      </CardTitle>
      <CardDescription className="text-xs sm:text-sm text-gray-400">
        Confirme seus dados para continuar
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-3 sm:space-y-4">
      <div>
        <Label htmlFor="buyer-name" className="text-xs sm:text-sm text-white">Nome</Label>
        <Input
          id="buyer-name"
          value={buyerName}
          readOnly
          disabled
          className="text-xs sm:text-sm bg-gray-600 border-gray-500 text-gray-300"
        />
      </div>
      <div>
        <Label htmlFor="buyer-email" className="text-xs sm:text-sm text-white">E-mail</Label>
        <Input
          id="buyer-email"
          value={buyerEmail}
          readOnly
          disabled
          className="text-xs sm:text-sm bg-gray-600 border-gray-500 text-gray-300"
        />
      </div>
      <div>
        <Label htmlFor="buyer-phone" className="text-xs sm:text-sm text-white">Telefone / Contato *</Label>
        <Input
          id="buyer-phone"
          type="tel"
          inputMode="tel"
          value={buyerPhone}
          onChange={(e) => setBuyerPhone(e.target.value)}
          placeholder="(11) 99999-9999"
          className="text-xs sm:text-sm bg-gray-700 border-gray-600 text-white placeholder-gray-400"
        />
      </div>
    </CardContent>
  </Card>
)}
```

Update the Continuar button `disabled` to also block while profile still loading or phone invalid (optional UX; validation toast remains required):

```tsx
disabled={
  isProcessing ||
  productsLoading ||
  !buyerProfileLoaded ||
  !isValidBrazilianPhone(buyerPhone) ||
  (products.length === 0 && courses.length === 0)
}
```

- [ ] **Step 4: Manual verify**

1. User with phone empty → open `/checkout` → nome/e-mail filled, phone empty, button disabled.  
2. Type invalid phone → still disabled / toast if forced.  
3. Type valid phone → click Continuar → profile has phone in Meu Perfil; MP opens.  
4. User with phone already set → field pre-filled.

- [ ] **Step 5: Commit (front)**

```bash
cd "webcycle-front-v2"
git add src/app/components/Checkout.tsx src/utils/phone.ts
git commit -m "$(cat <<'EOF'
feat: require and save buyer phone on checkout

EOF
)"
```

---

### Task 3: Back — util de telefone para Mercado Pago

**Files:**
- Create: `webcycle-back-v2/src/utils/phone.ts`

**Interfaces:**
- Produces:
  - `normalizePhoneDigits(input: string): string`
  - `isValidBrazilianPhone(input: string): boolean`
  - `toMercadoPagoPhone(input: string): { area_code: string; number: string } | null`

- [ ] **Step 1: Create util**

```ts
export function normalizePhoneDigits(input: string): string {
  return (input || '').replace(/\D/g, '');
}

export function isValidBrazilianPhone(input: string): boolean {
  const digits = normalizePhoneDigits(input);
  return digits.length >= 10 && digits.length <= 11;
}

/** Split BR phone into Mercado Pago payer.phone shape. */
export function toMercadoPagoPhone(
  input: string
): { area_code: string; number: string } | null {
  if (!isValidBrazilianPhone(input)) {
    return null;
  }
  const digits = normalizePhoneDigits(input);
  return {
    area_code: digits.slice(0, 2),
    number: digits.slice(2),
  };
}
```

- [ ] **Step 2: Smoke-check**

```bash
cd "webcycle-back-v2"
npx tsx -e "
import { toMercadoPagoPhone, isValidBrazilianPhone } from './src/utils/phone.ts';
console.assert(isValidBrazilianPhone('11979849146') === true);
const p = toMercadoPagoPhone('11979849146');
console.assert(p?.area_code === '11' && p?.number === '979849146');
console.assert(toMercadoPagoPhone('123') === null);
console.log('ok');
"
```

Expected: `ok`

- [ ] **Step 3: Commit (back)**

```bash
cd "webcycle-back-v2"
git add src/utils/phone.ts
git commit -m "$(cat <<'EOF'
feat: add phone helpers for Mercado Pago payer

EOF
)"
```

---

### Task 4: Back — checkout envia `payerPhone` + guard

**Files:**
- Modify: `webcycle-back-v2/src/controllers/PurchaseController.ts`

**Interfaces:**
- Consumes: `toMercadoPagoPhone`, `isValidBrazilianPhone` from `../utils/phone`
- Consumes: `user.phone` from `req.user` (JWT strategy loads User entity from DB — phone is current after front `updateProfile`)

- [ ] **Step 1: Import helpers**

At top of `PurchaseController.ts`:

```ts
import { isValidBrazilianPhone, toMercadoPagoPhone } from '../utils/phone';
```

- [ ] **Step 2: Guard after auth in `checkout`**

Right after the `if (!user)` block (~line 54–56):

```ts
if (!isValidBrazilianPhone(user.phone || '')) {
  return res.status(400).json({
    message: 'Telefone é obrigatório para finalizar a compra. Atualize seu perfil ou informe o contato no checkout.',
  });
}
```

- [ ] **Step 3: Pass `payerPhone` into `createPayment`**

Where checkout builds payment (~lines 336–344), change to:

```ts
const mpPhone = toMercadoPagoPhone(user.phone || '');

const payment = await this.paymentService.createPayment({
  amount: finalAmount,
  description,
  purchaseId: savedPurchase.id,
  paymentMethod,
  payerEmail: user.email,
  payerName: user.name,
  payerPhone: mpPhone || undefined,
  courses: paymentItems,
});
```

- [ ] **Step 4: Same for `processPayment` path**

In `processPayment` (~lines 416–418), after ensuring phone valid (same 400 if missing), pass:

```ts
payerPhone: toMercadoPagoPhone(user.phone || '') || undefined,
```

alongside existing `payerEmail` / `payerName`.

- [ ] **Step 5: Manual verify (API)**

1. Authenticated user with empty phone → `POST /purchases/checkout` → 400 with phone message.  
2. `PUT /auth/profile` with `"phone":"11999887766"` → checkout → 200 and preference created; logs/MP payload include `payer.phone`.  
3. Front full flow still opens Checkout Pro.

- [ ] **Step 6: Commit (back)**

```bash
cd "webcycle-back-v2"
git add src/controllers/PurchaseController.ts src/utils/phone.ts
git commit -m "$(cat <<'EOF'
feat: require phone and send payerPhone on checkout

EOF
)"
```

---

## Spec coverage checklist

| Spec requirement | Task |
|------------------|------|
| UI nome/e-mail readonly + telefone | Task 2 |
| Pré-preencher do perfil | Task 2 |
| Telefone obrigatório para continuar | Task 2 (+ button disabled) |
| `updateProfile({ phone })` before checkout | Task 2 |
| Bloquear se save falhar | Task 2 |
| Validação 10–11 dígitos | Task 1 + 2 |
| Enviar `payerPhone` ao MP | Task 3 + 4 |
| Guard 400 no backend | Task 4 |
| Sem edição nome/e-mail | Task 2 (readonly) |

## Out of scope (do not implement)

- CPF, wizard multi-step, coleta de telefone no login
```
