PANORAMIC_ASPECT_RATIO_MIN = 2.0
BILLBOARD_AREA_RATIO_MIN = 0.3


def classify_panoramic(frame_width, frame_height):
    ratio = frame_width / max(frame_height, 1)
    if ratio >= PANORAMIC_ASPECT_RATIO_MIN:
        return "wide_panoramic"
    return None


def is_billboard_candidate(detections, frame_area):
    candidates = []
    for d in detections:
        x1, y1, x2, y2 = d["bbox"]
        area = (x2 - x1) * (y2 - y1)
        area_ratio = area / max(frame_area, 1)
        if area_ratio >= BILLBOARD_AREA_RATIO_MIN:
            candidates.append({**d, "area_ratio": round(area_ratio, 3)})
    return candidates


class PanoramicClassifier:
    def __init__(self):
        self.panoramic_types = {
            "landscape": ["mountain", "sky", "ocean", "beach", "tree", "lake", "river"],
            "cityscape": ["building", "skyscraper", "bridge", "city", "street", "highway"],
            "event": ["crowd", "stage", "concert", "sports", "people", "celebration"],
        }

    def classify_scene(self, detections):
        labels = [d["label"].lower() for d in detections]
        scores = {}
        for ptype, keywords in self.panoramic_types.items():
            scores[ptype] = sum(1 for kw in keywords if kw in " ".join(labels))
        if max(scores.values()) > 0:
            return max(scores, key=scores.get)
        return "general"
