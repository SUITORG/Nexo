import struct
import exifread
from datetime import datetime
from pathlib import Path

_ORIENT_MAP = {
    "Horizontal (normal)": 1,
    "Mirror horizontal": 2,
    "Rotate 180": 3,
    "Mirror vertical": 4,
    "Mirror horizontal and rotate 270 CW": 5,
    "Rotate 90 CW": 6,
    "Mirror horizontal and rotate 90 CW": 7,
    "Rotate 270 CW": 8,
}

_RAW_EXTS = {".cr3", ".arw", ".dng", ".tiff", ".tif"}


def extract_exif(image_path):
    ext = Path(image_path).suffix.lower()
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

    if ext == '.cr3':
        return _raw_exif_fallback(image_path)
    if len(tags) == 0 and ext in _RAW_EXTS:
        return _raw_exif_fallback(image_path)

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
        if date_tag in tags and result["captured_at"] is None:
            try:
                result["captured_at"] = str(datetime.strptime(str(tags[date_tag]), "%Y:%m:%d %H:%M:%S"))
            except ValueError:
                pass

    if "Image Make" in tags:
        result["camera_make"] = str(tags["Image Make"])
    if "Image Model" in tags:
        result["camera_model"] = str(tags["Image Model"])
    if "Image Orientation" in tags:
        raw = str(tags["Image Orientation"])
        result["orientation"] = _ORIENT_MAP.get(raw, raw)
    if "EXIF ExifImageWidth" in tags:
        try:
            result["image_width"] = int(str(tags["EXIF ExifImageWidth"]))
        except ValueError:
            pass
    if "EXIF ExifImageLength" in tags:
        try:
            result["image_height"] = int(str(tags["EXIF ExifImageLength"]))
        except ValueError:
            pass

    return result


def _find_cmt4_box(data):
    """Find CMT4 box in CR3 ISOBMFF structure. Returns (abs_offset, size) or None."""
    canon_uuid = bytes.fromhex('85c0b687820f11e08111f4ce462b6a48')

    def iter_boxes(start):
        off = start
        while off + 8 <= len(data):
            size = struct.unpack_from('>I', data, off)[0]
            if size == 0:
                size = len(data) - off
            if size < 8:
                return
            box_type = data[off+4:off+8].decode('ascii', errors='replace')
            yield off, size, box_type
            off += size

    for off1, sz1, typ1 in iter_boxes(0):
        if typ1 == 'moov':
            for off2, sz2, typ2 in iter_boxes(off1 + 8):
                if typ2 == 'uuid':
                    uuid_data = data[off2+8:off2+sz2]
                    if len(uuid_data) >= 16 and uuid_data[:16] == canon_uuid:
                        for off3, sz3, typ3 in iter_boxes(off2 + 8 + 16):
                            if typ3 == 'CMT4':
                                return off3, sz3
    return None


def _parse_gps_ifd_cmt4(data, abs_ifd, byte_order, base_off):
    """Parse GPS IFD entries from CMT4 box data. Returns (lat, lng) or (None, None)."""
    if abs_ifd + 2 > len(data):
        return None, None
    num = struct.unpack(byte_order + 'H', data[abs_ifd:abs_ifd+2])[0]
    if num > 50:
        return None, None

    pos = abs_ifd + 2
    lat_ref, lng_ref = None, None
    lat_vals, lng_vals = None, None

    for _ in range(num):
        if pos + 12 > len(data):
            break
        tag = struct.unpack(byte_order + 'H', data[pos:pos+2])[0]
        ttype = struct.unpack(byte_order + 'H', data[pos+2:pos+4])[0]
        count = struct.unpack(byte_order + 'I', data[pos+4:pos+8])[0]
        val_bytes = data[pos+8:pos+12]
        pos += 12

        if tag == 0x0001:
            str_off = struct.unpack(byte_order + 'I', val_bytes)[0]
            ref_pos = base_off + str_off
            lat_ref = data[ref_pos:ref_pos+1].decode('ascii', errors='replace')
        elif tag == 0x0002:
            rat_off = struct.unpack(byte_order + 'I', val_bytes)[0]
            lat_vals = _read_rational(data, base_off + rat_off, byte_order, 3)
        elif tag == 0x0003:
            str_off = struct.unpack(byte_order + 'I', val_bytes)[0]
            ref_pos = base_off + str_off
            lng_ref = data[ref_pos:ref_pos+1].decode('ascii', errors='replace')
        elif tag == 0x0004:
            rat_off = struct.unpack(byte_order + 'I', val_bytes)[0]
            lng_vals = _read_rational(data, base_off + rat_off, byte_order, 3)

    lat, lng = None, None
    if lat_vals and lat_ref:
        dec = lat_vals[0] + lat_vals[1] / 60 + lat_vals[2] / 3600
        if lat_ref != "N":
            dec = -dec
        lat = round(dec, 6)
    if lng_vals and lng_ref:
        dec = lng_vals[0] + lng_vals[1] / 60 + lng_vals[2] / 3600
        if lng_ref != "E":
            dec = -dec
        lng = round(dec, 6)
    return lat, lng


