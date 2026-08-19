# Plan: Brief → MediaPlanner → BriefMarker (segunda plantilla de generación en SuitCampanas)

## Status
Propuesto (2026-08-01) — NO ejecutado. Especificación para que otra sesión/CLI lo implemente.

## Contexto y naming (para que quede sin ambigüedad)

Tres piezas nuevas, en cadena:

1. **Brief** — ya existe, capturado por el usuario en el campo `tipo_negocio` de la hoja `Config_Empresas` (Google Sheets). Es un string con un formato pipe-delimited de 18 campos. Falta: parsearlo a `brief_normalizado` (JSON).
2. **MediaPlanner** (aka Campaign Planner) — NUEVO. Toma `brief_normalizado`, llama a IA, devuelve `plan_de_medios` (campañas + lista de `content_slots`, cada slot = una futura pieza).
3. **BriefMarker** — NUEVO. Es el "segundo CreatorEngine" que pide el usuario (distinto del generador de guion VIDE que ya existe). Toma cada `content_slot` y llama a IA para devolver el JSON creativo completo de esa pieza (guion, voz, música, escenas, etc.) según el schema dado más abajo.

Este pipeline es **paralelo** al flujo VIDE/Ai existente — no lo reemplaza ni lo toca. Se activa eligiendo una opción nueva en el selector de plantilla (`#aiTemplate`).

### Restricción crítica de compatibilidad (verificada en código, no supuesta)

`tipo_negocio` ya lo lee **otro proyecto** del monorepo (el generador de sitios web, `js/modules/public.js`), con lógica de puro substring, NO parseo estricto:
```js
const tipoNegocio = (company.tipo_negocio || company.tiponegocio || "").toUpperCase().trim();
const forceShow = tipoNegocio.includes('SI_GALERIA');
```
y en varios otros puntos: `bizType.includes('SERVICIOS')`, `.includes('SEGUROS')`, `.includes('MARCA PERSONAL')`, etc., sobre el texto ANTES del primer `|` (la etiqueta libre, ej. "Autoridad en Kitchen-Tech").

**Por lo tanto**: el parser nuevo NUNCA debe reescribir ni normalizar el campo `tipo_negocio` en Google Sheets — solo LEE y parsea una copia para uso del MediaPlanner. Mientras el texto se mantenga con la etiqueta libre al inicio y el token `SI_GALERIA` (si aplica) en algún punto del string, el generador de sitios sigue funcionando exactamente igual, sin cambios.

## Formato del Brief (`tipo_negocio`) — spec de parseo

```
<etiqueta_libre> |campo1: valor1|campo2: valor2|...|campo18: valor18
```

Ejemplo real (dado por el usuario):
```
Autoridad en Kitchen-Tech |galeria: no_galeria|industria: Electrodoméstico y Bienes de Consumo Premium |nicho:Robots de Cocina Multifunción |especializacion: Asesoría de cocina inteligente |vendes: Thermomix |audiencia: mujeres del noreste de Mexico entusiastas, dinámicas, curiosas o deportistas de 27 a 55 años con poder adquisitivo medio alto |dolor: poco tiempo para cocinar, falta de organización, falta de creatividad en la cocina |PCP: hacer felices en la cocina a los demás, ahorro de tiempo, testimonios en redes sociales por usar la thermomix |lograr: ventas |vivir: TikTok |LAVTFU:https://drive.google.com/.../view,https://drive.google.com/.../view,,, |PM: 31000.00,15% |objecion: es caro, no tengo tiempo para citas, no soy capaz de usar aplicaciones, incredulidad |competidores:|tono: dinamico|PS: |RLP: decir que el anuncio fue creado con AI
```

### Algoritmo de parseo (tolerante — nunca truena, nunca bloquea)

1. `split('|')` sobre el string completo.
2. Primer segmento → `etiqueta_libre` (trim, se guarda tal cual, no se usa para nada más — es el campo legado).
3. Cada segmento siguiente → separar en la **primera** ocurrencia de `:` únicamente (no todas — varios valores son URLs y contienen `:` y `//`). Si no hay `:`, se descarta el segmento en silencio.
4. `key = parte_izquierda.trim().toLowerCase()`, `value = parte_derecha.trim()`.
5. Si `value` está vacío, el campo se omite del `brief_normalizado` (no se guarda como `""`, se omite la llave — así el MediaPlanner sabe distinguir "no vino este dato" de "vino vacío a propósito").
6. Campos con valores tipo lista (`audiencia`-no, pero `LAVTFU` y `PM` sí traen comas) → `value.split(',').map(s=>s.trim()).filter(Boolean)` — así se filtran las comas colgantes del ejemplo (`...,,, `).
7. Ningún campo faltante o mal formado debe lanzar excepción — mismo criterio de tolerancia que ya usa el resto de VIDE con datos de Sheets.

