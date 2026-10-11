"""SQLite WAL — contratos de mantenimiento."""
import sqlite3
from pathlib import Path

DB = Path(__file__).parent / "contractrenew.db"


def _conn() -> sqlite3.Connection:
    c = sqlite3.connect(DB)
    c.execute("PRAGMA journal_mode=WAL")
    return c


def init_db() -> None:
    with _conn() as c:
        c.execute(
            """
            CREATE TABLE IF NOT EXISTS contracts(
                id INTEGER PRIMARY KEY,
                cliente TEXT NOT NULL,
                tipo TEXT DEFAULT 'mantenimiento',
                inicio TEXT,
                renovacion TEXT NOT NULL,
                precio_mensual REAL DEFAULT 0,
                ultima_visita TEXT,
                activo INTEGER DEFAULT 1
            );
            """
        )


def add_contract(cliente, renovacion, precio_mensual=0.0, tipo="mantenimiento", inicio="", ultima_visita="") -> int:
    with _conn() as c:
        cur = c.execute(
            "INSERT INTO contracts(cliente, tipo, inicio, renovacion, precio_mensual, ultima_visita) VALUES (?,?,?,?,?,?)",
            (cliente, tipo, inicio, renovacion, precio_mensual, ultima_visita),
        )
        return cur.lastrowid


def due_contracts(dias: int = 60, hoy: str = "") -> list:
    """Contratos activos con renovación dentro de `dias` días (incluye vencidos)."""
    with _conn() as c:
        return c.execute(
            """SELECT id, cliente, tipo, renovacion, precio_mensual, ultima_visita
               FROM contracts
               WHERE activo=1 AND date(renovacion) <= date(?, '+' || ? || ' days')
               ORDER BY renovacion""",
            (hoy, dias),
        ).fetchall()


def list_all() -> list:
    with _conn() as c:
        return c.execute(
            "SELECT id, cliente, tipo, renovacion, precio_mensual, activo FROM contracts ORDER BY renovacion"
        ).fetchall()


def deactivate(cid: int) -> bool:
    with _conn() as c:
        cur = c.execute("UPDATE contracts SET activo=0 WHERE id=?", (cid,))
        return cur.rowcount > 0
