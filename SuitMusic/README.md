# SuitMusic

Genera pistas de música de fondo con beats básicos.

## Instalación
```bash
pip install pydub
```

## Uso Rápido

### Windows
Doble clic en `music.bat` o ejecuta:
```bash
music.bat
```

### Terminal
```bash
cd SuitMusic
python scripts/music.py
```

### Opciones
```bash
python scripts/music.py -d 60 -b 120 -s relaxing
python scripts/music.py -o mi_musica.mp3 -d 30 -s energetic
```

### Parámetros
- `-o`, `--output`: Archivo de salida (default: background.mp3)
- `-d`, `--duration`: Duración en segundos (default: 30)
- `-b`, `--bpm`: Beats por minuto (default: 120)
- `-s`, `--style`: Estilo (relaxing, energetic, neutral)

## Archivos
- `music.bat` - Ejecutable rápido
- `scripts/music.py` - Script principal
- `output/` - Música generada
