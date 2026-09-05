# ADR-028: SuitBoard — Rescate y organización del dashboard Crypto + US Market

**Date:** 2026-08-31
**Status:** Aplicado (2026-08-31)
**Risk:** Bajo (archivo estático, sin secretos ni API keys, datos públicos de mercado)
**Workflow:** feature (organización de proyecto huérfano)

---

## Context

El usuario recordaba haber armado un dashboard de mercado (crypto + acciones EE.UU.) pero no sabía dónde lo había guardado. Se hizo una búsqueda amplia por el sistema (Downloads, Documents, Desktop, OneDrive, Notion, Codex, backups de SuitOrg) sin encontrarlo — la mayoría de coincidencias por nombre resultaron ser ruido (plantillas del toolkit `open-design`, un video de Remotion sobre Thermomix mal nombrado "inversiones-remotion").

El usuario luego encontró manualmente la ruta: `C:\Users\rojo-\Downloads\dashboard_extendido (1).html` (69KB, single-file, `<title>Dashboard Completo - Crypto + US Market</title>`) y pidió organizarlo dentro del monorepo SuitOrg con un nombre apropiado, apoyándose en las convenciones y skills de documentación de SuitOS.

Al inspeccionar el archivo:
- Pestaña **Crypto**: datos en vivo vía API pública de CoinGecko (BTC, SOL, JUP, RAY, JTO, BONK — foco Solana), sin API key, sin credenciales embebidas.
- Pestaña **US Market**: datos estáticos/demo hardcodeados en el JS (Dow Jones, Nasdaq, ETFs, commodities) — no hay fetch en vivo a ninguna API bursátil real.
- Sin PII ni datos de cuentas personales — es un visor de mercado público, no un tracker de portafolio propio.

En `Downloads/` quedaron además 4 archivos hermanos sin tocar (posibles iteraciones previas): `dashboard.html`, `dashboard (1).html`, `dashboard_extendido.html` (versión anterior más chica) y `dashboard_liquidez_solana.html`.

## Decision

Crear `SuitOrg/SuitBoard/` como nuevo subproyecto local, siguiendo el patrón `Suit*` ya usado por el resto del registry (`SuitCampanas`, `SuitAI`, `SuitMiDBdic`, etc.):

- `SuitBoard/index.html` — el archivo movido tal cual (sin fragmentar), renombrado de `dashboard_extendido (1).html` a `index.html`.
- `SuitBoard/CLAUDE.md` — documentación de alcance, stack y fuentes de datos, siguiendo el formato de `SuitCampanas/CLAUDE.md`.
- Entrada `suit-board` agregada a `.suit/registry/projects.yaml` (`type: static`, sin servidor propio).

Al igual que `SuitCampanas/`, se documenta explícitamente que `SuitBoard/` no pasa por el pipeline de deploy de GitHub Pages del repo raíz.

**No se hizo `git add`** — se deja la decisión de trackear el archivo en git al usuario. Aunque el contenido no tiene secretos, el `CLAUDE.md` raíz advierte que todo archivo del repo es potencialmente público vía GitHub Pages (`path: '.'` en el workflow de deploy), así que cualquier archivo nuevo dentro del árbol del repo se debe agregar a git de forma consciente, no por defecto.

## Alternatives Considered

1. **Dejarlo suelto en `Downloads/`**: es justamente el problema que originó esta tarea — sin registry ni documentación, se vuelve a perder.
2. **Fusionar ya mismo los 4 archivos hermanos en `SuitBoard/`**: se descartó por ahora — no se inspeccionaron todavía y el usuario solo pidió mover "este proyecto" (el archivo que encontró). Se documenta como pendiente en vez de asumir.
3. **Nombrar el proyecto distinto a `SuitBoard`**: el usuario dio ese nombre como sugerencia default; encaja con la convención `Suit*` existente, se mantuvo.

## Files Modified

- Movido: `Downloads/dashboard_extendido (1).html` → `SuitOrg/SuitBoard/index.html`
- Creado: `SuitOrg/SuitBoard/CLAUDE.md`
- Modificado: `.suit/registry/projects.yaml` (+ entrada `suit-board`)
- Creado: este ADR

## Validation

- `SuitBoard/index.html` existe (69413 bytes, igual tamaño que el original) — copia íntegra, no se reescribió contenido.
- Pendiente: abrir en navegador y confirmar que el fetch a CoinGecko sigue funcionando desde la nueva ubicación (no depende de rutas relativas, así que no debería romperse).

## Consequences

- **Positive:** El dashboard queda descubrible vía `.suit/registry/projects.yaml` y documentado — no se vuelve a perder.
- **Negative:** Ninguna — es un archivo estático sin dependencias que se movió sin tocar su contenido.
- **Neutral:** Los 4 archivos hermanos en `Downloads/` quedan sin consolidar, pendientes de que el usuario decida si son historial a conservar o duplicados a borrar.

---

## Update 2026-08-31 — Rotación automática + ampliación a 10 tokens/10 índices

Sobre la base de este ADR se agregaron dos mejoras:

1. **Rotación automática de watchlist crypto**: el score de confiabilidad ya existente (volatilidad 30d + volumen 24h + correlación vs BTC) ahora dispara un swap real cuando el peor token no fijado cae bajo 15 y hay un candidato mejor en `/search/trending` de CoinGecko. Fijados (no rotan, los usa el Pool Calculator): BTC, SOL, JUP, BONK. Persistido en `localStorage`. De paso se corrigió un bug preexistente en `pearsonCorr()` (no validaba `null`, un 429 de CoinGecko tumbaba todo `fetchCryptoLive()`).
2. **De 6 a 10 activos crypto** (+ORCA, PYTH, WIF, RENDER — ids de CoinGecko verificados por API antes de hardcodear) **y de 5 a 10 índices US Market** (+NDX, SOX, NYA, DJT, DJU — estáticos, mismo criterio que los 5 originales). Bump de `suitboard_watchlist_v1` → `_v2` para que un watchlist viejo guardado en localStorage no bloquee el default nuevo de 10.

Probado en navegador real (Playwright, servidor HTTP temporal en `localhost`): sintaxis OK, 10 tarjetas crypto y 10 índices US renderizando, sin crashes incluso con CoinGecko devolviendo CORS/429 (throttling temporal por el volumen de pruebas de esta sesión, no un bug del código — la UI cae con gracia al último dato conocido).

---

*Decision recorded by SuitOS agent session — 2026-08-31*
