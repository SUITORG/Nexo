"""ReviewPulse — monitor de reseñas Google para negocios locales.

80/20 MVP: importa reseñas (Places API o CSV), guarda en SQLite,
alerta reseñas nuevas / caída de rating y redacta borrador de respuesta.
"""
import asyncio
import csv
import json
import os
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
from pathlib import Path

from db import get_new_reviews, init_db, insert_review, upsert_business

PLACES_URL = "https://places.googleapis.com/v1/places:searchText"
HEADERS_FIELD_MASK = "places.id,places.displayName,places.rating,places.userRatingCount"


async def fetch_places(place_id: str) -> dict | None:
    """Consultar detalle de reseñas vía Places API. Requiere PLACES_API_KEY en .env."""
    key = os.environ.get("PLACES_API_KEY")
    if not key:
        return None
    import aiohttp  # opcional: solo si hay API key
    url = f"https://places.googleapis.com/v1/places/{place_id}?languageCode=es"
    headers = {"X-Goog-Api-Key": key, "X-Goog-FieldMask": HEADERS_FIELD_MASK}
    async with aiohttp.ClientSession() as s:
        async with s.get(url, headers=headers, timeout=aiohttp.ClientTimeout(total=15)) as r:
            return await r.json() if r.ok else None


def import_csv(path: str, empresa: str) -> int:
    """Importar reseñas desde CSV: review_id,business,author,rating,comment,date."""
    n = 0
    with open(path, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            upsert_business(empresa)
            insert_review(
                review_id=row["review_id"],
                empresa=empresa,
                author=row.get("author", ""),
                rating=float(row.get("rating", 0)),
                comment=row.get("comment", ""),
                date=row.get("date", ""),
            )
            n += 1
    return n


def report(empresa: str) -> None:
    nuevas, prom = get_new_reviews(empresa)
    print(f"\n=== {empresa} ===")
    print(f"Promedio rating: {prom:.2f}" if prom is not None else "Sin reseñas")
    print(f"Reseñas nuevas: {len(nuevas)}")
    for r in nuevas:
        estrellas = int(round(r[3]))
        print(f"  [{r[5] or 's/f'}] {r[2]} ({'★' * estrellas}): {r[4][:80]}")
        print(f"    Borrador: 'Gracias por tu comentario, {r[2].split()[0]}. Estamos revisando tu experiencia.'")


async def main() -> int:
    init_db()
    if len(sys.argv) < 3:
        print("Uso:\n  python main.py import <archivo.csv> <empresa>\n  python main.py report <empresa>\n  python main.py sync <place_id> <empresa>   (requiere PLACES_API_KEY)")
        return 1
    cmd, arg1, arg2 = sys.argv[1], sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else ""
    if cmd == "import":
        print(f"Importadas {import_csv(arg1, arg2)} reseñas de {arg2}")
    elif cmd == "report":
        report(arg1)
    elif cmd == "report-json":
        nuevas, prom = get_new_reviews(arg1)
        print(json.dumps({
            "empresa": arg1,
            "avg_rating": round(prom, 2) if prom is not None else None,
            "nuevas": [
                {"review_id": r[0], "author": r[2], "rating": r[3], "comment": r[4], "date": r[5]}
                for r in nuevas
            ],
        }, ensure_ascii=False))
    elif cmd == "sync":
        data = await fetch_places(arg1)
        if not data:
            print("Sin PLACES_API_KEY o fallo en la API. Usa `import` con CSV como alternativa.")
            return 1
        upsert_business(arg2)
        print(f"OK places rating={data.get('rating')} count={data.get('userRatingCount')}")
    else:
        print(f"Comando desconocido: {cmd}")
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
