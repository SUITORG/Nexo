import struct

f = "uploads/eaa3bc13dc2d4aa28c6fc23561d81a0c.CR3"
with open(f, "rb") as fh:
    data = fh.read()

def walk_boxes(d, off, end, depth=0):
    while off < end and off + 8 <= len(d):
        size = struct.unpack(">I", d[off:off+4])[0]
        btype = d[off+4:off+8].decode('latin-1', errors='replace')
        data_off = off + 8
        box_end = off + size
        if size == 0:
            box_end = len(d)
        elif size == 1:
            if off + 16 > len(d):
                break
            size = struct.unpack(">Q", d[off+8:off+16])[0]
            data_off = off + 16
            box_end = off + size
        
        prefix = "  " * depth
        print(f"{prefix}'{btype}' size={size} at 0x{off:x}")
        
        if btype in ('moov', 'trak', 'mdia', 'minf', 'stbl', 'udta', 'meta', 'moof', 'traf'):
            walk_boxes(d, data_off, box_end, depth + 1)
        
        if size <= 0:
            break
        off = box_end

walk_boxes(data, 0, len(data))
