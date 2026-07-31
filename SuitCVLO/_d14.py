import struct

f = "uploads/eaa3bc13dc2d4aa28c6fc23561d81a0c.CR3"
with open(f, "rb") as fh:
    data = fh.read()

# At offset 0x140, we found TIFF LE (II\x2a\x00)
# Parse the IFD chain to find GPS IFD (tag 0x8825)
offset = 0x140
byte_order = '<' if data[offset:offset+2] == b'II' else '>'
print(f"Byte order: {'LE' if byte_order == '<' else 'BE'}")

# After II + 0x2a (4 bytes), the offset to first IFD
ifd_offset = struct.unpack(byte_order + 'I', data[offset+4:offset+8])[0]
print(f"First IFD offset from TIFF header start: {ifd_offset}")
print(f"Absolute offset: {offset + ifd_offset} (0x{offset + ifd_offset:x})")

# Parse IFD entries
pos = offset + ifd_offset
num_entries = struct.unpack(byte_order + 'H', data[pos:pos+2])[0]
print(f"Number of IFD entries: {num_entries}")
pos += 2

for i in range(num_entries):
    tag = struct.unpack(byte_order + 'H', data[pos:pos+2])[0]
    type_ = struct.unpack(byte_order + 'H', data[pos+2:pos+4])[0]
    count = struct.unpack(byte_order + 'I', data[pos+4:pos+8])[0]
    value = data[pos+8:pos+12]
    pos += 12
    
    if tag == 0x8769:  # ExifIFD
        exif_offset = struct.unpack(byte_order + 'I', value)[0]
        print(f"  ExifIFD tag (0x8769) -> offset {exif_offset} (abs: 0x{offset + exif_offset:x})")
    elif tag == 0x8825:  # GPS IFD
        gps_offset = struct.unpack(byte_order + 'I', value)[0]
        print(f"  GPS IFD tag (0x8825) -> offset {gps_offset} (abs: 0x{offset + gps_offset:x})")
    elif tag == 0x927c:  # MakerNote
        maker_offset = struct.unpack(byte_order + 'I', value)[0]
        print(f"  MakerNote tag (0x927c) -> offset {maker_offset}")
    else:
        # Print only interesting tags
        tag_names = {0x010f: "Make", 0x0110: "Model", 0x0112: "Orientation",
                     0x0132: "DateTime", 0x0100: "ImageWidth", 0x0101: "ImageLength"}
        if tag in tag_names:
            print(f"  {tag_names[tag]} (0x{tag:04x}): type={type_} count={count} value={value[:8].hex()}")

# Now check the next IFD pointer
next_ifd = struct.unpack(byte_order + 'I', data[pos:pos+4])[0]
print(f"\nNext IFD offset: {next_ifd} (abs: 0x{offset + next_ifd:x})")
