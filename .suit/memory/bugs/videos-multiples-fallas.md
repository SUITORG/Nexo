# Bug: Fallas múltiples en VIDE (Suite Completa de Video)

## Status
Corregido (2026-07-29) — B1-B17 resueltos. Ver "Problemas identificados NO corregidos aún" para lo que sigue pendiente.

---

## B1 (CORREGIDO): `uploadedLogoDataUrl` ignorado en VIDE

### Causa raíz
`script.js:generateVideVideo()` solo leía el campo de texto `#companyLogo` para obtener la URL del logo. Ignoraba completamente la variable global `uploadedLogoDataUrl` que contiene la imagen cuando el usuario sube un archivo por `#companyLogoFile`.

En cambio, `generateImaginationVideo()` (modo IMG) SÍ verificaba `uploadedLogoDataUrl` primero.

### Síntoma
Usuario sube logo por archivo → no aparece en el video generado.

### Fix
```javascript
if (uploadedLogoDataUrl) {
    logoUrlValue = uploadedLogoDataUrl;
} else {
    const parsedLogo = parseLogoUrlField(document.getElementById('companyLogo').value);
    logoUrlValue = parsedLogo.logoUrl;
    avatarUrlValue = parsedLogo.avatarUrl;
}
```

---

## B2 (CORREGIDO): FFmpeg hardcodeaba 1080x1920 ignorando Post/Banner

### Causa raíz
`local-server-node.js:1573` — el filter de video usaba `scale=1080:1920...pad=1080:1920` sin importar el `format` (Post=cuadrado, Banner=horizontal).

### Síntoma
Video siempre salía vertical 9:16 aunque se seleccionara Post o Banner.

### Fix
Se agregó `FMT_DIMS` con dimensiones por formato:
```javascript
const FMT_DIMS = {
    Post: { w: 1080, h: 1080 },
    Reel: { w: 1080, h: 1920 },
    Story: { w: 1080, h: 1920 },
    Banner: { w: 1200, h: 628 }
};
```

---

## B3 (CORREGIDO): Server devolvía `status: "success"` sin video

### Causa raíz
Cuando todas las imágenes fallaban (Pollinations caído, etc.), `imageFiles` quedaba vacío, se saltaba todo el bloque FFmpeg, y caía en el `else` que devolvía `{ status: 'success', steps }`.

### Síntoma
Toast verde de éxito pero sin video descargado.

### Fix
Se agregó detección de pasos con ❌ → si hay errores, devuelve `status: 'error'` con HTTP 500.

---

## B4 (CORREGIDO): Animaciones no aplicadas en FFmpeg

### Causa raíz
`local-server-node.js` (loop de ensamblaje VIDE) — `anim = scene.animacion` se parseaba pero nunca se usaba en el filter de video (`vf`).

### Síntoma
`zoom_in`, `ken_burns`, `fade` del JSON de escenas se ignoraban; todas las escenas salían estáticas.

### Fix
Mapeo de `anim` a filters FFmpeg antes del overlay de texto:
- `zoom_in` → `zoompan=z='min(zoom+step,1.3)'` (zoom progresivo 1.0→1.3)
- `ken_burns` → `zoompan=z='if(lte(zoom,1.0),1.3,max(1.0,zoom-step))'` (zoom regresivo 1.3→1.0)
- `fade` → `fade=t=in...,fade=t=out...` al inicio/fin de la escena
- `none` → sin filtro adicional (solo `fps`)

`step` se calcula dinámicamente como `0.3 / (segDuration * fps)` para que el efecto se complete exactamente en la duración de la escena, sin importar si dura 3s o 15s.

### Bug oculto encontrado al implementar B4: `-t` como opción de INPUT rompe `zoompan`
Al combinar `-loop 1 -t N -i imagen.png` (patrón ya usado en `/api/slideshow` y el código VIDE anterior) con un filtro `zoompan`, FFmpeg multiplica frames: la imagen en loop usa el framerate por defecto del demuxer de imagen (25fps) para generar `N*25` frames de INPUT, y `zoompan` sostiene CADA uno de esos frames por `d` frames de salida → duración real = (N*25) * (d/fps), no `N` segundos. Verificado con `ffprobe`: un segmento configurado para 5s salía de **625s** (15000 frames).

**Fix**: mover `-t N` para que sea una opción de OUTPUT (después de `-vf`, antes de `-c:v`) en vez de opción de input. Con `zoompan`, la duración de salida ya la controla `d`/`fps` del propio filtro; `-t` como output simplemente trunca al valor correcto.

⚠️ **`/api/slideshow` (línea ~1042) probablemente tiene el mismo bug** para sus efectos `ken_burns`/`zoom` — no se tocó por estar fuera del alcance de esta tarea (VIDE), pero queda anotado para revisión futura.

---

## B6 (CORREGIDO): Ruta de Windows sin escapar rompe filtros `drawtext`/`subtitles`

