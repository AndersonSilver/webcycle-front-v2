# Checkout — dados do comprador (nome, e-mail, telefone)

**Data:** 2026-07-15  
**Escopo:** `webcycle-front-v2` (Checkout) + `webcycle-back-v2` (perfil + pagamento Mercado Pago)

## Problema

No modal de finalizar compra, nome, e-mail e contato do comprador não aparecem. Hoje o backend usa `user.name` e `user.email` do usuário autenticado e **não** envia telefone ao Mercado Pago. O telefone pode estar vazio no perfil.

## Objetivo

Antes de ir ao pagamento, o comprador vê e confirma seus dados. Nome e e-mail vêm do login (somente leitura). O telefone é obrigatório; se não existir no perfil, precisa ser preenchido. Ao continuar, o telefone é salvo no perfil e enviado ao Mercado Pago.

## Decisões

| Tema | Decisão |
|------|----------|
| Abordagem | A — formulário no Checkout + `updateProfile` + `payerPhone` no pagamento |
| Nome / e-mail | Pré-preenchidos do perfil; somente leitura neste fluxo |
| Telefone | Editável e obrigatório para continuar |
| Mercado Pago | Enviar `payerPhone` além de nome e e-mail |
| Falha ao salvar perfil | Bloquear a compra; não abrir pagamento |

## UI (Checkout)

No painel esquerdo do checkout (antes do botão **Continuar para Pagamento**), bloco **Dados do comprador**:

1. **Nome** — valor do perfil; `readOnly` / desabilitado  
2. **E-mail** — valor do perfil; `readOnly` / desabilitado  
3. **Telefone / contato** — editável; obrigatório  

- Ao montar o checkout, carregar perfil via `getProfile()` (mesmo padrão do endereço de envio).  
- Se `user.phone` existir, pré-preencher o campo.  
- Visual alinhado aos campos já existentes no Checkout (Label, Input, tema escuro).

## Fluxo

```
Abrir Checkout
  → getProfile() → preenche nome, e-mail, phone
  → (endereço físico se houver, como hoje)

Clicar "Continuar para Pagamento"
  → validar telefone (≥ 10 dígitos numéricos, DDD + número BR)
  → se inválido: toast/erro; não chama APIs
  → updateProfile({ phone })
  → se falhar: toast/erro; não chama checkout
  → POST /purchases/checkout (como hoje)
  → backend usa user.name, user.email e user.phone (atualizado) → Mercado Pago
```

Nome e e-mail **não** são alterados neste fluxo.

## Backend

### Perfil

- `updateProfile` já aceita `phone` — reutilizar; sem novo endpoint.

### Checkout / PaymentService

Em `PurchaseController` (criação de preferência / pagamento), além de:

- `payerEmail: user.email`
- `payerName: user.name`

enviar:

- `payerPhone` derivado de `user.phone` (após trim/digits): `area_code` (2 primeiros dígitos) + `number` (restante).

`PaymentService.createPayment` já suporte `payerPhone`; falta apenas popular na chamada do controller.

### Guarda opcional

Se `user.phone` estiver vazio no momento do checkout (cliente desatualizado), retornar `400` com mensagem clara pedindo telefone no checkout. Preferência: validação principal no front; backend como rede de segurança.

## Validação do telefone

- Aceitar entrada com máscara ou só dígitos.  
- Normalizar para dígitos.  
- Mínimo **10** dígitos (DDD + número).  
- Máximo tipicamente **11** (celular com 9).  
- Persistir no perfil a string normalizada (ex.: apenas dígitos, ou formato consistente já usado em `MyProfile` — seguir o mesmo padrão do perfil).

## Erros

| Situação | Comportamento |
|----------|----------------|
| Telefone vazio / inválido | Bloquear; feedback ao usuário |
| `updateProfile` falha | Bloquear; não abrir Mercado Pago |
| Checkout falha após perfil salvo | Telefone permanece no perfil; mostrar erro do checkout |
| Usuário sem perfil autenticado | Fluxo atual de login (fora deste escopo) |

## Fora de escopo

- Edição de nome/e-mail no checkout  
- CPF obrigatório  
- Alterar layout do wizard em múltiplos passos  
- Coleta de telefone em registro/login (pode ser melhoria futura)

## Critérios de aceite

1. No checkout visível: nome e e-mail preenchidos (somente leitura) a partir do login/perfil.  
2. Sem telefone no perfil: campo vazio; não é possível continuar até preencher um telefone válido.  
3. Com telefone no perfil: campo pré-preenchido; pode editar antes de continuar.  
4. Após continuar com sucesso: `user.phone` atualizado no perfil (visível também em Meu Perfil).  
5. Preferência/pagamento no Mercado Pago inclui dados de telefone do pagador.  
6. Falha ao salvar telefone impede abertura do pagamento.
