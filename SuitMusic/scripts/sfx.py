"""
SuitMusic - Generador de efectos de sonido puntuales
Sintetiza clips cortos (Whoosh/Glitch/Pop/Bass drop) con numpy y soundfile,
mismo enfoque que music.py (tonos + envolvente), sin dependencias nuevas.
"""
import sys
import os
import re
import argparse
import numpy as np
import soundfile as sf
from pathlib import Path


def _envelope(t, attack=0.01, decay=8):
    """Ataque rápido + caída exponencial."""
    env = np.minimum(t / attack, 1.0)
    env *= np.exp(-t * decay)
    return env


def generate_whoosh(sr=44100, duration=0.4):
    t = np.linspace(0, duration, int(sr * duration), False)
    freq = np.linspace(2000, 200, len(t))
    phase = 2 * np.pi * np.cumsum(freq) / sr
    tone = np.sin(phase)
    noise = np.random.uniform(-1, 1, len(t)) * 0.4
    signal = tone * 0.6 + noise
    return signal * _envelope(t, attack=0.05, decay=5) * 0.5


def generate_glitch(sr=44100, duration=0.25):
    t = np.linspace(0, duration, int(sr * duration), False)
    stutter = np.sign(np.sin(2 * np.pi * 60 * t))
    tone = np.sin(2 * np.pi * 1200 * t) * stutter
    noise = np.random.uniform(-1, 1, len(t))
    signal = tone * 0.5 + noise * 0.3
    return signal * _envelope(t, attack=0.005, decay=6) * 0.5


def generate_pop(sr=44100, duration=0.12):
    t = np.linspace(0, duration, int(sr * duration), False)
    freq = np.linspace(900, 300, len(t))
    phase = 2 * np.pi * np.cumsum(freq) / sr
    tone = np.sin(phase)
    return tone * _envelope(t, attack=0.002, decay=25) * 0.6


def generate_bass_drop(sr=44100, duration=0.5):
    t = np.linspace(0, duration, int(sr * duration), False)
    freq = np.linspace(180, 40, len(t))
    phase = 2 * np.pi * np.cumsum(freq) / sr
    tone = np.sin(phase)
    return tone * _envelope(t, attack=0.02, decay=4) * 0.7


GENERATORS = {
    "whoosh": generate_whoosh,
    "glitch": generate_glitch,
    "pop": generate_pop,
    "bassdrop": generate_bass_drop,
}


def resolve_tipo(tipo):
    """Tolera variantes de formato: 'Bass drop', 'bass_drop', 'BASS-DROP', etc."""
    key = re.sub(r"[^a-z]", "", (tipo or "").lower())
    return GENERATORS.get(key)


def main():
    parser = argparse.ArgumentParser(description="SuitMusic - Generador de SFX")
    parser.add_argument("-o", "--output", required=True, help="Archivo de salida (.wav)")
    parser.add_argument("-t", "--tipo", required=True,
                         help="Whoosh | Glitch | Pop | Bass drop")
    args = parser.parse_args()

    generator = resolve_tipo(args.tipo)
    if generator is None:
        print(f"[SuitMusic/sfx] Tipo de sfx desconocido: '{args.tipo}' — no se genera archivo.")
        sys.exit(1)

    audio, sr = generator(), 44100
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    sf.write(str(output_path), audio, sr)
    print(f"[SuitMusic/sfx] '{args.tipo}' guardado en: {output_path}")


if __name__ == "__main__":
    main()
