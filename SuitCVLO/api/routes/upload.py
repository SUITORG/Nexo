import uuid
import threading
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from config import UPLOAD_DIR, MAX_UPLOAD_MB
from api.auth import verify_token
from detector.yolo import YOLODetector
from detector.panoramic import classify_panoramic, is_billboard_candidate, PanoramicClassifier
from detector.ocr import OCRReader
from geo.metadata import extract_exif
from geo.geocode import reverse_geocode
from db.local import LocalStore
from db.supabase import SupabaseStore
from db.sync import SyncEngine
from pipeline.extractor import BillboardExtractor
from pipeline.brand import BrandExtractor
from pipeline.campaign import CampaignExtractor
from pipeline.format import FormatClassifier
from pipeline.models import BillboardRecord
from pipeline.utils import extract_zip

router = APIRouter(prefix="/upload", tags=["upload"], dependencies=[Depends(verify_token)])

detector = YOLODetector()
panoramic_cls = PanoramicClassifier()
ocr = OCRReader()
local_db = LocalStore()
cloud_db = SupabaseStore()
sync = SyncEngine(local_db, cloud_db)


def _raw_image_name(save_path):
    jpg_sidecar = save_path.with_suffix(".converted.jpg")
    return jpg_sidecar.name if jpg_sidecar.exists() else save_path.name


@router.post("")
async def upload_file(file: UploadFile = File(...), user_id: str = Form("default")):
    try:
        content = await file.read()
        if len(content) > MAX_UPLOAD_MB * 1024 * 1024:
            raise HTTPException(413, f"Archivo excede el límite de {MAX_UPLOAD_MB}MB")
        ext = Path(file.filename).suffix or ".jpg"
        save_name = f"{uuid.uuid4().hex}{ext}"
        save_path = UPLOAD_DIR / save_name

        with open(save_path, "wb") as f:
            f.write(content)

        meta = extract_exif(str(save_path))
        geo = reverse_geocode(meta.get("gps_lat"), meta.get("gps_lng"))

        extractor = BillboardExtractor()
        brand_ext = BrandExtractor()
        campaign_ext = CampaignExtractor()
        format_cls = FormatClassifier()
        ocr_reader = OCRReader()

        try:
            billboards_raw, _ = extractor.extract(str(save_path))
        except ValueError:
            detail = "RAW no soportado o corrupto — exporta a JPG desde la cámara"
            raise HTTPException(400, detail=detail)

        billboard_results = []
        for bb in billboards_raw:
            text = ocr_reader.extract_text(bb["corrected"])
            brand = brand_ext.extract(text)
            campaign_type, campaign_detail = campaign_ext.extract(text)
            bbox = bb["bbox"]
            area_px = (bbox[2] - bbox[0]) * (bbox[3] - bbox[1])
            aspect = (bbox[2] - bbox[0]) / max(bbox[3] - bbox[1], 1)
            fmt = format_cls.classify(area_px, aspect, bb["area_ratio"], bb["confidence"])
            billboard_results.append(BillboardRecord(
                bbox=bbox,
                confidence=bb["confidence"],
                method=bb.get("detection_method", "contour"),
                format=fmt,
                area_ratio=bb.get("area_ratio", 0),
                ocr_text=text,
                brand=brand,
                campaign_type=campaign_type,
                campaign_detail=campaign_detail,
            ).to_dict())

        result = {
            "image": _raw_image_name(save_path),
            "original_filename": file.filename,
            "captured_at": meta.get("captured_at"),
            "gps_lat": meta.get("gps_lat"),
            "gps_lng": meta.get("gps_lng"),
            "address": geo["address"],
            "address_error": geo.get("address_error"),
            "billboards": billboard_results,
        }

        detections = [{"label": "billboard", "confidence": bb["confidence"]} for bb in billboard_results]
        pano_text = " | ".join(bb.get("ocr_text", "") for bb in billboard_results) if billboard_results else None
        max_conf = max((bb["confidence"] for bb in billboard_results), default=0)
        classification = "billboard" if billboard_results else "general"

        record = {
            "user_id": user_id,
            "image_path": str(save_path),
            "captured_at": meta.get("captured_at"),
            "gps_lat": meta.get("gps_lat"),
            "gps_lng": meta.get("gps_lng"),
            "address": geo["address"],
            "address_error": geo.get("address_error"),
            "detected_objects": detections,
            "is_panoramic": len(billboard_results) > 0,
            "panoramic_type": "billboard" if billboard_results else None,
            "panoramic_text": pano_text,
            "classification": classification,
            "confidence": max_conf,
            "source": "upload",
        }

        local_id = local_db.save_detection(record)
        sync.sync_to_cloud()

        return {"id": local_id, **result}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(400, detail=str(e))


class ZipJobStore:
    def __init__(self):
        self._lock = threading.Lock()
        self._jobs: dict[str, dict] = {}

    def create(self) -> str:
        job_id = uuid.uuid4().hex
        with self._lock:
            self._jobs[job_id] = {
                "status": "queued",
                "progress": "0/0",
                "result": None,
                "error": None,
            }
        return job_id

    def update(self, job_id: str, **kwargs):
        with self._lock:
            if job_id in self._jobs:
                self._jobs[job_id].update(kwargs)

    def get(self, job_id: str) -> dict | None:
        with self._lock:
            return self._jobs.get(job_id)


