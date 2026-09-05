#!/usr/bin/env python3
"""
ViCap — Ejemplo pro: video de meditación de 8 minutos con CapCut MCP.
Genera un draft completo que se puede abrir en CapCut o exportar a MP4.

Uso: python vicap_meditation.py
"""
import sys
import os
import time
import subprocess
import urllib.request

# Fix Windows console encoding for emojis
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

# Agregar directorio del MCP al path
MCP_DIR = os.path.join(os.path.dirname(__file__), '..', 'vectcutapi-mcp')
sys.path.insert(0, os.path.abspath(MCP_DIR))

from create_draft import get_or_create_draft
from add_image_impl import add_image_impl
from add_text_impl import add_text_impl
from add_audio_track import add_audio_track
from save_draft_impl import save_draft_impl
from export_video_impl import export_video_impl

# ─── Configuración ───────────────────────────────────────────────────
WIDTH = 1080
HEIGHT = 1920
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), 'output')
os.makedirs(OUTPUT_DIR, exist_ok=True)

# ─── Prompts de imágenes (Pollinations + flux) ──────────────────────
PROMPTS = {
    "intro": "professional commercial photography, photorealistic, 8k, soft studio lighting, serene human silhouette meditating in lotus pose at sunrise on calm ocean shoreline, golden hour light reflecting on gentle wet sand, soft mist rising from water, cinematic lighting, tranquil atmosphere, shot on 85mm lens f/1.8, no text, no logos",
    "meditation": "professional commercial photography, photorealistic, 8k, macro glowing golden light emitting from human chest area in dark peaceful room, minimalist aesthetic, ethereal particles floating in air, high-contrast cinematic depth, ultra-fine texture, no text, no logos",
    "reflection": "professional commercial photography, photorealistic, 8k, dewdrop resting on vibrant green leaf at dawn, perfectly reflecting morning sun, symbolizing awareness and appreciation, soft bokeh background, sharp focus, natural colors, no text, no logos",
    "conclusion": "professional commercial photography, photorealistic, 8k, peaceful sunrise over calm ocean, golden light rays through soft clouds, silhouette of person standing at water's edge, serene atmosphere, cinematic composition, no text, no logos",
}

def pollinations_url(prompt, w=1080, h=1920):
    """Genera URL de Pollinations con model=flux."""
    import random, urllib.parse
    seed = random.randint(0, 999999)
    encoded = urllib.parse.quote(prompt)
    return f"https://image.pollinations.ai/prompt/{encoded}?width={w}&height={h}&seed={seed}&model=flux&nofeed=true&nojson=true"

def generate_tts(text, output_path, voice="es-MX-DaliaNeural"):
    """Genera audio TTS con Edge TTS."""
    print(f"  🔊 TTS: {text[:50]}...")
    result = subprocess.run(
        ['python', '-m', 'edge_tts', '--voice', voice, '--text', text, '--write-media', output_path],
        capture_output=True, timeout=60
    )
    if result.returncode == 0 and os.path.exists(output_path):
        print(f"  ✅ Audio: {os.path.basename(output_path)}")
        return output_path
    print(f"  ⚠️  Edge TTS falló, usando gTTS...")
    subprocess.run(
        ['python', '-c', f'from gtts import gTTS; gTTS("{text}", lang="es").save("{output_path}")'],
        capture_output=True, timeout=60
    )
    return output_path if os.path.exists(output_path) else None

def get_audio_duration(path):
    """Obtiene duración del audio con ffprobe."""
    result = subprocess.run(
        ['ffprobe', '-v', 'quiet', '-print_format', 'json', '-show_format', path],
        capture_output=True, timeout=10
    )
    if result.returncode == 0:
        import json
        info = json.loads(result.stdout)
        return float(info['format']['duration'])
    return 5.0

# ─── Guion de meditación ────────────────────────────────────────────
SCENES = [
    {
        "id": "intro",
        "image_key": "intro",
        "start": 0, "end": 90,
        "title": "Gratitud y Apreciación",
        "subtitle": "Inspiración: Deepak Chopra",
        "narration": "Ponte cómodo. Ajusta tus audífonos o la intensidad del volumen a un nivel donde te sientas completamente a gusto. Permite que tu cuerpo se libere de cualquier tensión. La gratitud no es solo una emoción; es un campo de infinitas posibilidades que reconfigura tu biología y eleva tu conciencia. Hoy nos conectaremos con la gratitud para alinearnos con el flujo natural del universo. Toma una respiración profunda... inhala el momento presente, exhala cualquier resistencia.",
    },
    {
        "id": "meditation",
        "image_key": "meditation",
        "start": 90, "end": 330,
        "title": "Meditación Guiada",
        "subtitle": None,
        "narration": "Cierra los ojos. Lleva la atención a tu corazón. Siente el latido de tu pecho como un milagro silencioso que ocurre sin tu esfuerzo consciente. Reconoce que existes aquí y ahora, interconectado con todo lo que te rodea. Esto es la verdadera gratitud: la conciencia pura de estar vivo. Con cada inhalación, visualiza una luz dorada en tu centro que se expande. Agradece a tu cuerpo por su sabiduría, a tu mente por su capacidad de aprender y a tu espíritu por su resiliencia. Deja que este estado de gratitud disuelva la escasez y abra paso a la abundancia. Repite mentalmente: En este instante, reconozco el valor de mi ser y mi unión con el cosmos.",
    },
    {
        "id": "reflection",
        "image_key": "reflection",
        "start": 330, "end": 420,
        "title": "Pausa de Reflexión",
        "subtitle": "Silencio interior",
        "narration": None,  # Solo música, sin narración
    },
    {
        "id": "conclusion",
        "image_key": "conclusion",
        "start": 420, "end": 480,
        "title": "Conclusión",
        "subtitle": None,
        "narration": "Mueve lentamente los dedos de las manos y los pies. Regresa suavemente a tu entorno trayendo contigo esta frecuencia de gratitud. Abre los ojos cuando estés listo.",
    },
]

