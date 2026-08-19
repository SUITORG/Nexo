import struct

f = "uploads/eaa3bc13dc2d4aa28c6fc23561d81a0c.CR3"
with open(f, "rb") as fh:
    data = fh.read()

# Search for TIFF magic 0x002a (42 in LE) or 0x2a00 (42 in BE)
# TIFF LE header: II\x2a\0x00  (byte 49 49 2a 00)
# TIFF BE header: MM\x00\x2a  (byte 4d 4d 00 2a)
for i in range(len(data) - 3):
    if data[i:i+2] == b'MM' and data[i+2:i+4] == b'\x00\x2a':
        print(f"TIFF BE at {i} (0x{i:x})")
    if data[i:i+2] == b'II' and data[i+2:i+4] == b'\x2a\x00':
        print(f"TIFF LE at {i} (0x{i:x})")

print("\nSearching for byte-level patterns:")
# rawpy does find the CR3 valid - it reports 6000x4000
# Let's look for known EXIF tags near the 'meta' box
# CR3 stores EXIF in 'moov' > 'meta' > ... 
# Search for "exif" box type
for marker in [b"exif", b"Exif", b"meta", b"moov"]:
    pos = 0
    while True:
        pos = data.find(marker, pos)
        if pos == -1:
            break
        # Print the 8 bytes before (box size) and after
        chunk = data[max(0,pos-8):pos+10]
        print(f"'{marker.decode()}' at {pos} (0x{pos:x}) ctx: {chunk[:18].hex()}")
        pos += 1
