"""SQLite WAL — reservas y mascotas PawBook."""
import sqlite3
from pathlib import Path

DB = Path(__file__).parent / "pawbook.db"


def _conn():
    c = sqlite3.connect(DB)
    c.execute("PRAGMA journal_mode=WAL")
    return c


def init_db() -> None:
    with _conn() as c:
        c.execute("""
            CREATE TABLE IF NOT EXISTS pets(
                id INTEGER PRIMARY KEY,
                nombre TEXT NOT NULL,
                raza TEXT,
                dueno_tel TEXT NOT NULL,
                vacunas_notas TEXT DEFAULT ''
            );""")
        c.execute("""
            CREATE TABLE IF NOT EXISTS bookings(
                id INTEGER PRIMARY KEY,
                pet_id INTEGER NOT NULL REFERENCES pets(id),
                fecha TEXT NOT NULL,
                hora TEXT NOT NULL,
                servicio TEXT NOT NULL,
                precio REAL DEFAULT 0,
                deposito_pct REAL DEFAULT 30,
                cancelada INTEGER DEFAULT 0,
                creado TEXT DEFAULT (datetime('now'))
            );""")
        c.execute("""
            CREATE TABLE IF NOT EXISTS policy(
                id INTEGER PRIMARY KEY CHECK (id=1),
                horas_antes INTEGER DEFAULT 24,
                pct_multa REAL DEFAULT 50
            );""")
        c.execute("INSERT OR IGNORE INTO policy(id) VALUES (1)")


def add_pet(nombre, raza, dueno_tel, vacunas_notas="") -> int:
    with _conn() as c:
        cur = c.execute(
            "INSERT INTO pets(nombre, raza, dueno_tel, vacunas_notas) VALUES (?,?,?,?)",
            (nombre, raza, dueno_tel, vacunas_notas))
        return cur.lastrowid


def list_pets() -> list:
    with _conn() as c:
        return c.execute("SELECT id, nombre, raza, dueno_tel, vacunas_notas FROM pets ORDER BY nombre").fetchall()


def add_booking(pet_id, fecha, hora, servicio, precio=0.0, deposito_pct=30.0) -> int:
    with _conn() as c:
        cur = c.execute(
            "INSERT INTO bookings(pet_id, fecha, hora, servicio, precio, deposito_pct) VALUES (?,?,?,?,?,?)",
            (pet_id, fecha, hora, servicio, precio, deposito_pct))
        return cur.lastrowid


def list_bookings(fecha: str = "") -> list:
    with _conn() as c:
        q = """SELECT b.id, b.pet_id, b.fecha, b.hora, b.servicio, b.precio, b.deposito_pct,
                      b.cancelada, b.creado, p.nombre, p.dueno_tel
               FROM bookings b JOIN pets p ON p.id = b.pet_id"""
        args = ()
        if fecha:
            q += " WHERE b.fecha = ?"
            args = (fecha,)
        q += " ORDER BY b.fecha, b.hora"
        return c.execute(q, args).fetchall()


def today_view() -> list:
    from datetime import date
    return list_bookings(date.today().isoformat())


def cancel_booking(bid: int) -> bool:
    with _conn() as c:
        cur = c.execute("UPDATE bookings SET cancelada=1 WHERE id=?", (bid,))
        return cur.rowcount > 0


def update_cancel_policy(horas_antes: int, pct_multa: float) -> bool:
    with _conn() as c:
        cur = c.execute("UPDATE policy SET horas_antes=?, pct_multa=? WHERE id=1", (horas_antes, pct_multa))
        return cur.rowcount > 0
