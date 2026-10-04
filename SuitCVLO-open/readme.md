# SuitCVLO-open

Aplicación web **local** (puerto **3015**) que procesa lotes de fotos de publicidad exterior y genera:

- **Estructura de carpetas**: `<Ruta de Salida>\<AAMMPQ>\auditoria\<Marca><TipoAnuncio><Ciudad>\<PIN>\`
  (la quincena `AAMMPQ` se calcula con la **fecha de la foto**: días 1–15 → `01`; 16–31 → `02`).
- **`info.txt`** por PIN: encabezado (`GRUPO`, `PIN`, `COORDENADAS`) + un bloque por foto
  (**`FOTO`** (nombre del archivo), **`CAMPAÑA`** = el eslogan de la campaña,
  **`COMENTARIO`** = qué promociona / el texto que se ve, `PLAZA`,
   **`PROVEEDOR`** = el anunciante o marca (**KML `MARCA` → si no, la de la IA validada en
   `marcas-conocidas.txt` → si no, la regla por PIN**; lo que no viene del KML se marca con ` *`),
   `RAZÓN SOCIAL, MEDIO, FORMATO, ID, UBICACIÓN, LATITUD, LONGITUD`)
   con llenado **KML → si el PIN no está en el KML, del archivo de pines**
   (ver *Prioridad de la fuente* más abajo).
  La IA responde **8 líneas** (`ANUNCIO, MARCA, CAMPAÑA, QUE ANUNCIA, TEXTO VISIBLE,
  REFERENCIAS UBICACION, TIPO SOPORTE, CARA`); las lecturas viejas que traían
  `MARCA CAMPAÑA` fusionado siguen sirviendo (la marca cae en `PROVEEDOR` y en `CAMPAÑA`).
  **`COMENTARIO` depende del switch de *Opciones avanzadas*** (activado por defecto).
  *Se reescribe entero cada vez que entra una foto nueva al PIN; las fotos sin lectura guardada
  quedan con `COMENTARIO: no disponible` (la lectura se conserva en `trabajo\reads`, así que
  volver a activar el switch la recupera en la siguiente corrida).*
- **`idxfotos.xlsx`**: se **crea si no existe** y se va actualizando (no repite lo ya *Verificado ✓*).
  Campos: NombreFoto, Descripción de lo que anuncia, Dirección, Tipo de Anuncio, Latitud, Longitud,
  Referencias visuales o notas, Verificado, PIN. Si una foto excede el tope por PIN → fila con
  *Verificado en blanco* y nota ("excede el tope"); si **no tiene GPS** → fila con
  **`Verificado = No GPS`**, nota `sin GPS en EXIF` y PIN vacío (queda registrada y no se re-evalúa).
  **Fecha hora de subida**: si el archivo ya tiene una columna `FechaHoraSubida` (o `FechaCarga`),
  se rellena con `AAAA-MM-DD HH:MM` en cada foto nueva; si no, se crea a partir de la columna 10.
  **Nunca toca otras columnas** (p. ej. `FechaHoraFoto`) ni inventa valores en filas antiguas.
- **Columna `Marca` (la última)**: la marca que encontró el sistema para esa foto — la misma regla
  que `PROVEEDOR` del `info.txt` pero **sin el ` *`** (para poder filtrarla en Excel). Se agrega
  **al final** (nunca pisa columnas existentes), se rellena en **cada corrida** y en masa con
  **`Reescribir info.txt y Marca`**; las filas sin lectura guardada quedan vacías.

## Parámetros (en la página)

| Parámetro | Qué es |
|---|---|
| Fuente | **Web/Drive** (URL de carpeta o el archivo `GooDrPics.txt`), **Local** (ruta), **ZIP** o **carpeta** (subida) |
| Ruta de Google Drive Pics | URL de la carpeta de Drive o archivo `GooDrPics.txt` (modo Web) |
| Ruta local de fotos | carpeta con las fotos (modo Local) |
| Ruta de Salida | dónde se construye `<AAMMPQ>\auditoria\...` |
| Ruta de GoogleMapsPines | `.txt` con la URL del mapa, `.kml` exportado o `.xlsx` (tipo depurado) |
| Ruta de KML | `RutaKML.kml` (respaldo de datos por PIN) |
| Ruta de idxfotos.xlsx | índice (se crea si no existe) |
| N Fotos | máximo de **candidatas** a leer (foto con GPS dentro del radio de un PIN) |
| Avanzado | radio de match (250 m), tope por PIN (10), pausa de descarga (1 s), **descargas máximas (300)**, **switch COMENTARIO** |
| **Motor IA** | **OpenCode (tu suscripción) → Ollama local → HuggingFace → DeepSeek → OpenRouter → Gemini** — elige proveedor o "auto (cadena)" |

## Motor IA (switch)

La lectura de cada foto pasa por `ia/switch.py`, que baja por la cadena hasta que un proveedor responde:

| # | Proveedor | Origen | Requiere | Medido |
|---|---|---|---|---|
| 1 | **`opencode`** | nube (**tu suscripción**) | key de `opencode auth login` — se lee sola de `~/.local/share/opencode/auth.json` | ✅ **3.2 s/foto · ~USD 0.00028** (≈54,000 fotos/mes con tu límite de $15) |
| 2 | `ollama` | **local** (sin costo, offline) | Ollama + un modelo con `vision` | ~456 s/foto (CPU) |
| 3 | `huggingface` | nube | ~~`HF_TOKEN`~~ **DESACTIVADO** (créditos agotados) | ❌ |
| 4 | `deepseek` | nube (5M tokens gratis al registrarte) | `DEEPSEEK_API_KEY` en `.env` | ⚠️ `402` sin saldo |
| 5 | `openrouter` | nube | ~~`OPENROUTER_API_KEY`~~ **DESACTIVADO** (key daba `401`) | ❌ |
| 6 | `gemini` | nube | `GEMINI_API_KEY` en `.env` | sin key |

**Modelo de OpenCode**: `deepseek-v4-flash-vision-exp` — el **único con visión** de sus 86 modelos.

Circuito breaker: 3 fallos seguidos → 5 min de cooldown; el motivo se anota en el log de la corrida.
`GET /api/ia/modelos` lista los disponibles (los locales salen marcados **`(local)`**).

> **AutoClaw/AutoGLM se eliminó** de la cadena (2026-10-01, ADR-038) y **OpenCode entró primero**
> (2026-10-02, ADR-041); HuggingFace y OpenRouter quedaron **desactivados** en `.env` (sus líneas
> siguen ahí, comentadas).

## Modo Local vs Modo Web/Drive (medido)

| | **Local (ruta)** | **Web (URL de Drive)** |
|---|---|---|
| Coste | **ninguno** | baja cada foto para poder leer su GPS |
| 10 fotos | **segundos** | ~4 min de listado (3.653 archivos) + descargas |
| "N fotos" | = N fotos analizadas | = N **candidatas**; puede bajar muchas más |
| Tope | no aplica | **Descargas máximas** (300 por defecto) en *Opciones avanzadas* |

> Con **Google Drive para Windows** (Drive File Stream) usa **Modo Local** apuntando a la carpeta
> sincronizada (Explorador → Ctrl+Shift+C). Cero descargas, GPS al instante.

## Ver la info de las fuentes sin correr

El botón **`Ver info de las fuentes`** (junto a *Iniciar corrida*) despliega un panel:

```
RUTA      C:\Users\rojo-\Downloads\cteCVLO1\Recorrido
AVANCE    12% · 210 de 1696 fotos

