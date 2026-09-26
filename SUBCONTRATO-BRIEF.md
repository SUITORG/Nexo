# SUBCONTRATO-BRIEF — Capa Contenido del vector Brief
SuitOrg › SUBCONTRATO-BRIEF · Padre: `CONTRATO.md` (raíz SuitOrg) · Hermano: `SUBCONTRATO-ACTIVOS.md` · Fecha: 2026-09-25 · v1.0

## Propósito
Goberna la **Capa Contenido** del campo `Config_Empresas.logo_url`: los 20 segmentos de contenido del vector Brief (de los 21 canónicos de `BRIEF_FIELD_ORDER` — el segmento `LAPVTFU` pertenece a la Capa Activos, ver `SUBCONTRATO-ACTIVOS.md`). Es el único responsable de generar, validar y escribir ese contenido.

## Stack y ejecución
- Motor: `scripts/brief-generate.js` (router Express en puerto 3001): endpoints `/api/brief/companies|parse|generate|write|metadata|assets|ensure-logo|ensure-avatar`
- UI: `brief.html` (same-origin en 3001) + proxy GAS `backend/brief-sidebar.js` (`google.script.run` → Node, server-to-server)
- Proceso declarado: workflow `.suit/workflows/brief-generation.yaml` (11 pasos, `requires_confirmation: true`)
- Skill: `.suit/skills/domain/brief-engine.yaml`
- Formato de referencia: `.suit/memory/patterns/brief-format.md` + ADR-026, ADR-035
- MCP de lectura: `scripts/mcp/brief-server.js` (`brief.parse`, `brief.assemble`)

## Datos y multi-inquilino
- Lee y escribe `Config_Empresas.logo_url` de **una sola empresa por id_empresa** (invariante B3 heredado del padre)
- Escritura vía GAS `updateBriefVector` con backup previo a `cte<id>/_brief/historial/` (ADR-028)
- Metadata de generación: `brief.json`, `confianza.json` en `cte<id>/_brief/` (Drive)
- Taxonomía: catálogos Supabase `industrias` / `nichos` consultados desde Node (no desde GAS)

## Límites
- Puede modificar: `scripts/brief-generate.js`, `brief.html`, `scripts/mcp/brief-server.js`, su workflow y su skill
- No debe tocar: los 7 slots LAPVTFU (dominio de `SUBCONTRATO-ACTIVOS.md`), otros campos de `Config_Empresas`, el parser legado `SuitCampanas/local-server-node.js` (solo lectura — ADR-035)

## Invariantes (además de los heredados del padre)
1. **Frontera de escritura**: al escribir el vector, el segmento `LAPVTFU` se preserva byte a byte (invariante de celda, `CONTRATO.md` §Invariantes #7)
2. 21 segmentos en orden fijo `BRIEF_FIELD_ORDER` (`scripts/brief-generate.js:567`); sin `|` dentro de valores de campo
3. **Gate de confirmación**: no se escribe en `logo_url` sin aprobación del usuario
4. Backup previo obligatorio antes de cada overwrite
5. Campos de cliente (slogan, descripcion, color_tema) jamás se sobreescriben con IA (be-005)
6. Confianza B exige URL fuente (be-007); campos vacíos van `[PENDIENTE - motivo]` (be-006)
7. Sin columnas nuevas en `Config_Empresas` (be-001)

## Definición de terminado
- E2E en empresa demo: brief generado → vector parseable con 21 segmentos → segmento `LAPVTFU` byte idéntico al previo
- `node --check scripts/brief-generate.js` limpio
- Commit de fase 0 con formato `ciclo(f0/contrato)[SuitOrg]: ...`

## POR CONFIRMAR
- Los endpoints `ensure-logo`/`ensure-avatar` viven en el mismo router pero su lógica es de la Capa Activos — asumido: aquí son solo puente, las reglas mandan en `SUBCONTRATO-ACTIVOS.md`
- `BRIEF_EXTRA_COLUMNS` (slogan, descripcion, giro_especifico, foto_agente) está declarado en el workflow pero no se trazó en código esta sesión

## Cambios
- 2026-09-25: sub-contrato inicial creado (f0), verificado contra `brief-generate.js`, `brief-generation.yaml`, `brief-engine.yaml`
