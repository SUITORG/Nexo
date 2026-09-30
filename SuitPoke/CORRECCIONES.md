# CORRECCIONES — SuitPoke

Errores encontrados y aprendizajes de este ciclo (leer antes de validar).

| # | Error | Causa raíz | Fix | Aprendizaje |
|---|-------|-----------|-----|-------------|
| 1 | `ReferenceError: ELEMENTOS is not defined` al cargar motor.js | Se exportó un nombre nunca declarado | `const ELEMENTOS = [...]` añadido al anillo | `node --check` no detecta identificadores no declarados en tiempo de ejecución — correr SIEMPRE el test, no solo el check |
| 2 | Test `calcDano` fallaba con guardia | Fixture del test sin campo `d` → `NaN` en la resta | fixture corregido con `d: 1` | El motor asume que toda guardia tiene `d` (toda carta del mazo lo tiene); los tests deben usar fixtures completos |
| 3 | `/api/stream` devolvía 500 | `url.parse(url, true)` entrega `query` como objeto plano, no `URLSearchParams` — `query.get()` lanzaba TypeError | usar `query.codigo` / `query.token` | En Node stdlib, verificar el tipo real de `req.url` parseado antes de usar APIs de URL |
| 4 | Lobby mostraba lista vacía | `salaPublica()` leía solo de `st` (aún null en lobby) | fuente dual: `st.jugadores` o `jugadores` del lobby | Serializar siempre el estado "previo al juego" por separado |
| 5 | `mostrarFin` podía dispararse doble (local) | `sfxEfectos('fin')` + `pasoBots` ambos agendaban el fin | guard: solo si la pantalla de juego está activa | Al tener 2 caminos hacia una transición, proteger con una bandera/pantalla |
| 6 | Host del lobby detectado por nombre | Comparación frágil (`nombre === App.nombre`) | `App.miId === 0` (el creador siempre es id 0) | La identidad debe venir del token/id, no del nombre |
| 7 | MCP de navegador bloqueado ("browser already in use") | Perfiles Chrome/Playwright con locks huérfanos | matar procesos MCP huérfanos (`Get-CimInstance` + filtro de CommandLine) | No matar chrome.exe genérico — filtrar siempre por el profile path del MCP |
