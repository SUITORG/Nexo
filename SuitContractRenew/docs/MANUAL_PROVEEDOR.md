# MANUAL PROVEEDOR — ContractRenew

> **Para qué sirve:** entregar ContractRenew como servicio a talleres.
> **Audiencia:** proveedor / equipo comercial SuitOrg.
> **Última actualización:** 2026-10-12

## Alcance
- Capturar contratos activos del taller (escaneo de carpeta/Excel, 30-60 min según volumen).
- Configurar quién recibe el reporte y frecuencia (semanal).
- Capacitar 15 min (MANUAL_CLIENTE.md).

## Qué necesita el cliente para cargar sus contratos (checklist de alta)

Por **cada contrato activo** solo 3 datos — nada más:

| Dato | Ejemplo | Obligatorio |
|---|---|---|
| Nombre del cliente (persona o negocio) | "Restaurante El Sazón" | ✅ |
| Fecha de renovación | 2026-12-01 | ✅ |
| Precio mensual del contrato | $800 | recomendado |

**Pre-requisitos de sesión (una sola vez):**
1. Una computadora o celular con navegador (el taller no instala nada).
2. El **PIN de acceso** (el signup del panel genera uno de 6 dígitos — guárdalo).
3. La lista de contratos a mano (Excel, carpeta o notas — da igual, se captura en vivo).

**Si el taller no tiene fechas exactas:** capturar el mes aproximado y marcarlo para ajustar al primer vencimiento real. Mejor fecha aproximada cargada que contrato olvidado.

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
