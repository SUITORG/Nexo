"""
SuitTTS - Text to Speech con gTTS (Google Text-to-Speech)
Genera audio MP3 a partir de texto.
"""
import sys
import os
import argparse
from pathlib import Path

try:
    from gtts import gTTS
except ImportError:
    print("Instalando gTTS...")
    os.system("pip install gTTS")
    from gtts import gTTS


def text_to_speech(text, output_path="output.mp3", lang="es", slow=False):
    """Convert text to speech and save as MP3."""
    try:
        tts = gTTS(text=text, lang=lang, slow=slow)
        tts.save(output_path)
        print(f"Audio guardado en: {output_path}")
        return True
    except Exception as e:
        print(f"Error: {e}")
        return False


def main():
    parser = argparse.ArgumentParser(description="SuitTTS - Texto a Voz")
    parser.add_argument("text", nargs="?", help="Texto a convertir")
    parser.add_argument("-o", "--output", default="output.mp3", help="Archivo de salida")
    parser.add_argument("-l", "--lang", default="es", help="Idioma (es, en, pt, fr)")
    parser.add_argument("-s", "--slow", action="store_true", help="Velocidad lenta")
    parser.add_argument("-f", "--file", help="Leer texto desde archivo")

    args = parser.parse_args()

    if args.file:
        with open(args.file, "r", encoding="utf-8") as f:
            text = f.read()
    elif args.text:
        text = args.text
    else:
        print("=== SuitTTS ===")
        print("Escribe tu texto (presiona Enter dos veces para procesar):")
        lines = []
        while True:
            line = input()
            if line == "":
                break
            lines.append(line)
        text = "\n".join(lines)

    if not text.strip():
        print("Error: No se proporcionó texto")
        sys.exit(1)

    output_dir = Path(__file__).parent.parent / "output"
    output_dir.mkdir(exist_ok=True)

    output_path = output_dir / args.output if not os.path.isabs(args.output) else args.output

    print(f"\nTextos: {len(text)} caracteres")
    print(f"Idioma: {args.lang}")
    print(f"Generando audio...\n")

    success = text_to_speech(text, str(output_path), args.lang, args.slow)

    if success:
        print(f"\n¡Listo! Audio guardado en: {output_path}")
    else:
        sys.exit(1)


if __name__ == "__main__":
    main()
