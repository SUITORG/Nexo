from geo.metadata import extract_exif
import glob

cr3s = sorted(glob.glob("uploads/*.CR3"))[-3:]
jpgs = sorted(glob.glob("uploads/*.jpg"))[-3:]
for f in cr3s + jpgs:
    meta = extract_exif(f)
    print(f"{f.split('/')[-1]}: gps={meta['gps_lat']},{meta['gps_lng']}  date={meta['captured_at']}  cam={meta['camera_make']} {meta['camera_model']}")
