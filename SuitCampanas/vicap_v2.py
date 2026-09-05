#!/usr/bin/env python3
"""
ViCap v2 — Video de meditación con Pexels + efectos + favicon animado.
"""
import sys
import os
import io
import time
import subprocess
import json
import urllib.request
import urllib.parse

if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

MCP_DIR = os.path.join(os.path.dirname(__file__), '..', 'vectcutapi-mcp')
sys.path.insert(0, os.path.abspath(MCP_DIR))

from create_draft import get_or_create_draft
from add_image_impl import add_image_impl
from add_text_impl import add_text_impl
from add_audio_track import add_audio_track
from add_effect_impl import add_effect_impl
from add_video_keyframe_impl import add_video_keyframe_impl
from save_draft_impl import save_draft_impl
from export_video_impl import export_video_impl

WIDTH = 1080
HEIGHT = 1920
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), 'output')
os.makedirs(OUTPUT_DIR, exist_ok=True)

# ─── Pexels: buscar imágenes por keyword ─────────────────────────────
PEXELS_API_KEY = os.environ.get('PEXELS_API_KEY', '')

def pexels_search(query, per_page=5):
    """Busca imágenes en Pexels y retorna lista de URLs."""
    if not PEXELS_API_KEY:
        print("  ⚠️  PEXELS_API_KEY no configurada, usando URLs de ejemplo")
        return pexels_demo_urls(query)
    
    url = f"https://api.pexels.com/v1/search?query={urllib.parse.quote(query)}&per_page={per_page}&orientation=portrait"
    req = urllib.request.Request(url, headers={'Authorization': PEXELS_API_KEY})
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read())
            return [p['src']['large2x'] for p in data.get('photos', [])]
    except Exception as e:
        print(f"  ⚠️  Pexels API error: {e}")
        return pexels_demo_urls(query)

