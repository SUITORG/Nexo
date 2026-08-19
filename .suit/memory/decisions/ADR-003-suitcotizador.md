# ADR-003: SuitCotizador - Portal de Cotización en Línea

## Status
Draft (2026-07-05)

## Context
Se requiere un módulo de cotizaciones configurables por proceso, producto o servicio.
Clientes y prospectos deben poder generar cotizaciones autónomas que puedan convertirse
en Leads, Proyectos u Órdenes.

## Decision
Crear SuitCotizador como un módulo del SPA existente (hash route `#cotizador`) con:

1. **Backend**: Rutas Express en `server.js` bajo `/api/cotizador/*`
2. **Frontend**: Módulo `js/modules/cotizador.js` con namespace `app.cotizador`
3. **Base de datos**: Supabase con 5 nuevas tablas (Cotizaciones, Cotizacion_Detalle, Procesos_Cotizacion, Variables_Cotizacion, Reglas_Precios)
4. **Habilitación**: Controlado por campo `giro_especifico` en `Config_Empresas` (formato: `giro,1`)
5. **Estándares México**: IVA 16%, folios COT-XXX secuenciales, moneda MXN

## Rationale
- Hash route existente = sin cambios en infraestructura
- Supabase = consistente con migración en curso, RLS por id_empresa
- Giro_especifico = mecanismo existente en Config_Empresas, sin nuevos campos
- Cálculos server-side = seguridad, el cliente no puede manipular precios

## Consequences
- Nuevas tablas Supabase requieren migración SQL
- Los procesos y reglas de precio deben crearse desde admin (seed data para giros comunes)
- Cada tenant requiere giro_especifico con ',1' para acceder
- Validación en cada endpoint API y en frontend

## Alternatives Considered
- **Sub-servidor independiente** (como CampanasAi): Descartado por complejidad innecesaria, el cotizador no necesita su propio puerto
- **Google Sheets como DB**: Descartado, el motor de cálculo requiere funciones SQL
- **Cálculos client-side**: Descartado por riesgo de manipulación de precios

## Related
- `.suit/registry/projects.yaml` → suit-cotizador
- `.suit/skills/domain/cotizaciones-engine.yaml`
- `.suit/workflows/cotizador.yaml`
- `Documentacion/migrations/001_suit_cotizador.sql`
