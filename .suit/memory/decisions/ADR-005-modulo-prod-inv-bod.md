# ADR-005: Modo Flags 7-Partes + SuitProductos/SuitInventarios/SuitBodega

## Status
Accepted (2026-07-09)

## Context
Tras implementar Pedido Express y POS con flags en modo (ADR-004), se requiere expandir el ecosistema de módulos verticales para cubrir la cadena de suministro: catálogo de productos, control de inventarios y gestión de bodegas/almacenes. Cada módulo necesita su propio flag de activación en `Config_Empresas.modo` para que los inquilinos habiliten solo lo que contratan.

## Decision
Expandir `modo` a formato `VISIBILIDAD,STRIPE,EXPRESS,POS,PRODUCTOS,INVENTARIOS,BODEGA` (7 partes):

| Parte | Posición | Default | Control |
|---|---|---|---|
| VISIBILIDAD | 0 | PROD | Orbit Hub: PROD=visible, HIDDEN=oculto |
| STRIPE | 1 | 0 | Tarjeta (Stripe): 1=activado |
| EXPRESS | 2 | 1 | Pedido Express: 1=visible |
| POS | 3 | 1 | POS Staff: 1=visible en menú staff |
| PRODUCTOS | 4 | 1 | Catálogo + Precios: 1=habilitado |
| INVENTARIOS | 5 | 1 | Stock + Movimientos: 1=habilitado |
| BODEGA | 6 | 1 | Ubicaciones + Transfers: 1=habilitado |

1. **Parser extendido**: `app.utils.parseModo()` soporta 7 partes con defaults retrocompatibles.
2. **Scaffolds independientes**: SuitProductos (3007), SuitInventarios (3008), SuitBodega (3009) — cada uno con su propia base de datos Supabase.
3. **IDs secuenciales**: PROD-XX, MOV-XXXX, BOD-XX, TRN-XXXX — consistente con el estándar del proyecto.
4. **Supabase exclusivo**: Estas tablas no existen en Google Sheets. Solo Supabase.
5. **Soft delete**: Todos los módulos usan `activo='FALSE'` en lugar de DELETE físico.
6. **Montaje en server.js**: Los 3 módulos se montan vía `require` + `app.use()` tras los existentes.

## Rationale
- Separar cada módulo en su propio proceso Express permite escalado independiente y aislamiento de fallos.
- El parser centralizado evita lógica duplicada en cada frontend/backend.
- Defaults a 1 aseguran que empresas con `PROD,1` o `PROD,1,1,1` no pierdan funcionalidad.
- Tablas nuevas solo en Supabase porque el esquema de Sheets ya está congelado (solo 5 tablas maestras).

## Consequences
- Se requieren migraciones en Supabase para crear las tablas: `Inventario`, `Movimientos_Inventario`, `Bodegas`, `Transferencias`.
- Los frontends de staff (rutas `#productos`, `#inventarios`, `#bodega`) están planificadas pero no implementadas — los gates en router.js redirigirán a `#home` si el flag está apagado, pero no hay UI aún.
- Cualquier nuevo flag futuro requiere: (a) agregar al parser, (b) definir default, (c) agregar gates, (d) crear scaffold.

## Files Affected
- `js/modules/core.js` — parser extendido a 7 partes
- `server.js` — montados SuitProductos, SuitInventarios, SuitBodega
- `SuitProductos/index.js` — scaffold funcional (CRUD catálogo)
- `SuitProductos/db/client.js` — cliente Supabase
- `SuitInventarios/index.js` — scaffold funcional (stock + movimientos)
- `SuitInventarios/db/client.js` — cliente Supabase
- `SuitBodega/index.js` — scaffold funcional (bodegas + transferencias)
- `SuitBodega/db/client.js` — cliente Supabase
- `.suit/registry/projects.yaml` — 3 proyectos registrados
- `.suit/INDEX.md` — tabla de proyectos y ADR actualizados
- `AGENTS.md` — tabla de puertos actualizada

## Schema de tablas Supabase

### Catalogo (ya existe — usada por SuitProductos)
- id (TEXT PK, formato PROD-XX)
- id_empresa (TEXT FK)
- nombre (TEXT)
- precio (NUMERIC)
- categoria (TEXT)
- descripcion (TEXT)
- imagen (TEXT)
- activo (TEXT, default 'TRUE')
- created_at (TIMESTAMPTZ)

### Inventario (nueva — usada por SuitInventarios)
- id (TEXT PK, formato INV-XX)
- id_empresa (TEXT FK)
- producto_id (TEXT FK → Catalogo.id)
- bodega_id (TEXT FK → Bodegas.id)
- cantidad (NUMERIC, default 0)
- stock_minimo (NUMERIC, default 0)
- activo (TEXT, default 'TRUE')
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)

### Movimientos_Inventario (nueva — usada por SuitInventarios)
- id (TEXT PK, formato MOV-XXXX)
- id_empresa (TEXT FK)
- producto_id (TEXT FK)
- bodega_id (TEXT FK)
- tipo (TEXT: ENTRADA/SALIDA/AJUSTE/TRANSFERENCIA)
- cantidad (NUMERIC)
- referencia (TEXT, ej: orden de compra)
- observaciones (TEXT)
- created_at (TIMESTAMPTZ)

### Bodegas (nueva — usada por SuitBodega)
- id (TEXT PK, formato BOD-XX)
- id_empresa (TEXT FK)
- nombre (TEXT)
- direccion (TEXT)
- encargado (TEXT)
- activo (TEXT, default 'TRUE')
- created_at (TIMESTAMPTZ)

### Transferencias (nueva — usada por SuitBodega)
- id (TEXT PK, formato TRN-XXXX)
- id_empresa (TEXT FK)
- producto_id (TEXT FK)
- bodega_origen_id (TEXT FK → Bodegas.id)
- bodega_destino_id (TEXT FK → Bodegas.id)
- cantidad (NUMERIC)
- estatus (TEXT: PENDIENTE/COMPLETADA/CANCELADA)
- observaciones (TEXT)
- created_at (TIMESTAMPTZ)
- completed_at (TIMESTAMPTZ)
