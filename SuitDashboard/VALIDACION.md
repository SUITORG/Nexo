# VALIDACION — SuitDashboard
Fecha: 2026-09-25 · Contrato: SuitDashboard/CONTRATO.md

## Ronda 2 — skills en español + evaluaciones por contrato (activa)

### Encuadre 20/80 (f1)
1. Fixes de raíz en `scan.js`: BOM en `readText` (bug `name: X` como descripción), descripciones multilínea (`description: >`) en SKILL.md y yamls SuitOS (28 skills mostraban vacío)
2. Dict `SKILL_DESC_ES` en `scan.js` (descripciones EN→ES, key = nombre)
3. `contractFor(dir)` en `scan.js`: Evaluación % (tabla de cumplimiento → estados ✅/⚠️/❌) + Terminado % (checklist `- [x]`/`- [ ]`); sin contrato → `sin contrato`
4. Dos pills en `card()` de `index.html` (`Eval NN% · Term NN%` o `sin contrato`)
5. Actualizar `CONTRATO.md` si cambian fuentes de datos; regenerar `data.js`
6. Validar con evidencia y commit por fase

Descartado: crear contratos para los 22 proyectos sin contrato (acordado: badge `sin contrato`), calificación por letras (reemplazada por los dos %), badge en modal detalle, índice de búsqueda bilingüe.

| ID | Verifica | Comando o acción | Resultado observado | Veredicto |
|----|----------|------------------|---------------------|-----------|
| V1 | sintaxis scan.js | `node --check SuitDashboard/scan.js` | pendiente | — |
| V2 | scan corre y escribe data.js | `node SuitDashboard/scan.js --live` | pendiente | — |
| V3 | aserciones: descs ES, extracción de contrato, raíz Term=0, SH Eval=86, 22 sin contrato | script node sobre `data.js` | pendiente | — |
| V4 | pestañas en navegador, pills de contrato, 0 errores consola | server temporal + Playwright | pendiente | — |

### Evidencia
pendiente (se llena en f3).

### GAPs (no verificable ahora)
- `abrir.bat` real (doble click) no se ejecuta: Playwright bloquea `file://`; se valida con server estático temporal (patrón ronda 1).

### Veredicto global
pendiente — f3.

---

## Ronda 1 — descripciones de scripts ES + columna activadores (CERRADA, 2026-09-25)

**Veredicto: PASA 4/4** — encuadre y evidencia históricos:
1. Dict `SCRIPT_DESC_ES` (31) + escáner de activadores en `scan.js`
2. Columna "Activadores" en `index.html` (pills + búsqueda + colspan)
3. Commits: `f29dfc1` (f1) · `2b4aae0` (f2) · `7f6f2ee` (f3)

| ID | Verifica | Resultado | Veredicto |
|----|----------|-----------|-----------|
| V1 | `node --check scan.js` | exit 0 | PASA |
| V2 | `scan.js --live` | `data.js (68 dirs, 28 assets)`, 0 fallas CLIs | PASA |
| V3 | 31/31 desc ES + triggers | `scripts: 31 \| con desc ES: 31 \| con triggers: 31` | PASA |
| V4 | navegador: 5 encabezados, 31 filas, 42 pills, filtro `cron`, 0 errores consola | evidencia Playwright | PASA |

- Corrección registrada (CORRECCIONES.md): regex de cron no toleraba comentarios entre `schedule:` y `- cron:`.
- GAP ronda 1: `abrir.bat` real y `--probe` no ejecutados.
