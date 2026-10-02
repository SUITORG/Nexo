# ADR-040: SuitCVLOGCPy — pipeline en Google Colab con VLM en GPU

## Status
Accepted (2026-10-02)

## Context
`SuitCVLO-open` procesa lotes de fotos OOH en local, pero su lectura de imagen depende de la
IA disponible en la máquina: con los créditos de HuggingFace agotados, DeepSeek sin saldo y
OpenRouter con una key inválida, **solo quedaba Ollama a ~456 s/foto en CPU**.

El usuario probó llevar el pipeline a Colab con otro IDE y "casi funcionó", pero le salían
**fotos repetidas y un `info.txt` distinto**: el IDE había *reimplementado* la lógica en vez de
reusarla, y el estado (`idxfotos.xlsx`, carpeta de salida, `reads/`) no sobrevivía a la sesión.

Decisiones explícitas del usuario (2026-10-02):
1. el modelo de visión corre **dentro de Colab con la GPU gratis** (sin keys ni créditos);
2. la entrada es una **carpeta de Drive** y se toman **las 40 pendientes**;
3. **Colab pasa a ser la herramienta principal**; el xlsx **es el mismo** y gana una columna
   con la fecha de carga;
4. **no se toca `SuitCVLO-open/`**.

## Decisión
Crear **`SuitCVLOGCPy/`** como proyecto **independiente y autocontenido**:

1. **Copia del pipeline** (`motor.py`, `proceso.py`, `utilidades.py`, `ia/`, `tests/`) traída de
   `SuitCVLO-open@7c612d3` → **una sola fuente de verdad** para la lógica de exclusión,
   `info.txt` y estructura. La app hermana no se modifica (verificado con `git status`).
2. **Nuevo eslabón `colab`** en `ia/switch.py` de la copia:
   `switch.registrar_vlm(fn, nombre)` lo activa y entra como **primer** de la cadena
   (`colab → ollama → huggingface → deepseek → openrouter → gemini`); sin modelo cargado,
   `_disponible()` lo salta con motivo y la cadena sigue.
3. **Columna `FechaCarga`** (índice 10) en `IDX_HEADERS` y en `_fila_idx()`; `idx_abrir_o_crear`
   añade la cabecera a un xlsx viejo **sin mover** `Verificado`=8 ni `PIN`=9.
4. **`CVLO_Colab.ipynb`** de 9 celdas: entorno → Drive/rutas → import del pipeline → carga del
   modelo → **smoke de 1 foto** → lote de 40 → resumen → solución de problemas.
5. **Estado en Drive**: `salida/`, `idxfotos.xlsx` y `trabajo_colab/reads/` viven en Drive →
   la sesión de Colab puede morir y **no se repite nada** (era el bug original).

## Rationale
- **El problema nunca fue Colab**: fue reimplementar la lógica y no persistir el estado.
  Reusar el código y poner los tres artefactos de exclusión en Drive ataca la causa raíz.
- **GPU gratis** resuelve el cuello de botella de coste/velocidad sin depender de créditos de
  terceros (HF/DeepSeek/OpenRouter) ni de la CPU local.
- **Autocontenido**: un solo arrastre a Drive y todo funciona; sin acoplamiento entre hermanos.
- El modelo se elige según VRAM (`≥15 GB → Qwen2.5-VL-7B`, si no `3B`) para que quepa en una T4.

## Consequences
- **Dos copias del pipeline**: una corrección en `SuitCVLO-open` debe replicarse aquí (y al
  revés). Anotado en el contrato de ambos.
- Sin servidor/puerto: no entra en la tabla de puertos como servicio; se registra como `type: standalone`.
- La calidad de lectura depende del modelo de Colab (3B en T4) — medible con la celda 5 (smoke)
  antes de cada lote.
- **Sin probar en un runtime de Colab** desde esta máquina: el gate real es la celda 5 que
  ejecuta el usuario (`docs/VALIDACION.md`, sección "No probado").
- Si el usuario vuelve a la app local, debe elegir **uno de los dos** para escribir cada tanda
  en el mismo `idxfotos.xlsx` (riesgo de pisarse si escriben a la vez).

## Files Affected
- `SuitCVLOGCPy/**` (nuevo: notebook, copia del pipeline, tests, docs)
- `.suit/registry/projects.yaml`, `.suit/INDEX.md`, `AGENTS.md` (tabla)

## Related
- ADR-037 / ADR-038 / ADR-039 (historial de la cadena de IA en `SuitCVLO-open`)
- `SuitCVLOGCPy/docs/CONTRATO.md` (límite explícito: no tocar `SuitCVLO-open/`)
