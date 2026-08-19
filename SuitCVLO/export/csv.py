import csv
from pathlib import Path


def export_csv(results, output_path, mode="w"):
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    fields = [
        "image", "captured_at", "gps_lat", "gps_lng", "address",
        "billboard_idx", "format", "brand", "campaign_type",
        "campaign_detail", "ocr_text", "confidence", "detection_method",
        "area_ratio",
    ]
    with open(output_path, mode, newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fields)
        if mode == "w":
            writer.writeheader()
        for r in results:
            for i, bb in enumerate(r.get("billboards", [])):
                writer.writerow({
                    "image": r.get("image", ""),
                    "captured_at": r.get("captured_at", ""),
                    "gps_lat": r.get("gps_lat", ""),
                    "gps_lng": r.get("gps_lng", ""),
                    "address": r.get("address", ""),
                    "billboard_idx": i + 1,
                    "format": bb.get("format", ""),
                    "brand": bb.get("brand", ""),
                    "campaign_type": bb.get("campaign_type", ""),
                    "campaign_detail": bb.get("campaign_detail", ""),
                    "ocr_text": bb.get("ocr_text", ""),
                    "confidence": bb.get("confidence", ""),
                    "detection_method": bb.get("method", ""),
                    "area_ratio": bb.get("area_ratio", ""),
                })
    return output_path