FUENTES
  FOTOS    1696 en la ruta · 1273 con GPS · 0 sin GPS
  PINES    286 con coordenadas (cruzables)
  KML      300 placemarks · 14 sin LATITUD · 12 con CARA
           capas: COMPETENCIA 14 · COPPEL PARABUSES MTY (1) 12 · DIDI SEPTIEMBRE (1) 274
           aporta: UBICACIÓN 286 · MEDIO 287 · COMENTARIOS 222 · DIRECCIÓN 11 · CIUDAD 23
  ÍNDICE   294 filas · 210 verificadas · 7 No GPS

GPS       1273 con · 0 sin · 1251 fuera de radio        ← 2º tiempo, 10-40 s (lee el EXIF)
```

- **`AVANCE`** = verificadas ÷ total de fotos de la ruta.
- **`FUENTES`** deja ver qué aporta cada origen: la *ruta* da foto+GPS, los *pines* los
  286 cruzables, el *KML* el inventario completo (300) con sus campos, el *índice* lo ya procesado.
- Los datos básicos salen **en ~0,5 s**; el desglose de GPS llega después y rellena su línea
  (`n/d (sin ruta local)` si estás en Modo Web, donde no hay EXIF que leer).
- **El panel se queda abierto** hasta que vuelves a pulsar el botón (lo cierras) **o cambias de
  ruta/pines/KML/índice/fuente** (se oculta solo: los datos quedan obsoletos).
- Si `GoogleMapsPines` es un `.txt`, la primera lectura descarga el KML de Google (~0,5 s).

## Reprocesar fotos incompletas

Botón **`Reprocesar incompletas`** (junto a *Ver info*):

1. Mira cuántas fotos **no tienen lectura** o la tienen en **formato antiguo** (sin `CAMPAÑA`
   separada) y te lo muestra antes de tocar nada.
2. **Crea respaldo** `idxfotos_backup_<fecha>.xlsx` y limpia solo la columna `Verificado` de
   **esas** filas.
3. Arranca sola la corrida con `reproceso=1`: se releen con el prompt actual y el `info.txt`
   queda completo (`FOTO`, `CAMPAÑA`, `COMENTARIO`, `PROVEEDOR`).

**No mueve ni borra ningún archivo**: la copia se queda en la salida (no se sobrescribe) y el
`trabajo\reads\*.json` se reemplaza solo al releer. Las filas **se actualizan en sitio**
(`idx_upsert` por nombre) → **nunca se duplican**.

> Solo se reprocesan las fotos que **tienen origen en la ruta activa**; las que no (p. ej. copias
> de otra carpeta) se reportan como *sin origen* y **no se tocan**.
> Necesita **Modo Local (ruta)**.

## Prioridad de la fuente — KML manda

El **KML** (`RutaKML.kml`) es la fuente del soporte: de ahí salen el `PIN`, la `LATITUD/LONGITUD`,
la `UBICACIÓN`, `MEDIO`, `FORMATO`, `ID` y el `GRUPO` del `info.txt`. Si el KML no trae el PIN,
se toma del **mapa de pines**; si la foto y el KML difieren en metros, **gana el KML**.

| Campo | Con `prioridad: kml` (defecto) | Con `prioridad: pines` (como siempre) |
|---|---|---|
| cruce foto↔PIN | foto → punto **KML**; PIN ausente → pines | foto → pines |
| `PIN` / coordenadas / dirección / `MEDIO` / `FORMATO` / `ID` / `GRUPO` | **KML** → pines | pines → KML |
| **`PROVEEDOR`** | **KML `MARCA`** (sin `*`) → foto validada **` *`** → regla por prefijo **` *`** | IA → pines → regla (sin `*`) |
| `FOTO` / `CAMPAÑA` / `COMENTARIO` | foto + IA | igual |
| **`idxfotos.xlsx`** | **sin cambios** (manda la foto) | igual |

- **`*`** = "este valor no viene del KML" (marca detectada por la IA o regla del PIN).
- **`marcas-conocidas.txt`** (una marca por línea, `#` = comentario): valida la marca que detecta
  la IA cuando el KML no la trae; la que no está en la lista se descarta y manda la regla.
  Sin archivo → sin validación. Se relee en cada corrida.
