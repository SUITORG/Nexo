import struct

f = "uploads/eaa3bc13dc2d4aa28c6fc23561d81a0c.CR3"
with open(f, "rb") as fh:
    data = fh.read()

# Known GPS from JPG: 25.717548, -100.384528
# Search for 25.717 as bytes (float32 = 0x41cdb7a2 or for rational: 25 -> 0x19, 43/60 -> 0x2B/0x3C etc.)
# Search for latitude 25 degrees as uint32 LE
lat_deg_packed = struct.pack("<I", 25)
pos = 0
while True:
    pos = data.find(lat_deg_packed, pos)
    if pos == -1:
        break
    # Check context - look for nearby "N" or "S" for lat ref
    ctx = data[max(0,pos-4):pos+12]
    print(f"Found 25 at 0x{pos:x} (abs in file): {ctx.hex()}")
    pos += 1

# Also search for the string "GPS" 
for marker in [b"GPS", b"gps", b"GPSLatitude", b"GPSLongitude", b"GPSLatitudeRef", b"GPSLongitudeRef"]:
    pos = data.find(marker)
    if pos >= 0:
        ctx = data[max(0,pos-4):pos+len(marker)+4]
        print(f"Found '{marker.decode()}' at 0x{pos:x}: {ctx.hex()}")

# Check the Canon uuid box (0x20 size 46024) more carefully
# This box spans 0x20 to 0xb3e8
# Look for GPS-related tags or MakerNote in the uuid box
uuid_box = data[0x20:0xb3e8]
# Search for MakerNote marker inside
for marker in [b"MakerNote", b"makernote", b"Camera", b"SerialNumber"]:
    pos = uuid_box.find(marker)
    if pos >= 0:
        print(f"'{marker.decode()}' in UUID box at offset 0x{0x20+pos:x}")

# The uuid box has a 16-byte UUID at the start, then data
# Canon's CR3 uuid starts with specific UUID
uuid_bytes = data[0x20+8:0x20+8+16]
uuid_hex = uuid_bytes.hex()
print(f"UUID box UUID: {uuid_hex}")
