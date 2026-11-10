# ADR-060: Hardening de seguridad — RLS UPDATE/DELETE + guardia de mutaciones en módulos

## Status
Accepted (2026-11-09)

## Context
La revisión de "temas delicados" del roadmap (TD-014, TD-015, TD-010, "Seguridad Supabase" de PENDIENTES.md) confirmó por inspección directa:

- **51 policies** RLS `UPDATE/DELETE` con `qual='true'` en **24 tablas** del proyecto Supabase `egyxgnlnzanxpqyuvmsg` — cualquiera con la llave anon (va en el bundle del browser) podía borrar/editar cualquier fila, incluidas `Config_Empresas`, `Pagos`, `Proyectos*`.
- **8 servidores Express** de módulos (`SuitPedidoExpress`, `SuitPos`, `SuitProductos`, `SuitInventarios`, `SuitBodega`, `SuitCotizador`, `citas`, `SuitReservaciones`) exponían rutas POST/PUT/DELETE **sin autenticación ni rate-limit**.
- Claims obsoletos: `backend/core.js` ya lee keys de Script Properties (TD-001), `SuitDashboard/data.js` solo contiene el *texto* "service_role" en descripciones de skills (no una key), `.env.test` de SuitCampanas nunca estuvo en git.

Dato estructural clave: **solo SuitServiHogar escribe a Supabase desde el browser** (usa anon + RLS sobre `sh_*`); todas las demás tablas las escriben servers con `service_role` (bypasea RLS) o GAS/scripts. Por eso se pudo cerrar RLS sin romper apps.

## Decision

### A2 — RLS: DROP de policies permissivas (2026-11-09)
- Eliminadas **50 policies** `UPDATE/DELETE` `qual=true` en **23 tablas** (todas las no-`sh_*`).
- `sh_orders` (única `sh_*` con UPDATE permissivo) **se conservó** — la escribe el browser de SuitServiHogar.
- Verificación: catálogo (`pg_policies` → solo queda `sh_orders`), prueba live con llave anon (`PATCH .../Config_Empresas` → fila no visible,200 vacío = bloqueado) y **e2e SuitServiHogar 8/8**.
- Rollback: `scripts/backup/rls-rollback-20261109.sql` (50 `CREATE POLICY`).

### B — Guardia de mutaciones compartida (`shared/suit-token.js`)
- `mount(app)` en los **8 servidores**: rate-limit (15min/100, si `express-rate-limit` resuelve) + filtro de `POST/PUT/PATCH/DELETE` con:
  1. bypass localhost (dev/scripts),
  2. bypass same-origin (`Origin`/`Referer` host == `Host`) → la UI propia del módulo funciona desde cualquier host sin cambios,
  3. header `X-Suit-Token` == `SUIT_TOKEN` (root `.env`,64 hex, generado2026-11-09) para callers no-browser remotos,
  4. exención `/webhook*` (Meta/Stripe no pueden mandar token).
- GET siempre pasa (rate-limiteado).
- Validado en vivo (SuitPos + citas + SuitReservaciones vía IP LAN `192.168.86.71`): sin token → 401 · con token → pasa · same-origin → pasa · webhook → 200 · GET → 200.

## Rationale
- **Ponytail**: mecanismo de una sola pieza compartida (1 archivo,1 línea por server), sin tocar rutas individuales ni frontends.
- Honestidad de límite: bypass same-origin/token son **speed-bump contra escaneos/bots**, no autenticación de sesión real — la autenticación real de sesión ya existe en SuitServiHogar (`requireAuth` JWT) y es el estándar si algún módulo se expone a internet.

## Consequences
- Queda **A4 (pendiente)**: policies `SELECT` (37) e `INSERT` (46) siguen permissivas — anon aún *lee* todo (p.ej. `Config_Empresas`) y puede INSERTAR. Cierre futuro: inventario de lectores browser por tabla → restringir.
- Si el próximo `syncToSupabase` de GAS falla con *permission denied*, su `SUPABASE_KEY` (Script Properties) es anon → reemplazarla por `SUPABASE_SERVICE_ROLE_KEY` (root `.env`) o correr el rollback.
- `SuitCotizador` tiene CORS con `ALLOWED_ORIGIN` solo-localhost (pre-existente): su UI desde LAN ya era bloqueada por CORS antes de este cambio; agregar la IP LAN a `ALLOWED_ORIGIN` si se quiere usar su UI remota.
- `SuitCampanas/local-server-node.js` omitido a propósito:0 rutas mutantes HTTP + ya tenía rate-limit.
- `SUIT_TOKEN` vive en root `.env` (gitignored, verificado: nunca trackeado).

## Alternatives Considered
- **Token obligatorio también para la UI remota**: rompía las UIs de los módulos desde LAN sin aportar (el token sería legible desde el JS servido).
- **Login/JWT en los8 módulos**: correcto a largo plazo (es el estándar SuitServiHogar) pero fuera del alcance acordado para esta pasada.
- **DROP también de SELECT/INSERT**: no hecho — requiere inventario de qué tablas lee el browser de cada módulo (fase A4).

## Related
- `GuiaTotal/PENDIENTES.md` — TD-014, TD-015, TD-010, TD-001, "Seguridad Supabase"
- `shared/suit-token.js` — implementación
- `scripts/backup/rls-rollback-20261109.sql` — rollback RLS
- ADR-058 (req #44) — mismo módulo, superficie tocada por tests e2e
