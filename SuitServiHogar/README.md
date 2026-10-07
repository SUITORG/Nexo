# SuitServiHogar

Marketplace de servicios para el hogar en **Reynosa, Tamaulipas**: conecta familias con técnicos verificados (INE + biometría), con pago en **escrow** (Stripe Connect) y PIN de conformidad. Micro-frontend **aislado** del SPA SuitOrg (ADR-029) — React 19 con su propio backend Express y su propia base Supabase.

| Capa | Stack |
|---|---|
| Frontend | React 19 · Vite · TypeScript · Tailwind v4 (puerto 3000) |
| Backend | Express (`server.js`, puerto 3010): Stripe Connect, PaymentIntent, webhook, CFDI, IA de descripción (OpenRouter) |
| Datos | Supabase (`egyxgnlnzanxpqyuvmsg`) con RLS, prefijo `sh_` |
| Pagos | Stripe Connect — split configurable (default 15% plataforma) desde `sh_config` |

## Quick Start

```bash
npm install
cp .env.example .env      # completa Supabase + Stripe
npm run dev               # Vite en 3000
npx tsx server.js         # API en 3010
```

**Test card:** `4242 4242 4242 4242` · fecha futura · CVC 123 · ZIP 88720

## Scripts

```bash
npm run lint              # tsc --noEmit + eslint (max-warnings 0)
npm test                  # vitest run (unit)
npm run test:e2e          # playwright (requiere dev server + secrets)
npm run test:coverage     # cobertura
node scripts/generate-index.js   # regenera INDEX_FUNCIONES.md (13 pantallas + 5 modales)
```

## Estructura

```
src/
  components/screens/   → 13 pantallas (Home, Explore, BookingEscrow, Chat, Admin…)
  components/modals/    → 5 modales (perfil técnico, colonia, visita, pago, reglas)
  services/             → auth, category, technician, booking, exchangeRate, gps
  hooks/                → useStripePayment
server.js               → Express (Stripe Connect + webhook + config + CFDI + IA)
server/cfdiGenerator.js → generación XML CFDI
supabase/migrations/    → FUENTE CANÓNICA SQL (idempotentes, con RLS)
migrations/_archivadas/ → SQL histórico (ver README allí)
docs/                   → Contrato (41/41), manuales, auditoría 05-16, runbooks, evals
```

## Documentación

- `docs/Contrato.md` — requisitos 41/41 e invariantes (fuente de verdad)
- `AGENTS.md` — reglas y convenciones para agentes
- `INDEX_FUNCIONES.md` — índice file:line (autogenerado)
- `docs/runbooks/` — despliegue y rollback
- Evaluación: `docs/veredicto.md` (Panel Juzgador 6.93/10 — APROBADO CONDICIONAL)

## Estado

MVP completo (41/41 requisitos, unit + e2e + CI). En laptop (sin host de producción — `docs/runbooks/despliegue.md`). Go-live pendiente de las condiciones críticas en `docs/15-riesgos-deuda-tecnica-y-backlog.md`.