### Los 18 campos — mapeo a `brief_normalizado`

Significados confirmados por el usuario vía `SuitCampanas/BRIEF.MD` (diccionario propio, no supuesto):

| Campo (`tipo_negocio`) | Significado (BRIEF.MD) | Va a `brief_normalizado` como |
|---|---|---|
| (texto libre inicial) | Tipo de negocio (etiqueta legada, usada por el generador de sitios) | `etiqueta_legado` — sin tocar |
| `galeria` | `si_galeria` / `no_galeria` | `usa_galeria` (boolean, `true` si el valor contiene `si_galeria`) |
| `industria` | Industria | `industria` — **si viene vacío, usar el valor actual del selector Industria de VIDE** (ver regla de fallback abajo) |
| `nicho` | Nicho | `nicho` — mismo fallback que industria |
| `especializacion` | Especialización | `especializacion` — mismo fallback que industria |
| `vendes` | Qué vendes: Producto(s), Servicio o Marca Personal | `producto` |
| `audiencia` | Para quién es: audiencia exacta | `audiencia` |
| `dolor` | Dolor principal | `dolor` (array, split por coma) |
| `PCP` (BRIEF.MD lo llama PBP — mismo campo) | **Promesa, Beneficio y Prueba** — qué te hace distinto | `promesa_beneficio_prueba` (array) |
| `lograr` | Qué quieres lograr: Ventas / Leads / Awareness / Contenido | `objetivo` — mapea a `objective` del prompt MediaPlanner |
| `vivir` | Dónde va a vivir: RRSS | `canal_principal` (ej. "TikTok") |
| `LAVTFU` (BRIEF.MD: LAPVTFU) | **Activos**: Logo, Avatar, Foto Personal, Videos, Testimonios, Fotos, UGC | `activos` (array de URLs, split por coma, filtrando vacíos) |
| `PM` | **Precio y Margen** | `precio_margen: {precio, margen}` — split por coma: 1er valor = precio, 2do = margen (ej. `31000.00` / `15%`) |
| `objecion` | Objeciones más comunes | `objeciones` (array) |
| `competidores` | 3 competidores | `competidores` (array, puede venir vacío) |
| `tono` | Tono de la marca | `tono` |
| `PS` | **Prueba Social** — caso de éxito | `prueba_social` (puede venir vacío si aún no tienen uno) |
| `RLP` | **Restricciones Legales o de Plataforma** | `restricciones_legales` (ej. "declarar que el anuncio fue creado con IA") |

### Industria / nicho / especialización: autofill en ambas direcciones

Confirmado por el usuario, son 2 reglas independientes que se complementan (no una sola):

**1. Brief → Selectores (NUEVO — autofill automático al elegir empresa)**

Igual que hoy `setupCompanyAutoFill()` ya llena sitio web/teléfono/logo automáticamente al elegir una empresa (script.js:1945-2001), si el Brief de esa empresa trae `industria`/`nicho`/`especializacion` con valor Y esos valores coinciden con una fila real de las tablas `industrias`/`nichos` en Supabase, los selectores `#aiIndustry`/`#aiNicho`/`#aiEspecializacion` (compartidos por todas las plantillas, no solo BriefMarker) se auto-seleccionan en cascada — el usuario los puede cambiar después a mano, esto solo pre-llena.

