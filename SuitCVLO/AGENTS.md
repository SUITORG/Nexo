# AGENTS.md — SuitCVLO v0.1

## Versiones

| Versión | Estado | Qué incluye |
|---------|--------|-------------|
| v0.1 | ✅ Hecho | Detección básica, OCR, SQLite, API, dashboard |
| v0.2 | ⏳ Pendiente | Pipeline billboard: perspective, brand, campaign, format |
| v0.3 | 📅 Futuro | Captura Canon R50 + GPS + multicámara |
| v0.4 | 📅 Futuro | Dataset export (CSV/GeoJSON) |
| v0.5 | 📅 Futuro | Automatización full route |

Ver `README.md` para roadmap detallado.

## Architecture (v0.1)
- **Backend**: Python 3.12+, FastAPI (puerto 3011), Streamlit dashboard
- **Detection**: YOLOv8n via Ultralytics + EasyOCR para billboards
- **Geo**: EXIF (exifread) + Nominatim OSM (gratis, sin API key)
- **DB**: Híbrida — SQLite (local, siempre) + Supabase (cloud, batch sync)
- **Frontend**: Streamlit dashboard (prototipo rápido)
- **CLI**: `detect.py` con 3 modos: webcam / photo / video

## Immutable Rules

### Detection
1. YOLO model configurable via `.env` (`YOLO_MODEL`), default `yolov8n.pt`
2. Billboard detection: bbox area > 30% del frame es candidato
3. Panoramic: aspect ratio >= 2:1 → `wide_panoramic`
4. OCR siempre en GPU=False (CPU mode)

### DB Hybrid
5. SQLite es almacenamiento primario (siempre escribe local)
6. Supabase es secundario (sync batch cuando hay internet)
7. No borrado físico — usar `synced=0/1` para pendientes
8. IDs autoincrementales locales, SERIAL en Supabase

### Geo
9. Geolocalización vía Nominatim OSM (gratis, sin API key)
10. Si no hay GPS en EXIF, address = None (no falla)

### API
11. FastAPI en puerto 3011
12. CORS abierto para desarrollo
13. Endpoints: `POST /upload`, `GET /detections`, `GET /reports/pdf`

### CLI
14. `--source webcam` usa cámara 0
15. `--save` guarda a SQLite local
16. `--show` guarda imagen anotada

## Comandos v0.1

```bash
source .venv/bin/activate

python detect.py --source webcam
python detect.py --source photo --input foto.jpg --save
python detect.py --source video --input video.mp4
python -m api.main
streamlit run dashboard/app.py
curl http://localhost:3011/reports/pdf?user_id=default --output report.pdf
```

## Puerto Registry
| Puerto | Servicio | Versión |
|--------|----------|---------|
| 3011   | FastAPI (SuitCVLO) | v0.1 |
| 8501   | Streamlit (dashboard) | v0.1 |

## Dependencias base
- `ultralytics` → YOLOv8n
- `opencv-python` → captura/display
- `easyocr` → OCR billboards
- `exifread` → metadatos EXIF
- `supabase` → cloud sync
- `fastapi` + `uvicorn` → API REST
- `streamlit` → dashboard
- `reportlab` → PDF export
