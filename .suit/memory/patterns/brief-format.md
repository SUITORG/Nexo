# Pattern: Formato del Brief (vector en `logo_url`)

**Fuente de verdad:** `SuitCampanas/BRIEF.MD` (diccionario oficial de campos)
**ADR primaria:** ADR-025 (contrato de datos), ADR-026 (consolidación + fixes)
**Parser:** `SuitCampanas/local-server-node.js` → `parseBrief()`
**Consumidores:** MediaPlanner, BriefMarker, renderLanding (root)

---

## Ubicación del dato

El Brief vive en **`Config_Empresas.logo_url`** (Google Sheets), NO en `tipo_negocio`.
`tipo_negocio` solo acepta `{etiqueta_libre},{si_galeria|no_galeria}` (2 valores crudos, sin etiquetas).

## Formato

Pipe-delimited (`|`), segmentos `etiqueta: valor`:

```
industria: valor|nicho: valor|especializacion: valor|...|cta: texto
```

Segmento 0 puede ser etiqueta libre (sin `:`) para legado, o `industria: valor` si ya está migrado.

## Los 19 campos canónicos

| # | Etiqueta | Significado | Tipo | Notas |
|---|---|---|---|---|
| — | *(texto libre)* | Tipo de negocio (legado) | string | Solo en `tipo_negocio`, NO en `logo_url` |
| 0 | `galeria` | `si_galeria` / `no_galeria` | enum | Solo en `tipo_negocio` |
| 1 | `industria` | Industria | texto libre | |
| 2 | `nicho` | Nicho | texto libre | |
| 3 | `especializacion` | Especialización | texto libre | |
| 4 | `vendes` | Qué vendes | texto libre | Mapea a `producto` en brief_normalizado |
| 5 | `audiencia` | Audiencia exacta | texto libre | |
| 6 | `dolor` | Dolor principal | lista (`,`) | Split por coma, filtra vacíos |
| 7 | `PBP` | Promesa, Beneficio y Prueba | lista (`,`) | **Etiqueta canónica: `PBP`** (NO `PCP`). Aliases: `pcp`, `pbp`, `pbm` |
| 8 | `lograr` | Objetivo (Ventas/Leads/Awareness/Contenido) | texto libre | Mapea a `objetivo` |
| 9 | `vivir` | Canal principal (RRSS) | texto libre | Ej. "TikTok" |
| 10 | `LAPVTFU` | Activos (7 slots posicionales) | 7 slots `,` | Logo, Avatar, FotoPersonal, Videos, Testimonios, Fotos, UGC |
| 11 | `PM` | Precio y Margen | 2 valores `,` | `{precio},{margen}` — Ej. `31000.00,15%` |
| 12 | `objecion` | Objeciones más comunes | lista (`,`) | Split por coma, filtra vacíos |
| 13 | `competidores` | Competidores | lista (`,`) | Hasta 3 |
| 14 | `tono` | Tono de la marca | texto libre | |
| 15 | `PS` | Prueba social / caso de éxito | texto libre | |
| 16 | `RLP` | Restricciones legales o de plataforma | texto libre | Ej. "declarar que el anuncio fue creado con AI" |
| 17 | `oferta` | Oferta principal | texto libre | |
| 18 | `descripcion` | Descripción de la oferta | texto libre | **Lleva tilde: `descripcion`** |
| 19 | `cta_texto` | Llamado a la acción | texto libre | Mapea a `cta` |

## `LAPVTFU` — slots posicionales

Posiciones fijas (NO filtrar vacíos — desalinea las posiciones):

| Slot | Nombre | Notas |
|---|---|---|
| 1 | Logo | |
| 2 | Avatar | Fallback: copia del slot 1 (Logo) |
| 3 | Foto Personal | Opcional |
| 4 | Videos | |
| 5 | Testimonios | |
| 6 | Fotos | **Pendiente:** separador interno para hasta 5 sub-fotos (no resuelto) |
| 7 | UGC | Contenido de usuarios |

## Reglas de parseo (`parseBrief()`)

1. `split('|')` sobre el string completo
2. Cada segmento → separar en **primera** ocurrencia de `:`
3. `key = parte_izquierda.trim().toLowerCase()`
4. Si `value` está vacío → campo se omite (no se guarda como `""`)
5. Campos de lista (`dolor`, `PBP`, `objecion`, `competidores`) → `split(',').filter(Boolean)`
6. `LAPVTFU` → 7 slots posicionales, rellena con `''` si faltan
7. `PM` → `{precio, margen}`
8. **Nunca lanza excepción** — tolerante a datos incompletos/malformados

## Ejemplo real (TOÑOTOQUES corregido)

```
industria: Alimentos y Bebidas Artesanales|nicho: Quesos artesanales y derivados|especializacion: Produccion artesanal de quesos y derivados|vendes: Quesos artesanales y derivados|audiencia: personas de 25 a 55 anos en Monterrey y area metropolitana, que disfrutan la buena mesa y valoran la calidad artesanal|dolor: poco tiempo para cocinar, falta de organizacion, falta de creatividad en la cocina|PBP: quesos artesanales de calidad, ahorro de tiempo, testimonios en redes sociales por usar nuestros quesos|lograr: ventas|vivir: Instagram|LAPVTFU:,,,,,|PM: 0,0%|objecion: es caro, no tengo tiempo para ir a buscar quesos artesanales|competidores:|tono: cercano y artesanal|PS:|RLP: decir que el anuncio fue creado con AI|oferta: Los mejores quesos artesanales de Monterrey, directo de nuestra tierra a tu mesa|descripcion: Quesos artesanales de Monterrey, elaborados con leche fresca y recetas tradicionales — sabor autentico sin conservadores artificiales, con entrega a domicilio|cta_texto: Ordena ahora tus quesos favoritos
```

## Errores comunes al cargar

| Error | Corrección |
|---|---|
| `PCP` en vez de `PBP` | La etiqueta canónica es `PBP` (Promesa, Beneficio y Prueba). `PCP` funciona como alias pero es confuso |
| `LAVTFU` en vez de `LAPVTFU` | Ambos aliases funcionan, pero `LAPVTFU` es el nombre canónico |
| `slogan` en el vector | `slogan` vive en su propio campo de Config_Empresas, NO en `logo_url` |
| `descripcion` sin tilde | Correcto: la etiqueta es `descripcion` (sin tilde en el key del parser) |
| Duplicar `telefonowhatsapp`/`color_tema` | Ya tienen su propia columna en Config_Empresas — no duplicar |
| `oferta`/`cta` en formato viejo | En `logo_url`, son `oferta: texto` y `cta: texto` (etiquetados), no posicionales |

## Código relevant

- **Parser:** `SuitCampanas/local-server-node.js:647` → `parseBrief()`
- **Aliases:** `local-server-node.js:634` → `BRIEF_LIST_FIELDS`
- **Landing (root):** `scripts/ssg-engine.mjs` → `resolveBriefParts()`
- **Frontend (logo split):** `SuitCampanas/script.js:15` → `parseLogoUrlField()`
- **Test:** `SuitCampanas/scripts/tmp_test_parser.js`
