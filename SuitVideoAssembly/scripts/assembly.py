"""
SuitVideoAssembly - Ensambla video final
Combina imágenes, voz, música y subtítulos en un video MP4.
"""
import sys
import os
import argparse
import subprocess
import json
from pathlib import Path


def get_audio_duration(audio_path):
    """Get duration of audio file in seconds."""
    cmd = [
        "ffprobe", "-v", "quiet", "-print_format", "json",
        "-show_format", str(audio_path)
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    data = json.loads(result.stdout)
    return float(data["format"]["duration"])


def create_video_from_image(image_path, duration, output_path, fps=24):
    """Create video from single image."""
    cmd = [
        "ffmpeg", "-y",
        "-loop", "1",
        "-i", str(image_path),
        "-c:v", "libx264",
        "-t", str(duration),
        "-pix_fmt", "yuv420p",
        "-vf", f"scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2",
        "-r", str(fps),
        str(output_path)
    ]
    subprocess.run(cmd, capture_output=True, text=True)
    return output_path


def create_slideshow(images_dir, duration_per_image, output_path, fps=24):
    """Create slideshow from directory of images."""
    images_dir = Path(images_dir)
    images = sorted(images_dir.glob("*.png")) + sorted(images_dir.glob("*.jpg"))

    if not images:
        print(f"No se encontraron imágenes en {images_dir}")
        return None

    print(f"Encontradas {len(images)} imágenes")

    output_path = Path(output_path)
    concat_file = output_path.parent / "concat.txt"
    
    with open(concat_file, "w", encoding="utf-8") as f:
        for img in images:
            temp_video = output_path.parent / f"temp_{img.stem}.mp4"
            create_video_from_image(str(img), duration_per_image, str(temp_video), fps)
            f.write(f"file '{temp_video}'\n")

    cmd = [
        "ffmpeg", "-y",
        "-f", "concat", "-safe", "0",
        "-i", str(concat_file),
        "-c", "copy",
        str(output_path)
    ]
    subprocess.run(cmd, capture_output=True, text=True)

    # Clean up temp files but not the final slideshow
    for temp in output_path.parent.glob("temp_scene_*.mp4"):
        temp.unlink()
    concat_file.unlink()

    return output_path


def combine_video_audio(video_path, voice_path, music_path, output_path, music_volume=0.3):
    """Combine video with voice and background music."""
    if music_path and Path(music_path).exists():
        cmd = [
            "ffmpeg", "-y",
            "-i", str(video_path),
            "-i", str(voice_path),
            "-i", str(music_path),
            "-filter_complex",
            f"[1:a]aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=mono[voice];"
            f"[2:a]aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=mono,"
            f"volume={music_volume}[music];"
            f"[voice][music]amix=inputs=2:duration=first[aout]",
            "-map", "0:v", "-map", "[aout]",
            "-c:v", "copy", "-c:a", "aac",
            "-shortest",
            str(output_path)
        ]
    else:
        cmd = [
            "ffmpeg", "-y",
            "-i", str(video_path),
            "-i", str(voice_path),
            "-map", "0:v", "-map", "1:a",
            "-c:v", "copy", "-c:a", "aac",
            "-shortest",
            str(output_path)
        ]

    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"Error: {result.stderr}")
        return None
    return output_path


def add_subtitles(video_path, srt_path, output_path):
    """Add subtitles to video."""
    srt_path_escaped = str(srt_path).replace("\\", "/").replace(":", "\\:")

    cmd = [
        "ffmpeg", "-y",
        "-i", str(video_path),
        "-vf", f"subtitles='{srt_path_escaped}':force_style='FontSize=24,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,Outline=2'",
        "-c:a", "copy",
        str(output_path)
    ]

    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"Error adding subtitles: {result.stderr}")
        return video_path
    return output_path


def assemble_video(images_dir, voice_path, music_path=None, srt_path=None, output_path="final_video.mp4"):
    """Assemble complete video from components."""
    images_dir = Path(images_dir).resolve()
    voice_path = Path(voice_path).resolve()
    output_path = Path(output_path).resolve()
    output_dir = output_path.parent
    output_dir.mkdir(exist_ok=True)

    print("=== SuitVideoAssembly ===\n")

    # Step 1: Get voice duration
    print("1. Obteniendo duración del audio...")
    voice_duration = get_audio_duration(str(voice_path))
    print(f"   Duración: {voice_duration:.1f}s\n")

    # Step 2: Create slideshow
    print("2. Creando slideshow de imágenes...")
    images = list(images_dir.glob("*.png")) + list(images_dir.glob("*.jpg"))
    duration_per_image = voice_duration / max(len(images), 1)
    temp_video = output_dir / "temp_slideshow.mp4"
    create_slideshow(str(images_dir), duration_per_image, str(temp_video))
    print(f"   Slideshow creado: {temp_video}\n")

    # Step 3: Combine with audio
    print("3. Combinando video con audio...")
    temp_with_audio = output_dir / "temp_with_audio.mp4"
    combine_video_audio(str(temp_video), str(voice_path), music_path, str(temp_with_audio))
    print(f"   Audio combinado\n")

    # Step 4: Add subtitles if provided
    if srt_path and Path(srt_path).exists():
        print("4. Agregando subtítulos...")
        add_subtitles(str(temp_with_audio), srt_path, str(output_path))
        print(f"   Subtítulos agregados\n")
    else:
        print("4. Sin subtítulos, omitiendo...\n")
        import shutil
        shutil.copy(str(temp_with_audio), str(output_path))

    # Cleanup
    for temp in [temp_video, temp_with_audio]:
        if temp.exists():
            temp.unlink()

    print(f"[OK] Video final: {output_path}")
    return output_path


def main():
    parser = argparse.ArgumentParser(description="SuitVideoAssembly - Ensambla Video Final")
    parser.add_argument("-i", "--images", required=True, help="Carpeta con imágenes")
    parser.add_argument("-v", "--voice", required=True, help="Archivo de voz (mp3/wav)")
    parser.add_argument("-m", "--music", help="Archivo de música de fondo (mp3/wav)")
    parser.add_argument("-s", "--srt", help="Archivo de subtítulos SRT")
    parser.add_argument("-o", "--output", default="final_video.mp4", help="Archivo de salida")

    args = parser.parse_args()

    if not Path(args.images).is_dir():
        print(f"Error: No se encontró la carpeta {args.images}")
        sys.exit(1)

    if not Path(args.voice).exists():
        print(f"Error: No se encontró el archivo {args.voice}")
        sys.exit(1)

    assemble_video(args.images, args.voice, args.music, args.srt, args.output)


if __name__ == "__main__":
    main()
