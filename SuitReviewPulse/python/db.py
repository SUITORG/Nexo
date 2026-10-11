"""SQLite WAL — tablas businesses + reviews."""
import sqlite3
from pathlib import Path

DB = Path(__file__).parent / "reviewpulse.db"


def _conn() -> sqlite3.Connection:
    c = sqlite3.connect(DB)
    c.execute("PRAGMA journal_mode=WAL")
    return c


def init_db() -> None:
    with _conn() as c:
        c.executescript(
            """
            CREATE TABLE IF NOT EXISTS businesses(
                id INTEGER PRIMARY KEY,
                empresa TEXT UNIQUE NOT NULL,
                avg_rating REAL,
                review_count INTEGER DEFAULT 0,
                created TEXT DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS reviews(
                review_id TEXT PRIMARY KEY,
                empresa TEXT NOT NULL,
                author TEXT,
                rating REAL,
                comment TEXT,
                date TEXT,
                seen INTEGER DEFAULT 0,
                imported TEXT DEFAULT CURRENT_TIMESTAMP
            );
            """
        )


def upsert_business(empresa: str) -> None:
    with _conn() as c:
        c.execute("INSERT OR IGNORE INTO businesses(empresa) VALUES (?)", (empresa,))


def insert_review(review_id, empresa, author, rating, comment, date) -> None:
    with _conn() as c:
        c.execute(
            "INSERT OR REPLACE INTO reviews(review_id, empresa, author, rating, comment, date) VALUES (?,?,?,?,?,?)",
            (review_id, empresa, author, rating, comment, date),
        )


def get_new_reviews(empresa: str) -> tuple[list, float | None]:
    with _conn() as c:
        rows = c.execute(
            "SELECT review_id, empresa, author, rating, comment, date FROM reviews WHERE empresa=? AND seen=0 ORDER BY date DESC",
            (empresa,),
        ).fetchall()
        avg = c.execute("SELECT AVG(rating) FROM reviews WHERE empresa=?", (empresa,)).fetchone()[0]
        c.execute("UPDATE reviews SET seen=1 WHERE empresa=?", (empresa,))
    return rows, avg
