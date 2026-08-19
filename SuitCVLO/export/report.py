from io import BytesIO
from pathlib import Path
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib.units import inch


def generate_pdf(results, catalog, output_path):
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    buf = BytesIO()
    c = canvas.Canvas(str(output_path), pagesize=letter)
    width, height = letter
    y = height - 50

    def write_line(text, font="Helvetica", size=10, indent=0):
        nonlocal y
        if y < 40:
            c.showPage()
            y = height - 50
        c.setFont(font, size)
        c.drawString(50 + indent, y, text[:130])
        y -= size * 1.5

    # Title
    write_line("SuitCVLO — OOH Billboard Report", "Helvetica-Bold", 18)
    y -= 10

    # Summary stats
    total_images = len(results)
    total_billboards = sum(len(r.get("billboards", [])) for r in results)
    unique_brands = len(set(bb.get("brand", "") for r in results for bb in r.get("billboards", []) if bb.get("brand")))
    with_geo = sum(1 for r in results if r.get("gps_lat"))

    write_line(f"Images processed: {total_images}", "Helvetica-Bold", 12)
    write_line(f"Billboards detected: {total_billboards}", size=11)
    write_line(f"Unique brands: {unique_brands}", size=11)
    write_line(f"With GPS: {with_geo}", size=11)
    y -= 15

    # Brand breakdown
    brand_counts = {}
    for r in results:
        for bb in r.get("billboards", []):
            brand = bb.get("brand", "unknown")
            brand_counts[brand] = brand_counts.get(brand, 0) + 1

    if brand_counts:
        write_line("=== Brands ===", "Helvetica-Bold", 12)
        for brand, count in sorted(brand_counts.items(), key=lambda x: -x[1]):
            write_line(f"  {brand}: {count}", size=10)
        y -= 10

    # Format breakdown
    format_counts = {}
    for r in results:
        for bb in r.get("billboards", []):
            fmt = bb.get("format", "unknown")
            format_counts[fmt] = format_counts.get(fmt, 0) + 1

    if format_counts:
        write_line("=== Formats ===", "Helvetica-Bold", 12)
        for fmt, count in sorted(format_counts.items(), key=lambda x: -x[1]):
            write_line(f"  {fmt}: {count}", size=10)
        y -= 10

    # Per-image details
    if results:
        write_line("=== Per-Image Detail ===", "Helvetica-Bold", 12)
        for r in results:
            img = r.get('image', '?')
            orig = r.get('original_filename') or img
            fecha = (r.get('captured_at') or '?')[:10]
            addr = (r.get('address') or '?')[:60]
            write_line(f"  {orig} | {fecha}", "Helvetica", 10)
            if addr != '?':
                write_line(f"    Location: {addr}", size=9, indent=10)
            for bb in r.get("billboards", []):
                brand = bb.get("brand", "?")
                fmt = bb.get("format", "?")
                campaign = bb.get("campaign_detail", "")[:60]
                cat = bb.get("campaign_type", "")[:20]
                write_line(f"    -> {brand} | {fmt} | {cat} | {campaign}", size=9, indent=10)
            y -= 5

    # Catalog (unique billboards)
    if catalog:
        y -= 10
        write_line("=== Unique Billboard Catalog ===", "Helvetica-Bold", 14)
        for entry in catalog[:20]:
            brand = entry.get("brand", "?")
            ocr = entry.get("ocr_text", "")[:60]
            occ = entry.get("occurrences", 0)
            centroid = entry.get("centroid", {})
            loc = f"{centroid.get('lat','?')}, {centroid.get('lng','?')}" if centroid else "No GPS"
            write_line(f"  {brand} ({occ}x) | {ocr} | {loc}", size=9)

        if len(catalog) > 20:
            write_line(f"  ... and {len(catalog) - 20} more unique billboards", size=9)

    c.save()
    return output_path