### Causa raíz
Los tres sitios que embeben una ruta de archivo dentro de un string de filtro FFmpeg (`drawtext=textfile='...'` en dos lugares, `subtitles=...` en uno) usaban la ruta absoluta de Windows tal cual (`C:/Users/...`) o solo reemplazaban `\` por `/`. El parser de filtergraph de FFmpeg trata `:` como separador clave=valor, así que el `:` de la letra de unidad (`C:`) rompe el parseo.

### Síntoma
- `drawtext`: error de parseo de filtro (`No option name near '\Users\...'`) → falla el ensamblaje completo cuando hay overlay de texto (texto_overlay de cualquier escena).
- `subtitles` (posicional, sin escapar): FFmpeg interpreta mal el string y falla con `Unable to parse "original_size"...`.

Confirmado con `ffmpeg.exe` real vía `spawnSync` (mismo mecanismo que usa `local-server-node.js`), no solo en shell de pruebas.

### Fix
Nuevo helper `escapeFfmpegPath(p)` en `local-server-node.js` (junto a `ffmpeg()`): reemplaza `\` por `/` y escapa `:` como `\:`. Aplicado en los 3 sitios. Para `subtitles` además fue necesario cambiar de sintaxis posicional a `subtitles=filename='<ruta-escapada>'` (la forma posicional interpretaba mal el resto del string incluso con el `:` escapado).

---

## B7 (CORREGIDO): `drawtext` sin `fontfile` crashea FFmpeg (access violation) en este host

### Causa raíz
Sin el parámetro `fontfile` explícito, `drawtext` depende de fontconfig para resolver una fuente por defecto. En este build de FFmpeg (Gyan.FFmpeg full build) sobre Windows, esa resolución falla con **access violation** (exit code `3221225477` = `0xC0000005`), no con un error controlado — mata el proceso `ffmpeg.exe` directamente.

### Síntoma
Cualquier llamada a `drawtext` (overlay de texto en modo IMG/Imaginación y en VIDE) crasheaba FFmpeg. `spawnSync` capturaba esto como `result.status` numérico grande, no como excepción de "font not found", lo que lo hacía difícil de diagnosticar desde los logs del server.

### Fix
Nuevo helper `getDefaultFontFile()`: detecta una fuente instalada (`C:/Windows/Fonts/arial.ttf` en Windows, rutas típicas de DejaVu/Arial en Linux/Mac como fallback), con override por `FFMPEG_FONT_PATH` en `.env`. Se pasa como `:fontfile='<ruta-escapada>'` en ambos sitios de `drawtext`.

### Verificación
Test de integración end-to-end (4 escenas: `zoom_in`, `ken_burns`, `fade`, `none`, con overlay de texto en 3 de ellas + subtítulos SRT incrustados al final) corrido contra el `ffmpeg.exe` real del sistema vía `spawnSync` — duración final exacta (10.0s = 3+3+2+2), sin crashes, video válido generado.

---

## B5 (CORREGIDO): Selectores .format-menu / .platform-menu inexistentes

### Causa raíz
`script.js` hacía `document.querySelectorAll('.format-menu, .platform-menu')` pero en `index.html` los tabs están dentro de `<div class="mode-switch">`. Esas clases CSS **nunca existieron**.

### Síntoma
Al cambiar de modo, los tabs de formato/plataforma no se ocultaban/mostraban correctamente.

### Fix
Reemplazado por `document.querySelectorAll('.input-group-row:has(.mode-switch) .input-group')` que sí existe en el DOM.

---

## B8 (CORREGIDO): Caché TTS por índice — audio de otro guion se reusa

### Causa raíz
`SuitVidGenRemotion/scripts/helpers/ttsProvider.js` — el audio de cada escena se cachea como `voice_{indice}.mp3` en una carpeta compartida por todos los renders. El nombre del archivo NO incluía el texto, solo la posición de la escena. `voice_0.mp3`...`voice_3.mp3` databan del 8 de julio (prueba anterior) y se reutilizaban en cada render posterior sin importar que el guion nuevo fuera de otro tema.

### Síntoma
El video resultante tiene audio de un guion viejo, de un tema completamente distinto al del guion actual.

### Fix
Clave de caché ahora incluye hash del contenido (texto+idioma+velocidad): `voice_${index}_${hash}.mp3`. Texto distinto → hash distinto → regenera; texto idéntico → mismo hash → sigue cacheando. Se borraron los 5 archivos huérfanos (`voice_0-3.mp3`, `test_google.mp3`). Detalle completo y verificación en `.suit/memory/bugs/vire-audio-cache-tema-distinto.md`.

### Archivo afectado
- `SuitVidGenRemotion/scripts/helpers/ttsProvider.js`

### Chequeado y descartado (NO es el mismo bug)
`SuitVidGenRemotion/scripts/helpers/imageProvider.js` no cachea nada en disco por índice — cada llamada arma la URL de Pollinations directo desde el prompt actual. No aplica el mismo patrón de bug.

---

## B9 (CORREGIDO): Overlay logo/avatar en imágenes VIDE fallaba siempre que no había avatar

### Causa raíz
`local-server-node.js` — al generar cada imagen de escena, el overlay de logo/avatar con `-filter_complex` terminaba con `-map '[with_avatar]'` **hardcodeado**. Esa etiqueta solo la crea el filtro de avatar; si la empresa solo tiene logo (sin avatar/foto), el filtro nunca genera `[with_avatar]` y FFmpeg falla con `Output with label 'with_avatar' does not exist...`.

### Síntoma
Log `[VIDE] Error overlay: FFmpeg error...` repetido una vez por cada imagen de escena generada (visto 3 veces en la prueba real de "noe thermomix"). Al ser un `catch` no fatal, el pipeline seguía sin overlay en vez de cortarse, pero el logo nunca aparecía sobre las imágenes.

### Fix
Se reemplazó el `-map` hardcodeado por una etiqueta dinámica (`lastOverlayLabel`) que rastrea cuál fue el último filtro aplicado (`with_logo` si solo hay logo, `with_avatar` si hay avatar). Verificado con `ffmpeg.exe` real: reproduce la falla exacta con el código viejo y confirma éxito con el fix, para el caso logo-only (el más común).

### Archivo afectado
- `SuitCampanas/local-server-node.js`

---

## Mejora de diagnóstico: `ffmpeg()` mostraba banner en vez del error real

### Causa raíz
El helper `ffmpeg()` truncaba `stderr` a los primeros 500 caracteres. Como el stderr de FFmpeg siempre arranca con ~15-20 líneas de versión/configuración del build, el mensaje de error real (al final) nunca llegaba a mostrarse — por eso los B9 originalmente se veían como "Error overlay: ffmpeg version 8.1.1...--enabl" (cortado a mitad del banner).

### Fix
Ahora toma las últimas 15 líneas de `stderr` (donde está el error real) en vez de los primeros 500 caracteres. Esto fue lo que permitió diagnosticar B9 con el mensaje real en vez de a ciegas.

### Archivo afectado
- `SuitCampanas/local-server-node.js`

---

## B10 (CORREGIDO): `avatarPath` fuera de scope — crash SIEMPRE al ensamblar, con o sin avatar

### Causa raíz
`local-server-node.js` `/api/video-produce` — `let avatarPath = null;` se declaraba **dentro** del bloque `if (modules.includes('images'))`. Ese `let` es de scope de bloque: la variable no existe fuera de ese `if`. Más abajo, en el bloque de ensamblaje final (mismo `try`, bloque hermano), el código hacía `if (avatarPath && fs.existsSync(avatarPath))` para superponer el avatar sobre el video ya concatenado — `avatarPath` ahí es un identificador que JS nunca declaró en ese scope, así que el simple hecho de leerlo lanza `ReferenceError: avatarPath is not defined`, **exista o no** `avatar_url` en el request (no es un fallo del `if`, es que la variable no existe en absoluto en ese punto).

### Síntoma
Log real de producción: `[VIDE] Error FFmpeg: avatarPath is not defined`, justo después de "Ensamblando video final...". El `catch` de ese bloque no es fatal (el request igual devuelve `status:'success'`) pero corta la ejecución a mitad del bloque `else`, saltándose TODO lo que venía después del punto del crash:
- Mezcla de audio (voz + música) → **nunca se aplicaba** → video final sin ningún audio, sin importar el volumen.
- Música de fondo → mismo motivo, nunca llegaba a mezclarse aunque se generara bien.
- Quemado de subtítulos SRT → tampoco se aplicaba.

El video que el usuario recibía era literalmente el resultado crudo del `concat` (mudo), no el pipeline completo — coincide exactamente con el reporte "subí el volumen y no hay audio, comparado con videos anteriores".

### Fix
Se subió `let avatarPath = null;` al scope del handler completo (antes del `if (modules.includes('images'))`), y se quitó el `let` duplicado interno (ahora asigna a la variable ya declarada arriba). Verificado con test aislado que reproduce la forma exacta del bug: confirma `ReferenceError` con el shape viejo (incluso sin avatar) y ejecución limpia con el shape nuevo.

### Archivo afectado
- `SuitCampanas/local-server-node.js`

---

## B11 (CORREGIDO): Auto-sync de Prompts_IA nunca lograba parsear JSON — "GAS parse error" cada 5 min

### Causa raíz
Los dos lugares que sincronizan `Prompts_IA` desde Google Apps Script (`POST /api/sync/prompts` y el `setInterval` de auto-sync cada 5 min) usaban `https.get(syncUrl, ...)` **directo**, sin seguir redirecciones. Toda URL de Apps Script (`.../exec`) responde con **302 Moved Temporarily** hacia `script.googleusercontent.com` — confirmado en vivo: `curl` sin `-L` contra la URL real del proyecto devuelve exactamente `302` con body HTML `<HTML><HEAD><TITLE>Moved Temporarily</TITLE>...`. `JSON.parse()` sobre ese HTML falla siempre, 100% de las veces, sin importar el estado real de los datos.

El proxy de `/api/config` (Config_Empresas) **no tiene este bug** — ya usaba el helper `fetchWithRedirects` que sí sigue el 302. Por eso el autofill de empresa (logo/teléfono/sitio web) no dependía de este bug: la fuente de datos (`/api/config`) siempre estuvo sana.

### Síntoma
`[WARN] [AUTO-SYNC] Error: GAS parse error` repetido cada ~5 minutos indefinidamente en el log del server, sin información de la causa real.

### Fix
Ambos sitios ahora reusan `fetchWithRedirects` (ya existente en el archivo, usado por `/api/config`) en vez de `https.get` crudo. De paso, el mensaje de error ahora incluye los primeros 200 caracteres del body real (`'GAS parse error: ' + body.substring(0,200)`) para que un futuro fallo genuino (URL no publicada, cuota excedida, etc.) sea diagnosticable sin adivinar.

### Verificación
Test contra el endpoint GAS real de este proyecto: el código viejo (`https.get` sin seguir redirect) falla con `Unexpected token '<'` sobre el HTML de redirección; el código nuevo (`fetchWithRedirects`) parsea correctamente y devuelve `Config_Empresas` con 17 empresas reales.

### Archivo afectado
- `SuitCampanas/local-server-node.js`

---

## B12 (CORREGIDO): Título de escena no se sobreponía — `texto_overlay` no caía a la clave en español

### Causa raíz
`parseGuionScenes()` — el campo `title` de cada escena sí soporta `s.titulo || s.title || s.titulo_escena`, pero el campo `texto_overlay` (el que realmente se dibuja sobre el video vía `drawtext`) solo caía a `s.texto_overlay || s.title`, **sin** `s.titulo`. Si el guion (generado en español) trae `titulo` pero no `texto_overlay` ni `title` (el caso normal), `texto_overlay` terminaba siempre en el genérico `"Escena N"` en vez del título real de la escena.

### Síntoma
El texto SÍ se dibujaba (no estaba vacío), pero era un placeholder genérico ("Escena 1", "Escena 2"...) en vez del título real del guion — fácil de leer como "los títulos no se están mostrando".

### Fix
`texto_overlay: s.texto_overlay || s.titulo || s.title || \`Escena ${i+1}\`` — mismo orden de prioridad que ya usa el campo `title`, en ambas ramas (array plano y `{escenas:[...]}`).

