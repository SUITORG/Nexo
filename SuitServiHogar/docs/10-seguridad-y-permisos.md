# 10 — Seguridad y permisos · SuitServiHogar

> **Para qué sirve este documento:** cómo se autentica, qué puede cada rol, cómo se aíslan los datos, se gestionan secretos y se registran eventos críticos.
> **Última revisión:** 2026-09-26 · **Generado por:** skill `auditoria`
> **Fuentes:** `server.js`, `schema.sql`, `migrations/*security_rls.sql`, `admin_role.sql`, `.env.example`, `.gitignore`, `package.json`.

## Autenticación

| Mecanismo | Evidencia | Estado |
|---|---|---|
| Google OAuth | `AGENTS.md` stack (`Google OAuth`) + `LoginScreen.tsx` | `VERIFICADO` (flujo no auditado línea a línea) |
| Admin role en BD | `migrations/20260915080800_admin_role.sql` | `VERIFICADO` (nombre); matriz de permisos `PROBABLE` |
| Sesión (cliente) | Supabase Auth (SDK `@supabase/supabase-js`) | `PROBABLE` |

## Roles y matriz de acceso

| Rol | Frontend | Capas |
|---|---|---|
| Cliente | `HomeScreen`, `BookingEscrowScreen`, `ChatScreen`, `ReviewScreen` | flujo reserva → escrow → PIN |
| Técnico/Aliado | `ProPortalScreen`, `TechnicianOrdersScreen`, `SettlementEscrowScreen` | gestión de órdenes y liquidación |
| Admin | `AdminScreen` | respaldado por `admin_role.sql` |
| Público | `LoginScreen`, `GlossaryScreen`, `PrivacyPolicyScreen`, `TermsScreen` | lectura |

*(Matriz formal por endpoint: `PROBABLE` — no hay documento de matriz; candidato a completarse con ≥84%.)*

## Separación de datos (aislamiento)

- **Single-tenant**: no aplica `id_empresa` — el aislamiento es el prefijo **`sh_`** dentro del Supabase compartido Nexo (evita colisión con tablas de SuitOrg raíz).
- **RLS**: `ENABLE ROW LEVEL SECURITY` al crear las tablas + `security_rls.sql` (políticas por fila). Pública solo la lectura de categorías.
- Escrow: fondos retenidos en **Stripe** (no en BD) — el sistema solo emite órdenes de liberación con PIN.

## Gestión de secretos

- `.env` local **gitignorado** (`.gitignore:7 → .env*`) ✓ · `.env.example` solo nombres ✓ · CI usa secrets de GitHub ✓.
- Vars: `VITE_SUPABASE_URL/ANON_KEY` (frontend), `STRIPE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (backend), `OPENROUTER_API_KEY`.
- ⚠️ **`SUPABASE_SERVICE_ROLE_KEY` en `server.js`** (bypasa RLS): aceptable server-side, pero cualquier fallo de validación en la API = acceso total. Toda validación DEBE estar en `server.js`, nunca confiar en el cliente.
- ⚠️ `dotenv.config({ override: true })` — comentario en `server.js:5` documenta una `OPENROUTER_API_KEY` stale a nivel Windows User que ganaba sobre `.env`: riesgo de secretos zombis en el entorno.

## Validación y abuso

- `helmet` (headers) + `cors` + `express-rate-limit` en `server.js` ✓.
- Webhook Stripe: registrado en `server.js` — *firma verificada* `stripe.webhooks.construct` → **`PROBABLE`** (no verificado línea a línea en esta corrida).
- Antifuga: PIN + `antifuga_config.sql`.

## Auditoría / eventos críticos

- `sh_config` + logs de servidor (gitignorados). **`DESCONOCIDO`**: no hay tabla de auditoría de acciones (login, cambios, pagos) — solo logs de archivo. Candidato a `15-riesgos`.

## Amenazas priorizadas

| # | Amenaza | Mitigación actual | Estado |
|---|---|---|---|
| 1 | Uso indebido de `service_role` si la API no valida | validación en `server.js` + rate-limit | `PROBABLE` — revisar validación de inputs |
| 2 | Webhook Stripe falsificado | firma del webhook | `PROBABLE` — verificar `constructEvent` |
| 3 | Secretos en entorno Windows stale | comentario documentado | `RIESGO` — rotar/limpiar variable stale |
| 4 | Sin retención/eliminación de datos personales (ADR-030) | política legal en `PrivacyPolicyScreen` | `PROBABLE` — sin proceso técnico |
