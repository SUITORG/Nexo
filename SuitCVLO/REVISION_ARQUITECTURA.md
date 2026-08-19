# Revisión de Arquitectura — SuitCVLO

**Fecha**: 2026-07-16
**Proyecto**: `C:\Users\rojo-\Downloads\suitorg\SuitCVLO`
**Tipo**: Análisis de arquitectura, procesos y seguridad (solo lectura)
**Stack**: Python 3.12+ / FastAPI / YOLOv8 / EasyOCR / SQLite + Supabase / Vanilla JS

---

## 1. ESTRUCTURA ACTUAL

```
SuitCVLO/
├── api/                  # FastAPI backend (port 3011)
│   ├── main.py           # App entry, CORS, static serving
│   └── routes/           # upload, detections, reports
├── dashboard/            # Streamlit (port 8501)
├── db/                   # SQLite (local) + Supabase (cloud) + SyncEngine
├── detector/             # YOLO + OCR + Panoramic classifier
├── export/               # CSV, GeoJSON, PDF, Catalog
├── geo/                  # EXIF + reverse geocoding (Nominatim)
├── pipeline/             # Billboard extraction, brands, campaigns, formats
├── frontend/             # Vanilla JS SPA (1 HTML, 1 JS, 1 CSS)
├── data/                 # SQLite DB file
├── migrations/           # Supabase PostgreSQL schema
├── output/               # Pipeline outputs
├── uploads/              # Temp upload storage
├── config.py             # Central config via python-dotenv
├── detect.py             # CLI detection
├── pipeline.py           # CLI full pipeline
└── yolov8n.pt            # Model weights
```

**33 archivos Python, 1 JS, 1 HTML, 1 CSS. ~2,079 líneas totales.**

---

## 2. HALLAZGOS CRÍTICOS

### CRÍTICO — Ejecución arbitraria de código
- **`dashboard/app.py:20`** — Usa `eval()` para parsear JSON del campo `detected_objects`
- **Riesgo**: Si la DB se tamaña o un upload malicioso modifica el JSON, ejecuta Python arbitrario
- **Fix**: Reemplazar `eval(x)` por `json.loads(x)`

### ALTO — Seguridad general
| Problema | Ubicación | Impacto |
|----------|-----------|---------|
| CORS abierto `*` | `api/main.py:11` | Cualquier origen puede hacer requests |
| Sin autenticación | Todos los endpoints | Acceso sin login a toda la API |
| Sin límite de upload | `api/routes/upload.py:36-38` | DoS por archivos gigantes |
| Sin headers de seguridad | `api/main.py` | No CSP, no HSTS, no X-Frame-Options |
| Sin rate limiting | Todos los endpoints | Vulnerable a abuso |
| Bind `0.0.0.0` | `api/main.py:47` | Expuesto a toda la red local |

### MEDIO — XSS
- **`frontend/app.js:174`** — `r.image` se inyecta vía `innerHTML` sin `escapeHtml()` (nombre de archivo del usuario)
- **`frontend/app.js:180-187`** — `bb.brand`, `bb.campaign_detail` sin escape (valen de OCR)
- `escapeHtml()` existe (línea 263) pero solo se aplica a `bb.ocr_text`

---

## 3. PROBLEMAS DE ARQUITECTURA

### 3.1 Duplicación significativa
| Patrón | Dónde | Cuántos |
|--------|-------|---------|
| Construcción de diccionario de billboard | `upload.py:164-178`, `pipeline.py:147-173`, `detect.py:112-126`, `upload.py:62-76` | **4 copias** |
| Instanciación de detectores (YOLO+OCR+Panoramic) | `upload.py:22`, `detect.py:25`, `pipeline.py:61-65` | **3 copias** |
| Loop de procesamiento de billboards | `upload.py:129-162` vs `pipeline.py:69-173` | **2 copias** |
| Generación PDF | `reports.py:13-32` vs `export/report.py:8-97` | **2 implementaciones** |
| Esquema DB `detections` | `db/local.py:14-33` vs `migrations/001_init.sql` | **Sin single source of truth** |

### 3.2 Lógica de negocio en rutas API
- `api/routes/upload.py:42-81` — El handler de upload orquesta directamente detección, OCR, clasificación, geocoding y guardado en DB
- No hay capa de servicio intermedia
- El ZIP processing en `upload.py:113-183` es casi idéntico al CLI `pipeline.py`

### 3.3 Singletons a nivel de módulo
- `upload.py:22-27`, `detections.py:6-7` — Objetos pesados (YOLODetector, OCRReader, DB) se instancian al importar
- Dificulta testing y acoplamiento innecesario

### 3.4 Keys duplicadas en diccionario
- `pipeline/brand.py` — `"kfc"` definida dos veces (líneas 6 y 23), la segunda sobreescribe silenciosamente
- `"liverpool"` similarly sobreescribe (líneas 58 y 71)

---

## 4. LO QUE ESTÁ BIEN HECHO

