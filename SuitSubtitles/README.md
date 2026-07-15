# SuitSubtitles

Genera subtítulos SRT a partir de archivos de audio usando Whisper.

## Instalación
```bash
pip install openai-whisper
```

## Uso Rápido

### Windows
Doble clic en `subtitles.bat` o ejecuta:
```bash
subtitles.bat audio.mp3
```

### Terminal
```bash
cd SuitSubtitles
python scripts/subtitles.py audio.mp3
```

### Opciones
```bash
python scripts/subtitles.py audio.mp3 -o subtits.srt -l es -m base
python scripts/subtitles.py audio.mp3 -l en -m small
```

### Parámetros
- `-o`, `--output`: Archivo SRT de salida
- `-l`, `--language`: Idioma (es, en, pt, fr, etc.)
- `-m`, `--model`: Modelo de Whisper (tiny, base, small, medium, large)

### Modelos
| Modelo | Tamaño | Velocidad | Precisión |
|--------|--------|-----------|-----------|
| tiny | 39 MB | Rápido | Baja |
| base | 74 MB | Normal | Media |
| small | 244 MB | Lento | Buena |
| medium | 769 MB | Muy lento | Muy buena |
| large | 1550 MB | Extremo | Excelente |

## Archivos
- `subtitles.bat` - Ejecutable rápido
- `scripts/subtitles.py` - Script principal
- `output/` - Subtítulos generados
