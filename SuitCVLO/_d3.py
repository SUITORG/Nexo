import sqlite3
from config import SQLITE_PATH
conn = sqlite3.connect(str(SQLITE_PATH))
cur = conn.execute("SELECT id, image_path, captured_at, gps_lat, gps_lng, address FROM detections ORDER BY id DESC LIMIT 5")
for row in cur:
    print(row)
conn.close()
