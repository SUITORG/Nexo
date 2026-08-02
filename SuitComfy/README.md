# SuitComfy

Módulo de generación de imagen y video con ComfyUI — **100% local y gratuito**, aislado de los demás módulos SuitOrg.

## Qué hace

1. **Genera imágenes** con ComfyUI (modelo `realisticVisionV60B1` SD 1.5 + LoRA **LCM** para rapidez en CPU: ~8 pasos en vez de 25).
2. **Ensambla video profesional** con FFmpeg: Ken Burns (zoom in/out alternado) + crossfade entre escenas → MP4 H.264.

## Uso

```bash
node index.js                  # puerto 3012
```

```bash
# 1 imagen
curl -X POST http://127.0.0.1:3012/api/image -H "Content-Type: application/json" \
  -d '{"prompt":"producto de skincare sobre mármol, iluminación de estudio"}'

# video (genera `count` escenas + ensambla MP4)
curl -X POST http://127.0.0.1:3012/api/video -H "Content-Type: application/json" \
  -d '{"prompt":"vendedora de tienda de ropa, moda, luz natural","count":4}'
```

Parámetros del flujo (todos opcionales): `prompt`, `negative`, `width`/`height` (768 por defecto), `steps` (8), `cfg` (1.8), `seed`, `count` (4–12), `duration` (4s por escena), `transition` (1s crossfade).

## De dónde sale el flujo

`workflows/txt2img-lcm.json` es el grafo de ComfyUI en formato API, con nodos `__POSITIVE__`/`__NEGATIVE__` como placeholders. El servidor lo parametriza (prompt, resolución, pasos, cfg, seed) antes de enviarlo a `POST /prompt` de ComfyUI. Los pasos se reemplazan por parámetros sin tocar el resto del grafo.

## Configuración (`.env`)

| Variable | Default |
|---|---|
| `PORT` | 3012 |
| `COMFYUI_URL` | `http://127.0.0.1:8188` |
| `COMFYUI_OUTPUT_DIR` | `...\ComfyUI\output` (auto-detectado) |
| `FFMPEG_PATH` | `ffmpeg` (WinGet: Gyan.FFmpeg v8.1.1) |

## Límites honestos

- Sin GPU NVIDIA: todo corre en CPU (`--cpu`). Una imagen LCM 512² ≈ 1–2 min; video de 4 escenas ≈ 5–15 min.
- El modelo es de **imagen** (SD 1.5), no de video. El "movimiento" lo crea FFmpeg (Ken Burns + crossfade), no la IA.
- No modifica ni depende de SuitCampanas ni de ViRe. Para video programático reactivo, sigue existiendo Remotion (ViRe, puerto 3004).
