# CORRECCIONES — aprendizajes acumulados
Lee este archivo antes de validar. Cada entrada debe convertirse en una prueba.

## 2026-10-07 — generate-index.js crasheaba con `require()` en paquete ESM
- Síntoma: `node scripts/generate-index.js` falla con `ERR_REQUIRE_ESM` / `require is not defined` (`"type": "module"` en package.json).
- Causa raíz: script escrito en CJS pero el paquete SuitServiHogar es ESM.
- Arreglo aplicado: convertido a ESM (`import` + `fileURLToPath(import.meta.url)` para `__dirname`).
- Regla preventiva: todo script nuevo dentro de un paquete `"type": "module"` se escribe en ESM desde el inicio.
- Prueba que lo cubre: V4 en VALIDACION.md (ejecución limpia + conteo 13/13 + 5/5).

## 2026-10-07 — qa-login: `role` sin definir (HTTP 500 en auto-login QA)
- Síntoma: `npm run test:e2e` → flujo-dev falla en el primer paso: `[QA LOGIN] role is not defined` y el frontend cae a fallback mock (`Login real no disponible ... qa-login HTTP 500`).
- Causa raíz: el bloque nuevo de `sh_technicians` en `POST /api/dev/qa-login` usaba `role`, pero el handler solo había hecho `const email = QA_ACCOUNTS[req.body?.role]` sin declarar la variable.
- Arreglo aplicado: `const role = req.body?.role;` al inicio del handler (server.js).
- Regla preventiva: al extender un handler existente, leer primero las variables ya declaradas en su scope; el error solo aparece en runtime (node no lo detecta en `--check` porque es un ReferenceError, no de sintaxis).
- Prueba que lo cubre: V9 en VALIDACION.md (e2e flujo-dev completo, 3 contextos).
