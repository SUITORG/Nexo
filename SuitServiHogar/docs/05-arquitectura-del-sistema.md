# 05 — Arquitectura del sistema · SuitServiHogar

> **Para qué sirve este documento:** resumen de la arquitectura **actual** (no deseada) de SuitServiHogar, con evidencia y estado de certeza por hallazgo.
> **Última revisión:** 2026-09-26 · **Generado por:** skill `auditoria` (piloto) · **Fuentes:** `package.json`, `docs/Contrato.md`, `docs/MANUAL_TECNICO.md`, `supabase/migrations/`, `.github/workflows/ci.yml`

## Resumen de arquitectura actual

Micro-frontend **aislado** (ADR-029) que no se integra al SPA principal de SuitOrg: app React con su propio backend Express y su propia base Supabase.

```text
React 19 + Vite (3000) → Express (3010) → Supabase PostgreSQL → [Stripe Connect, Gemini, Fixer.io]
```

| Capa | Tecnología | Evidencia | Estado |
|---|---|---|---|
| Frontend | React 19, Vite, Tailwind 4, motion, lucide-react | `package.json` deps | `VERIFICADO` |
| Backend | Express 4 (`server.js` raíz), helmet, cors, express-rate-limit, dotenv | `package.json`, cabecera de `server.js` | `VERIFICADO` |
| Datos | Supabase (`@supabase/supabase-js`), migraciones SQL con RLS | `supabase/migrations/*_security_rls.sql`, `schema.sql` | `VERIFICADO` |
| Pagos | Stripe + `@stripe/react-stripe-js` + Stripe Connect (SQL) | `package.json`, `migrations/20260914170500_stripe_connect.sql` | `VERIFICADO` |
| IA | `@google/genai` (Gemini) en deps | `package.json` — **sin uso detectado** en `src/` ni `server.js` (posible resto del template AI Studio) | `PROBABLE` (candidato a dependencia muerta) |
| IA (precios) | OpenRouter (`OPENROUTER_API_KEY`, SuitMargin Fase 9) | `.env.example`, comentario en `server.js:5` | `VERIFICADO` |
| Facturación | `server/cfdiGenerator.js` (CFDI) importado por `server.js` | `server.js:8` | `VERIFICADO` |
| FX | Fixer.io API fallback 18.0 | `src/services/exchangeRate.ts`, `docs/Contrato.md` req. 26 | `VERIFICADO` |
| CI | GitHub Actions `ci.yml` (lint → tsc → eslint → vitest → e2e → deploy) | `.github/workflows/ci.yml` | `VERIFICADO` |
| Calidad | `tsc --noEmit` + eslint + vitest + playwright | scripts de `package.json` | `VERIFICADO` (a diferencia de la raíz, **sí tiene lint y tests**) |
| Evaluación | Panel Juzgador corrió: **6.93/10 — APROBADO CONDICIONAL** (4/4 dimensiones) | `docs/veredicto.md`, `docs/eval_*.md` | `VERIFICADO` |

## Principios de diseño (por ADR)

1. **Aislamiento** (ADR-029): no comparte código ni runtime con el SPA SuitOrg — solo vive en el monorepo.
2. **Privacidad/consentimiento** (ADR-030): manejo legal de datos personales.
3. **Escrow de pagos**: cliente deposita → técnico libera con PIN (flujo de `docs/MANUAL_PROVEEDOR.md`).
4. **RLS en Supabase**: políticas de seguridad por fila (`security_rls.sql`).

## Límites entre módulos

- `src/` (frontend) ↔ `server/` (backend Express): HTTP por puerto 3010.
- Backend ↔ Supabase: SDK con migraciones versionadas en `supabase/migrations/`.
- SuitServiHogar ↔ SuitOrg raíz: **sin dependencias cruzadas** (regla de ADR-029); el contrato padre `../../CONTRATO.md` solo aporta clasificación.

## Decisiones enlazadas (ADRs reales en `.suit/memory/decisions/`)

- `ADR-029-suit servihogar-microfrontend-aislado.md`
- `ADR-030-suit-servihogar-privacidad-legal.md`
- *(nuevas decisiones → comando `/suit-memory`)*

## Brechas detectadas (para `15-riesgos…`)

| Brecha | Evidencia | Prioridad |
|---|---|---|
| ~~**SQL en 4 ubicaciones sin fuente canónica + drift**~~ → **RESUELTO 2026-10-07**: 3 migraciones consolidadas idempotentes en `supabase/migrations/`; `migrations/` archivado con ZIP en `_archivadas/` | `migrations/README.md` | `RESUELTO` |
| ~~`AGENTS.md` desactualizado: dice `screens/ (7)`, hay **13**~~ → **RESUELTO 2026-10-04** | `AGENTS.md:20` | `RESUELTO` |
| ~~`README.md` es el template de AI Studio~~ → **RESUELTO 2026-10-07** (README real) | `README.md` | `RESUELTO` |
| ~~`package.json` name = `react-example`~~ → **RESUELTO 2026-10-07** (`suit-servihogar`) | `package.json:2` | `RESUELTO` |
| ~~Ruido en raíz + evaluaciones fuera de `docs/`~~ → **limpiado 2026-09-26** | dir listing | `VERIFICADO` (resuelto) |
| ~~`@google/genai` sin uso detectado~~ → **RESUELTO 2026-10-07** (`npm uninstall`) | grep en `src/`+`server.js` | `RESUELTO` |
| `schema.sql` y `migration_v2.sql` duplicados en raíz del proyecto (fuera del estándar `supabase/migrations/`) | raíz SuitServiHogar | baja |
| `INDEX_FUNCIONES.md` regenerado 2026-10-07 (13 pantallas + 5 modales ✓) — nota: formato simple `Línea|Export`, sin descripciones curadas de la versión anterior | `node scripts/generate-index.js` | info |

## Arquitectura objetivo

No aplica actualmente — no se aprobó un cambio de arquitectura. *(Revisar si cambia ADR.)*
