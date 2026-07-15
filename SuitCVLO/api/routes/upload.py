import uuid
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, Form
from config import UPLOAD_DIR
from detector.yolo import YOLODetector
from detector.panoramic import classify_panoramic, is_billboard_candidate, PanoramicClassifier
from detector.ocr import OCRReader
from geo.metadata import extract_exif
from geo.geocode import reverse_geocode
from db.local import LocalStore
from db.supabase import SupabaseStore
from db.sync import SyncEngine

router = APIRouter(prefix="/upload", tags=["upload"])

detector = YOLODetector()
panoramic_cls = PanoramicClassifier()
ocr = OCRReader()
local_db = LocalStore()
cloud_db = SupabaseStore()
sync = SyncEngine(local_db, cloud_db)


@router.post("")
async def upload_file(file: UploadFile = File(...), user_id: str = Form("default")):
    ext = Path(file.filename).suffix or ".jpg"
    save_name = f"{uuid.uuid4().hex}{ext}"
    save_path = UPLOAD_DIR / save_name

    content = await file.read()
    with open(save_path, "wb") as f:
        f.write(content)

    image_path = str(save_path)
    meta = extract_exif(image_path)
    detections, _ = detector.detect_image(image_path)
    frame_area = (meta.get("image_width") or 1920) * (meta.get("image_height") or 1080)
    pano_type = classify_panoramic(meta.get("image_width") or 1920, meta.get("image_height") or 1080)
    billboards = is_billboard_candidate(detections, frame_area)
    pano_text = None
    classification = None
    if billboards:
        import cv2
        frame = cv2.imread(image_path)
        texts = ocr.extract_from_crops(frame, billboards)
        if texts:
            pano_text = " | ".join([t["text"] for t in texts])
            classification = ocr.classify_text(pano_text)
    if not classification:
        scene = panoramic_cls.classify_scene(detections)
        classification = scene if pano_type else "general"

    geo = reverse_geocode(meta["gps_lat"], meta["gps_lng"])

    max_conf = max([d["confidence"] for d in detections], default=0)
    record = {
        "user_id": user_id,
        "image_path": image_path,
        "captured_at": meta.get("captured_at"),
        "gps_lat": meta.get("gps_lat"),
        "gps_lng": meta.get("gps_lng"),
        "address": geo["address"] if geo else None,
        "detected_objects": detections,
        "is_panoramic": pano_type is not None or len(billboards) > 0,
        "panoramic_type": pano_type or ("billboard" if billboards else None),
        "panoramic_text": pano_text,
        "classification": classification,
        "confidence": max_conf,
        "source": "upload",
    }

    local_id = local_db.save_detection(record)
    sync.sync_to_cloud()

    return {"id": local_id, "image": save_name, **record}
