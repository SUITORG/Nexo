# ADR-035: Migración Brief Generation a SuitOrg (Root)

## Status
Accepted (2026-09-22)

## Context
El generador de Brief de Marketing (20 campos pipe-delimited en `Config_Empresas.logo_url`) estaba implementado en `SuitCampanas/` (puerto 8000). Esto violaba la arquitectura:
- **SuitOrg (root)** = orquestación, generación, backend, SSG
- **SuitCampanas** = solo consumo/lectura de Brief para campañas publicitarias

Problemas del estado anterior:
1. `SuitCampanas/local-server-node.js` generaba Brief y escribía a GAS/Drive
2. `brief.html` servido en puerto 8000 (aislado)
3. Sidebar GAS abría ventana externa a `http://localhost:3001/brief.html` por Mixed Content (GS HTTPS → localhost HTTP)
4. Duplicación de lógica parser/generador entre SuitOrg y SuitCampanas

## Decision
Migrar **toda la generación de Brief a SuitOrg (root)**:
- `scripts/brief-generate.js` — Router Express con 8 endpoints (`/api/brief/*`)
- `brief.html` — UI servida por Express en puerto 3001 (same-origin con API)
- `backend/core.js` — Funciones GAS proxy (`generateBriefViaNode`, `writeBriefVectorViaNode`, `saveBriefMetadataViaNode`, `generateAssetsViaNode`, `getBriefAssetsViaNode`, `getBriefCompaniesViaNode`)
- `backend/brief-sidebar.js` — Sidebar GS usa `google.script.run` → funciones proxy → Node.js (server-to-server, sin Mixed Content)
- `SuitCampanas` — Solo `parseBrief()` / MCP `brief.parse` para leer Brief y hacer campañas

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ Google Sheets (HTTPS)                                       │
│  └─ Sidebar → google.script.run.generateBriefViaNode(id)   │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTPS (allowed)
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ GAS (backend/core.js) — Funciones Proxy                     │
│  generateBriefViaNode() → fetch HTTP localhost:3001        │
│  writeBriefVectorViaNode() → fetch HTTP localhost:3001     │
│  saveBriefMetadataViaNode() → fetch HTTP localhost:3001    │
│  generateAssetsViaNode() → fetch HTTP localhost:3001       │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTP localhost (server-to-server, OK)
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ SuitOrg Node.js (puerto 3001)                               │
│  /api/brief/generate  → IA (OpenRouter) + Research fallback│
│  /api/brief/write     → GAS updateBriefVector              │
│  /api/brief/metadata  → GAS saveBriefMetadata              │
│  /api/brief/assets    → GAS ensureCteFolders + generateAll │
│  brief.html           → UI same-origin, sin Mixed Content  │
└─────────────────────────────────────────────────────────────┘
```

## Research Fallback Chain
Sub-agentes B/C/D (avatar, competencia, legal) usan cadena:
1. **Google Custom Search / SerpAPI** (config: `GOOGLE_SEARCH_API_KEY`, `GOOGLE_SEARCH_CX`)
2. **SuitAI** (puerto 3010, endpoint `/api/research`)
3. **Ollama local** (config: `OLLAMA_URL`, `OLLAMA_RESEARCH_MODEL`)

Cada paso: timeout 15-20s, retry 1, log fallback.

## Consequences
- ✅ Arquitectura limpia: SuitOrg genera, SuitCampanas consume
- ✅ Sidebar GS 100% funcional sin ventana externa
- ✅ Research real con fuentes citadas (confianza B)
- ✅ Un solo parser/generador (`scripts/brief-generate.js`)
- ⚠️ Requiere `GOOGLE_SEARCH_API_KEY`/`CX` para research web real (sin ellas cae a SuitAI/Ollama → `[PENDIENTE]`)
- ⚠️ Requiere servidor Node.js SuitOrg corriendo (puerto 3001) para generación

## Files Changed
- `scripts/brief-generate.js` (nuevo - router Express completo)
- `brief.html` (nuevo - UI same-origin)
- `backend/core.js` (+ `updateBriefVector`, 6 funciones proxy)
- `backend/brief-sidebar.js` (reescrito - google.script.run proxy)
- `.env` (+ `BRIEF_GAS_URL`)

## Rollback
```bash
git revert <commit-hash>
cd backend && clasp deploy --version 183  # versión anterior
```

## Related
- ADR-026: Brief vector en `logo_url` (formato 20 campos)
- ADR-023/025: Landing pages en `logo_url`
- `.suit/workflows/brief-generation.yaml`
- `.suit/skills/domain/brief-engine.yaml`