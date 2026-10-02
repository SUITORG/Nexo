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

Cadena: `ollama → huggingface → deepseek → openrouter → gemini` · circuit breaker 3 fallos → 5 min.

| Eslabón | Pros | Contras |
|---|---|---|
| **1. Ollama (local)** | Sin costo por foto, sin límite de rate, offline, privado (las fotos no salen de la máquina), ya tienes 17 modelos (8 con visión) | Calidad de lectura menor que un modelo frontier; consume RAM/CPU local; medido: **~456 s/foto** con `qwen3.5` (serial) |
| **2. HuggingFace** | **~4 s/foto** (86× más rápido que Ollama), router **gratis** con 11 modelos de visión descubiertos, sin desplegar nada, OpenAI-compatible | Requiere `HF_TOKEN`; sube la foto a la nube; rate limits del tier gratuito; el descubrimiento filtra por nombre de modelo |
| **3. DeepSeek** | **5M tokens gratis al registrarte, sin tarjeta** (~3000 fotos); OpenAI-compatible; `deepseek-flash` con visión; después del grant es de los más baratos ($0.15/M in) | Tu cuenta responde **`402 Insufficient Balance`** (sin grant); sube la foto a la nube |
| **3. OpenRouter** | Modelos gratis con visión auto-descubiertos (no hardcodeados), buena calidad, una sola key | Límite ~50 req/día en gratis; **tu key actual da 401** (ver `PENDIENTES.md`); sube la foto a la nube |
| **4. Gemini** | Mejor OCR en español de la cadena, estructura de respuesta predecible | Costo si excede la cuota, sube la foto a la nube, dependencia de Google |
| **Cascada general** | Nunca corta la corrida; el error lista el motivo de cada eslabón; puedes forzar un proveedor desde la UI | Un fallo transitorio consume el intento de ese eslabón en esa foto (se reintenta en la siguiente) |
| **Circuito breaker** | Evita reintentar un eslabón caído 5 min | Puede dejar fuera un eslabón que se recuperó a los 6 min |

**AutoClaw se eliminó** (ADR-038): dependía de un servicio local abierto + clave; DeepSeek lo reemplaza
como segundo eslabón con clave propia y sin instalar nada.

## 3. Seguridad

| Antes (`\cvlo-auditor`) | Ahora (`SuitCVLO-open`) |
|---|---|
| `APP_KEY` y `APP_ID` de AutoGLM escritos en `motor.py` | **Código eliminado** — solo `.env` (gitignore) para los proveedores que actives |
| Único proveedor, obligatorio | 4 eslabones, ninguno obligatorio |
| Puerto fijo 8019 | 3015 (registry) + `CVLO_PUERTO` override |

## 4. Limitaciones conocidas (para ampliar cuando duela)

1. Un VLM local liviano transcribe peor texto pequeño lejano que Gemini — si la lectura de letreros
   falla, fija proveedor `deepseek`/`gemini` en la UI.
2. La lista de OpenRouter se auto-descubre pero **no se prueba** cada modelo antes de usarlo:
   si falla, el circuit breaker lo descarta y baja al siguiente eslabón.
3. Sin base de datos: no hay histórico de corridas más allá de `idxfotos.xlsx` y los JSON de `trabajo\reads`.
4. Una sola corrida a la vez por proceso (los jobs viven en memoria).
