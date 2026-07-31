import time
import requests

NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse"
_last_req = 0.0


def reverse_geocode(lat, lng):
    if lat is None or lng is None:
        return {"address": None, "address_error": "no_gps"}
    global _last_req
    elapsed = time.time() - _last_req
    if elapsed < 1.0:
        time.sleep(1.0 - elapsed)
    _last_req = time.time()
    try:
        resp = requests.get(
            NOMINATIM_URL,
            params={"lat": lat, "lon": lng, "format": "json", "addressdetails": 1},
            headers={"User-Agent": "SuitCVLO/1.0"},
            timeout=10,
        )
        if resp.status_code == 429:
            return {"address": None, "address_error": "rate_limited"}
        resp.raise_for_status()
        data = resp.json()
        if "display_name" in data:
            return {
                "address": data["display_name"],
                "road": data.get("address", {}).get("road", ""),
                "city": data.get("address", {}).get("city", data.get("address", {}).get("town", "")),
                "state": data.get("address", {}).get("state", ""),
                "country": data.get("address", {}).get("country", ""),
                "postcode": data.get("address", {}).get("postcode", ""),
                "address_error": None,
            }
        return {"address": None, "address_error": "no_display_name"}
    except requests.exceptions.Timeout:
        return {"address": None, "address_error": "timeout"}
    except requests.exceptions.ConnectionError:
        return {"address": None, "address_error": "connection_error"}
    except Exception as e:
        print(f"[geocode] error: {e}")
        return {"address": None, "address_error": str(e)}
