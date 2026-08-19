# SuitCVLO — Computer Vision Look Once

> Automatización de captura y catalogación de publicidad exterior (OOH).
> De la moto al auto. Del ojo humano a visión por computadora.

## ¿Qué resuelve?

Hoy tomas fotos a anuncios panorámicos desde una moto, una por una, a mano.
SuitCVLO automatiza todo el pipeline:

```
🚗 Auto con cámaras → 📸 Captura automática → 🧠 Visión CV → 📊 Dataset vendible
```

## Versiones / Roadmap

Cada versión es funcional por sí sola. Puedes quedarte en la que te sirva
o avanzar cuando haya presupuesto.

### ✅ v0.1 — Detección básica *(hecho)*
- [x] YOLOv8n detecta objetos en fotos, video y webcam
- [x] OCR en billboards (EasyOCR, español/inglés)
- [x] Clasificación básica de panorámicos (360° / valla)
- [x] EXIF: extrae GPS, fecha, cámara
- [x] Geocodificación reversa (Nominatim OSM, gratis)
- [x] SQLite local (siempre escribe)
- [x] Supabase cloud (sync batch opcional)
- [x] FastAPI + Streamlit dashboard
- [x] Export PDF de reportes

**Comandos:**
```bash
python detect.py --source photo --input foto.jpg --save
python detect.py --source webcam
python -m api.main                     # API en :3011
streamlit run dashboard/app.py         # Dashboard
```

---

### ✅ v0.2 — Pipeline Billboard *(hecho)*
- [x] Perspective correction: endereza anuncios capturados en ángulo
- [x] Street noise filter: descarta autos, postes, árboles, peatones
- [x] Detección de formato OOH: espectacular / mural / valla / monoposte
- [x] Extracción de marca (50+ marcas con keywords)
- [x] Extracción de campaña (promo, lanzamiento, seasonal, etc.)
- [x] Modo batch: procesa carpeta entera de fotos
- [x] Contour fallback: detecta anuncios aunque YOLO no los reconozca
- [x] NMS dedup: elimina detecciones duplicadas

```bash
python pipeline.py --input ./ruta_fotos/ --draw --json
```

---

### 📅 v0.3 — Captura desde el auto *(futuro)*
- [ ] Control Canon R50 vía gPhoto2 (obturador electrónico)
- [ ] GPS logger NMEA (USB o Bluetooth)
- [ ] Sincronización 2-3 cámaras
- [ ] Modo ruta: captura automática cada N metros/segundos
- [ ] Taggeo de cada foto con GPS + timestamp preciso

```bash
python capture.py --route --interval 5s --output ./capturas/
```

---

### ✅ v0.4 — Dataset Export *(hecho)*
- [x] Export CSV: marca, campaña, formato, lat, lng, fecha, hora
- [x] Export GeoJSON: mapa interactivo de anuncios
- [x] Deduplicación: mismo anuncio en múltiples fotos → 1 registro (catalog)
- [x] Catálogo de anuncios únicos con metadata agregada
- [x] Reporte PDF resumen de toda la carpeta

```bash
# Desde carpeta de fotos:
python pipeline.py --input ./ruta_fotos/ --export both --catalog --report

# Desde un .zip:
python pipeline.py --zip ./fotos.zip --export both --catalog --report --draw

# Archivos generados en ./output/:
#   dataset_ooh.csv           ← Dataset completo para vender
#   mapa_anuncios.geojson     ← Mapa interactivo
#   catalogo_anuncios.csv     ← Anuncios únicos (deduplicados)
#   reporte_ooh.pdf           ← Reporte imprimible
#   pipeline_results.json     ← Raw data
#   *_billboard_*.jpg         ← Anuncios corregidos (si --draw)
```

---

### 📅 v0.5 — Automatización completa *(futuro)*
- [ ] Pipeline unificado: captura → detecta → clasifica → exporta
- [ ] Procesamiento nocturno batch
- [ ] Dashboard con mapa de anuncios
- [ ] API para consultar dataset
- [ ] Múltiples clientes/usuarios en el dataset

```bash
python suitcvlo.py --mode full --route hoy --output ./dataset/
```

---

### 🏋️ v0.6 — Entrenamiento YOLO personalizado *(pendiente)*

**Problema**: YOLOv8n preentrenado en COCO no reconoce billboards. El sistema lo compensa con heurísticas + contornos, pero con falsos positivos y detecciones perdidas.

**Solución**: Auto-etiquetar un dataset desde las propias detecciones del sistema + exportar en formato YOLO → entrenar un modelo custom que reconozca anuncios directo.

