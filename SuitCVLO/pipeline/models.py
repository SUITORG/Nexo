from dataclasses import dataclass, asdict


@dataclass
class BillboardRecord:
    bbox: list
    confidence: float
    method: str
    format: str
    area_ratio: float
    ocr_text: str
    brand: str
    campaign_type: str
    campaign_detail: str

    def to_dict(self):
        return asdict(self)
