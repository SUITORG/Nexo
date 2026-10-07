# migrations/ — ARCHIVADO (2026-10-07)

**Fuente canónica: `supabase/migrations/`** (usa la CLI de Supabase).

- Los 11 `.sql` + `APLICAR_EN_SUPABASE.sql` están en `_archivadas/` con respaldo ZIP
  (`_archivadas/respaldo_migrations_20261007.zip`).
- `price_negotiation`, `antifuga_config` y `decisions_config` fueron consolidados en
  `supabase/migrations/` con idempotencia (`IF NOT EXISTS` / `DROP POLICY IF EXISTS` /
  `ON CONFLICT DO NOTHING`) y el fix de políticas por email (no `sh_technicians.user_id`).
- `show_tax_info` (semilla que solo vivía en `APLICAR_EN_SUPABASE.sql`) quedó en
  `20260916110000_decisions_config.sql`.
- La seed admin `rbtpdrn@gmail.com` de `APLICAR_EN_SUPABASE.sql` solo existe en el
  archivo (ya creada vía API en la base remota); el admin principal lo siembra
  `20260915080800_admin_role.sql`.
- `feedback_widget.sql` de esta carpeta era la versión vieja con policy rota —
  la canónica es la de `supabase/migrations/`.

No agregar SQL nuevo aquí. Ver `docs/15-riesgos…` D-01 (resuelto 2026-10-07).
