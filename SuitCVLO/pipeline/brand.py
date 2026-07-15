import re

BRAND_KEYWORDS = {
    # Beverages
    "coca-cola": ["coca cola", "coca-cola", "cocacola", "coke", "sprite", "fanta"],
    "pepsi": ["pepsi", "pepsi-cola", "pepsi cola", "manzanita", "mirinda"],
    "modelo": ["cerveza modelo", "modelo especial", "corona", "victoria", "pacífico", "modelo"],
    "heineken": ["heineken", "tecate", "sol", "dos equis", "indio", "bohemia"],
    "jose cuervo": ["jose cuervo", "cuervo", "reserva"],
    "bonafont": ["bonafont", "bonafont"],
    "ciel": ["ciel", "ciel"],
    "powerade": ["powerade"],
    "gatorade": ["gatorade"],
    # Fast food / restaurants
    "mcdonalds": ["mcdonald", "mcdonalds", "mccafe", "happy meal"],
    "burger king": ["burger king", "whopper", "king"],
    "kfc": ["kfc", "kentucky", "colonel"],
    "starbucks": ["starbucks", "starbuck"],
    "dominos": ["domino", "dominos"],
    "pizza hut": ["pizza hut", "pizzahut"],
    "little caesars": ["little caesars", "litt caesar"],
    "pollo": ["pollo", "pollos"],
    "kfc": ["pollo frito", "kentucky"],
    "subway": ["subway", "sub way"],
    "oxxo": ["oxxo", "oxxo"],
    # Tech
    "apple": ["apple", "iphone", "ipad", "macbook", "mac", "ios"],
    "samsung": ["samsung", "galaxy"],
    "huawei": ["huawei"],
    "xiaomi": ["xiaomi"],
    "google": ["google", "android", "youtube", "gmail"],
    "microsoft": ["microsoft", "windows", "office", "teams"],
    # Telecom
    "telcel": ["telcel"],
    "movistar": ["movistar"],
    "at&t": ["att", "at&t", "at t"],
    "megacable": ["megacable", "mega cable"],
    "izzi": ["izzi"],
    # Auto
    "toyota": ["toyota"],
    "nissan": ["nissan"],
    "honda": ["honda"],
    "chevrolet": ["chevrolet", "chevy", "gm"],
    "ford": ["ford"],
    "volkswagen": ["volkswagen", "vw"],
    "bmw": ["bmw", "bimmer"],
    "mercedes": ["mercedes", "mercedes-benz"],
    "audi": ["audi"],
    "ferrari": ["ferrari"],
    "jeep": ["jeep"],
    "mazda": ["mazda"],
    # Retail
    "walmart": ["walmart", "wal-mart", "walmex", "bodega"],
    "soriana": ["soriana"],
    "hextar": ["hextar"],
    "coppel": ["coppel"],
    "elektra": ["elektra"],
    "liverpool": ["liverpool"],
    "palacio de hierro": ["palacio de hierro"],
    # Finance
    "bbva": ["bbva", "bbva bancomer"],
    "banamex": ["banamex", "citibanamex"],
    "santander": ["santander"],
    "banorte": ["banorte"],
    "pension": ["pension", "afp", "afore", "pensionissste"],
    # Other
    "bimbo": ["bimbo"],
    "sabritas": ["sabritas"],
    "nike": ["nike", "just do it"],
    "adidas": ["adidas"],
    "liverpool": ["liverpool"],
    "home depot": ["home depot", "home depot"],
    "hextar": ["hextar", "hex tar"],
}

UNKNOWN_BRAND = "unknown"


class BrandExtractor:
    def __init__(self, custom_brands=None):
        self.brands = {**BRAND_KEYWORDS}
        if custom_brands:
            self.brands.update(custom_brands)

    def extract(self, text):
        text_lower = text.lower().strip()
        if not text_lower:
            return UNKNOWN_BRAND
        matches = []
        for brand, keywords in self.brands.items():
            for kw in keywords:
                if kw in text_lower:
                    matches.append((brand, text_lower.index(kw)))
        if not matches:
            return UNKNOWN_BRAND
        matches.sort(key=lambda x: x[1])
        return matches[0][0]

    def add_brand(self, name, keywords):
        self.brands[name.lower()] = [k.lower() for k in keywords]
