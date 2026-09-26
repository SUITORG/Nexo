# CORRECCIONES — aprendizajes acumulados
Lee este archivo antes de validar. Cada entrada debe convertirse en una prueba.

## 2026-09-25 — Cron no se extraia del workflow
- Sintoma: V3 fallo la primera vez: `ssg-engine.mjs` mostraba `github workflow · ssg-regenerate.yml` en lugar de `cron 0 3 * * * · ssg-regenerate.yml`.
- Causa raiz: la regex asumia `- cron:` en la linea siguiente a `schedule:`, pero `ssg-regenerate.yml` tiene 3 lineas de comentario intercaladas.
- Arreglo aplicado: regex tolerante a comentarios/lineas intermedias: `schedule:[\s\S]{0,500}?-\s*cron:` en `scan.js` (`triggersFor`).
- Regla preventiva: al parsear YAML con regex, no asumir lineas contiguas; acotar el salto ([\s\S]{0,N}) para no cruzar bloques.
- Prueba que lo cubre: V3 (spot-check `chk('ssg-engine.mjs','cron')`).

## 2026-09-26 — Descripciones de skills truncadas y multilínea
- Sintoma: V3 inicial: 28 skills SuitOS mostraban descripción vacía; otras cortadas a la mitad (`"Google Sheets",`, `...confidence `), y `browser-act`/`frontend-slides` usaban `name: X` como descripción.
- Causa raiz: (a) `fm` cortado por BOM en el primer carácter → regex no arrancaba; (b) regex `description:\s*` con `\s` cruzaba líneas y duplicaba la primera; (c) unión de continuaciones solo si había marker `>`/`|` → escalares plain-multiline (google-sheets) no se unían; (d) `yamlDesc` recortaba con `.slice(0, 300)`; (e) en PowerShell, `$`/backtick dentro de `node -e` rompen regex/template literals (falso FAIL).
- Arreglo aplicado: strip BOM en `readText`; regex sin cruzar líneas + unión por indentación siempre; quitar `slice(0,300)`; asserts de validación en archivo `.js` temporal en vez de `node -e`.
- Regla preventiva: toda extracción de YAML/MD debe devolver el texto completo (nunca truncar en extractor) y los asserts del pipeline van a archivo, no inline en shell con comillas/`$`.
- Prueba que lo cubre: V3 (`73 con desc`, `0 EN residual`, `55 traducciones aplicadas`).

## 2026-09-26 — Contratos: solo 2 reales (conteo del encuadre corregido)
- Sintoma: el encuadre estimó "22 proyectos sin contrato"; con datos reales son 66 (2 con contrato: raíz y SuitServiHogar).
- Causa raiz: el conteo previo era una estimación sin leer `contractFor`; además `SuitDashboard` está en `EXCLUDE` (no se autoescanea) y solo existen 2 archivos `contrato*.md`/`Contrato.md` en raíces de proyecto (verificados con filesystem).
- Arreglo aplicado: badge `sin contrato` para los 66; cifras corregidas en VALIDACION.md con evidencia de V3.
- Regla preventiva: nunca citar conteos en docs de validación sin verificarlos contra `data.js`/filesystem.
- Prueba que lo cubre: V3 (`exactamente 2 con contrato`, `66 sin contrato`).
