# Lección: PostgREST cachea el schema — ALTER + sync inmediato = no-op silencioso

**Fecha:** 2026-10-23 · **Proyecto:** SuitOrg (espejo Supabase `Config_Empresas`) · **Severidad:** media (fallo silencioso)

## Qué pasó
1. `ALTER TABLE ... ADD COLUMN IF NOT EXISTS politicas_privacidad/cookies text` → `{"success":true}`.
2. `syncToSupabase LABARIES` (GAS → PostgREST `Prefer: resolution=merge-duplicates`) → devolvió `2xx` y `SYNC_COMPLETE`, **pero las columnas quedaron en NULL** (no-op silencioso).
3. Upsert **directo** vía PostgREST (anon key, mismo `merge-duplicates`) → HTTP 200 y **sí** pobló (2699/2409).
4. Re-`syncToSupabase LABARIES` (oficial GAS) → ahora **sí** puebla y sostiene.

## Causa raíz
PostgREST **cachea el schema** de cada tabla. Un `ALTER` seguido casi inmediatamente de un upsert puede ejecutarse contra la versión vieja del schema (sin las columnas nuevas) → las claves desconocidas se ignoran / no se aplican, pero la respuesta sigue siendo 2xx. No es un bug de PK (la `Config_Empresas_pkey(id_empresa)` existía) ni del payload (GAS `getSheetData` sí incluía las columnas).

## Cómo evitarlo / diagnosticar
- Tras un `ALTER` que agregue columnas, **dejar reposar** unos segundos o hacer **un upsert de calentamiento** (una fila) antes de confiar en el sync masivo.
- Si un sync devuelve 2xx pero los datos no cambian: **desconfía del caché de schema**, no del mecanismo. Verifica con un upsert directo aislado.
- Diagnóstico rápido: PK correcta + filas sin duplicados + payload con las columnas + upsert directo que sí funciona → es caché, no schema.

## Afecta a
Cualquier `syncToSupabase` / upsert PostgREST tras un `ALTER` de columnas nuevas sobre `egyxgnlnzanxpqyuvmsg` (o cualquier proyecto Supabase vía PostgREST).

## Related
- `ADR-057-aviso-privacidad-cookies-por-empresa.md`
- `backend/utils.js` `syncToSupabase` (línea ~373, `Prefer: resolution=merge-duplicates`)
