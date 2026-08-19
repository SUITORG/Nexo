import sqlite3
import json
from datetime import datetime
from config import SQLITE_PATH


class LocalStore:
    def __init__(self, db_path=None):
        self.path = db_path or SQLITE_PATH
        self._init_db()

    def _init_db(self):
        with sqlite3.connect(self.path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS detections (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id TEXT NOT NULL DEFAULT 'default',
                    image_path TEXT,
                    captured_at TEXT,
                    processed_at TEXT DEFAULT (datetime('now')),
                    gps_lat REAL,
                    gps_lng REAL,
                    address TEXT,
                    detected_objects TEXT,
                    is_panoramic INTEGER DEFAULT 0,
                    panoramic_type TEXT,
                    panoramic_text TEXT,
                    classification TEXT,
                    confidence REAL,
                    source TEXT,
                    synced INTEGER DEFAULT 0,
                    created_at TEXT DEFAULT (datetime('now'))
                )
            """)
            conn.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    user_id TEXT PRIMARY KEY,
                    name TEXT,
                    created_at TEXT DEFAULT (datetime('now'))
                )
            """)
            conn.commit()

    def save_detection(self, data):
        with sqlite3.connect(self.path) as conn:
            conn.execute("""
                INSERT INTO detections (
                    user_id, image_path, captured_at, gps_lat, gps_lng,
                    address, detected_objects, is_panoramic, panoramic_type,
                    panoramic_text, classification, confidence, source
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                data.get("user_id", "default"),
                str(data.get("image_path", "")),
                data.get("captured_at"),
                data.get("gps_lat"),
                data.get("gps_lng"),
                data.get("address"),
                json.dumps(data.get("detected_objects", [])),
                1 if data.get("is_panoramic") else 0,
                data.get("panoramic_type"),
                data.get("panoramic_text"),
                data.get("classification"),
                data.get("confidence"),
                data.get("source", "photo"),
            ))
            return conn.execute("SELECT last_insert_rowid()").fetchone()[0]

    def get_detections(self, user_id=None, limit=100, offset=0):
        with sqlite3.connect(self.path) as conn:
            conn.row_factory = sqlite3.Row
            if user_id:
                rows = conn.execute(
                    "SELECT * FROM detections WHERE user_id=? ORDER BY id DESC LIMIT ? OFFSET ?",
                    (user_id, limit, offset),
                ).fetchall()
            else:
                rows = conn.execute(
                    "SELECT * FROM detections ORDER BY id DESC LIMIT ? OFFSET ?",
                    (limit, offset),
                ).fetchall()
            return [dict(r) for r in rows]

    def get_unsynced(self, limit=50):
        with sqlite3.connect(self.path) as conn:
            conn.row_factory = sqlite3.Row
            rows = conn.execute(
                "SELECT * FROM detections WHERE synced=0 ORDER BY id ASC LIMIT ?",
                (limit,),
            ).fetchall()
            return [dict(r) for r in rows]

    def mark_synced(self, ids):
        with sqlite3.connect(self.path) as conn:
            placeholders = ",".join("?" for _ in ids)
            conn.execute(f"UPDATE detections SET synced=1 WHERE id IN ({placeholders})", ids)
            conn.commit()

    def get_detection_count(self, user_id=None):
        with sqlite3.connect(self.path) as conn:
            if user_id:
                return conn.execute("SELECT COUNT(*) FROM detections WHERE user_id=?", (user_id,)).fetchone()[0]
            return conn.execute("SELECT COUNT(*) FROM detections").fetchone()[0]
