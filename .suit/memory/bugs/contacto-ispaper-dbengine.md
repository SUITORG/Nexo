# Bug: El formulario de Contacto muestra contenido de PAPER en cualquier inquilino con `db_engine = SUPABASE`

## Status
Corregido (2026-08-17)

## Reproducción
1. Entrar como inquilino EVASOL (o cualquier empresa con `db_engine = "SUPABASE"`).
2. Pulsar "Contacto" (ruta `#contact`).
3. En lugar del formulario genérico "Contáctanos", se muestra el formulario de PAPER: título "Auditoría de Patrimonio Personal", copy de "Martha Padrón y Roberto Padrón", campos Apellidos / Edad / Semanas Cotizadas / NSS / CURP / RFC / Referido, y select de Ley 73 / Modalidad 40 / Retroactivo / Préstamo.

## Causa raíz
`isPaper` se calcula con el motor de base de datos, no con la identidad del inquilino:

- `js/modules/core.js:480` → `app.state.dbEngine = company.db_engine || company.dbengine || 'GSHEETS'` (viene del campo `db_engine` de `Config_Empresas`).
- `js/modules/public.js:1821` → `const isPaper = (app.state.dbEngine || "").toUpperCase() === 'SUPABASE';`
- `js/modules/events.js:379` → mismo bug: `const isPaper = (app.state.dbEngine || "").toUpperCase() === 'SUPABASE';` (afecta `asunto`, `body`, `subtipo_negocio`, `nivel_crm` del lead).

Como PAPER, EVASOL, PFM y otros tenants migrados tienen `db_engine = "SUPABASE"` (semillas en `backend/seeds_master.js:26,35,41`), cualquiera con SUPABASE dispara el contenido de PAPER. `db_engine` indica el motor de datos privados, no el negocio.

## Fix aplicado
Calcular `isPaper` por identidad del inquilino, no por motor de datos:

- `public.js:1821` → `const isPaper = String(company.id_empresa).toUpperCase() === 'PAPER';` (`company` ya en scope, resuelto en la línea 1803).
- `events.js:379` → `const leadCompany = app.data.Config_Empresas.find(c => c.id_empresa === app.state.companyId); const isPaper = String(leadCompany?.id_empresa || '').toUpperCase() === 'PAPER';` (mismo patrón de lookup que `existingLead` en events.js:372-375).

No se tocaron otras ocurrencias de `dbEngine`/`db_engine` — esas controlan selección de backend (GSHEETS vs SUPABASE), no el contenido del formulario.

## Validado
- `node --check js/modules/public.js` ✅
- `node --check js/modules/events.js` ✅
- Funcional (por confirmar en smoke test manual): EVASOL → `#contact` muestra "Contáctanos" genérico (sin NSS/CURP/RFC ni copy de Martha Padrón); lead con asunto "Contacto Web" y `nivel_crm` 1.
- Funcional (por confirmar): PAPER → `#contact` conserva "Auditoría de Patrimonio Personal" y `nivel_crm` 2 al enviar.

## Afected Files
- `js/modules/public.js` (renderContact, línea 1821)
- `js/modules/events.js` (submitLead, línea 379)
- Campos usados de `Config_Empresas`: `db_engine` (causa), `id_empresa` (corrección)

## Related
- ADR-027-contacto-ispaper-dbengine
- AGENTS.md: Immutable rule #1 (aislamiento por `id_empresa`)