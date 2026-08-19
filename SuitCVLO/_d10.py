import struct

f = "uploads/eaa3bc13dc2d4aa28c6fc23561d81a0c.CR3"
with open(f, "rb") as fh:
    data = fh.read()

# Search for GPS IFD tag 0x8825 in raw bytes (LE: 25 88)
# Also search for GPS tag values like GPSLatitudeRef (tag 0x0001)
gps_tags = [0x0000, 0x0001, 0x0002, 0x0003, 0x0004, 0x0005, 0x0006, 0x0007]
for tag_id in gps_tags:
    # LE representation (low byte first, then high byte)
    le = bytes([tag_id & 0xFF, (tag_id >> 8) & 0xFF])
    pos = 0
    while True:
        pos = data.find(le, pos)
        if pos == -1:
            break
        # Check if this is in a TIFF directory entry (preceded by 2 bytes: type, followed by 4 bytes: count)
        ctx = data[pos:pos+8]
        print(f"Tag LE 0x{tag_id:04x} at {pos} (0x{pos:x}): {ctx.hex()}")
        pos += 1

# Also search for the GPS IFD pointer tag (0x8825)
gps_ifd = bytes([0x25, 0x88])
pos = 0
while True:
    pos = data.find(gps_ifd, pos)
    if pos == -1:
        break
    # Show context: should be part of a TIFF IFD entry (tag type count offset)
    ctx = data[max(0,pos-2):pos+6]
    print(f"GPS IFD ptr at {pos} (0x{pos:x}): {ctx.hex()}")
    pos += 1

# Also search for common GPS coordinate values as rational numbers
# e.g. 25.7175 -> 25 43/60 = 25 43/60 around
# In TIFF, a rational is 8 bytes: 4 bytes numerator, 4 bytes denominator
# Let's search for latitude value patterns
# For 25 degrees, look for 25 as a 4-byte numerator
import re
for lat_deg in range(20, 31):
    num_deg = struct.pack("<I", lat_deg)
    for pos in range(0, len(data) - 15, 4):
        if data[pos:pos+4] == num_deg:
            # Check if followed by denominator
            den = struct.unpack("<I", data[pos+4:pos+8])[0]
            if den == 1 or 60 <= den <= 3600:
                ctx = data[max(0,pos-8):pos+16]
                print(f"Latitude {lat_deg} with den {den} at {pos} (0x{pos:x}): {ctx.hex()}")
