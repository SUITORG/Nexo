# ADR-045: Login teléfono+contraseña con Supabase Auth (email sintético)

## Status
Accepted (2026-10-08)

## Context
SuitServiHogar solo tenía Google OAuth (Req#22): no había form usuario/contraseña. Se pidió añadir login con teléfono mexicano + contraseña seguro. Restricciones: no romper `requireAuth` (server.js) ni RLS (`auth.uid()`), no tablas propias de contraseñas ni JWT propio, conservar Google OAuth.

## Decision
Supabase Auth nativo con **email sintético**: el teléfono E.164 `+52XXXXXXXXXX` se convierte a `p52XXXXXXXXXX@phone.servicioshogar.mx` (`src/lib/phone.js`, fuente única compartida server+frontend). El registro es **server-side** (`POST /api/auth/register`, server.js:115) con `service_role` + `email_confirm: true`; el login va directo del cliente a `supabase.auth.signInWithPassword`. Perfil en tabla nueva `sh_clients` (5 columnas, RLS solo propio) — separada de `sh_technicians` porque un cliente no es técnico. Rate-limit registro: `IS_DEV ? 100 : 8/h` por IP.

## Rationale
- Cero superficie nueva de seguridad: no hay hashing propio, ni reset flows propios, ni JWT propio; todo lo resuelve GoTrue.
- `requireAuth` y RLS existentes funcionan sin cambios (mismo `auth.users`).
- Google OAuth intacto como alternativa; `devAutoLogin` intacto para QA.

## Consequences
- Un mismo teléfono es la identidad; no hay login por SMS/OTP todavía (PENDIENTE).
- `sh_clients.id = auth.users.id` (FK); no hay ID secuencial en esta tabla (excepción justificada: es extensión de auth, no tabla de negocio).
- El 409 de registro responde genérico por diseño (no filtra cuentas existentes).

## Alternatives Considered
- Tabla propia + hash bcrypt + JWT propio: rechazado — rompe `requireAuth`/RLS, duplica lo que ya da GoTrue.
- OTP por SMS nativo de Supabase: diferido — requiere Twilio/contador y CAPTCHA; se deja como PENDIENTE en GuiaTotal/PENDIENTES.md.

## Related
- `SuitServiHogar/server.js:115` — endpoint registro
- `SuitServiHogar/src/lib/phone.js` — validación tel MX + email sintético
- `SuitServiHogar/supabase/migrations/20261008190000_sh_clients.sql`
- Ciclo F1-F7 de la sesión 2026-10-08 (commits `9f094d1`, `bfa197f`)
