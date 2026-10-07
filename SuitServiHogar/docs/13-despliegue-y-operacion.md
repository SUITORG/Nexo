# 13 — Despliegue y operación · SuitServiHogar

> **Para qué sirve este documento:** entornos, pipeline CI/CD, configuración, monitoreo y checklists de despliegue.
> **Última revisión:** 2026-10-04 · **Generado por:** skill `auditoria` (llamada por `guia-total`)
> **Fuentes:** `SuitServiHogar/.github/workflows/ci.yml`, `package.json`, `.env.example`, `AGENTS.md`.

## Entornos

| Entorno | Qué corre | Puerto | Estado |
|---|---|---|---|
| Local dev | Vite + Express dev | 3000 / 3010 | `VERIFICADO` |
| CI (GitHub Actions) | lint + tsc + vitest + Playwright | — | `VERIFICADO` |
| Producción (frontend) | GitHub Pages desde `dist/` | 443 | `PROBABLE` — pipeline existe; **pasos extra no son necesarios**… ver nota |
| Producción (backend) | `server.js` (Express, Stripe, Supabase) | 3010 | `DESCONOCIDO` — sin runbook de host |

> ⚠️ **Gap de pipeline**: `ci.yml` solo despliega el **frontend** estático a GitHub Pages. **No hay paso que despliegue `server.js`** (backend). Estado: `DESCONOCIDO` — el backend no se despliega vía este workflow. Candidato a runbook.

## Pipeline CI/CD (`.github/workflows/ci.yml`)

Dispara en `push` a `main`/`develop` y `pull_request` a `main`. Node 20.x. 5 jobs:

| Job | Pasos | Gate |
|---|---|---|
| `lint-and-typecheck` | `npm ci` → `tsc --noEmit` → `eslint src --max-warnings 0` | bloqueante |
| `unit-tests` | `npm run test -- --run` (Vitest) | bloqueante |
| `e2e-tests` | build → `npm run dev &` → espera `curl localhost:3000` → `playwright test` (timeout 30 min) → sube `playwright-report/` (retención 7 días) | bloqueante; secrets `VITE_*` |
| `deploy-preview` | build + echo (Vercel/Netlify **comentado**, sin configurar) | solo en PR — **placeholder inerte** |
| `deploy-production` | build → `configure-pages` → `upload-pages-artifact` (`./dist`) → `deploy-pages` | solo push a `main`; requiere tests verdes |

**Riesgos del pipeline:**
1. `deploy-production` despliega `dist/` pero **el backend (`server.js`) no se despliega** → el frontend en Pages llama a un API que debe correr aparte. `DESCONOCIDO` cómo corre en producción. **Bloqueante para go-live.**
2. `deploy-preview` es un placeholder (`echo`) — sin valor real. `VERIFICADO`.
3. E2E depende de secrets reales de Supabase/Stripe en GitHub — si faltan, `e2e-tests` falla y bloquea el deploy. `PROBABLE`.

## Configuración por entorno

| Var | Entorno | Notas |
|---|---|---|
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | frontend | públicas (anon) |
| `VITE_STRIPE_PUBLISHABLEABLE_KEY` / `STRIPE_SECRET_KEY` | frontend/backend | test: `pk_test` / `sk_test` |
| `STRIPE_PORT` | backend | default 3010 |
| `SUPABASE_SERVICE_ROLE_KEY` | backend | **bypasa RLS** — solo server-side, nunca en cliente |
| `OPENROUTER_API_KEY` | backend | IA de descripción |
| `FIXER_KEY` | backend | **falta en `.env.example`** → `DESCONOCIDO` |
| `VITE_GOOGLE_MAPS_KEY` (o similar) | frontend | **falta en `.env.example`** → `DESCONOCIDO` |
| `NODE_ENV` | backend | `production` ⇒ `IS_DEV=false` (apaga dev endpoints) |

Secrets en GitHub para CI. `.env` local gitignorado (`.env*` en `.gitignore`). `dotenv.config({ override: true })` — riesgo de vars stale del entorno Windows.

## Monitoreo, logs, backups

| Área | Estado | Detalle |
|---|---|---|
| Logs | `DESCONOCIDO` | `console.*` en `server.js`; sin archivo central ni servicio |
| Alertas | `DESCONOCIDO` | sin dead man switch / Error Budget / Dead Man's Shoes en repo |
| Errores producción | `DESCONOCIDO` | sin Sentry ni equivalente (riesgo crítico veredicto) |
| Backups BD | `PROBABLE` | Supabase hace backups según plan; **no probado restore** |
| Métricas negocio | `PROBABLE` | KPIs definidos en evals (50 órdenes/semana mes 3, NPS>40…) pero sin pipeline de medición |

## Checklist pre-despliegue

- [ ] `tsc --noEmit` + eslint en verde
- [ ] Vitest en verde
- [ ] Playwright e2e en verde
- [ ] Secrets de GitHub actualizados (Supabase, Stripe)
- [ ] `.env.example` al día con TODAS las vars reales (hoy falta `FIXER_KEY`, Maps key)
- [ ] Backend desplegado + healthcheck `GET /api/config` responde
- [ ] Webhook Stripe apunta a la URL pública correcta
- [ ] `node --check server.js` si hubo cambios en backend

## Checklist post-despliegue

- [ ] Frontend en Pages carga (curl 200)
- [ ] `GET /api/config` responde desde el entorno
- [ ] Flujo de prueba E2E manual con test card `4242…`
- [ ] Logs sin errores nuevos
- [ ] Si algo falla → rollback ver `runbooks/rollback.md` (no existe aún → `DECISIÓN PENDIENTE`)

## Runbooks

**Creados 2026-10-07** en `docs/runbooks/`:
- ✅ `despliegue.md` — laptop (actual), CI → Pages, backend prod = `[PENDIENTE]` (sin host), healthcheck `GET /api/config/category/platform`, webhook Stripe vía túnel.
- ✅ `rollback.md` — revert frontend (git revert → CI), backend (checkout sha), BD (forward-only: migración de reversión / PITR / soft delete).
- ⬜ Faltan: `incidentes.md`, `backups-y-restauracion.md`, `rotacion-de-secretos.md` (D-07).
