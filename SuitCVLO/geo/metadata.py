import exifread
from datetime import datetime


def extract_exif(image_path):
    with open(image_path, "rb") as f:
        tags = exifread.process_file(f, details=False)

    result = {
        "gps_lat": None,
        "gps_lng": None,
        "captured_at": None,
        "camera_make": None,
        "camera_model": None,
        "orientation": None,
        "image_width": None,
        "image_height": None,
    }

    if "GPS GPSLatitude" in tags and "GPS GPSLatitudeRef" in tags:
        lat = _dms_to_decimal(tags["GPS GPSLatitude"])
        if tags["GPS GPSLatitudeRef"].values != "N":
            lat = -lat
        result["gps_lat"] = round(lat, 6)

    if "GPS GPSLongitude" in tags and "GPS GPSLongitudeRef" in tags:
        lng = _dms_to_decimal(tags["GPS GPSLongitude"])
        if tags["GPS GPSLongitudeRef"].values != "E":
            lng = -lng
        result["gps_lng"] = round(lng, 6)

    for date_tag in ["EXIF DateTimeOriginal", "EXIF DateTimeDigitized", "Image DateTime"]:
        if date_tag in tags:
            try:
                result["captured_at"] = str(datetime.strptime(str(tags[date_tag]), "%Y:%m:%d %H:%M:%S"))
            except ValueError:
                pass
            break

    if "Image Make" in tags:
        result["camera_make"] = str(tags["Image Make"])
    if "Image Model" in tags:
        result["camera_model"] = str(tags["Image Model"])
    if "Image Orientation" in tags:
        result["orientation"] = int(str(tags["Image Orientation"]))
    if "EXIF ExifImageWidth" in tags:
        result["image_width"] = int(str(tags["EXIF ExifImageWidth"]))
    if "EXIF ExifImageLength" in tags:
        result["image_height"] = int(str(tags["EXIF ExifImageLength"]))

    return result


def _dms_to_decimal(dms_tag):
    dms = dms_tag.values
    if len(dms) == 3:
        return float(dms[0]) + float(dms[1]) / 60 + float(dms[2]) / 3600
    return 0.0