- **Config**: `prioridad: kml|pines` y `marcas: <ruta>` en `CVLOCFG.txt`; en la página, el select
  **`Prioridad de la fuente`** de *Opciones avanzadas* (manda por corrida y se siembra con la config).
- `COORDENADAS: lat,lon` del KML (capa COMPETENCIA) ya se parsea → **300 de 300 PINs cruzan**.

## Reescribir info.txt y Marca (sin IA)

Botón **`Reescribir info.txt y Marca`**: regenera **todos** los `info.txt` de la salida y rellena
la columna **`Marca`** del `idxfotos.xlsx` con las lecturas ya guardadas (`trabajo\reads`) y la
prioridad elegida. **No lee ninguna foto con IA, no copia ni borra nada** — sirve para aplicar un
cambio de prioridad (o rellenar la Marca de las filas viejas) al entregable existente.
`POST /api/reescribir-info` (lleva `idx`) · respuesta
`{"reescritas": N, "reads": N, "marcas": N, "prioridad": "kml"}`.

## Rutas precargadas — `CVLOCFG.txt`

Al abrir la página, si el switch **`☐ Cargar rutas de CVLOCFG.txt`** está activado (por defecto),
se leen las rutas de `CVLOCFG.txt` (en esta misma carpeta) y se rellenan los 5 campos **y el modo
pasa a `Local (ruta)`**:

```
fotos : C:\Users\rojo-\Downloads\cteCVLO1\Recorrido
salida: C:\Users\rojo-\Downloads\cteCVLO1
Pines : C:\Users\rojo-\Downloads\cteCVLO1\GooMapsPines.txt
KML   : C:\Users\rojo-\Downloads\cteCVLO1\RutaKML.kml
idx   : C:\Users\rojo-\Downloads\cteCVLO1\idxfotos.xlsx
prioridad: kml
# marcas: C:\ruta\marcas-conocidas.txt
```

