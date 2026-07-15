# SuitFFmpeg

Wrapper local para FFmpeg en el ecosistema SuitOrg.

## Instalación actual
- **FFmpeg**: v8.1.1 (via WinGet: `Gyan.FFmpeg`)
- **Ruta**: `C:\Users\rojo-\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.1.1-full_build\bin\ffmpeg.exe`

## Uso en SuitCampanas
El servidor en `local-server-node.js` usa FFmpeg para:
- `/api/animate` — Animación de imagen individual (Ken Burns, zoom, etc.)
- `/api/slideshow` — Slideshow con transiciones crossfade
- `/api/video-imaginacion` — Video de imaginación (IMG mode)
- `/api/video-produce` — Suite completa de video (VIDE mode)

## Verificar instalación
```bash
ffmpeg -version
```

## Reinstalar (si se borra)
```bash
winget install Gyan.FFmpeg
```

## Configuración
La ruta de FFmpeg se define en `.env` como `FFMPEG_PATH` o se auto-detecta del PATH del sistema.

---

*Creado: 2026-07-10*
