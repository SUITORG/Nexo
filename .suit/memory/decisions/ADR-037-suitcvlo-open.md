# ADR-037: SuitCVLO-open — fork open de cvlo-auditor con switch de IA multi-proveedor

## Status
Accepted (2026-10-01)

## Context
`\cvlo-auditor` (fuente de solo lectura) procesa lotes de fotos OOH y genera la estructura de
auditoría, pero su lectura de imagen está **atada a AutoClaw/AutoGLM con `APP_KEY` hardcodeada**
(`motor.py:43`): sin ese servicio abierto la herramienta no lee nada, y la clave vive en el repo.

Paralelamente, SuitOrg ya tiene:
- `SuitCVLO/` — pipeline YOLO (detección + OCR + exports), proyecto independiente y pesado.
- ADR-006 `SuitAI/` — model discovery + circuit breaker + fallback chain (JS, sin visión).

El usuario pidió un módulo nuevo `SuitCVLO-open` que tome lo mejor de `cvlo-auditor`, incluya un
**switch que aproveche la IA local con Ollama**, liste los modelos disponibles (los locales marcados
`(local)`), y **no conviva con `Config_Empresas`/Sheets**.

## Decisión
1. **Copiar** `\cvlo-auditor` → `SuitCVLO-open/` (la fuente queda intacta). Se conserva el pipeline
   probado (GPS EXIF → match por radio a PIN → estructura `<AAMMPQ>\auditoria\...` + `info.txt` +
   `idxfotos.xlsx`), sus 3 suites de tests mock y sus invariantes (sin BD, sin borrados).
2. **Puerto 3015** (libre; 3011 está ocupado por SuitChatTG en el registry).
3. **Nuevo `ia/switch.py`** con cadena inmutable de 4 eslabones y circuit breaker:

   | # | Proveedor | Origen | Condición |
   |---|---|---|---|
   | 1 | `ollama` | **local** | modelo con `vision` (8 detectados; default = el más liviano o `CVLO_VLM`) |
   | 2 | `openrouter` | nube | `OPENROUTER_API_KEY`, solo modelos gratis con `image` (auto-descubrimiento, 12 hallados) |
   | 3 | `gemini` | nube | `GEMINI_API_KEY` |
   | 4 | `autoclaw` | servicio local `:18432` → nube | último eslabón, la opción original |

   - Circuito breaker: 3 fallos seguidos → cooldown de 5 min por proveedor; nunca corta la corrida:
     si todos fallan, el error lista los motivos de cada eslabón.
   - `GET /api/ia/modelos` → inventario (Ollama con sufijo **`(local)`**), `GET /api/ia/estado` → cadena.
4. **Eliminación de secretos**: `APP_ID`/`APP_KEY` de AutoClaw salen del código → `.env`
   (`AUTOCALW_APP_ID`/`AUTOCALW_APP_KEY`) con la skill instalada de AutoClaw como fallback local.
5. **No se registra en `Config_Empresas`**: usuario único, sin `id_empresa`, sin `db_engine`.

## Rationale
- **Escalera ponytail**: reusar el 95% que ya funciona es la solución más corta; reescribir en
  Express/FastAPI obligaría a reimplementar openpyxl/Pillow/EXIF/HEIC en otro lenguaje.
- **Ollama primero**: sin costo por foto, offline, y la máquina ya tiene 17 modelos locales
  (8 con capacidad `vision` detectada vía `capabilities` de `/api/tags`).
- **El switch elimina el punto único de falla** que motivó el fork, sin tocar la lógica de negocio.
- **Cascada en vez de elegir a mano**: el 80% del valor está en que la corrida termine.

## Consequences
- La calidad de lectura varía por eslabón (un VLM local liviano lee peor que Gemini); el usuario
  puede forzar proveedor y modelo desde la UI (persistido en `localStorage`).
- `gdown` y `pillow-heif` se instalaron en el intérprete del sistema (no hay venv).
- `openrouter` y `gemini` hacen una llamada de descubrimiento/cache al arrancar (TTL 1 h).
- La skill instalada de AutoClaw (`~/.openclaw-autoclaw/.../`) sigue siendo leída como fallback;
  si un día se elimina, basta `.env`.
- `SuitCVLO/` (YOLO) queda deliberadamente fuera de alcance: si algún día se necesita detección de
  anuncios sin GPS, se evalúa entonces integrarla.

## Files Affected
- `SuitCVLO-open/**` — copia + `ia/switch.py` + `docs/`
- `SuitCVLO-open/motor.py` — config AutoClaw sin secretos
- `SuitCVLO-open/proceso.py` — `_leer_foto_ia` delega al switch
- `.suit/registry/projects.yaml` — alta `suitcvlo-open` (3015)
- `.suit/INDEX.md`, `AGENTS.md` — registro de puerto
- `GuiaTotal/registro/suitcvlo-open.yaml` — tarjeta

## Related
- `\cvlo-auditor\` (fuente, solo lectura)
- ADR-006 (SuitAI — model discovery + circuit breaker, la idea reutilizada)
- ADR-029 (micro-frontend aislado — precedente de proyecto fuera del SPA)
