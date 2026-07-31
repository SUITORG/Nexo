import rawpy
import io
import exifread

f = "uploads/eaa3bc13dc2d4aa28c6fc23561d81a0c.CR3"
with rawpy.imread(f) as raw:
    # Try different thumb methods
    print("Trying dcraw_make_mem_thumb...")
    try:
        thumb = raw.dcraw_make_mem_thumb()
        print(f"thumb type: {type(thumb)} len={len(thumb)}")
        if len(thumb) > 0:
            # Try reading as JPEG
            import struct
            # Check if it's JPEG (starts with FF D8)
            if thumb[0:2] == b'\xff\xd8':
                print("It's a JPEG thumbnail!")
                tags = exifread.process_file(io.BytesIO(thumb), details=False)
                gps = {k: v for k, v in tags.items() if "GPS" in k}
                print("GPS from thumb JPEG:", gps)
                date = {k: v for k, v in tags.items() if "DateTime" in k}
                print("Date from thumb JPEG:", date)
            else:
                print(f"Not JPEG, starts with: {thumb[:8].hex()}")
    except Exception as e:
        print(f"dcraw_make_mem_thumb failed: {e}")
    
    # Try unpack_thumb
    print("\nTrying unpack_thumb...")
    try:
        thumb = raw.unpack_thumb()
        print(f"unpack_thumb type: {type(thumb)} len={len(thumb) if hasattr(thumb, '__len__') else '?'}")
    except Exception as e:
        print(f"unpack_thumb failed: {e}")
    
    # Try dcraw_make_mem_image
    print("\nTrying dcraw_make_mem_image...")
    try:
        img = raw.dcraw_make_mem_image()
        print(f"dcraw_make_mem_image type: {type(img)} len={len(img)}")
    except Exception as e:
        print(f"dcraw_make_mem_image failed: {e}")
