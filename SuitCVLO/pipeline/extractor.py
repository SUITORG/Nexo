import cv2
import numpy as np
from pathlib import Path
from detector.yolo import YOLODetector
from pipeline.utils import read_image


class BillboardExtractor:
    MIN_AREA_RATIO = 0.008
    MIN_BILLBOARD_CONFIDENCE = 0.15
    BILLBOARD_ASPECT_MIN = 1.0
    BILLBOARD_ASPECT_MAX = 8.0
    HORIZON_RATIO = 0.15
    TEXTURE_STD_THRESHOLD = 15

    def __init__(self, detector=None):
        self.detector = detector or YOLODetector()

    def extract(self, image_path):
        frame = read_image(image_path)
        if frame is None:
            raise ValueError(f"Cannot read: {image_path}")
        h, w = frame.shape[:2]
        frame_area = h * w
        raw_detections, annotated = self.detector.detect_frame(frame)
        yolo_candidates = self._filter_candidates(raw_detections, frame_area, h, w)
        contour_candidates = self._find_billboard_contours(frame, frame_area, h, w)
        merged = self._merge_candidates(yolo_candidates + contour_candidates)
        billboards = []
        for c in merged:
            x1, y1, x2, y2 = c["bbox"]
            crop = frame[y1:y2, x1:x2]
            corrected = self._correct_perspective(crop)
            billboards.append({
                "bbox": c["bbox"],
                "confidence": c.get("confidence", 0.5),
                "detection_method": c.get("method", "yolo"),
                "area_ratio": round((x2-x1)*(y2-y1)/frame_area, 3),
                "crop": crop,
                "corrected": corrected,
            })
        return billboards, annotated

    def _filter_candidates(self, detections, frame_area, frame_h, frame_w):
        filtered = []
        for d in detections:
            x1, y1, x2, y2 = d["bbox"]
            bw, bh = x2 - x1, y2 - y1
            area = bw * bh
            area_ratio = area / frame_area
            aspect = bw / max(bh, 1)
            center_y = (y1 + y2) / 2
            above_horizon = center_y < frame_h * (1 - self.HORIZON_RATIO)
            if (area_ratio >= self.MIN_AREA_RATIO
                and self.BILLBOARD_ASPECT_MIN <= aspect <= self.BILLBOARD_ASPECT_MAX
                and above_horizon
                and d["confidence"] >= self.MIN_BILLBOARD_CONFIDENCE):
                d["method"] = "yolo"
                filtered.append(d)
        return filtered

    def _find_billboard_contours(self, frame, frame_area, h, w):
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        candidates = []
        margin = 5

        strategies = [
            ("canny_relaxed", cv2.Canny(cv2.GaussianBlur(gray, (3, 3), 0), 10, 50)),
            ("canny_normal", cv2.Canny(cv2.GaussianBlur(gray, (3, 3), 0), 20, 100)),
        ]

        for name, edges in strategies:
            kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (7, 7))
            closed = cv2.morphologyEx(edges, cv2.MORPH_CLOSE, kernel)
            contours, _ = cv2.findContours(closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            for c in contours:
                x, y, bw, bh = cv2.boundingRect(c)
                area = bw * bh
                area_ratio = area / frame_area
                if area_ratio < self.MIN_AREA_RATIO:
                    continue
                if area_ratio > 0.60:
                    continue
                aspect = bw / max(bh, 1)
                if not (self.BILLBOARD_ASPECT_MIN <= aspect <= self.BILLBOARD_ASPECT_MAX):
                    continue
                center_y = y + bh / 2
                if not (center_y < h * (1 - self.HORIZON_RATIO)):
                    continue
                if not self._has_texture(gray[y:y+bh, x:x+bw]):
                    continue
                candidates.append({
                    "bbox": [x, y, x+bw, y+bh],
                    "confidence": round(min(area_ratio * 2, 0.9), 2),
                    "method": f"contour_{name}",
                })

        return candidates

    def _has_texture(self, region):
        if region.size == 0:
            return False
        return region.std() > self.TEXTURE_STD_THRESHOLD

    def _correct_perspective(self, crop):
        h, w = crop.shape[:2]
        gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        edges = cv2.Canny(blurred, 30, 100)
        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if not contours:
            return crop
        largest = max(contours, key=cv2.contourArea)
        peri = cv2.arcLength(largest, True)
        approx = cv2.approxPolyDP(largest, 0.02 * peri, True)
        if len(approx) != 4:
            return crop
        pts = approx.reshape(4, 2).astype(np.float32)
        rect = self._order_points(pts)
        dst_w = max(int(np.linalg.norm(rect[1] - rect[0])), int(np.linalg.norm(rect[2] - rect[3])))
        dst_h = max(int(np.linalg.norm(rect[3] - rect[0])), int(np.linalg.norm(rect[2] - rect[1])))
        if dst_w < 10 or dst_h < 10:
            return crop
        dst = np.array([[0, 0], [dst_w - 1, 0], [dst_w - 1, dst_h - 1], [0, dst_h - 1]], dtype=np.float32)
        M = cv2.getPerspectiveTransform(rect, dst)
        warped = cv2.warpPerspective(crop, M, (dst_w, dst_h))
        return warped

    def _merge_candidates(self, candidates, iou_threshold=0.4):
        if not candidates:
            return []
        boxes = np.array([c["bbox"] for c in candidates])
        confs = np.array([c.get("confidence", 0.5) for c in candidates])
        idxs = cv2.dnn.NMSBoxes(boxes.tolist(), confs.tolist(), 0.1, iou_threshold)
        if len(idxs) == 0:
            return []
        idxs = idxs.flatten() if len(idxs.shape) > 1 else idxs
        return [candidates[i] for i in idxs]

    def _order_points(self, pts):
        rect = np.zeros((4, 2), dtype=np.float32)
        s = pts.sum(axis=1)
        rect[0] = pts[np.argmin(s)]
        rect[2] = pts[np.argmax(s)]
        diff = np.diff(pts, axis=1)
        rect[1] = pts[np.argmin(diff)]
        rect[3] = pts[np.argmax(diff)]
        return rect
