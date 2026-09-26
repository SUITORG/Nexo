# VALIDACION — ciclo: SuitDashboard descripciones ES + columna activadores
Fecha: 2026-09-25 · Contrato: SuitDashboard/CONTRATO.md · Ronda: 1

## Encuadre 20/80 (f1)
1. Dict `SCRIPT_DESC_ES` (31 descripciones en español) en `scan.js`
2. Escáner de activadores en `scan.js` (índice de fuentes leídas una sola vez)
3. Columna "Activadores" en `index.html` (pills + búsqueda + colspan)
4. Actualizar `CONTRATO.md` (sección Datos: nueva fuente) — obligatorio por contrato
5. Regenerar `data.js` (`node scan.js --live`)
6. Validar con evidencia y commit por fase

Descartado explícitamente: descripciones de plugins en español, triggers de skills/agentes, tocar cabeceras de `scripts/*` (fuera del alcance; el usuario eligió mapa ES en `scan.js`).

| ID | Verifica | Empresa / db_engine | Comando o accion | Resultado observado | Veredicto |
|----|----------|---------------------|------------------|---------------------|-----------|
| V1 | sintaxis de scan.js | n/a | `node --check SuitDashboard/scan.js` | exit 0, sin salida | PASA |
| V2 | scan corre y escribe data.js | n/a | `node SuitDashboard/scan.js --live` | `SuitDashboard -> data.js (68 dirs, 28 assets)` + KPIs; 0 fallan OpenCode, 0 fallan Claude | PASA |
| V3 | 31/31 desc ES + triggers reales | n/a | asercion node sobre `data.js` (check: conteo, desc no-vacia, triggers, spot-checks cron/MCP/suit) | `scripts: 31 \| con desc ES: 31 \| con triggers: 31` + `V3 PASS` | PASA |
| V4 | columna visible, pills, busqueda, 0 errores de consola | n/a | server estatico temporal + Playwright: abrir pestaña Scripts & Plugins | headers = [Nombre, Tipo, Ruta, Descripción, **Activadores**]; 31 filas; 0 filas con nº de columnas distinto; 42 pills `p-suit`; filtro `cron` → 2 filas; console errors = 0 | PASA |

## Evidencia
- V1: `node --check SuitDashboard/scan.js` → exit 0.
- V2: salida literal: `SuitDashboard -> data.js  (68 dirs, 28 assets)` / `Sondeo: 0 fallan en OpenCode | 0 fallan en Claude` / `Scripts: 31 en scripts/`.
- V3: salida literal: `scripts: 31 | con desc ES: 31 | con triggers: 31` y `V3 PASS`. Muestras:
  - `ssg-engine.mjs` → `cron 0 3 * * * · ssg-regenerate.yml | CLAUDE.md | .suit (11 refs)`
  - `mcp-supabase.js` → `opencode.json ×13 | .mcp.json ×1`
  - `commit-fase.sh` → `.suit (2 refs)`; `system-status.js` → `CLI manual`.
  - Correccion durante la ronda: la extraccion del cron no toleraba las lineas de comentario entre `schedule:` y `- cron:`; regex cambiado a `schedule:[\s\S]{0,500}?-\s*cron:` (ver CORRECCIONES.md).
- V4: Playwright sobre servidor estatico temporal (temp, puerto 8137, no forma parte del repo): tabla con 5 encabezados, 31 filas, 42 pills de activadores, busqueda funcional (`cron` → `mcp-manager.js` por "sin**cron**ización" + `ssg-engine.mjs`), `console.errors = 0` tras cargar y navegar a la pestaña.

## GAPs (no verificable ahora)
- `abrir.bat` real (doble click en Windows) no se ejecuto: la validacion uso un server estatico temporal porque el navegador de Playwright bloquea `file://`. Riesgo bajo: `abrir.bat` solo corre `scan.js --live` + `start index.html`; V2 cubre el scan.
- `--probe` (sondeo real de MCPs) no forma parte de esta ronda: no cambia MCPs, solo lectura de datos.

## Veredicto global
PASA — 4/4 pruebas; V4 con GAP menor documentado.
