# CORRECCIONES — aprendizajes acumulados
Lee este archivo antes de validar. Cada entrada debe convertirse en una prueba.

## 2026-10-07 — generate-index.js crasheaba con `require()` en paquete ESM
- Síntoma: `node scripts/generate-index.js` falla con `ERR_REQUIRE_ESM` / `require is not defined` (`"type": "module"` en package.json).
- Causa raíz: script escrito en CJS pero el paquete SuitServiHogar es ESM.
- Arreglo aplicado: convertido a ESM (`import` + `fileURLToPath(import.meta.url)` para `__dirname`).
- Regla preventiva: todo script nuevo dentro de un paquete `"type": "module"` se escribe en ESM desde el inicio.
- Prueba que lo cubre: V4 en VALIDACION.md (ejecución limpia + conteo 13/13 + 5/5).
