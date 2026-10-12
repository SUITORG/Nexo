# DEMO EMPRESA — Taller El Roble

> **Tipo:** demo de venta para presentar ContractRenew a prospectos reales.
> **No es tenant real** — no existe en `Config_Empresas`. Datos ficticios pero realistas.
> **Generado:** 2026-10-12 · Orden panel custom

## Datos del taller demo

| Campo | Valor |
|---|---|
| Nombre | Taller El Roble |
| Ubicación | Monterrey, Nuevo León |
| Dueño | Ing. Carlos Robles |
| Equipo | 3 técnicos + 1 recepcionista |
| Especialidad | Calefacción, aire acondicionado, mantenimiento preventivo |
| Ticket promedio | $750 MXN |
| Contratos activos | 12 |
| Ingreso mensual recurrente | ~$9,000 MXN |

## Contratos demo (cargados en SQLite)

| # | Cliente | Renueva | $/mes |
|---|---|---|---|
| 1 | Restaurante El Sazón | 2026-11-01 | $800 |
| 2 | Clínica Santa María | 2026-10-15 | $1,200 |
| 3 | Oficinas del Valle | 2026-10-28 | $950 |
| 4 | Cafetería Aroma | 2026-11-10 | $600 |
| 5 | Boutique Luna | 2026-10-20 | $700 |
| 6 | Veterinaria Patitas | 2026-11-05 | $850 |
| 7 | Gimnasio FitMax | 2026-10-18 | $1,100 |
| 8 | Panadería La Espiga | 2026-11-15 | $650 |
| 9 | Despacho Jurídico MX | 2026-10-30 | $900 |
| 10 | Estudio Foto Arte | 2026-11-08 | $550 |
| 11 | Barbería El Corte | 2026-10-22 | $600 |
| 12 | Escuela Idiomas Plus | 2026-11-20 | $1,000 |

## Guion de demostración (5 min)

1. **Abrir** `cliente.bat` → login con PIN demo
2. **Mostrar** "Vence en 60 días" — 12 contratos con colores (vencidos en rojo, próximos en amarillo)
3. **Agregar** un contrato en vivo (nombre + fecha + precio)
4. **Cerrar** un contrato que ya renovó
5. **Facturación** — `facturacion.bat` muestra total mensual $9,000 / anual $108,000
6. **Cierre:** "Esto es lo que pierdes cada mes sin este sistema: 2-3 renovaciones pasadas = $1,500-3,000 perdidos"

## Para cargar los datos demo

```bash
cd SuitContractRenew
python python/main.py add "Restaurante El Sazón" 2026-11-01 800
python python/main.py add "Clínica Santa María" 2026-10-15 1200
python python/main.py add "Oficinas del Valle" 2026-10-28 950
python python/main.py add "Cafetería Aroma" 2026-11-10 600
python python/main.py add "Boutique Luna" 2026-10-20 700
python python/main.py add "Veterinaria Patitas" 2026-11-05 850
python python/main.py add "Gimnasio FitMax" 2026-10-18 1100
python python/main.py add "Panadería La Espiga" 2026-11-15 650
python python/main.py add "Despacho Jurídico MX" 2026-10-30 900
python python/main.py add "Estudio Foto Arte" 2026-11-08 550
python python/main.py add "Barbería El Corte" 2026-10-22 600
python python/main.py add "Escuela Idiomas Plus" 2026-11-20 1000
```

## Para resetear la demo

```bash
cd SuitContractRenew/python
rm contractrenew.db contractrenew.db-wal contractrenew.db-shm
# Recargar: ver arriba
```

## Landing demo (opcional)

La landing existente de ContractRenew funciona tal cual — no necesita variante. Si se quiere personalizar para la demo, cambiar el slogan en `landing/index.html` por el del taller.
