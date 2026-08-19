import json
from pathlib import Path


DEFAULT_IOU_THRESHOLD = 0.3
DEFAULT_TEXT_SIMILARITY = 0.6


def bbox_iou(a, b):
    ax1, ay1, ax2, ay2 = a
    bx1, by1, bx2, by2 = b
    xi1 = max(ax1, bx1)
    yi1 = max(ay1, by1)
    xi2 = min(ax2, bx2)
    yi2 = min(ay2, by2)
    inter = max(0, xi2 - xi1) * max(0, yi2 - yi1)
    a_area = (ax2 - ax1) * (ay2 - ay1)
    b_area = (bx2 - bx1) * (by2 - by1)
    union = a_area + b_area - inter
    return inter / union if union > 0 else 0.0


def text_similarity(a, b):
    if not a or not b:
        return 0.0
    a_words = set(a.lower().split())
    b_words = set(b.lower().split())
    if not a_words or not b_words:
        return 0.0
    intersection = a_words & b_words
    return len(intersection) / max(len(a_words), len(b_words))


def build_catalog(results, iou_threshold=None, text_threshold=None):
    iou_threshold = iou_threshold or DEFAULT_IOU_THRESHOLD
    text_threshold = text_threshold or DEFAULT_TEXT_SIMILARITY
    catalog = []
    for r in results:
        lat = r.get("gps_lat")
        lng = r.get("gps_lng")
        for bb in r.get("billboards", []):
            if not bb.get("ocr_text"):
                continue
            ocr = bb["ocr_text"].strip()
            if not ocr:
                continue
            found = False
            for entry in catalog:
                if entry.get("brand") != bb.get("brand"):
                    continue
                if text_similarity(entry["ocr_text"], ocr) >= text_threshold:
                    entry["occurrences"] += 1
                    entry["images"].append(r.get("image", ""))
                    if lat and lng:
                        entry["gps_points"].append([lng, lat])
                    found = True
                    break
            if not found:
                entry = {
                    "brand": bb.get("brand", "unknown"),
                    "format": bb.get("format", ""),
                    "campaign_type": bb.get("campaign_type", ""),
                    "campaign_detail": bb.get("campaign_detail", ""),
                    "ocr_text": ocr,
                    "occurrences": 1,
                    "images": [r.get("image", "")],
                    "gps_points": [[lng, lat]] if lat and lng else [],
                }
                catalog.append(entry)
    for entry in catalog:
        if entry["gps_points"]:
            lngs = [p[0] for p in entry["gps_points"]]
            lats = [p[1] for p in entry["gps_points"]]
            entry["centroid"] = {
                "lat": round(sum(lats) / len(lats), 6),
                "lng": round(sum(lngs) / len(lngs), 6),
            }
        else:
            entry["centroid"] = None
    catalog.sort(key=lambda x: x["occurrences"], reverse=True)
    return catalog


def export_catalog_json(catalog, output_path):
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(catalog, f, indent=2, ensure_ascii=False)
    return output_path


def export_catalog_csv(catalog, output_path):
    import csv
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    fields = [
        "brand", "format", "campaign_type", "campaign_detail",
        "ocr_text", "occurrences", "centroid_lat", "centroid_lng",
    ]
    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fields)
        writer.writeheader()
        for entry in catalog:
            writer.writerow({
                "brand": entry.get("brand", ""),
                "format": entry.get("format", ""),
                "campaign_type": entry.get("campaign_type", ""),
                "campaign_detail": entry.get("campaign_detail", ""),
                "ocr_text": entry.get("ocr_text", ""),
                "occurrences": entry.get("occurrences", 0),
                "centroid_lat": entry["centroid"]["lat"] if entry.get("centroid") else "",
                "centroid_lng": entry["centroid"]["lng"] if entry.get("centroid") else "",
            })
    return output_path
