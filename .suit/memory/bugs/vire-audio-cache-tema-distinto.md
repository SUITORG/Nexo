# Bug: ViRe reproducía audio de un guion completamente distinto

## Status
Corregido (2026-07-29)

## Módulo
`SuitVidGenRemotion` (motor ViRe/Remotion, puerto 3004) — invocado por `SuitCampanas/local-server-node.js` (`/api/video-produce`) cuando `SuitVidGenRemotion/scripts/render.js` existe.

## Síntoma
Usuario genera un video VIDE con un guion nuevo (ej. empresa "noe thermomix"), pero al reproducirlo el audio narrado no corresponde al texto del guion — es sobre un tema completamente distinto.

## Causa raíz
`SuitVidGenRemotion/scripts/helpers/ttsProvider.js` → `generateVoice()`:
```javascript
const fileName = `voice_${index}.mp3`; // solo índice de escena
const destPath = outputDir ? path.join(outputDir, fileName) : null;
if (destPath && fs.existsSync(destPath)) {
    return { file: relPath, durationMs: 0 }; // reusa el archivo SIN chequear el texto
}
```
`outputDir` (`AUDIO_DIR`) es una carpeta **fija y compartida** (`SuitVidGenRemotion/public/generated/audio/`) para todos los renders, de cualquier empresa/guion, indefinidamente. El nombre de archivo depende solo del **índice de escena** (0,1,2...), no del contenido.

Se encontraron `voice_0.mp3`...`voice_3.mp3` y `test_google.mp3` en esa carpeta con fecha **8 de julio de 2026** (~3 semanas antes del reporte). Desde esa primera generación, cada render posterior para las escenas 0-3 reutilizaba ese audio viejo sin importar el guion nuevo — el cache-hit por índice ignoraba que el texto había cambiado.

Confirmado con log del server (`/api/logs`): a las 21:19:10 se ve `"[VIDE] Generando voz..."` seguido de `"[VIDE] 🎬 Intentando render con ViRe (Remotion)..."`, y los archivos de audio reutilizados datan de tres semanas antes.

## Fix
En `generateVoice()`, la clave de caché ahora incluye un hash del contenido:
```javascript
const contentHash = crypto.createHash('md5').update(`${text}|${lang}|${speed}`).digest('hex').slice(0, 10);
const fileName = `voice_${index}_${contentHash}.mp3`;
```
- Texto distinto → hash distinto → archivo distinto → se regenera correctamente.
- Texto idéntico (mismo guion re-renderizado) → mismo hash → sigue aprovechando la caché (no llama a Google Translate TTS de más).

Se eliminaron los archivos huérfanos `voice_0.mp3`...`voice_3.mp3` y `test_google.mp3` (ya no se referencian con el nuevo esquema de nombres).

## Archivos afectados
- `SuitVidGenRemotion/scripts/helpers/ttsProvider.js`

## Notas / posibles seguimientos (no aplicados)
- `imageProvider.js` no se revisó — si usa el mismo patrón de caché por índice sin hash de contenido, podría tener el mismo bug para las imágenes generadas. Queda pendiente de auditar si se reporta otro síntoma similar (imagen de escena de un tema distinto).
- El log del server (`logBuffer`, últimos 200 registros en memoria) se llena rápido con logs de `[AUTO-SYNC]` cada ~5 min, lo que puede tapar el resultado final de un request de video-produce si pasa suficiente tiempo. Para diagnósticos futuros, capturar `/api/logs` inmediatamente después de la prueba.
- `ffmpeg()` en `SuitCampanas/local-server-node.js` trunca el stderr a los primeros 500 caracteres del error — como el stderr de FFmpeg siempre arranca con ~15-20 líneas de banner de versión/configuración, el mensaje de error real casi nunca llega a mostrarse. Convendría capturar las últimas líneas (tail) en vez de las primeras.