### Archivo afectado
- `SuitCampanas/local-server-node.js`

---

## B13 (CORREGIDO): Autofill de empresa apilaba listeners duplicados

### Causa raíz
`setupCompanyAutoFill()` se llama de nuevo cada vez que cambia de modo (BD/BDPR/BDSMT/BDPV/ViRe). Cada llamada creaba una clausura `handler` **nueva** y hacía `input.removeEventListener('input', handler)` con esa misma referencia nueva — como nunca fue agregada antes, el remove no quita nada, y el `addEventListener` de abajo apila un listener más. Después de cambiar de modo varias veces, el autofill corría N veces por cada tecla (no rompía el feature, pero sí lo hacía cada vez más redundante/lento).

### Fix
Guard con `input.dataset.autofillBound`: si ya está enlazado, solo re-dispara el autofill una vez (si hay texto) y no vuelve a registrar el listener.

### Archivo afectado
- `SuitCampanas/script.js`

---

## B14 (CORREGIDO): Video final recortado a la duración de la voz, perdiendo escenas

### Causa raíz
Dos problemas compuestos en el ensamblaje de audio de `/api/video-produce`:
1. `amix=inputs=2:duration=first` mezclaba voz+música usando la duración de la **voz** (primer input) como límite — la música, generada para la duración completa, se descartaba más allá de ese punto.
2. El merge final `-i outPath -i mixedAudio ... -shortest` recorta **video y audio por igual** a la pista más corta. Si la narración de gTTS terminaba antes que la suma de duraciones de las escenas (caso común: el guion pide 31.5s pero el texto se lee en 13s), el video entero se cortaba a los 13s, perdiendo escenas completas.

