import io
import exifread

f = "uploads/eaa3bc13dc2d4aa28c6fc23561d81a0c.CR3"
with open(f, "rb") as fh:
    data = fh.read()

# Try each TIFF offset
for offset in [0x5c998f, 0x183b1b5, 0x8bcb4e]:
    chunk = io.BytesIO(data[offset:])
    print(f"\n--- offset 0x{offset:x} ---")
    try:
        tags = exifread.process_file(chunk, details=False)
        gps = {k: v for k, v in tags.items() if "GPS" in k}
        date = {k: v for k, v in tags.items() if "DateTime" in k}
        if gps or date:
            print("GPS:", gps)
            print("Date:", date)
        else:
            print("No GPS/Date tags found")
            # Show first 10 tag names
            keys = list(tags.keys())
            print(f"  {len(keys)} total tags: {keys[:5]}...")
    except Exception as e:
        print(f"Error: {e}")