- Requiere extender `/api/config` (local-server-node.js) para incluir `tipo_negocio` en el objeto de cada empresa que ya se manda al frontend (hoy se filtra fuera — ver el `.map()` del proxy). Sin esto, `companyConfigs` (de donde `setupCompanyAutoFill()` lee todo) no tiene el dato disponible en el navegador.
- Nueva función en `script.js`, llamada desde el mismo handler de `setupCompanyAutoFill()` (justo donde ya se llama `fetchEstilosVisuales()`, línea ~1992): `autoSelectIndustriaFromBrief(tipoNegocioRaw)`.
  - Extrae `industria`/`nicho`/`especializacion` del string (mismo algoritmo de parseo tolerante que el resto del plan, versión mínima en el cliente — no se comparte código con el parser completo del servidor, son lenguajes/runtimes distintos y es una extracción de 3 campos, no los 18).
  - **Matching tolerante, no exacto** — verificado con datos reales: el ejemplo del usuario dice "Electrodoméstico" (singular) pero la fila real en Supabase es "Electrodomésticos" (plural); una comparación `===` directa falla incluso en el propio ejemplo dado. Se normaliza cada string (minúsculas, sin acentos, sin plural simple con `s` final por palabra) antes de comparar:
    ```js
    const normalize = s => s.trim().toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .split(/\s+/).map(w => w.replace(/s$/, '')).join(' ');
    ```
    - `industria`: `normalize(grupo.categoria) === normalize(industriaTxt)` sobre `INDUSTRIAS_DATA.clasificacion` (ya cargado en memoria por el fetch existente de ADR-017, no requiere llamada nueva).
    - `nicho`: `normalize(n.etiqueta) === normalize(nichoTxt)` **o** `n.sinonimos.some(s => normalize(s) === normalize(nichoTxt))` — la columna `sinonimos` de la tabla `nichos` ya existe exactamente para este tipo de variación, se aprovecha en vez de reinventar matching.
    - `especializacion`: coincidencia exacta normalizada contra `getEspecializaciones(nicho.valor)`.
  - Si un nivel no matchea, se detiene ahí (no fuerza una selección incorrecta) — mismo criterio de tolerancia del resto del plan.
  - `ponytail`: normalización naive (solo quita una `s` final por palabra) — si en la práctica siguen quedando falsos-negativos por variaciones más complejas, subir a una librería de distancia de texto (ej. Levenshtein) en vez de este heurístico.
  - Caso límite conocido y aceptado: si `setupCompanyAutoFill()` corre antes de que `INDUSTRIAS_DATA` termine de cargar (fetch async en `DOMContentLoaded`), el auto-select simplemente no encuentra nada esa vez (array vacío, no crashea) — se resuelve solo si el usuario cambia de empresa de nuevo. No se agrega lógica de reintento para este caso raro.

**2. Selectores → Brief (fallback al generar el plan, si el Brief vino vacío)**

Si `industria`/`nicho`/`especializacion` quedan vacíos en `brief_normalizado` tras el parseo del servidor (como en el ejemplo real de `BRIEF.MD`, donde vienen vacíos) → `POST /api/media-plan/generate` recibe también los valores actualmente seleccionados en `#aiIndustry`/`#aiNicho`/`#aiEspecializacion` del formulario (mismo patrón que ya usa `generateVideJson()`) y los usa como fallback.

En conjunto, las 2 reglas encadenan bien: si el Brief trae el dato y matchea Supabase, la regla 1 ya deja los selectores correctos antes de generar nada; si el Brief no trae nada, la regla 2 usa lo que sea que el usuario haya dejado seleccionado a mano.

### Fallback si `tipo_negocio` no tiene el formato nuevo

Muchas empresas en `Config_Empresas` seguramente tienen valores viejos (ej. solo "Restaurante" o "SI_GALERIA", sin ningún `|`). El parser detecta esto (no hay `|` o hay 0 campos parseables) y devuelve `brief_normalizado = { etiqueta_legado: <texto completo> }` — un brief casi vacío. El prompt de MediaPlanner ya está diseñado para este caso: "si el brief es ambiguo... llena `assumptions`... continúa con un plan razonable" — no se bloquea, solo el plan resultante será más genérico.

## Decisiones de diseño (confirmadas con el usuario)

1. **Gate de aprobación en 2 pasos** (confirmado): se genera y muestra el `plan_de_medios` primero (1 sola llamada de IA, barata); el usuario Aprueba o Rechaza; solo al aprobar se dispara el CreatorEngine (BriefMarker) para cada `content_slot` (N llamadas de IA, caras). Mismo patrón que Aceptar/Rechazar ya implementado en VIDE (ADR-019).
2. **UI mínima para v1** (confirmado): sin panel nuevo de listado. Un botón dispara el flujo, un resumen (toast + conteo de campañas/piezas) confirma el resultado, y el detalle completo (plan_de_medios, cada creative_json) se revisa directamente en Supabase.
3. **Nombre corto de la plantilla** (confirmado por el usuario): **"🧭 BriefMarker (Plan de Campaña)"**, insertada como 2da opción de `#aiTemplate` (index.html:522-536), entre `🤖 Automático (Según Conciencia)` (value="") y `📘 Técnico / Educativo` (value="tecnico"). Value: `briefmarker`.
4. **Cap de seguridad** (confirmado por el usuario): máximo 12 `content_slots` procesados por plan en la fase de aprobación (evita quemar decenas de llamadas de IA si el MediaPlanner propone un plan enorme). Si el plan trae más, se procesan los primeros 12 por prioridad (`priority: alta` primero) y se informa cuántos quedaron sin generar. Ajustable, no es un límite duro de producto.