def pexels_demo_urls(query):
    """URLs de demo de Pexels para meditación (imágenes públicas conocidas)."""
    demos = {
        "meditation": [
            "https://images.pexels.com/photos/3822622/pexels-photo-3822622.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
            "https://images.pexels.com/photos/3560044/pexels-photo-3560044.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        ],
        "golden light": [
            "https://images.pexels.com/photos/3617500/pexels-photo-3617500.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
            "https://images.pexels.com/photos/2832034/pexels-photo-2832034.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        ],
        "dewdrop nature": [
            "https://images.pexels.com/photos/1470774/pexels-photo-1470774.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
            "https://images.pexels.com/photos/1103970/pexels-photo-1103970.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        ],
        "sunrise ocean": [
            "https://images.pexels.com/photos/1032650/pexels-photo-1032650.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
            "https://images.pexels.com/photos/1434580/pexels-photo-1434580.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        ],
    }
    for key, urls in demos.items():
        if key.lower() in query.lower():
            return urls
    return demos["meditation"]

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

# ─── Guion ───────────────────────────────────────────────────────────
SCENES = [
    {
        "id": "intro",
        "search": "meditation sunrise ocean",
        "start": 0, "end": 90,
        "title": "Gratitud y Apreciación",
        "subtitle": "Inspiración: Deepak Chopra",
        "narration": "Ponte cómodo. Ajusta tus audífonos o la intensidad del volumen a un nivel donde te sientas completamente a gusto. Permite que tu cuerpo se libere de cualquier tensión. La gratitud no es solo una emoción; es un campo de infinitas posibilidades que reconfigura tu biología y eleva tu conciencia. Hoy nos conectaremos con la gratitud para alinearnos con el flujo natural del universo. Toma una respiración profunda... inhala el momento presente, exhala cualquier resistencia.",
        "effect": ("Bloom", "scene"),  # Efecto 1: Bloom suave
    },
    {
        "id": "meditation",
        "search": "golden light spiritual",
        "start": 90, "end": 330,
        "title": "Meditación Guiada",
        "subtitle": None,
        "narration": "Cierra los ojos. Lleva la atención a tu corazón. Siente el latido de tu pecho como un milagro silencioso que ocurre sin tu esfuerzo consciente. Reconoce que existes aquí y ahora, interconectado con todo lo que te rodea. Esto es la verdadera gratitud: la conciencia pura de estar vivo. Con cada inhalación, visualiza una luz dorada en tu centro que se expande. Agradece a tu cuerpo por su sabiduría, a tu mente por su capacidad de aprender y a tu espíritu por su resiliencia. Deja que este estado de gratitud disuelva la escasez y abra paso a la abundancia. Repite mentalmente: En este instante, reconozco el valor de mi ser y mi unión con el cosmos.",
        "effect": ("Particle", "scene"),  # Efecto 2: Partículas
    },
    {
        "id": "reflection",
        "search": "dewdrop nature leaf",
        "start": 330, "end": 420,
        "title": "Pausa de Reflexión",
        "subtitle": "Silencio interior",
        "narration": None,
        "effect": ("Soft", "scene"),  # Efecto 3: Soft/difuminado
    },
    {
        "id": "conclusion",
        "search": "sunrise ocean peaceful",
        "start": 420, "end": 475,
        "title": "Conclusión",
        "subtitle": None,
        "narration": "Mueve lentamente los dedos de las manos y los pies. Regresa suavemente a tu entorno trayendo contigo esta frecuencia de gratitud. Abre los ojos cuando estés listo.",
        "effect": None,
    },
]

OUTRO_DURATION = 5  # Favicon animado al final

def main():
    print("🎬 ViCap v2 — Video de Meditación (Pexels + Efectos + Favicon)\n")

    # 1. Crear draft
    print("📁 Creando draft...")
    draft_id, script = get_or_create_draft(width=WIDTH, height=HEIGHT)
    print(f"  ✅ Draft: {draft_id}\n")

    # 2. Generar TTS
    print("🔊 Generando narración TTS...")
    tts_files = {}
    for scene in SCENES:
        if scene["narration"]:
            tts_path = os.path.join(OUTPUT_DIR, f"tts_{scene['id']}.mp3")
            generate_tts(scene["narration"], tts_path)
            tts_files[scene["id"]] = tts_path
            time.sleep(1)
    print()

    # 3. Agregar elementos
    print("🎨 Agregando elementos al draft...\n")
    for scene in SCENES:
        sid = scene["id"]
        start = scene["start"]
        end = scene["end"]
        duration = end - start

        # Buscar imagen en Pexels
        print(f"  📸 {sid}: buscando en Pexels...")
        pexels_urls = pexels_search(scene["search"])
        img_url = pexels_urls[0] if pexels_urls else None
        
        if img_url:
            print(f"  📸 {sid}: imagen ({duration}s)")
            add_image_impl(
                image_url=img_url,
                draft_id=draft_id,
                start=start, end=end,
                width=WIDTH, height=HEIGHT,
                scale_x=1.05, scale_y=1.05,
            )
        else:
            print(f"  ⚠️  {sid}: sin imagen")

        # Título
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

        # Subtítulo
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

        # Audio
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

        # Efecto (si existe)
        if scene.get("effect"):
            effect_name, effect_cat = scene["effect"]
            print(f"  ✨ {sid}: efecto '{effect_name}'")
            try:
                add_effect_impl(
                    effect_type=effect_name,
                    effect_category=effect_cat,
                    start=start, end=end,
                    draft_id=draft_id,
                    track_name=f"effect_{sid}",
                    width=WIDTH, height=HEIGHT,
                )
            except Exception as e:
                print(f"  ⚠️  {sid}: efecto '{effect_name}' no disponible: {e}")

        print()

    # ─── Favicon animado (outro) ─────────────────────────────────────
    outro_start = SCENES[-1]["end"]
    outro_end = outro_start + OUTRO_DURATION
    
    print("🎬 Favicon animado (outro)...")
    
    # Fondo del outro
    add_image_impl(
        image_url="https://images.pexels.com/photos/1032650/pexels-photo-1032650.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        draft_id=draft_id,
        start=outro_start, end=outro_end,
        width=WIDTH, height=HEIGHT,
        scale_x=1.2, scale_y=1.2,
    )

    # Logo "V" animado
    add_text_impl(
        text="V",
        start=outro_start + 0.5, end=outro_end,
        draft_id=draft_id,
        font_size=120, font_color="#7c3aed",
        shadow_enabled=True,
        shadow_color="#000000",
        shadow_alpha=0.6,
        shadow_distance=6,
        transform_y=-0.15,
        track_name="outro_logo",
        width=WIDTH, height=HEIGHT,
    )

    # Texto del favicon
    add_text_impl(
        text="SuitCampanas",
        start=outro_start + 1, end=outro_end,
        draft_id=draft_id,
        font_size=36, font_color="#ffffff",
        shadow_enabled=True,
        shadow_color="#000000",
        shadow_alpha=0.5,
        shadow_distance=3,
        transform_y=0.05,
        track_name="outro_brand",
        width=WIDTH, height=HEIGHT,
    )

    # Efecto de brillo en el outro
    try:
        add_effect_impl(
            effect_type="Bloom",
            effect_category="scene",
            start=outro_start, end=outro_end,
            draft_id=draft_id,
            track_name="effect_outro",
            width=WIDTH, height=HEIGHT,
        )
        print("  ✨ Efecto Bloom en outro")
    except:
        pass

    # Keyframe: zoom out sutil en el logo
    try:
        add_video_keyframe_impl(
            draft_id=draft_id,
            track_name="outro_logo",
            property_type="uniform_scale",
            time=outro_start + 0.5,
            value="0.5",
        )
        add_video_keyframe_impl(
            draft_id=draft_id,
            track_name="outro_logo",
            property_type="uniform_scale",
            time=outro_start + 2,
            value="1.0",
        )
        print("  🎯 Keyframe: zoom in en logo")
    except Exception as e:
        print(f"  ⚠️  Keyframe error: {e}")

    # 4. Guardar draft
    print("\n💾 Guardando draft...")
    save_result = save_draft_impl(draft_id=draft_id)
    draft_url = save_result.get("draft_url", "N/A") if isinstance(save_result, dict) else "N/A"
    print(f"  ✅ Draft guardado: {draft_url}")

    # 5. Exportar
    print("\n🎥 Exportando a MP4...")
    output_path = os.path.join(OUTPUT_DIR, "meditacion_gratitud_v2.mp4")
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
        print(f"⏱️  Duración: ~{(outro_end)//60} minutos")
        print(f"📸 Imágenes: Pexels (no Pollinations)")
        print(f"✨ Efectos: Bloom, Particle, Soft")
        print(f"🎬 Outro: Favicon animado con logo V")
        print(f"{'='*60}")
    else:
        error = export_result.get("error", "Unknown") if isinstance(export_result, dict) else str(export_result)
        print(f"\n⚠️  Export falló: {error}")

    print(f"\n📋 Rutas:")
    print(f"   MP4:     {output_path}")
    print(f"   Draft:   {draft_url}")
    print(f"   TTS:     {OUTPUT_DIR}/tts_*.mp3")

if __name__ == "__main__":
    main()
