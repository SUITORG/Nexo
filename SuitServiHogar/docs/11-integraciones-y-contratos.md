# 11 — Integraciones y contratos · SuitServiHogar

> **Para qué sirve este documento:** sistema externo, propósito, datos, auth, límites y manejo de fallos.
> **Última revisión:** 2026-10-04 · **Generado por:** skill `auditoria` (llamada por `guia-total`)
> **Fuentes:** `server.js`, `src/services/`, `.env.example`, `package.json`, `docs/veredicto.md`.

## 1. Stripe (pagos + Connect + Escrow)

| Campo | Detalle | Estado |
|---|---|---|
| Propósito | Onboarding de técnicos (`create-connect-account`), cobro al cliente con retención (`create-payment-intent`), webhooks de eventos de pago | `VERIFICADO` |
| Datos enviados | monto (centavos), cuenta Connect, metadata de orden | `VERIFICADO` |
| Datos recibidos | `payment_intent.succeeded` y relacionados vía webhook | `VERIFICADO` |
| Auth | `STRIPE_SECRET_KEY`; webhook firma `stripe.webhooks.construct` | `PROBABLE` (no verificado línea a línea) |
| Endpoints | `POST /api/create-connect-account`, `POST /api/create-payment-intent`, `POST /api/webhook` | `VERIFICADO` (`server.js:104,141,261`) |
| Idempotencia | webhook registrado con `express.raw` **antes** de `express.json()` (regla AGENTS.md) — orden `server.js` verificado por lectura de líneas 104-261 | `PROBABLE` |
| Límites/cuotas | Tarjeta test `4242…`; modo live → cuotas por transacción (no documentadas en repo) | `PROBABLE` |
| Fallos | PaymentIntent fallido → orden no `funded` | `PROBABLE` |
| Riesgo | **SLA y chargebacks NO documentados** — riesgo CRÍTICO del veredicto | `RIESGO` |

## 2. Fixer.io (tipo de cambio FX)

| Campo | Detalle | Estado |
|---|---|---|
| Propósito | Cotización MXN/USD en vivo | `VERIFICADO` |
| Endpoint | `https://data.fixer.io/api/latest?access_key=…&base=…&symbols=…` (`exchangeRate.ts:9`) | `VERIFICADO` |
| Auth | access key en `FIXER_KEY` (no está en `.env.example` → **falta documentar**) | `DESCONOCIDO` |
| Límites | **plan gratuito = 100 req/mes** (riesgo CRÍTICO veredicto) | `VERIFICADO` (doc) |
| Fallo/Fallback | cualquier error → tipo fijo **18.0** (`Contrato.md` req. 26) | `VERIFICADO` |
| Mitigación pendiente | plan pago o migrar a API Banxico — pendiente decisión | `DECISIÓN PENDIENTE` |

## 3. OpenRouter (IA de descripción de trabajo)

| Campo | Detalle | Estado |
|---|---|---|
| Propósito | Analizar descripción del trabajo y devolver estructura JSON (SuitMargin Fase 9) | `VERIFICADO` |
| Endpoint | `POST /api/ai/analyze` (`server.js:774`) → `https://openrouter.ai/api/v1/chat/completions` | `VERIFICADO` |
| Datos enviados | descripción (≤4000 chars), system prompt; **no** datos personales explícitos | `PROBABLE` |
| Auth | `OPENROUTER_API_KEY` (`.env.example` sí lo lista) | `VERIFICADO` |
| Modelos | fallback en cadena `AI_MODELS` (free tier) — 429 → espera `retry-after`; 404 → siguiente modelo | `VERIFICADO` |
| Límites | rate limit propio `aiLimiter` + límites free de OpenRouter | `PROBABLE` |
| Fallos | 503 sin key · 502 upstream · 400 sin descripción | `VERIFICADO` |
| ⚠️ | `dotenv.config({ override: true })` — key stale a nivel Windows puede ganar sobre `.env` (documentado `server.js:5`) | `RIESGO` |

## 4. Google Maps (geocodificación + mapas)

| Campo | Detalle | Estado |
|---|---|---|
| Propósito | Embed + Static Map del domicilio con **coords ofuscadas** (`gpsService.ts`) | `VERIFICADO` |
| Datos | lat/lng ofuscada, zoom, API key pública Vite | `VERIFICADO` |
| Falta | key de Maps **no documentada** en `.env.example` ni riesgo de cuota al 80% | `DESCONOCIDO` / `RIESGO` (riesgo crítico veredicto: alerta 80% cuota, cache, fallback OSM) |
| Estado | `PROBABLE` — no hay evidence de alertas de cuota | `PROBABLE` |

## 5. Supabase (datos + Auth + RLS)

| Campo | Detalle | Estado |
|---|---|---|
| Propósito | Postgres + Auth + Storage; prefijo `sh_`, RLS en todas las tablas | `VERIFICADO` |
| Backend | `SUPABASE_SERVICE_ROLE_KEY` (bypasa RLS, server-side) | `VERIFICADO` — exige validación total en `server.js` |
| Frontend | `VITE_SUPABASE_URL/ANON_KEY` (anon, sujeto a RLS) | `VERIFICADO` |
| Riesgo | fallback `process.env.SUPABASE_URL || VITE_SUPABASE_URL` → mezcla de vars | `PROBABLE` |

## 6. CFDI (facturación)

| Campo | Detalle | Estado |
|---|---|---|
| Propósito | Generación de XML CFDI | `VERIFICADO` |
| Módulo | `server/cfdiGenerator.js` (`generateCFDIXML`, `escapeXML`, `generateUUID`) | `VERIFICADO` (`server.js:8`) |
| Endpoint | `POST /api/cfdi/generate` (`server.js:578`) | `VERIFICADO` |
| Falta | proveedor PAC / certificado no documentado en repo | `DESCONOCIDO` |

## 7. Google Gemini (`@google/genai`)

Instalado en `package.json` pero **sin uso en `src/` ni `server.js`** → candidato a dependencia muerta (herencia del template AI Studio). Baja prioridad. `PROBABLE`.

---

## Resumen de dependencias

```
SuitServiHogar
 ├─ Stripe (pagos/Connect) ── obligatoria, bloquea go-live si faltan SLA/disputas
 ├─ Supabase (datos/Auth) ── obligatoria
 ├─ Fixer.io (FX) ── con fallback 18.0; riesgo 100 req/mes
 ├─ OpenRouter (IA) ── degradación controlada (fallback de modelos)
 ├─ Google Maps ── sin key documentada
 ├─ CFDI local ── proveedor PAC desconocido
 └─ Gemini ── dependencia muerta (no usada)
```
