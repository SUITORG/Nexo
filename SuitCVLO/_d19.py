import struct, io, exifread

f = "uploads/eaa3bc13dc2d4aa28c6fc23561d81a0c.CR3"
with open(f, "rb") as fh:
    data = fh.read()

# Brute-force find ALL TIFF blocks, not just the ones at specific offsets
# A TIFF LE header is II\x2a\x00 (49 49 2a 00)
count = 0
i = 0
while i < len(data) - 4:
    if data[i:i+2] == b'II' and data[i+2:i+4] == b'\x2a\x00':
        # Got a TIFF LE header
        ifd_off = struct.unpack('<I', data[i+4:i+8])[0]
        
        # Check if this IFD contains ExifIFD or GPS IFD pointers
        pos = i + ifd_off
        if pos + 2 > len(data):
            i += 1
            continue
        num = struct.unpack('<H', data[pos:pos+2])[0]
        pos += 2
        
        has_exif = False
        has_gps = False
        for j in range(min(num, 100)):  # limit to 100 entries
            if pos + 12 > len(data):
                break
            tag = struct.unpack('<H', data[pos:pos+2])[0]
            if tag == 0x8769:
                has_exif = True
            if tag == 0x8825:
                has_gps = True
            pos += 12
            if has_exif and has_gps:
                break
        
        if has_gps:
            count += 1
            print(f"Found GPS IFD at TIFF offset 0x{i:x} (IFD={ifd_off} entries={num})")
            # Parse GPS data using exifread
            chunk = data[i:]
            tags = exifread.process_file(io.BytesIO(chunk), details=False)
            gps = {k: v for k, v in tags.items() if "GPS" in k}
            print(f"  GPS: {gps}")
    
    i += 1

if count == 0:
    print("No GPS IFD found in any TIFF block in the CR3 file.")

# Also try exifread with full details on the main TIFFs to see more
print("\n--- Detailed exifread on main TIFF at 0x140 ---")
chunk = data[0x140:]
tags = exifread.process_file(io.BytesIO(chunk), details=True)
for k, v in sorted(tags.items()):
    print(f"  {k}: {v}")
