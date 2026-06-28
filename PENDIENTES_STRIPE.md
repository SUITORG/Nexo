# Pendientes — Stripe (Pagos con Tarjeta)

## ✅ Completado por OpenCode

- [x] Módulo Stripe en `conecionpagos/index.js` (createPaymentIntent, webhook handler)
- [x] Endpoints en `server.js`: `/api/stripe/config`, `/api/stripe/create-payment-intent`, `/api/stripe/payment-status/:intentId`, `/api/stripe/webhook`
- [x] CSP (Helmet) actualizado con dominios de Stripe
- [x] Botón "Tarjeta" agregado al POS (sidebar y checkout público)
- [x] Stripe Elements embebido para ingreso de tarjeta
- [x] Lógica de pago Stripe en `js/modules/pos.js` (app.pos.stripe)
- [x] Flujo de checkout modificado: si método = Tarjeta, primero cobra con Stripe, luego registra orden
- [x] `metodo_pago = "Tarjeta Stripe"` en Pagos y Proyectos_Pagos
- [x] Columnas Stripe agregadas a `Config_Empresas` via seed (`stripe_activo`, `stripe_public_key`)
- [x] Columna `referencia_stripe` agregada a `Pagos` y `Proyectos_Pagos` via seed
- [x] `.env.example` actualizado con variables de Stripe

## 🔴 Pendiente de ti (lo que no puedo automatizar)

- [ ] **Crear cuenta Stripe** en https://stripe.com (gratis, 5 minutos)
- [ ] Obtener tus **API Keys** en Dashboard > Developers > API Keys:
      - `Public Key` (empieza con `pk_live_` o `pk_test_`)
      - `Secret Key` (empieza con `sk_live_` o `sk_test_`)
- [ ] Configurar en `.env`:
      ```
      STRIPE_SECRET_KEY=sk_live_...
      STRIPE_PUB_KEY=pk_live_...
      STRIPE_WEBHOOK_SECRET=whsec_...
      ```
- [ ] (Opcional) Si quieres por negocio, agrega en `Config_Empresas` (Google Sheets):
      - `stripe_activo = TRUE` para negocios que acepten tarjeta
      - `stripe_public_key = pk_live_...` (su propia clave si tienen cuenta propia)
      - Y en `.env`: `STRIPE_SECRET_KEY_NOMBREEMPRESA=sk_live_...`
- [ ] Configurar **Webhook** en Stripe Dashboard > Developers > Webhooks:
      - URL: `https://tudominio.com/api/stripe/webhook`
      - Eventos: `payment_intent.succeeded`, `payment_intent.payment_failed`
      - Firmar con el `STRIPE_WEBHOOK_SECRET` que te da Stripe
- [ ] **Redeploy GAS**: `clasp push` para activar las nuevas columnas en sheets
- [ ] Probar con una tarjeta de prueba: `4242 4242 4242 4242`, CVV cualquiera, fecha futura

## 🔴 Pendiente — Prospección Comercial (prospectos/)

- [ ] **Obtener Google Maps Places API Key** en [console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials)
      - Habilitar: **Places API**
      - Agregar al `.env` de la raíz de SUITORGSTORE01 o a `prospectos/.env`: `GOOGLE_MAPS_API_KEY=AIzaSy...`
      - Luego probar: `node prospectos/prospect.js --ciudad Monterrey --nicho restaurantes --radio 3`

## 🟡 Notas técnicas

- Stripe **nunca guarda números de tarjeta en tu servidor** — ellos manejan la seguridad (PCI DSS)
- El flujo es: Frontend (Stripe Elements) → Tu Server (PaymentIntent) → Stripe → Webhook → Tu Server
- Si el webhook no está configurado, los pagos igual funcionan (el frontend confirma el éxito)
- Cada negocio puede tener su propia cuenta Stripe (multi-tenant verdadero) o usar una global
