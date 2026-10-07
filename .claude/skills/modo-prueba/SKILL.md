# Skill: modo-prueba

## Descripción
Levanta SuitServiHogar en modo prueba local con un solo comando y valida el flujo completo de QA (cliente → técnico → admin) usando mocks, sin servicios de pago ni de tipo de cambio reales. Cubre `qa.bat` (3 ventanas con roles), la precedencia de flags de `devMode` (env → URL → localStorage), el candado anti-producción + badge "MODO PRUEBA", y el e2e `tests/e2e/flujo-dev.spec.ts`.

## Trigger
- "modo de prueba local", "modo prueba", "modo test local", "levanta el modo prueba"
- "qa.bat", "3 ventanas con roles", "prueba cliente técnico admin"
- "flujo dev", "flujo-dev", "badge modo prueba", "candado de producción"

## Pasos
1. Levantar: `SuitServiHogar/qa.bat` — mata instancias previas en 3000/3010, levanta backend (3010) y frontend (3000) cada uno en ventana propia con banner y hora (`*****`), espera LISTEN y abre 3 ventanas con `?devMode=true&devMockStripe=true&devMockExchangeRate=true&devAutoLogin=client|technician|admin`.
2. Verificar el badge **MODO PRUEBA** en cada ventana (solo aparece si `isDevMode()`).
3. Flujo manual: cliente "Contratar Garantía" → dirección → Pagar (mock) → modal "Custodia Escrow Activada" (muestra id `ORD-*`); técnico: Perfil → "Ver Mis Órdenes" → Iniciar ruta → Marcar completado → PIN `8821` → Liberar fondos → "Liberado / Pagado" en Historial; admin: Perfil → "Panel de Administración" → "Admin Panel".
4. Automatizar: `npm run test:e2e` (smoke 4 + flujo-dev 1) o solo `npm run test:e2e -- tests/e2e/flujo-dev.spec.ts`. Playwright levanta vite:3000 y `npx tsx server.js`:3010 solo.

## Reglas
- Precedencia de flags: env `VITE_*` → URL param → localStorage. El param es `devAutoLogin` (no `autoLogin`).
- Candado: `isDevMode()` devuelve false en build PROD fuera de localhost (`src/config/devMode.ts`) — no desactivarlo para "arreglar" nada.
- Mock de pago en frontend (`useStripePayment`): sin `/api/create-payment-intent` ni API de Stripe; Stripe.js solo carga el Card Element. Exchange fijo 18.0 sin Fixer.io (el e2e aborta `data.fixer.io`).
- Identidades QA (`cliente-qa@test.mx`, `roberto@servihogar.mx`, `admin@servihogar.mx`, pass `DEV_QA_PASSWORD` en `.env`): las crea/garantiza `POST /api/dev/qa-login`, incluida la fila `sh_technicians` con rol (sin pisar filas existentes).
- `sh_orders.id` es TEXT PK sin default: `createOrder()` genera `ORD-<timestamp base36>` y la orden creada se pasa a `onPaySuccess(created)` para marcar `funded` en la fila real (nunca en `INITIAL_ORDER`).

## Referencias
- `SuitServiHogar/qa.bat`, `SuitServiHogar/tests/e2e/flujo-dev.spec.ts`
- `SuitServiHogar/src/config/devMode.ts`, `src/components/DevModeBadge.tsx`, `src/hooks/useStripePayment.ts`
- `SuitServiHogar/docs/MANUAL_PRUEBAS.md` (v1.1 §2/§3/§5/§7/§9)
