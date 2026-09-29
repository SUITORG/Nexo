---
name: clusters-seo
description: "Generador de clústeres SEO + GEO/AEO para landings multi-inquilino: a partir de un registro de Config_Empresas diseña hasta 9 clústeres diferenciados (Config_SEO, 10 columnas), pide aprobación con vista previa y escribe automático (appendRows + sync). Úsala cuando el usuario diga 'clústeres seo', 'clusters seo', 'genera clústeres', '9 clústeres', 'seo geo', 'aeo', 'páginas temáticas seo', 'agrega empresa', 'modifica empresa', o cuando empresa-registro complete un alta o detecte cambio de datos clave (giro, servicios, cobertura). Depende de empresa-registro (registro maestro) y es skill canónica SuitOS."
license: MIT
compatibility: "Claude Code y opencode. Requiere: GAS webapp (appendRows, subirImagenCte), MCP supabase (verificación), búsqueda web (imágenes libres)."
metadata:
  author: Roberto Padron
  version: "1.0"
---

# Clusters-seo — clústeres SEO + GEO/AEO por empresa

Genera la arquitectura de páginas temáticas (landings) de **una empresa** en la tabla maestra `Config_SEO` (Google Sheets). Especificación completa: `references/prompt_clusters_seo_geo.md` (prompt maestro — esta skill lo ejecuta e integra con SuitOrg).

**Dependencia canónica**: los datos de entrada los garantiza `empresa-registro` (alta/modificación de empresas). Tras un alta, o tras una modificación de datos clave, `empresa-registro` invoca esta skill.

## Entradas

- `/clusters-seo <ID>` directo, o disparo desde `empresa-registro`.
- Frases: "clústeres seo", "genera clústeres", "9 clústeres", "seo geo", "agrega empresa", "modifica empresa".

## Flujo (4 fases del prompt maestro)

```text
F1 INSPECCIÓN (solo lectura)
├── 📁 lee Config_Empresas[<ID>] (GAS getAll)
├── 📁 lee Config_SEO existentes de <ID> (dedupe: por INTENCIÓN, no por formato —
│        el legacy usa SEO-001/C1/números; las filas nuevas usan kebab descriptivo)
├── 📁 lee Config_Paginas.id_cluster (54 ligas — no romper páginas existentes)
└── identifica datos faltantes para contenido veraz

F2 DIAGNÓSTICO + PROPUESTA
├── diseña ≤9 clústeres (las9 intenciones del prompt: principal, segmento×2,
│        problema, complementaria, comparación, post-venta, geo×2)
├── descarta/fusiona duplicados; justifica cada uno
└── ✍️ vista previa Markdown: | # | id_cluster | division | titulo | intención | valor | imagen |

F3 PREGUNTAS (solo si <95% certeza)
└── agrupadas y de alto impacto; si no: "Datos suficientos: procedo con N registros"

F4 ESCRITURA (SOLO tras aprobación explícita)
├── 📁 por cada clúster: foto libre (Unsplash/Pexels) → ⚡ GAS subirImagenCte
│    (archivo imagenurl-{id_cluster}.jpg en cte<id>/, share ANYONE) → URL view
│    o `PENDIENTE_IMAGEN` si falla licencia/URL
├── ✍️ GAS appendRows {table:"Config_SEO", rows:[…10 columnas…]}
├── ⚡ GAS syncToSupabase (Config_SEO es tabla sincronizada)
├── 📋 verificación: filas = N, id_cluster únicos, espejo refleja
└── ⛓️ CADENA: tras escritura confirmada → ofrécele continuar con
     `⚡ paginas-seo <ID>` (mapa editorial de páginas → aprobación → redacción)
```

## Especificación de las 10 columnas (orden exacto)

`id_empresa · division · id_cluster · titulo · icono · keywords_coma · imagen_url · wa_directo · hex_color · mail_directo`

- **Solo estas 10** (decisión del usuario: sin describir el resultado primero no se tocan `description/slug/og_image/metadata/keywords/title` — ssg-engine cae a fallback, cero impacto).
- `id_cluster`: kebab sin acentos, describe la intención, ≤50 chars, único por empresa (`baterias-negocios`, `hamburguesas-para-llevar`).
- `division`: **PascalCase** (`Energia`, `Clinicas`, `ComidaRapida`) — no copiar el caos legacy (UPPERCASE/frases).
- `titulo`: 35-65 chars, natural, sin emojis ni "la mejor".
- `icono`: `fas fa-<nombre>` semántico; no repetir salvo misma categoría real.
- `keywords_coma`: 5-8 frases, separadas por coma, intención real, idioma de la empresa.
- `imagen_url`: URL Drive `…/file/d/ID/view…` (el sistema la convierte al render: `fixDriveUrl`→lh3, `directDriveImage`→uc) o CDN directo — **nunca** Markdown.
- `wa_directo`: `https://wa.me/<solo dígitos, con prefijo país>?text=<msg-url-encode>` con mensaje humano variado por clúster. Fuente: `telefonowhatsapp`.
- `hex_color`: primer token no vacío de `color_tema` (separa por `|`), normalizado `#RRGGBB`. Sin valor → detener y pedir revisión (no inventar).
- `mail_directo`: `correoempresarial` exacto.

## Reglas SuitOrg (empatar con el sistema)

1. **Maestro = Sheets** (`Config_SEO`, 5 tablas maestras); Supabase = espejo por `syncToSupabase`.
2. **Noindex de demos**: solo EvaSol indexa (`plan-posicionamiento-seo-multitenant`) — la generación es igual para todos; quién indexa lo decide el SSG.
3. **Consumidor**: `ssg-engine.mjs` usa `titulo/description/keywords|keywords_coma/imagen_url` de la **primera** fila de la empresa; `Config_Paginas` liga por `id_cluster`.
4. **Nunca** UPDATE/DELETE de filas ajenas ni de otros `id_empresa`. Filas legacy se conservan como están.
5. **Modificación de empresa** (desde `empresa-registro`):
   - datos **clave** (giro, servicios/productos, cobertura) → ofrecer regeneración completa (F1-F4 con vista previa).
   - datos **no clave** (teléfono, logo, color) → actualizar `wa_directo`/`hex_color`/`mail_directo` en las filas existentes de esa empresa vía `updateRow` por `id_cluster` (loop) + sync.
6. **Prohibiciones del prompt**: sin inventar certificaciones/precios/ubicaciones, sin keyword stuffing, sin imágenes con licencia no verificada, sin escribir sin aprobación.

## Validación (10 checklist del prompt)

`id_empresa` correcto · `id_cluster` únicos · intenciones distintas · títulos no duplicados · keywords plausibles · wa/mail/color desde `Config_Empresas` · imagen válida o `PENDIENTE_IMAGEN` · sin afirmaciones no verificadas · cero Markdown/HTML en celdas · "¿un visitante la encontraría útil sin Google?"

## Código GAS asociado

Endpoint GAS de `.clasp.json` (ver `empresa-registro` para la URL). Acciones usadas: `appendRows`, `subirImagenCte`, `updateRow`, `syncToSupabase`, `getAll`. Si cambia GAS: `node --check` + `clasp push` + `clasp deploy -i <deploymentId>`.
