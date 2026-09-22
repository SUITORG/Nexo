# MEGA-PROMPT — Generador de Brief de Marketing + Activos (SuitCampanas)

> Pégalo como tarea inicial en tu IDE (OpenCode / Claude Code) desde la raíz del repo que contiene `\SuitCampanas`.
> Está escrito como contrato: el agente debe leer, planear, orquestar sub-agentes y entregar artefactos verificables.

---

## 0. ROL Y MISIÓN

Actúas como **Director de Marketing + Arquitecto de Automatización**. Tu misión es construir y ejecutar un
**pipeline de generación de Briefs de Marketing** que, a partir de datos incompletos de la tabla
`Config_Empresas`, produzca:

1. Un **Brief Completo de 20 campos** (formato de una sola línea, pipe-delimited, idéntico a los ejemplos).
2. Los **Activos LAPVTFU** (los que sean generables) subidos a Google Drive con nomenclatura estándar.
3. Un **guion/copy publicitario** de nivel profesional listo para producción.
4. Un **menú en Google Sheets (GAS)** para disparar todo desde la hoja.

**Idioma de todos los entregables: español (México).**

---

## 1. LECTURA OBLIGATORIA ANTES DE ESCRIBIR CÓDIGO

No asumas nada. Primero inspecciona y resume en pantalla:

