# Sesion 250717 231440

## Que se hizo

### 1. Nuevas columnas en frontend + exports
- **Fecha**, **Direccion**, **Categoria** agregadas a tabla, CSV y PDF
- Archivos: `frontend/index.html`, `frontend/app.js`, `export/report.py`

### 2. Columna Imagen mas util
- Nombre truncado a `8car..ext`
- Miniatura 64x48px via `/uploads/{filename}`
- Columna **Hora** agregada despues de Fecha
- Archivos: `frontend/app.js`, `frontend/index.html`, `api/main.py`

### 3. Deteccion de espectaculares mejorada
- Estrategia dual Canny (relajado 10,50 + normal 20,100)
- Umbrales mas permisivos (area min 0.8%, aspect 1.0-8.0, horizonte 15%)
- Filtro area > 60% descartado (falsos positivos de borde de foto)
- Archivo: `pipeline/extractor.py`

### 4. Correccion ERR-007 (EXIF orientation)
- Lookup table `_ORIENT_MAP` en `geo/metadata.py`
- try/except en parseo de width/height

### 5. Soporte de fotos raw
- Extensiones aceptadas: `.cr3` `.arw` `.dng` `.tiff` `.tif` `.bmp` `.heic` `.heif`
- Funcion `read_image()` en `pipeline/utils.py` que convierte raw a BGR via rawpy
- `cv2.imread` reemplazado por `read_image` en 3 archivos
- rawpy agregado a `requirements.txt`
- Frontend actualizado (accept, regex, mensajes)
- Archivos: `pipeline/utils.py`, `pipeline/extractor.py`, `detector/yolo.py`, `detect.py`, `frontend/app.js`, `frontend/index.html`, `requirements.txt`

### 6. ERRORES.md actualizado
- ERR-007: orientacion EXIF
- ERR-008: baja deteccion
- ERR-009: columnas faltantes

## Archivos modificados
| Archivo | Cambio |
|---|---|
| `frontend/index.html` | +Hora col, raw formats, accept attr, dropzone text |
| `frontend/app.js` | imageName, imageThumb, hora render, raw regex, CSV w/ hora |
| `api/main.py` | /uploads/{filename} endpoint |
| `api/routes/upload.py` | — |
| `pipeline/extractor.py` | read_image, area_ratio > 0.60 filter |
| `pipeline/utils.py` | IMAGE_EXTS + raw, read_image() |
| `detector/yolo.py` | read_image() |
| `detect.py` | read_image() |
| `export/report.py` | fecha, address, campaign_type |
| `geo/metadata.py` | _ORIENT_MAP |
| `ERRORES.md` | ERR-007/008/009 |
| `requirements.txt` | rawpy |

## Estado del server
- FastAPI en puerto 3011 corriendo
- Pipeline funcional (probado con slide_1_hamburguesas_metroplex.jpg)
- 2 billboards detectados con OCR, brand, formato

## Cambios recientes (julio 2026)

### Sesion 250718 — CR3 GPS + Columnas + Roadmap v0.6

#### A. CR3 GPS desde CMT4 (sin exiftool)
- `_parse_cr3_gps()` parsea estructura ISOBMFF del CR3
- Encuentra caja `uuid` Canon → `CMT4` → TIFF IFD → GPS lat/lng
- No requiere internet ni exiftool binario
- Testeado con datos sintéticos (lat/lng correctos)

#### B. Columna Archivo Original
- `original_filename` agregado a respuestas single/zip/error
- Columna "Archivo" en tabla (después de Imagen)
- Campo en CSV y PDF

#### C. Columna Coordenadas
- Columna "Coordenadas" después de Texto OCR
- Muestra `lat, lng` con 4 decimales
- Columnas `lat`, `lng` separadas en CSV

#### D. Roadmap v0.6 — Entrenamiento YOLO personalizado
- README.md actualizado con sección v0.6
- AGENTS.md actualizado (versiones, arquitectura, reglas)
- Pendiente: export dataset YOLO, notebook Colab, entrenar modelo billboard

## Pendiente
- Subir las 68 fotos reales a /upload para validacion masiva
- Configurar Supabase (URL + key en .env)
- Exportar dataset YOLO desde detecciones existentes
- Entrenar modelo billboard custom (Colab + local)
