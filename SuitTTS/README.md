# SuitTTS

Genera audio MP3 a partir de texto usando gTTS (Google Text-to-Speech).

## Instalación
```bash
pip install gTTS
```

## Uso Rápido

### Windows
Doble clic en `tts.bat` o ejecuta:
```bash
tts.bat "Hola, esto es una prueba"
```

### Terminal
```bash
cd SuitTTS
python scripts/tts.py "Hola mundo"
```

### Opciones
```bash
python scripts/tts.py "Hello world" -l en -o hello.mp3
python scripts/tts.py "Texto lento" --slow
python scripts/tts.py -f mi_texto.txt
```

### Parámetros
- `-o`, `--output`: Archivo de salida (default: output.mp3)
- `-l`, `--lang`: Idioma (es, en, pt, fr, etc.)
- `-s`, `--slow`: Velocidad lenta
- `-f`, `--file`: Leer desde archivo

## Idiomas Soportados
| Código | Idioma |
|--------|--------|
| es | Español |
| en | Inglés |
| pt | Portugués |
| fr | Francés |
| de | Alemán |
| it | Italiano |

## Archivos
- `tts.bat` - Ejecutable rápido
- `scripts/tts.py` - Script principal
- `output/` - Audios generados
