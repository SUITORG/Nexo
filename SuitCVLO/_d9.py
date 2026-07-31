import io
import exifread

f = "uploads/eaa3bc13dc2d4aa28c6fc23561d81a0c.CR3"
with open(f, "rb") as fh:
    data = fh.read()

# Check all TIFF LE locations for GPS
for off in [0x140, 0x2c2, 0x348, 0x7ad, 0x950, 0x3abc, 0x3acc, 0x3b58, 0x19ffa7c, 0x19ffa9a, 0x1a01218, 0x1a1b34e]:
    chunk = io.BytesIO(data[off:])
    try:
        tags = exifread.process_file(chunk, details=True)
        gps = {k: v for k, v in tags.items() if "GPS" in k}
        if gps:
            print(f"0x{off:x}: GPS FOUND: {gps}")
        elif tags:
            keys = list(tags.keys())
            print(f"0x{off:x}: {len(tags)} tags, GPS not here. First 3: {keys[:3]}")
        else:
            print(f"0x{off:x}: 0 tags")
    except Exception as e:
        print(f"0x{off:x}: {e}")
