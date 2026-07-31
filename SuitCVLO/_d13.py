import exif

f = "uploads/eaa3bc13dc2d4aa28c6fc23561d81a0c.CR3"
try:
    img = exif.Image(f)
    print(f"Got Image object: has_exif={img.has_exif}")
    print(f"make={img.make} model={img.model}")
    print(f"datetime={img.datetime_original}")
    print(f"gps_lat={img.gps_latitude} gps_lng={img.gps_longitude}")
    # List all attributes
    attrs = [a for a in dir(img) if not a.startswith('_') and not a[0].islower() and a != 'get']
    print(f"\nEXIF attrs: {attrs}")
except Exception as e:
    print(f"exif library error: {e}")
