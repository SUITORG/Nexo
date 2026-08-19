# SuitVideoAssembly

Ensambla video final combinando imágenes, voz, música y subtítulos.

## Requisitos
- FFmpeg instalado y en PATH

## Uso Rápido

### Windows
Doble clic en `assembly.bat` o ejecuta:
```bash
assembly.bat -i images/ -v voice.mp3
```

### Terminal
```bash
cd SuitVideoAssembly
python scripts\assembly.py -i images/ -v voice.mp3
```

### Opciones
```bash
python scripts\assembly.py -i images/ -v voice.mp3 -m music.wav -s subtitles.srt -o video_final.mp4
```

### Parámetros
- `-i`, `--images`: Carpeta con imágenes (requerido)
- `-v`, `--voice`: Archivo de voz (requerido)
- `-m`, `--music`: Archivo de música de fondo (opcional)
- `-s`, `--srt`: Archivo de subtítulos SRT (opcional)
- `-o`, `--output`: Archivo de salida (default: final_video.mp4)

## Ejemplo Completo
```bash
python scripts\assembly.py ^
  -i "C:\mis\imagenes" ^
  -v "C:\mi\voz.mp3" ^
  -m "C:\mi\musica.wav" ^
  -s "C:\mis\subtitulos.srt" ^
  -o "C:\mi\video_final.mp4"
```

## Archivos
- `assembly.bat` - Ejecutable rápido
- `scripts/assembly.py` - Script principal
- `output/` - Videos generados
