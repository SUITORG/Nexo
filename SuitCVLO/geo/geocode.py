import requests

NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse"


def reverse_geocode(lat, lng):
    if lat is None or lng is None:
        return None
    try:
        resp = requests.get(
            NOMINATIM_URL,
            params={"lat": lat, "lon": lng, "format": "json", "addressdetails": 1},
            headers={"User-Agent": "SuitCVLO/1.0"},
            timeout=10,
        )
        data = resp.json()
        if "display_name" in data:
            return {
                "address": data["display_name"],
                "road": data.get("address", {}).get("road", ""),
                "city": data.get("address", {}).get("city", data.get("address", {}).get("town", "")),
                "state": data.get("address", {}).get("state", ""),
                "country": data.get("address", {}).get("country", ""),
                "postcode": data.get("address", {}).get("postcode", ""),
            }
    except Exception as e:
        print(f"[geocode] error: {e}")
    return None
