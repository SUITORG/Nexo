"""
SuitSubtitles - Generador de subtítulos SRT
Usa Whisper para transcribir audio y generar subtítulos.
"""
import sys
import os
import argparse
import subprocess
from pathlib import Path


def check_whisper():
    """Check if Whisper is installed."""
    try:
        result = subprocess.run(["whisper", "--help"], capture_output=True, timeout=5)
        return True
    except (subprocess.TimeoutExpired, FileNotFoundError):
        return False


def install_whisper():
    """Install Whisper."""
    print("Instalando Whisper...")
    os.system("pip install openai-whisper")


def format_timestamp(seconds):
    """Convert seconds to SRT timestamp format."""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millis = int((seconds % 1) * 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"


def generate_subtitles(audio_path, output_path=None, language="es", model="base"):
    """Generate SRT subtitles from audio file."""
    if not check_whisper():
        install_whisper()

    if output_path is None:
        output_path = Path(audio_path).with_suffix(".srt")

    print(f"Audio: {audio_path}")
    print(f"Idioma: {language}")
    print(f"Modelo: {model}")
    print(f"\nTranscribiendo...\n")

    try:
        import whisper

        print(f"Cargando modelo {model}...")
        whisper_model = whisper.load_model(model)

        print("Transcribiendo audio...")
        result = whisper_model.transcribe(audio_path, language=language)

        srt_content = ""
        for i, segment in enumerate(result["segments"], 1):
            start = format_timestamp(segment["start"])
            end = format_timestamp(segment["end"])
            text = segment["text"].strip()
            srt_content += f"{i}\n{start} --> {end}\n{text}\n\n"

        with open(output_path, "w", encoding="utf-8") as f:
            f.write(srt_content)

        print(f"¡Listo! Subtítulos guardados en: {output_path}")
        return True

    except Exception as e:
        print(f"Error: {e}")
        return False


def main():
    parser = argparse.ArgumentParser(description="SuitSubtitles - Generador de Subtítulos")
    parser.add_argument("audio", help="Archivo de audio (mp3, wav, etc.)")
    parser.add_argument("-o", "--output", help="Archivo SRT de salida")
    parser.add_argument("-l", "--language", default="es", help="Idioma (es, en, pt, fr)")
    parser.add_argument("-m", "--model", default="base",
                       choices=["tiny", "base", "small", "medium", "large"],
                       help="Modelo de Whisper (tiny=rapido, large=preciso)")

    args = parser.parse_args()

    if not os.path.exists(args.audio):
        print(f"Error: No se encontró el archivo {args.audio}")
        sys.exit(1)

    output_path = args.output
    if output_path is None:
        output_dir = Path(__file__).parent.parent / "output"
        output_dir.mkdir(exist_ok=True)
        output_path = output_dir / Path(args.audio).with_suffix(".srt").name

    print("=== SuitSubtitles ===")
    success = generate_subtitles(args.audio, output_path, args.language, args.model)

    if not success:
        sys.exit(1)


if __name__ == "__main__":
    main()
