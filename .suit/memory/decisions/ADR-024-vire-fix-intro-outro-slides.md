# ADR-024: ViRe — eliminar slides de intro/outro sin imagen (título interno filtrado a pantalla + overlay sin límite de ancho)

**Date:** 2026-08-09
**Status:** Accepted
**Risk:** Low
**Workflow:** bugfix

---

## Context

Reporte de usuario tras una corrida real de ViRe (CreatorEngine, botón "✨ Auto (Datos+IA)") con un guion de 3 escenas (Hook/Desarrollo/Cierre) para "Noe Thermomix":
- La escena 1 se veía como un ícono grande "V" con el texto "Hook" debajo, sin ninguna relación con el `visual` descrito en el guion ("Interior de una cocina moderna con un robot de cocina...").
- La parte visual no coincidía o era nula en varias escenas.
- En la escena 3, el texto se salía de las dimensiones del video.

Video de referencia: `vire_Noe_Thermomix_1786293053274.mp4`.

### Causa raíz

En `SuitCampanas/local-server-node.js`, el mapeo de escenas del guion → escenas ViRe (`/api/vire-produce`) forzaba la primera y última escena a los tipos `intro`/`outro` cuando había más de 2 escenas:

```js
if (isFirst && scenes.length > 2) return { type: 'intro', title: s.title || 'Video', ... };
else if (isLast && scenes.length > 2) return { type: 'outro', cta: s.body, ... };
```

Estos tipos, definidos en `SuitVidGenRemotion/src/components/scenes/IntroScene.tsx` y `OutroScene.tsx`:
1. **Nunca leen `image_prompt`** — solo el tipo `text`/`product` lo hacen (confirmado en `scripts/render.js:66`, que filtra `s.image_prompt` para decidir qué escenas generan imagen, y en `imageProvider.js:51`). Por eso las escenas convertidas a intro/outro nunca recibían imagen: fondo genérico degradado + un ícono placeholder "V" (`IntroScene.tsx:48`) cuando no hay `logo_url`.
2. **Muestran el campo interno `titulo`/`title` como texto grande en pantalla** (`<h1>{scene.title}</h1>` en Intro, 64px). El guion del CreatorEngine usa `titulo` como etiqueta organizativa de la estructura narrativa (Hook/Desarrollo/Cierre), no como copy pensado para verse en el video — el copy real es `texto_overlay`. El mapeo pasaba `s.title` (= `s.titulo`) directo a ese campo.
3. **`OutroScene.tsx`** renderiza `scene.cta` (= `s.body`, la frase completa de la escena) en un `<h2>` de 48px **sin `maxWidth`**, dentro de un contenedor con `transform: scale()` — un cuerpo de texto largo se sale del frame de 1080px. `TextScene.tsx`, en cambio, sí acota su overlay a `maxWidth: "85%"`.

Esto además contradice una regla ya documentada en `SuitCampanas/CLAUDE.md`: *"Overlays de logo/avatar/contacto van como miniaturas sobrepuestas sobre las imágenes generadas por IA, nunca como slides separados"* — el intro/outro eran exactamente eso, slides separados sin imagen.

## Decision

En `local-server-node.js`, dentro de `/api/vire-produce`, se eliminó la rama `isFirst`/`isLast` → `intro`/`outro`. **Todas las escenas del CreatorEngine se mapean ahora a `type: 'text'`**, uniformemente:
- Cada escena usa su `image_prompt` (= `s.visual`) real → todas generan imagen IA, ninguna cae al placeholder "V".
- Ya no se pasa `s.title`/`s.titulo` como campo `title` de la escena — solo se usa como candidato de `voice_text`. El único texto en pantalla es `texto_overlay`, acotado a 85% de ancho (sin overflow).
- El teléfono/sitio web (antes exclusivos del `outro`) se anexan al `texto_overlay` de la última escena (`"{overlay} · {telefono} · {sitio_web}"`) en vez de perder esa información — sigue visible, pero ya no como slide propio ni con estilo sin límite de ancho.

No se tocó `IntroScene.tsx`/`OutroScene.tsx`/`SceneRenderer.tsx` — siguen existiendo para otros posibles usos de `type: 'intro'`/`'outro'` (p. ej. `Root.tsx`, composición de demo), solo se dejó de producirlos desde el pipeline de SuitCampanas.

## Files Modified

| File | Changes |
|------|---------|
| `SuitCampanas/local-server-node.js` | `/api/vire-produce`: mapeo de escenas simplificado a siempre `type: 'text'`; se quitó el paso de `titulo` como título en pantalla; contacto (`telefono`/`sitio_web`) ahora se anexa al `texto_overlay` de la última escena en vez de ir en un `outro` separado |

## Validation

1. `node --check local-server-node.js` ✓
2. Render real end-to-end con `SuitVidGenRemotion/scripts/render.js`, replicando el guion exacto reportado por el usuario (3 escenas Hook/Desarrollo/Cierre + contacto de prueba) — sin pasar por el servidor HTTP. Resultado: video 1080x1920, 30.06s, exit code 0. Frames extraídos de las 3 escenas (`~3s`, `~15s`, `~27s`) confirman:
   - Escena 1: imagen real de cocina con robot (ya no el ícono "V" + "Hook").
   - Escena 3: overlay envuelto dentro del frame, sin salirse de los 1080px, con teléfono/sitio agregados en la misma línea de overlay.

## Consequences

- **Positive:** las 3 escenas del CreatorEngine muestran ahora su imagen IA real; ningún texto interno (`titulo`) se filtra a pantalla; el overlay de la última escena ya no se desborda; el contacto sigue visible sin violar la regla de "nunca como slide separado".
- **Negative:** se pierde el logo grande centrado tipo "portada" que el `intro` ofrecía cuando había `logo_url` — no se usaba en la práctica (el mapeo de ViRe nunca pasa `logo_url`), así que no hay regresión real de funcionalidad en uso.
- **Neutral:** queda pendiente (ya anotado en `SuitCampanas/CLAUDE.md` como pendiente crítico) implementar el overlay de logo/contacto como miniatura real sobre la imagen, en vez de texto concatenado — este fix es la corrección mínima que no rompe la regla existente, no la implementación final de esa miniatura.

---

*Decision recorded by SuitOS agent session — 2026-08-09*
