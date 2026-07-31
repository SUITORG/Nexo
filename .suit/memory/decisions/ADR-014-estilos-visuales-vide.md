# ADR-014: Estilos Visuales para VIDE vía Supabase

## Status
Accepted (2026-07-30)

## Context
El selector `videStyle` solo ofrecía 4 estilos musicales sin relación con la estética visual del video. Se necesitaban categorías visuales (artístico, editorial, animación, cinematográfico) con sub-estilos (acuarela, pop art, anime, realista, etc.), persistencia en BD, y un "director" que auto-seleccione según tendencias.

## Decision
Crear 3 tablas en Supabase con RLS multi-tenant, un endpoint para el director, y un selector visual dinámico en VIDE antes de generar JSON.

## Schema
- `video_categorias_estilo`: 4 categorías (artístico, editorial, animación, cinematográfico)
- `video_subestilos`: 12 sub-estilos con keywords_ia para inyectar en el prompt
- `video_tendencias_estilo`: scoring diario por sub-estilo para el director

## Frontend
- Selector de botones dinámico en el wrapper `#estiloVisualContainer`
- Botón "Automático (Director)" que consulta tendencias
- Hover muestra descripción del sub-estilo
- Selección visual inyecta `keywords_ia` en el prompt de IA

## Director
- `autoPickStyleByTrend()` consulta `/api/tendencias-estilo` y devuelve el sub-estilo con mayor puntuación en 7 días
- Fallback: primer sub-estilo de cinematográfico

## Files
- `Documentacion/migrations/003_video_estilos.sql`
- `SuitCampanas/local-server-node.js`: endpoints `/api/estilos-visuales` y `/api/tendencias-estilo`
- `SuitCampanas/script.js`: `fetchEstilosVisuales()`, `showStyleSelector()`, `autoPickStyleByTrend()`
- `SuitCampanas/index.html`: wrapper `#estiloVisualContainer`
- `backend/database.js`: columna `usa_estilos_visuales`

## Dependencies
- Supabase (existing)

## Revisión (2026-07-30) — bugs encontrados

1. **Colisión de numeración de ADR**: "ADR-009" ya existía (`ADR-009-suitffmpeg-integration.md`). Renombrado a ADR-014 (siguiente número libre).
2. **Bug real, corregido**: `showStyleSelector(categorias)` usaba una variable `empresa` que nunca se declaraba ni se recibía como parámetro — `ReferenceError` garantizado tanto al cargar la lista (línea del auto-pick al final de la función) como al hacer click en "🤖 Automático (Director)". Corregido: `showStyleSelector(categorias, empresa)`, `fetchEstilosVisuales()` ahora se lo pasa.
3. **Corregido (2026-07-30)**: verifiqué contra el proyecto Supabase real (`list_tables`) que las 3 tablas no existían — el archivo `003_video_estilos.sql` se escribió pero nunca se aplicó. De paso corregí un problema real que el propio tool de migración advierte: los sub-estilos referenciaban su categoría por ID hardcodeado (1,2,3,4) asumiendo el orden — frágil si la tabla no está vacía. Cambiado a resolver por `slug` vía JOIN. Migración aplicada y verificada: 4 categorías, 12 sub-estilos, `/api/estilos-visuales` probado contra el servidor real — responde `status:success` con las 4 categorías completas.
4. **Corregido (2026-07-30) — decisión: uso real**: se presentaron 3 opciones (agente de tendencias IA, uso real, manual). Elegido **uso real**: cada vez que se genera un video con éxito y hay un estilo seleccionado, `generateVideVideo()` hace `POST /api/tendencias-estilo` (nuevo endpoint) con `{id_subestilo, empresa}`, que incrementa `puntuacion` del día (o crea la fila si es la primera vez). El Director (`autoPickStyleByTrend`) ya leía `puntuacion` ordenado descendente — sin cambios ahí, solo necesitaba datos reales que ahora sí se generan.
   - Bug adicional encontrado y corregido de paso: el `GET /api/tendencias-estilo` filtraba por `video_subestilos.id_empresa` (siempre `'ALL'`, porque los sub-estilos son compartidos) en vez de `video_tendencias_estilo.id_empresa` (la empresa real que generó el video) — nunca hubiera encontrado nada para ninguna empresa real, incluso con datos en la tabla.
   - Verificado con prueba real end-to-end: 3 registros POST simulados → `puntuacion` se incrementa 1→2→3 → GET los encuentra correctamente. Datos de prueba limpiados de Supabase después.
5. **Menor**: el ADR decía wrapper `#estiloVisualContainer`; el contenedor real en el HTML es `#videEstiloVisualContainer` (dentro del wrapper `#estiloVisualWrapper`) — corregido en esta nota.

## Ampliación (2026-07-31): 6 categorías / 19 sub-estilos adicionales
El usuario tenía una lista (Tipografía y Letras, Avatar y Personajes, Formas Dulces, Edits al Beat, Promo Comercial, Latino Virales) que creía ya insertada — verificado con SQL directo que **no existía en ningún Supabase** (ni el proyecto activo "Nexo" ni el otro proyecto de la cuenta, que además está inactivo). Insertada ahora vía `Documentacion/migrations/004_video_estilos_trending_latam.sql` (mismo patrón JOIN-por-slug que la migración 003), con `keywords_ia` redactadas a partir de los nombres (el usuario no las tenía). Verificado: 10 categorías / 31 sub-estilos totales en Supabase, y `GET /api/estilos-visuales` los sirve correctamente contra el servidor real.
