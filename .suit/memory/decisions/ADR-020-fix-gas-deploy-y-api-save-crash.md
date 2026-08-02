# ADR-020: Corrección de deployment GAS + bug crítico en `/api/save` (crasheaba el servidor)

## Status
Accepted (2026-08-01)

## Context
El usuario cambió la ruta/deployment de Apps Script y pidió a otra CLI corregir las referencias. Su resumen reportó: causa raíz en el commit `949879e` (cambió `GAS_URL` del deployment CMS correcto `AKfycbzlNe2...` al de otro proyecto, `AKfycbzhWR6...`, que solo respondía `getAll`), 4 archivos corregidos, deployment republicado con `access: ANYONE_ANONYMOUS`, y verificación de que "POST save persiste contenidoJson en la 7ª columna".

Se pidió revisar ese resultado como reviewer de SuitOS y corregir en el momento cualquier hallazgo.

## Verificación de lo reportado (confirmado correcto)
- `git show 949879e -- local-server-node.js` confirma el root cause exacto reportado.
- `GAS_URL` actual apunta al deployment correcto (`AKfycbzlNe2...`) en los 4 archivos (`local-server-node.js`, `test.html`, `test-simple.html`, `scripts/sync-gas.js`) — grep repo-wide sin referencias sueltas al URL viejo.
- `appsscript.json` con `access: ANYONE_ANONYMOUS` — no es una regresión de seguridad: `backend.gs doPost()` valida `data.token !== SECRET_TOKEN` antes de cualquier escritura (línea 55-58), gate ya existente, sin tocar.
- `GET /api/history` responde datos reales del deployment correcto (campañas históricas reales de abril-julio 2026, no el `getAll` del deployment equivocado).
- Columna 7 (`contenidoJson`) confirmada operativa: `doGet` la devuelve como `contenidojson` en cada fila (el usuario ya había agregado el header manualmente y limpiado las filas de prueba, como reportó).

## Bug crítico encontrado en la misma revisión (no reportado por la CLI anterior)

Al verificar en vivo si el guardado real (no solo `/api/history` de lectura) funcionaba, se encontró que **el flujo de guardado a Sheets nunca funcionó, independientemente del deployment correcto**, por dos bugs independientes en `local-server-node.js`:

1. **`script.js`, submit handler**: el paso "1. Enviar a GAS" hacía `POST` a `CONFIG.HISTORY_URL` (`/api/history`). Ese handler en el servidor (`pathname.includes('/api/history')`) no distingue método — para CUALQUIER verbo, ignora el body entrante y siempre ejecuta la acción de solo-lectura `action=history`. El body con los datos de la campaña se descartaba en silencio. Confirmado empíricamente: `POST /api/history` con un caption único no crea fila nueva (comparación antes/después de `GET /api/history`, sin cambios).
2. **`/api/save` (el endpoint que SÍ existe para guardar)**: usaba `fetchWithRedirects(GAS_URL, {method:'POST', headers, body})` — pero `fetchWithRedirects(url, callback)` es una función GET-only (`https.get` hardcodeado) cuyo segundo parámetro se invoca como función (`callback(data, statusCode)`). Al pasarle un objeto `{method, headers, body}` en su lugar, la petición async responde correctamente vía GET (ignorando `body`/`method`, sin guardar nada) pero al intentar invocar ese objeto como función revienta con `TypeError: callback is not a function` — una excepción síncrona sin capturar dentro de un callback de evento (`res.on('end', ...)`), que **mata el proceso de Node completo**. Confirmado empíricamente: tras un `curl POST /api/save` de prueba, el servidor dejó de responder y el proceso ya no existía (verificado con `Get-Process`/`netstat`).

Combinado: el guardado a Sheets del flujo principal (Ai/BD/BDPR/BDSMT) llevaba tiempo indefinido siendo un no-op silencioso — y el único endpoint que sí intentaba guardar de verdad (`/api/save`) tumbaba el servidor completo en cualquier invocación. El toast "✅ Campaña guardada" nunca reflejó la realidad porque `mode:'no-cors'` hacía la respuesta opaca, así que `gasOk` quedaba en `true` sin importar qué pasara.

## Decision (fix aplicado en el mismo turno)

1. **`local-server-node.js` `/api/save`**: reemplazado el uso indebido de `fetchWithRedirects` por `fetch()` nativo (mismo patrón ya usado en `callOpenRouter()`), que sí soporta `method`/`body` correctamente.
2. **`script.js`**: nueva `CONFIG.SAVE_URL = '/api/save'`. El submit handler ahora POSTea ahí (no a `HISTORY_URL`), sin `mode:'no-cors'` (innecesario, mismo origen) y leyendo la respuesta JSON real para fijar `gasOk` según lo que el servidor reporte, no un valor optimista fijo.

## Validación
- `node --check` en ambos archivos ✓
- Reproducido el crash ANTES del fix: `POST /api/save` real → proceso de Node desaparece de `netstat`/`Get-Process`
- Servidor reiniciado, fix aplicado, reproducido el mismo `POST /api/save` DESPUÉS del fix → responde `status:success` con el UUID real de Apps Script, servidor sigue vivo, y `GET /api/history` confirma la fila nueva con el caption de prueba en la posición más reciente
- Fila de prueba (`REVIEW_PROBE_FIXED_SAVE_445566`, id `6d9a2ddf-b508-4580-b939-4a48ebcf38c6`) queda en la hoja SMMC — **pendiente que el usuario la borre manualmente**, igual que las anteriores (no hay endpoint de borrado de filas en `backend.gs`)

## Consequences
- El guardado a Google Sheets del flujo principal (Ai/BD/BDPR/BDSMT) funciona de verdad por primera vez de forma verificable en esta sesión.
- El campo `#token` en `index.html` (línea 664) está vacío por defecto — sin escribir el token de seguridad ahí, `doPost` seguirá rechazando con 401 (gate pre-existente, no tocado, fuera de alcance de esta ADR — el usuario debe llenarlo o se necesita una decisión aparte sobre cómo pre-poblarlo).
- `/api/save` ahora también expone `gasResponse` (el texto crudo de Apps Script) en su respuesta — útil para depurar sin tener que ir a `/api/logs`.
