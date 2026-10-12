"""PawBook — reservas con depósito para groomers caninos.

80/20: reservas + depósito + perfil mascota + política cancelación = el 80%
del dolor (no-show epidemic, r/doggrooming 2024-2026).
"""
import json
import sys
from datetime import date, datetime

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from db import (add_booking, add_pet, cancel_booking, init_db, list_bookings,
                list_pets, today_view, update_cancel_policy)


def main() -> int:
    init_db()
    if len(sys.argv) < 2:
        print("Uso:\n  python main.py pet-add <nombre> <raza> <dueno_tel> [vacunas_notas]\n"
              "  python main.py pets\n"
              "  python main.py book-add <mascota_id> <fecha YYYY-MM-DD> <hora HH:MM> <servicio> <precio> [deposito_pct]\n"
              "  python main.py bookings [fecha?]\n"
              "  python main.py today\n"
              "  python main.py cancel <reserva_id>\n"
              "  python main.py policy <horas_antes> <pct_multa>\n"
              "  python main.py today-json")
        return 1
    cmd = sys.argv[1]
    if cmd == "pet-add":
        if len(sys.argv) < 5:
            print("Faltan nombre, raza y telefono del dueno")
            return 1
        pid = add_pet(sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5] if len(sys.argv) > 5 else "")
        print(f"OK mascota #{pid} — {sys.argv[2]}")
    elif cmd == "pets":
        for p in list_pets():
            print(f"  #{p[0]} {p[1]} ({p[2]}) dueño {p[3]} — vacunas: {p[4] or 'sin registro'}")
    elif cmd == "book-add":
        if len(sys.argv) < 7:
            print("Faltan mascota_id, fecha, hora, servicio, precio")
            return 1
        precio = float(sys.argv[6])
        pct = float(sys.argv[7]) if len(sys.argv) > 7 else 30.0
        bid = add_booking(int(sys.argv[2]), sys.argv[3], sys.argv[4], sys.argv[5], precio, pct)
        print(f"OK reserva #{bid} — depósito {pct:.0f}% de ${precio:.0f} = ${precio * pct / 100:.0f} (cobra el groomer)")
    elif cmd == "bookings":
        for b in list_bookings(sys.argv[2] if len(sys.argv) > 2 else ""):
            est = "CANCELADA" if b[7] else "activa"
            print(f"  #{b[0]} {b[9]} {b[2]} {b[3]} {b[4]} ${b[5]:.0f} dep{b[6]:.0f}% [{est}]")
    elif cmd == "today":
        for b in today_view():
            print(f"  {b[2]} {b[9]} ({b[10]}) — {b[4]} ${b[5]:.0f} dep{b[6]:.0f}%")
    elif cmd == "today-json":
        hoy = date.today().isoformat()
        rows = today_view()
        print(json.dumps({
            "hoy": hoy, "total": len(rows),
            "reservas": [
                {"id": r[0], "fecha": r[2], "hora": r[3], "servicio": r[4], "precio": r[5],
                 "deposito_pct": r[6], "mascota": r[9], "dueno": r[10]}
                for r in rows
            ],
        }, ensure_ascii=False))
    elif cmd == "cancel":
        if cancel_booking(int(sys.argv[2])):
            print(f"OK reserva #{sys.argv[2]} cancelada")
        else:
            print("No se pudo cancelar")
            return 1
    elif cmd == "policy":
        if update_cancel_policy(int(sys.argv[2]), float(sys.argv[3])):
            print(f"OK política: cancelar con <{sys.argv[2]}h = multa {sys.argv[3]}%")
        else:
            print("No se pudo actualizar")
            return 1
    else:
        print(f"Comando desconocido: {cmd}")
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