### Síntoma
Video de 3 escenas (31.5s esperados) se descargaba con solo 13.3s reales — las últimas 2 escenas nunca se veían. Confirmado con `ffprobe` antes/después del fix contra el servidor real.

### Fix
- `amix` ahora usa `duration=longest` (no descarta música de más).
- El merge final aplica `apad` a la pista de audio (rellena con silencio si es más corta) y mantiene `-shortest`, que ahora recorta al **video** (la fuente de verdad real, según las duraciones del guion) en vez de a la voz.

### Verificación
Prueba real end-to-end contra el servidor: antes del fix, `ffprobe` reportaba `duration=13.29`; después del fix, `duration=31.08` (vs. 31.5s esperado por el guion, diferencia por redondeo de fps/segmentos). Video+audio íntegros.

### Archivo afectado
- `SuitCampanas/local-server-node.js`

---

## B15 (CORREGIDO): `duracion_total` del guion ignorado a favor de un campo de UI desconectado

### Causa raíz
`parseGuionScenes()` sobreescribía `videoConfig.duracion_total` (usado para dimensionar la música de fondo) con el valor crudo de `#videDuration` de la UI, ignorando la suma real de duraciones de las escenas del guion. Si el usuario pegaba o generaba un JSON cuyo total real no coincidía con lo que quedó en el campo de duración (valor por defecto u olvidado de una sesión anterior), la música se generaba para la duración equivocada.

### Fix
Nueva función compartida `computeRealDuration(scenes)` (suma de `duracion` + pausas entre escenas, misma fórmula que ya usa el resumen de pasos). `videoConfig.duracion_total` ahora prioriza este cálculo real; el campo de UI/`config.duracion_total` del guion solo actúan de respaldo (modo texto plano, sin timing explícito por escena).

Además, en el frontend (`script.js`), pegar o generar un guion JSON en `#videGuionJson` ahora sincroniza `#videDuration` automáticamente (`syncVideDurationFromJson()`, en el evento `input` del textarea y al terminar `generateVideJson()`), para que el campo visible nunca quede desincronizado del guion real.

### Archivos afectados
- `SuitCampanas/local-server-node.js`
- `SuitCampanas/script.js`

---

## B16 (CORREGIDO): Logo/avatar aparecían como slides completos extra, no como overlay

### Causa raíz
`logo.png`/`avatar.png` se guardaban dentro de **`imagesDir`**, la misma carpeta que se lista para armar el timeline del video: `fs.readdirSync(imagesDir).filter(f => f.endsWith('.png')).sort()`. Ese filtro no distingue entre imágenes de escena (`scene_N.png`) y los assets de logo/avatar — los tres tipos son `.png` en la misma carpeta. Resultado: `imageFiles` incluía `avatar.png` y `logo.png` como si fueran escenas más, y el ensamblaje les creaba su propio segmento de video a pantalla completa (con su propia animación/duración), insertados por orden alfabético (`avatar.png`, `logo.png` antes que `scene_0.png`).

Esto solo se manifiesta cuando `logo_url`/`avatar_url` vienen no vacíos — las pruebas anteriores de esta sesión los habían dejado vacíos a propósito (probando duración/audio), por lo que el bug quedó invisible hasta la prueba con datos reales de "Noe Thermomix".

### Síntoma
Reportado por el usuario como "ni el logo ni el avatar son parte de los slides, van sobrepuestos en las imágenes" — en la prueba real efectivamente aparecían como 2 slides de más (`Video ensamblado: 4 escenas` cuando el guion solo tenía 2).

### Fix
`logoPath`/`avatarPath` ahora se guardan en `tmpDir` (la carpeta padre), no en `imagesDir`. `imagesDir` queda reservada exclusivamente para `scene_N.png`, que es lo único que el timeline debe leer. El logo/avatar ya se overlayan correctamente sobre cada imagen de escena (esto ya funcionaba, ver B9/B10) — el bug era que ADEMÁS aparecían como slides propios.

### Verificación
Prueba real end-to-end con logo/avatar/teléfono/sitio web reales de "Noe Thermomix" (Drive normalizado a `lh3.googleusercontent.com`): antes del fix, `imageFiles.length` = 4 para un guion de 2 escenas; después del fix, `imageFiles.length` = 2. Frame extraído con `ffmpeg` confirma visualmente: logo arriba-izquierda, avatar miniatura abajo-izquierda, ambos sobre la imagen de la escena — no como slides aparte.

### Archivo afectado
- `SuitCampanas/local-server-node.js`

---

## B17 (CORREGIDO): Sitio web sin protocolo se blanqueaba en vez de normalizarse

### Causa raíz
`script.js:setupCompanyAutoFill()` — `document.getElementById('webSite').value = (web && web.toString().startsWith('http')) ? web : "";`. El dato real en Google Sheets para "Noe Thermomix" es `"www.nw.com"` (sin protocolo, común al escribir a mano). Como no empieza con `"http"`, el campo se blanqueaba en silencio en vez de completarse — sin error visible, parecía que el autofill "no funcionaba".

