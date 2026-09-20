# ADR-033: SuitCampanas — Flujo completo "Póster Comfy" (frase + categoría, desde el sitio)

**Date:** 2026-09-17
**Status:** Aplicado (2026-09-17)
**Risk:** Bajo (endpoint nuevo, aislado; catálogo cerrado, sin IA de por medio)
**Workflow:** feature

---

## Context

Sobre [[ADR-032]] (botón "Comfy" — preview crudo con datos de empresa), el usuario pidió el flujo completo desde el sitio: escribir una frase, apretar un botón, y recibir el póster terminado (escena + tipografía + franja inferior), como el que se armó a mano por terminal con `SuitComfy/quote-flow-poster.js` (frase "Tu mejor arma es el conocimiento").

## Decision

1. **Catálogo cerrado `POSTER_CATEGORIES`** (`local-server-node.js`, mismo criterio que `BRIEF_FONT_TONES`: catálogo fijo, no texto libre) — 7 categorías (conocimiento, disciplina, esfuerzo, dinero, calma, propósito, creatividad), cada una con su `escenario` (prompt de ComfyUI), `accent`, `destino` (letrero), `badge` e `icons` (banco tomado del formato Quote-Flow original).
2. **Reparto determinístico de la frase** (`splitFraseEnLineas()`, sin IA): las últimas 1-2 palabras son la palabra clave en acento, el resto se reparte en hasta 2 líneas — nunca revienta, no depende de OmniRoute.
3. **`POST /api/comfy/poster`**: `{empresa, frase, categoria}` → genera la escena con `generarImagenComfy()` (ya existente) → compone con `composePoster()` de `SuitComfy/quote-flow-poster.js`, requerido directamente entre proyectos (`../SuitComfy/quote-flow-poster`, mismo patrón que `../PresentacionesVid/bdpv-generator`) → responde el PNG en base64. Igual que `/api/comfy/quick-preview`, el archivo compuesto se escribe en `os.tmpdir()` y se borra apenas se lee (no ensucia ninguna galería).
4. **`color_tema` de la empresa pisa el accent de la categoría** si es un hex válido (`empresa` es opcional en este endpoint — sin empresa, o sin `color_tema`, se usa el default de la categoría, sin bloquear nada).
5. **UI**: campo de frase + `<select>` de categoría + botón "🖼️ Generar Póster" en el mismo bloque del botón "Comfy" (`index.html`/`script.js`), mismo patrón de disable+spinner+`showToast`.

## Bug encontrado en el camino (preexistente, no introducido por este cambio)

Primer test end-to-end real (vía HTTP, no llamando las funciones directo) reprodujo un `503` con ComfyUI **y** SuitComfy confirmados sanos (`200`/`200` en paralelo) — el log de SuitCampanas mostró `fetch failed` a los ~5 minutos exactos. Causa real: **Node pone por defecto `server.requestTimeout` en 300000ms (5 min)** en el servidor HTTP de `SuitComfy` (`index.js`, `app.listen()`) — mata la conexión entrante aunque ComfyUI siga generando bien. El `AbortSignal.timeout` del lado cliente (SuitCampanas, ya en 360s) no protege contra esto porque el que corta la conexión es el *servidor* SuitComfy, no el cliente. Corregido en `SuitComfy/index.js`: `server.requestTimeout = 0; server.headersTimeout = 0;` tras `app.listen()` — sin límite, el techo real ya lo pone el cliente. Beneficia a **cualquier** consumidor de SuitComfy (VIDE/ViRe, quick-preview, este endpoint), no solo a este flujo.

## Alternatives Considered

1. **Derivar categoría/escenario/destino/íconos con IA (LLM vía OmniRoute)**, más fiel al "PASO 0" del prompt original: descartado para esta primera versión — agrega una dependencia externa más a una cadena que ya tiene 2 (ComfyUI + SuitComfy) y cuyo pedido explícito era "sin romperse". El catálogo cerrado es 100% determinístico. Queda como posible v2 si se pide.
2. **Dejar el prompt de escena influenciado por industria/nicho de la empresa** (como hace `quick-preview`): descartado — la metáfora visual del póster va atada al TEMA de la frase/categoría, no al rubro de la empresa; mezclar ambos hubiera diluido la escena (ej. "biblioteca" + "bootcamp de programación" no combina mejor que solo "biblioteca").
3. **Subir el límite en vez de desactivarlo** (ej. `requestTimeout = 600000`): descartado — el cuello de botella real es la CPU, no un valor fijo; desactivarlo dele al cliente (que sí tiene contexto de cuánto esperar razonablemente) la responsabilidad de cortar.

## Files Modified

- `SuitCampanas/local-server-node.js`: `POSTER_CATEGORIES`, `splitFraseEnLineas()`, endpoint `/api/comfy/poster`, import de `composePoster`.
- `SuitCampanas/index.html` / `script.js`: campo de frase + selector de categoría + botón "Generar Póster".
- `SuitComfy/index.js`: fix de `requestTimeout`/`headersTimeout`.
- `SuitCampanas/CLAUDE.md`: bullet nuevo.
- Creado: este ADR.

## Validation

- `node --check` en los 3 JS modificados.
- Primer intento real end-to-end vía `curl` contra `:8000` → reprodujo el bug de `requestTimeout` (503, servicios confirmados sanos).
- Corregido → reintentado → `200`, póster real completo (biblioteca + "TU MEJOR ARMA ES EL CONOCIMIENTO" + SABIDURÍA + 4 íconos + insignia) devuelto y verificado visualmente, sirviendo desde el endpoint real del sitio (no un script suelto).

## Consequences

- **Positive:** flujo completo utilizable desde el navegador; el fix de timeout estabiliza TODO uso de SuitComfy con generaciones largas, no solo este endpoint.
- **Negative:** catálogo de 7 categorías es fijo — una frase que no encaje bien en ninguna (ej. tema muy nicho) va a quedar con una escena genérica del category más cercano.
- **Neutral:** sigue sin guardar nada en disco/Supabase — cada póster es una prueba efímera, a propósito.

---

*Decision recorded by SuitOS agent session — 2026-09-17*
