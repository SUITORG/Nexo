# VALIDACION — ciclo: cerrar analista-proy + calidad-minima + mantenimiento
Fecha: 2026-11-16 · Contrato: docs/CONTRATO.md · Ronda: 1

| ID | Verifica | Empresa / db_engine | Comando o acción | Resultado observado | Veredicto |
|----|----------|---------------------|------------------|---------------------|-----------|
| V1 | Servidor nuevo arranca y expone el puente | n/a (sin tenant) | `node server.js` en 8139 (8138 = instancia del usuario, intacta) + `GET /api/health` + `GET /api/status` | health `{"ok":true}`; status `ok=true`, SA `opencode-sheets@suitorg00...`, calendarId configurado, lastSync presente | PASA |
| V2 | Invariante contrato #1: token en todo POST (lado nuevo, sin efectos secundarios) | n/a | `POST /api/backup {}` sin `X-Suit-Token` → esperado 401; con token → esperado 400 "Falta db" | 401 sin token; 400 con token (el handler se alcanza pero no escribe nada) | PASA |
| V3 | CORS nuevo (`ACAH: Content-Type, X-Suit-Token`) + origins del contrato | n/a | `OPTIONS` con Origin `http://127.0.0.1:8137` → esperado 204+ACAO+ACAH; Origin `http://evil.example` → esperado 403; `POST` con Origin 8137 + token → esperado 400+ACAO | 204 ACAO=8137 ACAH=`Content-Type, X-Suit-Token`; 403 sin ACAO; POST 400 ACAO=8137 | PASA |
| V4 | Sintaxis/encoding/contenido del **blob commiteado** (F2) | n/a | `git show HEAD:SuitCompromisos/{index.html,server.js}` → `node --check` (JS inline + servidor) + `mojibake.js` + grep de elementos nuevos | sintaxis OK ×2; mojibake 0/2; weekbar×2, month-grid×6, noRealizada×21, tag.no×1, X-Suit-Token×5 | PASA |
| V5 | Smoke UI E2E contra servidor nuevo (consola + render + interacción) | n/a | Chrome DevTools: abrir `http://127.0.0.1:8137/SuitCompromisos/index.html` con `fetch` redirigido 8138→8139 (initScript); DOM + consola + click `Mes` y `Ver cerradas` | título/h1 OK; 4 stats (incl. NO REALIZADAS), weekbar×1, month-grid×1, 2 items, botones Nuevo/Exportar; status UI "Google Calendar: HTTP 200"; toggle Mes → grid `display:grid`; Ver cerradas → label "Ocultar cerradas"; **consola: 0 mensajes de error** (antes y después de interacciones) | PASA |

## Evidencia
- V1: salida `T1a health(8139): {"ok":true}` / `T1b status(8139): ok=True sa=opencode-sheets@... cal=840729...@group.calendar.google.com lastSync=2026-11-16T21:24:43.145Z`
- V2: `T2a sin token -> HTTP 401 (esperado 401): PASS` · `T2b con token -> HTTP 400 (esperado 400): PASS`
- V3: `T3a ... ACAO=http://127.0.0.1:8137 ACAH=Content-Type, X-Suit-Token : PASS` · `T3b -> HTTP 403 ... PASS` · `T2c POST Origin 8137 + token -> HTTP 400 ACAO=http://127.0.0.1:8137 : PASS`
- V4: `T4a JS inline (blob HEAD): sintaxis OK` / `T4b server.js (blob HEAD): sintaxis OK` / `mojibake: archivos 2 | con moji 0` / `T4c: weekbar 2, month-grid 6, noRealizada 21, tag.no 1, X-Suit-Token 5 — PASS`
- V5: DOM `{"stats":4,"weekbar":1,"monthGrid":1,"items":2,"newBtn":true,"exportBtn":true}` + bodyStart "Google Calendar: HTTP 200" · console `<no console messages found>` ×2 (post-render y post-clicks) · commits validados: F0 `759f894`, F2 `5d30c85`

## GAPs (no verificable ahora)
- **Servidor 8138 del usuario corre código pre-F2**: el fix de `Allow-Headers` solo surte efecto al reiniciar esa instancia (pid 30248, en uso — su lastSync se actualizó hoy). Riesgo: hasta reiniciarla, los POST del panel servido en :8137 contra :8138 pueden fallar preflight. Acción: reiniciar `node SuitCompromisos/server.js` (usuario decide cuándo).
- **Sin tests automatizados** en el repo (declarado en contrato): la evidencia es este smoke manual reproducible con los comandos de la tabla.
- **Instancia de prueba 8139** (pid 6012) se elimina al cerrar la fase — los tests de la tabla apuntan a ella.

## Veredicto global
**PASA** — 5/5 pruebas verdes, consola limpia, invariante de token y CORS demostrados sobre el código commiteado; sin iteración (F4 no corre).