### Síntoma
Usuario reporta que, al seleccionar empresa, el campo de sitio web (y por extensión sospechaba también logo/teléfono) no se llenaba. `logo_url` y `telefonowhatsapp` de esta empresa sí tienen formato correcto y ya funcionaban con el fix de comparación case-insensitive (ver arriba); el campo realmente roto era sitio web.

### Fix
Si el valor no empieza con `http`, se le antepone `https://` en vez de descartarlo:
```javascript
const webStr = (findVal([...]) || '').toString().trim();
document.getElementById('webSite').value = webStr ? (webStr.startsWith('http') ? webStr : `https://${webStr}`) : '';
```

### Lección aprendida (para no repetir esta clase de bug)
Los datos de Google Sheets **no vienen garantizados en el formato esperado** — mayúsculas exactas (ver fix de comparación case-insensitive de empresa) y protocolo de URL son la misma familia de problema. Regla general para cualquier campo autollenado desde Sheets: **normalizar/tolerar variaciones de formato, nunca blanquear en silencio** por un chequeo estricto — un campo vacío sin error es indistinguible de "no había dato" y es muy difícil de diagnosticar para el usuario.

### Archivo afectado
- `SuitCampanas/script.js`

---

## Nueva funcionalidad: overlay de teléfono/sitio web en el video

A petición del usuario, además de logo (arriba-izquierda) y avatar (abajo-izquierda), ahora el teléfono y sitio web también se sobreponen en el video: arriba-derecha, fuente más chica (28px vs 64px del título), presente en todas las escenas (mismo patrón que logo/avatar — un solo archivo de texto reusado, no uno por escena). Reutiliza el mismo mecanismo de `drawtext` que el título de escena (`escapeFfmpegPath`, `getDefaultFontFile`). Solo se agrega si `telefono || sitio_web` viene no vacío. Verificado visualmente con frame extraído de un render real.

### Archivo afectado
- `SuitCampanas/local-server-node.js`

---

## Mejora: chip semitransparente detrás del logo

El logo podía perderse visualmente si el fondo generado por la IA en esa esquina era de un color/textura parecida. En vez de detectar brillo por escena y recolorear el logo (más frágil: la esquina de una foto de IA rara vez es de un solo tono, y se perdería el color real de marca), se optó por la solución más simple y estándar: un `drawbox` semitransparente (`black@0.4`) fijo detrás del logo, del mismo tipo que ya usa el título (`boxcolor=black@0.55`). El logo se escala ahora a un lienzo fijo 120x120 (`scale...force_original_aspect_ratio=decrease,pad=120:120`) para que el chip (140x140) siempre lo cubra bien sin importar el aspect ratio del logo original. Verificado visualmente con frame extraído de un render real.

### Archivo afectado
- `SuitCampanas/local-server-node.js`

---

## Mejora: `generateVideJson()` no se apegaba a conciencia/plantilla/tema

### Diagnóstico
Comparado con `generateAIContent()` (el generador de carrusel, que sí funciona bien en esto) y su prompt maestro `CAMP-AI-MASTER` (Supabase, ver `scripts/insert-prompt.js`), el prompt de VIDE (hardcodeado en `script.js`, sin equivalente en Prompts_IA) trataba conciencia/plantilla/tema como líneas informativas sueltas, sin ningún mecanismo que forzara su uso real:
- No reusaba el `templateMap` que ya existe en `generateAIContent()` para derivar la plantilla cuando el usuario la deja vacía — VIDE simplemente escribía "Automático" sin criterio.
- No tenía la instrucción de "alineación psicológica" (adaptar gancho/ángulo/tono al nivel de conciencia) ni el lenguaje de refuerzo ("serás penalizado...") que sí tiene `CAMP-AI-MASTER`.

### Fix
- `TEMPLATE_MAP` (antes duplicado dentro de `generateAIContent()`) ahora es una constante compartida a nivel de módulo; `generateVideJson()` la reusa como fallback cuando `#aiTemplate` viene vacío.
- Prompt de VIDE reforzado con una sección "ALINEACIÓN PSICOLÓGICA (OBLIGATORIO)" (mismo patrón que `CAMP-AI-MASTER`) y una regla de penalización por relevancia al tema/industria.
- Verificado con test aislado (fallback de plantilla + no rompe cuando conciencia/template vienen vacíos).

### Archivo afectado
- `SuitCampanas/script.js`

---

## Nueva funcionalidad: sugerencia de escenas según duración

`#videDuration` ahora sugiere un valor para `#aiSlides` (evento `input`, ~7.5s/escena, acotado 1-10 según el rango ya validado del campo) — mismo patrón ya establecido en el código (`aiConciencia`/`aiTemplate` → `suggestTheme()`): sugiere sin bloquear, el usuario puede sobreescribir. Verificado con test aislado de la fórmula (30s→4, 75s→10 tope, 5s→1 piso).

### Archivo afectado
- `SuitCampanas/script.js`

---

## Mejora: texto de overlay se salía del cuadro (título y contacto)

`drawtext` no envuelve ni ajusta tamaño automáticamente — un `texto_overlay` largo (la IA no siempre respeta "máx 60 caracteres") o un sitio web largo se dibujaban en una sola línea centrada/alineada que se salía del cuadro por ambos lados sin ningún aviso.

### Fix
Nuevas `wrapWords()`/`fitOverlayText()`: envuelve por palabra completa dentro de un ancho máximo (heurística de ~0.55×fontsize por carácter), reduce el fontsize en pasos de 8 si aún así excede el máximo de líneas (2), y trunca con "…" como último recurso. Aplicado al título de escena (ancho VW-160, fontsize base 64→mín 40) y al texto de contacto (ancho VW×0.55, fontsize base 28→mín 20).

### Nota de proceso (para pruebas futuras)
Durante la verificación, la primera corrida pareció fallar (texto sin envolver, igual que antes) — resultó ser que la prueba pegó contra un proceso `node local-server-node.js` **huérfano** de una ronda de pruebas anterior en el mismo puerto 8000 (el intento de arrancar uno nuevo murió con `EADDRINUSE` y `netstat` seguía mostrando "LISTENING" del proceso viejo, dando falsa sensación de éxito). Lección: después de matar un proceso de prueba, no basta con re-arrancar y chequear `netstat` — hay que confirmar el banner de arranque (`🚀 SuitCampanas Server...`) en el log antes de asumir que el servidor que responde es el que tiene el código nuevo.

