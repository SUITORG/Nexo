# ADR-058: Re-cotización in-situ sobre sh_price_negotiations (no columnas en sh_orders)

## Status
Accepted (2026-10-08)

## Context
Req #44: flujo de Re-cotización / Ajuste de Presupuesto in-situ para el Escrow — el técnico propone un monto adicional durante `in_progress` y el cliente aprueba (cobro real) o rechaza. El PRD original pedía columnas nuevas en `sh_bookings` (`adjustment_status`, `original_price`, `adjusted_price`, `adjustment_reason`), pero en este repo: (a) no existe `sh_bookings` (las órdenes son `sh_orders`), (b) ya existe `sh_price_negotiations` (req #41) con máquina de estados `pending → accepted/rejected`, RLS por participantes e `initiated_by` que ya soporta `'technician'`.

## Decision
**Opción A**: extender `sh_price_negotiations` con `phase` ('PRE_PAYMENT' | 'IN_SITU'), `reason`, `extra_amount_mxn` y `stripe_payment_intent_id`, en vez de columnas paralelas en `sh_orders`. Toda la escritura de estados va por **endpoints server-side** (`POST /api/bookings/:id/request-adjustment` y `respond-adjustment` con `requireAuth`); el cobro usa un **2do PaymentIntent** por el extra (metadata `adjustment: 'true'`) confirmado por el cliente, con webhook como respaldo idempotente. Un trigger (`protect_in_situ_accept`) impide que el cliente marque `accepted` directo en fase IN_SITU (saltaría el cobro).

## Rationale
- **Fuente única de precio**: `sh_orders.total_mxn` sigue siendo el total canónico; las columnas propuestas por el PRD habían creado un tercer precio paralelo (ya existía la fractura `total_mxn` vs `agreed_price_mxn` porque `onAgreed` nunca se pasaba).
- Reutiliza tabla, RLS (`negotiation_participants_read`), máquina de estados y 24h de expiración ya probados — diff mínimo.
- La validación de dinero vive en `src/lib/adjustment.js` (compartida server/tests). Unidad: pesos (`total_mxn` = 850, verificado en BD; Stripe recibe `×100`).

## Consequences
- El ajuste no es visible como columna en `sh_orders` — se lee por `order_id` (JOIN/Mapa en frontend).
- Un solo banner de pendiente a la vez por cliente (si hay varias órdenes con ajuste pendiente se resuelven de a una); con identidad QA compartida en e2e, tests deben scoping por `· #ref`.
- Residuo de corridas e2e abortadas = filas `pending` huérfanas (limpiar con `status='expired'`); `cleanup_expired_negotiations()` sigue sin trigger (deuda pre-existente).
- El atajo `mock` del accept solo funciona con `IS_DEV` (mismo supuesto `NODE_ENV=production` que `registerLimiter`).

## Alternatives Considered
- **Opción B — columnas en `sh_orders`** (PRD literal): rechazada — doble fuente de verdad, `original_price` triplicaría `total_mxn`, rompe convención de nombres.
- **Híbrida (lógica + espejo)**: rechazada — sincronización entre dos estados.

## Related
- `SuitServiHogar/supabase/migrations/20261008210000_adjustment_in_situ.sql`
- `SuitServiHogar/server.js` — `request-adjustment` / `respond-adjustment` / `finalizeAdjustment` / webhook
- `SuitServiHogar/src/lib/adjustment.js`, `tests/unit/adjustment.test.ts`, `tests/e2e/ajuste-insitu.spec.ts`
- `SuitServiHogar/docs/Contrato.md` — req #44, Fase 12 (Change Order 2026-10-08)
- ADR-027/req #41 (negociación de precios previa al pago)
