import re

CAMPAIGN_PATTERNS = [
    (r"\b(?:nueva|new|promo|oferta|descuento|2x1|gratis|free|ahorra|save)\s+(.+?)(?:\.|$)", "promo"),
    (r"\b(?:lanzamiento|launch|presenta|introducing|nuevo|new)\s+(.+?)(?:\.|$)", "launch"),
    (r"\b(?:edición\s+limitada|limited\s+edition|exclusivo)\s+(.+?)(?:\.|$)", "limited"),
    (r"\b(?:feliz|celebra|celebremos|fiesta|party|navidad|año\s+nuevo|día\s+del|amor|amistad)\s*(.+?)?(?:\.|$)", "seasonal"),
    (r"\b(?:más\s+cerca|contigo|juntos|unidos|comunidad)\s+(.+?)?(?:\.|$)", "community"),
    (r"\b(?:verde|eco|sustentable|recicla|planeta|natura|green|eco-friendly)\s+(.+?)?(?:\.|$)", "sustainability"),
]

UNKNOWN_CAMPAIGN = "general"


class CampaignExtractor:
    def extract(self, text):
        text_clean = text.strip()
        if not text_clean:
            return UNKNOWN_CAMPAIGN, ""
        for pattern, ctype in CAMPAIGN_PATTERNS:
            match = re.search(pattern, text_clean, re.IGNORECASE)
            if match:
                detail = match.group(1).strip() if match.lastindex and match.group(1) else text_clean[:60]
                return ctype, detail[:80]
        return UNKNOWN_CAMPAIGN, text_clean[:80]
