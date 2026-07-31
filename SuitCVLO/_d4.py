# This script will read CR3 file and dump metadata using rawpy + PIL fallback
import sys
import rawpy
import io
from PIL import Image

f = sys.argv[1]
print(f"File: {f}")

# Try rawpy to get thumb
try:
    with rawpy.imread(f) as raw:
        colors = raw.color_description if hasattr(raw, 'color_description') else '?'
        sizes = raw.sizes if hasattr(raw, 'sizes') else '?'
        print(f"rawpy OK: colors={colors} sizes={sizes}")
        
        # Try to extract thumbnail
        try:
            thumb = raw.extract_thumb()
            print(f"thumb format={thumb.format} size={len(thumb.data)}")
            import exifread
            tags = exifread.process_file(io.BytesIO(thumb.data), details=False)
            if tags:
                print("EXIF from thumb:")
                for k in sorted(tags.keys()):
                    if "GPS" in k or "DateTime" in k:
                        print(f"  {k}: {tags[k]}")
        except Exception as e2:
            print(f"thumb extract: {e2}")
except Exception as e:
    print(f"rawpy: {e}")

# Try PIL
try:
    img = Image.open(f)
    print(f"PIL: format={img.format} mode={img.mode} size={img.size}")
    exif = img._getexif()
    if exif:
        for tag, val in sorted(exif.items()):
            if tag in (271, 272, 34853, 36867, 36868):  # make, model, GPS, date
                print(f"  tag {tag}: {val}")
except Exception as e:
    print(f"PIL: {e}")
