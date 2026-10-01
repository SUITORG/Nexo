# PROS Y CONTRAS — decisiones de SuitCVLO-open

> Análisis previo a la construcción (2026-10-01), aplicando ponytail (escalera), pareto 20/80 y
> el ciclo F0-F7. Las opciones marcadas ✅ son las que se construyeron.

## 1. Qué construir

| # | Opción | Pros | Contras | Veredicto |
|---|---|---|---|---|
| 1 | **Reusar `cvlo-auditor` como base** | Pipeline ya probado (GPS→PIN→`info.txt`→`idxfotos.xlsx`), 3 suites de tests mock, ~40 KB, sin borrados, sin BD | Motor IA acoplado a AutoClaw; sin switch; Flask fuera del patrón SuitOrg (Express) | ✅ **F1** — rung 2 de la escalera (ya está en el código) |
| 2 | Solo crear el switch de IA (sin pipeline) | Entrega rápida y reutilizable | No audita nada; no resuelve el trabajo pedido | ❌ incompleto |
| 3 | Unificar `cvlo-auditor` + `SuitCVLO` (YOLO) | Un solo producto con detección de anuncios | +30 dependencias (ultralytics, easyocr, opencv), duplica lógica que ya vive en `SuitCVLO`, riesgo alto y 0 beneficio para la auditoría por GPS | ❌ **fuera del 20%** — no aporta el 80% del valor |
| 4 | Reescribir en Express (patrón SuitOrg) | Consistencia de stack con la raíz | `openpyxl`/PIL/EXIF/HEIC son Python; reescribir = reimplementar lógica probada en otro lenguaje | ❌ contra la escalera (rung 5: stdlib/native ya lo resuelven) |
| 5 | Agregar SQLite / Supabase | Historial consultable, sync | Especulativo hoy: no hay consulta histórica que resolver. `SuitCVLO/` ya tiene SQLite si algún día se necesita | ⏸️ diferible |
| 6 | **Switch IA multi-proveedor con cascada** | Cumple el requisito, degrada sin cortar, sin claves en código, funciona offline | Hay que mantener 4 adaptadores (~280 líneas) | ✅ **F2/F3** — núcleo del pedido |
| 7 | Mantener persistencia en archivos | Como el origen: portable, cero infraestructura, no destructivo | Sin consultas SQL | ✅ mantener |

**Pareto aplicado**: copiar la base + blindar el motor IA + registrar en SuitOS = ~20% del esfuerzo
posible y ~80% del valor (la herramienta funciona sin AutoClaw y sin secretos).

## 2. Motor de IA — el switch

Cadena: `ollama → openrouter → gemini → autoclaw` · circuit breaker 3 fallos → 5 min.

| Eslabón | Pros | Contras |
|---|---|---|
| **1. Ollama (local)** | Sin costo por foto, sin límite de rate, offline, privado (las fotos no salen de la máquina), ya tienes 17 modelos (8 con visión) | Calidad de lectura menor que un modelo frontier; consume RAM/CPU local; el modelo más liviano con visión (`qwen3.5`, 6.6 GB) tarda más que la nube |
| **2. OpenRouter** | 12 modelos gratis con visión auto-descubritos (no hardcodeados), buena calidad, una sola key | Requiere subir la foto a la nube, red limitada, modelos gratis pueden rotar |
| **3. Gemini** | Mejor OCR en español de la cadena, estructura de respuesta predecible | Costo si excede la cuota, sube la foto a la nube, dependencia de Google |
| **4. AutoClaw** | Es lo que ya funcionaba; comportamiento idéntico al original | Requiere AutoClaw abierto, servicio externo, era el único eslabón antes (punto único de falla) |
| **Cascada general** | Nunca corta la corrida; el error lista el motivo de cada eslabón; puedes forzar un proveedor desde la UI | Un fallo transitorio consume el intento de ese eslabón en esa foto (se reintenta en la siguiente) |
| **Circuito breaker** | Evita reintentar un eslabón caído 5 min | Puede dejar fuera un eslabón que se recuperó a los 6 min |

## 3. Seguridad

| Antes (`\cvlo-auditor`) | Ahora (`SuitCVLO-open`) |
|---|---|
| `APP_KEY` y `APP_ID` de AutoGLM escritos en `motor.py` | En `.env` (gitignore) o leídos de la skill instalada de AutoClaw |
| Único proveedor, obligatorio | 4 eslabones, ninguno obligatorio |
| Puerto fijo 8019 | 3015 (registry) + `CVLO_PUERTO` override |

## 4. Limitaciones conocidas (para ampliar cuando duela)

1. Un VLM local liviano transcribe peor texto pequeño lejano que Gemini — si la lectura de letreros
   falla, fija proveedor `gemini`/`openrouter` en la UI.
2. La lista de OpenRouter se auto-descubre pero **no se prueba** cada modelo antes de usarlo:
   si falla, el circuit breaker lo descarta y baja al siguiente eslabón.
3. Sin base de datos: no hay histórico de corridas más allá de `idxfotos.xlsx` y los JSON de `trabajo\reads`.
4. Una sola corrida a la vez por proceso (los jobs viven en memoria).
