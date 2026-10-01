# SuitCVLO-open

Aplicación web **local** (puerto **3015**) que procesa lotes de fotos de publicidad exterior y genera:

- **Estructura de carpetas**: `<Ruta de Salida>\<AAMMPQ>\auditoria\<Marca><TipoAnuncio><Ciudad>\<PIN>\`
  (la quincena `AAMMPQ` se calcula con la **fecha de la foto**: días 1–15 → `01`; 16–31 → `02`).
- **`info.txt`** por PIN: encabezado (`GRUPO`, `PIN`, `COORDENADAS`) + un bloque por foto
  (`CAMPAÑA, PLAZA, PROVEEDOR, RAZÓN SOCIAL, MEDIO, FORMATO, ID, UBICACIÓN, LATITUD, LONGITUD`)
  con llenado **foto → si falta, del archivo de pines → si falta, del KML**.
- **`idxfotos.xlsx`**: se **crea si no existe** y se va actualizando (no repite lo ya *Verificado ✓*).
  Campos: NombreFoto, Descripción de lo que anuncia, Dirección, Tipo de Anuncio, Latitud, Longitud,
  Referencias visuales o notas, Verificado, PIN. Si una foto excede el tope por PIN → fila con
  *Verificado en blanco* y nota ("excede el tope").

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
| N Fotos | máximo de fotos a leer en la corrida |
| Avanzado | radio de match (250 m), tope por PIN (10), pausa de descarga (1 s) |
| **Motor IA** | **Ollama local (VLM) → OpenRouter → Gemini → AutoClaw** — elige proveedor o "auto (cadena)" |

## Motor IA (switch)

La lectura de cada foto pasa por `ia/switch.py`, que baja por la cadena hasta que un proveedor responde:

| # | Proveedor | Origen | Requiere |
|---|---|---|---|
| 1 | `ollama` | **local** (sin costo, offline) | Ollama corriendo + un VLM (`ollama pull qwen2.5vl:7b`) |
| 2 | `openrouter` | nube (modelos gratis) | `OPENROUTER_API_KEY` en `.env` |
| 3 | `gemini` | nube | `GEMINI_API_KEY` en `.env` |
| 4 | `autoclaw` | servicio local `:18432` → nube | AutoClaw abierto (`AUTOCALW_APP_ID`/`AUTOCALW_APP_KEY` en `.env`) |

Circuito breaker: 3 fallos seguidos → 5 min de cooldown; el motivo se anota en el log de la corrida.
`GET /api/ia/modelos` lista los modelos disponibles de Ollama (los locales se marcan **`(local)`**).

## Uso

1. Doble clic en **`INICIAR.bat`** → se abre `http://127.0.0.1:3015`.
2. Llena los parámetros (vienen precargados con las rutas de `cteCVLO1`).
3. Elige la fuente y pulsa **Iniciar corrida**.
4. Sigue el progreso; al terminar verás el resumen (leídas / copiadas / excedidas / PINs / grupos) y el log.

## Requisitos

- Windows con Python 3 (el iniciador resuelve el intérprete y las dependencias: flask, openpyxl, pillow, pillow-heif, gdown).
- **Ollama con un modelo de visión** para el modo local (recomendado: `ollama pull qwen2.5vl:7b`). Sin él, la cadena sigue con OpenRouter/Gemini/AutoClaw.
- Descargas de Drive con **pausa ≥ 1 s** y reintentos (para evitar bloqueos de Google).

## Cómo quedó

- Fork de `\cvlo-auditor` (fuente de solo lectura, no modificada).
- Cambios: puerto 3015, motor IA desacoplado (`ia/switch.py`), cero claves hardcodeadas (`.env`).

## Notas

- **No se elimina ningún archivo**: los temporales quedan en `trabajo\` (cache de fotos y registros de lectura).
- Sin base de datos: todo vive en archivos locales (Excel, JSON, carpetas).
- No repite trabajo: excluye fotos ya cargadas en la salida, ya leídas (registro interno) y ya *Verificadas ✓*.
- Pruebas: `run_tests.bat` (modo MOCK, sin internet).