### Verificación
Test aislado de `fitOverlayText` (wrap sin cortar palabras, fontsize decreciente, truncado con elipsis, ninguna línea excede el presupuesto de ancho). Prueba real con título de 99 caracteres y dominio largo — confirmado con frame extraído: ambos textos envueltos en 2 líneas dentro del cuadro.

### Archivo afectado
- `SuitCampanas/local-server-node.js`

---

## Mejora: nuevo prompt cinematográfico para `generateVideJson()` (Opción A)

El usuario propuso un prompt nuevo con campos más cinematográficos (`pattern_interrupt`, `camara.plano/movimiento`, `sfx`) pero con 2 nombres de campo distintos a los que `parseGuionScenes()` ya espera (`texto_locucion` en vez de `texto`, `visual_b_roll` en vez de `visual`). Verificado en código real: `body` (viene de `texto`) alimenta la voz completa (gTTS), subtítulos SRT y `voice_text` de ViRe — si el prompt cambiaba esos nombres sin ajustar el parser, el audio y las imágenes se habrían roto (mismo patrón que B10).

**Decisión (Opción A, la de menor riesgo):** el prompt nuevo se adaptó para seguir usando `texto`/`visual`/`texto_overlay` (los nombres que el parser ya lee), y se agregaron `pattern_interrupt`/`camara`/`sfx` como campos adicionales — el parser los ignora sin romperse, y probablemente mejoran la calidad de `texto`/`visual` al obligar a la IA a razonar cámara/ritmo antes de escribir, aunque hoy no tengan efecto mecánico directo en el FFmpeg. `config.musica` se mantuvo anidado (`{estilo,bpm,volumen}`, que sí se usa para la música de fondo) en vez del `estilo_musical_global` plano que proponía el prompt original del usuario.

**Observación del usuario atendida:** `config.resolucion` ahora refleja dinámicamente el formato realmente seleccionado (Post/Reel/Story/Banner, mismo mapeo que `FMT_DIMS` del backend) en vez de estar fijo en 1080x1920 — aunque confirmé que este campo no lo lee el backend (las dimensiones reales del video descargado siempre las decide `format` vía `FMT_DIMS`), se corrigió para que el JSON generado sea veraz y no contradiga lo que realmente se va a producir.

Verificado con un caso simulado del schema nuevo corrido a través de la lógica exacta de `parseGuionScenes()`: `body`/`visual`/`texto_overlay` llegan completos, los campos nuevos se ignoran sin error.

### Archivo afectado
- `SuitCampanas/script.js`

---

## Mejora de calidad #1: voz neuronal (Edge TTS) en vez de gTTS

VIDE generaba voz con gTTS (misma familia que Google Translate TTS — sonido robótico). Se cambió a `edge-tts` (voces neuronales de Microsoft, gratis, sin API key), invocado vía `python -m edge_tts` (reusa la resolución de `python` que ya funcionaba para gTTS, sin nuevo punto de falla de PATH). Con fallback automático a gTTS si Edge TTS falla por cualquier motivo (red, etc.), para no regresar a "sin voz".

**Nota de licencia importante**: existe un paquete npm `edge-tts` ya instalado en `SuitVidGenRemotion/node_modules` (usado por ViRe) pero con licencia **CC BY-NC-SA (no comercial)** — no se usó por ese motivo. Se instaló en su lugar el paquete **Python** `edge-tts` (rany2), licencia MIT/LGPLv3, uso comercial permitido. Requiere `pip install edge-tts` en el entorno del servidor (ya instalado en este equipo).

Verificado con prueba real: paso "✅ Voz generada (Edge TTS neuronal)" en el log, audio válido en el video final.

### Archivo afectado
- `SuitCampanas/local-server-node.js`

---

## Mejora de calidad #2: imágenes — dimensiones correctas por formato + dirección de cámara

### Bug encontrado de paso: Pollinations siempre pedía 1080x1920 sin importar el formato
La generación de imágenes tenía `width=1080&height=1920` hardcodeado, ignorando `format` (Post=1080x1080, Banner=1200x628). El FFmpeg de ensamblaje lo compensaba con `scale+pad`, pero la imagen fuente quedaba mal encuadrada/con relleno para formatos no-verticales. Se hoisteó `FMT_DIMS` (antes declarado solo dentro del bloque de ensamblaje) a constante compartida a nivel de módulo, y la generación de imágenes ahora pide las dimensiones reales del formato seleccionado.

### Mejora: `camara`/`pattern_interrupt` del guion ahora influyen en la imagen
Estos campos (del prompt cinematográfico nuevo) se parseaban en `parseGuionScenes()` pero se descartaban silenciosamente (el `.map()` no los copiaba al objeto de escena). Ahora se pasan a través y se antepone al prompt de Pollinations (`"{plano} shot, {movimiento} camera movement, {pattern_interrupt}, {visual}..."`), además de fijar explícitamente `model=flux`.

Verificado con prueba real (formato Post): imagen 1080x1080 real sin franjas de relleno, frame extraído confirma composición correcta.

### Archivo afectado
- `SuitCampanas/local-server-node.js`

---

## Mejoras adicionales (sesión 2026-07-30, feedback tras primeras pruebas)

### Chip del logo: contraste insuficiente para logos oscuros
El chip semitransparente detrás del logo era negro — invisible contra un logo también negro (caso real: logo "Noé Thermomix"). Cambiado a blanco 85% opaco, que funciona para la mayoría de logos (mayoría son de tinta oscura). Verificado con frame real.

### Slides como techo, no como orden exacta (mejor práctica aplicada)
El prompt de `generateVideJson()` exigía "exactamente N escenas". Cambiado a "hasta N escenas, las que el contenido necesite" — evita relleno artificial o corte de ideas para cuadrar un número. `#aiSlides` ahora se sincroniza con el conteo real de escenas del JSON generado/pegado (`syncVideFieldsFromJson`, antes `syncVideDurationFromJson`, ahora sincroniza duración Y slides), igual que ya pasaba con la duración.

