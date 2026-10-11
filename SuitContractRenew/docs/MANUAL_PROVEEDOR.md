# MANUAL PROVEEDOR — ContractRenew

> **Para qué sirve:** entregar ContractRenew como servicio a talleres.
> **Audiencia:** proveedor / equipo comercial SuitOrg.
> **Última actualización:** 2026-10-10

## Alcance
- Capturar contratos activos del taller (escaneo de carpeta/Excel, 30-60 min según volumen).
- Configurar quién recibe el reporte y frecuencia (semanal).
- Capacitar 15 min (MANUAL_CLIENTE.md).

## Fuera de alcance
- Cobros, facturación, renovaciones automáticas.
- Despacho/rutas de visita (eso es SuitServiHogar u otro FSM).
- Multi-sucursal >1 taller por cliente (futuro).

## Operación recurrente
1. Verificar que el reporte semanal llega.
2. Escalar vencidos >30 días al dueño.
3. Capturar altas/bajas de contratos al cerrar mes.

## Pricing
$29 (Taller) / $49 (Crew). Costo variable ~0: Python local + SQLite, sin APIs de pago.
