import struct

f = "uploads/eaa3bc13dc2d4aa28c6fc23561d81a0c.CR3"
with open(f, "rb") as fh:
    data = fh.read()

# The Canon uuid box is at 0x20, size 46024
# After 16-byte UUID, data starts at 0x30
uuid_data = data[0x30:0xb3e8]

# This data contains TIFF IFDs. Let's scan for all TIFF blocks in here
# We already know about these TIFF offsets (relative to file start):
tiff_offsets = [0x140, 0x2c2, 0x348, 0x7ad, 0x950]

# For each TIFF, try to follow the IFD chain (next IFD pointer)
for base_off in tiff_offsets:
    byte_order = '<'  # CR3 uses LE TIFF
    ifd_start = struct.unpack('<I', data[base_off+4:base_off+8])[0]
    abs_ifd = base_off + ifd_start
    
    # Walk the IFD chain
    while abs_ifd > 0 and abs_ifd < len(data) - 4:
        num = struct.unpack('<H', data[abs_ifd:abs_ifd+2])[0]
        if num > 200:  # Sanity check
            break
        
        entries_end_off = abs_ifd + 2 + num * 12
        if entries_end_off + 4 > len(data):
            break
        
        next_ifd = struct.unpack('<I', data[entries_end_off:entries_end_off+4])[0]
        
        print(f"\nTIFF base=0x{base_off:x}, IFD at 0x{abs_ifd:x}, {num} entries, next_IFD={next_ifd} (abs 0x{base_off+next_ifd:x})")
        
        for i in range(num):
            tag = struct.unpack('<H', data[abs_ifd+2+i*12:abs_ifd+4+i*12])[0]
            ttype = struct.unpack('<H', data[abs_ifd+4+i*12:abs_ifd+6+i*12])[0]
            count = struct.unpack('<I', data[abs_ifd+6+i*12:abs_ifd+10+i*12])[0]
            val_raw = data[abs_ifd+10+i*12:abs_ifd+14+i*12]
            
            tag_names = {
                0x010f: "Make", 0x0110: "Model", 0x0132: "DateTime",
                0x8769: "ExifIFD", 0x8825: "GPS_IFD", 0x927c: "MakerNote",
                0x829a: "ExposureTime", 0x829d: "FNumber",
                0x9003: "DateTimeOriginal", 0x9004: "DateTimeDigitized",
            }
            name = tag_names.get(tag, f"0x{tag:04x}")
            
            if tag == 0x8769:  # ExifIFD pointer
                sub_off = struct.unpack('<I', val_raw)[0] + base_off
                print(f"  -> ExifIFD sub-IFD at 0x{sub_off:x} (abs)")
                abs_ifd = sub_off
                next_ifd = 0  # Don't continue main chain, dive into sub-IFD
                break
            elif tag == 0x8825:  # GPS IFD pointer
                gps_off = struct.unpack('<I', val_raw)[0] + base_off
                print(f"  -> GPS IFD at 0x{gps_off:x} (abs)")
            elif tag in (0x010f, 0x0110, 0x0132, 0x9003, 0x927c):
                str_off = struct.unpack('<I', val_raw)[0] + base_off
                val = data[str_off:str_off+min(count, 50)].decode('ascii', errors='replace').rstrip('\x00')
                print(f"  {name}: {val}")
        
        if next_ifd == 0:
            break
        abs_ifd = base_off + next_ifd
