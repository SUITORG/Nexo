# PLAN-SYNC — pendiente de visto bueno
Ciclo: estandar activos LAPVTFU en cte<id> — Fecha: 2026-09-29

## Delta de esquema (Config_Empresas)
| Columna | Cambio | Confirmado por usuario | Notas |
|---------|--------|------------------------|-------|
| — | **NINGUNO** | n/a | sin columnas nuevas/renombres/eliminadas (flags solo en YAML) |

## Delta de registros
- **HMP**: segmento10 `LAPVTFU` del vector `logo_url` → slot6 (fotos) = `https://drive.google.com/uc?export=view&id=1aOrIpIXD7s…` (imagenurl-hamburguesas-metroplex.jpg).
  **Aprobado explícitamente en el plan F3** ("setLapvtfuSlot se prueba solo si me autorizas…" → "aprobado"). Es la ÚNICA escritura de datos de este ciclo.
  Backup de referencia: `GuiaTotal/registro/hmp/brief.json` (vector armado con slot6 en `[PENDIENTE - Activo]`).

## Acciones por empresa
| Empresa | db_engine | Acción propuesta | Destructiva | Respaldo | Estado |
|---------|-----------|------------------|-------------|----------|--------|
| HMP | GSHEETS | setLapvtfuSlot slot6 (smoke V5) | no (solo1 posición;20 segs preservados) | brief.json + vector 21/21 verificado | **EJECUTADO (aprobado)** |

## Sincronización de datos (Supabase)
- Espejo `Config_Empresas`: el `syncToSupabase` de HMP **no se re-ejecutó** en este ciclo (el vector ya estaba espejado; el cambio de slot6 vive en la hoja maestro → delta de espejo = **1 celda pendiente de sync** si se quiere espejo al día).

**Visto bueno:** plan F3 aprobado por el usuario (2026-09-29) — no hay sync adicional pendiente de aprobar salvo el espejo opcional de esa celda (¿correr `syncToSupabase HMP`? — pendiente de decisión).
