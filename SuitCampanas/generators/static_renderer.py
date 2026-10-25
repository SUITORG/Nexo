#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Render determinista de una pieza estática de campaña (Post/Story) con Pillow.
No usa navegador ni IA: recibe un JSON con copy, paleta, logo y una imagen ya
resuelta (foto real del brief o fondo generado) y devuelve un PNG con layout
editorial limpio. Se usa desde local-server-node.js para las piezas de
campaña, donde Remotion por pieza era demasiado lento (~90s+).
"""
import argparse
import base64
import difflib
import io
import json
import os
import re
import unicodedata
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps

FONT_DIR = Path("C:/Windows/Fonts")
FONT_DISPLAY = FONT_DIR / "segoeuib.ttf"
FONT_BODY = FONT_DIR / "segoeui.ttf"
FONT_SEMI = FONT_DIR / "seguisb.ttf"
FONT_FALLBACK = FONT_DIR / "arialbd.ttf"


def clean_text(value):
    """Quita emojis (Pillow con Segoe UI no tiene glifo) y normaliza signos
    repetidos que el LLM a veces escribe ('¿¿¿Quién...', '!!!')."""
    text = str(value or "")
    text = re.sub(r"([¿¡!?])\1{1,}", r"\1", text)
    # Errores de conjugación frecuentes del copy generado por IA: el verbo
    # detrás de un modal va en infinitivo ("puedes agendar", no "puedes agenda").
    text = re.sub(r"\b(puedes|debes|quieres|necesitas)\s+agenda\b", r"\1 agendar", text, flags=re.I)
    text = re.sub(r"\bagenda\s+y\s+obtener\b", "agendar y obtener", text, flags=re.I)
    text = "".join(ch for ch in text if unicodedata.category(ch) != "So")
    return " ".join(text.split()).strip()


def load_font(path, size):
    for candidate in (path, FONT_DISPLAY, FONT_FALLBACK):
        try:
            return ImageFont.truetype(str(candidate), size=size)
        except Exception:
            continue
    return ImageFont.load_default()


def hex_rgb(value, fallback):
    value = (value or "").strip()
    if value.startswith("#"):
        value = value[1:]
    if len(value) == 3:
        value = "".join(c * 2 for c in value)
    if len(value) != 6:
        value = fallback.lstrip("#")
    try:
        return tuple(int(value[i:i + 2], 16) for i in (0, 2, 4))
    except Exception:
        f = fallback.lstrip("#")
        return tuple(int(f[i:i + 2], 16) for i in (0, 2, 4))


def load_image(source):
    if not source:
        return None
    try:
        if isinstance(source, str) and source.startswith("data:"):
            b64 = source.split(",", 1)[1]
            return Image.open(io.BytesIO(base64.b64decode(b64))).convert("RGBA")
        if isinstance(source, str) and os.path.exists(source):
            return Image.open(source).convert("RGBA")
    except Exception as exc:
        print(f"[static-render] imagen no disponible: {exc}")
    return None


def wrap_text(draw, text, font, max_width):
    words = str(text or "").split()
    lines, current = [], ""
    for word in words:
        test = (current + " " + word).strip()
        box = draw.textbbox((0, 0), test, font=font)
        if box[2] - box[0] <= max_width or not current:
            current = test
        else:
            lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def fit_headline(draw, text, max_width, max_height, start_size, min_size):
    size = start_size
    while size >= min_size:
        font = load_font(FONT_DISPLAY, size)
        lines = wrap_text(draw, text, font, max_width)
        line_h = int(size * 1.12)
        if len(lines) * line_h <= max_height:
            return font, lines, line_h
        size -= 4
    font = load_font(FONT_DISPLAY, min_size)
    return font, wrap_text(draw, text, font, max_width)[:3], int(min_size * 1.12)


def rounded_image(img, size, radius):
    fitted = ImageOps.fit(img.convert("RGB"), size, method=Image.Resampling.LANCZOS, centering=(0.5, 0.45))
    mask = Image.new("L", size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, size[0], size[1]), radius=radius, fill=255)
    out = Image.new("RGBA", size, (0, 0, 0, 0))
    out.paste(fitted, (0, 0), mask)
    return out


def draw_placeholder(canvas, box, accent, ink):
    x1, y1, x2, y2 = box
    w, h = x2 - x1, y2 - y1
    layer = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    d.rounded_rectangle(box, radius=32, fill=(*accent, 26))
    for i, (cx, cy, r) in enumerate([
        (x1 + int(w * 0.22), y1 + int(h * 0.30), int(min(w, h) * 0.18)),
        (x1 + int(w * 0.72), y1 + int(h * 0.58), int(min(w, h) * 0.26)),
        (x1 + int(w * 0.45), y1 + int(h * 0.82), int(min(w, h) * 0.12)),
    ]):
        d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=(*accent, 40 if i != 1 else 30))
    canvas.alpha_composite(layer)


def render(payload, output):
    W = int(payload.get("width") or 1080)
    H = int(payload.get("height") or 1920)
    brand = payload.get("brand") or {}
    bg = hex_rgb(brand.get("background"), "#F7FBFF")
    ink = hex_rgb(brand.get("ink"), "#0B1B2B")
    accent = hex_rgb(brand.get("accent"), "#00A3C4")

    canvas = Image.new("RGBA", (W, H), (*bg, 255))
    draw = ImageDraw.Draw(canvas)

    # Barra superior de marca
    draw.rectangle((0, 0, W, 10), fill=(*accent, 255))

    # Logo en chip blanco
    logo = load_image(payload.get("logo"))
    if logo:
        max_w, max_h = 150, 96
        logo.thumbnail((max_w, max_h), Image.Resampling.LANCZOS)
        pad = 14
        chip_w, chip_h = logo.width + pad * 2, logo.height + pad * 2
        chip = Image.new("RGBA", (chip_w, chip_h), (255, 255, 255, 235))
        chip_mask = Image.new("L", (chip_w, chip_h), 0)
        ImageDraw.Draw(chip_mask).rounded_rectangle((0, 0, chip_w, chip_h), radius=18, fill=255)
        canvas.paste(chip, (48, 52), chip_mask)
        canvas.paste(logo, (48 + pad, 52 + pad), logo)

    # Imagen principal con sombra suave. Coordenadas proporcionales para que
    # el mismo layout funcione en Story/Reel (1080x1920) y Post (1080x1350).
    img_top = 210 if H >= 1600 else (190 if H >= 1200 else 160)
    img_h = int(H * (0.49 if H >= 1600 else 0.42))
    img_box = (48, img_top, W - 48, img_top + img_h)
    image = load_image(payload.get("image"))
    if image:
        radius = 32
        card = rounded_image(image, (img_box[2] - img_box[0], img_box[3] - img_box[1]), radius)
        shadow = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
        sd = ImageDraw.Draw(shadow)
        sd.rounded_rectangle((img_box[0] + 8, img_box[1] + 16, img_box[2] + 8, img_box[3] + 16), radius=radius, fill=(15, 23, 42, 70))
        shadow = shadow.filter(ImageFilter.GaussianBlur(18))
        canvas.alpha_composite(shadow)
        canvas.alpha_composite(card, (img_box[0], img_box[1]))
    else:
        draw_placeholder(canvas, img_box, accent, ink)

    # Titular
    cta = clean_text(payload.get("cta"))
    cta_y = H - int(H * 0.16)
    available_bottom = cta_y - 24

    headline = clean_text(payload.get("headline"))
    headline_start = 76 if H >= 1600 else (64 if H >= 1200 else 56)
    headline_y = img_box[3] + int(H * 0.035)
    headline_max_h = min(int(H * 0.16), max(80, available_bottom - headline_y - 40))
    display_font, lines, line_h = fit_headline(
        draw, headline, W - 128, headline_max_h, headline_start, 44
    )
    # Si el titular quedó más alto que el espacio disponible, recorta líneas
    # completas en vez de dejar que el cuerpo/CTA se encimen.
    while len(lines) > 1 and headline_y + len(lines) * line_h > available_bottom:
        lines = lines[:-1]
    y = headline_y
    for line in lines:
        draw.text((64, y), line, font=display_font, fill=(*ink, 255))
        y += line_h

    # Subrayado de acento
    y += 12
    draw.rounded_rectangle((64, y, 204, y + 10), radius=5, fill=(*accent, 255))
    y += 40

    # Cuerpo
    body = clean_text(payload.get("body"))
    if body and (
        body.lower() == headline.lower()
        or body.lower() in headline.lower()
        or headline.lower() in body.lower()
        or difflib.SequenceMatcher(None, body.lower(), headline.lower()).ratio() > 0.72
    ):
        body = ""
    if body and y + 48 <= available_bottom:
        body_font = load_font(FONT_BODY, 36 if H >= 1600 else 32)
        body_lines = wrap_text(draw, body, body_font, W - 128)
        body_lines = body_lines[:max(1, (available_bottom - y) // 42)]
        for line in body_lines:
            draw.text((64, y), line, font=body_font, fill=(51, 65, 85, 255))
            y += 48 if H >= 1600 else 42

    # CTA en píldora
    contact = "   ·   ".join([x for x in [payload.get("phone"), payload.get("website")] if x])
    if cta:
        cta_font = load_font(FONT_SEMI, 34 if H >= 1600 else 30)
        box = draw.textbbox((0, 0), cta, font=cta_font)
        cta_w = box[2] - box[0] + 64
        while cta_w > W - 128 and cta_font.size > 22:
            cta_font = load_font(FONT_SEMI, cta_font.size - 2)
            box = draw.textbbox((0, 0), cta, font=cta_font)
            cta_w = box[2] - box[0] + 64
        cta_h = 72 if H >= 1600 else 62
        cta_x = 64
        draw.rounded_rectangle((cta_x, cta_y, cta_x + cta_w, cta_y + cta_h), radius=36, fill=(*accent, 255))
        draw.text((cta_x + 32, cta_y + (18 if H >= 1600 else 14)), cta, font=cta_font, fill=(255, 255, 255, 255))

    if contact:
        contact_font = load_font(FONT_BODY, 26 if H >= 1600 else 22)
        draw.text((64, H - 52), contact, font=contact_font, fill=(71, 85, 105, 255))

    # Línea inferior fina
    draw.rectangle((48, H - 24, W - 48, H - 22), fill=(*accent, 120))

    out = Path(output)
    out.parent.mkdir(parents=True, exist_ok=True)
    canvas.convert("RGB").save(out, "PNG", optimize=True)
    return str(out)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()
    with open(args.input, "r", encoding="utf-8") as fh:
        payload = json.load(fh)
    print(render(payload, args.output))


if __name__ == "__main__":
    main()