- [ ] Botón "Exportar dataset YOLO" en frontend (extrae fotos + bounding boxes + clases de SQLite)
- [ ] Estructura `dataset_yolo/` con `images/{train,val}/` y `labels/{train,val}/`
- [ ] Notebook Colab pre-escrito (entrenar con GPU gratis)
- [ ] Script local `train_yolo.py` (entrenar sin Colab, CPU/GPU local)
- [ ] Integración: tras entrenar, reemplazar `yolov8n.pt` por `best.pt`
- [ ] Evaluación: comparar precisión antes/después del fine-tune

**Dataset YOLO**:
```
dataset_yolo/
├── images/
│   ├── train/          ← 80% de las fotos con anuncios (de tus subidas)
│   └── val/            ← 20% aparte para validar
├── labels/
│   ├── train/          ← .txt por foto, uno por billboard: "0 x_center y_center w h"
│   └── val/
├── dataset.yaml        ← nc: 1, names: ['billboard']
└── README.md
```

```bash
# Exportar dataset desde las detecciones existentes
python tools/export_yolo.py --output ./dataset_yolo/

# Entrenar (GPU recomienda Colab, CPU local funciona lento)
python tools/train_yolo.py --data ./dataset_yolo/dataset.yaml --epochs 100

# Usar el modelo entrenado
# .env: YOLO_MODEL=runs/detect/train/weights/best.pt
```

**Dependencias extra**: `ultralytics` (ya instalado), Google Colab (opcional)

---

## Arquitectura

```
┌─────────────────────────────────────────────────────┐
│                   capture/                           │
│  [Canon R50] ─→ gPhoto2 ─→ foto + GPS + timestamp   │
│  [GPS Logger] ─→ NMEA parser                         │
└──────────────────────┬──────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────┐
│                   pipeline/                          │
│  YOLO → perspective correction → street filter       │
│  → brand OCR → campaign text → format classifier     │
└──────────────────────┬──────────────────────────────┘
                       ↓
┌──────────────┬───────────────────┬──────────────────┐
│   db/local.py │   api/ (FastAPI)  │  export/ (CSV)   │
│   (SQLite)    │   :3011           │  (GeoJSON)       │
└──────────────┴───────────────────┴──────────────────┘
```

## Stack técnico

| Capa | Tecnología |
|------|-----------|
| Lenguaje | Python 3.12+ |
| Visión | Ultralytics YOLOv8n, OpenCV |
| OCR | EasyOCR (es/en) |
| Geo | gPhoto2 (cámara), pynmea2 (GPS), Nominatim (geocode) |
| DB | SQLite (local), Supabase (cloud opcional) |
| API | FastAPI (puerto 3011) |
| Dashboard | Streamlit (puerto 8501) |
| Export | CSV, GeoJSON, PDF (ReportLab) |

## Cómo empezar (v0.4)

```bash
# 1. Activar entorno
cd SuitCVLO
source .venv/bin/activate

# 2. Pipeline completo: carpeta de fotos → dataset vendible
python pipeline.py --input ./ruta_fotos/ --draw --json --export both --catalog --report --user cliente1

# O desde un .zip:
python pipeline.py --zip ./fotos.zip --export both --catalog --report

# 3. O una foto individual rápida
python detect.py --source photo --input ejemplo.jpg --save

# 4. Ver dashboard
streamlit run dashboard/app.py

# 5. Iniciar servidor web (API + Frontend)
python -m api.main
# Abre http://localhost:3011/ en el navegador
```

Luego abres **http://localhost:3011/** en el navegador y ves la interfaz web:

- **Arrastra una foto** (.jpg, .png, .webp) y la procesa al instante
- **Arrastra un .zip** y muestra barra de progreso mientras procesa todas las imágenes
- **Resultados**: tabla con marca, formato, campaña, confianza, texto OCR
- **Descargas**: botones para exportar CSV, GeoJSON y PDF

### API endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST /upload` | Subir foto individual (síncrono) |
| `POST /upload/zip` | Subir .zip (asíncrono → devuelve job_id) |
| `GET /upload/zip/status/{id}` | Estado del procesamiento batch |
| `GET /upload/zip/result/{id}` | Resultados del batch |
| `GET /detections` | Todas las detecciones en DB |
| `GET /reports/pdf` | Reporte PDF |
| `GET /health` | Health check |

### Output del pipeline (CLI)

```
output/
├── dataset_ooh.csv              ← Lo que vendes a agencias
├── mapa_anuncios.geojson        ← Mapa para Google Maps / Kepler.gl
├── catalogo_anuncios.csv        ← Anuncios únicos (sin repetir)
├── reporte_ooh.pdf              ← Reporte imprimible
├── pipeline_results.json        ← Datos crudos
├── *_extracted/                 ← Extraídos de .zip (se conservan)
├── *_billboard_0.jpg            ← Anuncio enderezado
└── *_annotated.jpg              ← Foto con detecciones
```

## Licencia

Uso propio. Posible venta de servicio/dataset a agencias OOH.
