# Roadmap — SuitCampanas Improvements

**Inicio**: 2026-07-19
**Fuente**: `MEJORAS_SUITCAMPANAS.md`

---

## Estado General

| Fase | Avance |
|------|--------|
| P0 — Verificación de fuga | █████░░░░░ 50% |
| P1 — Seguridad activa | ██████████ 100% |
| P2 — Cerrar ciclo de fix | ████████░░ 80% |
| P3 — Actualizar Core | ████████░░ 80% |
| P4 — Mantenibilidad | ░░░░░░░░░░ 0% |
| P5 — Calidad de video VIDE | ██████████ 100% (pendiente de prueba manual del usuario) |

---

## P0 — Verificación de fuga

- [x] Confirmar si `._backup/` está en historial git
- [ ] Rotar credenciales Google Cloud (Drive API Key, Client ID, App ID) — **requiere acción manual**

## P1 — Seguridad activa

- [x] 1.1 Reemplazar `service_role` por anon key + RLS en `lib/supabase.js`
- [x] 1.2 Reemplazar `execSync(cmd, {shell:true})` por `spawnSync`/`ffmpeg()` helper
- [x] 1.3 Sanitizar ~15 sitios críticos de `innerHTML` en `script.js` (escapeHtml helper + DOM API)
- [x] 1.4 Restringir `/api/proxy-image` a lista blanca de dominios conocidos
- [x] 1.5 Restaurar token en endpoints Supabase (RLS + anon key cubre la función)
- [x] 1.6 Restringir CORS a orígenes conocidos

## P2 — Cerrar ciclo del proceso de fix

- [x] 2.1 Eliminar `._backup/` del working tree
- [x] 2.2 Agregar `._backup/` a `.gitignore`
- [x] 2.3 Corregir `package.json` start → `local-server-node.js`
- [x] 2.4 Agregar columna `activo` a tabla `campanas` (TRUE en upsert)

## P3 — Actualizar Core

- [x] 3.1 Corregir `path: CampanasAi/` → `SuitCampanas/` en `projects.yaml`
- [x] 3.2 Corregir rutas en `AGENTS.md`
- [x] 3.3 Actualizar `ARCHITECTURE.md` §16 (~15 referencias corregidas: skill context, project registry, workflow context, loader/planner/telemetry examples)
- [x] 3.4 Renombrar `generar()` → `generarTitulo()` en `reel-generator.js:103` (typo corregido)

## P4 — Mantenibilidad

- [ ] 4.1 Fragmentar `script.js` en módulos
- [ ] 4.2 Fragmentar `local-server-node.js` en módulos
- [ ] 4.3 DAO centralizado para Supabase
- [ ] 4.4 Agregar lint + typecheck
- [ ] 4.5 Agregar tests

## P5 — Calidad de video VIDE (sesión 2026-07-29/30)

Detalle completo y verificación de cada punto en `.suit/memory/bugs/videos-multiples-fallas.md` (B1-B17 + 2 mejoras de calidad).

- [x] 5.1 VIDE/ViRe separados como motores independientes (ADR-012)
- [x] 5.2 Crash `avatarPath is not defined` — abortaba audio/música/subtítulos en todo render
- [x] 5.3 Auto-sync GAS rompía por redirect 302 no seguido (`fetchWithRedirects`)
- [x] 5.4 Video se truncaba a la duración de la voz en vez de la del guion
- [x] 5.5 Logo/avatar aparecían como slides extra en vez de overlay
- [x] 5.6 Autofill de empresa: match case-insensitive + normalización de URL sin protocolo
- [x] 5.7 Overlay de teléfono/sitio web (nuevo, arriba-derecha, todas las escenas)
- [x] 5.8 Texto de overlay (título/contacto) se salía del cuadro — wrap + shrink + elipsis
- [x] 5.9 Prompt de `generateVideJson()`: alineación psicológica + plantilla derivada de conciencia + fields cinematográficos (`camara`/`pattern_interrupt`/`sfx`)
- [x] 5.10 Voz: gTTS → Edge TTS neuronal (Python, MIT/LGPL — no la versión npm, que es no-comercial)
- [x] 5.11 Imágenes: dimensiones correctas por formato (antes fijas a 1080x1920) + modelo `flux` + dirección de cámara en el prompt
- [x] 5.12 Chip del logo: contraste blanco en vez de negro (logos oscuros se perdían)
- [ ] 5.13 **Pendiente: prueba manual del usuario en el navegador real** — todo lo anterior verificado contra el servidor directo, no desde la UI en vivo

### Backlog evaluado y diferido (no bloqueante)
- **FT-001** (`.suit/memory/pending/tech-debt.yaml`): integrar ComfyUI como motor visual/audio para VIDE — solo el registro MCP está hecho, resto diferido.
- **FT-002** (`.suit/memory/pending/tech-debt.yaml`): automatizar edición vía DaVinci Resolve + MCP desde SuitCampanas — diferido hasta que la prueba manual (5.13) confirme si hace falta algo que FFmpeg no pueda resolver (color grading, mezcla compleja). Rompería la automatización 100%-servidor actual.

---

## Historial de cambios

| Fecha | Item | Estado |
|-------|------|--------|
| 2026-07-19 | Verificar `._backup/` en git | ✅ Encontrado en 2 commits |
| 2026-07-19 | Eliminar `._backup/` del working tree | ✅ |
| 2026-07-19 | Agregar `._backup/` a `.gitignore` | ✅ |
| 2026-07-19 | Corregir `package.json` start | ✅ |
| 2026-07-19 | Restringir CORS a localhost | ✅ |
| 2026-07-19 | P3: projects.yaml — path + context + servers | ✅ |
| 2026-07-19 | P3: AGENTS.md — architecture + gotchas + command | ✅ |
| 2026-07-19 | P3: ARCHITECTURE.md — 15 referencias CampanasAi/ → SuitCampanas/ | ✅ |
| 2026-07-19 | P3: .suit/INDEX.md — path CampanasAi/ → SuitCampanas/ | ✅ |
| 2026-07-19 | P3: .suit/tests/system.yaml — path → SuitCampanas/ | ✅ |
| 2026-07-19 | P3: .suit/workflows/video-generation.yaml — CampanasAi/media/ → SuitCampanas/media/ | ✅ |
| 2026-07-19 | P3: scripts/generate-index.js — prefix CampanasAi/ → SuitCampanas/ | ✅ |
| 2026-07-19 | P3: contexto.md — tree CampanasAi/ → SuitCampanas/ | ✅ |
| 2026-07-19 | P1.1: lib/supabase.js — service_role → anon key, process.exit → throw | ✅ |
| 2026-07-19 | P1.2: local-server-node.js — 12 execSync({shell:true}) → ffmpeg() helper con spawnSync | ✅ |
| 2026-07-19 | P1.3: script.js — escapeHtml helper + DOM API en drivePreview, slides, history cards, trends, logs | ✅ |
| 2026-07-19 | P1.4: proxy-image — whitelist de 14 dominios | ✅ |
| 2026-07-19 | P2.4: campanas upsert — activo: TRUE agregado | ✅ |
| 2026-07-19 | P3.4: reel-generator.js — generar() → generarTitulo() | ✅ |
