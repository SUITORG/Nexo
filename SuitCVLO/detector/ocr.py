import cv2
import numpy as np
import easyocr


class OCRReader:
    def __init__(self, langs=None):
        self.reader = easyocr.Reader(langs or ["en", "es"], gpu=False)

    def extract_text(self, image, bbox=None):
        if bbox:
            x1, y1, x2, y2 = bbox
            crop = image[y1:y2, x1:x2]
        else:
            crop = image
        results = self.reader.readtext(crop)
        text = " ".join([r[1] for r in results if r[2] > 0.3])
        text = text.strip().lstrip(";:,.!?-_|/\\").strip()
        return text

    def extract_from_crops(self, image, candidates):
        texts = []
        for c in candidates:
            text = self.extract_text(image, c["bbox"])
            if text.strip():
                texts.append({"bbox": c["bbox"], "text": text.strip(), "label": c["label"]})
        return texts

    def classify_text(self, text):
        text_lower = text.lower()
        keywords = {
            "food": ["comida", "burger", "pizza", "taco", "restaurant", "menu", "food", "eat"],
            "tech": ["tech", "technology", "digital", "ai", "software", "phone", "app"],
            "beverage": ["drink", "beer", "soda", "coke", "water", "juice", "bebida"],
            "retail": ["shop", "store", "sale", "discount", "buy", "price", "tienda"],
            "automotive": ["car", "auto", "tire", "gas", "oil", "truck", "coche"],
            "health": ["health", "medical", "doctor", "hospital", "clinic", "salud", "medico"],
        }
        for category, kws in keywords.items():
            if any(kw in text_lower for kw in kws):
                return category
        return "general"
