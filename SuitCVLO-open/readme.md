# SuitCVLO-open

Aplicación web **local** (puerto **3015**) que procesa lotes de fotos de publicidad exterior y genera:

- **Estructura de carpetas**: `<Ruta de Salida>\<AAMMPQ>\auditoria\<Marca><TipoAnuncio><Ciudad>\<PIN>\`
  (la quincena `AAMMPQ` se calcula con la **fecha de la foto**: días 1–15 → `01`; 16–31 → `02`).
- **`info.txt`** por PIN: encabezado (`GRUPO`, `PIN`, `COORDENADAS`) + un bloque por foto
  (**`FOTO`** (nombre del archivo), **`CAMPAÑA`** = el eslogan de la campaña,
  **`COMENTARIO`** = qué promociona / el texto que se ve, `PLAZA`,
  **`PROVEEDOR`** = el anunciante o marca (IA → columna `MARCA` del pines → reglas por PIN),
  `RAZÓN SOCIAL, MEDIO, FORMATO, ID, UBICACIÓN, LATITUD, LONGITUD`)
  con llenado **foto → si falta, del archivo de pines → si falta, del KML**.
  La IA responde **8 líneas** (`ANUNCIO, MARCA, CAMPAÑA, QUE ANUNCIA, TEXTO VISIBLE,
  REFERENCIAS UBICACION, TIPO SOPORTE, CARA`); las lecturas viejas que traían
  `MARCA CAMPAÑA` fusionado siguen sirviendo (la marca cae en `PROVEEDOR` y en `CAMPAÑA`).
  **`COMENTARIO` depende del switch de *Opciones avanzadas*** (activado por defecto).
  *Se reescribe entero cada vez que entra una foto nueva al PIN; las fotos sin lectura guardada
  quedan con `COMENTARIO: no disponible` (la lectura se conserva en `trabajo\reads`, así que
  volver a activar el switch la recupera en la siguiente corrida).*
- **`idxfotos.xlsx`**: se **crea si no existe** y se va actualizando (no repite lo ya *Verificado ✓*).
  Campos: NombreFoto, Descripción de lo que anuncia, Dirección, Tipo de Anuncio, Latitud, Longitud,
  Referencias visuales o notas, Verificado, PIN. Si una foto excede el tope por PIN → fila con
  *Verificado en blanco* y nota ("excede el tope"); si **no tiene GPS** → fila con
  **`Verificado = No GPS`**, nota `sin GPS en EXIF` y PIN vacío (queda registrada y no se re-evalúa).
  **Fecha hora de subida**: si el archivo ya tiene una columna `FechaHoraSubida` (o `FechaCarga`),
  se rellena con `AAAA-MM-DD HH:MM` en cada foto nueva; si no, se crea a partir de la columna 10.
  **Nunca toca otras columnas** (p. ej. `FechaHoraFoto`) ni inventa valores en filas antiguas.

## Parámetros (en la página)

| Parámetro | Qué es |
|---|---|
| Fuente | **Web/Drive** (URL de carpeta o el archivo `GooDrPics.txt`), **Local** (ruta), **ZIP** o **carpeta** (subida) |
| Ruta de Google Drive Pics | URL de la carpeta de Drive o archivo `GooDrPics.txt` (modo Web) |
| Ruta local de fotos | carpeta con las fotos (modo Local) |
| Ruta de Salida | dónde se construye `<AAMMPQ>\auditoria\...` |
| Ruta de GoogleMapsPines | `.txt` con la URL del mapa, `.kml` exportado o `.xlsx` (tipo depurado) |
| Ruta de KML | `RutaKML.kml` (respaldo de datos por PIN) |
| Ruta de idxfotos.xlsx | índice (se crea si no existe) |
| N Fotos | máximo de **candidatas** a leer (foto con GPS dentro del radio de un PIN) |
| Avanzado | radio de match (250 m), tope por PIN (10), pausa de descarga (1 s), **descargas máximas (300)**, **switch COMENTARIO** |
| **Motor IA** | **OpenCode (tu suscripción) → Ollama local → HuggingFace → DeepSeek → OpenRouter → Gemini** — elige proveedor o "auto (cadena)" |

## Motor IA (switch)

La lectura de cada foto pasa por `ia/switch.py`, que baja por la cadena hasta que un proveedor responde:

| # | Proveedor | Origen | Requiere | Medido |
|---|---|---|---|---|
| 1 | **`opencode`** | nube (**tu suscripción**) | key de `opencode auth login` — se lee sola de `~/.local/share/opencode/auth.json` | ✅ **3.2 s/foto · ~USD 0.00028** (≈54,000 fotos/mes con tu límite de $15) |
| 2 | `ollama` | **local** (sin costo, offline) | Ollama + un modelo con `vision` | ~456 s/foto (CPU) |
| 3 | `huggingface` | nube | ~~`HF_TOKEN`~~ **DESACTIVADO** (créditos agotados) | ❌ |
| 4 | `deepseek` | nube (5M tokens gratis al registrarte) | `DEEPSEEK_API_KEY` en `.env` | ⚠️ `402` sin saldo |
| 5 | `openrouter` | nube | ~~`OPENROUTER_API_KEY`~~ **DESACTIVADO** (key daba `401`) | ❌ |
| 6 | `gemini` | nube | `GEMINI_API_KEY` en `.env` | sin key |

**Modelo de OpenCode**: `deepseek-v4-flash-vision-exp` — el **único con visión** de sus 86 modelos.

Circuito breaker: 3 fallos seguidos → 5 min de cooldown; el motivo se anota en el log de la corrida.
`GET /api/ia/modelos` lista los disponibles (los locales salen marcados **`(local)`**).

> **AutoClaw/AutoGLM se eliminó** de la cadena (2026-10-01, ADR-038) y **OpenCode entró primero**
> (2026-10-02, ADR-041); HuggingFace y OpenRouter quedaron **desactivados** en `.env` (sus líneas
> siguen ahí, comentadas).

## Modo Local vs Modo Web/Drive (medido)

| | **Local (ruta)** | **Web (URL de Drive)** |
|---|---|---|
| Coste | **ninguno** | baja cada foto para poder leer su GPS |
| 10 fotos | **segundos** | ~4 min de listado (3.653 archivos) + descargas |
| "N fotos" | = N fotos analizadas | = N **candidatas**; puede bajar muchas más |
| Tope | no aplica | **Descargas máximas** (300 por defecto) en *Opciones avanzadas* |

> Con **Google Drive para Windows** (Drive File Stream) usa **Modo Local** apuntando a la carpeta
> sincronizada (Explorador → Ctrl+Shift+C). Cero descargas, GPS al instante.

## Uso

1. Doble clic en **`INICIAR.bat`** → se abre `http://127.0.0.1:3015`.
2. Llena los parámetros (vienen precargados con las rutas de `cteCVLO1`).
3. Elige la fuente y pulsa **Iniciar corrida**.
4. Sigue el progreso: bajo la barra verás la línea
   `1696 en la ruta · 1202 con GPS · 7 sin GPS · 1201 fuera de radio · 286 PINs`;
   al terminar verás el resumen (leídas / copiadas / excedidas / PINs / grupos) y el log.

## Requisitos

- Windows con Python 3 (el iniciador resuelve el intérprete y las dependencias: flask, openpyxl, pillow, pillow-heif, gdown).
- **Una key de OpenCode** (ya la crea `opencode auth login`) — es el primer eslabón y el más barato.
- **Ollama con un modelo de visión** como respaldo local (ya tienes `qwen3.5`, `gemma4`, `qwen3.6`…).
- Descargas de Drive con **pausa ≥ 1 s** y reintentos (para evitar bloqueos de Google).

## Cómo quedó

- Fork de `\cvlo-auditor` (fuente de solo lectura, no modificada).
- Cambios: puerto 3015, motor IA desacoplado (`ia/switch.py`), cero claves hardcodeadas (`.env`).

## Notas

- **No se elimina ningún archivo**: los temporales quedan en `trabajo\` (cache de fotos y registros de lectura).
- Sin base de datos: todo vive en archivos locales (Excel, JSON, carpetas).
- No repite trabajo: excluye fotos ya cargadas en la salida, ya leídas (registro interno) y ya *Verificadas ✓*.
- Pruebas: `run_tests.bat` (modo MOCK, sin internet).