### Buscador de tendencias también en VIDE
La función de "Buscar Tendencias" (Google Trends/Reddit vía `/api/trends/fetch`) solo existía en modo BDSMT. Se extrajo la lógica a una función compartida `buscarTendencias(containerId, loaderEl)` y se agregó un botón equivalente en la sección VIDE (`videFetchTrendsBtn` + `videTrendsContainer`) que aplica al mismo campo compartido `#aiTheme` que ya lee `generateVideJson()` — cero endpoints nuevos, solo reuso de lo que ya funcionaba en BDSMT.

### Selector de voz (Edge TTS)
Nuevo `<select id="videVoice">` con 6 voces neuronales en español (MX/ES/AR, M/F) — antes la voz estaba fija a `es-MX-DaliaNeural`. El valor viaja en el payload de `/api/video-produce` (`voice`) y llega hasta la llamada real de `edge_tts`. Verificado con una voz distinta a la default (Jorge) — sin caer al fallback de gTTS.

### TUI configurador-formatos: hover con mouse (corrección final)
El fix anterior (evento `'select item'`) solo cubría navegación por teclado. Se agregó soporte real de hover con mouse: `attachHoverListeners()` engancha `'mouseover'` (evento nativo de `blessed.Element`, confirmado en el código fuente instalado) a cada item individual de las listas — se re-aplica después de cada `setItems()` porque los items se recrean. Detalle completo en ADR-013.

### Archivos afectados
- `SuitCampanas/script.js`, `SuitCampanas/index.html`, `SuitCampanas/local-server-node.js` — chip, slides/duración, tendencias VIDE, selector de voz
- `scripts/configurador-formatos.js` (SuitOrg root) — hover TUI

## Mejoras adicionales (sesión 2026-07-30, feedback tras segunda prueba)

### Teléfono leído como número corrido en vez de por pares
El "texto" hablado de la escena de cierre (CTA) incluía el teléfono tal cual, y el TTS lo leía como un solo número gigante. Se agregó `formatPhoneForSpeech(phone)` en `script.js` (separa dígitos en pares: "8110463721" → "81 10 46 37 21") y se usa en el dato de referencia del prompt + una regla explícita pidiendo que se escriba así si se menciona en voz.

### Video se cortaba antes de terminar de leer el texto
Causa: el fix de B14 (duración de video manda sobre el audio) no contemplaba el caso inverso — si la narración real (medida con ffprobe tras generarla) resultaba más larga que la suma planeada de duraciones de escena, el audio se recortaba a mitad de frase al ajustarse a la duración del video. Fix: se mide la duración real del audio de voz (nuevo helper `getAudioDurationSec()`, usa `ffprobe` derivado de la ruta de `ffmpeg` ya detectada) y, si excede lo planeado, se estira la última escena para que el video alcance a cubrir toda la narración.

### Música casi inaudible
`musica.volumen` se parseaba pero nunca se aplicaba en la mezcla — además `amix` normaliza (divide) el volumen por número de streams por defecto, agravándolo. Fix: filtro explícito `volume=` por pista (`voz=1.0`, `música=musica.volumen`) con `amix ... normalize=0` para que la mezcla sea predecible. Valor por defecto subido de 0.3 → 0.5.

### Selector de estilos visuales (Supabase) — completado, ver ADR-014
Encontré y corregí un `ReferenceError` real (`empresa` no definida en `showStyleSelector`) y una colisión de numeración de ADR. Migración aplicada al Supabase real (4 categorías, 12 sub-estilos, verificado con `list_tables` y una llamada real a `/api/estilos-visuales`) — de paso corregida para resolver categorías por `slug` en vez de IDs hardcodeados (recomendación del propio tool de migración). El Director ahora se alimenta de **uso real**: cada video generado con éxito registra su estilo (`POST /api/tendencias-estilo`, nuevo), corregido también un bug en el `GET` que filtraba por la empresa equivocada y nunca hubiera encontrado datos. Verificado end-to-end contra Supabase real. Detalle completo en `ADR-014-estilos-visuales-vide.md`.

### Archivos afectados
- `SuitCampanas/script.js`, `SuitCampanas/local-server-node.js` — teléfono en pares, corte de audio, volumen de música, fix de `showStyleSelector`
- `.suit/memory/decisions/ADR-014-estilos-visuales-vide.md` — renombrado de ADR-009, hallazgos documentados

## Mejoras adicionales (sesión 2026-07-30, tercera ronda de feedback)

### Música — medida y confirmada presente, subida otra vez
Grabé el audio de música cruda (SuitMusic, fuera de FFmpeg): -19.4dB promedio, nivel normal, no es un archivo silencioso. Medí el audio FINAL mezclado con `volumedetect`/`astats` antes y después del boost: pasó de -24.2dB a -22.5dB promedio tras subir `volumen` de 0.5→0.8 y bajar la voz de 1.0→0.9 (más espacio relativo para la música). Confirmado con RMS por frame que la música persiste durante todo el clip, no solo mientras habla la voz. Si aún no se percibe tras esto (con el servidor realmente reiniciado), lo más probable ya no es volumen sino que el contenido que genera `SuitMusic/scripts/music.py` suena más a tono/beep simple que a "música" reconocible — pendiente de revisar ese generador si persiste.

### Corrección: el hover pedido era en la web, no en la TUI
El usuario aclaró que se refería a pasar el mouse sobre los botones de Formato/Red en `index.html` (la web, no la terminal) — igual que ya funciona en los botones de modo (Ai/BD/VIDE/etc, que usan `title` nativo del navegador). Agregado `title` con medidas reales (1080×1080 Post, 1080×1920 Reel/Story, 1200×628 Banner) y compatibilidad de formatos por red social (derivado de `GUIAFMTRRSS.MD`) a los 4 botones de formato y 5 de red. Mecanismo nativo del navegador, cero JS nuevo, funciona en cualquier navegador.

