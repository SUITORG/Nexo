# AGENTS.md — SuitComfy

Módulo de generación de imagen y video con ComfyUI. **100% local, sin GPU NVIDIA (CPU).**

## Reglas inmutables del subproyecto

1. **Nunca modificar SuitCampanas/ ni ViRe/** — SuitComfy es autónomo. Solo consume FFmpeg (WinGet) y ComfyUI (puerto 8188).
2. Parámetros siempre vía `.env` o body JSON — **nunca hardcodear** rutas de ComfyUI/FFmpeg en código (usa `services/comfyClient.js` y `services/renderer.js`).
3. Los flujos de ComfyUI viven en `workflows/*.json` (formato API), con placeholders `__POSITIVE__`/`__NEGATIVE__`. Los parámetros del servidor reemplazan placeholders — no se reescribe el grafo a mano.
4. Los `workflows/*.json` se referencian por nombre desde `index.js` (via `loadWorkflow`). Agregar un flujo nuevo = nuevo JSON + entrada en `workflows/`.
5. Resolución del modelo SD1.5: máx 1024². Con LoRA LCM: `steps` 4–8, `cfg` 1.0–2.0, sampler `lcm`, scheduler `sgm_uniform`.
6. Salidas de video → `SuitComfy/output/`. No escribir en el output dir de ComfyUI.

## Pipeline

1. `POST /api/video` → genera `count` imágenes (seed secuencial) con `txt2img-lcm.json`
2. `services/renderer.js` → FFmpeg: Ken Burns (zoom in/out) + xfade → MP4 H.264
3. Responde ruta del MP4 en `SuitComfy/output/`

## Comandos

```bash
node index.js          # puerto 3012
node --check index.js  # validación sintáctica (siempre tras editar JS)
```
