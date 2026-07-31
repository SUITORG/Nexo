import struct, io, exifread

# Check a JPG file from the same camera that HAS GPS
f = "uploads/d50bd2433c4046c7ad0c45569b41024c.jpg"
with open(f, "rb") as fh:
    data = fh.read()

# Find the TIFF header (at the start of EXIF segment)
# For JPEG, look for "Exif\0\0" marker
pos = data.find(b"Exif\x00\x00")
if pos >= 0:
    tiff_start = pos + 6  # skip "Exif\0\0"
    byte_order = '<' if data[tiff_start:tiff_start+2] == b'II' else '>'
    ifd_off = struct.unpack(byte_order + 'I', data[tiff_start+4:tiff_start+8])[0]
    pos2 = tiff_start + ifd_off
    num = struct.unpack(byte_order + 'H', data[pos2:pos2+2])[0]
    pos2 += 2
    
    print(f"JPG TIFF at offset {tiff_start} (0x{tiff_start:x})")
    print(f"IFD at {ifd_off}, {num} entries")
    
    for i in range(num):
        tag = struct.unpack(byte_order + 'H', data[pos2:pos2+2])[0]
        type_ = struct.unpack(byte_order + 'H', data[pos2+2:pos2+4])[0]
        count = struct.unpack(byte_order + 'I', data[pos2+4:pos2+8])[0]
        value = data[pos2+8:pos2+12]
        pos2 += 12
        
        if tag in (0x8769, 0x8825):
            sub_off = struct.unpack(byte_order + 'I', value)[0] + tiff_start
            # Parse the sub-IFD
            sub_num = struct.unpack(byte_order + 'H', data[sub_off:sub_off+2])[0]
            print(f"  Tag 0x{tag:04x} -> sub-IFD at 0x{sub_off:x} with {sub_num} entries")
            if tag == 0x8825:  # GPS
                gps_pos = sub_off + 2
                for j in range(sub_num):
                    gtag = struct.unpack(byte_order + 'H', data[gps_pos:gps_pos+2])[0]
                    gtype = struct.unpack(byte_order + 'H', data[gps_pos+2:gps_pos+4])[0]
                    gcount = struct.unpack(byte_order + 'I', data[gps_pos+4:gps_pos+8])[0]
                    gval = data[gps_pos+8:gps_pos+12]
                    gps_pos += 12
                    
                    if gtag in (0x0001, 0x0003):  # GPSLatitudeRef / GPSLongitudeRef
                        gstr_off = struct.unpack(byte_order + 'I', gval)[0] + tiff_start
                        gstr = data[gstr_off:gstr_off+gcount].decode('ascii', errors='replace')
                        print(f"    GPS tag 0x{gtag:04x}: {gstr}")
                    elif gtag in (0x0002, 0x0004):  # GPSLatitude / GPSLongitude
                        rat_off = struct.unpack(byte_order + 'I', gval)[0] + tiff_start
                        deg = struct.unpack(byte_order + 'I', data[rat_off:rat_off+4])[0]
                        deg_d = struct.unpack(byte_order + 'I', data[rat_off+4:rat_off+8])[0]
                        min_ = struct.unpack(byte_order + 'I', data[rat_off+8:rat_off+12])[0]
                        min_d = struct.unpack(byte_order + 'I', data[rat_off+12:rat_off+16])[0]
                        sec = struct.unpack(byte_order + 'I', data[rat_off+16:rat_off+20])[0]
                        sec_d = struct.unpack(byte_order + 'I', data[rat_off+20:rat_off+24])[0]
                        coord = deg/deg_d + min_/min_d/60 + sec/sec_d/3600
                        print(f"    GPS tag 0x{gtag:04x}: {coord:.6f}")
        elif tag in (0x010f, 0x0110, 0x0132):
            str_off = struct.unpack(byte_order + 'I', value)[0] + tiff_start
            val = data[str_off:str_off+count].decode('ascii', errors='replace')
            print(f"  Tag 0x{tag:04x}: {val}")
    
    # Next IFD
    next_ifd = struct.unpack(byte_order + 'I', data[pos2:pos2+4])[0]
    print(f"Next IFD offset from TIFF start: {next_ifd}")