- **Arquitectura modular limpia** — Separación clara: detector/, pipeline/, geo/, db/, export/
- **DB híbrida inteligente** — SQLite local siempre escribe, Supabase es sync batch opcional
- **Detección dual** — YOLO primario + contour fallback + NMS para no perder billboards
- **Config centralizada** — `config.py` con python-dotenv, 7 variables bien documentadas
- **Archivos pequeños** — Todos <250 líneas, excelente disciplina de tamaño
- **SQL parametrizado** — Previene inyección SQL correctamente
- **Sin secrets hardcodeados** — `.env` limpio, patrón bien manejado
- **Función escapeHtml** existe — Solo falta aplicarla consistentemente
- **Sin deuda técnica documentada** — No hay TODOs/FIXMEs acumulados

---

## 5. RECOMENDACIONES PRIORIZADAS

### Prioridad 1 — Seguridad (debe hacerse antes de producción)

| # | Acción | Archivos | Esfuerzo |
|---|--------|----------|----------|
| 1.1 | Reemplazar `eval()` por `json.loads()` | `dashboard/app.py:20` | 5 min |
| 1.2 | Agregar middleware de autenticación (API key o JWT) | `api/main.py` | 2-4h |
| 1.3 | Configurar CORS por origins (no `*`) | `api/main.py:11` | 15 min |
| 1.4 | Agregar límite de upload (`MAX_UPLOAD_SIZE`) | `api/routes/upload.py` | 30 min |
| 1.5 | Agregar security headers (CSP, HSTS, X-Frame-Options) | `api/main.py` | 1h |
| 1.6 | Agregar rate limiting | `api/main.py` | 1h |

### Prioridad 2 — XSS (antes de exponer a usuarios)

| # | Acción | Archivos | Esfuerzo |
|---|--------|----------|----------|
| 2.1 | Aplicar `escapeHtml()` a `r.image` | `frontend/app.js:174` | 5 min |
| 2.2 | Aplicar `escapeHtml()` a `bb.brand` | `frontend/app.js:180` | 5 min |
| 2.3 | Aplicar `escapeHtml()` a `bb.campaign_detail` | `frontend/app.js:187` | 5 min |

### Prioridad 3 — Eliminar duplicación

| # | Acción | Archivos | Esfuerzo |
|---|--------|----------|----------|
| 3.1 | Crear `pipeline/models.py` con dataclass `BillboardRecord` | Nuevo archivo | 1h |
| 3.2 | Crear `detector/factory.py` con función `create_detector_pipeline()` | Nuevo archivo | 30 min |
| 3.3 | Unificar lógica de procesamiento ZIP (API reutiliza CLI) | `upload.py` + `pipeline.py` | 2h |
| 3.4 | Eliminar PDF duplicado en `reports.py` (usar `export/report.py`) | `api/routes/reports.py` | 30 min |
| 3.5 | Crear single source of truth para schema DB | `db/schema.py` o migración unificada | 1h |
| 3.6 | Corregir keys duplicadas en `brand.py` | `pipeline/brand.py` | 5 min |

### Prioridad 4 — Mejoras arquitectónicas

| # | Acción | Archivos | Esfuerzo |
|---|--------|----------|----------|
| 4.1 | Crear capa de servicio (`services/detection_service.py`) | Nuevo archivo | 2-3h |
| 4.2 | Mover singletons a factory pattern o dependency injection | `upload.py`, `detections.py` | 2h |
| 4.3 | Agregar validación de tipo de contenido en uploads | `upload.py` | 1h |
| 4.4 | Agregar tests unitarios (pytest) | Nuevo directorio `tests/` | 4-6h |

---

## 6. VERIFICACIÓN

Para validar los cambios:
1. Correr `python api/main.py` y verificar que arranca sin errores
2. Abrir `http://localhost:3011` — verificar frontend carga
3. Subir una foto — verificar que funciona el flujo completo
4. Subir un ZIP — verificar procesamiento async
5. Verificar que `eval()` ya no existe: `grep -r "eval(" dashboard/`
6. Verificar que `escapeHtml()` se aplica en todos los `innerHTML`: `grep -n "innerHTML" frontend/app.js`
7. Verificar que CORS no es `*` en producción: `grep "allow_origins" api/main.py`

---

## 7. RESUMEN EJECUTIVO

**SuitCVLO es un proyecto con buena base arquitectónica y código limpio**, pero tiene vulnerabilidades de seguridad que impiden producción y duplicación de código que dificulta mantenimiento.

**Lo más urgente**: El `eval()` en dashboard es una vulnerabilidad crítica. Los endpoints sin autenticación y sin límites de upload son bloqueantes para cualquier despliegue público.

**Fortalezas**: Arquitectura modular, DB híbrida bien pensada, detección dual inteligente, archivos pequeños, sin deuda técnica documentada.

**Próximo paso sugerido**: Fix inmediato del `eval()` (5 min), luego planificar la capa de autenticación y unificación de código duplicado.
