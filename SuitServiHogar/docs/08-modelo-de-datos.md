# 08 — Modelo de datos · SuitServiHogar

> **Para qué sirve este documento:** entidades, relaciones, origen y estado de los datos del sistema.
> **Última revisión:** 2026-09-26 · **Generado por:** skill `auditoria`
> **Origen/duño:** Supabase **Nexo** (`egyxgnlnzanxpqyuvmsg`) — mismo proyecto que el resto de SuitOrg, aislado por **prefijo `sh_`**. Un solo tenant (marketplace Reynosa) — *no* usa `id_empresa`; su aislamiento es por prefijo de tablas.
> **Fuentes:** `schema.sql`, `migration_v2.sql`, `migrations/` (11), `supabase/migrations/` (9), lectura directa de tablas en vivo (conteos 2026-09-26).

## Entidades principales (prefijo `sh_` + soporte)

| Entidad (tabla) | Propósito | Registros | Origen SQL | Estado |
|---|---|---|---|---|
| `sh_service_categories` | Categorías de servicio (precio base MXN) | 13 | `schema.sql` | `VERIFICADO` |
| `sh_technicians` | Perfiles de técnicos (badges, precios MXN/USD, colonia) | 6 | `schema.sql` | `VERIFICADO` |
| `sh_orders` | Órdenes/escrow + campos v2 (cancelación, donación, penalización) | 1 | `schema.sql` + `migration_v2.sql` | `VERIFICADO` |
| `sh_config` | Config del platform (fee %, flags) — cacheada 5 min por `server.js` | 7 | migración `remote_commit` u otra (**`PROBABLE`**: ubicación exacta sin confirmar) | `PROBABLE` |
| `sh_messages` | Chat cliente↔técnico | 0 | `chat_messages.sql` | `VERIFICADO` |
| `sh_reviews` | Reseñas | 0 | `reviews.sql` | `VERIFICADO` |
| `sh_referrals`, `sh_coupons` | Referidos y cupones | 0 / 0 | `referrals_coupons.sql` | `VERIFICADO` |
| `cancellation_policies` | Políticas de cancelación | 2 | `migrations/` | `VERIFICADO` |
| `sh_price_negotiations` | Negociación de precio (ADR-027 flujo) | 0 | `migrations/` (**falta en `supabase/migrations/`**) | `VERIFICADO` (drift) |
| `platform_earnings`, `charity_ledger` | Comisión plataforma + redondeo a caridad ("Fundación Hogar Digno AC") | 0 / 0 | `migrations/` | `VERIFICADO` |
| `specialist_penalties`, `client_coupons` | Penalizaciones y cupones de cliente | 0 / 0 | `migration_v2.sql` | `VERIFICADO` |
| `sh_feedback`, `feedback_widget` | Widget de feedback | 0 | `feedback_widget.sql` | `VERIFICADO` |
| GPS/geocoding, `antifuga_config`, `decisions_config`, `admin_role` | Dirección GPS, PIN antifuga, decisiones, rol admin | — | `gps_address.sql`, `migrations/…antifuga…`, `…decisions…`, `admin_role.sql` | `VERIFICADO` (nombres), campos sin inventariar (`PROBABLE`) |

## Relaciones principales

```text
sh_service_categories ←→ sh_technicians (category_ids[])
sh_orders → cliente, técnico, sh_service_categories
sh_orders → escrow/liquidación (platform_earnings, charity_ledger, specialist_penalties)
sh_orders → cancellation_policies (al cancelar) + client_coupons
sh_messages / sh_reviews → sh_orders + sh_technicians
```

## Datos personales / sensibles

- Datos de cliente y técnico (nombre, colonia, teléfono, evidencias fotográficas, GPS).
- Datos de pago: **Stripe** guarda los medios de pago — el proyecto solo maneja IDs/tokens (`PaymentIntent`).
- CFDI (`server/cfdiGenerator.js`) → datos fiscales. Aplica ADR-030 (privacidad/consentimiento).

## Validaciones e invariantes

- RLS habilitado en todas las tablas creadas por `schema.sql`/migraciones (`ENABLE ROW LEVEL SECURITY` + policies).
- `cancelled_by` con `CHECK (IN 'CLIENT'|'SPECIALIST'|'SYSTEM')` (`migration_v2.sql`).
- Read público solo para `sh_service_categories` (policy `Public read categories`).

## Retención / índices

- `PROBABLE`: no se encontró política de retención ni documento de archivado — pendiente.

## ⚠️ Drift de migraciones (riesgo #1 de datos)

| Ubicación | Contenido | Problema |
|---|---|---|
| `schema.sql` | base v1 | — |
| `migration_v2.sql` | extensiones sh_orders | fuera del flujo de migraciones |
| `migrations/` (11 + `APLICAR_EN_SUPABASE.sql`) | versión más completa | **incluye 3 que no están en `supabase/migrations/`** |
| `supabase/migrations/` (9) | lo que la CLI Supabase considera aplicado | **incompleto vs `migrations/`** |

**Decisión pendiente**: elegir `supabase/migrations/` como canónico (es lo que la CLI aplica) y resincronizar, o documentar por qué `migrations/` manda.
