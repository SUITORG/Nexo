# Registro de errores — SuitCVLO

Este archivo documenta errores conocidos, su causa raíz y la solución aplicada.
Propósito: evitar que el mismo error se repita.

---

## Fecha: 2026-07-16

### ERR-001: `results.reduce is not a function`

**Síntoma**: Al subir un archivo, la página muestra un error en consola JS: `results.reduce is not a function`.

**Causa raíz**: `renderResults()` en `frontend/app.js:140` asume que `results` siempre es un array. Si el backend devuelve `null`, un objeto, o una respuesta inesperada, `Array.reduce()` truena.

**Solución**:
- Agregar `if (!Array.isArray(results))` al inicio de `renderResults()`.
- Agregar función `normalizeResults()` que transforme ambos formatos (v0.1 con `detected_objects` y v0.2 con `billboards`) a un formato único.

**Archivos afectados**: `frontend/app.js`

---

### ERR-002: HTTP 500 en upload de foto individual

**Síntoma**: `POST /upload` devuelve HTTP 500 "Internal Server Error" sin mensaje.

**Causa raíz**: El endpoint `upload_file()` en `api/routes/upload.py:30` no tiene try/except. Cualquier error (YOLO, EXIF, geocode) revienta toda la request y FastAPI devuelve 500 genérico.

**Solución**:
- Envolver el cuerpo de `upload_file()` en try/except.
- Devolver `{"error": mensaje}` con HTTP 400 para errores controlados.

**Archivos afectados**: `api/routes/upload.py`

---

### ERR-003: No se puede subir carpeta ni múltiples fotos

**Síntoma**: El input file solo acepta un archivo a la vez. Arrastrar una carpeta no hace nada.

**Causa raíz**: `frontend/index.html:34` tiene `<input type="file">` sin atributo `multiple`. No hay un input separado con `webkitdirectory` para carpetas. El drop handler solo procesa `files[0]`.

**Solución**:
- Agregar `multiple` al input principal.
- Agregar input oculto con `webkitdirectory` para selección de carpeta.
- Agregar botón "Seleccionar carpeta" en la UI.
- Cambiar drop handler para iterar sobre todos los archivos soltados.

**Archivos afectados**: `frontend/index.html`, `frontend/app.js`

---

### ERR-004: Formato incompatible entre POST /upload y POST /upload/zip

**Síntoma**: Los resultados de `POST /upload` no se muestran correctamente (faltan marcas, formatos, etc.), mientras que el ZIP funciona bien.

**Causa raíz**: `POST /upload` usa el detector v0.1 y devuelve `detected_objects[]` (lista genérica de objetos YOLO). `POST /upload/zip` usa el pipeline v0.2 y devuelve `billboards[]` (estructura con marca, formato, campaña). El frontend solo entiende `billboards[]`.

**Solución**:
- Crear `normalizeResults()` que adapte ambos formatos a uno común (`billboards[]`).

**Archivos afectados**: `frontend/app.js`

---

### ERR-005: Error en ZIP no muestra mensaje real

**Síntoma**: Al subir un ZIP que falla, solo se ve "Error desconocido" sin detalle.

**Causa raíz**: `pollJob()` en `app.js:119` usa `job.error || 'Error desconocido'`, pero si el servidor devuelve un error HTTP (no JSON), `job` no tiene campo `error`.

**Solución**:
- En `pollJob()` y `fetchResult()`, capturar el body del error HTTP antes de parsear JSON.

**Archivos afectados**: `frontend/app.js`

---

### ERR-006: Batch ZIP falla completamente si una imagen da error

**Síntoma**: Si una imagen dentro del ZIP causa error, todo el batch se aborta.

**Causa raíz**: `_process_zip_background()` itera sobre imágenes sin try/except interno. Una excepción en una imagen sale del loop y marca todo como error.

**Solución**:
- Envolver el procesamiento de cada imagen en try/except. Si falla, registrar el error en `all_results` con un flag de fallo y continuar con la siguiente.

**Archivos afectados**: `api/routes/upload.py`

---

## Fecha: 2026-07-17

### ERR-007: `invalid literal for int() with base 10: 'Horizontal (normal)'`

**Síntoma**: `POST /upload` devuelve error 400 con `detail: "invalid literal for int() with base 10: 'Horizontal (normal)'"`.

**Causa raíz**: `geo/metadata.py:45` llama `int(str(tags["Image Orientation"]))`. La librería `exifread` devuelve el string descriptivo `'Horizontal (normal)'` en vez del valor numérico `1`. `int()` falla.

**Solución**:
- Agregar lookup table `_ORIENT_MAP` con los 8 strings EXIF mapeados a su valor numérico.
- Usar `_ORIENT_MAP.get(raw, raw)` en vez de `int()` directo.
- Agregar try/except en `image_width` e `image_height` por precaución.

**Archivos afectados**: `geo/metadata.py`

---

### ERR-008: Pipeline no detecta anuncios en fotos reales

**Síntoma**: Fotos con espectaculares visibles devuelven `billboards: []`. El pipeline no encuentra nada.

**Causa raíz**: Los umbrales en `BillboardExtractor` son muy restrictivos para fotos de calle:
- `MIN_AREA_RATIO = 0.02` (2% del frame) — demasiado alto para anuncios lejanos
- `HORIZON_RATIO = 0.35` — solo busca en 65% superior del frame
- `TEXTURE_STD_THRESHOLD = 30` — descarta superficies de bajo contraste
- `BILLBOARD_ASPECT_MIN = 1.3` — descarta anuncios casi cuadrados

