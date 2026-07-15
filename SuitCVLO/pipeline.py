#!/usr/bin/env python3
import argparse
import json
import cv2
from pathlib import Path
from pipeline.extractor import BillboardExtractor
from pipeline.brand import BrandExtractor
from pipeline.campaign import CampaignExtractor
from pipeline.format import FormatClassifier
from detector.ocr import OCRReader
from geo.metadata import extract_exif
from geo.geocode import reverse_geocode
from db.local import LocalStore
from export.csv import export_csv
from export.geojson import export_geojson
from export.catalog import build_catalog, export_catalog_json, export_catalog_csv
from export.report import generate_pdf


def main():
    parser = argparse.ArgumentParser(description="SuitCVLO v0.4 — OOH Billboard Pipeline")
    parser.add_argument("--input", "-i", type=str, required=True, help="Image path or directory")
    parser.add_argument("--output", "-o", type=str, default="./output", help="Output directory")
    parser.add_argument("--save", action="store_true", help="Save to local DB")
    parser.add_argument("--user", "-u", type=str, default="default", help="User ID")
    parser.add_argument("--json", action="store_true", help="Export results as JSON")
    parser.add_argument("--draw", action="store_true", help="Draw corrected billboards")
    parser.add_argument("--export", type=str, choices=["csv", "geojson", "both"], help="Export dataset format")
    parser.add_argument("--report", action="store_true", help="Generate PDF summary report")
    parser.add_argument("--catalog", action="store_true", help="Generate deduplicated billboard catalog")
    args = parser.parse_args()

    input_path = Path(args.input)
    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)

    extractor = BillboardExtractor()
    brand_ext = BrandExtractor()
    campaign_ext = CampaignExtractor()
    format_cls = FormatClassifier()
    ocr = OCRReader()
    local_db = LocalStore() if args.save else None

    images = [input_path] if input_path.is_file() else sorted(input_path.glob("*.[jJ][pP][gG]")) + \
              sorted(input_path.glob("*.[jJ][pP][eE][gG]")) + sorted(input_path.glob("*.[pP][nN][gG]"))

    if not images:
        print("No images found")
        return

    all_results = []
    for img_path in images:
        result = process_image(img_path, extractor, brand_ext, campaign_ext, format_cls, ocr, local_db, output_dir, args)
        if result:
            all_results.append(result)

    if args.json:
        json_path = output_dir / "pipeline_results.json"
        with open(json_path, "w") as f:
            json.dump(all_results, f, indent=2, default=str)
        print(f"  JSON: {json_path}")

    if args.export in ("csv", "both"):
        csv_path = export_csv(all_results, output_dir / "dataset_ooh.csv")
        print(f"  CSV: {csv_path}")

    if args.export in ("geojson", "both"):
        geojson_path = export_geojson(all_results, output_dir / "mapa_anuncios.geojson")
        print(f"  GeoJSON: {geojson_path}")

    if args.catalog:
        catalog = build_catalog(all_results)
        catalog_json = export_catalog_json(catalog, output_dir / "catalogo_anuncios.json")
        catalog_csv = export_catalog_csv(catalog, output_dir / "catalogo_anuncios.csv")
        print(f"  Catalog JSON: {catalog_json} ({len(catalog)} unique)")
        print(f"  Catalog CSV: {catalog_csv}")

    total_billboards = sum(len(r.get("billboards", [])) for r in all_results)
    with_billboards = sum(1 for r in all_results if r.get("billboards"))
    print(f"\nProcessed: {len(images)} images, {with_billboards} with billboards ({total_billboards} total)")

    if args.report and all_results:
        catalog = build_catalog(all_results) if args.catalog else []
        pdf_path = generate_pdf(all_results, catalog, output_dir / "reporte_ooh.pdf")
        print(f"  Report PDF: {pdf_path}")


def process_image(img_path, extractor, brand_ext, campaign_ext, format_cls, ocr, local_db, output_dir, args):
    print(f"\n--- {img_path.name} ---")
    meta = extract_exif(img_path)
    geo = reverse_geocode(meta.get("gps_lat"), meta.get("gps_lng")) if meta.get("gps_lat") else None
    billboards, annotated = extractor.extract(img_path)
    billboard_results = []
    for i, bb in enumerate(billboards):
        corrected = bb["corrected"]
        text = ocr.extract_text(corrected)
        brand = brand_ext.extract(text)
        campaign_type, campaign_detail = campaign_ext.extract(text)
        bbox = bb["bbox"]
        area_px = (bbox[2] - bbox[0]) * (bbox[3] - bbox[1])
        aspect = (bbox[2] - bbox[0]) / max(bbox[3] - bbox[1], 1)
        fmt = format_cls.classify(area_px, aspect, bb["area_ratio"], bb["confidence"])
        print(f"  Billboard #{i+1}:")
        method = bb.get("detection_method", "yolo")
        label = bb.get("label", f"billboard_{method}")
        print(f"    Method: {method}")
        print(f"    Label: {label} ({bb['confidence']:.2f})")
        print(f"    Format: {format_cls.format_label(fmt)}")
        print(f"    OCR: {text[:100] if text else '(none)'}")
        print(f"    Brand: {brand}")
        print(f"    Campaign: {campaign_type} — {campaign_detail}")
        billboard_entry = {
            "bbox": bbox,
            "confidence": bb["confidence"],
            "method": bb.get("detection_method", "yolo"),
            "format": fmt,
            "area_ratio": bb.get("area_ratio", 0),
            "ocr_text": text,
            "brand": brand,
            "campaign_type": campaign_type,
            "campaign_detail": campaign_detail,
        }
        billboard_results.append(billboard_entry)
        if args.draw:
            corrected_path = output_dir / f"{img_path.stem}_billboard_{i}.jpg"
            cv2.imwrite(str(corrected_path), corrected)
    if args.draw and billboards:
        annotated_path = output_dir / f"{img_path.stem}_annotated.jpg"
        cv2.imwrite(str(annotated_path), annotated)
    result = {
        "image": img_path.name,
        "image_path": str(img_path),
        "captured_at": meta.get("captured_at"),
        "gps_lat": meta.get("gps_lat"),
        "gps_lng": meta.get("gps_lng"),
        "address": geo["address"] if geo else None,
        "billboards": billboard_results,
    }
    if local_db:
        for bb in billboard_results:
            record = {
                "user_id": args.user,
                "image_path": str(img_path),
                "captured_at": meta.get("captured_at"),
                "gps_lat": meta.get("gps_lat"),
                "gps_lng": meta.get("gps_lng"),
                "address": geo["address"] if geo else None,
                "detected_objects": [{"label": bb.get("brand", bb.get("format")), "confidence": bb["confidence"]}],
                "is_panoramic": True,
                "panoramic_type": "billboard",
                "panoramic_text": bb.get("ocr_text", ""),
                "classification": f"{bb.get('brand', 'unknown')}_{bb.get('format', 'unknown')}",
                "confidence": bb["confidence"],
                "source": "pipeline",
            }
            local_db.save_detection(record)
    return result


if __name__ == "__main__":
    main()
