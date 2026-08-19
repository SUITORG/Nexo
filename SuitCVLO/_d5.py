# Find EXIF block in CR3 file by searching for TIFF header
import struct

f = "uploads/eaa3bc13dc2d4aa28c6fc23561d81a0c.CR3"
with open(f, "rb") as fh:
    data = fh.read()

# Search for "Exif\0\0" or "MM\0*" (big-endian TIFF) or "II\0*" (little-endian)
for marker in [b"Exif\0\0", b"MM\x00", b"II\x00"]:
    pos = 0
    while True:
        pos = data.find(marker, pos)
        if pos == -1:
            break
        print(f"Found '{marker}' at offset {pos} (0x{pos:x})")
        # Show 50 bytes around it
        start = max(0, pos - 4)
        end = min(len(data), pos + 50)
        print(f"  Context: {data[start:end].hex()}")
        pos += 1

# Also search for GPS tags
for tag in [b"GPS ", b"gps ", b"GPSLatitude"]:
    if tag in data:
        pos = data.find(tag)
        print(f"Found '{tag}' at offset {pos}")