| Fuente | Qué extraer |
|---|---|
| `\SuitCampanas\BRIEF.MD` | Definición canónica de los 20 campos, ejemplos y los prompts usados para generarlos. **Esta es la fuente de verdad; si algo en este mega-prompt la contradice, gana BRIEF.MD.** |
| `\SuitCampanas\` (resto) | Prompts de anuncios, plantillas de guion, convenciones previas |
| **Índice de funciones** en `\suitorg` y `\SuitCampanas` | Los nombres de tablas y helpers **no se asumen**: descúbrelos aquí. Hay un archivo tipo índice de funciones; úsalo como mapa de acceso a datos |
| Supabase (vía MCP) | Tablas de **Industria**, **Nicho**, **Especialización** y **Tono de marca**. **Descubre los nombres reales** (lista esquemas y tablas, busca por coincidencia semántica) y documéntalos. Lista tabla + columnas + PKs + relaciones padre/hijo |
| `\SuitCampanas` (proveedores) | Generadores de imagen ya configurados y sus llaves/endpoints. **Descúbrelos ahí**; el orden esperado es OpenRouter → local (ComfyUI/Ollama) → Hugging Face → los demás que encuentres |
| Google Sheets `Config_Empresas` | Campos: `id_empresa, nombreempresa, alias, giro_especifico, descripcion, slogan, mensaje1, mensaje2, color_tema` |
| Google Drive (MCP) | Las carpetas `cte<id_empresa>` viven **a nivel raíz de Drive**, no dentro de una carpeta contenedora. Verifica permisos de escritura y de compartición |

**Entrega del paso 1:** un archivo `\SuitCampanas\_audit\DESCUBRIMIENTO.md` con el mapeo real
`campo_brief -> fuente (Config_Empresas | Supabase.tabla.columna | Web | Calculado | PENDIENTE)`.
No avances hasta tenerlo.

---

## 2. CONTRATO DE ENTRADA

Entrada mínima aceptada: **solo `id_empresa`**. Todo lo demás es opcional y mejora la precisión.

```
id_empresa (req) | nombreempresa | alias | giro_especifico | descripcion | slogan | mensaje1 | mensaje2 | color_tema
```

Reglas de robustez:
- Campo vacío ⇒ se **infiere** (web/Supabase) y se marca su procedencia.
- Campo presente ⇒ **nunca se sobrescribe**. Se respeta literal (especialmente `slogan`, `descripcion`, `color_tema`).
- `color_tema` es **un solo valor**; de ahí derivas la paleta (ver §7).
- Nada se deja en blanco silencioso: lo no resoluble se escribe como `[PENDIENTE - <motivo>]`.

**Semáforo de confianza** por campo: `A` (dato del cliente) · `B` (inferido con fuente citada) · `C` (propuesta creativa del agente).
El Brief final incluye un bloque de trazabilidad con estas etiquetas y las URLs consultadas.

---

## 3. LOS 20 CAMPOS DEL BRIEF

| # | Campo | Origen | Regla |
|---|---|---|---|
| 1 | Industria | Supabase (catálogo) | Match exacto a taxonomía; nunca texto libre |
| 2 | Nicho | Supabase (catálogo) | Hijo válido de la industria |
| 3 | Especialización | Supabase (catálogo) | Hijo válido del nicho |
| 4 | Vendes | Config / inferido | **Uno solo**: `Producto(s)` \| `Servicio` \| `Marca personal` |
| 5 | Para quién es (avatar) | Web | Demografía + geografía + psicografía + poder adquisitivo, en una frase densa |
| 6 | Dolor principal | Web | 3–5 dolores reales, redactados en el lenguaje del cliente |
| 7 | PBP (Promesa/Beneficio/Prueba) | Creativo + Web | Promesa y Beneficio se pueden proponer (`C`). Prueba: si no existe, usa **evidencia de categoría** citada y breve; jamás inventes testimonios |
| 8 | Qué quieres lograr | Config / elección | **Uno solo**: `Ventas` \| `Leads` \| `Awareness` \| `Contenido` |
| 9 | Dónde va a vivir | Derivado de #8 + #5 | Recomienda plataforma(s) con justificación de 1 línea |
| 10 | Activos (LAPVTFU) | Drive | Ver §5 |
| 11 | PM (Precio, Margen) | Config / mercado | Si falta: sugiere rango de mercado y márcalo `C`. Formato `0000.00,00%` (texto, no numérico) |
| 12 | Objeciones | Web | 4–6, en primera persona del avatar |
| 13 | Competidores | Web | Separa **competidores directos** y **referentes/inspiración** |
| 14 | Tono de marca | Supabase (catálogo de tonos) | Elige del catálogo; permite giro humorístico si el nicho lo tolera y no hay RLP que lo impida |
| 15 | Prueba social | Config / Drive | Si no hay: `[PENDIENTE - Prueba social]` |
| 16 | RLP (Restricciones legales) | Web | Regulador aplicable + políticas de Meta/Google Ads + disclosure de uso de IA. Breve y accionable |
| 17 | Slogan | Config | **Solo se copia del campo.** Si está vacío, propone 3 opciones marcadas `C` |
| 18 | Descripción / Oferta | Config | Respeta la del dueño. Si falta, armar oferta con estructura: qué incluye + garantía + facilidad de pago/envío |
| 19 | CTA | Creativo | Hook + copy alineado a #8. Ventas ⇒ imperativo de compra; Leads ⇒ captura de bajo riesgo; Awareness ⇒ curiosidad; Contenido ⇒ suscripción |
| 20 | Tipografía | Config / estándar | Si falta, usa par estándar (display + texto) coherente con #14 y reutilizable en landing, anuncios y papelería |

### DESTINO DEL BRIEF: el campo `logo_url`

El **Brief completo de 20 campos se escribe como una sola cadena dentro del campo `logo_url`** de `Config_Empresas`.
No se crea hoja nueva ni columnas adicionales para el Brief. Ese campo es el contenedor único y canonico.

Reglas del contenedor:

- Formato `campo1: valor | campo2: valor | campo3: valor | ...`, en el orden fijo de la tabla de arriba.
- Un valor puede ser **texto**, **número** (tratado como texto, no como dato numérico) o un **enlace compartido de Google Drive**.
- **Si un campo no está, no rompe nada.** El consumidor parsea por etiqueta, no por posición: ausencia = campo omitido o `[PENDIENTE - x]`. Nunca lances excepción por campo faltante.
- El separador `|` y los `:` de etiqueta están **prohibidos dentro de los valores**; si aparecen, escapa o sustituye por `⁄` y `-`.
- Consumidores de este campo: `SuitCampanas` y sitios web. Debe ser legible sin contexto extra.
- El formato exacto de `BRIEF.MD` **manda** sobre el ejemplo de abajo si difieren.

### Enlaces de Drive: obligatoriamente compartidos

Todo archivo que el pipeline suba o genere debe quedar **en modo compartido de lectura** y su **enlace compartido**
es lo que se escribe en el Brief. Secuencia obligatoria por activo: subir → aplicar permiso de lectura pública/por enlace
→ obtener el enlace → **verificar que responde sin sesión** → recién entonces escribirlo en `logo_url`.
Un enlace no verificado se escribe como `[PENDIENTE - enlace sin verificar]`, jamás como URL rota.

**Formato de salida exacto** (una línea, orden fijo, `|` como separador, `,` dentro de listas):

```
id_empresa=<ID> industria: … |nicho: … |especializacion: … |vendes: … |audiencia: … |dolor: … |PBP: … |lograr: … |vivir: … |LAPVTFU: <url1>,<url2>,<url3>,<url4>,<url5>,<url6>,<url7> |PM: 0000.00,00% |objecion: … |competidores: … |tono: … |PS: … |RLP: … |slogan: … |oferta: … |descripcion: … |cta: … |tipografia: …
```

`LAPVTFU` siempre lleva **7 posiciones**; las vacías se rellenan con `[PENDIENTE - <Activo>]`.

---

## 4. ORQUESTACIÓN CON SUB-AGENTES (PARALELO)

Lanza en paralelo y luego consolida. Cada sub-agente devuelve **JSON estricto** con `datos`, `confianza`, `fuentes[]`.

| Sub-agente | Entrada | Salida (campos) |
|---|---|---|
| `A_TAXONOMIA` | giro, descripción, nombre | 1, 2, 3, 14 (desde Supabase) |
| `B_AVATAR` | nicho, especialización, geo | 5, 6, 12 |
| `C_COMPETENCIA` | nicho, especialización, geo | 13, 11 (rango de mercado), 9 |
| `D_LEGAL` | industria, producto, plataformas | 16 |
| `E_OFERTA_COPY` | salidas de A–D + Config | 4, 7, 8, 17, 18, 19, 20 |
| `F_ACTIVOS` | id_empresa, nicho, color_tema | 10 (Drive + generación de imágenes) |
| `G_GUION` | Brief consolidado | Guiones de anuncio (§8) |

Reglas: A, B, C, D corren **simultáneos**; E depende de A–D; F corre en paralelo desde el inicio; G al final.
Ningún sub-agente escribe en Sheets/Drive salvo `F`. La consolidación y el semáforo los hace el orquestador.

---

## 5. ESTÁNDAR DE DRIVE Y NOMENCLATURA DE ACTIVOS

### Carpetas (idempotente)

```
<RAIZ_CLIENTES>/
  cte<id_empresa>/
    01_logo/   02_avatar/   03_foto_personal/   04_videos/
    05_testimonios/   06_fotos/   07_ugc/
    _brief/     ← BRIEF.md, brief.json, guiones
    _export/    ← piezas finales por plataforma
