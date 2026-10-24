# ADR-057: Aviso de privacidad + cookies por empresa en Config_Empresas

## Status
Accepted (2026-10-23)

## Context
El flujo de identidad corporativa (guia-total → empresa-registro) no generaba aviso de privacidad ni política de cookies. El frontend `showPolicies()` solo tenía texto base hardcodeado. Se necesitaba que cada tenant (empezando por LABARIES, laboratorio clínico → datos sensibles de salud) tuviera sus propios textos legales, **redactados solo con base legal mexicana verificada** (sin inventar leyes): LFPDPPP art.15 (contenido mínimo del aviso), Reglamento LFPDPPP art.14 último párrafo (informar cookies/web beacons + cómo deshabilitarlas), Lineamientos del Aviso de Privacidad DOF 17/01/2013.

## Decision
Dos columnas nuevas TEXT en la hoja maestro `Config_Empresas` (GSHEETS) + espejo Supabase:
- `politicas_privacidad` — Bloque A del Anexo legal del prompt IDENTIDAD_CORPORATIVA (art.15)
- `politicas_cookies` — Bloque B del Anexo (Reglamento art.14 + Lineamientos)

Cadena de generación:
- `IDENTIDAD_CORPORATIVA.md` → **Anexo legal** dentro del bloque de texto (Bloque A/B), cap de palabras solo aplica a secciones 1-8
- `empresa-registro` paso 6 (+ Anexo obligatorio) y paso 7 (los 2 campos entran en `updates`; **no sobreescribir** si ya tienen contenido)
- `guia-total` identidad paso 4 → dispara el anexo vía empresa-registro

Consumo frontend `js/modules/public.js showPolicies()` (dinámico):
- Sección 1 = `politicas_privacidad` (fallback al texto base si vacía)
- Sección 2 = `politicas_cookies` **solo si no vacía** (numeración se re-numera sola)
- Secciones términos + `politicas` (personalizadas) conservadas
- Ambos textos cierran con nota "pendiente de revisión legal" + `[PENDIENTE DE VALIDAR]` para datos faltantes (p.ej. domicilio completo LABARIES, inventario de cookies)

## Rationale
- Campos en Config_Empresas = multi-tenant por diseño (todo filtro por `id_empresa`), sin servicio extra
- El Anexo va **dentro** del mismo prompt de identidad (un solo paso de IA) pero marcado como "no legal advice" — la IA compone el documento base; la validación final es de asesor legal
- Fallback en `showPolicies` = empresas viejas sin campos no rompen el modal

## Consequences
- **Espejo Supabase**: `ALTER ADD COLUMN IF NOT EXISTS` (2 col TEXT nullable) + `syncToSupabase` para poblar. Lección: PostgREST cachea el schema — un ALTER seguido de sync inmediato puede no-op; dejar reposar o hacer un upsert de calentamiento (registrado en `.suit/memory/lessons/postgrest-schema-cache.md`)
- Textos con `[PENDIENTE DE VALIDAR]` = requieren revisión de asesor legal antes de publicación definitiva (no son asesoría legal)
- `db_engine=GSHEETS` (LABARIES) lee GAS directo → el render no depende del espejo; el sync es por consistencia multi-engine

## Related
- `GuiaTotal/prompts/IDENTIDAD_CORPORATIVA.md` (Anexo legal)
- `.agents/skills/empresa-registro/SKILL.md`, `.agents/skills/guia-total/SKILL.md`
- `js/modules/public.js` `showPolicies()`
- `VALIDACION.md` 2026-10-23 (PASS 6/6 + sync espejo)
