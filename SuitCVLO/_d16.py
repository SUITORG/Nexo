import rawpy, io, exifread

f = "uploads/eaa3bc13dc2d4aa28c6fc23561d81a0c.CR3"
with rawpy.imread(f) as raw:
    # Process the raw data first
    raw.dcraw_process()
    print("dcraw_process OK")
    
    # Now try to extract thumb
    try:
        thumb = raw.dcraw_make_mem_thumb()
        print(f"thumb: type={type(thumb)} len={len(thumb)}")
        if len(thumb) > 2 and thumb[:2] == b'\xff\xd8':
            tags = exifread.process_file(io.BytesIO(thumb), details=False)
            gps = {k: v for k, v in tags.items() if "GPS" in k}
            date = {k: v for k, v in tags.items() if "DateTime" in k}
            print(f"GPS: {gps}")
            print(f"Date: {date}")
        elif len(thumb) > 0:
            print(f"Not JPEG, starts: {thumb[:8].hex()}")
        else:
            print("Empty thumb")
    except Exception as e:
        print(f"thumb failed: {e}")
    
    # Also try the raw image metadata
    try:
        img = raw.dcraw_make_mem_image()
        # The image itself won't have EXIF metadata
        print(f"image: {img.shape}")
    except Exception as e:
        print(f"image failed: {e}")
