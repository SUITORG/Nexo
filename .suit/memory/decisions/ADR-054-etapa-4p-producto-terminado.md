# ADR-054: Etapa 4P — Producto terminado automatizado (Fases 5-7 en el pipeline)

## Status
Accepted (2026-10-12)

## Context
Tras construir ContractRenew hasta Fase 7 manualmente (dashboard CRUD, login PIN con signup y recuperación por email, alertas + respaldo, favicon, bats separados landing/panel), el usuario pidió que **todo eso sea estándar automático** de cada idea aprobada — sin pedir bats, sin pedir login, sin pedir CRUD cada vez. "Que todo esté en una sola app y no parezca parche."

## Decision
Añadir **Etapa 4P** a `ideas-saas` (solo modo VERIFICADAS): tras el go-to-market 4G, el pipeline construye automáticamente hasta **Fase 7 (SaaS terminado)**:

1. **CRUD `/app`** — dashboard vanilla dark con reporte + alta + lista/acciones; fecha como texto AAAA-MM-DD; favicon inline SVG (emoji del nicho).
2. **Login integrado** — signup 1-vez (PIN 6 dígitos en `taller.json`), login cookie 30d, **recuperación por email** (`/api/pin-recuperar`), ojo 👁 ver/ocultar PIN — cero bats de recuperación.
3. **Automatización diaria** — `alertar` (SMTP o consola) + respaldo BD 7 días cada `HORAS_ALERTA`.
4. **2 bats únicos** (plantilla bat-launcher): `abrir.bat` (landing, SuitOrg) + `cliente.bat` (panel, cliente con auto-arranque).
5. **Tarjeta** `fase_producto: 7` + smoke del flujo completo (signup/recover/login/CRUD).

Plantilla de referencia: `SuitContractRenew/` (patrón probado). Productos sin clientes (config interna): 4P se omite salvo automatización.

## Rationale
- RUCP: reusar el patrón probado en ContractRenew en vez de rediseñar por proyecto.
- "Producto terminado" deja de ser un objetivo manual (Fases 5-7 pedidas por /panel una a una) y pasa a ser el **default del pipeline** — FASES-PRODUCTO.md queda como escala de lectura, no de trabajo pendiente.
- Login/recuperación integrados en `/app` (decisión del usuario: "que el cliente resuelva sus problemas, sin parches").

## Consequences
- Toda corrida VERIFICADAS entrega un SaaS completo: landing + CRUD + login + alertas + respaldo + docs + panel monitoreado.
- Corridas verificadas tardan más (suma F5-F7 ≈ 30-60 min extra por corrida).
- Si un producto no vende a clientes, 4P se salta (solo automatización).

## Related
- ADR-051 (modo verificadas + 4G), ADR-053 (1ª corrida verificadas), `GuiaTotal/FASES-PRODUCTO.md`
- `SuitContractRenew/` = plantilla de referencia de 4P
