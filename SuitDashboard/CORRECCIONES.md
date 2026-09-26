# CORRECCIONES — aprendizajes acumulados
Lee este archivo antes de validar. Cada entrada debe convertirse en una prueba.

## 2026-09-25 — Cron no se extraia del workflow
- Sintoma: V3 fallo la primera vez: `ssg-engine.mjs` mostraba `github workflow · ssg-regenerate.yml` en lugar de `cron 0 3 * * * · ssg-regenerate.yml`.
- Causa raiz: la regex asumia `- cron:` en la linea siguiente a `schedule:`, pero `ssg-regenerate.yml` tiene 3 lineas de comentario intercaladas.
- Arreglo aplicado: regex tolerante a comentarios/lineas intermedias: `schedule:[\s\S]{0,500}?-\s*cron:` en `scan.js` (`triggersFor`).
- Regla preventiva: al parsear YAML con regex, no asumir lineas contiguas; acotar el salto ([\s\S]{0,N}) para no cruzar bloques.
- Prueba que lo cubre: V3 (spot-check `chk('ssg-engine.mjs','cron')`).