```

Busca `cte<id_empresa>` antes de crear. Si existe, **reutilizar** (nunca duplicar). Si no, crear el árbol completo.

### Nombres de archivo

```
cte<id>_<nn><activo>_<variante>_<ratio>_v<n>.<ext>
```

Ejemplos:
```
cteNOET_01logo_principal_transp_v1.png
cteNOET_02avatar_cartoon_transp_v1.png
cteNOET_03fotopersonal_recorte_transp_v1.png
cteNOET_06fotos_nicho01_4x5_v1.png … _nicho06_4x5_v1.png
```

### Reglas por activo LAPVTFU

| # | Activo | Acción del agente |
|---|---|---|
| 1 | **L**ogo | Si no existe ⇒ **generar** con **fondo transparente** (PNG con alfa real, no blanco). Vector-like, legible a 64px, monocromo de respaldo |
| 2 | **A**vatar | Si no existe ⇒ generar versión **caricatura sobria** (estilizada, proporciones creíbles, nada absurdo) salvo instrucción contraria. Solo figura, **fondo transparente** |
| 3 | **P**Foto personal | **No se genera nunca.** Si existe, recortar sujeto y asegurar **fondo transparente** |
| 4 | **V**ideos | `[PENDIENTE - Videos]` |
| 5 | **T**estimonios | `[PENDIENTE - Testimonios]` |
| 6 | **F**otos | Generar **6 imágenes** del nicho: producto/servicio en uso, entorno del avatar, detalle, antes/después o resultado, contexto social, fondo para texto |
| 7 | **U**GC | `[PENDIENTE - UGC]` — placeholder con brief de captura para el cliente |

Tras subir, escribe la URL `sharing` de cada archivo en la posición correspondiente de `LAPVTFU` y en `logo_url`.

---

## 6. APROVECHAR AL MÁXIMO LA GENERACIÓN GRATUITA DE IMÁGENES

Asume **cuota limitada**. Optimiza así:

1. **Un solo intento por imagen.** Prompt largo y específico antes que iterar a ciegas.
2. **Cascada de proveedores**: usa el generador del entorno; si agota cuota, cae al siguiente configurado y registra el fallback en el log. Nunca falles la corrida completa por cuota.
3. **Lote coherente**: genera las 6 fotos con un mismo *style anchor* (misma frase de estilo, luz, paleta de `color_tema`, lente) para que parezcan una sesión única.
4. **Transparencia**: para logo/avatar pide explícitamente fondo transparente; si el modelo no lo soporta, genera sobre color plano y **recorta el alfa en post** (verifica que el canal alfa exista antes de subir).
5. **Reutiliza antes de generar**: si el activo ya está en `cte<id>`, no gastes cuota.
6. **Caché de prompts**: guarda cada prompt usado en `_brief/prompts_imagenes.json` para reproducir sin re-descubrir.
7. **Sin texto dentro de la imagen** salvo el logo; el texto va en la capa de diseño (evita fallos tipográficos y ahorra reintentos).
8. **Ratios que rinden**: `4x5` (feed), `9x16` (Reels/TikTok), `1x1` (catálogo). Genera en el mayor y derivas recortes localmente.

---

## 7. COLOR Y TIPOGRAFÍA

De `color_tema` (un solo valor) deriva: primario, variante oscura/clara, neutro y un acento complementario,
verificando **contraste AA** para texto. Si `color_tema` está vacío, elige según industria + tono y márcalo `C`.
Tipografía: par display + texto, con pesos definidos, aplicable a landing, anuncios y documentos.

---

## 8. GUIONES Y COPY (SUB-AGENTE G)

Usa los prompts de anuncios que ya existen en `\SuitCampanas`. Para cada Brief entrega:

- **3 hooks** (0–3 s) distintos: dolor, curiosidad, resultado.
- **1 guion de 15–30 s** con marcas de tiempo, plano sugerido, voz en off y texto en pantalla.
- **1 guion UGC** (cámara frontal, lenguaje natural, sin producción).
- **Variantes por plataforma** según #9.
- **3 CTAs** alineados a #8.
- Cada guion pasa un **check de RLP (#16)** antes de entregarse: sin promesas médicas/financieras prohibidas, con disclosure de IA cuando aplique.

---

## 9. SKILL `/ConsultaWeb`

Crea una skill reutilizable para toda búsqueda del pipeline.

- **Propósito:** información **reciente** y mejores prácticas de negocio, avatar, tendencias, marketing, legal y competencia.
- **Entradas:** `tema`, `nicho`, `geo`, `intencion` (`avatar|dolores|objeciones|competencia|legal|tendencias|precios|mejores_practicas`), `recencia` (default 12 meses).
- **Comportamiento:** 3–5 consultas en paralelo con reformulaciones; prioriza fuentes primarias (reguladores, sitios oficiales, reportes de industria); descarta contenido sin fecha o de baja autoridad.
- **Salida:** JSON `{ hallazgos[], consenso, disidencias, fuentes[{titulo,url,fecha}], confianza }`.
- **Regla dura:** cada afirmación del Brief marcada `B` debe tener al menos una URL. Sin URL ⇒ se degrada a `C` o a `[PENDIENTE]`.

### Modo actualización (refresco continuo)

`/ConsultaWeb` no es de un solo uso: es el motor de **vigencia** del Brief. En modo `refresh`:

- Recorre solo los campos con confianza `B` (avatar, dolores, objeciones, competidores, precios de mercado, RLP) y los campos de tendencias.
- Compara con el valor actual y produce un **diff propuesto**: `campo | valor_actual | valor_nuevo | motivo | fuente | fecha`.
- **Nunca toca campos `A`** (datos del cliente: slogan, descripcion, color_tema, PM dado, prueba social real).
- Marca como *stale* todo campo `B` cuya fuente tenga más de 6 meses y priorizalo en el refresco.
- Registra cada corrida en `cte<id>/_brief/historial/` con fecha, para poder revertir.
- El diff se aprueba desde el menu de Sheets antes de reescribir `logo_url`.

---

## 10. MENÚ EN GOOGLE SHEETS (GAS)

Sí, conviene un menú — mismo patrón que el selector de estilos/colores de la landing.

`onOpen()` ⇒ menú **"SUIT Brief"**:

1. `Generar Brief (fila activa)`
2. `Generar Briefs (selección múltiple)`
3. `Crear/verificar carpeta cte<id> en Drive`
4. `Generar activos faltantes (LAPVTFU)`
5. `Generar guiones y CTAs`
6. `Ver trazabilidad y semáforo` (sidebar)
7. `Copiar Brief de una línea` (lee `logo_url` de la fila activa al portapapeles)
8. `Reprocesar solo campos PENDIENTE`
9. `Actualizar tendencias y mejores prácticas` (re-corre `/ConsultaWeb` y refresca solo los campos `B`)

Sidebar HTML con selects para los enumerados (`vendes`, `lograr`, `tono`, `vivir`, ratios) alimentados desde Supabase,
para que el usuario confirme antes de escribir.

**Escritura:** el Brief completo va únicamente al campo **`logo_url`**. No agregues columnas nuevas a `Config_Empresas`
ni alteres los campos de entrada. La trazabilidad (semaforo, fuentes, prompts) se guarda **fuera de la hoja**, en
`cte<id>/_brief/` en Drive (`brief.json`, `confianza.json`, `prompts_imagenes.json`).
Antes de sobrescribir `logo_url`, respalda el valor anterior en `cte<id>/_brief/historial/`.

---

## 11. CRITERIOS DE ACEPTACIÓN

- [ ] `DESCUBRIMIENTO.md` generado y coherente con `BRIEF.MD`.
- [ ] Un `id_empresa` suelto produce Brief completo sin errores.
- [ ] Los 20 campos presentes, en orden, sin blancos silenciosos.
- [ ] El Brief completo vive en el campo `logo_url`, en una sola línea, sin columnas nuevas en `Config_Empresas`.
- [ ] Un Brief al que le faltan campos **se parsea sin error** (prueba con 3 campos omitidos a propósito).
- [ ] Ningún valor contiene `|`; ningún enlace está roto.
- [ ] Cada enlace de Drive abre **sin sesión** (verificado, no solo generado).
- [ ] `logo_url` anterior respaldado antes de sobrescribir.
- [ ] Modo `refresh` de `/ConsultaWeb` produce diff aprobable y no toca campos `A`.
- [ ] Nombres de tablas de Supabase documentados desde el índice de funciones, no adivinados.
- [ ] `LAPVTFU` con 7 posiciones; 3/4/5/7 en `[PENDIENTE]` cuando corresponde.
- [ ] Carpeta `cte<id>` idempotente (segunda corrida no duplica).
- [ ] Logo y avatar con canal alfa verificado.
- [ ] 6 fotos de nicho con estilo consistente.
- [ ] Campos del cliente nunca sobrescritos.
- [ ] Toda afirmación `B` con URL.
- [ ] Menú GAS funcional y guiones con check RLP aprobado.
- [ ] Reproducible: `_brief/prompts_imagenes.json` + log de fuentes.

## 12. NO HAGAS

Inventar testimonios, cifras de resultados o certificaciones · sobrescribir datos del cliente ·
usar texto libre donde hay catálogo en Supabase · generar la foto personal · gastar cuota en activos existentes ·
entregar guiones sin validar restricciones legales · romper el formato de una línea ·
escribir un enlace de Drive sin verificar que es público · crear columnas nuevas en `Config_Empresas` ·
lanzar excepción por un campo ausente del Brief · adivinar nombres de tablas de Supabase.
