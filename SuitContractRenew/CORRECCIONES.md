# CORRECCIONES — aprendizajes acumulados
Lee este archivo antes de validar. Cada entrada debe convertirse en una prueba.

## 2026-10-11 — Respuestas POR CONFIRMAR duplicadas desde el panel
- Síntoma: `docs/CONTRATO.md` quedó con `~~[x] ~~[x] ~~…~~` anidado tras guardar 2 veces desde el panel web.
- Causa raíz: el filtro de `resolverPorConfirmar` no excluía filas ya `- [x]`; una segunda corrida volvía a procesar resueltos.
- Arreglo aplicado: filtro `!/^- \[x\]/` en `serve-panel.js` + limpieza manual del contrato (commits `2fded75`).
- Regla preventiva: al editar secciones "resueltos" de contratos, siempre excluir lo ya marcado `[x]`.
- Prueba que lo cubre: V5 (contrato muestra 4 resueltos exactos, sin duplicados)

## 2026-10-11 — Argumentos desalineados en CLI book-add (PawBook)
- Síntoma: `main.py book-add` imprimía "depósito 450%" (usaba precio como pct).
- Causa raíz: posiciones de `sys.argv` desfasadas (precio en índice de pct).
- Arreglo aplicado: índices corregidos en `SuitPawBook/python/main.py` (commit `ce3551e`).
- Regla preventiva: al añadir argumentos opcionales a CLIs Python, verificar con un caso completo (todos los args).
- Prueba que lo cubre: fuera de este alcance (PawBook) — válido como aprendizaje cross-módulo.