### TUI — hover con mouse en redes (investigación previa, aplica solo a la terminal): verificado simétrico con formatos, probable límite del terminal
Confirmé que `attachHoverListeners` se aplica igual a `formatosList` y `redesList` en los 3 puntos donde se re-listan items — código idéntico para ambos. Dado que blessed sí solicita el modo de mouse "any-motion" correctamente (confirmado en sesión anterior), si no funciona para redes probablemente tampoco funciona para formatos, y la causa más probable es que el terminal usado (ej. consola clásica de Windows/cmd.exe) no reenvía eventos de movimiento de mouse sin click — limitación del terminal, no del código. La navegación por teclado (ya corregida) es la vía confiable en cualquier terminal; recomendado probar en Windows Terminal si se quiere mouse real.

### Selector de estilos visuales: rediseño en 2 pasos (categorías → sub-estilos)
`showStyleSelector()` mostraba las 12 sub-estilos de las 4 categorías todos a la vez. Rediseñado: primero solo 4 botones de categoría (+ Automático), al elegir una se listan solo sus 3 sub-estilos con un botón "← Categorías" para volver. Menos espacio ocupado, más limpio.

### Archivos afectados
- `SuitCampanas/local-server-node.js`, `SuitCampanas/script.js` — volumen de música, selector de estilos en 2 pasos

## Corrección: respaldo de tendencias hardcodeado sobre paneles solares

`scripts/trend-research.js` — cuando pytrends/Reddit devolvían menos de 3 resultados, entraba un respaldo (`extractTrendsFromIA`, mal nombrado: no llamaba a ninguna IA) con texto **fijo sobre paneles solares/energía solar** (contenido de otro cliente, Evasol) — salía igual sin importar el nicho real pedido.

**Fix**: nueva función `generateAITrendFallback(niche, subNiche, region)` en `local-server-node.js` — llamada real a IA (reusa `callOpenRouter`, mismo patrón que el resto del archivo) con el nicho/sub-nicho/región reales inyectados en el prompt. El hardcode se eliminó de `trend-research.js` por completo. Resultados marcados `fuente: "IA (respaldo)"` para que quede claro que no son datos scrapeados reales.

Verificado con prueba real: nicho "Cocina y electrodomésticos / Robots de cocina" con Google Trends y Reddit fallando (429 rate-limit real) — el respaldo generó 5 ideas genuinamente relevantes (menciona Thermomix/Mycook/Mambo, recetas mexicanas, batch cooking), cero mención de paneles solares.

### Archivos afectados
- `SuitCampanas/local-server-node.js` — nueva `generateAITrendFallback()`, endpoint `/api/trends/fetch` actualizado
- `SuitCampanas/scripts/trend-research.js` — eliminado `extractTrendsFromIA()` hardcodeado

## Problemas identificados NO corregidos aún

### AI providers gratuitos (OpenRouter/Deepseek/Qwen) fallan con "fetch failed"
**No es un bug de código.** `callOpenRouter()` apunta a `http://localhost:20128/v1/chat/completions` — un proxy local llamado **OmniRoute** (`SuitAI/` + `start-omniroute.bat`, ver `SuitAI/README.md`), NO a la API real de OpenRouter. Si ese proceso local no está corriendo, la conexión se rechaza al instante (`ECONNREFUSED` → Node lo reporta como `fetch failed`) para los 3 modelos, y recién ahí cae al fallback de LM Studio local (que puede tardar minutos en responder según el modelo cargado). Acción: levantar OmniRoute (`start-omniroute.bat` en la raíz de SuitOrg, o `omniroute serve`) antes de usar modos que dependan de IA gratuita en la nube.

### Música no funciona
La música usa `../SuitMusic/scripts/music.py` vía Python. Si Python o las dependencias no están instaladas, el error se atrapa con WARN y se silencia. Nota: con B10 corregido, si la música SÍ se genera correctamente ahora debería llegar a mezclarse en el video final (antes nunca llegaba a ese paso).

### Log del server se satura con `[AUTO-SYNC]`
`logBuffer` guarda solo las últimas 200 líneas; logs de auto-sync cada ~5 min tapan el resultado final de un request de video si pasa suficiente tiempo. Para diagnósticos futuros, capturar `/api/logs` inmediatamente después de la prueba.

## Archivos afectados
- `SuitCampanas/script.js` — B1, B5, B13, B17
- `SuitCampanas/local-server-node.js` — B2, B3, B4, B6, B7, B9, B10, B11, B12, B14, B15, B16, overlay de contacto (nuevo), fix de diagnóstico stderr
- `SuitVidGenRemotion/scripts/helpers/ttsProvider.js` — B8

## Verificación
- `node --check` pasa en ambos archivos
- B4/B6/B7: validados con `ffmpeg.exe`/`ffprobe.exe` reales vía `spawnSync` desde PowerShell (mismo mecanismo que usa el server), no solo sintaxis JS. Ver detalle en cada bug.
- B10: test aislado que replica el shape exacto de scoping (viejo lanza `ReferenceError`, nuevo no).
- B11: test contra el endpoint GAS real del proyecto — confirma 302 sin seguir en el código viejo, JSON válido (17 empresas) con el fix.
- B14: `ffprobe` antes/después contra el servidor real (13.3s → 31.1s).
- B16: prueba real con logo/avatar/teléfono/sitio web reales de "Noe Thermomix" + frame extraído con `ffmpeg` para confirmar visualmente los 4 overlays (logo arriba-izq, avatar abajo-izq, contacto arriba-der, título abajo) sobre la imagen de la IA, no como slides aparte.
- OmniRoute: usuario confirmó haberlo levantado; pendiente que confirme en su próxima prueba que ya no cae a IA local para los modelos gratuitos.
- Pendiente: prueba manual end-to-end desde la UI real del navegador (todo lo verificado en esta sesión fue contra el servidor directo, replicando exactamente lo que hace el frontend, pero no desde el navegador mismo).
