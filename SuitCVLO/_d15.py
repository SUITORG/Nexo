import struct, io, exifread

f = "uploads/eaa3bc13dc2d4aa28c6fc23561d81a0c.CR3"
with open(f, "rb") as fh:
    data = fh.read()

# All TIFF LE offsets we found - check each for ExifIFD and GPS IFD pointers
for tiff_off in [0x140, 0x2c2, 0x348, 0x7ad, 0x950, 0x3abc, 0x3acc, 0x3b58, 0x19ffa7c, 0x19ffa9a, 0x1a01218, 0x1a1b34e]:
    offset = tiff_off
    byte_order = '<' if data[offset:offset+2] == b'II' else '>'
    magic = struct.unpack(byte_order + 'H', data[offset+2:offset+4])[0]
    if magic != 42:
        continue
    ifd_off = struct.unpack(byte_order + 'I', data[offset+4:offset+8])[0]
    pos = offset + ifd_off
    num = struct.unpack(byte_order + 'H', data[pos:pos+2])[0]
    pos += 2
    has_exif = False
    has_gps = False
    for i in range(num):
        tag = struct.unpack(byte_order + 'H', data[pos:pos+2])[0]
        pos += 12
        if tag == 0x8769:
            has_exif = True
        if tag == 0x8825:
            has_gps = True
    if has_exif or has_gps:
        print(f"0x{offset:x}: {num} entries, ExifIFD={has_exif} GPS={has_gps}")
        # Now parse the Exif/GPS sub-IFDs
        pos2 = offset + ifd_off + 2
        for i in range(num):
            tag = struct.unpack(byte_order + 'H', data[pos2:pos2+2])[0]
            if tag in (0x8769, 0x8825):
                val = struct.unpack(byte_order + 'I', data[pos2+8:pos2+12])[0]
                print(f"  Tag 0x{tag:04x} -> sub-IFD at abs 0x{offset+val:x}")
            pos2 += 12