## Arquitectura — dónde vive cada pieza

Todo el orquestado (parseo + 2 llamadas de IA encadenadas) vive en el **servidor** (`local-server-node.js`), no en el frontend — evita tener que encadenar N fetches secuenciales desde el navegador y mantiene la lógica de parseo en un solo lugar.

### Endpoints nuevos (`local-server-node.js`)

- **`POST /api/media-plan/generate`** — body `{ id_empresa, industria_fallback, nicho_fallback, especializacion_fallback }` (los 3 últimos = valores actuales de los selectores VIDE en el frontend, opcionales).
  1. Trae la fila de `Config_Empresas` desde GAS (reusa el mismo mecanismo ya usado por el proxy `/api/config`, filtrando por `id_empresa`/`nomempresa` en vez de mapear al subset público).
  2. Parsea `tipo_negocio` → `brief_normalizado` (función nueva `parseBrief(tipoNegocioRaw)`). Si `industria`/`nicho`/`especializacion` quedan vacíos tras el parseo, se completan con `industria_fallback`/`nicho_fallback`/`especializacion_fallback` recibidos del body.
  3. Llama a IA con el prompt `CAMP-MEDIAPLANNER` (cargado desde `Prompts_IA`, mismo mecanismo que `loadPrompt`/`callOpenRouter` ya usados en el resto del server) inyectando `brief_normalizado` en el prompt.
  4. Inserta en `planes_medios` (Supabase) con `estado: 'pendiente_revision'`.
  5. Responde `{status:'success', data:{id, brief_normalizado, plan_de_medios}}`.

- **`POST /api/media-plan/:id/aprobar`**
  1. Lee el plan de `planes_medios` por `id`.
  2. Recorre `plan_de_medios.campaigns[].content_slots[]` (cap de 12, prioridad alta primero).
  3. Por cada slot, llama a IA con el prompt `CAMP-BRIEFMARKER` + el JSON schema dado (inyectado como instrucción de formato de salida), usando los datos del slot (`format`, `channel`, `goal`) + contexto del brief (audiencia, tono, objetivo, producto).
  4. Inserta cada resultado en `piezas_creativas`. Si una llamada de IA falla, se guarda esa fila con `estado:'error'` y se sigue con las demás (no se aborta el lote completo por una falla — mismo criterio de tolerancia del resto de la app).
  5. Actualiza `planes_medios.estado = 'aprobado'`.
  6. Responde `{status:'success', data:{plan_id, piezas_generadas, piezas_error}}`.

- **`POST /api/media-plan/:id/rechazar`** — solo actualiza `estado: 'rechazado'`, sin más efecto.

### Prompts nuevos en `Prompts_IA` (Supabase, mismo mecanismo que `CAMP-AI-MASTER`/`CAMP-BDSMT-TREND`)

- **`CAMP-MEDIAPLANNER`**: el prompt de "Media Planner senior" dado por el usuario, tal cual.
- **`CAMP-BRIEFMARKER`**: el prompt de "director creativo senior" dado, combinado con el JSON Schema dado (se le exige a la IA que la salida cumpla exactamente esa estructura — `objective, audience, platform, format, duration_seconds, hook, pain_point, solution, benefit, proof, emotion, cta, tone, voice, music, scenes, visual_style, editing, brand_assets, deliverables, variants`).

### Tablas Supabase nuevas (migración `Documentacion/migrations/007_planes_medios.sql`)

No se reutiliza la tabla `campanas` — su forma es plana (1 fila = 1 pieza publicada), y este flujo es jerárquico (1 brief → 1 plan → N campañas → N piezas). Forzarlo en `campanas` significaría duplicar el mismo `plan_de_medios` completo en cada fila o inventar columnas de relación que no encajan con su uso actual. Dos tablas nuevas, mismo patrón de RLS abierto que ya se usó para `campanas` (ADR-019 — herramienta interna de un solo tenant):

```sql
CREATE TABLE planes_medios (
  id text PRIMARY KEY,
  id_empresa text,
  empresa text,
  brief_raw text,
  brief_normalizado jsonb DEFAULT '{}'::jsonb,
  plan_de_medios jsonb DEFAULT '{}'::jsonb,
  estado text DEFAULT 'pendiente_revision',
  total_slots integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE piezas_creativas (
  id text PRIMARY KEY,
  plan_id text REFERENCES planes_medios(id),
  campaign_id text,
  slot_id text,
  format text,
  channel text,
  goal text,
  priority text,
  creative_json jsonb DEFAULT '{}'::jsonb,
  estado text DEFAULT 'generado',
  error_message text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE planes_medios ENABLE ROW LEVEL SECURITY;
ALTER TABLE piezas_creativas ENABLE ROW LEVEL SECURITY;
CREATE POLICY planes_medios_all ON planes_medios FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY piezas_creativas_all ON piezas_creativas FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
```

