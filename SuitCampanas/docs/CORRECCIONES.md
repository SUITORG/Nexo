# CORRECCIONES — SuitCampanas

## 2026-10-24 — pbp en BRIEF_LIST_FIELDS rompía parseBrief()

- **Síntoma**: `node scripts/tmp_test_parser.js` → FAIL "PBP: texto libre, no lista"
- **Causa**: `pbp` estaba en `BRIEF_LIST_FIELDS` (línea ~939 de `local-server-node.js`), lo que convertía el campo PBP del BRIEF a array (`promesa_beneficio_prueba`) en vez de dejarlo como texto libre. ADR-026 dice explícitamente: "PBP cae correctamente como texto libre por el paso genérico" y "BRIEF_LIST_FIELDS.pcp/pbm son alias muertos — no se tocan".
- **Arreglo**: removido `pbp` del mapa `BRIEF_LIST_FIELDS`. Restaurado el estado original (solo `dolor`, `pcp`, `pbm`, `objecion`, `competidores`).
- **Regla preventiva**: antes de agregar una etiqueta a `BRIEF_LIST_FIELDS`, verificar ADR-025/026 — no todas las etiquetas del BRIEF deben ser listas. PBP/PBM/PCP son texto libre.
- **Verificado**: test 20/20 PASS tras fix.

## 2026-10-24 — GAS_URL: dos deployments distintos

- **Síntoma**: test de GAS con la URL de AGENTS.md (`AKfycbzlNe...`) devolvía datos de otra tabla con `action=getAll`.
- **Causa**: existen al menos 2 deployments GAS distintos. El server usa `AKfycbwbyoj...` (línea 471 de `local-server-node.js`), que sí devuelve `Config_Empresas` con `action=getAll`. La URL de AGENTS.md (`AKfycbzlNe...`) es otro deployment con acciones diferentes.
- **Arreglo**: ninguno — era error del test (usé la URL equivocada). El código del server es correcto.
- **Regla preventiva**: al testear GAS, usar SIEMPRE la `GAS_URL` de `local-server-node.js:471`, no la de AGENTS.md.
