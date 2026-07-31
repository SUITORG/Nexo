f = "uploads/eaa3bc13dc2d4aa28c6fc23561d81a0c.CR3"
with open(f, "rb") as fh:
    data = fh.read()

# Check "GPS" at 0xfe1fd6 context
pos = 0xfe1fd6
print("=== GPS at 0xfe1fd6 ===")
chunk = data[max(0,pos-16):pos+128]
print(chunk.hex())
print("ASCII:", ''.join(chr(b) if 32 <= b < 127 else '.' for b in chunk))

# Check if this is inside a JPEG marker
# Look back for JPEG SOI (FF D8)
for i in range(pos, max(0, pos-10000), -1):
    if data[i:i+2] == b'\xff\xd8':
        print(f"\nFound JPEG SOI at 0x{i:x}, offset from GPS: {pos-i}")
        break

# Search for GPS coordinates as strings  
for coord in [b"25.71", b"25.72", b"100.38", b"100.39", b"-100.38"]:
    p = data.find(coord)
    if p >= 0:
        ctx = data[max(0,p-4):p+len(coord)+10]
        print(f"\nFound '{coord.decode()}' at 0x{p:x}: {ctx.hex()}")

# Also check the second GPS occurrence
pos2 = 0x12cc9ba
print(f"\n=== GPS at 0x{pos2:x} ===")
chunk2 = data[max(0,pos2-8):pos2+64]
print(chunk2.hex())
print("ASCII:", ''.join(chr(b) if 32 <= b < 127 else '.' for b in chunk2))
