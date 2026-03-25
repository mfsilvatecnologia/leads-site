# Lead Rápido - Checkout (leads-site) - Documentação

Este documento descreve o fluxo do checkout implementado no front-end `leads-site` (React).

## Rotas do site

- `/` e `/checkout`: `LeadCheckout`
- `/admin/upload-staging`: `AdminUpload`
- `/obrigado`: página após confirmação do pagamento
- `*`: `NotFound`

## Dependências e base da API

- `API_BASE_URL` é lido de `import.meta.env.VITE_API_URL` (com fallback para `http://localhost:3000/api/v1`).
- `DEMO_URL` é lido de `import.meta.env.VITE_DEMO_URL` (opcional, para link de demonstração).

## LeadCheckout: estados e responsabilidades

O componente `src/pages/LeadCheckout.tsx` controla:

- Catálogo: `catalog`, `loadingCatalog`
- Quote/Disponibilidade: `availableCount`, `quoteLoading`
- Cupom: `couponCode` (digitado), `couponApplied` (normalizado após sucesso), `discountAmount`
- Checkout modal:
  - `checkoutOpen`, `submitting`, `error`, `statusMessage`
  - Dados de pagamento retornados pela API: `paymentId`, `invoiceUrl`, `pixCopyPaste`, `pixQrCodeImage`
- Formulário de compra (objeto `form`):
  - Comprador: `buyerName`, `buyerEmail`, `buyerWhatsapp`
  - Lista/Local: `state`, `segment`, `quantity`
  - Pagamento: `paymentMethod` (`PIX` ou `CREDIT_CARD`)
  - Documento/endereço: `cpfCnpj`, `cep`, `addressNumber`, `endereco`, `bairro`, `cidade`, `uf`
  - Cartão (quando `paymentMethod = CREDIT_CARD`): `cardHolderName`, `cardNumber`, `cardExpiryMonth`, `cardExpiryYear`, `cardCvv`

## Carregamento inicial do catálogo

Quando o componente monta:

1. Faz `GET ${API_BASE_URL}/public-leads/catalog`
2. Em sucesso:
   - Preenche `catalog` com `data.states`
   - Define `form.state` com o primeiro estado disponível
3. Em falha: usa fallback visual de estados/segmentos

## Quote e disponibilidade (com cupom)

O front chama automaticamente:

- `GET ${API_BASE_URL}/public-leads/quote?state=...&segment=...`
- Se existir cupom ativo (`couponApplied`): adiciona `&couponCode=...`

Ele usa `availableCount` como referência e, quando `availableCount > 0`, sobrescreve a `form.quantity` com o total disponível retornado.

### Aplicação de cupom (button "OK")

Ao clicar em “OK” do cupom:

1. Normaliza o código com `trim().toUpperCase()`
2. Chama o endpoint `quote` com `couponCode=...`
3. Se sucesso:
   - `couponApplied = normalizado`
   - `discountAmount` é atualizado com `data.discountAmount`
4. Em erro:
   - limpa `couponApplied` e zera `discountAmount`
   - mostra `error`

## Cálculo de preço no front

- Regra de preço implementada no front: `R$ 0,01` por lead.
- Exibe:
  - `grossAmount = quantity * 0.01`
  - `chargedAmount = max(0, grossAmount - discountAmount)`

## Campos de Endereço e Documento + Auto-preenchimento por CEP

Na etapa “Endereço e Documento” existem:

- `CEP *` (obrigatório)
- `Número *`
- `Endereço *`
- `Bairro *`
- `Cidade *`
- `UF *`
- `CPF ou CNPJ *`

### Como o CEP preenche automaticamente

Existe um `useEffect` que observa `form.cep`:

1. Remove caracteres não numéricos e valida se tem **8 dígitos**
2. Se não tiver 8 dígitos:
   - limpa `endereco/bairro/cidade/uf`
   - mantém `readOnly` nos campos dependentes
3. Se tiver 8 dígitos:
   - faz request público para ViaCEP:
     - `https://viacep.com.br/ws/${cep}/json/`
   - se retornar sucesso, preenche:
     - `endereco` = `logradouro`
     - `bairro` = `bairro`
     - `cidade` = `localidade`
     - `uf` = `uf` (uppercase)

Os campos de `Endereço/Bairro/Cidade/UF` ficam `readOnly` até o CEP ser resolvido com sucesso.

## Forma de pagamento (PIX e Cartão de Crédito)

Na etapa “Forma de Pagamento”:

- Alterna entre botões:
  - `PIX`
  - `Cartão de Crédito` (internamente `paymentMethod = CREDIT_CARD`)

### Quando é Cartão de Crédito

Mostra campos do cartão:
- Nome impresso (`cardHolderName`)
- Número (`cardNumber`)
- Validade (mês e ano)
- CVV (`cardCvv`)

Antes de enviar, o front valida:

- Número do cartão:
  - 13 a 19 dígitos (após limpar máscara)
- Validade:
  - mês entre 1 e 12
  - ano entre 2024 e 2099
  - cartão não pode estar expirado (comparação com data atual)
- CVV:
  - 3 ou 4 dígitos
- CEP:
  - exatamente 8 dígitos numéricos
- CPF/CNPJ:
  - precisa ter ao menos 11 dígitos numéricos após limpar
- Número do endereço:
  - não pode ficar vazio

## Envio do checkout (POST create-checkout)

Ao submeter o modal:

### Endpoint

- `POST ${API_BASE_URL}/public-leads/create-checkout`

### Payload enviado (mapeamento)

Campos gerais:
- `buyerName`, `buyerEmail`, `buyerWhatsapp`
- `state`, `segment`, `quantity`
- `paymentMethod` (`PIX` ou `CREDIT_CARD`)
- `cpfCnpj`, `cep`, `addressNumber`
- `endereco`, `bairro`, `cidade`, `uf`
- `couponCode` (quando cupom aplicado)

Quando `paymentMethod = CREDIT_CARD`:
- adiciona `creditCard`:
  - `holderName`
  - `number` (apenas dígitos)
  - `expiryMonth` (padStart 2 dígitos)
  - `expiryYear`
  - `ccv` (apenas dígitos)

### Resposta e comportamento pós-submit

Em sucesso:
- salva `paymentId`, `invoiceUrl`, `pixCopyPaste`, `pixQrCodeImage`

Se `paymentStatus` vier como:
- `CONFIRMED` ou `RECEIVED` → redireciona para `/obrigado`

Se não vier pago:
- abre a área de finalização quando houver `invoiceUrl` e/ou dados de PIX retornados
- botão “Verificar status do pagamento” chama:
  - `GET /public-leads/payment-status?paymentId=...`

## AdminUpload (seção administrativa)

Página `src/pages/AdminUpload.tsx`:

- faz upload de CSV para:
  - `POST ${API_BASE_URL}/public-leads/admin/upload-staging`
- header:
  - `x-admin-token`
- body:
  - `csvContent`
  - `delimiter` (opcional, default `,`)
  - `fileName` (opcional; o backend não depende fortemente deste campo)

## Onde ver o backend relacionado

Backend da compra pública:
- `leads-api/src/main/controller/PublicLeadCheckoutController.ts`

Rotas:
- `leads-api/src/main/routes/PublicLeadCheckoutRoutes.ts`