## Cambios de frontend (`script.js` / `index.html`)

1. `index.html:522-536` — nueva `<option value="briefmarker">🧭 BriefMarker (Plan de Campaña)</option>` insertada como 2da opción.
2. `script.js` — en el handler del botón Generar (`generateAIContent()` o el que corresponda), si `aiTemplate.value === 'briefmarker'`, desviar a un flujo nuevo (`generateMediaPlan()`) en vez del flujo normal de carrusel/VIDE:
   - `POST /api/media-plan/generate` con el `id_empresa` de la empresa seleccionada.
   - Mostrar resumen del `plan_de_medios` recibido (cuántas campañas, cuántas piezas totales, `summary` y `assumptions` del MediaPlanner) en un toast/bloque simple — NO se reconstruye el carrusel existente, es contenido distinto.
   - Dos botones: **Aprobar y Generar Piezas** / **Rechazar** → `POST /api/media-plan/:id/aprobar` o `/rechazar`.
   - Al aprobar, mostrar el conteo final (`piezas_generadas`/`piezas_error`) y un mensaje indicando que el detalle está en Supabase (tabla `piezas_creativas`).

## Archivos a modificar/crear

- `Documentacion/migrations/007_planes_medios.sql` (nuevo)
- `local-server-node.js` — `parseBrief()`, 3 endpoints nuevos, helper para traer una fila de `Config_Empresas` por `id_empresa`, **y extender el `.map()` de `/api/config` para incluir `tipo_negocio`** (hoy se filtra fuera del objeto que recibe el frontend)
- `script.js` — `generateMediaPlan()`, wiring del nuevo template, **`autoSelectIndustriaFromBrief()` enganchado a `setupCompanyAutoFill()`**
- `index.html` — nueva opción de plantilla + bloque de resumen/aprobación mínimo
- Prompts_IA (Supabase, vía script de seed o inserción directa) — `CAMP-MEDIAPLANNER`, `CAMP-BRIEFMARKER`

## Riesgo
Medio-alto: pipeline nuevo de varias piezas (parser + 2 tipos de llamada de IA + 2 tablas + UI), pero aislado — no modifica ningún endpoint ni tabla existente, solo agrega. El mayor riesgo real es de **costo/latencia** (hasta 12 llamadas de IA secuenciales en `/aprobar`) — aceptable para v1 dado el cap, revisar si se necesita paralelizar o mover a un job asíncrono si el uso real lo justifica.

## Validación
- `node --check local-server-node.js script.js`
- Prueba con un `tipo_negocio` real (el ejemplo del usuario) → confirmar `brief_normalizado` correcto campo por campo
- Prueba con un `tipo_negocio` de formato viejo/vacío → confirmar que no truena, genera `assumptions` razonables
- Prueba end-to-end: generar plan → aprobar → confirmar filas reales en `planes_medios` y `piezas_creativas` en Supabase
- Prueba de rechazo: generar plan → rechazar → confirmar que NO se generan piezas
- Confirmar que el generador de sitios web (`js/modules/public.js`) sigue detectando `SI_GALERIA`/tipo de negocio igual que antes con datos reales (no debe haber ninguna escritura nueva sobre `tipo_negocio`, solo lectura)
- Prueba específica del autofill Brief→Selectores: elegir una empresa con Brief real (ej. el ejemplo con "Electrodoméstico"/singular) y confirmar que `#aiIndustry`/`#aiNicho`/`#aiEspecializacion` quedan bien seleccionados pese al mismatch singular/plural con Supabase

## Rollback
- Tablas nuevas, sin tocar existentes: `DROP TABLE piezas_creativas; DROP TABLE planes_medios;`
- `git checkout -- local-server-node.js script.js index.html`
- Borrar filas `CAMP-MEDIAPLANNER`/`CAMP-BRIEFMARKER` de `Prompts_IA`

## Referencia
- Diccionario oficial de campos del Brief: `SuitCampanas/BRIEF.MD` (fuente de verdad para los 18 campos — cualquier duda de significado durante la implementación se resuelve ahí, no adivinando).
- Sin bloqueantes pendientes — nombre de plantilla, cap de piezas y significado de los 18 campos ya confirmados por el usuario (2026-08-01).
