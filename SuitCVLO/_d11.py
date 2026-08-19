import rawpy

f = "uploads/eaa3bc13dc2d4aa28c6fc23561d81a0c.CR3"
with rawpy.imread(f) as raw:
    # List all attributes
    attrs = [a for a in dir(raw) if not a.startswith('_')]
    print("Attributes:", attrs)
    
    # Try common metadata attributes
    for attr in ['camera_make', 'camera_model', 'make', 'model', 'raw_make', 'raw_model',
                 'sizes', 'color_desc', 'color_description',
                 'as shot', 'as_shot_neutral', 'wb',
                 'exif', 'metadata', 'parse_metadata']:
        if hasattr(raw, attr):
            val = getattr(raw, attr)
            if callable(val):
                try:
                    val = val()
                except:
                    val = '<callable>'
            print(f"{attr}: {val}")
