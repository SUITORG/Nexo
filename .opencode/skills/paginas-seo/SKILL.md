---
name: paginas-seo
description: "Generador de Config_Paginas (páginas de servicio SEO/GEO/AEO) a partir de Config_SEO: experto copywriter + arquitecto de contenido que redacta los 3 campos JSON (meta_json, schema_json, contenido_json) que alimentan la página en vivo desde Google Sheets. Cadena: empresa-registro → clusters-seo → paginas-seo (con gates de aprobación), o invocable por separado. Úsala cuando el usuario diga 'páginas seo', 'genera las páginas', 'config paginas', 'contenido de páginas', 'páginas del clúster', 'alimenta las páginas', o cuando clusters-seo complete la escritura de clústeres. Skill canónica SuitOS."
license: MIT
compatibility: "Claude Code y opencode. Requiere: GAS webapp (appendRows, syncToSupabase), lectura de Config_Empresas/Config_SEO/Config_Paginas."
metadata:
  author: Roberto Padron
  version: "1.0"
---

# Paginas-seo — páginas de servicio que alimentan el sitio desde GS

Especificación completa del prompt maestro: `references/prompt_config_paginas_seo_geo.md`. Esta skill la ejecuta **empatada con los datos reales** de las tres pestañas y con el renderer actual.

## Cadena (posición)

```text
empresa-registro (alta/modificación) → clusters-seo (Config_SEO, aprobación) → ⚡ paginas-seo (Config_Paginas, aprobación) → sitio se alimenta en vivo
```

- Encadenada con **gates propios**: tras aprobar y escribir clústeres, esta skill propone el **mapa editorial de páginas** (gate 1) → redacción → **aprobación final** (gate 2) → escritura.
- Invocable **por separado**: `/paginas-seo <ID>` o frases propias.
- Orden obligatorio: **nunca** generar páginas sin leer primero `Config_SEO` de esa empresa (y en paralelo con clusters-seo recién aprobado, esperar).

## El patrón (contrato REAL extraído de las pestañas — manda sobre el prompt teórico)

| Campo | Contrato canónico |
|---|---|
| `contenido_json` | **Plano**: `{"titulo","subtitulo","p_intro","texto","preguntas_frecuentes":[{pregunta,respuesta}], "imagen_url"?}` — lo único que renderiza el sitio (`public.js`: `updateMetadata` :1211, `renderDynamicContent` :873, FAQ :915). **Jamás `bloques[]`** (no lo lee nadie → página en blanco). Sin Markdown (`innerHTML` muestra `**` literal): texto plano o `<strong>` |
| `meta_json` | `{"title","description","keywords":[...]}` — **keywords como ARRAY** (patrón 65/66 filas) |
| `schema_json` | **Mismo objeto `Service` (schema.org) en la columna Y anidado en `contenido_json.schema_json`** — la columna cumple el TSV; el anidado es el que el JSON-LD mezcla (`public.js:1286`). Sin datos inventados (reseñas, precios, horarios…) |
| Tamaño | 300-500 palabras visibles; FAQ de alta intención casi obligatorio |
| URL | Ruta real: **`#{id_pagina}`** (hash). EvaSol: `https://grupoevasol.com/?co=EVASOL#<id>` · demos: `grupoevasol.com/pfm.html#<id>`. `/servicios/{id}` NO existe — no romper, anotar como migración futura si se pide |

**Dato dinámico**: el sitio lee `app.data` (traído de GAS `getAll`) — un cambio en GS actualiza la página al próximo render; `syncToSupabase` mantiene el espejo.

## Flujo (5 fases del prompt)

```text
F1 INSPECCIÓN (solo lectura)
├── 📁 Config_Empresas[<ID>] · 📁 Config_SEO[<ID>] (clústeres = hub) · 📁 Config_Paginas[<ID>]
├── valida: toda página existente apunta a un id_cluster existente (mismo id_empresa)
├── reporta basura sin tocarla: huérfanas, dups id_empresa+id_pagina, JSON roto, bloques[] legacy
└── mapeo explícito columnas reales (las6 de la hoja: id_empresa, id_pagina, id_cluster, meta_json, schema_json, contenido_json)

F2 MAPA EDITORIAL (gate 1)
├── por cada clúster: 1 página profunda | N hijas con intención distinta | 0 (ya cubierto)
├── ✍️ tabla: id_cluster | id_pagina | intención | audiencia | tipo | motivo | palabras | estado
├── fusiona intenciones iguales; propón noindex/despublicar lo duplicado
└── ❓ preguntas solo si bloquean exactitud → ESPERA aprobación humana

F3 REDACCIÓN (copywriter experto — hook → servicio → beneficios → objeciones → CTA)
├── id_pagina: kebab, ≤50, sin acentos/espacios, único en la empresa (corregir legacy "aumenta tu pension")
├── id_cluster = existente en Config_SEO[<ID>]
├── ✍️ meta_json + schema_json (Service, columna+anidado) + contenido_json plano + FAQ
└── imagen_url: HEREDA la del clúster (clusters-seo ya la subió) salvo indicación contraria

F4 VALIDACIÓN (previa a escritura)
├── parseo de los3 JSON (error = bloqueo) · sin dups id_empresa+id_pagina
├── id_cluster existe ✓ · URLs no ficticias · títulos diferenciados (≤80% similitud)
├── sin claims de riesgo (precios, certificaciones, tiempos, cobertura, legal)
└── reporte: aprobadas | bloqueadas | advertencias → ESPERA aprobación final

F5 ESCRITURA
├── ✍️ GAS appendRows {table:"Config_Paginas", rows} → GS maestro
├── ⚡ syncToSupabase (Config_Paginas sincronizada)
├── actualizaciones: SOLO con modo "actualiza" explícito del usuario (nunca en modo crear)
└── 📋 resultado: creadas/omitidas/bloqueadas → ↪ CIERRE DE TODA PASADA
```

## Modo actualización

Páginas existentes solo se sobrescriben si el usuario pide **`actualiza`** explícitamente. Nota técnica: `updateRow` de GAS hace match por UN solo campo y `id_pagina` se repite entre empresas (`home` ×4) → para update usar match compuesto (acción `updateRowExt` por crear, o reemplazar la fila vía append+borrado lógico con aprobación). **Nunca** borrar filas sin pedido.

## Datos sucios existentes (solo reportar, jamás borrar sin pedido)

13 huérfanas (página sin clúster) · 4 duplicados (`PAPER/home` ×2) · 1 JSON roto · 24 filas `bloques[]` no renderizadas · `id_pagina` con espacios/mayúsculas. Anotar en `PENDIENTES.md` si el usuario no manda limpieza.

## Reglas del prompt (resumen)

Contenido conservador (sin "garantizado/mejor/24/7" sin evidencia) · no inventar nada de la empresa · solo enlazar páginas existentes del mismo lote · `robots:"index,follow"` solo si la página es pública/única (las demos van `noindex` por regla del SSG) · no tocar Config_Empresas/Config_SEO/código sin tarea aparte · 0 escrituras sin aprobación.
