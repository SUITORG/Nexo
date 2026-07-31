# ADR-012: Separación de VIDE (FFmpeg) y ViRe (Remotion) como motores independientes

**Date:** 2026-07-29
**Status:** Accepted
**Risk:** Medium
**Workflow:** bugfix / refactor

---

## Context

SuitCampanas tiene dos motores de generación de video con propósitos y herramientas distintas:
- **VIDE** ("Suite Completa de Video"): pipeline propio con FFmpeg — Pollinations (imágenes), gTTS (voz), SuitMusic/Python (música), FFmpeg (ensamblaje, animaciones, overlays, subtítulos).
- **ViRe**: motor basado en Remotion (`SuitVidGenRemotion`) — Pollinations (imágenes), Google Translate TTS (voz, vía `ttsProvider.js`), composición React/Remotion.

En el código, ambos ya tenían botones de modo separados en la UI (`btnModeVide`, `btnModeViRe`) con sus propias secciones (`#videSection`, `#vireSection`) — la intención de separarlos ya existía. Pero en la práctica:
- El endpoint `/api/video-produce` (VIDE) intentaba **automáticamente** invocar `SuitVidGenRemotion/scripts/render.js` (ViRe) antes de ensamblar con FFmpeg, sin que el usuario lo supiera ni pudiera evitarlo. Si ViRe tenía éxito, el resultado de VIDE (con todos sus fixes de animaciones/overlays/subtítulos) se descartaba en silencio.
- La sección `#vireSection` en la UI **no generaba nada** — solo abría `localhost:3004` (Remotion Studio) en una pestaña nueva, dejando al usuario correr el render manualmente por terminal.

Esto causaba bugs difíciles de diagnosticar (ver `.suit/memory/bugs/videos-multiples-fallas.md`, B8/B9): dependiendo de si ViRe estaba disponible y tenía éxito, el usuario obtenía resultados de un motor completamente distinto al que creía estar usando, con sus propios bugs (caché de audio por índice, mapeo de escenas distinto, etc.).

## Decision

1. **VIDE queda 100% FFmpeg.** Se eliminó el bloque `===== VIRE (REMOTION) RENDER ATTEMPT =====` de dentro de `/api/video-produce`. VIDE ya no puede ser reemplazado en silencio por otro motor.
2. **Nuevo endpoint `/api/vire-produce`**, independiente, que ejecuta *solo* la lógica de ViRe (extraída del bloque removido). Sin fallback silencioso: si Remotion falla, devuelve `status:'error'` con el mensaje real (usando el fix de stderr-tail), no un video de otro motor.
3. **Lógica de parseo de guion compartida**: se extrajo `parseGuionScenes(guion, duration, style)` como función de nivel de módulo, usada por ambos endpoints, para que VIDE y ViRe lean exactamente el mismo formato de guion sin duplicar ~60 líneas de parsing.
4. **`#vireSection` ahora es funcional**: textarea de guion JSON, duración, checkbox de música, botón "Generar con ViRe" → `generateViReVideo()` → `POST /api/vire-produce`. El botón "Abrir Remotion Studio" se conserva como opción avanzada secundaria.
5. **Fix de paso**: el selector muerto `.format-menu, .platform-menu` (bug B5 original) tenía una segunda ocurrencia sin corregir en los modos ViRe y BDPV — se corrigió también ahí.

## Files Modified

| File | Changes |
|------|---------|
| `SuitCampanas/local-server-node.js` | Extraída `parseGuionScenes()`; removido bloque ViRe de `/api/video-produce`; nuevo endpoint `/api/vire-produce` |
| `SuitCampanas/script.js` | Nueva `generateViReVideo()`; listener de `vireGenerateBtn`; fix selector muerto (2 ocurrencias) |
| `SuitCampanas/index.html` | `#vireSection` con form real (guion JSON, duración, música, botón generar, resultado) |

## Validation

1. `node --check` en `local-server-node.js` y `script.js` ✓
2. Test end-to-end standalone (réplica exacta de la lógica nueva de `/api/vire-produce`, fuera del servidor en vivo que corría código viejo): 3 escenas → parseo de guion → mapeo a escenas ViRe → render real con `SuitVidGenRemotion/scripts/render.js`. Resultado: render en 31.4s, exit code 0, video 1080x1920 (h264+aac), duración 12.05s — coincide exactamente con el guion de prueba (3 escenas x 4s). ✓
3. Pendiente (requiere acción del usuario): reiniciar el servidor real (`local-server-node.js`, corre desde antes de estos cambios) y probar ambos botones (VIDE y ViRe) desde la UI real.

## Consequences

- **Positive:** VIDE es predecible — siempre FFmpeg, siempre con los fixes B1-B9. ViRe es invocable de verdad desde la web, con errores explícitos en vez de fallback silencioso. Menos superficie de bugs cruzados entre motores.
- **Negative:** ViRe ahora puede fallar visiblemente donde antes fallaba en silencio y el usuario recibía igual un video (de VIDE) — es un cambio de comportamiento intencional (transparencia sobre "éxito oculto").
- **Neutral:** `SuitVidGenRemotion` no se modificó en esta ADR (su código interno ya se corrigió aparte, ver ADR relacionado de caché de audio) — solo cómo se invoca desde SuitCampanas.

---

*Decision recorded by SuitOS agent session — 2026-07-29*
