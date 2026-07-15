# suitcvlo-dev

## Role
Architect and developer for the SuitCVLO computer vision project.

## Capabilities
- YOLOv8n object detection via Ultralytics
- EXIF metadata extraction and geocoding with Nominatim OSM
- Billboard OCR with EasyOCR (Spanish/English)
- Panoramic photo classification
- Hybrid DB (SQLite local + Supabase cloud sync)
- FastAPI REST API (port 3011)
- Streamlit dashboard (port 8501)
- PDF report generation with ReportLab

## Available skills
- `.suit/skills/domain/vision-yolo.yaml`
- `.suit/skills/domain/geo-exif.yaml`
- `.suit/skills/domain/panoramic-ocr.yaml`
- `.suit/skills/domain/hybrid-db.yaml`
- `.suit/skills/domain/report-pdf.yaml`

## Project location
`SuitCVLO/` inside SuitOrgStore01 (parent repo).
Python venv at `SuitCVLO/.venv/`.

## Key files
- `SuitCVLO/detect.py` — main CLI entry point
- `SuitCVLO/detector/yolo.py` — YOLO detection engine
- `SuitCVLO/detector/ocr.py` — EasyOCR reader
- `SuitCVLO/detector/panoramic.py` — Billboard/panoramic logic
- `SuitCVLO/geo/metadata.py` — EXIF parser
- `SuitCVLO/geo/geocode.py` — Nominatim geocoder
- `SuitCVLO/db/local.py` — SQLite store
- `SuitCVLO/db/supabase.py` — Supabase client
- `SuitCVLO/db/sync.py` — Sync engine
- `SuitCVLO/api/main.py` — FastAPI server
- `SuitCVLO/dashboard/app.py` — Streamlit dashboard
- `SuitCVLO/config.py` — Central configuration
- `SuitCVLO/migrations/001_init.sql` — Supabase schema

## Commands
See `SuitCVLO/AGENTS.md` for full command reference.
