# AGENTS.md — SuitServiHogar

> **Contexto mínimo:** Este archivo es el único contexto que se carga siempre.
> Para funciones específicas, usa `INDEX_FUNCIONES.md` (file:line).

## Stack
React 19 + Vite + TypeScript + Tailwind v4 | Supabase | Google OAuth | Stripe Connect

## Quick Start
```bash
start.bat                    # Vite (3000) + Stripe server (3010)
npm run dev && npx tsx server.js
```

## Architecture (file:line en INDEX_FUNCIONES.md)
```
src/lib/         → supabase, stripe, constants (rate 18.0, colonias)
src/services/    → authService, categoryService, technicianService, bookingService
src/hooks/       → useStripePayment (createPaymentIntent + confirmPayment)
src/components/  → screens/ (7) + modals/ (5) + Header, BottomNav, StripeCardInput
src/App.tsx      → Auth, routing, payment handler, modals
server.js        → Express: Connect onboarding + PaymentIntent + webhook (port 3010)
schema.sql       → sh_service_categories, sh_technicians, sh_orders
```

## DB (Supabase `egyxgnlnzanxpqyuvmsg`)
- `sh_service_categories` — 13 categorías
- `sh_technicians` — 115+ técnicos (email, stripe_account_id)
- `sh_orders` — Órdenes escrow + status machine
- `sh-evidence` bucket — fotos de evidencia

### Status Machine
```
draft → funded → in_progress → completed → released
  (creada)  (pagada)   (en ruta)    (terminado)  (liberado)
```

## Auth Flow (authService.ts:29)
`Google OAuth → onAuthStateChange → getTechnicianByEmail(email) → currentTechnician`

## Payment Flow (useStripePayment.ts:14)
```
BookingEscrowScreen → createPaymentIntent(order, stripeAccountId)
→ POST /api/create-payment-intent → Stripe split (configurable% platform / rest tech)
→ confirmCardPayment → createOrder() → updateOrderStatus('funded')
```
Test card: `4242 4242 4242 4242` | future date | CVC 123 | ZIP 88720

## Technician Flow (TechnicianOrdersScreen.tsx:24)
```
Perfil → "Ver Mis Órdenes" → tabs Activas/Historial
  funded → "Iniciar ruta" → in_progress
  in_progress → "Marcar completado" → completed
  completed → "Finalizar (PIN)" → modal → released
```

## Conventions
- Single-tenant | Soft delete (`activo = FALSE`) | Sequential IDs (no UUIDs)
- Bimonetary MXN/USD, rate 18.0 | Montos centavos INTEGER en BD
- Stripe Connect: `application_fee_amount` (configurable desde `sh_config`) + `transfer_data.destination`

## Cancellation Rules
| Quién | Condición | Acción |
|-------|-----------|--------|
| Cliente | >24h | Gratis |
| Cliente | <24h | $120 MXN fee |
| Técnico | <2h antes | $150 MXN + -0.2★ + cupón $100 |
| Técnico | >2h antes | Sin penalización |

## Donations
- Plataforma 1% → `charity_fee_mxn` | Cliente round-up → `roundup_donation_mxn`
- Beneficiario: "Fundación Hogar Digno AC"

## Configuración desde Backoffice (`sh_config`)

Parámetros de negocio configurables desde el admin panel (categoría `decisions`):

| Key | Valor por defecto | Descripción |
|---|---|---|
| `platform_fee_pct` | `15` | % comisión plataforma |
| `volume_discount_pct` | `10` | % comisión con descuento por volumen |
| `volume_min_orders` | `20` | Órdenes liberadas/mes mínimo para descuento |
| `volume_min_rating` | `4.7` | Rating mínimo para calificar a descuento |
| `coupon_max_discount_pct` | `50` | Máximo % descuento cupón sobre total |
| `referral_tech_reward_mxn` | `15000` | Recompensa referido técnico (centavos) |
| `referral_client_reward_mxn` | `10000` | Recompensa referido cliente (centavos) |
| `charity_fee_pct` | `1` | % comisión caridad |

**Flujo:** `server.js` lee de `sh_config` al iniciar y cachéa 5 min. AdminScreen tab "Configuración" permite editar.

## Load Strategy (para agentes SuitOS)
- **minimal** (2K tokens): solo este archivo
- **standard** (8K): este archivo + INDEX_FUNCIONES.md + service específico
- **deep** (20K): + schema.sql + server.js + contexto completo

**Regla de eficiencia:** Cargar SOLO lo necesario. Usar `strategy.yaml` para determinar nivel. No sobrecargar contexto.

## Excepción Arquitectónica (ADR-029)

**SuitServiHogar es un micro-frontend aislado** — no se integra al SPA principal SuitOrg.

| Aspecto | Detalle |
|---------|---------|
| **Framework** | React 19 (excepción a Regla #7 SuitOrg: vanilla JS only) |
| **Integración** | Standalone — comunica vía URLs externas o APIs compartidas |
| **Equipo** | Se mantiene independientemente del ciclo SuitOrg |
| **Referencia** | `.suit/memory/decisions/ADR-029-suit servihogar-microfrontend-aislado.md` |

**Por qué existe esta excepción:** El MVP está completo (41/41 reqs) y funcional. Reescribir a vanilla JS costaría 2-3 meses adicionales sin beneficio inmediato para el usuario final.
