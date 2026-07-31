#!/usr/bin/env python3
import argparse
import cv2
import sys
from pathlib import Path
from detector.yolo import YOLODetector
from detector.panoramic import classify_panoramic, is_billboard_candidate, PanoramicClassifier
from detector.ocr import OCRReader
from geo.metadata import extract_exif
from geo.geocode import reverse_geocode
from db.local import LocalStore
from pipeline.utils import read_image


def main():
    parser = argparse.ArgumentParser(description="SuitCVLO — Computer Vision Look Once")
    parser.add_argument("--source", "-s", choices=["webcam", "photo", "video"], default="webcam",
                        help="Input source")
    parser.add_argument("--input", "-i", type=str, help="Path to photo/video file")
    parser.add_argument("--save", action="store_true", help="Save results to local DB")
    parser.add_argument("--show", action="store_true", default=True, help="Show output window")
    parser.add_argument("--user", "-u", type=str, default="default", help="User ID")
    parser.add_argument("--model", "-m", type=str, default=None, help="Custom YOLO model path")
    args = parser.parse_args()

    detector = YOLODetector(args.model)
    panoramic_cls = PanoramicClassifier()
    ocr_reader = OCRReader()
    local_db = LocalStore() if args.save else None

    if args.source == "webcam":
        run_webcam(detector, panoramic_cls, ocr_reader, local_db, args)
    elif args.source == "photo":
        if not args.input:
            print("--input required for photo mode")
            sys.exit(1)
        run_photo(Path(args.input), detector, panoramic_cls, ocr_reader, local_db, args)
    elif args.source == "video":
        if not args.input:
            print("--input required for video mode")
            sys.exit(1)
        run_video(Path(args.input), detector, panoramic_cls, ocr_reader, local_db, args)


def run_webcam(detector, panoramic_cls, ocr_reader, local_db, args):
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("Cannot open webcam")
        return
    print("Webcam live — press 'q' to quit, 's' to save frame")
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        detections, annotated = detector.detect_frame(frame)
        for d in detections:
            x1, y1, x2, y2 = d["bbox"]
            label = f"{d['label']} {d['confidence']:.2f}"
            cv2.rectangle(annotated, (x1, y1), (x2, y2), (0, 255, 0), 2)
            cv2.putText(annotated, label, (x1, y1 - 10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
        cv2.imshow("SuitCVLO", annotated)

        key = cv2.waitKey(1) & 0xFF
        if key == ord("q"):
            break
        elif key == ord("s"):
            import datetime
            save_path = f"capture_{datetime.datetime.now():%Y%m%d_%H%M%S}.jpg"
            cv2.imwrite(save_path, frame)
            print(f"Saved {save_path}")
    cap.release()
    cv2.destroyAllWindows()


def run_photo(image_path, detector, panoramic_cls, ocr_reader, local_db, args):
    print(f"Processing: {image_path}")
    meta = extract_exif(image_path)
    detections, annotated = detector.detect_image(image_path)
    h, w = annotated.shape[:2]
    frame_area = w * h
    pano_type = classify_panoramic(w, h)
    billboards = is_billboard_candidate(detections, frame_area)

    if billboards:
        frame = read_image(image_path)
        texts = ocr_reader.extract_from_crops(frame, billboards)
        pano_text = " | ".join([t["text"] for t in texts]) if texts else None
        classification = ocr_reader.classify_text(pano_text or "") if pano_text else None
    else:
        pano_text = None
        classification = None

    if not classification:
        scene = panoramic_cls.classify_scene(detections)
        classification = scene if pano_type else "general"

    geo = reverse_geocode(meta["gps_lat"], meta["gps_lng"])

    print(f"  Objects: {len(detections)}")
    for d in detections:
        print(f"    - {d['label']} ({d['confidence']:.2f})")
    print(f"  Panoramic: {pano_type or 'No'}")
    if billboards:
        print(f"  Billboard text: {pano_text}")
    print(f"  Classification: {classification}")
    print(f"  Captured: {meta.get('captured_at', 'unknown')}")
    print(f"  GPS: {meta.get('gps_lat')}, {meta.get('gps_lng')}")
    addr = geo["address"]
    addr_err = geo.get("address_error")
    print(f"  Address: {addr or 'N/A'}{' (' + addr_err + ')' if addr_err and addr_err != 'no_gps' else ''}")

    if local_db:
        max_conf = max([d["confidence"] for d in detections], default=0)
        record = {
            "user_id": args.user,
            "image_path": str(image_path),
            "captured_at": meta.get("captured_at"),
            "gps_lat": meta.get("gps_lat"),
            "gps_lng": meta.get("gps_lng"),
            "address": geo["address"],
            "address_error": geo.get("address_error"),
            "detected_objects": detections,
            "is_panoramic": pano_type is not None or len(billboards) > 0,
            "panoramic_type": pano_type or ("billboard" if billboards else None),
            "panoramic_text": pano_text,
            "classification": classification,
            "confidence": max_conf,
            "source": "photo",
        }
        rec_id = local_db.save_detection(record)
        print(f"  Saved to DB: #{rec_id}")

    if args.show:
        out_path = image_path.parent / f"{image_path.stem}_annotated{image_path.suffix}"
        cv2.imwrite(str(out_path), annotated)
        print(f"  Annotated: {out_path}")


def run_video(video_path, detector, panoramic_cls, ocr_reader, local_db, args):
    print(f"Processing video: {video_path}")
    results = detector.detect_video(video_path)
    print(f"  Frames processed: {len(results)}")
    total_dets = sum(len(r["detections"]) for r in results)
    print(f"  Total detections: {total_dets}")


if __name__ == "__main__":
    main()