def _parse_cr3_gps(image_path):
    """Extract GPS from CR3 file via ISOBMFF + CMT4 TIFF IFD parser."""
    with open(image_path, "rb") as f:
        data = f.read()

    cmt4 = _find_cmt4_box(data)
    if not cmt4:
        return None, None

    cmt4_off, cmt4_sz = cmt4
    tiff_base = cmt4_off + 8

    if tiff_base + 4 > len(data):
        return None, None

    if data[tiff_base:tiff_base+2] == b'II':
        byte_order = '<'
    elif data[tiff_base:tiff_base+2] == b'MM':
        byte_order = '>'
    else:
        return _parse_gps_ifd_cmt4(data, tiff_base, '<', tiff_base)

    magic = struct.unpack(byte_order + 'H', data[tiff_base+2:tiff_base+4])[0]
    if magic != 42:
        return None, None

    ifd_off = struct.unpack(byte_order + 'I', data[tiff_base+4:tiff_base+8])[0]
    return _parse_gps_ifd_cmt4(data, tiff_base + ifd_off, byte_order, tiff_base)


def _raw_exif_fallback(image_path):
    ext = Path(image_path).suffix.lower()
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
    with open(image_path, "rb") as f:
        data = f.read()

    if ext == '.cr3':
        lat, lng = _parse_cr3_gps(image_path)
        result["gps_lat"] = lat
        result["gps_lng"] = lng

    off = 0
    while off < len(data) - 8:
        pos = data.find(b'II\x2a\x00', off)
        if pos == -1:
            pos = data.find(b'MM\x00\x2a', off)
        if pos == -1:
            break
        off = pos
        byte_order = '<' if data[off:off+2] == b'II' else '>'

        def read_str(base, abs_off):
            end = abs_off
            while end < len(data) and data[end:end+1] != b'\x00':
                end += 1
            return data[abs_off:end].decode('ascii', errors='replace')

        ifd_off = struct.unpack(byte_order + 'I', data[off+4:off+8])[0]
        abs_ifd = off + ifd_off
        if abs_ifd + 2 > len(data):
            continue
        num = struct.unpack(byte_order + 'H', data[abs_ifd:abs_ifd+2])[0]
        if num > 200:
            continue

        abs_pos = abs_ifd + 2
        for _ in range(num):
            if abs_pos + 12 > len(data):
                break
            tag = struct.unpack(byte_order + 'H', data[abs_pos:abs_pos+2])[0]
            ttype = struct.unpack(byte_order + 'H', data[abs_pos+2:abs_pos+4])[0]
            count = struct.unpack(byte_order + 'I', data[abs_pos+4:abs_pos+8])[0]
            val = data[abs_pos+8:abs_pos+12]
            abs_pos += 12

            if tag == 0x010f and not result["camera_make"]:
                str_off = struct.unpack(byte_order + 'I', val)[0]
                result["camera_make"] = read_str(off, off + str_off)
            elif tag == 0x0110 and not result["camera_model"]:
                str_off = struct.unpack(byte_order + 'I', val)[0]
                result["camera_model"] = read_str(off, off + str_off)
            elif tag == 0x0132 and not result["captured_at"]:
                str_off = struct.unpack(byte_order + 'I', val)[0]
                dt_str = read_str(off, off + str_off)
                try:
                    result["captured_at"] = str(datetime.strptime(dt_str, "%Y:%m:%d %H:%M:%S"))
                except ValueError:
                    pass
            elif tag == 0x0100:
                if ttype == 3:
                    result["image_width"] = struct.unpack(byte_order + 'H', val[:2])[0]
                elif ttype == 4:
                    result["image_width"] = struct.unpack(byte_order + 'I', val)[0]
            elif tag == 0x0101:
                if ttype == 3:
                    result["image_height"] = struct.unpack(byte_order + 'H', val[:2])[0]
                elif ttype == 4:
                    result["image_height"] = struct.unpack(byte_order + 'I', val)[0]
            elif tag == 0x0112:
                result["orientation"] = struct.unpack(byte_order + 'H', val[:2])[0]
            elif tag == 0x8825 and result["gps_lat"] is None:
                gps_ifd_off = struct.unpack(byte_order + 'I', val)[0]
                _parse_gps_ifd(data, off + gps_ifd_off, byte_order, result)

        if result["camera_make"] and result["camera_model"]:
            break
        off += 4

    return result


