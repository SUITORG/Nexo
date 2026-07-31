import struct

f = "uploads/eaa3bc13dc2d4aa28c6fc23561d81a0c.CR3"
with open(f, "rb") as fh:
    data = fh.read()

def parse_box(d, off):
    """Parse ISOBMFF box, return (size, type, data_offset, end_offset) or None"""
    if off + 8 > len(d):
        return None
    size = struct.unpack(">I", d[off:off+4])[0]
    box_type = d[off+4:off+8].decode('latin-1', errors='replace')
    if size == 1:
        # 64-bit extended size
        size = struct.unpack(">Q", d[off+8:off+16])[0]
        data_off = off + 16
    elif size == 0:
        # extends to end of file
        size = len(d) - off
        data_off = off + 8
    else:
        data_off = off + 8
    return (size, box_type, data_off, off + size)

# Walk the top-level boxes
off = 0
print("Top-level boxes:")
while off < len(data):
    box = parse_box(data, off)
    if box is None:
        break
    size, box_type, data_off, end = box
    if size < 8:
        break
    print(f"  + {box_type}: offset={off} size={size}")
    
    # If it's 'moov', parse its children
    if box_type == 'moov':
        print(f"    Children of moov:")
        sub_off = data_off
        while sub_off < end:
            sub = parse_box(data, sub_off)
            if sub is None:
                break
            sub_size, sub_type, sub_data, sub_end = sub
            if sub_size < 8:
                break
            print(f"      - {sub_type}: offset={sub_off} size={sub_size}")
            
            # Check for 'meta' box inside moov
            if sub_type == 'meta':
                print(f"        Children of meta (offset={sub_data}, size={sub_size}):")
                meta_end = sub_end
                moff = sub_data
                while moff < meta_end:
                    mb = parse_box(data, moff)
                    if mb is None:
                        break
                    ms, mt, md, me = mb
                    if ms < 8:
                        break
                    print(f"          . {mt}: offset={moff} size={ms}")
                    
                    # iloc box contains item locations
                    if mt == 'iloc':
                        # Parse iloc
                        version = data[moff+8]
                        print(f"            version={version}")
                        # offset_size=4, length_size=4, base_offset_size=0, index_size=0
                        if version == 0:
                            offset_size = ((data[moff+9] >> 4) & 0xF) + 1
                            length_size = (data[moff+9] & 0xF) + 1
                            base_offset_size = 0
                            item_count = struct.unpack(">H", data[moff+10:moff+12])[0]
                            print(f"            item_count={item_count} offset_sz={offset_size} length_sz={length_size}")
                            ioff = moff + 12
                            for item_idx in range(item_count):
                                item_id = struct.unpack(">H", data[ioff:ioff+2])[0]
                                ioff += 2
                                # construction_method (1 byte) + data_reference_index (2 bytes)
                                ioff += 3
                                base_offset = 0
                                if base_offset_size > 0:
                                    base_offset = struct.unpack(">I", data[ioff:ioff+base_offset_size])[0]
                                    ioff += base_offset_size
                                extent_count = struct.unpack(">H", data[ioff:ioff+2])[0]
                                ioff += 2
                                for ext in range(extent_count):
                                    extent_offset = 0
                                    extent_length = 0
                                    if offset_size > 0:
                                        extent_offset = int.from_bytes(data[ioff:ioff+offset_size], 'big')
                                        ioff += offset_size
                                    if length_size > 0:
                                        extent_length = int.from_bytes(data[ioff:ioff+length_size], 'big')
                                        ioff += length_size
                                    print(f"            item_id={item_id} offset=0x{extent_offset:x} length={extent_length}")
                    
                    # iinf box contains item info (types)
                    if mt == 'iinf':
                        version2 = data[moff+8]
                        entry_count = struct.unpack(">H", data[moff+9:moff+11])[0]
                        print(f"            entry_count={entry_count}")
                        eoff = moff + 11
                        for ei in range(entry_count):
                            item_id = struct.unpack(">H", data[eoff:eoff+2])[0]
                            item_name = data[eoff+6:eoff+10].decode('latin-1', errors='replace')
                            print(f"            item_id={item_id} type='{item_name}'")
                            # item_name is 4 bytes starting at offset 6
                            eoff += 10  # approximate
                    
                    moff = me
            
            sub_off = sub_end
    
    off = end
