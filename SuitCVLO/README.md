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
# Todo en uno:
python pipeline.py --input ./ruta_fotos/ --export both --catalog --report

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

# 3. O una foto individual rápida
python detect.py --source photo --input ejemplo.jpg --save

# 4. Ver dashboard
streamlit run dashboard/app.py

# 5. Iniciar API (subir fotos por HTTP)
python -m api.main
```

### Output del pipeline

```
output/
├── dataset_ooh.csv              ← Lo que vendes a agencias
├── mapa_anuncios.geojson        ← Mapa para Google Maps / Kepler.gl
├── catalogo_anuncios.csv        ← Anuncios únicos (sin repetir)
├── reporte_ooh.pdf              ← Reporte imprimible
├── pipeline_results.json        ← Datos crudos
├── *_billboard_0.jpg            ← Anuncio enderezado
└── *_annotated.jpg              ← Foto con detecciones
```

## Licencia

Uso propio. Posible venta de servicio/dataset a agencias OOH.
