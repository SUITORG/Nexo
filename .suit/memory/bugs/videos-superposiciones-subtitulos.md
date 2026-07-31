# Bug: Superposiciones (logo/títulos) y subtítulos no funcionan en VIDE

## Status
Fixed (2026-07-28)

## Symptoms
- Logo no se superponía en imágenes cuando se subía por archivo (data URL)
- Subtítulos no aparecían o aparecían desincronizados
- Texto overlay en video muy pequeño

## Root Causes

### 1. Logo solo aceptaba HTTP URLs
`local-server-node.js:1275` — el chequeo `logo_url.startsWith('http')` ignoraba data: URLs (upload por archivo).

### 2. Subtítulos desincronizados
`local-server-node.js:1359` — el timestamp SRT incluía `pausa_inicial` como offset, pero el ensamblaje de video en FFmpeg no añade pausa antes de cada segmento. Esto causaba un desfase acumulativo.

### 3. Texto overlay pequeño
`local-server-node.js:1522` — fontsize=48 en drawtext era pequeño para Reel (1080x1920).

## Fix

### Fix 1: `local-server-node.js:1274-1287`
Se agregó soporte para data: URLs en el logo:
```javascript
if (logo_url.startsWith('data:')) {
    logoPath = path.join(imagesDir, 'logo.png');
    const b64 = logo_url.replace(/^data:image\/\w+;base64,/, '');
    fs.writeFileSync(logoPath, b64, 'base64');
}
```

### Fix 2: `local-server-node.js:1359`
Se eliminó `pausa_inicial` del cálculo de startSec en SRT para que coincida con el timeline real del video:
```javascript
const startSec = currentTime;  // antes: currentTime + s.pausa_inicial
```
Además se truncó texto de subtítulos a 80 caracteres.

### Fix 3: `local-server-node.js:1522`
Se mejoró drawtext: fontsize 48→64, posición y=h*0.85→y=h*0.80, box opacity 0.4→0.55, border 10→15.

### Fix 4: `script.js:2082`
Se cambió label "Texto / Comentario" → "Texto para overlay del video" en modo IMG.

## Affected Files
- `SuitCampanas/local-server-node.js` (3 cambios)
- `SuitCampanas/script.js` (1 cambio)

## Verification
- `node --check` pasa en ambos archivos
- Probar manualmente: subir logo por archivo, generar video VIDE con subtítulos activados
