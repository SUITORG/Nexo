# PLAN-SYNC — pendiente de visto bueno
Ciclo: politicas_privacidad + politicas_cookies en Config_Empresas (identidad → showPolicies) → Fecha: 2026-10-23

## Delta de esquema (Config_Empresas)
| Columna | Cambio | Confirmado por usuario | Notas |
|---------|--------|------------------------|-------|
| `politicas_privacidad` | **+ ADD COLUMN** (TEXT, nullable) en espejo Supabase | pendiente (F6) | Verificado **ausente** en `information_schema.columns` (query 2026-10-23 = 0 filas). GSHEETS (maestro) ya tiene la columna con LABARIES poblado. |
| `politicas_cookies` | **+ ADD COLUMN** (TEXT, nullable) en espejo Supabase | pendiente (F6) | Igual que la anterior. |

No hay columnas renombradas ni eliminadas. **No destructivo** (ADD COLUMN nullable sobre tabla de 13 filas).

## Delta de registros
- **LABARIES** (GSHEETS): `politicas_privacidad` = 2699 chars · `politicas_cookies` = 2409 chars — escritos y verificados en F3 (única empresa con contenido, resto vacío).
- Espejo Supabase: 0 filas con las 2 columnas (no existen) → **1 fila a poblar tras el ALTER**.

## Acciones ejecutadas (F6 aprobado 2026-10-23)
| # | Acción | Destructiva | Estado |
|---|--------|-------------|--------|
| 1 | `ALTER TABLE "Config_Empresas" ADD COLUMN IF NOT EXISTS politicas_privacidad/cookies text` | no | **EJECUTADO** |
| 2 | `syncToSupabase LABARIES` (1er intento) | no | 2xx pero columnas en NULL — **no-op** por caché de schema de PostgREST recién tras el ALTER |
| 3 | Upsert directo PostgREST LABARIES (purga caché + puebla) | no | **EJECUTADO** — 2699/2409 poblados |
| 4 | Re-`syncToSupabase LABARIES` (oficial GAS) | no | **EJECUTADO** — mantiene 2699/2409 (sync ahora funciona) |
| 5 | Verificación SELECT | — | **PASS** priv_len=2699 · cook_len=2409 · ref art.14 presente |

**Causa raíz del no-op:** PostgREST cachea el schema de la tabla; un `ALTER` seguido inmediatamente de un upsert puede no ver las columnas nuevas. Solución: transcurrido el tiempo (o un primer upsert de calentamiento) el sync oficial funciona. **Lección:** tras agregar columnas, dejar reposar / hacer un upsert de prueba antes de confiar en `syncToSupabase`.

## Orden obligatorio
`syncToSupabase` mapea headers de la hoja → columnas dinámicamente (backend/utils.js:365-376) y hace POST con `resolution=merge-duplicates`: **si la columna no existe en Supabase, el sync de LABARIES fallará (PostgREST rechaza claves desconocidas)**. Por eso el ALTER (paso 1) va ANTES de cualquier sync.

## Sincronización de datos (Supabase)
- Frontend LABARIES es **GSHEETS** (lee GAS directo, sin merge) → el render ya probado en V4 **no depende** de este espejo; el sync es por consistencia multi-engine (`db_engine`).
- **Observación (fuera de alcance de este ciclo):** espejo tiene **13 filas** vs **21** con `id_empresa` en GAS → brecha de cobertura preexistente, no introducida por este ciclo; anotar en PENDIENTES si el usuario quiere cerrarla.

## Pendiente heredado (ciclo 2026-09-29 LAPVTFU)
- Espejo opcional de la celda `LAPVTFU` slot6 de HMP (`syncToSupabase HMP`) — decisión pendiente del usuario, sin ejecutar.

**Visto bueno:** aprobado por usuario 2026-10-23 → **ALTER + sync ejecutados (F6)**. Espejo `Config_Empresas` de LABARIES poblado y sostenido (2699/2409). Cierre del sync = PASS.
