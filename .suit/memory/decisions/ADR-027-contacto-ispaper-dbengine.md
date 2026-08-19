# ADR-027: Formulario de Contacto — `isPaper` por identidad (`id_empresa`), no por `db_engine`

**Date:** 2026-08-17
**Status:** Aplicado (2026-08-17)
**Risk:** Medio (bug de presentación y de captura de leads en tenant EVASOL y otros con SUPABASE)
**Workflow:** bugfix

---

## Context

Al pulsar "Contacto" en el inquilino EVASOL se presenta el formulario de PAPER ("Auditoría de Patrimonio Personal", Martha Padrón, NSS/CURP/RFC, Ley 73, Modalidad 40). El tenant EVASOL es una empresa de energía solar, no de consultoría patrimonial.

La causa es que la bandera `isPaper` se deriva del **motor de base de datos** en lugar de la **identidad del inquilino**:

- `js/modules/core.js:480` expone `app.state.dbEngine = company.db_engine` (campo `db_engine` de `Config_Empresas`).
- `js/modules/public.js:1821` y `js/modules/events.js:379` computan `isPaper = (app.state.dbEngine).toUpperCase() === 'SUPABASE'`.

`db_engine` solo indica si las tablas privadas viven en GAS o Supabase (hybrid DB). Varios inquilinos migrados (EVASOL, PFM, PAPER) comparten `SUPABASE`, por lo que la condición es un proxy inválido del negocio.

## Decision

Calcular `isPaper` por identidad del inquilino usando `id_empresa`:

- `public.js:1821` → `const isPaper = String(company.id_empresa).toUpperCase() === 'PAPER';`
- `events.js:379` → mismo criterio con el `company` de `Config_Empresas` para el `companyId` actual.

El contenido de PAPER (campos, copy, envío de lead) queda acoplado únicamente al negocio PAPER. `db_engine` se conserva para lo que realmente controla: selección de backend de datos.

## Alternatives Considered

1. **Flag de contenido en `Config_Empresas`** (p. ej. `plantilla_contacto`): más flexible, pero innecesario — solo PAPER usa ese formulario hoy. Evitar sobre-ingeniería (ponytail ladder: rung 1, YAGNI).
2. **Detectar por `tipo_negocio`**: frágil, duplica lógica de negocio en presentación.

## Files Modified

Aplicado:
- `js/modules/public.js` (línea 1821)
- `js/modules/events.js` (línea 379)

## Validation

- `node --check js/modules/public.js` ✅
- `node --check js/modules/events.js` ✅
- EVASOL: `#contact` debe mostrar "Contáctanos" genérico (sin NSS/CURP/RFC ni copy de Martha Padrón).
- PAPER: `#contact` debe conservar "Auditoría de Patrimonio Personal" y los campos patrimoniales.
- Lead de EVASOL: `asunto` = "Contacto Web", `nivel_crm` = 1 (sin billing). *(smoke test manual pendiente)*

## Consequences

- **Positive:** Todo inquilino no-PAPER (EVASOL, PFM, etc.) recupera su formulario genérico; el lead ya no se etiqueta como "Solicitud Auditoría".
- **Negative:** Ninguna — `isPaper` deja de existir como concepto por motor; si un futuro inquilino quiere el formulario patrimonial habrá que introducir un flag explícito.
- **Neutral:** No afecta el almacenamiento híbrido ni el flujo SUPABASE de `loadData`.

---

*Decision recorded by SuitOS agent session — 2026-08-17*