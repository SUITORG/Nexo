# VALIDACION — SuitDashboard
Fecha: 2026-09-25 · Contrato: SuitDashboard/docs/CONTRATO.md

## Ronda 2 — skills en español + evaluaciones por contrato (CERRADA, 2026-09-26)

**Veredicto: PASA 4/4** — encuadre y evidencia:
1. Fixes de raíz en `scan.js`: BOM en `readText`, descripciones multilínea (SKILL.md y yamls SuitOS), sin truncamiento de extractor
2. Traducciones: dict `SKILL_DESC_ES` = `desc-skill-es.json` (55 entradas EN→ES) + overlay por nombre único
3. `contractFor(dir)`: Evaluación % (tabla ✅/⚠️/❌ → 86% SH) + Terminado % (checklist → 0% raíz); sin contrato → `sin contrato`
4. Pills en `card()` de `index.html` (`Eval NN% · Term NN%` o `sin contrato`)
5. Commits: `d3aa362` (f1) · `b142f26` (f2) · f3 (validación)

Descartado (acordado): crear contratos para proyectos sin contrato (66 — conteo corregido con evidencia, eran 22 en el encuadre inicial), calificación por letras, badge en modal detalle, índice bilingüe.

| ID | Verifica | Comando o acción | Resultado observado | Veredicto |
|----|----------|------------------|---------------------|-----------|
| V1 | sintaxis scan.js | `node --check SuitDashboard/scan.js` | exit 0 | PASA |
| V2 | scan corre y escribe data.js | `node SuitDashboard/scan.js --live` | `Sondeo: 0 fallan en OpenCode \| 0 fallan en Claude` · `74 skills (claude 41 \| opencode 36 \| suitos 33)` | PASA |
| V3 | aserciones: descs ES, traducciones, contrato | script node sobre `data.js` | 9/9 PASS: 74 skills · 73 con desc · 0 EN residual · 55 traducciones · root Term=0% · SH Eval=86% · 2 con contrato · 66 sin · pills en card() | PASA |
| V4 | pestañas en navegador, pills, 0 errores consola | server temporal :8137 + Playwright | Herramientas: pills `Eval — · Term 0%` (root) y `Eval 86% · Term —` (SH) + 38 `sin contrato` visibles (40/40 en vista; 66 en data.js con assets); Skills & Agentes: 0 marcadores EN, descs ES en DOM; 0 errores consola | PASA |

### Evidencia
- V3: `assert-v3-r2.js` → 9/9 PASS (temp, fuera del repo).
- V4: capturas `.playwright-mcp/r2-v4-herramientas.png` y `r2-v4-skills-final.png`; consola 0 errores/0 warnings.
- Extracción de contrato verificada en `data.js`: `root → {file: CONTRATO.md, ev: null, term: 0}`, `SuitServiHogar → {file: Contrato.md, ev: 86, term: null}`, otros 66 → `null`.

### GAPs (no verificable ahora)
- `abrir.bat` real (doble click) no se ejecuta: Playwright bloquea `file://`; se valida con server estático temporal (patrón ronda 1).
- `web-search` (`.suit/skills/tool/web-search.yaml`) no tiene campo `description` en la fuente → 73/74 con desc por diseño (no se inventa contenido).

### Veredicto global
**PASA 4/4** — f3.

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