**Solución**:
- `MIN_AREA_RATIO`: 0.02 → 0.008
- `HORIZON_RATIO`: 0.35 → 0.15
- `TEXTURE_STD_THRESHOLD`: 30 → 15
- `MIN_BILLBOARD_CONFIDENCE`: 0.2 → 0.15
- `BILLBOARD_ASPECT_MIN`: 1.3 → 1.0
- `BILLBOARD_ASPECT_MAX`: 6.0 → 8.0

**Archivos afectados**: `pipeline/extractor.py`

---

### ERR-009: Reportes sin fecha, dirección ni categoría

**Síntoma**: Tabla de resultados y PDF muestran solo imagen, marca, formato y campaña. Falta fecha, dirección y categoría.

**Causa raíz**: `frontend/index.html`, `frontend/app.js` y `export/report.py` no incluyen las columnas `captured_at`, `address` y `campaign_type` a pesar de que el backend las devuelve.

**Solución**:
- Agregar columnas Fecha, Dirección y Categoría al `<thead>` del HTML.
- Agregar celdas correspondientes en `renderResults()`.
- Agregar campos al CSV descargable desde el frontend.
- Agregar fecha y categoría al detalle por imagen en el PDF.

**Archivos afectados**: `frontend/index.html`, `frontend/app.js`, `export/report.py`

---

### ERR-010: CR3/RAW no devuelve metadatos EXIF (cámara, fecha, GPS) — RESUELTO

**Síntoma**: `extract_exif()` devuelve todos los campos `None` para archivos CR3. JPG del mismo equipo funciona correctamente.

**Causa raíz**: `exifread` no reconoce el formato CR3 (Canon Raw v3). El GPS de Canon R50 se almacena en una caja `uuid` propietaria dentro del contenedor CR3, no en la cadena TIFF IFD estándar.

**Solución**:
1. `_raw_exif_fallback()` escanea cabeceras TIFF en el binario para extraer Make, Model, DateTime, Orientation, dimensions.
2. CR3 usa ISOBMFF (ISO Base Media File Format, como MP4). Los metadatos están en cajas `uuid` dentro de `moov`.
   - Canon UUID: `85c0b687-820f-11e0-8111-f4ce462b6a48`
   - Dentro de esa caja: `CMT1` (IFD0), `CMT2` (ExifIFD), `CMT3` (MakerNote), `CMT4` (GPS IFD en TIFF)
3. `_parse_cr3_gps()` parsea la estructura ISOBMFF → encuentra `CMT4` → extrae GPS del TIFF IFD interno.
4. No requiere exiftool ni internet. Funciona con datos sintéticos verificados (lat/lng correctos).

**Archivos afectados**: `geo/metadata.py` (+3 funciones: `_find_cmt4_box`, `_parse_gps_ifd_cmt4`, `_parse_cr3_gps`)

---

### ERR-011: RAW falla en silencio en lugar de mostrar error claro

**Síntoma**: Al subir un CR3/ARW corrupto o no soportado por `rawpy`, el pipeline devuelve error genérico `Cannot read: ...` sin indicar que el formato RAW no es compatible.

**Causa raíz**: `read_image()` en `pipeline/utils.py` intentaba `rawpy`, y al fallar caía a `cv2.imread` que también falla → devuelve `None` → `BillboardExtractor.extract()` lanza `ValueError("Cannot read: ...")`.

**Solución**:
- `read_image()` ahora retorna `None` inmediatamente si rawpy falla para RAW_ONLY_EXTS (`.cr3`, `.arw`), sin pasar a cv2.
- `upload.py` atrapa el ValueError y responde `"RAW no soportado o corrupto — exporta a JPG desde la cámara"`.
- Zip batch usa el mismo mensaje por imagen.
- Si rawpy tiene éxito, se guarda un JPEG sidecar (`{file}.converted.jpg`) para que el frontend pueda servir thumbnails sin reprocesar el RAW.

**Archivos afectados**: `pipeline/utils.py`, `api/routes/upload.py`

---

### ERR-012: Geocode sin rate limiting ni propagación de error

**Síntoma**: Al procesar múltiples imágenes con GPS, Nominatim puede rate-limit (HTTP 429) y el error se traga, devolviendo `address: null` indistinguible de "no había GPS".

**Causa raíz**: `reverse_geocode()` no tenía control de frecuencia entre llamadas, y al fallar retornaba `None` sin indicar el motivo.

**Solución**:
- Agregar `time.sleep()` si ha pasado menos de 1s desde la última llamada.
- Manejar HTTP 429 explícitamente → `address_error: "rate_limited"`.
- Manejar Timeout → `address_error: "timeout"`.
- ConnectionError → `address_error: "connection_error"`.
- Sin GPS → `address_error: "no_gps"`.
- Éxito → `address_error: None`.
- `reverse_geocode()` ahora siempre retorna dict (nunca `None`), simplificando los callers.
- Frontend muestra "Sin GPS" (gris) o "Error geo" (rojo con tooltip) cuando no hay dirección.

**Archivos afectados**: `geo/geocode.py`, `api/routes/upload.py`, `pipeline.py`, `detect.py`, `frontend/app.js`
