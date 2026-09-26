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
| V1 | sintaxis de scan.js | n/a | `node --check SuitDashboard/scan.js` | | |
| V2 | scan corre y escribe data.js | n/a | `node SuitDashboard/scan.js --live` | | |
| V3 | 31/31 con desc ES + triggers reales | n/a | asercion node sobre data.js | | |
| V4 | columna visible, sin errores de consola | n/a | Playwright abre index.html → pestaña Scripts | | |

## Evidencia
- V1:
- V2:
- V3:
- V4:

## GAPs (no verificable ahora)
- `--probe` (sondeo real de MCPs) no forma parte de esta ronda: no cambia MCPs, solo lectura de datos.

## Veredicto global
PENDIENTE
