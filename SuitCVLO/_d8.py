import io
import exifread

f = "uploads/eaa3bc13dc2d4aa28c6fc23561d81a0c.CR3"
with open(f, "rb") as fh:
    data = fh.read()

# Parse TIFF LE block at offset 0x140 (and nearby ones)
for off in [0x140, 0x2c2, 0x348, 0x7ad]:
    chunk = io.BytesIO(data[off:])
    try:
        tags = exifread.process_file(chunk, details=False)
        gps = {k: v for k, v in tags.items() if "GPS" in k}
        date = {k: v for k, v in tags.items() if "DateTime" in k}
        if gps or date:
            print(f"0x{off:x}: GPS={gps} Date={date}")
        elif tags:
            print(f"0x{off:x}: {len(tags)} tags (no GPS)")
        else:
            print(f"0x{off:x}: 0 tags")
    except Exception as e:
        print(f"0x{off:x}: error {e}")