- Formato `clave: valor` (mayúsculas indiferentes), `#` = comentario. Se parte **solo por el
  primer `:`** → las rutas `C:\...` quedan intactas.
- Claves: `fotos · salida · pines · kml · idx · prioridad · marcas`.
- **Switch apagado** → no se lee nada (se recuerda en el navegador).
- Sin archivo → la página funciona igual (silencioso).
- La ruta del archivo se puede cambiar con la env `CVLO_CFG`.
- **`CVLOCFG.txt` está en `.gitignore`** (rutas propias de cada equipo); plantilla en
  `CVLOCFG.example.txt`.

**Para usar otro archivo de configuración**: escribe su ruta en **`Ruta de entrada del CFG
(CVLOCFG.txt)`** y pulsa **`Usar esta ruta`** (o Enter). Se recuerda en el navegador y también la
usan la corrida y el botón de reescritura (`GET /api/config?ruta=…`, `cfg_ruta` en el formulario).

- El checkbox **`Tomar rutas del CVLOCFG.txt de la ruta de abajo`** decide si ese archivo manda:
  **encendido** (defecto) → se precarga al abrir **y se envía con la corrida**; **apagado** →
  `cfg_ruta` se manda vacío y el servidor usa la env `CVLO_CFG` o el `CVLOCFG.txt` de la carpeta.
- El botón **rellena las 5 rutas + la prioridad + el modo `Local (ruta)`** con lo que diga ese
  archivo — y **funciona aunque el checkbox esté apagado** (además lo enciende: es una carga
  explícita).
- Archivo inexistente o sin rutas → **aviso en pantalla**, sin cambiar nada.
- Si el archivo **no trae `prioridad`**, el select vuelve a su defecto **`kml`** (no se queda con
  el valor de otra configuración). Lo que el archivo no menciona en las rutas **se queda como está**.

**Marcas conocidas dentro del propio CFG** (dos formas, gana la del archivo):

```
marcas: C:\ruta\marcas-conocidas.txt   ← ruta de un archivo (una marca por línea)
```
```
marcas:                                 ← sin valor: lista INLINE en el CFG
coppel
coca cola
farmacias del ahorro
                                        ← la lista termina en una línea en blanco
```
Si el CFG no trae `marcas` → se usa `marcas-conocidas.txt` del proyecto.

## Favicon

`static/favicon.svg` (mupi + check verde sobre `#161616`) + `favicon-32.png` como respaldo;
ambos enlazados en el `<head>`.

## Uso

1. Doble clic en **`INICIAR.bat`** → se abre `http://127.0.0.1:3015`.
2. Llena los parámetros (vienen precargados con las rutas de `cteCVLO1`).
3. Elige la fuente y pulsa **Iniciar corrida**.
4. Sigue el progreso: bajo la barra verás dos líneas
   `1696 en la ruta · 1202 con GPS · 0 sin GPS · 1201 fuera de radio · 286 PINs`
   `KML 300 PINs: COMPETENCIA 14 · COPPEL PARABUSES MTY (1) 12 · DIDI SEPTIEMBRE (1) 274 · con CARA 12`
   (la diferencia **286 vs 300** es intencionada: 14 PINs de COMPETENCIA no tienen `LATITUD` —
   ver `docs/DECISIONES-TECNOLOGICAS-OOH.md` §7);
   al terminar verás el resumen (leídas / copiadas / excedidas / PINs / grupos) y el log.

## Requisitos

- Windows con Python 3 (el iniciador resuelve el intérprete y las dependencias: flask, openpyxl, pillow, pillow-heif, gdown).
- **Una key de OpenCode** (ya la crea `opencode auth login`) — es el primer eslabón y el más barato.
- **Ollama con un modelo de visión** como respaldo local (ya tienes `qwen3.5`, `gemma4`, `qwen3.6`…).
- Descargas de Drive con **pausa ≥ 1 s** y reintentos (para evitar bloqueos de Google).

## Cómo quedó

- Fork de `\cvlo-auditor` (fuente de solo lectura, no modificada).
- Cambios: puerto 3015, motor IA desacoplado (`ia/switch.py`), cero claves hardcodeadas (`.env`).

## Notas

- **No se elimina ningún archivo**: los temporales quedan en `trabajo\` (cache de fotos y registros de lectura).
- Sin base de datos: todo vive en archivos locales (Excel, JSON, carpetas).
- No repite trabajo: excluye fotos ya cargadas en la salida, ya leídas (registro interno) y ya *Verificadas ✓*.
- Pruebas: `run_tests.bat` (modo MOCK, sin internet).