def _parse_gps_ifd(data, abs_ifd, byte_order, result):
    if abs_ifd + 2 > len(data):
        return
    num = struct.unpack(byte_order + 'H', data[abs_ifd:abs_ifd+2])[0]
    if num > 50:
        return
    pos = abs_ifd + 2
    lat_ref, lng_ref = None, None
    lat_rat, lng_rat = None, None
    for _ in range(num):
        if pos + 12 > len(data):
            break
        tag = struct.unpack(byte_order + 'H', data[pos:pos+2])[0]
        ttype = struct.unpack(byte_order + 'H', data[pos+2:pos+4])[0]
        count = struct.unpack(byte_order + 'I', data[pos+4:pos+8])[0]
        val = data[pos+8:pos+12]
        pos += 12

        if tag == 0x0001:
            str_off = struct.unpack(byte_order + 'I', val)[0]
            lat_ref = data[str_off:str_off+1].decode('ascii', errors='replace')
        elif tag == 0x0002:
            rat_off = struct.unpack(byte_order + 'I', val)[0]
            lat_rat = _read_rational(data, rat_off, byte_order, 3)
        elif tag == 0x0003:
            str_off = struct.unpack(byte_order + 'I', val)[0]
            lng_ref = data[str_off:str_off+1].decode('ascii', errors='replace')
        elif tag == 0x0004:
            rat_off = struct.unpack(byte_order + 'I', val)[0]
            lng_rat = _read_rational(data, rat_off, byte_order, 3)

    if lat_rat and lat_ref:
        dec = lat_rat[0] + lat_rat[1]/60 + lat_rat[2]/3600
        if lat_ref != "N":
            dec = -dec
        result["gps_lat"] = round(dec, 6)
    if lng_rat and lng_ref:
        dec = lng_rat[0] + lng_rat[1]/60 + lng_rat[2]/3600
        if lng_ref != "E":
            dec = -dec
        result["gps_lng"] = round(dec, 6)


def _read_rational(data, off, byte_order, count):
    vals = []
    for _ in range(count):
        if off + 8 > len(data):
            break
        num = struct.unpack(byte_order + 'I', data[off:off+4])[0]
        den = struct.unpack(byte_order + 'I', data[off+4:off+8])[0]
        vals.append(num / den if den != 0 else 0)
        off += 8
    return vals


def _dms_to_decimal(dms_tag):
    dms = dms_tag.values
    if len(dms) == 3:
        return float(dms[0]) + float(dms[1]) / 60 + float(dms[2]) / 3600
    return 0.0
