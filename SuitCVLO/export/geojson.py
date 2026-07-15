import json
from pathlib import Path


def export_geojson(results, output_path):
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    features = []
    for r in results:
        lat = r.get("gps_lat")
        lng = r.get("gps_lng")
        if lat is None or lng is None:
            continue
        for i, bb in enumerate(r.get("billboards", [])):
            feature = {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [lng, lat],
                },
                "properties": {
                    "image": r.get("image", ""),
                    "captured_at": r.get("captured_at", ""),
                    "address": r.get("address", ""),
                    "billboard_idx": i + 1,
                    "format": bb.get("format", ""),
                    "brand": bb.get("brand", ""),
                    "campaign_type": bb.get("campaign_type", ""),
                    "campaign_detail": bb.get("campaign_detail", ""),
                    "ocr_text": bb.get("ocr_text", ""),
                    "confidence": bb.get("confidence", ""),
                },
            }
            features.append(feature)
    geojson = {
        "type": "FeatureCollection",
        "features": features,
    }
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(geojson, f, indent=2, ensure_ascii=False)
    return output_path
