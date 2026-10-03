# ADR-041: OpenCode como primer eslabón; HuggingFace y OpenRouter desactivados

## Status
Accepted (2026-10-02)

## Context
Estado real de la cadena de IA el 2026-10-02 (medido, no supuesto):

| Eslabón | Estado | Coste/foto |
|---|---|---|
| `ollama` | ✅ | $0 pero **456 s/foto** en CPU |
| `huggingface` | ❌ créditos mensuales **agotados** | — |
| `deepseek` | ❌ `402 Insufficient Balance` | — |
| `openrouter` | ❌ key `401 User not found` | — |
| `gemini` | ❌ sin key | — |

Quedaba **un solo eslabón funcional y a 7.6 min/foto**. El usuario paga **OpenCode** y pidió usarlo
para analizar fotos, además de **desactivar `openrouter` y `huggingface` sin borrar sus líneas**.

Investigación del catálogo `https://opencode.ai/zen/v1/models`: **86 modelos, 1 solo con imagen** →
`deepseek-v4-flash-vision-exp`. La key ya existía en `~/.local/share/opencode/auth.json`
(`opencode-go`, 51 caracteres). El endpoint **Zen** devolvió `403 Model access is disabled`
(no hay saldo Zen); el de **Go** (suscripción) respondió bien.

## Decisión
1. **Nuevo eslabón `opencode` el PRIMERO** de la cadena:
   `opencode → ollama → huggingface → deepseek → openrouter → gemini`
   - `_clave_opencode()`: `.env` → si no, `opencode-go.key` de `~/.local/share/opencode/auth.json`
     (la clave **nunca** se copia a código ni a logs).
   - Endpoint por defecto `https://opencode.ai/zen/go/v1/chat/completions` (OpenAI-compatible),
     sobreescritible con `OPENCODE_BASE_URL`.
   - Modelo `deepseek-v4-flash-vision-exp` (`OPENCODE_VISION_MODEL`).
2. **Dos cabeceras obligatorias** descubiertas empíricamente:
   - `User-Agent: SuitCVLO-open/1.0` — sin ella Cloudflare devuelve **403 (error 1010)**;
   - `x-opencode-session: <uuid>` — sin ella devuelve **400 MissingSessionID**.
3. **`thinking: {"type": "disabled"}`** por defecto (`OPENCODE_THINKING=enabled` lo reactiva):
   sin él el modelo "razona" 722 tokens por foto.
4. **`huggingface` y `openrouter` desactivados** añadiendo `HF_TOKEN=` y `OPENROUTER_API_KEY=`
   **vacíos** en `.env` (el `.env` manda sobre el entorno, así que anulan las keys del sistema)
   y **comentando** las líneas de ejemplo. Los eslabones **no se borran**: siguen en `ORDEN`,
   reportan `sin HF_TOKEN` / `sin OPENROUTER_API_KEY` y se saltan en milisegundos.

## Rationale
- **Es lo más barato y rápido disponible hoy**: medido con el prompt real → **3.2 s/foto**,
  1201 tokens de entrada / 162 de salida → **USD 0.000277/foto** → ~**USD 0.28 por 1,000 fotos**,
  y con el límite mensual de **$15** del plan de **$10** ≈ **54,000 fotos/mes** sin coste extra.
- **Cero configuración**: la key ya está en el equipo, no hay que pegar nada.
- **`thinking` desactivado** multiplica por ~3.6 el ahorro y duplica la velocidad, sin perder
  calidad en la lectura estructurada de 7 líneas (verificado contra el prompt real).
- **Primero OpenCode y no Ollama** por velocidad/coste; quien prefiera privacidad puede forzar
  `ollama` desde el selector (o reordenar exigiendo un ADR nuevo).

## Consequences
- Las fotos se suben a la nube de OpenCode (ya ocurría con HF/DeepSeek; Ollama sigue siendo la
  opción privada, elegible a mano).
- `ORDEN` cambió → **contrato modificado** (invariante 5) y tests actualizados (**47 tests**).
- El catálogo de OpenCode tiene **un solo modelo con visión**: si lo retiran, la cadena cae a
  Ollama automáticamente (circuit breaker + cascada).
- `SuitCVLOGCPy` (Colab) **no** recibió este eslabón: su copia del pipeline mantiene `colab` primero.
  Añadirlo exige replicarlo allí (los dos hermanos comparten lógica).
- La cabecera `FechaHoraFoto` que el usuario añadió en la columna 10 de su `idxfotos.xlsx`
  **no se pisa** (arreglo en `SuitCVLOGCPy`: `idx_col_fecha()` escribe en la primera columna libre).

## Files Affected
- `SuitCVLO-open/ia/switch.py` — `ORDEN`, `_clave_opencode()`, `_disponible`, `_elegir`,
  `_pertece`, `_opencode()`, `modelos()`, `User-Agent` en `_http()`
- `SuitCVLO-open/.env`, `.env.example` — bloque OpenCode + HF/OpenRouter comentados
- `SuitCVLO-open/plantillas/index.html` — opción en el selector
- `SuitCVLO-open/tests/test_switch.py` — 7 tests nuevos (47 en total)
- `SuitCVLOGCPy/motor.py`, `proceso.py`, `tests/test_flujo_mock.py`, `CVLO_Colab.ipynb`
  — columna de fecha que no pisa cabeceras ajenas (41 tests)
- `readme.md`, `AGENTS.md`, `docs/CONTRATO.md`, `docs/PROS_CONTRAS.md`, `docs/MODELOS.md`,
  `docs/VALIDACION.md`, `.suit/registry/projects.yaml`, `AGENTS.md` (raíz)

## Related
- ADR-037 (cadena original) · ADR-038 (baja de AutoClaw) · ADR-039 (entrada de HuggingFace)
