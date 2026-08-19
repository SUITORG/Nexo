import zipfile
import numpy as np
import cv2
from pathlib import Path

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".cr3", ".arw", ".dng", ".tiff", ".tif", ".bmp", ".heic", ".heif"}

RAW_EXTS = {".cr3", ".arw", ".dng", ".tiff", ".tif"}
RAW_ONLY_EXTS = {".cr3", ".arw"}  # cv2 can't read these at all


def read_image(path):
    path = str(path)
    ext = Path(path).suffix.lower()
    if ext in RAW_EXTS:
        try:
            import rawpy
            with rawpy.imread(path) as raw:
                rgb = raw.postprocess()
            bgr = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
            jpg_path = Path(path).with_suffix(".converted.jpg")
            cv2.imwrite(str(jpg_path), bgr, [cv2.IMWRITE_JPEG_QUALITY, 90])
            return bgr
        except Exception:
            if ext in RAW_ONLY_EXTS:
                return None
            pass
    img = cv2.imread(path)
    if img is None and ext in {".heic", ".heif"}:
        try:
            from PIL import Image
            img_pil = Image.open(path).convert("RGB")
            return cv2.cvtColor(np.array(img_pil), cv2.COLOR_RGB2BGR)
        except Exception:
            pass
    return img


def extract_zip(zip_path: Path, dest_dir: Path) -> list[Path]:
    dest_dir.mkdir(parents=True, exist_ok=True)
    extracted = []
    with zipfile.ZipFile(zip_path, "r") as zf:
        for member in zf.infolist():
            if member.is_dir():
                continue
            ext = Path(member.filename).suffix.lower()
            if ext not in IMAGE_EXTS:
                continue
            name = Path(member.filename).name
            if name.startswith(".") or name.startswith("__"):
                continue
            target = dest_dir / name
            counter = 1
            while target.exists():
                stem = target.stem
                target = dest_dir / f"{stem}_{counter}{target.suffix}"
                counter += 1
            zf.extract(member, dest_dir)
            (dest_dir / member.filename).rename(target)
            extracted.append(target)
    return sorted(extracted)
