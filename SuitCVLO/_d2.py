import exifread

f = "uploads/e536b4e9bcdf475a9e644758e5013c45.CR3"
with open(f, "rb") as fh:
    tags = exifread.process_file(fh, details=False)

gps_keys = [k for k in tags if "GPS" in k]
all_keys = sorted(tags.keys())
print("GPS keys found:", gps_keys)
print("\nAll tags:")
for k in all_keys:
    print(f"  {k}: {tags[k]}")