def main():
    print("🎬 ViCap — Video de Meditación con CapCut MCP\n")

    # 1. Crear draft
    print("📁 Creando draft...")
    draft_id, script = get_or_create_draft(width=WIDTH, height=HEIGHT)
    print(f"  ✅ Draft: {draft_id}\n")

    # 2. Generar TTS para cada escena
    print("🔊 Generando narración TTS...")
    tts_files = {}
    for scene in SCENES:
        if scene["narration"]:
            tts_path = os.path.join(OUTPUT_DIR, f"tts_{scene['id']}.mp3")
            generate_tts(scene["narration"], tts_path)
            tts_files[scene["id"]] = tts_path
            time.sleep(1)  # Rate limit
    print()

    # 3. Agregar elementos al draft
    print("🎨 Agregando elementos al draft...")
    for scene in SCENES:
        sid = scene["id"]
        start = scene["start"]
        end = scene["end"]
        duration = end - start

        # Imagen de fondo
        img_url = pollinations_url(PROMPTS[scene["image_key"]])
        print(f"  📸 {sid}: imagen ({duration}s)")
        add_image_impl(
            image_url=img_url,
            draft_id=draft_id,
            start=start, end=end,
            width=WIDTH, height=HEIGHT,
            scale_x=1.05, scale_y=1.05,  # Zoom sutil
        )

        # Título principal
        print(f"  📝 {sid}: título")
        add_text_impl(
            text=scene["title"],
            start=start + 2, end=min(start + 8, end),
            draft_id=draft_id,
            font_size=56, font_color="#ffffff",
            shadow_enabled=True,
            shadow_color="#000000",
            shadow_alpha=0.8,
            shadow_distance=4,
            transform_y=-0.3,
            track_name=f"title_{sid}",
            width=WIDTH, height=HEIGHT,
        )

        # Subtítulo (si existe, en pista separada)
        if scene.get("subtitle"):
            print(f"  📝 {sid}: subtítulo")
            add_text_impl(
                text=scene["subtitle"],
                start=start + 3, end=min(start + 8, end),
                draft_id=draft_id,
                font_size=28, font_color="#B3FFFFFF",
                shadow_enabled=True,
                shadow_color="#000000",
                shadow_alpha=0.5,
                shadow_distance=2,
                transform_y=-0.15,
                track_name=f"subtitle_{sid}",
                width=WIDTH, height=HEIGHT,
            )

        # Audio de narración (si existe)
        if sid in tts_files:
            print(f"  🔊 {sid}: narración")
            add_audio_track(
                audio_url=tts_files[sid],
                draft_id=draft_id,
                start=0, end=duration,
                target_start=start,
                volume=1.0,
                track_name=f"voice_{sid}",
            )

    # 4. Guardar draft (abrible en CapCut)
    print("\n💾 Guardando draft...")
    save_result = save_draft_impl(draft_id=draft_id)
    draft_url = save_result.get("draft_url", "N/A") if isinstance(save_result, dict) else "N/A"
    print(f"  ✅ Draft guardado: {draft_url}")

    # 5. Exportar a MP4
    print("\n🎥 Exportando a MP4...")
    output_path = os.path.join(OUTPUT_DIR, f"meditacion_gratitud.mp4")
    export_result = export_video_impl(
        draft_id=draft_id,
        output_path=output_path,
        fps=30,
    )

    if isinstance(export_result, dict) and export_result.get("success"):
        final_path = export_result.get("output_path", output_path)
        print(f"\n{'='*60}")
        print(f"✅ VIDEO EXPORTADO EXITOSAMENTE")
        print(f"{'='*60}")
        print(f"📁 Archivo: {final_path}")
        print(f"📐 Resolución: {WIDTH}x{HEIGHT}")
        print(f"⏱️  Duración: ~{SCENES[-1]['end']//60} minutos")
        print(f"{'='*60}")
    else:
        error = export_result.get("error", "Unknown") if isinstance(export_result, dict) else str(export_result)
        print(f"\n⚠️  Export falló: {error}")
        print(f"   El draft está guardado — ábrelo en CapCut para exportar manualmente.")

    print(f"\n📋 Rutas:")
    print(f"   Draft:   {draft_url}")
    print(f"   MP4:     {output_path}")
    print(f"   TTS:     {OUTPUT_DIR}/tts_*.mp3")
    print(f"   Imágenes: descargadas durante el export")

if __name__ == "__main__":
    main()
