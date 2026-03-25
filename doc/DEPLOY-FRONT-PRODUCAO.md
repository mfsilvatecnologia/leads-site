# Deploy do site (front) em produção – Checkout

Site em **Netlify** (disparorapido.com.br). O checkout chama a API via `VITE_API_URL`.

---

## Ordem recomendada: Backend → Front

1. **Subir o backend** (stack com nova imagem + Supabase novo) em produção.
2. **Testar a API**: `https://api.disparorapido.com.br/api/health` e, se possível, um teste de checkout.
3. **Subir o front** com `VITE_API_URL` apontando para essa API.

Assim, quando o site for publicado, o checkout já funciona na hora.

Se preferir **front primeiro**: o site pode ir ao ar antes; o checkout só passa a funcionar quando o backend estiver atualizado (mesma URL da API).

---

## Variável obrigatória no build do site

No **Netlify** (ou no build que gera o `dist`):

| Variável        | Valor (produção) |
|-----------------|------------------|
| `VITE_API_URL`  | `https://api.disparorapido.com.br/api/v1` |

- No Netlify: **Site settings → Environment variables** → adicione `VITE_API_URL` = `https://api.disparorapido.com.br/api/v1`.
- Faça um **novo deploy** (ou “Clear cache and deploy”) para o build usar essa URL.

Se não definir `VITE_API_URL`, o código usa o fallback `http://localhost:3000/api/v1` e o checkout quebra em produção.

---

## Build local (testar antes de subir)

```bash
cd site-disparo-rapido
VITE_API_URL=https://api.disparorapido.com.br/api/v1 pnpm run build
# ou crie .env.production com:
# VITE_API_URL=https://api.disparorapido.com.br/api/v1
pnpm run build
```

Depois abra `dist/index.html` (ou sirva a pasta `dist`) e teste o fluxo até o checkout.

---

## Rotas do checkout no site

- `/checkout` e `/checkout-transparente` → **CheckoutTransparente** (registro + pagamento).
- `/checkout/create` (API) é usado pelos iframes/links de checkout mensal/anual.

Garanta que a API de produção está no ar e que `VITE_API_URL` no build do site aponta para ela.
