# ADR-018: SuitComfy — Módulo ComfyUI local para imagen + video profesional

**Date:** 2026-07-31
**Status:** Accepted
**Risk:** Low
**Workflow:** feature

---

## Context

Necesitábamos un flujo para llegar de "2 fotos generadas en ComfyUI" a **video profesional**, todo local y gratuito. Constraintes detectadas:

- La máquina **no tiene GPU NVIDIA**: solo AMD Radeon integrada (512MB). ComfyUI corre con `--cpu` (PyTorch 2.11.0+cpu).
- Modelos instalados: 2 checkpoints SD 1.5 de imagen (`realisticVisionV60B1`, `v1-5-pruned`), LoRA `lcm-lora-sdv1-5`, 1 VAE. No hay modelos de video (WAN/LTX) ni VRAM para usarlos.
- Los modelos de video IA (WAN 14B, LTX 22B) exigen 12–24GB VRAM → **inviable localmente**.
- FFmpeg v8.1.1 (WinGet) disponible y en PATH.
- SuitCampanas no consume ComfyUI (grep 8188/comfy: 0 resultados) — el módulo nuevo debe **mantener ese aislamiento**.

## Decision

Crear **`SuitComfy/`** como módulo SuitOrg independiente (puerto **3012**), con pipeline **100% local y gratuito**:

1. **Imagen**: grafo ComfyUI `workflows/txt2img-lcm.json` (realisticVision + LoRA LCM → 8 pasos en vez de 25; ~1–2 min/imagen en CPU). Grafo parametrizable vía placeholders `__POSITIVE__`/`__NEGATIVE__` y slots (steps, cfg, seed, resolución, batch).
2. **Video profesional**: el "movimiento" NO lo hace IA — lo hace FFmpeg (`services/renderer.js`): Ken Burns (zoom in/out alternado) + crossfade entre escenas → MP4 H.264. Rápido, fiable, CPU-friendly.
3. **API Express**: `POST /api/image` (una escena) y `POST /api/video` (N escenas → MP4). Patrón SuitReservaciones: `index.js` exporta `module.exports = app`.
4. **Aislamiento**: no toca SuitCampanas/, ViRe/, ni el output dir de ComfyUI (salidas van a `SuitComfy/output/`). Sin base de datos → se omite `db/client.js` (no hay datos que persistir).

Se descarta (por ahora, explícitamente) AnimateDiff/video IA local: en CPU tardaría ~20–30 min por clip de 2s. Cuando exista GPU/cloud, el mismo patrón se extiende con packs `ltx-2.3`/`wan-longer-videos` (los 55 packs de comfyui-mcp ya disponibles).

## Files

| Archivo | Contenido |
|---|---|
| `SuitComfy/index.js` | Express, puerto 3012, `POST /api/image` y `/api/video` |
| `SuitComfy/services/comfyClient.js` | Cliente API de ComfyUI (POST /prompt, history, rutas output) |
| `SuitComfy/services/renderer.js` | FFmpeg: Ken Burns + xfade → MP4 |
| `SuitComfy/workflows/txt2img-lcm.json` | Grafo ComfyUI parametrizable (validado vs ComfyUI 0.28) |
| `SuitComfy/AGENTS.md` | Reglas del subproyecto |
| `.suit/registry/projects.yaml` | Entrada `suit-comfy` |

## Validation

1. `node --check` en los 3 JS ✓
2. `validate_workflow` (ComfyUI 0.28): grafo LCM **válido, 0 issues** ✓
3. `renderer.js` probado con las 2 fotos reales → `SuitComfy/output/test.mp4` (258 KB) ✓
4. FFmpeg v8.1.1 (libx264) confirmado en PATH ✓

## Consequences

- **Positive:** flujo local-gratis imagen→video funcional; módulo aislado; sin costos.
- **Negative:** render IA limitado a imagen; "video" = cinemática FFmpeg sobre stills (no IA temporal).
- **Neutral:** port 3012 nuevo en el registry (3001–3011 ocupados, 8188 ComfyUI).

---

*Decision recorded by SuitOS agent session — 2026-07-31*
