# ADR-031: SuitComfy — Recuperación de ComfyUI caído + poster overlay Quote-Flow

**Date:** 2026-09-17
**Status:** Aplicado (2026-09-17)
**Risk:** Bajo (config local de una app de escritorio, ningún cambio en el pipeline de deploy)
**Workflow:** bugfix

---

## Context

El usuario pidió generar pósters fotorrealistas tipo "Quote-Flow" (formato de un prompt externo con tipografía gigante + franja inferior de 4 pasos) y preguntó si podía usarse ComfyUI local (`SuitComfy`, ver [[ADR-018]]) como alternativa a un modelo de imagen con generación de texto (Nano Banana/GPT-Image).

Al verificar, `ComfyUI Desktop` tenía 5 procesos abiertos pero **ningún puerto escuchando**. Diagnóstico en `%APPDATA%\ComfyUI\logs\comfyui.log` y `main.log`:

1. **Server crasheaba al iniciar**: `Could not autodetect AIMDO implementation, assuming Nvidia` → intentaba `torch.cuda.current_device()` → `AssertionError: Torch not compiled with CUDA enabled`. La máquina no tiene GPU NVIDIA (ver ADR-018), pero el auto-detector de la Desktop app falló y no pasó `--cpu` al lanzar `main.py`, pese a que `config.json` sí tenía `"selectedDevice": "amd"` correctamente detectado.
2. **Puerto real distinto al documentado**: el launch command mostraba `--port 8000`, no `8188` (lo que documentan ADR-018, `SuitComfy/README.md` y `.suit/workflows/video-generation-comfyui.yaml`). Además `8000` choca con `SuitCampanas` (mismo puerto, ver `CLAUDE.md` raíz).
3. **Instalación migrada**: la Desktop app ahora corre desde `C:\Users\rojo-\AppData\Local\Programs\ComfyUI1\` (antes `...\Comfy-Desktop\ComfyUI-Installs\ComfyUI\ComfyUI\`). Los checkpoints/LoRAs (`realisticVisionV60B1_v51HyperVAE.safetensors`, `lcm-lora-sdv1-5.safetensors`) quedaron huérfanos en la ruta vieja — el `models/` de la instalación nueva estaba vacío.
4. **`SuitComfy/` sin levantar**: faltaban `node_modules` (no había `dependencies` declaradas en `package.json` pese a que `index.js` usa `express`) y `.env` no existía (el `.env.example` apunta a la ruta de output vieja).

## Decision

Arreglar cada causa raíz en su origen, sin tocar el repo salvo donde el propio repo tenía el dato desactualizado:

1. `%APPDATA%\ComfyUI\logs comfy.settings.json` (fuera del repo) → `Comfy.Server.LaunchArgs: { "cpu": "", "port": "8188" }`.
2. `%APPDATA%\ComfyUI\extra_models_config.yaml` (fuera del repo) → nueva sección `suitcomfy_legacy_models` con `base_path` apuntando a la instalación vieja, para no duplicar los ~2.1GB del checkpoint.
3. `SuitComfy/`: `npm install express --save` (ahora sí declarado en `package.json`); `SuitComfy/.env` creado con `COMFYUI_OUTPUT_DIR` corregido a `...\ComfyUI1\output`.
4. Verificado end-to-end: `GET /api/health` → `{ok:true, comfy:true}`, y `POST /api/image` generó una imagen 768×1024 real en ~4 min de CPU.

Adicional (mismo pedido del usuario): se construyó `SuitComfy/quote-flow-poster.js`, un compositor de overlay (SVG + `sharp`) que toma el fondo fotorrealista generado por ComfyUI y le superpone tipografía/franja inferior/insignia — porque SD1.5 **no puede renderizar texto legible**, así que el póster final separa "escena" (ComfyUI) de "texto/UI" (código determinístico).

## Alternatives Considered

1. **Reinstalar ComfyUI Desktop desde cero**: descartado — el problema era una bandera de lanzamiento faltante, no una instalación corrupta; reinstalar hubiera perdido tiempo y no tocaba la causa real.
2. **Copiar los 2.1GB de modelos a la instalación nueva**: descartado por espacio/tiempo — una ruta extra en `extra_models_config.yaml` logra lo mismo sin duplicar.
3. **Pedirle a un modelo de difusión que renderice el texto del póster**: descartado — es una limitación conocida de SD1.5, ningún prompt lo arregla; de ahí la decisión de separar escena/overlay.

## Files Modified

- Fuera del repo (config de la app ComfyUI Desktop): `comfy.settings.json`, `extra_models_config.yaml`.
- `SuitComfy/package.json` (+ `express` en dependencies), `SuitComfy/.env` (nuevo, gitignored), `SuitComfy/.env.example` (ruta de output corregida).
- `SuitComfy/quote-flow-poster.js` (nuevo: compositor de overlay).
- Creado: este ADR.

## Validation

- `curl http://127.0.0.1:8188/system_stats` → 200, `Device: cpu`.
- `curl http://127.0.0.1:3012/api/health` → `{"ok":true,"comfy":true}`.
- `POST /api/image` (768×1024) → imagen real generada y verificada visualmente.
- `node quote-flow-poster.js` (demo self-check) → PNG final 3:4 con overlay compuesto, sin excepciones.

## Consequences

- **Positive:** SuitComfy vuelve a ser una alternativa local/gratis funcional para fondos fotorrealistas; documentado el patrón overlay para cualquier póster con texto.
- **Negative:** El puerto/ruta de la Desktop app viven en config de usuario fuera del repo — si se reinstala de nuevo o se actualiza la app, puede volver a resetearse (mismo síntoma que originó este ADR).
- **Neutral:** `SuitComfy/README.md` y ADR-018 ya documentaban `:8188`; no requirieron corrección, solo la app desktop estaba desalineada con ellos.

---

*Decision recorded by SuitOS agent session — 2026-09-17*
