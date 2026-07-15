from io import BytesIO
from fastapi import APIRouter, Query
from fastapi.responses import StreamingResponse
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from db.local import LocalStore

router = APIRouter(prefix="/reports", tags=["reports"])
local_db = LocalStore()


@router.get("/pdf")
def export_pdf(user_id: str = Query(None)):
    detections = local_db.get_detections(user_id, limit=500)
    buf = BytesIO()
    c = canvas.Canvas(buf, pagesize=letter)
    width, height = letter
    c.setFont("Helvetica-Bold", 16)
    c.drawString(50, height - 50, "SuitCVLO - Detection Report")
    c.setFont("Helvetica", 10)
    y = height - 80
    for d in detections:
        if y < 50:
            c.showPage()
            c.setFont("Helvetica", 10)
            y = height - 50
        text = f"#{d['id']} | {d.get('classification','?')} | {d.get('captured_at','?')} | {d.get('address','?')}"
        c.drawString(50, y, text[:120])
        y -= 14
    c.save()
    buf.seek(0)
    return StreamingResponse(buf, media_type="application/pdf", headers={"Content-Disposition": "inline; filename=suitcvlo_report.pdf"})
