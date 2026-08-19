import struct, io, exifread

f = "uploads/eaa3bc13dc2d4aa28c6fc23561d81a0c.CR3"
with open(f, "rb") as fh:
    data = fh.read()

def read_box(d, off):
    if off + 8 > len(d):
        return None
    size = struct.unpack(">I", d[off:off+4])[0]
    btype = d[off+4:off+8].decode('latin-1', errors='replace')
    data_off = off + 8
    end = off + size
    if size == 0:
        end = len(d)
    elif size == 1:
        if off + 16 > len(d):
            return None
        size = struct.unpack(">Q", d[off+8:off+16])[0]
        data_off = off + 16
        end = off + size
    return (btype, data_off, end, size)

def find_meta_box(d, start, end):
    """Find the 'meta' box with full path"""
    off = start
    while off < end:
        box = read_box(d, off)
        if not box:
            break
        btype, bd, be, bs = box
        if btype == 'meta':
            # Full box starts at 'off', data at 'bd', ends at 'be'
            return off, bd, be
        if btype in ('moov', 'udta', 'trak', 'mdia', 'minf', 'stbl'):
            sub = find_meta_box(d, bd, be)
            if sub:
                return sub
        off = be
    return None

# Find meta box
meta = find_meta_box(data, 0, len(data))
if meta:
    m_off, m_data, m_end = meta
    print(f"meta box at 0x{m_off:x}, data at 0x{m_data:x}, end at 0x{m_end:x}")
else:
    print("meta box not found")
    exit()

# Walk meta's children looking for iloc
off = m_data
while off < m_end:
    box = read_box(data, off)
    if not box:
        break
    btype, bd, be, bs = box
    print(f"  meta child: '{btype}' at 0x{off:x} (data=0x{bd:x}, size={bs})")
    
    if btype == 'iloc':
        # Parse iloc
        ver = data[bd]
        flags = data[bd+1:bd+4]
        # offset_size: 4 bits, length_size: 4 bits
        offset_size = ((data[bd+4] >> 4) & 0xF) + 1
        length_size = (data[bd+4] & 0xF) + 1
        base_offset_size = ((data[bd+5] >> 4) & 0xF) + 1 if ver in (0, 1) else 0
        index_size = (data[bd+5] & 0xF) + 1 if ver == 1 else 0
        item_count = struct.unpack(">H", data[bd+6:bd+8])[0]
        print(f"    version={ver}, offset_sz={offset_size}, length_sz={length_size}, base_sz={base_offset_size}, items={item_count}")
        
        ioff = bd + 8
        for item in range(item_count):
            item_id = struct.unpack(">H", data[ioff:ioff+2])[0]
            ioff += 2
            if ver == 1:
                construction = (data[ioff] >> 4) & 0xF
                data_ref = struct.unpack(">H", data[ioff+1:ioff+3])[0]
                ioff += 3
            else:
                ioff += 2  # construction_method (1) + data_reference_index (2)
            
            base = struct.unpack(">I", data[ioff:ioff+base_offset_size])[0] if base_offset_size > 0 else 0
            ioff += base_offset_size
            
            extent_count = struct.unpack(">H", data[ioff:ioff+2])[0]
            ioff += 2
            
            for ext in range(extent_count):
                ext_off = int.from_bytes(data[ioff:ioff+offset_size], 'big') if offset_size > 0 else 0
                ioff += offset_size
                ext_len = int.from_bytes(data[ioff:ioff+length_size], 'big') if length_size > 0 else 0
                ioff += length_size
                print(f"    item {item_id}, ext {ext}: offset=0x{ext_off:x}, length={ext_len}")
                
                # Check if this is the EXIF data item (we'll cross-reference with iinf)
                # For now, save location
                if ext_len > 0:
                    exif_data = data[ext_off:ext_off+min(ext_len, 100)]
                    print(f"      starts with: {exif_data[:20].hex()}")
    
    elif btype == 'iinf':
        ver2 = data[bd]
        if ver2 == 0:
            entry_count = struct.unpack(">H", data[bd+2:bd+4])[0]
            eoff = bd + 4
        else:
            entry_count = struct.unpack(">H", data[bd+6:bd+8])[0]
            eoff = bd + 8
        print(f"    entry_count={entry_count}")
        for ei in range(entry_count):
            item_id = struct.unpack(">H", data[eoff:eoff+2])[0]
            protection = struct.unpack(">H", data[eoff+2:eoff+4])[0]
            item_type = data[eoff+4:eoff+8].decode('latin-1', errors='replace')
            print(f"    item {item_id}: type='{item_type}' protection={protection}")
            eoff += 8
    
    off = be