zip_jobs = ZipJobStore()


def _process_zip_background(job_id: str, zip_path: Path, extract_dir: Path, user_id: str):
    try:
        zip_jobs.update(job_id, status="extracting")
        images = extract_zip(zip_path, extract_dir)
        if not images:
            zip_jobs.update(job_id, status="done", progress="0/0", result={"total": 0, "billboards": [], "images": []})
            return

        extractor = BillboardExtractor()
        brand_ext = BrandExtractor()
        campaign_ext = CampaignExtractor()
        format_cls = FormatClassifier()
        ocr_reader = OCRReader()

        all_results = []
        total = len(images)
        for idx, img_path in enumerate(images):
            zip_jobs.update(job_id, status="processing", progress=f"{idx+1}/{total}")
            try:
                meta = extract_exif(img_path)
                geo = reverse_geocode(meta.get("gps_lat"), meta.get("gps_lng"))
                billboards, _ = extractor.extract(img_path)
                billboard_results = []
                for bb in billboards:
                    corrected = bb["corrected"]
                    text = ocr_reader.extract_text(corrected)
                    brand = brand_ext.extract(text)
                    campaign_type, campaign_detail = campaign_ext.extract(text)
                    bbox = bb["bbox"]
                    area_px = (bbox[2] - bbox[0]) * (bbox[3] - bbox[1])
                    aspect = (bbox[2] - bbox[0]) / max(bbox[3] - bbox[1], 1)
                    fmt = format_cls.classify(area_px, aspect, bb["area_ratio"], bb["confidence"])
                    billboard_results.append(BillboardRecord(
                        bbox=bbox,
                        confidence=bb["confidence"],
                        method=bb.get("detection_method", "yolo"),
                        format=fmt,
                        area_ratio=bb.get("area_ratio", 0),
                        ocr_text=text,
                        brand=brand,
                        campaign_type=campaign_type,
                        campaign_detail=campaign_detail,
                    ).to_dict())
                entry = {
                    "image": _raw_image_name(img_path),
                    "original_filename": img_path.name,
                    "captured_at": meta.get("captured_at"),
                    "gps_lat": meta.get("gps_lat"),
                    "gps_lng": meta.get("gps_lng"),
                    "address": geo["address"],
                    "address_error": geo.get("address_error"),
                    "billboards": billboard_results,
                }
                all_results.append(entry)

                record = {
                    "user_id": user_id,
                    "image_path": str(img_path),
                    "captured_at": meta.get("captured_at"),
                    "gps_lat": meta.get("gps_lat"),
                    "gps_lng": meta.get("gps_lng"),
                    "address": geo["address"],
                    "address_error": geo.get("address_error"),
                    "detected_objects": [{"label": "billboard", "confidence": bb["confidence"]} for bb in billboard_results],
                    "is_panoramic": True,
                    "panoramic_type": "billboard",
                    "panoramic_text": " | ".join(bb.get("ocr_text", "") for bb in billboard_results),
                    "classification": "billboard",
                    "confidence": max((bb["confidence"] for bb in billboard_results), default=0),
                    "source": "upload_zip",
                }
                local_db.save_detection(record)
            except Exception as img_err:
                detail = str(img_err)
                if any(x in str(img_path).lower() for x in [".cr3", ".arw"]):
                    detail = "RAW no soportado o corrupto — exporta a JPG"
                all_results.append({
                    "image": img_path.name,
                    "original_filename": img_path.name,
                    "error": detail,
                    "billboards": [],
                })

        zip_jobs.update(job_id, status="done", progress=f"{total}/{total}", result=all_results)
    except Exception as e:
        zip_jobs.update(job_id, status="error", error=str(e))


@router.post("/zip", status_code=202)
async def upload_zip(file: UploadFile = File(...), user_id: str = Form("default")):
    if not file.filename or not file.filename.lower().endswith(".zip"):
        raise HTTPException(400, "Only .zip files accepted")
    content = await file.read()
    if len(content) > MAX_UPLOAD_MB * 1024 * 1024:
        raise HTTPException(413, f"Archivo excede el límite de {MAX_UPLOAD_MB}MB")
    zip_path = UPLOAD_DIR / f"{uuid.uuid4().hex}.zip"
    with open(zip_path, "wb") as f:
        f.write(content)

    job_id = zip_jobs.create()
    extract_dir = UPLOAD_DIR / job_id
    thread = threading.Thread(target=_process_zip_background, args=(job_id, zip_path, extract_dir, user_id), daemon=True)
    thread.start()

    return {"job_id": job_id, "status": "queued"}


@router.get("/zip/status/{job_id}")
async def zip_status(job_id: str):
    job = zip_jobs.get(job_id)
    if not job:
        raise HTTPException(404, "Job not found")
    return {"job_id": job_id, "status": job["status"], "progress": job["progress"]}


@router.get("/zip/result/{job_id}")
async def zip_result(job_id: str):
    job = zip_jobs.get(job_id)
    if not job:
        raise HTTPException(404, "Job not found")
    if job["status"] != "done":
        raise HTTPException(400, f"Job is {job['status']}, not done yet")
    return {"job_id": job_id, "results": job["result"]}
