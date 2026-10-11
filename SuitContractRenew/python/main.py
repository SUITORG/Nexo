"""ContractRenew — contratos de mantenimiento (HVAC/gremios).

80/20: registrar contratos + alertar renovaciones (60 días) = el 20%
que protege el 80% del ingreso recurrente de la tienda.
"""
import json
import sys
from datetime import date

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from db import add_contract, deactivate, due_contracts, init_db, list_all


def print_due(dias: int) -> None:
    hoy = date.today().isoformat()
    rows = due_contracts(dias, hoy)
    print(f"Contratos por renovar en {dias} días (incl. vencidos): {len(rows)}")
    for r in rows:
        marca = "VENCIDO" if r[3] < hoy else f"faltan {(date.fromisoformat(r[3]) - date.fromisoformat(hoy)).days}d"
        print(f"  #{r[0]} {r[1]} ({r[2]}) renov={r[3]} [{marca}] ${r[4]:.0f}/mes")


def main() -> int:
    init_db()
    if len(sys.argv) < 2:
        print("Uso:\n  python main.py add <cliente> <renovacion YYYY-MM-DD> [precio_mensual] [tipo]\n"
              "  python main.py due [dias=60]\n  python main.py list\n  python main.py close <id>\n"
              "  python main.py due-json [dias=60]")
        return 1
    cmd = sys.argv[1]
    if cmd == "add":
        if len(sys.argv) < 4:
            print("Faltan cliente y renovacion")
            return 1
        cid = add_contract(
            sys.argv[2], sys.argv[3],
            float(sys.argv[4]) if len(sys.argv) > 4 else 0.0,
            sys.argv[5] if len(sys.argv) > 5 else "mantenimiento",
        )
        print(f"OK contrato #{cid} — {sys.argv[2]} renueva {sys.argv[3]}")
    elif cmd == "due":
        print_due(int(sys.argv[2]) if len(sys.argv) > 2 else 60)
    elif cmd == "due-json":
        dias = int(sys.argv[2]) if len(sys.argv) > 2 else 60
        hoy = date.today().isoformat()
        rows = due_contracts(dias, hoy)
        print(json.dumps({
            "hoy": hoy, "dias": dias, "total": len(rows),
            "contratos": [
                {"id": r[0], "cliente": r[1], "tipo": r[2], "renovacion": r[3],
                 "precio_mensual": r[4], "ultima_visita": r[5],
                 "vencido": r[3] < hoy}
                for r in rows
            ],
        }, ensure_ascii=False))
    elif cmd == "list":
        for r in list_all():
            estado = "activo" if r[5] else "cerrado"
            print(f"  #{r[0]} {r[1]} ({r[2]}) renov={r[3]} ${r[4]:.0f}/mes [{estado}]")
    elif cmd == "close":
        if len(sys.argv) < 3 or not deactivate(int(sys.argv[2])):
            print("No se pudo cerrar")
            return 1
        print(f"OK contrato #{sys.argv[2]} cerrado")
    else:
        print(f"Comando desconocido: {cmd}")
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
