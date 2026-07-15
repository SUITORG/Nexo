"""
SuitMusic - Generador de música de fondo
Genera pistas de audio con beats básicos usando numpy y soundfile.
"""
import sys
import os
import argparse
import numpy as np
import soundfile as sf
from pathlib import Path


def generate_tone(freq, duration, sr=44100, volume=0.3):
    """Generate a sine wave tone."""
    t = np.linspace(0, duration, int(sr * duration), False)
    tone = np.sin(2 * np.pi * freq * t)
    envelope = np.exp(-t * 10)
    return tone * envelope * volume


def generate_beat(bpm=120, duration_seconds=30, style="relaxing"):
    """Generate a simple beat track."""
    sr = 44100
    beat_duration = 60.0 / bpm
    total_samples = int(duration_seconds * sr)

    if style == "relaxing":
        kick_freq = 80
        hihat_freq = 8000
        snare_freq = 200
        volume = 0.2
    elif style == "energetic":
        kick_freq = 60
        hihat_freq = 10000
        snare_freq = 250
        volume = 0.3
    else:
        kick_freq = 100
        hihat_freq = 6000
        snare_freq = 180
        volume = 0.25

    kick = generate_tone(kick_freq, 0.05, sr, volume)
    hihat = generate_tone(hihat_freq, 0.02, sr, volume * 0.5)
    snare = generate_tone(snare_freq, 0.03, sr, volume * 0.7)

    output = np.zeros(total_samples)

    beat_samples = int(beat_duration * sr)
    pattern_length = 4 * beat_samples

    pattern = np.zeros(pattern_length)

    pattern[:len(kick)] += kick
    pattern[beat_samples:beat_samples + len(snare)] += snare
    pattern[2 * beat_samples:2 * beat_samples + len(kick)] += kick
    pattern[3 * beat_samples:3 * beat_samples + len(hihat)] += hihat

    num_patterns = total_samples // pattern_length + 1
    for i in range(num_patterns):
        start = i * pattern_length
        end = min(start + pattern_length, total_samples)
        output[start:end] += pattern[:end - start]

    output = output[:total_samples]

    fade_samples = min(sr * 2, total_samples // 4)
    fade_in = np.linspace(0, 1, fade_samples)
    fade_out = np.linspace(1, 0, fade_samples)
    output[:fade_samples] *= fade_in
    output[-fade_samples:] *= fade_out

    output = output / np.max(np.abs(output)) * 0.8

    return output, sr


def main():
    parser = argparse.ArgumentParser(description="SuitMusic - Generador de Música")
    parser.add_argument("-o", "--output", default="background.wav", help="Archivo de salida")
    parser.add_argument("-d", "--duration", type=int, default=30, help="Duración en segundos")
    parser.add_argument("-b", "--bpm", type=int, default=120, help="Beats por minuto")
    parser.add_argument("-s", "--style", choices=["relaxing", "energetic", "neutral"],
                       default="relaxing", help="Estilo de música")

    args = parser.parse_args()

    output_dir = Path(__file__).parent.parent / "output"
    output_dir.mkdir(exist_ok=True)

    output_path = output_dir / args.output if not os.path.isabs(args.output) else args.output

    print("=== SuitMusic ===")
    print(f"Duración: {args.duration}s")
    print(f"BPM: {args.bpm}")
    print(f"Estilo: {args.style}")
    print(f"\nGenerando música...\n")

    audio, sr = generate_beat(args.bpm, args.duration, args.style)
    sf.write(str(output_path), audio, sr)

    print(f"¡Listo! Música guardada en: {output_path}")


if __name__ == "__main__":
    main()
