SPECTACULAR_MIN_MP = 100
SPECTACULAR_MIN_PX = 500000
MURAL_MIN_MP = 50
MURAL_MIN_PX = 250000
VALLA_MIN_MP = 10
VALLA_MIN_PX = 50000


class FormatClassifier:
    def classify(self, area_px, aspect_ratio, area_ratio, confidence):
        if area_px >= SPECTACULAR_MIN_PX:
            return "espectacular"
        elif area_px >= MURAL_MIN_PX:
            return "mural"
        elif area_px >= VALLA_MIN_PX:
            return "valla"
        else:
            return "monoposte"

    def format_label(self, fmt):
        labels = {
            "espectacular": "Espectacular (>100m²)",
            "mural": "Mural (50-100m²)",
            "valla": "Valla (10-50m²)",
            "monoposte": "Monoposte (<10m²)",
        }
        return labels.get(fmt, fmt)
