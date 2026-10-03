# Decisiones tecnológicas OOH — ¿YOLO o VLM?

> **Fecha**: 2026-10-03 · **Alcance**: `SuitCVLO-open` (lectura de fotos) y `SuitCVLO` (detección YOLO)
> **Por qué existe**: para no volver a discutir lo mismo dentro de 6 meses. Todos los números
> están **medidos** en esta máquina, no estimados.

---

## 1. Los números medidos

| Dato | Valor | Cómo se midió |
|---|---|---|
| Fotos por recorrido | **1.696** | carpeta `cteCVLO1\Recorrido` |
| Con GPS | 1.202 | EXIF de las fotos no excluidas |
| Sin GPS | 7 | ya marcadas `No GPS` en el índice |
| Fuera de radio (250 m) | 1.201 | distancia al PIN más cercano |
| **Candidatas a 250 m** | **34** (sube a **358** con radio 500 m) | histograma de distancias |
| PINs en el KML | 300 (286 cargados) | `RutaKML.kml` |
| **Lectura con OpenCode** | **3,2 s · USD 0,000277/foto** | `usage.prompt_tokens` real |
| Lectura con Ollama local | **456 s/foto · $0** | CPU Ryzen 7 7730U, sin GPU |
| Coste de 1.000 fotos (OpenCode) | **USD 0,28** | cálculo con el precio real de Go |

---

## 2. ¿Sirve esto para entrenar un YOLO?

**Directamente: no.** Un detector necesita **cajas** (`x_center y_center w h`). Este sistema produce
**etiquetas de texto**.

| Lo que sí produce | Para qué sirve |
|---|---|
| Foto + `TIPO SOPORTE` (parabús, mupi, panorámico…) | **clasificación** (`yolov8n-cls`) — miles de veces más barato de etiquetar que cajas |
| Foto + `ANUNCIO: SI/NO` | clasificar "hay anuncio" |
| Foto + `MARCA`, `CAMPAÑA`, `COMENTARIO`, `TEXTO VISIBLE` | el trabajo del VLM — **ningún YOLO lo hace** |
| Foto + PIN + GPS + distancia | oro: revisión humana y futuro dataset |

> `SuitCVLO` **ya tiene** YOLOv8n + EasyOCR + `tools/export_yolo.py` (v0.6 de su README).
> No se construye dos veces.

## 3. ¿Sería más rápido?

| | Detectar (¿dónde?) | Leer (¿qué dice?) |
|---|---|---|
| YOLOv8n CPU | ~0,1 s/foto (GPU ~0,02 s) | **no lo hace** |
| EasyOCR | — | 0,5–2 s |
| OpenCode (medido) | — | **3,2 s** |
| Ollama local (medido) | — | 456 s |

**Un YOLO es ~30× más rápido para detectar, pero no responde `COMENTARIO`/`MARCA`/`CAMPAÑA`.**
Velocidad sin la respuesta que se necesita no vale nada.

## 4. ¿Qué conviene ahora? (Pareto 20/80)

1. **Subir `Radio de match` a 450-500 m** → de **1 a 299-358 candidatas** con las fotos ya
   existentes. Cero coste, efecto inmediato. *(el 80% está aquí)*
2. **Recortar antes de leer**: pasar al VLM el recorte del anuncio en vez de la foto completa →
   texto pequeño mucho más legible **y menos tokens**. Un detector barato (contornos/`SuitCVLO`)
   sirve aquí para **enfocar**, no para sustituir.
3. **Dejar volar el dataset**: cada corrida deja foto + descripción + PIN. Hoy no se usa; en 6
   meses es el material para un fine-tuning.

## 5. ¿Cuándo SÍ conviene un modelo propio?

Solo si ocurre **una** de estas:
- volumen **≥ 100.000 fotos/mes** (hoy: coste de API ~USD 2,80/mes por 10.000)
- **video desde el auto** (v0.3 de `SuitCVLO`: 5-30 fps, la API no llega)
- **sin internet** (modo campo) o **privacidad total** (las fotos no salen de la máquina)

Ninguna se cumple hoy.

## 6. ¿Cómo lo piensa el 1%?

1. **No construyas un modelo que puedes alquilar.** La pregunta es "¿el API falla en calidad,
   coste o latencia?", no "¿puedo entrenarlo?". Hoy no falla: USD 0,000277 y 3,2 s.
2. **El cuello de botella son las etiquetas, no el modelo.** Etiquetar 3.000 cajas a mano
   = 30-200 horas; eso cuesta **más que la API durante años**.
3. **Define la métrica antes de entrenar** (% de fotos con PIN y soporte correctos). Solo se
   invierte cuando el camino del API no llega o el presupuesto se dispara.
4. **Compón pasos pequeños**: detectar/recortar (barato) → leer el recorte (preciso). Sustituir
   un modelo general por otro general es perder dinero.
5. **Flywheel**: cada foto auditada = ejemplo etiquetado. Registrar lo que la IA dijo + lo que un
   humano corrige = futuro dataset. Ya existe a medias (`idxfotos` + `trabajo/reads`).
6. **Elige la restricción primero** (latencia, coste, offline, privacidad); la tecnología se
   elige después.

**Quién lo hace**: ML engineer / applied scientist; en equipo pequeño, el fundador con
`ultralytics` + un dataset limpio. En 2026 casi nadie entrena detectors desde cero — se
**fine-tunea con LoRA un VLM pequeño** sobre las propias fotos.

## 7. HALLAZGO — 14 PINs de COMPETENCIA se descartan

| Dato | Valor |
|---|---|
| Placemarks en el KML | **300** (`DIDI SEPTIEMBRE 274` · `COMPETENCIA 14` · `COPPEL PARABUSES MTY 12`) |
| PINs que acepta `cargar_pines()` | **286** → **descarta 14** (`COM-11`, `COM-15`, `COM-16`, `COM-19`…) |
| Causa | la capa `COMPETENCIA` usa `COORDENADAS: "25.659763,-100.255566"` en vez de `LATITUD`/`LONGITUD` |
| ¿Se puede recuperar? | **Sí: 14/14 tienen coordenadas parseables** (~6 líneas en `motor._pines_desde_kml`) |
| Impacto | **ninguna foto puede cruzar con un PIN de competencia** (quedan "fuera de radio" o sin PIN) |
| Dato de contexto | esas 14 filas traen campos que el resto no: `SECCION`, `ESTADO`, `TIPO DE MEDIO`, `MARCA`, `DIRECCIÓN` con CP |
| Estado | **documentado, NO arreglado** (decisión 2026-10-03) → `GuiaTotal/PENDIENTES.md` |

## 8. Cuándo re-evaluar esta decisión

| Señal | Acción |
|---|---|
| > 100.000 fotos/mes, o coste API > USD 50/mes | valorar fine-tuning de un VLM (no un detector) |
| Se arranca el modo video (v0.3 `SuitCVLO`) | ahí sí: YOLO obligatorio para detección por frame |
| El % de lecturas correctas cae por debajo del umbral acordado | recorte + modelo, o fine-tuning |
| Sin conexión en campo | modelo local pequeño (Qwen2.5-VL-3B) o YOLO+OCR |

---

## Ver también

- `docs/VALIDACION.md` — evidencia de cada corrida (números de este documento)
- `docs/PROS_CONTRAS.md` — comparativa de proveedores del switch de IA
- `.suit/memory/decisions/ADR-037…041` — historia de la cadena de IA
- `../SuitCVLO/README.md` — roadmap v0.3 (video) y v0.6 (entrenamiento YOLO)
