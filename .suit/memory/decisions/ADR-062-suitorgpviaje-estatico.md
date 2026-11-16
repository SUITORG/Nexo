# ADR-062: SuitOrgPViaje — planeador de viajes informativo estático

## Status
Accepted (2026-11-12)

## Context
El usuario quiere un módulo «Proximo Viaje» en SuitOS Master: dado origen/destinos (multi-destino, sin obligación de regresar al origen), mostrar itinerario con opciones (tours, por mi cuenta, alimentos, hospedaje, transporte) y precios aproximados (vuelos incluidos), con capacidad de comparar varios viajes. Requisitos explícitos: meramente informativo, nada de complejo, compacto y entendible.

## Decision
Módulo estático `SuitOrgPViaje/` (index.html + app.js vanilla, sin servidor ni frameworks), integrado como botón/iframe en `MASTER.html` (patrón igual a SuitMisCtas/SuitBoard).

- Vuelos: estimado por distancia haversine entre catálogo de 22 aeropuertos (fórmula, no matriz de rutas); ciudades fuera del catálogo caen a rango genérico.
- Opciones por destino: catálogo estático de 14 destinos (rangos USD, MXN a tipo de cambio fijo 18.5) + fallback genérico. Sin APIs de booking ni precios en tiempo real.
- Comparación: viajes guardados en localStorage (`pv_viajes_v1`), tabla lado a lado con rangos de vuelos/estancia/total.

## Rationale
- Cero dependencias, cero costos de API, cero mantenimiento de credenciales — acorde a "meramente informativo".
- Vanilla JS es regla inmutable (#7) y el patrón de módulos estáticos ya probado en MASTER.
- La fórmula por distancia evita mantener una matriz de precios por par de ciudades.

## Consequences
- Los precios son aproximados y se desactualizan con la inflación/tipos de cambio; hay que refrescar el catálogo manualmente si se quiere mayor fidelidad.
- No hay backend: los viajes guardados viven solo en el navegador del usuario.

## Related
- AGENTS.md: Standard for new modules, immutable rule #7
- `.suit/registry/projects.yaml`: suit-p-viaje
- ADR-029 (patrón de micro-frontends estáticos en MASTER)
