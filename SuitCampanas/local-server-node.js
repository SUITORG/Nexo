const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const supabase = require('./lib/supabase');
const { createClient } = require('@supabase/supabase-js');
const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
    : supabase;
const bdpvGenerator = require('../PresentacionesVid/bdpv-generator');
const lpGenerator = require('./lp-generator');
const { MODELS, DEFAULT_MODEL, toOmniRouteId } = require('./models-config');
const { composePoster } = require('../SuitComfy/quote-flow-poster');

const PORT = 8000;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_DIRECT_KEY = process.env.OPENROUTER_DIRECT_KEY;
const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
const FREESOUND_API_KEY = process.env.FREESOUND_API_KEY;

// Respaldo cuando Pollinations devuelve algo inválido (rate limit, etc.) — foto de
// stock real en vez de solo un fondo sólido. query = descripción visual de la
// escena, se recorta a pocas palabras porque Pexels busca mejor así que con una
// oración larga tipo prompt de IA.
async function buscarImagenPexels(query, width, height) {
    if (!PEXELS_API_KEY) return null;
    try {
        const simpleQuery = query.split(',')[0].trim().split(/\s+/).slice(0, 6).join(' ');
        const orientation = height >= width ? 'portrait' : 'landscape';
        const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(simpleQuery)}&orientation=${orientation}&per_page=1`;
        const res = await fetch(url, { headers: { Authorization: PEXELS_API_KEY } });
        if (!res.ok) return null;
        const data = await res.json();
        return data.photos?.[0]?.src?.large2x || data.photos?.[0]?.src?.large || null;
    } catch (e) {
        serverLog('WARN', `[Pexels] Búsqueda falló: ${e.message}`);
        return null;
    }
}

// Mismo criterio que Pexels — fuente de stock alternativa, mismo API key
// requerido en .env (UNSPLASH_ACCESS_KEY, gratis en unsplash.com/developers).
async function buscarImagenUnsplash(query, width, height) {
    if (!UNSPLASH_ACCESS_KEY) return null;
    try {
        const simpleQuery = query.split(',')[0].trim().split(/\s+/).slice(0, 6).join(' ');
        const orientation = height >= width ? 'portrait' : (width > height ? 'landscape' : 'squarish');
        const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(simpleQuery)}&orientation=${orientation}&per_page=1`;
        const res = await fetch(url, { headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` } });
        if (!res.ok) return null;
        const data = await res.json();
        return data.results?.[0]?.urls?.regular || null;
    } catch (e) {
        serverLog('WARN', `[Unsplash] Búsqueda falló: ${e.message}`);
        return null;
    }
}

// Wikimedia Commons: API pública, sin key. A diferencia de Pexels/Unsplash el
// licenciamiento varía por archivo (CC0, CC-BY, CC-BY-SA...) — casi siempre
// exige atribución, que este pipeline no agrega automáticamente. "filetype:bitmap"
// filtra SVG/PDF (diagramas, íconos) para quedarse con fotos reales; gsrnamespace=6
// limita la búsqueda al namespace de archivos, no artículos.
async function buscarImagenWikimedia(query, width, height) {
    try {
        const simpleQuery = query.split(',')[0].trim().split(/\s+/).slice(0, 6).join(' ');
        const targetWidth = Math.max(width, height, 1080);
        const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(simpleQuery + ' filetype:bitmap')}&gsrnamespace=6&gsrlimit=5&prop=imageinfo&iiprop=url|mime&iiurlwidth=${targetWidth}&format=json&origin=*`;
        const res = await fetch(url);
        if (!res.ok) return null;
        const data = await res.json();
        const pages = Object.values(data.query?.pages || {});
        const foto = pages.find(p => p.imageinfo?.[0]?.mime?.startsWith('image/') && !p.imageinfo[0].mime.includes('svg'));
        return foto?.imageinfo?.[0]?.thumburl || foto?.imageinfo?.[0]?.url || null;
    } catch (e) {
        serverLog('WARN', `[Wikimedia] Búsqueda falló: ${e.message}`);
        return null;
    }
}

// BASE para el futuro sistema de íconos vectoriales (hoy scene.icono es un
// emoji elegido por la IA, ver AnimatedIcon.tsx en SuitVidGenRemotion) — NO
// está cableado todavía a ningún flujo real, es solo la función de búsqueda,
// lista para cuando se arme la pieza concreta (IA propone palabra clave en vez
// de emoji → esta función busca y devuelve el SVG → AnimatedIcon lo dibuja en
// vez del emoji, recoloreado a brand_colors real).
//
// Iconify (api.iconify.design): API pública, sin key, 150k+ íconos de 238 sets.
// A diferencia de Wikimedia, SÍ se puede filtrar por licencia con confianza:
// restringido a ICONIFY_SAFE_SETS, una lista de sets grandes y conocidos
// verificados en vivo contra /collections con licencia permisiva sin
// atribución obligatoria (MIT/Apache-2.0/ISC) — Font Awesome Free, por
// ejemplo, quedó afuera a propósito por ser CC-BY (exige crédito visible,
// inviable en un video de cliente). El parámetro ?color= del propio API
// recolorea el SVG de verdad (fill real, verificado en vivo) — la razón de
// ser de este sistema: el emoji actual nunca se puede recolorear a la marca.
const ICONIFY_SAFE_SETS = ['mdi', 'tabler', 'heroicons', 'ph', 'lucide', 'carbon', 'ic', 'fluent', 'ion', 'bi'];
async function buscarIconoIconify(query, colorHex) {
    try {
        // UNA sola palabra — la búsqueda de Iconify es lógica Y entre términos
        // (igual que Freesound, ver traducirSfxQuery()): con 2+ palabras casi
        // nunca hay match porque exige que TODAS aparezcan en el nombre del
        // ícono. Verificado en vivo: "leaf plant" -> 0 resultados, "leaf" solo
        // -> 32. Cuando se cablee esto a la IA, el prompt debe pedir UNA
        // palabra en inglés, no una frase.
        const simpleQuery = query.trim().split(/\s+/)[0];
        const searchUrl = `https://api.iconify.design/search?query=${encodeURIComponent(simpleQuery)}&prefixes=${ICONIFY_SAFE_SETS.join(',')}&limit=1`;
        const searchRes = await fetch(searchUrl);
        if (!searchRes.ok) return null;
        const searchData = await searchRes.json();
        const iconId = searchData.icons?.[0]; // formato "prefix:nombre"
        if (!iconId) return null;
        const [prefix, name] = iconId.split(':');
        // Sin ?width=: el API devuelve width/height="1em" por default (verificado
        // en vivo) — encaja directo con el font-size ya usado para sizear el
        // emoji en AnimatedIcon.tsx, sin tener que forzar un tamaño fijo aquí.
        const colorParam = colorHex ? `?color=${encodeURIComponent(colorHex)}` : '';
        const svgRes = await fetch(`https://api.iconify.design/${prefix}/${name}.svg${colorParam}`);
        if (!svgRes.ok) return null;
        return await svgRes.text(); // markup SVG real, listo para incrustar
    } catch (e) {
        serverLog('WARN', `[Iconify] Búsqueda falló: ${e.message}`);
        return null;
    }
}

// Imagen local real (sin cuenta, sin costo) vía SuitComfy (../SuitComfy —
// wrapper propio, puerto 3012, que a su vez le habla a ComfyUI/Comfy-Desktop
// en :8188). Selector manual ("🖥️ ComfyUI (local)" en Imágenes) — nunca se
// intenta como fallback automático de Pollinations, hay que elegirlo a
// propósito. CPU-only en esta máquina: medido en vivo ~4 min para 768×1024
// (ver ADR-031) — el timeout de 150s original (basado en el estimado "~1-2
// min" de SuitComfy/README.md) abortaba generaciones reales antes de tiempo.
const COMFY_WRAPPER_URL = process.env.COMFY_WRAPPER_URL || 'http://127.0.0.1:3012';
async function generarImagenComfy(prompt, width, height) {
    try {
        const res = await fetch(`${COMFY_WRAPPER_URL}/api/image`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, width, height }),
            signal: AbortSignal.timeout(360000)
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const imgPath = data.images?.[0]?.path;
        if (!imgPath || !fs.existsSync(imgPath)) throw new Error('SuitComfy no devolvió una imagen válida');
        return imgPath;
    } catch (e) {
        serverLog('WARN', `[Comfy] No se pudo generar imagen (¿está corriendo SuitComfy en :3012 y ComfyUI en :8188?): ${e.message}`);
        return null;
    }
}

// Catálogo cerrado de categorías del póster "Comfy" (mismo criterio que
// BRIEF_FONT_TONES: catálogo fijo, no texto libre, porque cada categoría trae
// 4 piezas que tienen que combinar entre sí — escenario para ComfyUI, color
// de acento, palabra del letrero, íconos/etiquetas/píldoras e insignia. Banco
// de escenarios/íconos tomado del formato "Quote-Flow" (ver ADR-031/032).
const POSTER_CATEGORIES = {
    conocimiento: {
        accent: '#00d4ff',
        escenario: 'a person seen from behind walking up a staircase made of giant stacked books inside a dark old library, single dramatic beam of golden light, dust particles floating in the light, tall bookshelves fading into darkness',
        destino: 'SABIDURÍA',
        badge: 'MENTALIDAD DE CONOCIMIENTO',
        icons: [
            { icon: 'book', label: 'LEE', pill: 'HOY' },
            { icon: 'brain', label: 'APRENDE', pill: 'CADA DÍA' },
            { icon: 'lightbulb', label: 'ENTIENDE', pill: 'UN MES' },
            { icon: 'key', label: 'DOMINA', pill: 'SIEMPRE' },
        ],
    },
    disciplina: {
        accent: '#ffd400',
        escenario: 'a person seen from behind walking a rocky path under light rain at dawn, strong backlight silhouette, dramatic shadows',
        destino: 'CIMA',
        badge: 'FRASES DE DISCIPLINA',
        icons: [
            { icon: 'dumbbell', label: 'ENTRENA', pill: 'HOY' },
            { icon: 'calendar', label: 'CONSTANCIA', pill: 'CADA DÍA' },
            { icon: 'chart', label: 'AVANCE', pill: 'UN MES' },
            { icon: 'trophy', label: 'VICTORIA', pill: 'SIEMPRE' },
        ],
    },
    esfuerzo: {
        accent: '#ffb020',
        escenario: 'a person seen from behind hiking through a rocky canyon at dawn, dramatic golden rim light, dust particles, dramatic shadows',
        destino: 'META',
        badge: 'FRASES DE ESFUERZO',
        icons: [
            { icon: 'dumbbell', label: 'RESISTE', pill: 'HOY' },
            { icon: 'calendar', label: 'INSISTE', pill: 'CADA DÍA' },
            { icon: 'chart', label: 'AVANZA', pill: 'UN MES' },
            { icon: 'trophy', label: 'LOGRA', pill: 'SIEMPRE' },
        ],
    },
    dinero: {
        accent: '#ffc107',
        escenario: 'a person seen from behind climbing steps made of stacked gold coins toward a glowing vault door at dawn, warm golden light, dust particles',
        destino: 'LIBERTAD',
        badge: 'MENTALIDAD DE DINERO',
        icons: [
            { icon: 'scale', label: 'AHORRA', pill: 'HOY' },
            { icon: 'calendar', label: 'INVIERTE', pill: 'CADA MES' },
            { icon: 'chart', label: 'CRECE', pill: 'UN AÑO' },
            { icon: 'key', label: 'LIBERTAD', pill: 'SIEMPRE' },
        ],
    },
    calma: {
        accent: '#2dd4bf',
        escenario: 'a person sitting alone at the edge of a wooden dock over a calm misty lake at dawn, soft diffused light, serene atmosphere',
        destino: 'CALMA',
        badge: 'MENTALIDAD DE CALMA',
        icons: [
            { icon: 'heart', label: 'RESPIRA', pill: 'HOY' },
            { icon: 'calendar', label: 'PAUSA', pill: 'CADA DÍA' },
            { icon: 'scale', label: 'EQUILIBRIO', pill: 'UN MES' },
            { icon: 'check', label: 'PAZ', pill: 'SIEMPRE' },
        ],
    },
    proposito: {
        accent: '#8b5cf6',
        escenario: 'a person seen from behind standing at the edge of a mountain peak above the clouds at sunrise, vast open sky, warm rim light',
        destino: 'PROPÓSITO',
        badge: 'MENTALIDAD DE PROPÓSITO',
        icons: [
            { icon: 'walk', label: 'CAMINA', pill: 'HOY' },
            { icon: 'book', label: 'REFLEXIONA', pill: 'CADA DÍA' },
            { icon: 'key', label: 'DESBLOQUEA', pill: 'UN MES' },
            { icon: 'trophy', label: 'LOGRA', pill: 'SIEMPRE' },
        ],
    },
    creatividad: {
        accent: '#ec4899',
        escenario: 'a person seen from behind in a sunlit art studio, floating splashes of colorful paint frozen in the air, creative dramatic light beam',
        destino: 'VISIÓN',
        badge: 'MENTALIDAD CREATIVA',
        icons: [
            { icon: 'lightbulb', label: 'IMAGINA', pill: 'HOY' },
            { icon: 'brain', label: 'CREA', pill: 'CADA DÍA' },
            { icon: 'chart', label: 'EVOLUCIONA', pill: 'UN MES' },
            { icon: 'trophy', label: 'BRILLA', pill: 'SIEMPRE' },
        ],
    },
};

// Reparto determinístico de la frase en renglones (sin IA, nunca revienta):
// las últimas 1-2 palabras son la palabra clave (línea de acento) — funciona
// bien porque la mayoría de frases motivacionales cierran con el concepto
// fuerte ("...ES EL CONOCIMIENTO", "...DOMINA MAÑANA"); el resto se reparte en
// hasta 2 líneas parejas por cantidad de palabras.
function splitFraseEnLineas(frase) {
    const words = frase.trim().toUpperCase().split(/\s+/).filter(Boolean);
    if (words.length <= 1) return [{ text: words[0] || '', accent: true }];
    const keywordCount = words.length >= 5 ? 2 : 1;
    const normalWords = words.slice(0, -keywordCount);
    const keywordWords = words.slice(-keywordCount);
    const lines = [];
    if (normalWords.length > 2) {
        const mid = Math.ceil(normalWords.length / 2);
        lines.push({ text: normalWords.slice(0, mid).join(' '), accent: false });
        lines.push({ text: normalWords.slice(mid).join(' '), accent: false });
    } else if (normalWords.length) {
        lines.push({ text: normalWords.join(' '), accent: false });
    }
    lines.push({ text: keywordWords.join(' '), accent: true });
    return lines;
}

// Sonido ambiental real (cuencos, olas, campanas...) para las marcas [EFECTO: ...]
// de un guion narrativo — sfx.py solo sabe sintetizar 4 tonos fijos (whoosh/
// glitch/pop/bassdrop), no interpreta descripciones libres. Filtrado a CC0
// (Creative Commons 0): uso libre, sin atribución, seguro para video de cliente.
//
// Freesound busca en modo Y-lógico (TODAS las palabras deben aparecer en el
// sonido) y está en inglés — verificado en vivo: una consulta española da 0
// resultados siempre, y hasta traducida palabra por palabra con 5-6 términos
// (sustantivos + adjetivos tipo "resonance"/"soft"/"long") también da 0 — el
// AND exige que un sonido tenga TODAS esas etiquetas a la vez, algo que casi
// ningún archivo cumple. Solución verificada: quedarse solo con 1-2 sustantivos
// del objeto que suena ("tibetan bowl", "crystal bowl"), descartando adjetivos/
// duración — igual a mi primera prueba manual ("tibetan bowl" → 165 resultados).
const SFX_NOUNS_ES_EN = {
    'cuenco tibetano': 'tibetan bowl', 'cuencos tibetanos': 'tibetan bowl',
    'cuenco de cristal': 'crystal bowl', 'cuencos de cristal': 'crystal bowl',
    cuenco: 'bowl', cuencos: 'bowl', campana: 'bell', campanas: 'bell', gong: 'gong',
    ola: 'wave', olas: 'waves', mar: 'sea', océano: 'ocean', oceano: 'ocean',
    viento: 'wind', lluvia: 'rain', trueno: 'thunder', fuego: 'fire',
    pájaro: 'bird', pajaro: 'bird', pájaros: 'birds', pajaros: 'birds',
    agua: 'water', río: 'river', rio: 'river', arroyo: 'stream', bosque: 'forest'
};
function traducirSfxQuery(text) {
    let out = text.toLowerCase();
    const hits = [];
    for (const [es, en] of Object.entries(SFX_NOUNS_ES_EN)) {
        if (hits.length >= 2) break;
        const re = new RegExp(`\\b${es}\\b`, 'i');
        if (re.test(out)) {
            hits.push(en);
            out = out.replace(new RegExp(`\\b${es}\\b`, 'gi'), '');
        }
    }
    return hits.length ? hits.join(' ') : null;
}

async function buscarSonidoFreesound(query) {
    if (!FREESOUND_API_KEY) return null;
    try {
        const simpleQuery = traducirSfxQuery(query.split(/[,.;]/)[0].trim());
        if (!simpleQuery) {
            serverLog('WARN', `[Freesound] "${query}" no matchea vocabulario conocido, se omite búsqueda`);
            return null;
        }
        const filter = encodeURIComponent('license:"Creative Commons 0" duration:[0.5 TO 30]');
        const url = `https://freesound.org/apiv2/search/text/?query=${encodeURIComponent(simpleQuery)}&filter=${filter}&sort=rating_desc&fields=id,name,previews&page_size=1&token=${FREESOUND_API_KEY}`;
        const res = await fetch(url);
        if (!res.ok) return null;
        const data = await res.json();
        const sound = data.results?.[0];
        return sound?.previews?.['preview-hq-mp3'] || sound?.previews?.['preview-lq-mp3'] || null;
    } catch (e) {
        serverLog('WARN', `[Freesound] Búsqueda falló: ${e.message}`);
        return null;
    }
}

// Genera (o reusa) la imagen de UNA escena y le aplica overlay de logo/avatar si
// hay — extraído del loop de /api/video-produce para que también lo use el
// endpoint /api/scene-image (modo "revisar por escena"), sin duplicar la lógica.
// Escribe el PNG final en imgPath; no retorna nada (mismo estilo que el loop
// original, que ya trabajaba directo sobre archivos en vez de buffers en memoria).
async function generateSceneImagePNG({ visualDesc, estilo_visual_keywords, image_source, imgDim, imgPath, logoPath, avatarPath, existingImageUrl }) {
    let finalBuf = null;

    if (existingImageUrl) {
        // Imagen ya aprobada en el modo "revisar por escena" — se reusa tal cual,
        // sin volver a llamar a Pollinations/Pexels (mismo criterio que ya usa ViRe
        // en imageProvider.js con scene.image_url).
        if (existingImageUrl.startsWith('data:')) {
            finalBuf = Buffer.from(existingImageUrl.replace(/^data:image\/\w+;base64,/, ''), 'base64');
        } else {
            try {
                const res = await fetch(existingImageUrl);
                if (res.ok) finalBuf = Buffer.from(await res.arrayBuffer());
            } catch (e) {
                serverLog('WARN', `[VIDE] No se pudo reusar imagen aprobada: ${e.message}`);
            }
        }
    }

    if (!finalBuf) {
        const estiloPrefix = estilo_visual_keywords ? `${estilo_visual_keywords}, ` : '';
        // Ancla de calidad fija, igual que hace ViRe (SuitVidGenRemotion/scripts/
        // helpers/imageProvider.js) — sin esto, la nitidez dependía de si el estilo
        // elegido traía o no términos técnicos de foto (Realista sí, Acuarela no).
        const qualityAnchor = 'sharp focus, highly detailed, professional photography, ';
        const prompt = qualityAnchor + estiloPrefix + visualDesc.substring(0, 200) + ', no text, no readable signage, no logos, no writing';
        serverLog('INFO', `[VIDE] Prompt de imagen: ${prompt}`);
        const seed = Math.floor(Math.random() * 1000000);
        const imgUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${imgDim.w}&height=${imgDim.h}&seed=${seed}&nologo=true&model=flux`;

        if (image_source === 'pexels') {
            // Selector manual: ni se intenta Pollinations, va directo a la foto de
            // stock (misma foto de respaldo que el fallback automático).
            const pexelsUrl = await buscarImagenPexels(visualDesc, imgDim.w, imgDim.h);
            if (pexelsUrl) finalBuf = Buffer.from(await (await fetch(pexelsUrl)).arrayBuffer());
        } else if (image_source === 'unsplash') {
            const unsplashUrl = await buscarImagenUnsplash(visualDesc, imgDim.w, imgDim.h);
            if (unsplashUrl) finalBuf = Buffer.from(await (await fetch(unsplashUrl)).arrayBuffer());
        } else if (image_source === 'wikimedia') {
            const wikimediaUrl = await buscarImagenWikimedia(visualDesc, imgDim.w, imgDim.h);
            if (wikimediaUrl) finalBuf = Buffer.from(await (await fetch(wikimediaUrl)).arrayBuffer());
        } else if (image_source === 'comfy') {
            const comfyPath = await generarImagenComfy(prompt, imgDim.w, imgDim.h);
            if (comfyPath) {
                finalBuf = fs.readFileSync(comfyPath);
            } else {
                const pexelsUrl = await buscarImagenPexels(visualDesc, imgDim.w, imgDim.h);
                if (pexelsUrl) finalBuf = Buffer.from(await (await fetch(pexelsUrl)).arrayBuffer());
            }
        } else {
            const imgRes = await fetch(imgUrl);
            const imgBuf = Buffer.from(await imgRes.arrayBuffer());
            // Pollinations a veces responde 200 con un JSON de error (ej. rate
            // limit) en vez de una imagen real — sin validar, ese JSON se
            // escribía tal cual como si fuera el PNG. Río abajo eso tronaba
            // FFmpeg dos veces: en el overlay de esa escena ("Invalid PNG
            // signature") y, peor, en el ensamblado final del video completo
            // (el error verboso de decodificar basura repetido por escena
            // parece ser lo que desbordaba el pipe de spawnSync -> ENOBUFS).
            const isValidImage = imgRes.ok && imgBuf.length > 100 &&
                ((imgBuf[0] === 0x89 && imgBuf[1] === 0x50) || (imgBuf[0] === 0xFF && imgBuf[1] === 0xD8));
            if (isValidImage) {
                finalBuf = imgBuf;
            } else {
                const pexelsUrl = await buscarImagenPexels(visualDesc, imgDim.w, imgDim.h);
                if (pexelsUrl) {
                    serverLog('WARN', `[VIDE] Imagen inválida (Pollinations HTTP ${imgRes.status}), usando foto de stock de Pexels`);
                    finalBuf = Buffer.from(await (await fetch(pexelsUrl)).arrayBuffer());
                } else {
                    serverLog('WARN', `[VIDE] Imagen inválida (Pollinations HTTP ${imgRes.status}) y sin resultado de Pexels, usando fondo sólido de respaldo`);
                }
            }
        }
    }

    if (finalBuf) {
        fs.writeFileSync(imgPath, finalBuf);
    } else {
        ffmpeg(['-y', '-f', 'lavfi', '-i', `color=c=0x1e293b:s=${imgDim.w}x${imgDim.h}`, '-frames:v', '1', imgPath]);
    }

    // Overlay logo (top-left) and avatar (bottom-left circle), igual sin importar
    // de dónde salió la imagen de base.
    let hasOverlays = false;
    let overlayInputs = [];
    let overlayFilters = [];
    let overlayCount = 1;
    let lastOverlayLabel = '0:v';

    if (logoPath && fs.existsSync(logoPath)) {
        overlayInputs.push('-i', logoPath);
        overlayFilters.push(`[${overlayCount}:v]scale=120:120:force_original_aspect_ratio=decrease,pad=120:120:(ow-iw)/2:(oh-ih)/2:color=black@0[logo_scaled]`);
        overlayFilters.push(`[${lastOverlayLabel}]drawbox=x=10:y=10:w=140:h=140:color=white@0.85:t=fill[logo_chip]`);
        overlayFilters.push(`[logo_chip][logo_scaled]overlay=20:20[with_logo]`);
        lastOverlayLabel = 'with_logo';
        overlayCount++;
        hasOverlays = true;
    }

    if (avatarPath && fs.existsSync(avatarPath)) {
        overlayInputs.push('-i', avatarPath);
        overlayFilters.push(`[${overlayCount}:v]scale=120:120,format=rgba,geq=r='r(X,Y)':a='if(lte(sqrt((X-60)^2+(Y-60)^2),60),255,0)'[avatar_circle]`);
        overlayFilters.push(`[${lastOverlayLabel}][avatar_circle]overlay=20:H-h-20[with_avatar]`);
        lastOverlayLabel = 'with_avatar';
        overlayCount++;
        hasOverlays = true;
    }

    if (hasOverlays) {
        const overlayImgPath = imgPath.replace(/\.png$/, '_ov.png');
        try {
            // -map target must match whichever overlay ran LAST (logo-only ends at
            // [with_logo]; hardcoding [with_avatar] failed FFmpeg every time a scene
            // had no avatar configured, which is the common case).
            const filterStr = overlayFilters.join(';');
            const ffmpegArgs = ['-y', '-i', imgPath, ...overlayInputs, '-filter_complex', filterStr, '-map', `[${lastOverlayLabel}]`, overlayImgPath];
            ffmpeg(ffmpegArgs);
            fs.unlinkSync(imgPath);
            fs.renameSync(overlayImgPath, imgPath);
        } catch (overlayErr) {
            serverLog('WARN', `[VIDE] Error overlay: ${overlayErr.message}`);
        }
    }
}

const GAS_URL = 'https://script.google.com/macros/s/AKfycbzlNe28j7yJObxqfCyUg595Zeg1IjsMMjOZyf8KOK5pkCYU-zYFJrsyzwsJhNFjZy1v-A/exec';

// OmniRoute (gateway local de modelos IA, puerto 20128). En WSL2 no se alcanza vía
// localhost (la IP del host Windows es la del gateway NAT), así que se resuelve al arranque.
const OMNIROUTE_BASE = (() => {
    try {
        if (process.env.OMNIROUTE_URL) return process.env.OMNIROUTE_URL;
        const osr = fs.readFileSync('/proc/sys/kernel/osrelease', 'utf8').toLowerCase();
        if (osr.includes('microsoft')) {
            const { execSync } = require('child_process');
            const gw = execSync("ip route show default | awk '{print $3}'", { encoding: 'utf8', timeout: 3000 }).trim();
            if (gw) return `http://${gw}:20128`;
        }
    } catch (e) { /* no WSL o sin iproute2 → localhost */ }
    return 'http://localhost:20128';
})();

// --- FFMPEG PATH (auto-detect or from .env) ---
function findFFmpeg() {
    const envPath = process.env.FFMPEG_PATH;
    if (envPath && fs.existsSync(envPath)) return envPath;
    try {
        const { execSync } = require('child_process');
        return execSync('where ffmpeg', { encoding: 'utf8', timeout: 3000 }).trim().split('\n')[0];
    } catch (e) {
        // Common Windows paths
        const candidates = [
            'C:\\Users\\rojo-\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-8.1.1-full_build\\bin\\ffmpeg.exe',
            'C:\\ffmpeg\\bin\\ffmpeg.exe',
            'C:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe'
        ];
        for (const c of candidates) {
            if (fs.existsSync(c)) return c;
        }
        return 'ffmpeg'; // fallback to PATH
    }
}
const FFMPEG_PATH = findFFmpeg();
console.log(`[FFmpeg] Ruta: ${FFMPEG_PATH}`);
// ffprobe lives next to ffmpeg in the same bin/ folder on every install layout
// this project has seen (WinGet, manual, PATH) — derive it instead of a
// second auto-detect routine.
const FFPROBE_PATH = FFMPEG_PATH === 'ffmpeg' ? 'ffprobe' : FFMPEG_PATH.replace(/ffmpeg(\.exe)?$/i, 'ffprobe$1');

const { spawnSync, spawn } = require('child_process');
const crypto = require('crypto');

function getAudioDurationSec(filePath) {
    try {
        const result = spawnSync(FFPROBE_PATH, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', filePath], { timeout: 15000 });
        const val = parseFloat(result.stdout?.toString().trim());
        return isNaN(val) ? null : val;
    } catch (e) {
        return null;
    }
}

// Silencio real (no frame negro) para escenas de pausa y para los huecos entre
// escenas — deja que la imagen/zoom siga en pantalla mientras el audio calla.
function makeSilenceClip(outPath, seconds) {
    ffmpeg(['-y', '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=stereo', '-t', String(Math.max(0.1, seconds)), outPath]);
}

function ffmpeg(args, opts = {}) {
    const result = spawnSync(FFMPEG_PATH, args, {
        timeout: opts.timeout || 60000,
        stdio: opts.stdio || 'pipe',
        maxBuffer: 50 * 1024 * 1024
    });
    if (result.error) throw result.error;
    if (result.status !== 0) {
        const stderr = result.stderr?.toString() || '';
        // FFmpeg's stderr always starts with a ~15-20 line version/build banner;
        // the actual error is at the END. Truncating from the start (old behavior)
        // hid every real error message behind the banner. Take the tail instead.
        const tail = stderr.split('\n').slice(-15).join('\n').trim();
        throw new Error(`FFmpeg error (${result.status}): ${tail.substring(0, 1000)}`);
    }
    return result;
}

// Escapes a filesystem path for safe use as an FFmpeg filtergraph option value
// (drawtext=textfile=..., subtitles=filename=...). On Windows, an unescaped
// drive-letter colon (C:\...) is parsed as a filter key/value separator and
// breaks (or crashes) the filter — see .suit/memory/bugs/videos-multiples-fallas.md.
function escapeFfmpegPath(p) {
    return p.replace(/\\/g, '/').replace(/:/g, '\\:');
}

// Default font for drawtext: without an explicit fontfile, this FFmpeg build's
// fontconfig lookup segfaults (access violation) on this Windows host instead
// of erroring gracefully. FFMPEG_FONT_PATH in .env overrides the detected font.
let _defaultFontFile;
function getDefaultFontFile() {
    if (_defaultFontFile !== undefined) return _defaultFontFile;
    const candidates = [
        process.env.FFMPEG_FONT_PATH,
        'C:/Windows/Fonts/arial.ttf',
        '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
        '/System/Library/Fonts/Supplemental/Arial.ttf',
    ].filter(Boolean);
    _defaultFontFile = candidates.find(c => fs.existsSync(c)) || null;
    return _defaultFontFile;
}

// Tipografía "bonita/exagerada" por estilo visual para los subtítulos/overlay
// de VIDE (drawtext de FFmpeg) — antes SIEMPRE usaba Arial plano sin importar
// el estilo elegido, porque VIDE no renderiza con React/Remotion como ViRe
// (que sí carga Google Fonts reales por template). Como FFmpeg necesita un
// archivo .ttf/.otf real en disco (no puede bajar fuentes web), se usan
// fuentes bold ya instaladas en Windows — mismo look "exagerado" sin
// descargar nada, mapeadas a los templates reales (paper/pinterest_ad/
// ranking_tarjetas) que ya existen en ViRe. Estilos sin template propio (la
// mayoría del catálogo) siguen con el Arial de siempre — sin regresión.
const VISUAL_STYLE_FONTS = {
    paper: ['C:/Windows/Fonts/impact.ttf'],
    pinterest_ad: ['C:/Windows/Fonts/ariblk.ttf'],
    ranking_tarjetas: ['C:/Windows/Fonts/segoeuib.ttf', 'C:/Windows/Fonts/calibrib.ttf'],
};
// Catálogo de "tono tipográfico" elegible desde el Brief real del cliente
// (clave "tipografia" dentro del vector de logo_url, ej. "|tipografia:moderna",
// parseada como cualquier otra clave genérica de parseBrief()) — nombres
// cerrados, no texto libre: FFmpeg necesita un .ttf real en disco, no
// puede resolver "la fuente que la marca use" a ciegas. Solo aplica cuando
// el estilo visual NO trae ya su propio font fijo arriba (esos son look
// deliberado y probado por template, no se pisan por el Brief).
const BRIEF_FONT_TONES = {
    moderna: 'C:/Windows/Fonts/segoeuib.ttf',    // limpia, tech, neutra
    audaz: 'C:/Windows/Fonts/impact.ttf',        // urgencia, alto impacto
    elegante: 'C:/Windows/Fonts/georgiab.ttf',   // editorial, premium, serif
    amigable: 'C:/Windows/Fonts/gothicb.ttf',    // geométrica, cercana, redondeada
    corporativa: 'C:/Windows/Fonts/cambriab.ttf',// seria, institucional, confianza
};
const _fontForStyleCache = {};
function getFontForVisualStyle(visualStyle, tipografiaMarca) {
    if (visualStyle && VISUAL_STYLE_FONTS[visualStyle]) {
        const cacheKey = 'style:' + visualStyle;
        if (_fontForStyleCache[cacheKey] !== undefined) return _fontForStyleCache[cacheKey];
        const found = VISUAL_STYLE_FONTS[visualStyle].find(c => fs.existsSync(c)) || getDefaultFontFile();
        _fontForStyleCache[cacheKey] = found;
        return found;
    }
    const tono = (tipografiaMarca || '').toLowerCase().trim();
    if (tono && BRIEF_FONT_TONES[tono]) {
        const cacheKey = 'tono:' + tono;
        if (_fontForStyleCache[cacheKey] !== undefined) return _fontForStyleCache[cacheKey];
        const found = fs.existsSync(BRIEF_FONT_TONES[tono]) ? BRIEF_FONT_TONES[tono] : getDefaultFontFile();
        _fontForStyleCache[cacheKey] = found;
        return found;
    }
    return getDefaultFontFile();
}

// Catálogo de transiciones reales entre escenas de VIDE — todas built-in del
// filtro `xfade` de FFmpeg (ninguna requiere descargar nada de un sitio
// externo). Antes solo existía "fade"; se cicla por este catálogo para que
// un mismo video no se sienta repetitivo con solo un tipo de corte. Los 4
// primeros son las más seguras/neutras para ads verticales (nunca chocan con
// texto/overlays); los últimos 3 son más geométricos, para variedad extra.
// Verificado en vivo (7/7) contra este build de FFmpeg antes de cablearlas:
// sin error y con blend real confirmado en frame extraído a mitad de corte.
const XFADE_TRANSITIONS = ['fade', 'slideleft', 'wiperight', 'circleopen', 'smoothleft', 'dissolve', 'radial'];
// `override` = elección explícita del usuario (`videTransicionSelect` en la
// UI, campo `transicion` del POST): un nombre del catálogo fija ESA
// transición en todos los cortes del video; "none" pide corte directo (sin
// mezcla visible — se resuelve con una duración de xfade casi nula, ver
// abajo, en vez de duplicar la ruta de ensamblado vieja sin xfade);
// "auto"/vacío/desconocido cae al ciclo automático de siempre.
function transicionParaCorte(k, override) {
    if (override === 'none') return 'fade';
    if (override && XFADE_TRANSITIONS.includes(override)) return override;
    return XFADE_TRANSITIONS[(k - 1) % XFADE_TRANSITIONS.length];
}

// Greedy word-wrap to a max line width (chars), never splitting a word mid-way.
function wrapWords(text, maxCharsPerLine) {
    const words = text.split(/\s+/).filter(Boolean);
    const lines = [];
    let current = '';
    for (const word of words) {
        const candidate = current ? `${current} ${word}` : word;
        if (candidate.length > maxCharsPerLine && current) {
            lines.push(current);
            current = word;
        } else {
            current = candidate;
        }
    }
    if (current) lines.push(current);
    return lines;
}

// Fits text into a pixel-width box for drawtext: wraps by word, shrinks
// fontsize as a fallback if it still doesn't fit in maxLines, and truncates
// with an ellipsis as a last resort — drawtext itself has no auto-wrap or
// auto-fit, so without this a long AI-generated title/caption just renders
// past the edge of the frame instead of clipping gracefully.
function fitOverlayText(text, maxWidthPx, baseFontsize, minFontsize, maxLines) {
    let fontsize = baseFontsize;
    let lines = [];
    while (true) {
        const maxCharsPerLine = Math.max(4, Math.floor(maxWidthPx / (fontsize * 0.55)));
        lines = wrapWords(text, maxCharsPerLine);
        if (lines.length <= maxLines || fontsize <= minFontsize) break;
        fontsize -= 8;
    }
    if (lines.length > maxLines) {
        const maxCharsPerLine = Math.max(4, Math.floor(maxWidthPx / (fontsize * 0.55)));
        lines = lines.slice(0, maxLines);
        let last = lines[maxLines - 1].replace(/\s+$/, '');
        if (last.length > maxCharsPerLine - 1) last = last.slice(0, maxCharsPerLine - 1);
        lines[maxLines - 1] = last + '…';
    }
    return { text: lines.join('\n'), fontsize };
}

// Output dimensions per format — shared by image generation (so Pollinations
// renders the right aspect ratio up front) and the FFmpeg assembly step.
const FMT_DIMS = {
    Post: { w: 1080, h: 1080 },
    Reel: { w: 1080, h: 1920 },
    Story: { w: 1080, h: 1920 },
    Banner: { w: 1200, h: 628 }
};

// Real playback length of a scene list: sum of per-scene durations plus the
// inter-scene pause (pausa_final never applies after the last scene, matching
// how the FFmpeg assembly actually inserts pause segments below).
function computeRealDuration(scenes) {
    return scenes.reduce((acc, s, i) => acc + (s.duracion || 5) + (i < scenes.length - 1 ? (s.pausa_final || 0.5) : 0), 0);
}

// Guion narrativo tipo meditación/voz en off: párrafos sueltos con marcadores
// [PAUSA DE SILENCIO: N SEGUNDOS] / [MÚSICA:] / [EFECTO:], encabezados de sección
// "Nombre (N minutos)" y un bloque final "Prompts para Fotografía..." con una
// imagen por párrafo. Cada bloque hablado se vuelve una escena (duración real se
// calcula luego con el audio TTS ya generado); cada pausa se vuelve una escena de
// silencio que reusa la última imagen (is_silence:true, sin voz).
function parseGuionNarrativo(text) {
    const promptSplit = text.split(/\n\s*Prompts?\s+para\s+Fotograf[íi]a[^\n]*\n/i);
    const body = promptSplit[0];
    const imagePrompts = promptSplit[1]
        ? promptSplit[1].split(/\n\s*\n/).map(p => p.replace(/\s+/g, ' ').trim()).filter(p => p.length > 15)
        : [];

    const metaLine = /^(Tema seleccionad[oa]|Inspiraci[óo]n)\s*:/i;
    const hashtagLine = /^#\S+(\s+#\S+)*\s*$/;
    const headerLine = /^([^\n(]{2,60})\s*\(([\d.]+)\s*minutos?\)\s*$/i;
    const pausaLine = /\[?\s*PAUSA\s+DE\s+SILENCIO[^\]]*?(\d+(?:\.\d+)?)\s*SEGUND[^\]]*\]?/i;
    const musicaLine = /^\[\s*M[ÚU]SICA\s*:/i;
    const efectoLine = /^\[\s*EFECTO\s*:\s*([^\]]+)\]?\s*$/i;

    const blocks = body.split(/\n\s*\n/).map(b => b.trim()).filter(Boolean);
    const raw = [];
    let currentTitle = '';
    let lastVisual = '';
    let imgIdx = 0;
    // [EFECTO: ...] no es su propia escena — describe un sonido puntual que se
    // busca en Freesound (CC0) y se mezcla sobre la SIGUIENTE escena (voz o
    // silencio) que aparezca. Si no hay ninguna después (ej. el efecto de cierre
    // tras el último párrafo), se pega a la última escena ya armada.
    let pendingEfecto = null;

    for (const block of blocks) {
        if (metaLine.test(block) || hashtagLine.test(block) || musicaLine.test(block)) continue;

        const efectoMatch = block.match(efectoLine);
        if (efectoMatch) {
            pendingEfecto = efectoMatch[1].trim();
            continue;
        }

        const pausaMatch = block.length < 120 && block.match(pausaLine);
        if (pausaMatch) {
            raw.push({ title: currentTitle || 'Silencio', body: '', visual: lastVisual, is_silence: true, duracion: parseFloat(pausaMatch[1]), pausa_final: 0.3, animacion: 'ken_burns', sfx_query: pendingEfecto || undefined });
            pendingEfecto = null;
            continue;
        }

        const headerMatch = block.split('\n').length === 1 && block.match(headerLine);
        if (headerMatch) {
            currentTitle = headerMatch[1].trim();
            continue;
        }

        // Marcadores intercalados dentro de un párrafo hablado (no en su propio
        // bloque) se limpian para que el TTS no los lea en voz alta.
        const spoken = block.replace(/\[[^\]]*\]/g, ' ').replace(/\s+/g, ' ').trim();
        if (!spoken) continue;

        if (imagePrompts.length) {
            lastVisual = imagePrompts[imgIdx % imagePrompts.length];
            imgIdx++;
        }
        const wordCount = spoken.split(/\s+/).length;
        raw.push({ title: currentTitle || `Escena ${raw.length + 1}`, body: spoken, visual: lastVisual, duracion: Math.max(3, Math.round(wordCount / 2.2)), pausa_final: 0.4, animacion: 'ken_burns', sfx_query: pendingEfecto || undefined });
        pendingEfecto = null;
    }
    if (pendingEfecto && raw.length) {
        raw[raw.length - 1].sfx_query = pendingEfecto;
    }

    return raw.map((s, i) => ({
        id: i + 1,
        title: s.title,
        body: s.body,
        visual: s.visual || '',
        texto_overlay: '',
        duracion: s.duracion,
        pausa_inicial: 0.3,
        pausa_final: s.pausa_final,
        animacion: s.animacion,
        musica_local: null,
        camara: null,
        pattern_interrupt: '',
        sfx: null,
        sfx_query: s.sfx_query || undefined,
        image_url: undefined,
        is_silence: !!s.is_silence
    }));
}

// Parses a guion (JSON {config,escenas}, JSON array, or plain text) into a
// normalized scenes[] + videoConfig, shared by /api/video-produce (VIDE/FFmpeg)
// and /api/vire-produce (ViRe/Remotion) so both engines read the exact same guion.
function parseGuionScenes(guion, duration, style) {
    let scenes = [];
    let videoConfig = {
        duracion_total: parseInt(duration) || 30,
        musica: { estilo: style || 'energetic', bpm: 140, volumen: 0.8 },
        fps: 24,
        resolucion: { ancho: 1080, alto: 1920 }
    };
    try {
        const parsed = JSON.parse(guion);
        if (parsed.config) {
            videoConfig = { ...videoConfig, ...parsed.config };
        }
        // Aviso legal de "creado con IA" (campo top-level, no por-escena): texto
        // silencioso, nunca se lee en voz alta — solo se quema como letra pequeña
        // en la última escena (ver /api/video-produce). Separado de "cta"/"texto"
        // a propósito: si viviera dentro del texto hablado, el TTS lo leería.
        if (parsed.aviso_ia) videoConfig.aviso_ia = String(parsed.aviso_ia);
        if (Array.isArray(parsed)) {
            scenes = parsed.map((s, i) => ({
                id: i + 1,
                title: s.titulo || s.title || s.titulo_escena || `Escena ${i + 1}`,
                body: s.texto || s.text || s.body || s.descripcion || s.spoken || '',
                visual: s.visual || s.shot || '',
                texto_overlay: s.texto_overlay || s.titulo || s.title || s.overlay || `Escena ${i + 1}`,
                duracion: s.duracion || s.duration_seconds || Math.floor((videoConfig.duracion_total || 30) / parsed.length),
                pausa_inicial: s.pausa_inicial || 0.5,
                pausa_final: s.pausa_final || 0.5,
                animacion: s.animacion || 'fade',
                musica_local: s.musica_local || null,
                camara: s.camara || null,
                pattern_interrupt: s.pattern_interrupt || '',
                sfx: s.sfx || null,
                items: Array.isArray(s.items) ? s.items : undefined,
                icono: s.icono || undefined,
                icono_animacion: s.icono_animacion || undefined,
                image_url: s.image_url || undefined
            }));
        } else if (parsed.escenas && Array.isArray(parsed.escenas)) {
            scenes = parsed.escenas.map((s, i) => ({
                id: s.id || i + 1,
                title: s.titulo || s.title || s.titulo_escena || `Escena ${i + 1}`,
                body: s.texto || s.text || s.body || s.descripcion || s.spoken || '',
                visual: s.visual || s.shot || '',
                texto_overlay: s.texto_overlay || s.titulo || s.title || s.overlay || `Escena ${i + 1}`,
                duracion: s.duracion || s.duration_seconds || Math.floor((videoConfig.duracion_total || 30) / parsed.escenas.length),
                pausa_inicial: s.pausa_inicial || 0.5,
                pausa_final: s.pausa_final || 0.5,
                animacion: s.animacion || 'fade',
                musica_local: s.musica_local || null,
                camara: s.camara || null,
                pattern_interrupt: s.pattern_interrupt || '',
                sfx: s.sfx || null,
                items: Array.isArray(s.items) ? s.items : undefined,
                icono: s.icono || undefined,
                icono_animacion: s.icono_animacion || undefined,
                image_url: s.image_url || undefined
            }));
        } else {
            throw new Error('JSON sin estructura de escenas');
        }
    } catch (_) {
        // Narrativo/meditación ([PAUSA DE SILENCIO: N SEGUNDOS], [MÚSICA:], [EFECTO:],
        // encabezados "Sección (N minutos)", bloque final de prompts de fotografía) es un
        // formato de texto libre distinto del clásico "Escena N: texto" — se detecta por
        // sus marcadores entre corchetes y usa su propio parser.
        if (/\[\s*PAUSA\s+DE\s+SILENCIO|\[\s*M[ÚU]SICA\s*:|\[\s*EFECTO\s*:/i.test(guion)) {
            scenes = parseGuionNarrativo(guion);
        } else {
            scenes = guion.split(/\n(?=Escena|Scene|\d+\.|\*)/i)
                .filter(s => s.trim().length > 5)
                .map((s, i) => {
                    const lines = s.trim().split('\n').filter(l => l.trim());
                    return {
                        id: i + 1,
                        title: lines[0]?.replace(/^(Escena|Scene|\d+)[\.\:\-\s]*/i, '').trim() || `Escena ${i + 1}`,
                        body: lines.slice(1).join(' ').trim() || lines[0]?.trim() || '',
                        visual: '',
                        texto_overlay: '',
                        duracion: Math.floor((videoConfig.duracion_total || 30) / Math.max(scenes.length || 3, 1)),
                        pausa_inicial: 0.5,
                        pausa_final: 0.5,
                        animacion: 'fade',
                        musica_local: null
                    };
                });
        }
    }
    // Real duration wins: it's what actually gets rendered (sum of the scenes'
    // own timing). The UI's duration field/AI's config.duracion_total are only
    // fallbacks for the plain-text path where scenes have no explicit timing —
    // otherwise a stale UI value would silently starve music generation of the
    // seconds the guion actually needs.
    videoConfig.duracion_total = computeRealDuration(scenes) || parseInt(duration) || videoConfig.duracion_total;
    videoConfig.musica.estilo = style || videoConfig.musica.estilo;
    return { scenes, videoConfig };
}

// --- PROMPTS CACHE (desde Prompts_IA) ---
let promptsCache = {};
let promptsLastSync = 0;
const PROMPTS_CACHE_TTL = 60 * 1000; // 1 minuto

// Modelo activo (cambiable desde el frontend)
let activeModel = DEFAULT_MODEL;

// --- ViRe: jobs de render en curso (en memoria, servidor local de un solo
// usuario, mismo criterio simple que logBuffer/activeModel) ---
const VIRE_JOB_TTL_MS = 60 * 60 * 1000; // 1 hora
const vireJobs = new Map();
function limpiarVireJobsViejos() {
    const now = Date.now();
    for (const [id, job] of vireJobs) {
        if ((job.stage === 'done' || job.stage === 'error' || job.stage === 'cancelled') && (now - job.createdAt) > VIRE_JOB_TTL_MS) {
            if (job.tmpDir && fs.existsSync(job.tmpDir)) fs.rmSync(job.tmpDir, { recursive: true, force: true });
            vireJobs.delete(id);
        }
    }
}

// --- LOG BUFFER COMPARTIDO ---
const logBuffer = [];
const MAX_LOGS = 200;
function serverLog(level, ...args) {
    const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
    const entry = `[${new Date().toLocaleTimeString()}] [${level}] ${msg}`;
    console.log(entry);
    logBuffer.push(entry);
    if (logBuffer.length > MAX_LOGS) logBuffer.shift();
}
function normalizeDriveUrl(url) {
    if (!url || typeof url !== 'string') return url;
    const match = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
    if (match) return `https://drive.google.com/uc?export=view&id=${match[1]}`;
    return url;
}

// --- BRIEF → brief_normalizado (ver .suit/memory/pending/plan-briefmarker-mediaplanner.md) ---
// El campo `tipo_negocio` de Config_Empresas es un pipe-delimited de hasta 18 campos.
// Parser tolerante: nunca truena, nunca bloquea, nunca reescribe el campo original.
const BRIEF_LIST_FIELDS = {
    dolor: 'dolor',
    pcp: 'promesa_beneficio_prueba',
    pbp: 'promesa_beneficio_prueba',  // alias canónico (ADR-026)
    pbm: 'promesa_beneficio_prueba',  // alias legado
    objecion: 'objeciones',
    competidores: 'competidores'
};
// Campos cuyo key ya es su destino en brief_normalizado (no mapeado arriba).
// ADR-026: fuente real es logo_url (ADR-025), cuyo segmento 0 ya es "industria:
// valor" (etiquetado) — a diferencia del tipo_negocio legado donde el segmento 0
// era una etiqueta suelta sin ":". Por eso el segmento 0 ahora se intenta
// parsear como key:value igual que el resto; solo cae a etiqueta_legado si no
// tiene ":" (caso legado real).
// Columnas reales de Config_Empresas que viven FUERA del vector de logo_url
// (no vale la pena meterlas ahí dentro) pero que sí dan contexto real de copy
// para los prompts — antes se perdían en silencio porque parseBrief() solo
// recibía el vector, nunca la fila completa.
const BRIEF_EXTRA_COLUMNS = ['slogan', 'descripcion', 'giro_especifico', 'foto_agente'];

function parseBrief(briefVectorRaw, empresaRow) {
    const brief = { etiqueta_legado: '' };
    // El vector (ej. "slogan:...") gana si la misma clave también existe como
    // columna suelta — el vector es el Brief curado (ADR-026), la columna
    // suelta es el dato genérico de la empresa. Solo rellena huecos.
    const mergeExtras = () => {
        if (!empresaRow) return;
        for (const k of BRIEF_EXTRA_COLUMNS) {
            if (empresaRow[k] && !brief[k]) brief[k] = empresaRow[k];
        }
        // Columna con 2 grafías vivas en Config_Empresas (el GAS real usa
        // "telefonowhatsapp"; "telefonowhastapp" con la errata es un fallback
        // legado que ya existía en otros puntos de este archivo — ej. la
        // línea de /api/lp/generate). Se normaliza a una sola clave del Brief.
        if (!brief.telefonowhastapp) {
            brief.telefonowhastapp = empresaRow.telefonowhatsapp || empresaRow.telefonowhastapp || '';
        }
    };
    if (!briefVectorRaw || typeof briefVectorRaw !== 'string') { mergeExtras(); return brief; }
    const segments = briefVectorRaw.split('|');
    for (let i = 0; i < segments.length; i++) {
        const seg = segments[i].trim();
        if (!seg) continue;
        const colon = seg.indexOf(':');
        if (colon < 0) {
            if (i === 0) brief.etiqueta_legado = seg;
            continue;
        }
        const key = seg.slice(0, colon).trim().toLowerCase();
        let value = seg.slice(colon + 1).trim();
        if (!value) continue;
        // LAPVTFU: 7 slots POSICIONALES (Logo,Avatar,FotoPersonal,Videos,
        // Testimonios,Fotos,UGC) — a diferencia de objecion/competidores (listas
        // sin orden), filtrar vacíos aquí desalinearía las posiciones (ADR-025:
        // Avatar vacío debe caer a Logo, imposible de saber cuál era cuál tras
        // un filter). El slot 6 (Fotos) queda sin sub-parsear a propósito
        // (separador interno aún sin decidir, ver ADR-025).
        if (key === 'lapvtfu' || key === 'lavtfu') {
            const parts = value.split(',').map(s => s.trim());
            while (parts.length < 7) parts.push('');
            const [logo, avatarRaw, fotoPersonal, videos, testimonios, fotos, ugc] = parts;
            brief.activos = { logo, avatar: avatarRaw || logo, fotoPersonal, videos, testimonios, fotos, ugc };
            continue;
        }
        // Campos de lista (split por coma, filtra vacíos)
        if (BRIEF_LIST_FIELDS[key]) {
            const arr = value.split(',').map(s => s.trim()).filter(Boolean);
            if (arr.length) brief[BRIEF_LIST_FIELDS[key]] = arr;
            continue;
        }
        // Mapeos puntuales según spec de la tabla de 18 campos
        if (key === 'galeria') { brief.usa_galeria = value.toLowerCase().includes('si_galeria'); continue; }
        if (key === 'vendes') { brief.producto = value; continue; }
        if (key === 'lograr') { brief.objetivo = value; continue; }
        if (key === 'vivir') { brief.canal_principal = value; continue; }
        if (key === 'pm') {
            const parts = value.split(',').map(s => s.trim()).filter(Boolean);
            brief.precio_margen = { precio: parts[0] || '', margen: parts[1] || '' };
            continue;
        }
        if (key === 'ps') { brief.prueba_social = value; continue; }
        if (key === 'rlp') { brief.restricciones_legales = value; continue; }
        // Resto: industria, nicho, especializacion, audiencia, tono, competidores(no), etc.
        brief[key] = value;
    }
    mergeExtras();
    return brief;
}

// Trae la fila de Config_Empresas por id_empresa desde el backend GAS (action=config).
// Reusa el mismo deployment que /api/history y /api/save — el CMS CampanasAi.
async function fetchEmpresaRow(idEmpresa) {
    const url = GAS_URL.includes('?') ? (GAS_URL + '&action=config') : (GAS_URL + '?action=config');
    const gasBody = await new Promise((resolve, reject) => {
        fetchWithRedirects(url, (data, statusCode) => {
            try { resolve(JSON.parse(data)); } catch (e) { reject(new Error('GAS config parse error: ' + String(data).substring(0, 200))); }
        });
    });
    const rows = gasBody?.data || [];
    return rows.find(c => String(c.id_empresa || '').toLowerCase() === String(idEmpresa || '').toLowerCase())
        || rows.find(c => String(c.nomempresa || '').toLowerCase() === String(idEmpresa || '').toLowerCase())
        || null;
}

// Carga un prompt de Prompts_IA por id_agente (mismo mecanismo que /api/prompts/:id).
async function loadPromptById(promptId) {
    const { data, error } = await supabase
        .from('Prompts_IA')
        .select('prompt_base')
        .eq('id_agente', promptId)
        .eq('habilitado', 'TRUE')
        .limit(1);
    if (error) throw error;
    if (!data || data.length === 0) throw new Error('Prompt ' + promptId + ' no encontrado en Prompts_IA');
    return data[0].prompt_base;
}

// Modelos gratis con soporte de imagen verificados en vivo contra la API real
// de OpenRouter (openrouter.ai/api/v1/models, filtrado a input_modalities
// incluye "image" + ":free") — lista corta y puede rotar, por eso hay 2 de
// respaldo. NO pasa por OmniRoute (ese gateway no tiene ningún modelo de
// visión confirmado) — llamada directa con OPENROUTER_DIRECT_KEY.
const VISION_MODELS_FREE = ['minimax/minimax-m3:free', 'google/gemma-4-31b-it:free', 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free'];

// Describe una imagen de referencia (para "estilo desde imagen") llamando
// directo a OpenRouter con un modelo con visión. Devuelve texto plano, no
// JSON — ese texto se usa después como "referencia" del prompt de
// CAMP-STYLEDIRECTOR, igual que si el usuario la hubiera escrito a mano.
async function describirImagenReferencia(base64Data, mimeType) {
    if (!OPENROUTER_DIRECT_KEY) throw new Error('OPENROUTER_DIRECT_KEY no configurada en .env');
    const promptText = 'Describe en detalle el estilo visual de esta imagen para que un director de arte pueda reproducirlo sin verla: tipografía (forma, peso, si es mayúsculas), paleta de colores concreta, tipo de fondo/textura, composición/layout, iconos o ilustraciones que use, y cualquier elemento decorativo. No describas el contenido/mensaje del texto, solo el estilo visual.';
    let lastError = 'No se recibieron errores.';
    for (const model of VISION_MODELS_FREE) {
        try {
            const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${OPENROUTER_DIRECT_KEY}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model,
                    messages: [{
                        role: 'user',
                        content: [
                            { type: 'text', text: promptText },
                            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Data}` } }
                        ]
                    }],
                    max_tokens: 400
                })
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error?.message || `HTTP ${res.status}`);
            const content = json.choices?.[0]?.message?.content;
            if (!content) throw new Error('Respuesta sin contenido');
            return content;
        } catch (e) {
            lastError = e.message;
            serverLog('WARN', `[VISION] ${model} falló: ${e.message}`);
        }
    }
    throw new Error('Todos los modelos de visión fallaron: ' + lastError);
}

// Extrae el JSON de una respuesta de IA que puede traer preámbulo conversacional
// ("Claro, aquí tienes el JSON:") antes del bloque ```json — el `replace`
// anclado a ^/$ no lo quita, así que un modelo cortés (deepseek lo hace)
// tronaba JSON.parse y el server caía innecesariamente al siguiente modelo
// (o hasta Ollama, ~60-90s) aunque la respuesta rápida ya era usable.
function extractJsonFromAiText(text) {
    const raw = (text || '').trim();
    const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced) return fenced[1].trim();
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start !== -1 && end > start) return raw.slice(start, end + 1);
    return raw;
}

// Llama a la IA con el patrón de fallback de modelos del resto del server y
// fuerza salida JSON (quita fences markdown). Tira error si todos fallan.
async function callAIJson(systemContent, userContent, temperature = 0.7) {
    // NO usa "openrouter/free" como segundo modelo — probado en vivo (arreglando
    // el bug gemelo de /api/ai/generate) y confirmado roto: "auto/best-free" en
    // OmniRoute enruta a una cuenta Augment Code con cupo agotado y responde
    // HTTP 200 con un mensaje de texto en vez de un error real. Sí se detecta
    // aquí (JSON.parse revienta con ese texto, cae al siguiente intento), pero
    // es tiempo desperdiciado en un modelo que nunca va a servir. Qwen/Gemma
    // tampoco sirven: models-config.js documenta que solo deepseek tiene mapeo
    // verificado en OmniRoute — cualquier otro cae a "auto/best-fast", que dio
    // 401 o "Maximum combo retry limit reached". El fix real es reintentar el
    // MISMO modelo confiable con espera en 429 (rate limit temporal), no saltar
    // a un "segundo modelo" que en la práctica no existe.
    const primaryModel = toOmniRouteId(activeModel);
    const messages = [
        { role: 'system', content: systemContent },
        { role: 'user', content: userContent }
    ];
    const MAX_429_RETRIES = 2;
    let lastError = 'No se recibieron errores.';
    for (let attempt = 0; attempt <= MAX_429_RETRIES; attempt++) {
        try {
            const result = await callOpenRouter(primaryModel, messages, temperature);
            const cleaned = extractJsonFromAiText(result);
            return JSON.parse(cleaned);
        } catch (err) {
            lastError = err.message;
            serverLog('WARN', `⚠️ [AI_JSON] ${primaryModel} (intento ${attempt + 1}/${MAX_429_RETRIES + 1}): ${err.message}`);
            if (attempt >= MAX_429_RETRIES) break;
            // 429 (rate limit): esperar unos segundos suele bastar, es temporal.
            // err.status viene de callOpenRouter() — más confiable que buscar "429"
            // en el texto, que no todos los proveedores detrás de OmniRoute incluyen.
            if (err.status === 429 || err.message.includes('429') || err.message.toLowerCase().includes('rate limit')) {
                await new Promise(r => setTimeout(r, 5000));
            } else if (err.message.includes('ECONNRESET')) {
                await new Promise(r => setTimeout(r, 1000));
            } else {
                break; // error no-transitorio — reintentar no ayuda
            }
        }
    }
    // Última opción: modelo local de Ollama, sin depender de cupo/red externa.
    // Lento (~60-90s por llamada, medido en vivo) pero funciona sin internet.
    try {
        serverLog('WARN', '[AI_JSON] Modelos en la nube agotados, probando Ollama local (puede tardar ~1 min)...');
        const result = await callOllama(OLLAMA_FALLBACK_MODEL, systemContent, userContent, temperature);
        const cleaned = extractJsonFromAiText(result);
        return JSON.parse(cleaned);
    } catch (err) {
        lastError = err.message;
    }
    throw new Error('Todos los modelos fallaron al generar JSON. Último error: ' + lastError);
}

// --- MEDIA PLANNER / BRIEFMARKER (pipeline Brief → MediaPlanner → BriefMarker) ---
// Genera el plan_de_medios desde brief_normalizado (1 llamada de IA, barata).
async function generateMediaPlan(idEmpresa, fallbacks = {}) {
    const empresaRow = await fetchEmpresaRow(idEmpresa);
    // ADR-026: el vector de Brief vive en logo_url desde ADR-025 (2026-08-09) —
    // tipo_negocio se revirtió a su formato corto original. Fallback a
    // tipo_negocio solo por si algún tenant viejo nunca migró.
    const briefRaw = (empresaRow && (empresaRow.logo_url || empresaRow.tipo_negocio || empresaRow.tiponegocio)) || '';
    const brief = parseBrief(briefRaw, empresaRow);
    if (!brief.industria && fallbacks.industria) brief.industria = fallbacks.industria;
    if (!brief.nicho && fallbacks.nicho) brief.nicho = fallbacks.nicho;
    if (!brief.especializacion && fallbacks.especializacion) brief.especializacion = fallbacks.especializacion;

    const prompt = await loadPromptById('CAMP-MEDIAPLANNER');
    const systemContent = prompt.includes('{') && prompt.includes('}') ? prompt : 'Eres un media planner senior. Respondes EXCLUSIVAMENTE con un objeto JSON válido, sin texto fuera de él.';
    const userContent = `Brief normalizado del anunciante (JSON):\n${JSON.stringify(brief, null, 2)}\n\nGenera el plan de medios completo como JSON válido.`;

    const planDeMedios = await callAIJson(systemContent, userContent, 0.5);
    const totalSlots = (planDeMedios.campaigns || []).reduce((acc, c) => acc + (c.content_slots?.length || 0), 0);
    const planId = `plan_${Date.now()}`;
    const { data, error } = await supabase
        .from('planes_medios')
        .insert({
            id: planId,
            id_empresa: idEmpresa || null,
            empresa: (empresaRow && empresaRow.nomempresa) || '',
            brief_raw: briefRaw,
            brief_normalizado: brief,
            plan_de_medios: planDeMedios,
            estado: 'pendiente_revision',
            total_slots: totalSlots
        })
        .select()
        .single();
    if (error) throw error;
    return data;
}

// Procesa cada content_slot del plan con BriefMarker (N llamadas, caras — cap 12).
async function approveMediaPlan(planId, estiloVisual = null, cap = 12) {
    const { data: plan, error } = await supabase
        .from('planes_medios')
        .select('*')
        .eq('id', planId)
        .single();
    if (error) throw new Error('Plan no encontrado: ' + error.message);

    const campaigns = plan.plan_de_medios?.campaigns || [];
    const slots = [];
    for (const camp of campaigns) {
        for (const slot of (camp.content_slots || [])) {
            slots.push({ ...slot, campaign_id: camp.id || camp.nombre || 'campaign', campaign_nombre: camp.nombre || '' });
        }
    }
    // Cap de seguridad: máx 12, prioridad alta primero
    const prioRank = { alta: 0, media: 1, baja: 2 };
    slots.sort((a, b) => (prioRank[a.priority] ?? 1) - (prioRank[b.priority] ?? 1));
    const capN = (Number.isInteger(cap) && cap > 0) ? Math.min(cap, 12) : 12;
    const capped = slots.slice(0, capN);

    // Idempotente: reintentar (aprobar de nuevo el mismo plan) no vuelve a pagar
    // ni regenerar las piezas que ya salieron bien — solo reintenta las que
    // fallaron o nunca se procesaron (ej. tras un 429 de rate limit a mitad).
    const { data: existentes } = await supabase
        .from('piezas_creativas')
        .select('slot_id, estado')
        .eq('plan_id', planId);
    const yaGeneradas = new Set((existentes || []).filter(p => p.estado === 'generado').map(p => p.slot_id));
    const pendientes = capped.filter(slot => !yaGeneradas.has(slot.id || ''));

    const prompt = await loadPromptById('CAMP-BRIEFMARKER');
    const brief = plan.brief_normalizado || {};
    // El estilo se fija en la PRIMERA aprobación y se reusa en reintentos — sin
    // esto, un reintento tras un 429 a mitad del lote (ver ADR-021) podía
    // aplicar un estilo distinto al de las piezas ya generadas del mismo plan,
    // dejando una campaña con visual mezclado sin que nadie lo pidiera.
    const estiloAAplicar = plan.estilo_visual || estiloVisual || null;
    if (!plan.estilo_visual && estiloVisual) {
        await supabase.from('planes_medios').update({ estilo_visual: estiloVisual }).eq('id', planId);
    }
    // Estilo visual resuelto (Director o elección manual del usuario). Solo
    // controla la piel visual, nunca el copy — ver plan-pieza-a-video.md Parte 2.
    const estiloTxt = estiloAAplicar
        ? `\n\nDIRECCIÓN VISUAL A APLICAR: ${estiloAAplicar.cat} → ${estiloAAplicar.sub} (${estiloAAplicar.nombre}). Keywords: ${estiloAAplicar.keywords || 'N/A'}.
IMPORTANTE: esta dirección SOLO controla "visual_style", "editing" y "scenes[].shot" de cada escena (fotografía real, animación, meme, caricatura, ilustración, etc. — lo que indiquen las keywords). NO cambies el copy: "hook", "pain_point", "solution", "benefit", "proof", "cta", "emotion" ni "scenes[].spoken"/"scenes[].overlay" deben seguir sirviendo la misma estrategia de venta, solo con otra piel visual.`
        : '';
    let generadas = 0, errores = 0;
    for (const [i, slot] of pendientes.entries()) {
        // Espaciado entre llamadas — sin esto, ráfaguear varias llamadas seguidas
        // agota el rate limit gratuito de OpenRouter tras las primeras ~4
        // (visto en vivo: 4 generadas, 8 con error 429 "Rate limit exceeded").
        if (i > 0) await new Promise(r => setTimeout(r, 3000));
        const userContent = `Slot a producir:\n${JSON.stringify({ ...slot, brief: { audiencia: brief.audiencia, tono: brief.tono, objetivo: brief.objetivo, producto: brief.producto, giro_especifico: brief.giro_especifico, descripcion: brief.descripcion, slogan: brief.slogan } }, null, 2)}${estiloTxt}\n\nGenera el JSON creativo completo de esta pieza según el schema.`;
        try {
            const creative = await callAIJson(prompt, userContent, 0.7);
            const { error: insErr } = await supabase
                .from('piezas_creativas')
                .upsert({
                    id: `pieza_${planId}_${slot.id || generadas}`,
                    plan_id: planId,
                    campaign_id: slot.campaign_id,
                    slot_id: slot.id || String(generadas),
                    format: slot.format || '',
                    channel: slot.channel || '',
                    goal: slot.goal || '',
                    priority: slot.priority || '',
                    creative_json: creative,
                    estado: 'generado',
                    error_message: null
                }, { onConflict: 'id' });
            if (insErr) throw insErr;
            generadas++;
        } catch (e) {
            errores++;
            serverLog('WARN', `[BRIEFMARKER] Slot ${slot.id} falló: ${e.message}`);
            await supabase
                .from('piezas_creativas')
                .upsert({
                    id: `pieza_${planId}_${slot.id || 'err_' + errores}`,
                    plan_id: planId,
                    campaign_id: slot.campaign_id,
                    slot_id: slot.id || String(errores),
                    format: slot.format || '',
                    channel: slot.channel || '',
                    goal: slot.goal || '',
                    priority: slot.priority || '',
                    creative_json: {},
                    estado: 'error',
                    error_message: String(e.message).substring(0, 500)
                }, { onConflict: 'id' });
        }
    }
    await supabase.from('planes_medios').update({ estado: 'aprobado', updated_at: new Date().toISOString() }).eq('id', planId);
    return {
        plan_id: planId,
        piezas_generadas: generadas,
        piezas_error: errores,
        sin_procesar: slots.length - capped.length,
        piezas_generadas_total: yaGeneradas.size + generadas
    };
}

const server = http.createServer((req, res) => {
    serverLog('REQ', `${req.method} ${req.url}`);

    const origin = req.headers.origin || '';
    const allowedOrigins = ['http://localhost:8000', 'http://127.0.0.1:8000', 'null'];
    const allowed = allowedOrigins.includes(origin) || origin.endsWith('.suitorg.com');
    if (allowed) res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');

    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    const pathname = parsedUrl.pathname;

    // 🔄 PROXY DE HISTORIAL
    if (pathname.includes('/api/history')) {
        const historyUrl = GAS_URL.includes('?') ? (GAS_URL + '&action=history') : (GAS_URL + '?action=history');
        serverLog('INFO', "📜 [PROXY] Consultando Historial...");
        fetchWithRedirects(historyUrl, (data, statusCode) => {
            res.writeHead(statusCode, { 'Content-Type': 'application/json' });
            res.end(data);
        });
        return;
    }

    // ===== PUBLIC CLIENT CONFIG (no secrets) — must be before /api/config proxy =====
    if (pathname === '/api/config/client' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'max-age=300' });
        res.end(JSON.stringify({
            DRIVE_API_KEY: process.env.GOOGLE_PICKER_API_KEY || '',
            DRIVE_CLIENT_ID: process.env.GOOGLE_OAUTH_CLIENT_ID || '',
            DRIVE_APP_ID: process.env.GOOGLE_CLOUD_PROJECT_ID || ''
        }));
        return;
    }

    // 🩺 Salud de OmniRoute — la app llama esto al cargar para avisar si el
    // gateway de IA (puerto 20128) no está prendido, antes de que el usuario
    // se tope con el error a mitad de "Generar JSON" (ver CLAUDE.md, bug del
    // 429/JSON inválido). Ping liviano a /v1/models: no gasta cuota de ningún
    // modelo, solo confirma que el proceso está escuchando.
    if (pathname === '/api/health' && req.method === 'GET') {
        (async () => {
            let omniroute = false;
            let internet = false;
            try {
                await fetch(`${OMNIROUTE_BASE}/v1/models`, { signal: AbortSignal.timeout(3000) });
                omniroute = true; // cualquier respuesta HTTP ya prueba que el gateway está arriba
            } catch (_) {
                omniroute = false;
            }
            try {
                // generate_204: endpoint liviano de Google hecho para detección de
                // conectividad (lo usan ChromeOS/Android) — responde 204 sin cuerpo,
                // rápido, y no depende de que NUESTRO deployment de GAS esté sano
                // (eso ya se ve aparte en los logs si falla). Detecta el caso real
                // que motivó este chequeo: un corte de internet a mitad de sesión
                // (ej. la compu se durmió) tira '[PROXY_ERROR]' en GAS y 429 en
                // las imágenes de Drive al mismo tiempo — visto en vivo.
                await fetch('https://www.google.com/generate_204', { signal: AbortSignal.timeout(3000) });
                internet = true;
            } catch (_) {
                internet = false;
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                status: 'success',
                omniroute,
                internet,
                apiKeyConfigured: !!(OPENROUTER_API_KEY && OPENROUTER_API_KEY.length >= 10)
            }));
        })();
        return;
    }

    // 🔄 PROXY DE CONFIGURACIÓN (Empresas)
    if (pathname.includes('/api/config')) {
        // action=config del backend CMS CampanasAi devuelve Config_Empresas real
        // (getAll era del backend SUITSTORE01, no existe en este deployment).
        const configUrl = GAS_URL.includes('?') ? (GAS_URL + '&action=config') : (GAS_URL + '?action=config');
        serverLog('INFO', "🏢 [PROXY] Solicitando Config_Empresas vía action=config...");
        fetchWithRedirects(configUrl, (data, statusCode) => {
            try {
                const parsed = JSON.parse(data);
                if (parsed.data && Array.isArray(parsed.data)) {
                    const companies = parsed.data.map(c => ({
                        nomempresa: c.nomempresa || c.nombre_empresa || '',
                        logo_url: c.logo_url || '',
                        telefonowhastapp: c.telefonowhatsapp || c.telefonowhastapp || '',
                        enlace_oficial: c.enlace_oficial || c.website || '',
                        color_tema: c.color_tema || '#2563eb',
                        id_empresa: c.id_empresa || '',
                        tipo_negocio: c.tipo_negocio || ''
                    })).filter(c => c.nomempresa);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ status: 'success', message: 'Configuraciones cargadas', data: companies }));
                    return;
                }
            } catch (_) {}
            serverLog('WARN', "⚠️ GAS no disponible, usando datos mock de respaldo");
            const mockData = [
                { nomempresa: 'Mi Empresa Demo', logo_url: '', telefonowhastapp: '8112345678', enlace_oficial: 'https://ejemplo.com', color_tema: '#2563eb', id_empresa: 'DEMO', tipo_negocio: '' }
            ];
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'success', message: 'Configuraciones cargadas (respaldo)', data: mockData }));
        });
        return;
    }

    // 🔄 PROXY DE GUARDADO (POST)
    if (pathname === '/api/save' && req.method === 'POST') {
        let body = '';
        req.on('data', d => body += d);
        req.on('end', async () => {
            try {
                // fetchWithRedirects(url, callback) es GET-only (usa https.get internamente
                // y trata el 2do argumento como función) — pasarle un objeto {method:'POST',...}
                // como si fuera el callback lo invocaba como función al llegar la respuesta y
                // tiraba una excepción sin capturar que mataba el proceso entero. fetch() nativo
                // sí soporta POST con body, igual que ya se usa en callOpenRouter() más abajo.
                const gasRes = await fetch(GAS_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: body
                });
                const gasData = await gasRes.text();
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'success', message: 'Guardado en Google Sheets', gasResponse: gasData }));
            } catch (e) {
                serverLog('ERROR', `[SAVE] ${e.message}`);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'error', message: e.message }));
            }
        });
        return;
    }

    // ===== MODEL SELECTOR ENDPOINTS =====

    // GET /api/models — listar modelos disponibles
    if (pathname === '/api/models' && req.method === 'GET') {
        const modelsList = Object.entries(MODELS).map(([id, m]) => ({
            id, ...m, active: id === activeModel
        }));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ models: modelsList, active: activeModel }));
        return;
    }

    // POST /api/models/select — cambiar modelo activo
    if (pathname === '/api/models/select' && req.method === 'POST') {
        let body = '';
        req.on('data', d => body += d);
        req.on('end', () => {
            try {
                const { modelId } = JSON.parse(body);
                if (!MODELS[modelId]) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Modelo no válido' }));
                    return;
                }
                activeModel = modelId;
                serverLog('INFO', `🤖 Modelo cambiado a: ${MODELS[modelId].name}`);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, active: activeModel, name: MODELS[modelId].name }));
            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: e.message }));
            }
        });
        return;
    }

    // ===== SUPABASE ENDPOINTS =====

    // GET /api/industrias — lista industrias con nichos
    if (pathname === '/api/industrias' && req.method === 'GET') {
        (async () => {
            try {
                const { data, error } = await supabaseAdmin
                    .from('industrias')
                    .select('*, nichos(*)')
                    .eq('activo', true)
                    .order('categoria');

                if (error) throw error;
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'success', data }));
            } catch (e) {
                serverLog('ERROR', '[SUPABASE] /api/industrias GET:', e.message);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'error', message: e.message }));
            }
        })();
        return;
    }

    // POST /api/industrias — crear industria + nichos
    if (pathname === '/api/industrias' && req.method === 'POST') {
        let body = '';
        req.on('data', d => body += d);
        req.on('end', async () => {
            try {
                const { categoria, icono, descripcion, nichos } = JSON.parse(body);
                const { data: industria, error: errInd } = await supabaseAdmin
                    .from('industrias')
                    .insert({ categoria, icono, descripcion })
                    .select()
                    .single();

                if (errInd) throw errInd;

                if (nichos && nichos.length > 0) {
                    const { error: errNichos } = await supabaseAdmin
                        .from('nichos')
                        .insert(nichos.map(n => ({ ...n, industria_id: industria.id })));

                    if (errNichos) throw errNichos;
                }

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'success', data: industria }));
            } catch (e) {
                serverLog('ERROR', '[SUPABASE] /api/industrias POST:', e.message);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'error', message: e.message }));
            }
        });
        return;
    }

    // PUT /api/industrias/:id — editar industria
    const industriasMatch = pathname.match(/^\/api\/industrias\/(\d+)$/);
    if (industriasMatch && req.method === 'PUT') {
        let body = '';
        req.on('data', d => body += d);
        req.on('end', async () => {
            try {
                const id = parseInt(industriasMatch[1]);
                const updates = JSON.parse(body);
                const { data, error } = await supabaseAdmin
                    .from('industrias')
                    .update(updates)
                    .eq('id', id)
                    .select()
                    .single();

                if (error) throw error;
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'success', data }));
            } catch (e) {
                serverLog('ERROR', '[SUPABASE] /api/industrias PUT:', e.message);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'error', message: e.message }));
            }
        });
        return;
    }

    // GET /api/campanas — lista campañas desde Supabase
    if (pathname === '/api/campanas' && req.method === 'GET') {
        (async () => {
            try {
                const { data, error } = await supabase
                    .from('campanas')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(50);

                if (error) throw error;
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'success', data }));
            } catch (e) {
                serverLog('ERROR', '[SUPABASE] /api/campanas GET:', e.message);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'error', message: e.message }));
            }
        })();
        return;
    }

    // POST /api/campanas — guardar campaña en Supabase
    if (pathname === '/api/campanas' && req.method === 'POST') {
        let body = '';
        req.on('data', d => body += d);
        req.on('end', async () => {
            try {
                const campana = JSON.parse(body);
                const { data, error } = await supabase
                    .from('campanas')
                    .upsert({
                        id: campana.id || `camp_${Date.now()}`,
                        empresa: campana.empresa || '',
                        nombre: campana.nombre || campana.caption?.substring(0, 100) || '',
                        tema: campana.tema || '',
                        formato: campana.formato || '',
                        plataforma: campana.plataforma || '',
                        modo: campana.modo || '',
                        contenido: campana.contenido || campana.caption || '',
                        estado: campana.estado || 'pendiente',
                        activo: true,
                        configuracion: campana.configuracion || {},
                        metadata: campana.metadata || {},
                        contenido_json: campana.contenido_json || {}
                    }, { onConflict: 'id' })
                    .select()
                    .single();

                if (error) throw error;
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'success', data }));
            } catch (e) {
                serverLog('ERROR', '[SUPABASE] /api/campanas POST:', e.message);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'error', message: e.message }));
            }
        });
        return;
    }

    // ===== MEDIA PLANNER / BRIEFMARKER =====

    // POST /api/media-plan/generate — Brief → MediaPlanner → plan_de_medios (1 llamada IA)
    if (pathname === '/api/media-plan/generate' && req.method === 'POST') {
        let body = '';
        req.on('data', d => body += d);
        req.on('end', async () => {
            try {
                const { id_empresa, industria_fallback, nicho_fallback, especializacion_fallback } = JSON.parse(body);
                if (!id_empresa) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ status: 'error', message: 'id_empresa es requerido' }));
                    return;
                }
                serverLog('INFO', `[MEDIAPLANNER] Generando plan para empresa ${id_empresa}...`);
                const plan = await generateMediaPlan(id_empresa, {
                    industria: industria_fallback, nicho: nicho_fallback, especializacion: especializacion_fallback
                });
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'success', data: plan }));
            } catch (e) {
                serverLog('ERROR', `[MEDIAPLANNER] ${e.message}`);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'error', message: e.message }));
            }
        });
        return;
    }

    // POST /api/media-plan/:id/aprobar — BriefMarker por cada content_slot (N llamadas IA)
    const aprobarMatch = pathname.match(/^\/api\/media-plan\/([^/]+)\/aprobar$/);
    if (aprobarMatch && req.method === 'POST') {
        (async () => {
            let body = '';
            req.on('data', d => body += d);
            req.on('end', async () => {
                try {
                    const parsedBody = body ? JSON.parse(body) : {};
                    serverLog('INFO', `[BRIEFMARKER] Aprobando plan ${aprobarMatch[1]}...`);
                    const capRaw = parseInt(parsedBody.cap);
                    const cap = (Number.isInteger(capRaw) && capRaw > 0) ? Math.min(capRaw, 12) : 12;
                    const result = await approveMediaPlan(aprobarMatch[1], parsedBody.estilo_visual || null, cap);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ status: 'success', data: result }));
                } catch (e) {
                    serverLog('ERROR', `[BRIEFMARKER] ${e.message}`);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ status: 'error', message: e.message }));
                }
            });
        })();
        return;
    }

    // POST /api/media-plan/:id/rechazar — solo cambia estado
    const rechazarMatch = pathname.match(/^\/api\/media-plan\/([^/]+)\/rechazar$/);
    if (rechazarMatch && req.method === 'POST') {
        (async () => {
            try {
                const { error } = await supabase
                    .from('planes_medios')
                    .update({ estado: 'rechazado', updated_at: new Date().toISOString() })
                    .eq('id', rechazarMatch[1]);
                if (error) throw error;
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'success', data: { plan_id: rechazarMatch[1], estado: 'rechazado' } }));
            } catch (e) {
                serverLog('ERROR', `[MEDIAPLANNER] Rechazar: ${e.message}`);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'error', message: e.message }));
            }
        })();
        return;
    }

    // GET /api/media-plan/:id/piezas — lista las piezas de un plan (id, format,
    // channel, goal, estado, creative_json) para el botón "🎬 Generar Video" por pieza.
    const piezasMatch = pathname.match(/^\/api\/media-plan\/([^/]+)\/piezas$/);
    if (piezasMatch && req.method === 'GET') {
        (async () => {
            try {
                const { data, error } = await supabase
                    .from('piezas_creativas')
                    .select('id, campaign_id, slot_id, format, channel, goal, priority, estado, creative_json')
                    .eq('plan_id', piezasMatch[1])
                    .order('slot_id');
                if (error) throw error;
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'success', data: data || [] }));
            } catch (e) {
                serverLog('ERROR', `[MEDIAPLANNER] Listar piezas: ${e.message}`);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'error', message: e.message }));
            }
        })();
        return;
    }

    // GET /api/media-plan/recientes — últimos planes para "Retomar Plan de Medios"
    if (pathname === '/api/media-plan/recientes' && req.method === 'GET') {
        (async () => {
            try {
                const { data, error } = await supabase
                    .from('planes_medios')
                    .select('id, empresa, id_empresa, estado, total_slots, created_at')
                    .order('created_at', { ascending: false })
                    .limit(10);
                if (error) throw error;
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'success', data: data || [] }));
            } catch (e) {
                serverLog('ERROR', `[MEDIAPLANNER] Listar recientes: ${e.message}`);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'error', message: e.message }));
            }
        })();
        return;
    }

    // GET /api/media-plan/:id — plan completo (retomar / reabrir uno existente)
    const planDetailMatch = pathname.match(/^\/api\/media-plan\/([^/]+)$/);
    if (planDetailMatch && req.method === 'GET') {
        (async () => {
            try {
                const { data, error } = await supabase
                    .from('planes_medios')
                    .select('*')
                    .eq('id', planDetailMatch[1])
                    .single();
                if (error) throw error;
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'success', data }));
            } catch (e) {
                serverLog('ERROR', `[MEDIAPLANNER] Obtener plan: ${e.message}`);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'error', message: e.message }));
            }
        })();
        return;
    }

    // ===== RECETAS (IMG DE IMAGINACION) =====

    // GET /api/recetas — lista recetas
    if (pathname === '/api/recetas' && req.method === 'GET') {
        (async () => {
            try {
                const { data, error } = await supabase
                    .from('recetas')
                    .select('*')
                    .order('nombre');

                if (error) throw error;
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'success', data }));
            } catch (e) {
                serverLog('ERROR', '[SUPABASE] /api/recetas GET:', e.message);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'error', message: e.message }));
            }
        })();
        return;
    }

    // POST /api/video-imaginacion — genera video desde carpeta media + receta
    if (pathname === '/api/video-imaginacion' && req.method === 'POST') {
        let body = '';
        req.on('data', d => body += d);
        req.on('end', async () => {
            const tmpDir = path.join(__dirname, `tmp_imaginacion_${Date.now()}`);
            try {
                const { texto, receta_id, logo_base64, formato, overrides } = JSON.parse(body);

                // Obtener receta
                let recipe;
                if (receta_id) {
                    const { data, error } = await supabase
                        .from('recetas')
                        .select('*')
                        .eq('id', receta_id)
                        .single();
                    if (error) throw new Error('Receta no encontrada: ' + error.message);
                    recipe = data;
                } else {
                    throw new Error('Se requiere receta_id');
                }
                if (overrides) Object.assign(recipe, overrides);

                const mediaFolder = process.env.MEDIA_FOLDER;
                if (!mediaFolder) throw new Error('MEDIA_FOLDER no configurado en .env');
                if (!fs.existsSync(mediaFolder)) throw new Error(`La carpeta ${mediaFolder} no existe`);

                // Escanear archivos
                let files = fs.readdirSync(mediaFolder)
                    .filter(f => /\.(jpg|jpeg|png|mp4|mpg|mpeg)$/i.test(f))
                    .map(f => path.join(mediaFolder, f));

                if (files.length === 0) throw new Error('No hay archivos compatibles en MEDIA_FOLDER');

                // Ordenar
                if (recipe.orden === 'aleatorio') {
                    for (let i = files.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [files[i], files[j]] = [files[j], files[i]];
                    }
                }

                // Filtrar solo imagenes para v1
                const imageFiles = files.filter(f => /\.(jpg|jpeg|png)$/i.test(f));
                if (imageFiles.length === 0) throw new Error('No hay imágenes (jpg/png) en MEDIA_FOLDER');

                const selectedFiles = imageFiles.slice(0, 50);

                // Calcular tiempo por slide
                const totalDur = parseInt(recipe.duracion_total) || 30;
                let timePerSlide;
                if (recipe.ritmo === 'musica') {
                    timePerSlide = totalDur / selectedFiles.length;
                } else {
                    const ritmoSec = parseFloat(recipe.ritmo) || 1;
                    const totalWithRitmo = selectedFiles.length * ritmoSec;
                    timePerSlide = totalWithRitmo > totalDur ? totalDur / selectedFiles.length : ritmoSec;
                }
                timePerSlide = Math.max(timePerSlide, 0.5);

                fs.mkdirSync(tmpDir, { recursive: true });

                // Dimensiones segun formato
                const DIMS = {
                    Post: { w: 1080, h: 1080 },
                    Reel: { w: 1080, h: 1920 },
                    Story: { w: 1080, h: 1920 },
                    Banner: { w: 1200, h: 628 }
                };
                const dim = DIMS[formato] || DIMS.Reel;
                const W = dim.w;
                const H = dim.h;

                // Logo temp
                let logoPath = null;
                if (logo_base64) {
                    logoPath = path.join(tmpDir, 'logo.png');
                    const b64 = logo_base64.replace(/^data:image\/\w+;base64,/, '');
                    fs.writeFileSync(logoPath, b64, 'base64');
                }

                // Filtro de color
                const colorFilter = {
                    'blanco_y_negro': 'colorchannelmixer=.3:.4:.3:0:.3:.4:.3:0:.3:.4:.3',
                    'colores_vivos': 'eq=saturation=2.0',
                    'vintage': "curves=all='0/0 0.25/0.15 0.5/0.5 0.75/0.85 1/1',hue=s=0.5"
                }[recipe.filtro] || null;

                const fps = 24;

                // Write text to file for drawtext (avoids escaping issues)
                let textFilePath = null;
                if (texto) {
                    textFilePath = path.join(tmpDir, 'overlay_text.txt');
                    fs.writeFileSync(textFilePath, texto, 'utf8');
                }
                const defaultFont = getDefaultFontFile();

                // Generar segmentos individuales
                const segments = [];
                for (let i = 0; i < selectedFiles.length; i++) {
                    const segPath = path.join(tmpDir, `seg_${i}.mp4`).replace(/\\/g, '/');

                    let filters = `[0:v]scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2,fps=${fps}`;
                    if (colorFilter) filters += `,${colorFilter}`;
                    if (textFilePath) {
                        const escapedPath = escapeFfmpegPath(textFilePath);
                        filters += `,drawtext=textfile='${escapedPath}'`;
                        if (defaultFont) filters += `:fontfile='${escapeFfmpegPath(defaultFont)}'`;
                        filters += `:fontcolor=white:fontsize=48:x=(w-text_w)/2:y=h-th-100:enable=between(t,0,${timePerSlide})`;
                    }
                    filters += '[v0]';

                    const imgPath = selectedFiles[i].replace(/\\/g, '/');
                    serverLog('INFO', `[IMAGINACION] Segmento ${i+1}/${selectedFiles.length}...`);
                    if (logoPath) {
                        const logoPathFwd = logoPath.replace(/\\/g, '/');
                        const overlayFilter = `[v0][1:v]overlay=10:10:enable=between(t,0,${timePerSlide})[out]`;
                        ffmpeg(['-y', '-loop', '1', '-t', String(timePerSlide + 0.5), '-i', imgPath, '-i', logoPathFwd, '-filter_complex', `${filters};${overlayFilter}`, '-map', '[out]', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'ultrafast', '-crf', '23', segPath]);
                    } else {
                        ffmpeg(['-y', '-loop', '1', '-t', String(timePerSlide + 0.5), '-i', imgPath, '-filter_complex', filters, '-map', '[v0]', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'ultrafast', '-crf', '23', segPath]);
                    }
                    segments.push(segPath);
                }

                // Concatenar con o sin transiciones
                const outPath = path.join(__dirname, `imaginacion_${Date.now()}.mp4`);
                let concatCmd;

                if (segments.length === 1) {
                    ffmpeg(['-y', '-i', segments[0].replace(/\\/g, '/'), '-c', 'copy', outPath]);
                } else if (recipe.transicion === 'corte_brusco') {
                    const listPath = path.join(tmpDir, 'files.txt').replace(/\\/g, '/');
                    const listContent = segments.map(s => `file '${s}'`).join('\n');
                    fs.writeFileSync(listPath, listContent);
                    ffmpeg(['-y', '-f', 'concat', '-safe', '0', '-i', listPath, '-c', 'copy', outPath]);
                } else {
                    const xfadeMap = { fundido: 'fade', barrido_derecha: 'slideright', zoom: 'zoomin' };
                    const xfadeType = xfadeMap[recipe.transicion] || 'fade';
                    const transDur = 0.5;
                    const n = segments.length;

                    let filterComplex;
                    if (n === 1) {
                        filterComplex = `nullsrc=s=${W}x${H},trim=duration=${timePerSlide}[vout]`;
                    } else if (n === 2) {
                        const offset = timePerSlide;
                        filterComplex = `[0:v][1:v]xfade=transition=${xfadeType}:duration=${transDur}:offset=${offset}[vout]`;
                    } else {
                        let parts = [];
                        for (let i = 1; i < n; i++) {
                            const offset = timePerSlide * i;
                            if (i === 1) {
                                parts.push(`[0:v][1:v]xfade=transition=${xfadeType}:duration=${transDur}:offset=${offset}[vx1]`);
                            } else {
                                parts.push(`[vx${i-1}][${i}:v]xfade=transition=${xfadeType}:duration=${transDur}:offset=${offset}[vx${i}]`);
                            }
                        }
                        filterComplex = parts.join(';');
                    }

                    const lastLabel = n <= 2 ? '[vout]' : `[vx${n-1}]`;
                    const inputsArgs = segments.flatMap(s => ['-i', s]);

                    const concatArgs = ['-y', ...inputsArgs, '-filter_complex', filterComplex, '-map', lastLabel, '-pix_fmt', 'yuv420p', '-c:v', 'libx264', '-preset', 'ultrafast', outPath];
                    ffmpeg(concatArgs, { timeout: 120000 });
                }

                serverLog('INFO', `[IMAGINACION] Concatenación completada (${segments.length} segmentos)`);
                const videoBase64 = fs.readFileSync(outPath).toString('base64');

                // Limpiar
                fs.rmSync(tmpDir, { recursive: true, force: true });
                if (fs.existsSync(outPath)) fs.unlinkSync(outPath);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'success', video: `data:video/mp4;base64,${videoBase64}` }));

            } catch (e) {
                serverLog('ERROR', `[IMAGINACION] ${e.message}`);
                if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true, force: true });
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: e.message }));
            }
        });
        return;
    }

    // ===== AGENTE DE TENDENCIAS =====
    if (pathname === '/api/agent/tendencias' && req.method === 'POST') {
        (async () => {
            try {
                const agent = require('./scripts/agent-tendencias');
                const resultados = await agent.ejecutarAgente(serverLog);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'success', data: resultados }));
            } catch (e) {
                serverLog('ERROR', `[AGENT] ${e.message}`);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'error', message: e.message }));
            }
        })();
        return;
    }

    // ===== PROMPTS ENDPOINTS (desde Prompts_IA) =====

    // GET /api/prompts/:id — obtener prompt por id_agente
    const promptsMatch = pathname.match(/^\/api\/prompts\/(.+)$/);
    if (promptsMatch && req.method === 'GET') {
        (async () => {
            const promptId = promptsMatch[1];
            if (promptsCache[promptId] && (Date.now() - promptsLastSync) < PROMPTS_CACHE_TTL) {
                res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'max-age=60' });
                res.end(JSON.stringify(promptsCache[promptId]));
                return;
            }
            try {
                const { data, error } = await supabase
                    .from('Prompts_IA')
                    .select('*')
                    .eq('id_agente', promptId)
                    .eq('habilitado', 'TRUE')
                    .limit(1);
                if (error) throw error;
                if (!data || data.length === 0) {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Prompt no encontrado: ' + promptId }));
                    return;
                }
                promptsCache[promptId] = data[0];
                res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'max-age=60' });
                res.end(JSON.stringify(data[0]));
            } catch (e) {
                serverLog('ERROR', `[PROMPTS] GET ${promptId}: ${e.message}`);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: e.message }));
            }
        })();
        return;
    }

    // POST /api/sync/prompts — sincronizar Prompts_IA desde GAS a Supabase
    if (pathname === '/api/sync/prompts' && req.method === 'POST') {
        (async () => {
            try {
                const syncUrl = GAS_URL + '?action=getAll';
                const gasData = await new Promise((resolve, reject) => {
                    fetchWithRedirects(syncUrl, (body) => {
                        try { resolve(JSON.parse(body)); }
                        catch (e) { reject(new Error('GAS parse error: ' + body.substring(0, 200))); }
                    });
                });
                const rows = gasData?.Prompts_IA || gasData?.data?.Prompts_IA || [];
                let count = 0;
                for (const row of rows) {
                    const { data, error } = await supabase
                        .from('Prompts_IA')
                        .upsert({
                            id_agente: row.id_agente,
                            id_empresa: row.id_empresa || 'GLOBAL',
                            nombre: row.nombre || '',
                            prompt_base: row.prompt_base || '',
                            habilitado: row.habilitado || 'TRUE',
                            nivel_acceso: row.nivel_acceso || '1',
                            recibe_files: row.recibe_files || 'FALSE'
                        }, { onConflict: 'id_agente,id_empresa' });
                    if (!error) count++;
                }
                promptsCache = {};
                promptsLastSync = Date.now();
                serverLog('INFO', `[PROMPTS] Sync completado: ${count} prompts sincronizados`);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'success', synced: count }));
            } catch (e) {
                serverLog('ERROR', `[PROMPTS] Sync error: ${e.message}`);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: e.message }));
            }
        })();
        return;
    }

    // ===== TRENDS BDSMT =====

    // POST /api/trends/fetch — busca tendencias reales (pytrends + Reddit)
    if (pathname === '/api/trends/fetch' && req.method === 'POST') {
        let body = '';
        req.on('data', d => body += d);
        req.on('end', async () => {
            try {
                const { niche, subNiche, region } = JSON.parse(body);
                const trendResearch = require('./scripts/trend-research');
                const result = await trendResearch.fetchTrends(niche || '', subNiche || '', region || '');
                // Respaldo con IA real (genérico al nicho pedido) si pytrends/Reddit
                // no trajeron suficiente — ver generateAITrendFallback().
                if (result.trends.length < 3) {
                    const existingTitles = new Set(result.trends.map(t => t.titulo.toLowerCase()));
                    const aiTrends = await generateAITrendFallback(niche || '', subNiche || '', region || '');
                    for (const t of aiTrends) {
                        if (!existingTitles.has(t.titulo.toLowerCase())) result.trends.push(t);
                    }
                }
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'success', data: result }));
            } catch (e) {
                serverLog('ERROR', `[TRENDS] ${e.message}`);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'error', message: e.message }));
            }
        });
        return;
    }

    // POST /api/trends/generate — genera campaña basada en un trend seleccionado
    if (pathname === '/api/trends/generate' && req.method === 'POST') {
        let body = '';
        req.on('data', d => body += d);
        req.on('end', async () => {
            try {
                const { trend, niche, subNiche, region, slides, template, platform, format, conciencia, empresa, phone } = JSON.parse(body);

                // Cargar prompt desde Prompts_IA
                const { data: promptRow } = await supabase
                    .from('Prompts_IA')
                    .select('prompt_base')
                    .eq('id_agente', 'CAMP-BDSMT-TREND')
                    .eq('habilitado', 'TRUE')
                    .limit(1);
                let promptTemplate = promptRow?.[0]?.prompt_base || '';
                if (!promptTemplate) {
                    throw new Error('Prompt CAMP-BDSMT-TREND no encontrado en Prompts_IA');
                }
                const subNicheSuffix = subNiche ? `, Sub-nicho: ${subNiche}` : '';
                const systemPrompt = promptTemplate
                    .replace(/\$\{empresa\}/g, empresa || 'Tu Marca')
                    .replace(/\$\{niche\}/g, niche)
                    .replace(/\$\{subNicheSuffix\}/g, subNicheSuffix)
                    .replace(/\$\{region\}/g, region || 'México')
                    .replace(/\$\{trendTitulo\}/g, trend.titulo)
                    .replace(/\$\{trendDesc\}/g, trend.descripcion)
                    .replace(/\$\{trendFuente\}/g, trend.fuente)
                    .replace(/\$\{template\}/g, template || 'storytelling')
                    .replace(/\$\{conciencia\}/g, conciencia || 'Consciente_Solucion')
                    .replace(/\$\{slides\}/g, slides || 5);

                const userPrompt = `Generar campaña de ${slides || 5} slides para ${platform || 'Instagram'} en formato ${format || 'Post'}. Tendencia: "${trend.titulo}". CTA final: ${phone || 'Interacción en redes'}. ¡Responde estrictamente con JSON!`;

                const messages = [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ];

                const orModels = ["openrouter/free", "deepseek/deepseek-v4-flash"]
                    .map(toOmniRouteId)
                    .filter((v, i, a) => a.indexOf(v) === i); // dedup tras traducir al id real de OmniRoute

                let lastError = "No se recibieron errores.";
                let generatedJson = null;
                for (const m of orModels) {
                    try {
                        serverLog('INFO', `🤖 [BDSMT_TRY] Intentando con ${m}...`);
                        const result = await callOpenRouter(m, messages, 0.7);
                        serverLog('INFO', `✅ [BDSMT_SUCCESS] ${m} respondió correctamente.`);
                        const rawContent = result.trim();
                        const jsonStr = rawContent.startsWith('```') ? rawContent.replace(/```json|```/g, '') : rawContent;
                        generatedJson = JSON.parse(jsonStr);
                        break;
                    } catch (err) {
                        lastError = err.message;
                        serverLog('WARN', `⚠️ [BDSMT_FAIL] ${m}: ${err.message}`);
                        if (err.message.includes('ECONNRESET')) {
                            await new Promise(r => setTimeout(r, 1000));
                        }
                    }
                }

                if (!generatedJson) {
                    throw new Error(`Todos los modelos fallaron. Último error: ${lastError}`);
                }

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'success', data: generatedJson }));
            } catch (e) {
                serverLog('ERROR', `[TRENDS GEN] ${e.message}`);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'error', message: e.message }));
            }
        });
        return;
    }

    // ===== FIN SUPABASE ENDPOINTS =====

    if (req.method === 'POST' && pathname.includes('/api/ai')) {
        let body = '';
        req.on('data', d => body += d);
        req.on('end', async () => {
            try {
                const { messages, temperature, model: reqModel } = JSON.parse(body);

                if (!OPENROUTER_API_KEY || OPENROUTER_API_KEY.length < 10) {
                    throw new Error("La OPENROUTER_API_KEY parece estar vacía o incompleta en el archivo .env");
                }

                // 📡 Modelo del request > activeModel > fallback (per-request, no mutate global)
                const requestModel = (reqModel && MODELS[reqModel]) ? reqModel : activeModel;
                const primaryModel = toOmniRouteId(requestModel);
                // NO "openrouter/free" como segundo modelo: probado en vivo arreglando
                // este mismo bug y confirmado roto — "auto/best-free" en OmniRoute
                // enruta a una cuenta Augment Code con cupo agotado, y responde
                // HTTP 200 con un mensaje de texto ("has run out of usage...") en vez
                // de un error real, así que ni siquiera dispara el fallback normal:
                // ese texto se cuela como "respuesta válida" y revienta en
                // JSON.parse() del lado del cliente — el mismo síntoma reportado
                // ("La IA no devolvió JSON válido"), solo que disfrazado. Hoy no hay
                // un segundo modelo gratis con mapeo confiable en OmniRoute (por eso
                // los 3 sitios que usaban openrouter/free ya se habían cambiado a
                // deepseek antes en esta sesión) — el fix real es reintentar el MISMO
                // modelo confiable con espera cuando el error es 429 (rate limit
                // temporal, casi siempre se resuelve solo esperando unos segundos),
                // en vez de saltar a un "segundo modelo" que no existe de verdad.
                const MAX_429_RETRIES = 2;
                let lastError = new Error("No se recibieron errores.");
                for (let attempt = 0; attempt <= MAX_429_RETRIES; attempt++) {
                    try {
                        serverLog('INFO', `🤖 [AI_TRY] Intentando con ${primaryModel} (intento ${attempt + 1}/${MAX_429_RETRIES + 1})...`);
                        const result = await callOpenRouter(primaryModel, messages, temperature || 0.7);
                        serverLog('INFO', `✅ [AI_SUCCESS] ${primaryModel} respondió correctamente.`);
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        return res.end(JSON.stringify({ choices: [{ message: { content: result } }] }));
                    } catch (err) {
                        lastError = err;
                        serverLog('WARN', `⚠️ [AI_FAIL] ${primaryModel}: ${err.message}`);
                        const esRateLimit = err.status === 429 || err.message.includes('429') || err.message.toLowerCase().includes('rate limit');
                        const esConexion = err.message.includes('ECONNRESET');
                        if (attempt >= MAX_429_RETRIES) break; // se acabaron los reintentos, cae a los fallbacks locales
                        if (esRateLimit) {
                            serverLog('INFO', "⏳ Reintentando en 5 segundos por límite de solicitudes...");
                            await new Promise(r => setTimeout(r, 5000));
                        } else if (esConexion) {
                            serverLog('INFO', "⏳ Reintentando en 1 segundo por reset de red...");
                            await new Promise(r => setTimeout(r, 1000));
                        } else {
                            break; // error no-transitorio (ej. "Model is unavailable") — reintentar no ayuda
                        }
                    }
                }

                // 🏠 [FALLBACK LOCAL] Si todo lo anterior falla, intentamos usar IA Local (LM Studio)
                try {
                    serverLog('INFO', `🏠 [AI_LOCAL] Intentando conexión con IA Local (LM Studio en puerto 1234)...`);
                    const result = await callLocalLMS(messages[messages.length-1].content);
                    serverLog('INFO', `✅ [AI_SUCCESS] La IA Local respondió con éxito.`);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ choices: [{ message: { content: result } }] }));
                } catch (localErr) {
                    serverLog('WARN', `❌ [AI_LOCAL_FAIL]: ${localErr.message}`);
                }

                // 🐑 [FALLBACK OLLAMA] Último recurso: modelo local ya corriendo en esta
                // máquina, sin depender de OmniRoute ni de LM Studio (ninguno de los dos
                // estaba levantado cuando este endpoint fallaba en la práctica).
                try {
                    serverLog('INFO', `🐑 [AI_OLLAMA] Intentando con Ollama local (${OLLAMA_FALLBACK_MODEL})...`);
                    const systemMsg = messages.find(m => m.role === 'system')?.content || '';
                    const userMsg = messages.filter(m => m.role === 'user').map(m => m.content).join('\n') || messages[messages.length - 1].content;
                    const result = await callOllama(OLLAMA_FALLBACK_MODEL, systemMsg, userMsg, temperature || 0.7);
                    serverLog('INFO', `✅ [AI_SUCCESS] Ollama local respondió correctamente.`);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ choices: [{ message: { content: result } }] }));
                } catch (ollamaErr) {
                    serverLog('WARN', `❌ [AI_OLLAMA_FAIL]: ${ollamaErr.message}`);
                }

                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    error: lastError.status === 429
                        ? 'Límite de solicitudes de IA alcanzado. Espera unos segundos y vuelve a intentar.'
                        : `Ningún modelo de IA respondió (nube, LM Studio ni Ollama local). Último error: ${lastError.message}`
                }));

            } catch (e) {
                serverLog('ERROR', "❌ Error en Proxy AI:", e);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'error', message: 'Invalid JSON' }));
            }
        });
        return;
    }

    // --- NUEVO ENDPOINT: GOOGLE IMAGEN 3 (PREMIUM) ---
    if (pathname === '/api/ai/image' && req.method === 'POST') {
        let body = '';
        req.on('data', d => body += d);
        req.on('end', async () => {
            try {
                const { prompt } = JSON.parse(body);
                const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

                if (!GEMINI_API_KEY) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ error: "Falta GEMINI_API_KEY en .env" }));
                }

                serverLog('INFO', `🎨 [GOOGLE_IMAGEN] Generando: "${prompt.substring(0, 50)}..."`);
                
                // Endpoint oficial de Imagen 3 (v1beta)
                const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${GEMINI_API_KEY}`;
                
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        instances: [{ prompt: prompt }],
                        parameters: {
                            sampleCount: 1,
                            aspectRatio: "3:4",
                            outputMimeType: "image/png"
                        }
                    })
                });

                const data = await response.json();
                
                if (data.predictions && data.predictions[0] && data.predictions[0].bytesBase64Encoded) {
                    const base64 = data.predictions[0].bytesBase64Encoded;
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ status: "success", image: `data:image/png;base64,${base64}` }));
                } else {
                    serverLog('WARN', "⚠️ Imagen 3 no disponible. Fallback al vector secundario. Error:", JSON.stringify(data));
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ error: "Modelo Imagen 3 no habilitado en esta llave." }));
                }

            } catch (error) {
                serverLog('ERROR', "❌ Error en Google Imagen Server:", error.message);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: error.message }));
            }
        });
        return;
    }

    // ===== BDPV ENDPOINTS =====

    // POST /api/bdpv/generate — Genera presentación HTML
    if (pathname === '/api/bdpv/generate' && req.method === 'POST') {
        let body = '';
        req.on('data', d => body += d);
        req.on('end', async () => {
            try {
                const data = JSON.parse(body);
                serverLog('INFO', `🎞️ [BDPV] Generando presentación para: ${data.company}`);

                // Wrapper to call OpenRouter with the same pattern as /api/ai
                const callAI = async (messages, temperature) => {
                    const orModels = [
                        "openrouter/free",
                        "qwen/qwen3.6-35b-a3b:free",
                        "minimax/minimax-m2.5:free",
                        "google/gemini-flash-1.5",
                        "deepseek/deepseek-v4-flash"
                    ];
                    let lastError = '';
                    for (const m of orModels) {
                        try {
                            const result = await callOpenRouter(m, messages, temperature || 0.7);
                            return result;
                        } catch (err) {
                            lastError = err.message;
                            serverLog('WARN', `⚠️ [BDPV_AI] ${m}: ${err.message}`);
                        }
                    }
                    // Try local fallback
                    try {
                        const msg = messages[messages.length - 1].content;
                        return await callLocalLMS(msg);
                    } catch (localErr) {
                        throw new Error(`Todos los modelos fallaron. Último error: ${lastError}`);
                    }
                };

                const result = await bdpvGenerator.generatePresentation(data, callAI);

                if (result.success) {
                    // Auto-open the file
                    await bdpvGenerator.openPresentation(result.filePath);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        status: 'success',
                        filename: result.filename,
                        filePath: result.filePath
                    }));
                } else {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ status: 'error', error: result.error }));
                }
            } catch (e) {
                serverLog('ERROR', `❌ [BDPV] Error: ${e.message}`);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'error', error: e.message }));
            }
        });
        return;
    }

    // POST /api/bdpv/open — Abre archivo generado (with path traversal guard)
    if (pathname === '/api/bdpv/open' && req.method === 'POST') {
        let body = '';
        req.on('data', d => body += d);
        req.on('end', async () => {
            try {
                const { filePath } = JSON.parse(body);
                // Security: only allow paths within the presentations directory
                const allowedDir = path.join(__dirname, 'presentations');
                const resolved = path.resolve(filePath);
                if (!resolved.startsWith(allowedDir)) {
                    res.writeHead(403, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ status: 'error', error: 'Path not allowed' }));
                    return;
                }
                await bdpvGenerator.openPresentation(filePath);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'ok' }));
            } catch (e) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'error', error: e.message }));
            }
        });
        return;
    }

    // POST /api/lp/generate — Genera landing page HTML (lp: si en origen_politicas, ADR-019)
    if (pathname === '/api/lp/generate' && req.method === 'POST') {
        let body = '';
        req.on('data', d => body += d);
        req.on('end', async () => {
            try {
                const data = JSON.parse(body);
                serverLog('INFO', `🌐 [LP] Generando landing para: ${data.company}`);

                // Lee la fila de Config_Empresas para enriquecer con el Brief
                // (mismo mecanismo que MediaPlanner). Tolerante: si falla o no
                // encuentra la empresa, continúa con los datos del formulario.
                let brief = {};
                try {
                    const row = await fetchEmpresaRow(data.company);
                    if (row) {
                        brief = parseBrief(row.logo_url || row.tipo_negocio || row.tiponegocio || '', row);
                        if (!data.industry && brief.industria) data.industry = brief.industria;
                        if (!data.subNicho && brief.nicho) data.subNicho = brief.nicho;
                        if (!data.phone && (brief.telefonowhastapp || row.telefono)) data.phone = brief.telefonowhastapp || row.telefono;
                        if (!data.website && (row.enlace_oficial || row.website)) data.website = row.enlace_oficial || row.website;
                        if (!data.color) data.color = row.color_tema || '';
                    }
                } catch (e) {
                    serverLog('WARN', `⚠️ [LP] No se pudo leer Config_Empresas (continúa con formulario): ${e.message}`);
                }
                data.brief = brief;

                // Wrapper OpenRouter con fallbacks (mismo patrón que BDPV)
                const callAI = async (messages, temperature) => {
                    const orModels = [
                        "openrouter/free",
                        "qwen/qwen3.6-35b-a3b:free",
                        "minimax/minimax-m2.5:free",
                        "google/gemini-flash-1.5",
                        "deepseek/deepseek-v4-flash"
                    ];
                    let lastError = '';
                    for (const m of orModels) {
                        try {
                            const result = await callOpenRouter(m, messages, temperature || 0.7);
                            return result;
                        } catch (err) {
                            lastError = err.message;
                            serverLog('WARN', `⚠️ [LP_AI] ${m}: ${err.message}`);
                        }
                    }
                    try {
                        const msg = messages[messages.length - 1].content;
                        return await callLocalLMS(msg);
                    } catch (localErr) {
                        throw new Error(`Todos los modelos fallaron. Último error: ${lastError}`);
                    }
                };

                const result = await lpGenerator.generateLanding(data, callAI);

                if (result.success) {
                    await lpGenerator.openLanding(result.filePath);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        status: 'success',
                        filename: result.filename,
                        filePath: result.filePath
                    }));
                } else {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ status: 'error', error: result.error }));
                }
            } catch (e) {
                serverLog('ERROR', `❌ [LP] Error: ${e.message}`);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'error', error: e.message }));
            }
        });
        return;
    }

    // POST /api/lp/open — Abre landing generada (with path traversal guard)
    if (pathname === '/api/lp/open' && req.method === 'POST') {
        let body = '';
        req.on('data', d => body += d);
        req.on('end', async () => {
            try {
                const { filePath } = JSON.parse(body);
                const allowedDir = path.join(__dirname, 'landings');
                const resolved = path.resolve(filePath);
                if (!resolved.startsWith(allowedDir)) {
                    res.writeHead(403, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ status: 'error', error: 'Path not allowed' }));
                    return;
                }
                await lpGenerator.openLanding(filePath);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'ok' }));
            } catch (e) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'error', error: e.message }));
            }
        });
        return;
    }

    // 🎬 ANIMATE PHOTO ENDPOINT (FFmpeg)
    if (pathname === '/api/animate' && req.method === 'POST') {
        let body = '';
        req.on('data', d => body += d);
        req.on('end', async () => {
            try {
                const { image, effect, duration, vertical } = JSON.parse(body);
                serverLog('INFO', `[ANIMATE] Recibido: effect=${effect}, duration=${duration}, vertical=${vertical}, imageLength=${image?.length} chars`);
                if (!image) { serverLog('ERROR', "[ANIMATE] ❌ No image"); res.writeHead(400); res.end(JSON.stringify({ error: "Falta 'image' (base64)" })); return; }

                const imgPath = path.join(__dirname, `temp_img_${Date.now()}.png`);
                const outPath = path.join(__dirname, `temp_vid_${Date.now()}.mp4`);
                const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
                const imgSize = Buffer.byteLength(base64Data, 'base64');
                serverLog('INFO', `[ANIMATE] Imagen decodificada: ${(imgSize/1024).toFixed(1)} KB -> ${imgPath}`);
                fs.writeFileSync(imgPath, base64Data, 'base64');
                serverLog('INFO', `[ANIMATE] ✅ Imagen guardada en disco`);

                const dur = duration || 5;
                const fps = 24;
                const frames = dur * fps;
                const W = vertical ? 1080 : 1920;
                const H = vertical ? 1920 : 1080;

                let filter;
                switch (effect || 'zoom') {
                    case 'blink':
                        filter = `scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:color=black,fade=t=in:st=0:d=0.3,fade=t=out:st=${dur-0.3}:d=0.3`;
                        break;
                    case 'color_shift':
                        filter = `scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:color=black,hue=H=50*sin(2*PI*t/${dur}):s=1`;
                        break;
                    case 'ken_burns':
                        filter = `scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:color=black,zoompan=z='if(lte(zoom,1.0),1.0,zoom-0.008)':d=${frames}:s=${W}x${H}:fps=${fps}`;
                        break;
                    case 'zoom':
                    default:
                        filter = `scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:color=black,zoompan=z='min(zoom+0.015,1.5)':d=${frames}:s=${W}x${H}:fps=${fps}`;
                        break;
                }
                serverLog('INFO', `[ANIMATE] Filter: ${filter}`);

                serverLog('INFO', `[ANIMATE] Ejecutando: ${FFMPEG_PATH} ... (timeout 30s)`);
                ffmpeg(['-y', '-loop', '1', '-i', imgPath, '-vf', filter, '-c:v', 'libx264', '-t', String(dur), '-pix_fmt', 'yuv420p', outPath], { timeout: 30000 });
                serverLog('INFO', `[ANIMATE] ✅ FFmpeg OK. Video generado: ${outPath}`);

                const videoBase64 = fs.readFileSync(outPath).toString('base64');
                serverLog('INFO', `[ANIMATE] Video en base64: ${(videoBase64.length/1024).toFixed(1)} KB`);

                fs.unlinkSync(imgPath);
                fs.unlinkSync(outPath);
                serverLog('INFO', `[ANIMATE] ✅ Temporales eliminados. Enviando respuesta...`);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: "success", video: `data:video/mp4;base64,${videoBase64}`, effect, duration: dur }));
            } catch (e) {
                serverLog('ERROR', `[ANIMATE] ❌ Error: ${e.message}`);
                if (e.message?.includes('ffmpeg')) serverLog('ERROR', "[ANIMATE] ⚠️ ¿FFmpeg está instalado? Verificá con: ffmpeg -version");
                if (e.message?.includes('ETIMEDOUT') || e.message?.includes('timeout')) serverLog('ERROR', "[ANIMATE] ⏳ Timeout: la imagen es muy grande o el efecto es muy pesado");
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: e.message }));
            }
        });
        return;
    }

    // 🎞️ SLIDESHOW ENDPOINT (múltiples slides con transiciones)
    if (pathname === '/api/slideshow' && req.method === 'POST') {
        let body = '';
        req.on('data', d => body += d);
        req.on('end', async () => {
            let tmpDir = null;
            let outPath = null;
            try {
                const { images, effect, duration, transition, vertical } = JSON.parse(body);
                if (!images || !Array.isArray(images) || images.length < 1) {
                    res.writeHead(400); res.end(JSON.stringify({ error: "Se necesita al menos 1 imagen" })); return;
                }
                serverLog('INFO', `[SLIDESHOW] ${images.length} imágenes, effect=${effect}, dur=${duration}s, vertical=${vertical}`);

                const dur = duration || 5;
                const fps = 24;
                const W = vertical ? 1080 : 1920;
                const H = vertical ? 1920 : 1080;

                tmpDir = path.join(__dirname, `tmp_slideshow_${Date.now()}`);
                fs.mkdirSync(tmpDir, { recursive: true });
                const imgPaths = images.map((img, i) => {
                    const p = path.join(tmpDir, `slide_${i}.png`);
                    const b64 = img.replace(/^data:image\/\w+;base64,/, '');
                    fs.writeFileSync(p, b64, 'base64');
                    return p;
                });

                const segments = [];
                for (let i = 0; i < imgPaths.length; i++) {
                    const segPath = path.join(tmpDir, `seg_${i}.mp4`);
                    const imgPath = imgPaths[i].replace(/\\/g, '/');

                    let vf;
                    if (effect === 'none' || effect === 'static') {
                        vf = `scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:color=black`;
                    } else if (effect === 'blink') {
                        vf = `scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:color=black,fade=t=in:st=0:d=0.3,fade=t=out:st=${dur - 0.3}:d=0.3`;
                    } else if (effect === 'color_shift') {
                        vf = `scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:color=black,hue=H=50*sin(2*PI*t/${dur}):s=1`;
                    } else {
                        const zExpr = effect === 'ken_burns'
                            ? `if(lte(zoom,1.0),1.0,zoom-0.008)`
                            : `min(zoom+0.015,1.5)`;
                        vf = `zoompan=z='${zExpr}':d=${dur * fps}:s=${W}x${H}:fps=${fps},fade=t=in:st=0:d=0.3,fade=t=out:st=${dur - 0.3}:d=0.3`;
                    }

                    ffmpeg(['-y', '-loop', '1', '-t', String(dur), '-i', imgPath, '-vf', vf, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'ultrafast', '-an', segPath]);
                    segments.push(segPath);
                }

                outPath = path.join(__dirname, `slideshow_${Date.now()}.mp4`);

                if (segments.length === 1) {
                    fs.copyFileSync(segments[0], outPath);
                } else {
                    const concatFile = path.join(tmpDir, 'concat.txt');
                    const listContent = segments.map(s => `file '${s}'`).join('\n');
                    fs.writeFileSync(concatFile, listContent);
                    ffmpeg(['-y', '-f', 'concat', '-safe', '0', '-i', concatFile, '-c', 'copy', outPath]);
                }

                serverLog('INFO', `[SLIDESHOW] ✅ Video generado: ${outPath}`);

                const videoBase64 = fs.readFileSync(outPath).toString('base64');
                fs.rmSync(tmpDir, { recursive: true, force: true });
                fs.unlinkSync(outPath);
                tmpDir = null;
                outPath = null;

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: "success", video: `data:video/mp4;base64,${videoBase64}`, slides: images.length }));
            } catch (e) {
                serverLog('ERROR', `[SLIDESHOW] ❌ ${e.message}`);
                if (tmpDir) try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch(_) {}
                if (outPath && fs.existsSync(outPath)) try { fs.unlinkSync(outPath); } catch(_) {}
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: e.message }));
            }
        });
        return;
    }

    // 🖼️ PROXY-IMAGE: fetch imagen externa y la devuelve como base64 (sigue redirects)
    if (pathname === '/api/proxy-image' && req.method === 'GET') {
        const url = parsedUrl.searchParams.get('url');
        if (!url) { res.writeHead(400); res.end(JSON.stringify({ error: 'Falta url' })); return; }

        // SSRF protection: only allow known image hosts
        const allowedHosts = [
            'lh3.googleusercontent.com', 'lh4.googleusercontent.com', 'lh5.googleusercontent.com', 'lh6.googleusercontent.com',
            'drive.google.com', 'docs.google.com',
            'ssl.gstatic.com', 'www.gstatic.com',
            'firebasestorage.googleapis.com',
            'images.unsplash.com', 'via.placeholder.com',
            'upload.wikimedia.org',
            'i.ytimg.com', 'img.youtube.com'
        ];
        try {
            const parsedTarget = new URL(url);
            if (!allowedHosts.includes(parsedTarget.hostname) && !parsedTarget.hostname.endsWith('.supabase.co')) {
                serverLog('WARN', `[PROXY-IMG] Dominio no permitido: ${parsedTarget.hostname}`);
                res.writeHead(403); res.end(JSON.stringify({ error: 'Dominio no permitido' })); return;
            }
        } catch (e) {
            res.writeHead(400); res.end(JSON.stringify({ error: 'URL inválida' })); return;
        }

        function fetchFollowingRedirects(targetUrl, redirectCount, cb) {
            if (redirectCount > 10) return cb(new Error('Demasiados redirects'));
            const lib = targetUrl.startsWith('https') ? https : http;
            lib.get(targetUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (imgRes) => {
                // Seguir redirects 301/302/307/308
                if ([301, 302, 307, 308].includes(imgRes.statusCode) && imgRes.headers.location) {
                    let nextUrl = imgRes.headers.location;
                    if (!nextUrl.startsWith('http')) {
                        const base = new URL(targetUrl);
                        nextUrl = new URL(nextUrl, base.origin).href;
                    }
                    serverLog('INFO', `[PROXY-IMG] Redirect ${imgRes.statusCode} → ${nextUrl.substring(0, 80)}`);
                    imgRes.resume(); // descartar cuerpo del redirect
                    return fetchFollowingRedirects(nextUrl, redirectCount + 1, cb);
                }
                const chunks = [];
                imgRes.on('data', c => chunks.push(c));
                imgRes.on('end', () => cb(null, Buffer.concat(chunks), imgRes.headers['content-type']));
            }).on('error', cb);
        }

        fetchFollowingRedirects(url, 0, (err, buf, contentType) => {
            if (err) {
                serverLog('WARN', `[PROXY-IMG] Error: ${err.message}`);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ status: 'error', error: err.message }));
            }
            const mime = contentType && contentType.startsWith('image/')
                ? contentType.split(';')[0].trim()
                : (url.includes('.png') ? 'image/png' : url.includes('.webp') ? 'image/webp' : 'image/jpeg');
            const b64 = buf.toString('base64');
            serverLog('INFO', `[PROXY-IMG] ✅ Entregado: ${mime}, ${(buf.length / 1024).toFixed(1)} KB`);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'ok', image: `data:${mime};base64,${b64}` }));
        });
        return;
    }

    // Modo "revisar por escena": genera (o regenera) la imagen de UNA sola escena
    // para previsualizar/aprobar antes de armar el video completo. Reusa el mismo
    // helper que usa el loop de /api/video-produce — misma calidad, mismos overlays.
    if (pathname === '/api/scene-image' && req.method === 'POST') {
        let body = '';
        req.on('data', d => body += d);
        req.on('end', async () => {
            let tmpDir = null;
            try {
                const { visual, title, body: sceneBody, estilo_visual_keywords, image_source, format, logo_url, avatar_url } = JSON.parse(body);
                const visualDesc = visual || `${title || ''} ${sceneBody || ''}`.trim() || 'abstract background, no text';
                const imgDim = FMT_DIMS[format] || FMT_DIMS.Reel;

                tmpDir = path.join(__dirname, `tmp_sceneimg_${Date.now()}_${Math.floor(Math.random() * 1e6)}`);
                fs.mkdirSync(tmpDir, { recursive: true });

                let logoPath = null;
                if (logo_url) {
                    if (logo_url.startsWith('data:')) {
                        logoPath = path.join(tmpDir, 'logo.png');
                        fs.writeFileSync(logoPath, logo_url.replace(/^data:image\/\w+;base64,/, ''), 'base64');
                    } else if (logo_url.startsWith('http')) {
                        try {
                            const r = await fetch(logo_url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
                            if (r.ok) { logoPath = path.join(tmpDir, 'logo.png'); fs.writeFileSync(logoPath, Buffer.from(await r.arrayBuffer())); }
                        } catch (_) { /* sin logo, no bloquea la preview */ }
                    }
                }
                let avatarPath = null;
                if (avatar_url) {
                    if (avatar_url.startsWith('data:')) {
                        avatarPath = path.join(tmpDir, 'avatar.png');
                        fs.writeFileSync(avatarPath, avatar_url.replace(/^data:image\/\w+;base64,/, ''), 'base64');
                    } else if (avatar_url.startsWith('http')) {
                        try {
                            const r = await fetch(avatar_url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
                            if (r.ok) { avatarPath = path.join(tmpDir, 'avatar.png'); fs.writeFileSync(avatarPath, Buffer.from(await r.arrayBuffer())); }
                        } catch (_) { /* sin avatar, no bloquea la preview */ }
                    }
                }

                const imgPath = path.join(tmpDir, 'scene.png');
                await generateSceneImagePNG({ visualDesc, estilo_visual_keywords, image_source, imgDim, imgPath, logoPath, avatarPath });

                const buf = fs.readFileSync(imgPath);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'success', image_url: `data:image/png;base64,${buf.toString('base64')}` }));
            } catch (e) {
                serverLog('ERROR', `[SceneImage] ${e.message}`);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'error', error: e.message }));
            } finally {
                if (tmpDir && fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });
        return;
    }

    // Pool de fotos "trending" de Pexels (endpoint /v1/curated real de Pexels,
    // no una búsqueda por palabra clave) para el picker de imágenes con rueda
    // del mouse — mismo patrón que el picker de Estilo Visual (2026-09-04).
    // Nunca falla duro: sin API key o si Pexels no responde, devuelve photos: [].
    if (pathname === '/api/pexels-trending' && req.method === 'GET') {
        (async () => {
            try {
                if (!PEXELS_API_KEY) {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ status: 'success', photos: [] }));
                    return;
                }
                const format = parsedUrl.searchParams.get('format') || 'Reel';
                const dim = FMT_DIMS[format] || FMT_DIMS.Reel;
                const orientation = dim.w === dim.h ? 'square' : (dim.h > dim.w ? 'portrait' : 'landscape');
                const url = `https://api.pexels.com/v1/curated?per_page=15&orientation=${orientation}`;
                const r = await fetch(url, { headers: { Authorization: PEXELS_API_KEY } });
                if (!r.ok) throw new Error(`Pexels HTTP ${r.status}`);
                const data = await r.json();
                const photos = (data.photos || []).map(p => p.src?.large2x || p.src?.large).filter(Boolean);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'success', photos }));
            } catch (e) {
                serverLog('WARN', `[Pexels] Trending falló: ${e.message}`);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'success', photos: [] }));
            }
        })();
        return;
    }

    // ===== VIDE: SUITE COMPLETA DE VIDEO =====
    if (pathname === '/api/video-produce' && req.method === 'POST') {
        let body = '';
        req.on('data', d => body += d);
        req.on('end', async () => {
            try {
                const { empresa, sitio_web, logo_url, avatar_url, telefono, guion, style, duration, modules, format, platform, voice, voice_rate, estilo_visual_keywords, visual_style, image_source, tipografia, transicion } = JSON.parse(body);
                serverLog('INFO', `[VIDE] Iniciando para: ${empresa} (${modules.join(', ')})`);

                const tmpDir = path.join(__dirname, `tmp_vide_${Date.now()}`);
                fs.mkdirSync(tmpDir, { recursive: true });

                const steps = [];
                const imagesDir = path.join(tmpDir, 'images');
                fs.mkdirSync(imagesDir, { recursive: true });

                // Parse guion into scenes (supports new {config,escenas}, old array, and text)
                const { scenes, videoConfig } = parseGuionScenes(guion, duration, style);

                // Hoisted out of the 'images' block: referenced later during final
                // assembly (avatar overlay on the finished video) which runs even
                // when 'images' wasn't the block that downloaded it.
                let avatarPath = null;

                if (modules.includes('images')) {
                    serverLog('INFO', `[VIDE] Generando ${scenes.length} imágenes...`);
                    steps.push(`Imágenes: ${scenes.length} escenas detectadas`);

                    // Download logo if available
                    let logoPath = null;
                    if (logo_url) {
                        if (logo_url.startsWith('data:')) {
                            logoPath = path.join(tmpDir, 'logo.png');
                            const b64 = logo_url.replace(/^data:image\/\w+;base64,/, '');
                            fs.writeFileSync(logoPath, b64, 'base64');
                            steps.push('✅ Logo cargado (data URL)');
                        } else if (logo_url.startsWith('http')) {
                            try {
                                const logoRes = await fetch(logo_url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
                                if (logoRes.ok) {
                                    logoPath = path.join(tmpDir, 'logo.png');
                                    const logoBuf = Buffer.from(await logoRes.arrayBuffer());
                                    fs.writeFileSync(logoPath, logoBuf);
                                    steps.push('✅ Logo descargado');
                                }
                            } catch (e) {
                                serverLog('WARN', `[VIDE] Error descargando logo: ${e.message}`);
                            }
                        }
                    }

                    // Download avatar if available
                    if (avatar_url) {
                        if (avatar_url.startsWith('data:')) {
                            avatarPath = path.join(tmpDir, 'avatar.png');
                            const b64 = avatar_url.replace(/^data:image\/\w+;base64,/, '');
                            fs.writeFileSync(avatarPath, b64, 'base64');
                            steps.push('✅ Avatar cargado (data URL)');
                        } else if (avatar_url.startsWith('http')) {
                            try {
                                const avatarRes = await fetch(avatar_url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
                                if (avatarRes.ok) {
                                    avatarPath = path.join(tmpDir, 'avatar.png');
                                    const avatarBuf = Buffer.from(await avatarRes.arrayBuffer());
                                    fs.writeFileSync(avatarPath, avatarBuf);
                                    steps.push('✅ Avatar descargado');
                                }
                            } catch (e) {
                                serverLog('WARN', `[VIDE] Error descargando avatar: ${e.message}`);
                            }
                        }
                    }

                    // Generate images using Pollinations AI (free, no API key)
                    const imgDim = FMT_DIMS[format] || FMT_DIMS.Reel;
                    for (let i = 0; i < scenes.length; i++) {
                        const scene = scenes[i];
                        // camara/pattern_interrupt son metadata de VIDEO (movimiento de cámara,
                        // cortes) — no se meten al prompt de imagen fija, confunden al modelo de
                        // difusión (ej. "camera movement" en una sola foto). El zoompan/Ken Burns
                        // de FFmpeg ya usa scene.animacion por su cuenta (línea ~2275), no esto.
                        // title+body es el DIÁLOGO hablado, no una descripción visual — antes se
                        // pegaba siempre detrás de "visual" y contaminaba el prompt de imagen con
                        // el texto que se dice en voz alta (números de teléfono, verbos de acción
                        // como "Llama ahora", nombres...). Un modelo de imagen puede interpretar
                        // eso literalmente (ej. "Llama ahora" generando una llama, el animal) en
                        // vez de la escena real. Ahora title+body solo se usa si no hay "visual"
                        // (modo texto libre, que no trae descripción visual propia).
                        // Belt-and-suspenders against garbled invented text: diffusion models
                        // can't render legible text/names reliably, so even if the guion prompt
                        // slips one in, block it here too — cheap, and this is the last point
                        // before the image actually gets generated.
                        const visualDesc = scene.visual || `${scene.title} ${scene.body}`;

                        try {
                            let imgPath = path.join(imagesDir, `scene_${i}.png`);
                            // scene.image_url: imagen ya aprobada en modo "revisar por escena"
                            // (ver /api/scene-image) — se reusa tal cual en vez de regenerar.
                            await generateSceneImagePNG({
                                visualDesc, estilo_visual_keywords, image_source, imgDim, imgPath,
                                logoPath, avatarPath, existingImageUrl: scene.image_url || null,
                            });
                            steps.push(`✅ Imagen ${i + 1}/${scenes.length}: ${scene.title.substring(0, 30)}`);
                        } catch (e) {
                            serverLog('WARN', `[VIDE] Error imagen ${i}: ${e.message}`);
                        }
                    }
                }

                if (modules.includes('voice')) {
                    serverLog('INFO', `[VIDE] Generando voz por escena (${scenes.length} escenas)...`);
                    // TTS por escena en vez de un solo pase con todo el texto junto: permite
                    // silencio real entre escenas (no un frame negro, la imagen sigue en
                    // pantalla) para guiones tipo meditación con pausas explícitas
                    // ([PAUSA DE SILENCIO: N SEGUNDOS], ver parseGuionNarrativo). De paso,
                    // scene.duracion pasa a ser la duración real del audio en vez de una
                    // estimación — los subtítulos y el ensamblado de video quedan sincronizados
                    // automáticamente sin el hack de "estirar la última escena".
                    const voiceDir = path.join(tmpDir, 'voice_scenes');
                    fs.mkdirSync(voiceDir, { recursive: true });
                    const audioSegments = [];
                    let voiceOk = 0;
                    let sfxOk = 0;

                    // SFX puntual mezclado sobre el clip de la escena — duration=first conserva
                    // la duración del clip original (voz o silencio), así no desalinea el
                    // conteo de segmentos con los del video. Dos fuentes posibles:
                    // scene.sfx (whoosh/glitch/pop/bassdrop vía sfx.py, mismo generador que
                    // ViRe) o scene.sfx_query (texto libre de [EFECTO: ...] en un guion
                    // narrativo, resuelto contra Freesound/CC0 — sfx.py no interpreta
                    // descripciones como "cuenco tibetano").
                    const sfxScript = path.join(__dirname, '../SuitMusic/scripts/sfx.py');
                    async function resolveSfxFile(scene, index) {
                        if (scene.sfx) {
                            try {
                                const sfxPath = path.join(voiceDir, `sfx_${index}.wav`);
                                const result = spawnSync('python', [sfxScript, '-o', sfxPath, '-t', scene.sfx], { timeout: 10000 });
                                if (result.status === 0 && fs.existsSync(sfxPath)) return sfxPath;
                                serverLog('WARN', `[VIDE] sfx '${scene.sfx}' desconocido en escena ${index}, se omite`);
                            } catch (e) {
                                serverLog('WARN', `[VIDE] Error generando sfx '${scene.sfx}' en escena ${index}: ${e.message}`);
                            }
                        }
                        if (scene.sfx_query) {
                            const previewUrl = await buscarSonidoFreesound(scene.sfx_query);
                            if (!previewUrl) {
                                serverLog('WARN', `[VIDE] Freesound sin resultado para "${scene.sfx_query}" en escena ${index}`);
                                return null;
                            }
                            try {
                                const res = await fetch(previewUrl);
                                if (!res.ok) return null;
                                const buf = Buffer.from(await res.arrayBuffer());
                                const fsPath = path.join(voiceDir, `freesound_${index}.mp3`);
                                fs.writeFileSync(fsPath, buf);
                                return fsPath;
                            } catch (e) {
                                serverLog('WARN', `[VIDE] Error descargando sonido Freesound en escena ${index}: ${e.message}`);
                            }
                        }
                        return null;
                    }
                    function mixSfxFile(basePath, sfxPath, index) {
                        try {
                            const mixedPath = path.join(voiceDir, `mix_${index}.mp3`);
                            ffmpeg(['-y', '-i', basePath, '-i', sfxPath, '-filter_complex', '[0:a]volume=1.0[a0];[1:a]volume=0.9[a1];[a0][a1]amix=inputs=2:duration=first:dropout_transition=0:normalize=0[aout]', '-map', '[aout]', mixedPath]);
                            sfxOk++;
                            return mixedPath;
                        } catch (e) {
                            serverLog('WARN', `[VIDE] Error mezclando sfx en escena ${index}: ${e.message}`);
                            return basePath;
                        }
                    }

                    for (let i = 0; i < scenes.length; i++) {
                        const scene = scenes[i];
                        let segPath;
                        if (scene.is_silence || !scene.body) {
                            segPath = path.join(voiceDir, `sil_${i}.wav`);
                            makeSilenceClip(segPath, scene.duracion || 5);
                        } else {
                            const scenePath = path.join(voiceDir, `scene_${i}.mp3`);
                            // Edge TTS (voces neuronales de Microsoft, gratis, sin API key) — mucho
                            // menos robótico que gTTS. "python -m edge_tts" reusa la misma
                            // resolución de 'python' que ya usaba gTTS, evitando un nuevo punto de
                            // falla de PATH (ver ADR-009, el bug de PATH de FFmpeg).
                            const edgeResult = spawnSync('python', ['-m', 'edge_tts', '--voice', voice || 'es-MX-DaliaNeural', '--rate', voice_rate || '+0%', '--text', scene.body, '--write-media', scenePath], { timeout: 60000 });
                            let ok = edgeResult.status === 0 && fs.existsSync(scenePath);
                            if (!ok) {
                                serverLog('WARN', `[VIDE] Edge TTS falló en escena ${i}, usando gTTS de respaldo: ${(edgeResult.stderr?.toString() || '').slice(-300)}`);
                                try {
                                    const ttsScript = `import sys; from gtts import gTTS; tts = gTTS(text=sys.argv[1], lang='es'); tts.save(sys.argv[2])`;
                                    spawnSync('python', ['-c', ttsScript, scene.body, scenePath], { timeout: 60000 });
                                    ok = fs.existsSync(scenePath);
                                } catch (e) {
                                    serverLog('WARN', `[VIDE] Error TTS respaldo escena ${i}: ${e.message}`);
                                }
                            }
                            if (ok) {
                                const realDur = getAudioDurationSec(scenePath);
                                if (realDur) scene.duracion = realDur + 0.3;
                                segPath = scenePath;
                                voiceOk++;
                            } else {
                                segPath = path.join(voiceDir, `sil_${i}.wav`);
                                makeSilenceClip(segPath, scene.duracion || 5);
                            }
                        }
                        if (scene.sfx || scene.sfx_query) {
                            const sfxFile = await resolveSfxFile(scene, i);
                            if (sfxFile) segPath = mixSfxFile(segPath, sfxFile, i);
                        }
                        audioSegments.push(segPath);
                        if (i < scenes.length - 1 && (scene.pausa_final || 0) > 0) {
                            const gapPath = path.join(voiceDir, `gap_${i}.wav`);
                            makeSilenceClip(gapPath, scene.pausa_final);
                            audioSegments.push(gapPath);
                        }
                    }

                    // Escenas habladas ya traen su duración real (medida del audio) — el total
                    // que usa la generación de música más abajo debe reflejarla, no la
                    // estimación por conteo de palabras de parseGuionNarrativo.
                    videoConfig.duracion_total = computeRealDuration(scenes);

                    const voicePath = path.join(tmpDir, 'voice.mp3');
                    if (audioSegments.length) {
                        try {
                            const inputArgs = audioSegments.flatMap(s => ['-i', s]);
                            const labels = audioSegments.map((_, idx) => `[${idx}:a]aformat=sample_rates=44100:channel_layouts=stereo[a${idx}]`);
                            const concatInputs = audioSegments.map((_, idx) => `[a${idx}]`).join('');
                            const filterComplex = `${labels.join(';')};${concatInputs}concat=n=${audioSegments.length}:v=0:a=1[aout]`;
                            ffmpeg(['-y', ...inputArgs, '-filter_complex', filterComplex, '-map', '[aout]', voicePath], { timeout: 120000 });
                            steps.push(`✅ Voz por escena (${voiceOk}/${scenes.length})${sfxOk ? ` + ${sfxOk} sfx` : ''} con silencios reales`);
                        } catch (e) {
                            serverLog('WARN', `[VIDE] Error uniendo audio por escena: ${e.message}`);
                            steps.push(`⚠️ Voz no generada: ${e.message}`);
                        }
                    } else {
                        steps.push('⚠️ Voz no generada: el guion no tiene texto narrado ni pausas');
                    }
                }

                if (modules.includes('music')) {
                    serverLog('INFO', `[VIDE] Generando música...`);
                    try {
                        const musicPath = path.join(tmpDir, 'music.wav');
                        const musicStyle = videoConfig.musica.estilo || style || 'energetic';
                        const bpm = videoConfig.musica.bpm || (musicStyle === 'energetic' ? 140 : musicStyle === 'relaxing' ? 80 : 100);
                        const musicDuration = videoConfig.duracion_total || parseInt(duration) || 30;
                        const musicScript = path.join(__dirname, '../SuitMusic/scripts/music.py');
                        spawnSync('python', [musicScript, '-o', musicPath, '-d', String(musicDuration), '-b', String(bpm), '-s', musicStyle], { timeout: 30000 });
                        steps.push('✅ Música de fondo generada');
                    } catch (e) {
                        serverLog('WARN', `[VIDE] Error música: ${e.message}`);
                        steps.push(`⚠️ Música no generada: ${e.message}`);
                    }
                }

                // Generate subtitles SRT if enabled (uses per-scene timing)
                let srtPath = null;
                if (modules.includes('subtitles')) {
                    try {
                        srtPath = path.join(tmpDir, 'subtitles.srt');
                        let srtContent = '';
                        let currentTime = 0;
                        scenes.forEach((s, i) => {
                            const startSec = currentTime;
                            const endSec = startSec + (s.duracion || 5);
                            currentTime = endSec + (s.pausa_final || 0);
                            const srtTime = (sec) => {
                                const h = String(Math.floor(sec / 3600)).padStart(2, '0');
                                const m = String(Math.floor((sec % 3600) / 60)).padStart(2, '0');
                                const secs = String(Math.floor(sec % 60)).padStart(2, '0');
                                const ms = String(Math.floor((sec % 1) * 1000)).padStart(3, '0');
                                return `${h}:${m}:${secs},${ms}`;
                            };
                            const subText = (s.body || s.title || '').substring(0, 80);
                            srtContent += `${i + 1}\n${srtTime(startSec)} --> ${srtTime(endSec)}\n${subText}\n\n`;
                        });
                        fs.writeFileSync(srtPath, srtContent);
                        steps.push('✅ Subtítulos generados');
                    } catch (e) {
                        serverLog('WARN', `[VIDE] Error subtítulos: ${e.message}`);
                    }
                }

                // NOTA: VIDE ya NO intenta ViRe/Remotion internamente (ver /api/vire-produce
                // para ese motor, ahora separado). VIDE es siempre FFmpeg — predecible, y usa
                // los mismos fixes de animaciones/overlays/subtítulos siempre, sin ser
                // reemplazado en silencio por otro motor.

                // Assemble video with FFmpeg
                serverLog('INFO', `[VIDE] Ensamblando video final...`);
                const outPath = path.join(tmpDir, `vide_final_${Date.now()}.mp4`);

                try {
                    const imageFiles = fs.readdirSync(imagesDir).filter(f => f.endsWith('.png')).sort();
                    const voiceFile = path.join(tmpDir, 'voice.mp3');
                    const musicFile = path.join(tmpDir, 'music.wav');
                    const mixedAudio = path.join(tmpDir, 'mixed_audio.aac');

                    // Mix audio sources (voice + music)
                    const audioSources = [];
                    if (fs.existsSync(voiceFile)) audioSources.push(voiceFile);
                    if (fs.existsSync(musicFile)) audioSources.push(musicFile);

                    if (audioSources.length > 1) {
                        // audioSources is always [voice, music] in that order when both exist
                        // (push order above). amix's default normalize=1 divides every stream
                        // by the input count regardless of content, which on top of an already
                        // quiet music bed made it nearly inaudible under narration — explicit
                        // per-stream volume + normalize=0 makes the mix predictable and lets
                        // musica.volumen (parsed but never applied before) actually mean something.
                        // Bumped again after real measurement: raw music source averages
                        // -19dB, voice averages similar — at the old 0.5x multiplier music
                        // sat ~6dB under voice and was easy to miss under speech. Voice
                        // trimmed slightly too so music has room without fighting for it.
                        const musicVolume = (videoConfig.musica && videoConfig.musica.volumen) || 0.8;
                        const filterComplex = `[0:a]volume=0.9[voice_v];[1:a]volume=${musicVolume}[music_v];[voice_v][music_v]amix=inputs=2:duration=longest:dropout_transition=2:normalize=0[aout]`;
                        const amixCmd = ['-y', ...audioSources.map(s => ['-i', s]).flat(), '-filter_complex', filterComplex, '-map', '[aout]', '-ac', '2', mixedAudio];
                        ffmpeg(amixCmd);
                        steps.push('✅ Audio mezclado (voz + música)');
                    } else if (audioSources.length === 1) {
                        ffmpeg(['-y', '-i', audioSources[0], '-c:a', 'aac', mixedAudio]);
                        steps.push('✅ Audio listo');
                    }

                    // If the actual narration ended up longer than the guion's planned
                    // scene durations (a common AI estimation miss), stretch the last
                    // scene so the video isn't shorter than the voice — otherwise the
                    // audio/video merge below (video's length wins) would cut the
                    // narration off mid-sentence instead of finishing it.
                    if (fs.existsSync(voiceFile)) {
                        const voiceDur = getAudioDurationSec(voiceFile);
                        const plannedDur = computeRealDuration(scenes);
                        if (voiceDur && voiceDur > plannedDur && scenes.length > 0) {
                            scenes[scenes.length - 1].duracion += (voiceDur - plannedDur) + 0.5;
                        }
                    }

                    if (imageFiles.length === 0) {
                        steps.push('❌ No se generaron imágenes');
                    } else {
                        const fps = videoConfig.fps || 24;
                        const dim = FMT_DIMS[format] || FMT_DIMS.Reel;
                        const VW = dim.w;
                        const VH = dim.h;

                        // Create slideshow from images: each scene has own duration + pausas + text overlay
                        const segments = [];
                        const segmentDurations = [];
                        const transitionDurations = []; // length = segments.length - 1, hueco DESPUÉS de segments[i]

                        // Contact overlay (phone/website), top-right, present on every scene like
                        // logo/avatar — same text on all segments, so write it once up front.
                        const contactText = [telefono ? `Tel: ${telefono}` : '', sitio_web ? sitio_web.replace(/^https?:\/\//, '') : ''].filter(Boolean).join('   ·   ');
                        let contactFilePath = null;
                        let contactFitted = null;
                        if (contactText) {
                            contactFitted = fitOverlayText(contactText, VW * 0.55, 28, 20, 2);
                            contactFilePath = path.join(tmpDir, 'contact.txt');
                            fs.writeFileSync(contactFilePath, contactFitted.text, 'utf8');
                        }

                        for (let i = 0; i < imageFiles.length; i++) {
                            // El nombre de archivo (scene_N.png) trae el índice REAL de la
                            // escena — si la imagen de una escena falla (ej. Pollinations caído),
                            // imageFiles queda con un hueco y la posición i ya no coincide con
                            // el índice real, desalineando todas las escenas siguientes (texto/
                            // voz de una escena con la foto de otra) — visto en vivo generando
                            // el ejemplo de Toño Toques.
                            const sceneMatch = imageFiles[i].match(/^scene_(\d+)\.png$/);
                            const sceneIdx = sceneMatch ? parseInt(sceneMatch[1], 10) : i;
                            const scene = scenes[sceneIdx] || {};
                            const imgPath = path.join(imagesDir, imageFiles[i]).replace(/\\/g, '/');
                            const segDuration = scene.duracion || 5;
                            const overlayText = scene.texto_overlay || scene.title || '';
                            const anim = scene.animacion || 'fade';
                            const animFrames = Math.max(1, Math.round(segDuration * fps));

                            // Build video filter: scale + pad + scene animation + optional text overlay
                            let vf = `scale=${VW}:${VH}:force_original_aspect_ratio=decrease,pad=${VW}:${VH}:(ow-iw)/2:(oh-ih)/2`;
                            if (anim === 'zoom_in') {
                                const zStep = (0.3 / animFrames).toFixed(6);
                                vf += `,zoompan=z='min(zoom+${zStep},1.3)':d=${animFrames}:s=${VW}x${VH}:fps=${fps}`;
                            } else if (anim === 'ken_burns') {
                                const zStep = (0.3 / animFrames).toFixed(6);
                                vf += `,zoompan=z='if(lte(zoom,1.0),1.3,max(1.0,zoom-${zStep}))':d=${animFrames}:s=${VW}x${VH}:fps=${fps}`;
                            } else if (anim === 'fade') {
                                const fadeDur = Math.min(0.4, segDuration / 2);
                                vf += `,fps=${fps},fade=t=in:st=0:d=${fadeDur},fade=t=out:st=${Math.max(segDuration - fadeDur, 0)}:d=${fadeDur}`;
                            } else {
                                vf += `,fps=${fps}`;
                            }
                            if (overlayText) {
                                const fitted = fitOverlayText(overlayText, VW - 160, 64, 40, 2);
                                const textFilePath = path.join(tmpDir, `overlay_${i}.txt`);
                                fs.writeFileSync(textFilePath, fitted.text, 'utf8');
                                vf += `,drawtext=textfile='${escapeFfmpegPath(textFilePath)}'`;
                                const videFont = getFontForVisualStyle(visual_style, tipografia);
                                if (videFont) vf += `:fontfile='${escapeFfmpegPath(videFont)}'`;
                                // Los subtítulos reales (si el módulo está activo) se queman
                                // más abajo en el pipeline también anclados al fondo del frame
                                // (default de libass) — sin este condicional, texto_overlay y
                                // subtítulos caían en la misma franja y quedaban ilegibles
                                // encimados (visto en vivo). Con subtítulos, texto_overlay sube
                                // arriba (headline corto); sin ellos, se queda abajo como antes.
                                const overlayY = srtPath ? 'h*0.10' : 'h*0.80';
                                vf += `:fontcolor=white:fontsize=${fitted.fontsize}:x=(w-text_w)/2:y=${overlayY}:shadowcolor=black:shadowx=3:shadowy=3:box=1:boxcolor=black@0.55:boxborderw=15:line_spacing=8:text_align=C`;
                            }

                            if (contactFilePath) {
                                vf += `,drawtext=textfile='${escapeFfmpegPath(contactFilePath)}'`;
                                const contactFont = getDefaultFontFile();
                                if (contactFont) vf += `:fontfile='${escapeFfmpegPath(contactFont)}'`;
                                vf += `:fontcolor=white:fontsize=${contactFitted.fontsize}:x=w-text_w-20:y=20:shadowcolor=black:shadowx=2:shadowy=2:box=1:boxcolor=black@0.45:boxborderw=8`;
                            }

                            // Aviso legal de "creado con IA" (videoConfig.aviso_ia, ver
                            // parseGuionScenes): letra pequeña, SOLO en la última escena,
                            // NUNCA se agrega a "scene.body" — esa es la única fuente que
                            // alimenta el TTS más arriba en el pipeline, así que este texto
                            // jamás se lee en voz alta, solo se ve en pantalla.
                            if (videoConfig.aviso_ia && i === imageFiles.length - 1) {
                                const avisoFitted = fitOverlayText(videoConfig.aviso_ia, VW - 80, 22, 16, 2);
                                const avisoFilePath = path.join(tmpDir, 'aviso_ia.txt');
                                fs.writeFileSync(avisoFilePath, avisoFitted.text, 'utf8');
                                vf += `,drawtext=textfile='${escapeFfmpegPath(avisoFilePath)}'`;
                                const avisoFont = getDefaultFontFile();
                                if (avisoFont) vf += `:fontfile='${escapeFfmpegPath(avisoFont)}'`;
                                vf += `:fontcolor=white@0.85:fontsize=${avisoFitted.fontsize}:x=(w-text_w)/2:y=h-th-12:shadowcolor=black:shadowx=1:shadowy=1:box=1:boxcolor=black@0.4:boxborderw=6:line_spacing=4:text_align=C`;
                            }

                            const segPath = path.join(tmpDir, `seg_${i}.mp4`);
                            // -t as OUTPUT option (after -vf): with zoompan, -t as an INPUT option
                            // multiplies frames (default image loop rate x zoompan d), producing
                            // segments 100x too long. As an output option it correctly truncates.
                            ffmpeg(['-y', '-loop', '1', '-i', imgPath, '-vf', vf, '-t', String(segDuration), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'ultrafast', segPath]);
                            segments.push(segPath);
                            segmentDurations.push(segDuration);

                            // Antes esto generaba un clip negro de pausa_final segundos
                            // (corte seco -> negro -> corte seco). Ahora ese mismo hueco
                            // de tiempo se usa para un fundido real entre las dos fotos —
                            // mismo presupuesto de tiempo (la duración total no cambia),
                            // así el audio por escena ya generado con esos tiempos se
                            // mantiene sincronizado.
                            if (i < imageFiles.length - 1) {
                                transitionDurations.push(scene.pausa_final || 0.5);
                            }
                        }

                        // Une los segmentos con un fundido real entre cada foto (xfade)
                        // en vez del corte seco + pausa negra de antes. -c copy no sirve
                        // aquí (xfade filtra, no puede ser stream copy), por eso se
                        // re-codifica en este paso — antes el concat demuxer sí podía
                        // copiar directo porque no tocaba los frames.
                        if (segments.length === 1) {
                            fs.copyFileSync(segments[0], outPath);
                        } else {
                            const inputArgs = segments.flatMap(s => ['-i', s]);
                            const filterParts = [];
                            let prevLabel = '0:v';
                            let cum = segmentDurations[0];
                            for (let k = 1; k < segments.length; k++) {
                                // Clamp de seguridad: xfade necesita que la transición quepa
                                // dentro de AMBOS clips que une — sin esto, una escena muy
                                // corta con una pausa_final larga produciría un offset
                                // negativo o un filtro inválido. "Corte directo" pide un piso
                                // casi nulo (0.05s, imperceptible) en vez del piso normal de
                                // 0.15s — sigue siendo xfade por dentro (mismo código, sin
                                // ruta aparte), pero se ve como un corte seco.
                                const minTd = transicion === 'none' ? 0.05 : 0.15;
                                const td = Math.max(minTd, Math.min(transitionDurations[k - 1] || 0.5, segmentDurations[k - 1] * 0.9, segmentDurations[k] * 0.9));
                                const offset = Math.max(0, cum - td);
                                const outLabel = k === segments.length - 1 ? 'vout' : `v${k}`;
                                const transition = transicionParaCorte(k, transicion);
                                filterParts.push(`[${prevLabel}][${k}:v]xfade=transition=${transition}:duration=${td.toFixed(3)}:offset=${offset.toFixed(3)}[${outLabel}]`);
                                cum = cum + segmentDurations[k] - td;
                                prevLabel = outLabel;
                            }
                            ffmpeg(['-y', ...inputArgs, '-filter_complex', filterParts.join(';'), '-map', `[${prevLabel}]`, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'ultrafast', outPath]);
                        }
                        // ponytail: avatar is already baked into every scene image below
                        // (per-scene overlay, before concat) — a second pass here on the
                        // concatenated video was a duplicate compositing the same avatar
                        // twice (visible as a doubled circle once avatarPath stopped crashing).

                        // Add mixed audio if available
                        if (fs.existsSync(mixedAudio)) {
                            const finalPath = path.join(tmpDir, 'vide_with_audio.mp4');
                            try {
                                // Video's own length (driven by the guion's scene durations) is
                                // authoritative. apad pads audio with silence if it's shorter
                                // (voice finishes before the last scene ends); -shortest then
                                // trims to the video's length either way instead of the old
                                // behavior of chopping the WHOLE video down to audio's length.
                                ffmpeg(['-y', '-i', outPath, '-i', mixedAudio, '-filter_complex', '[1:a]apad[aout]', '-map', '0:v', '-map', '[aout]', '-c:v', 'copy', '-c:a', 'aac', '-shortest', finalPath]);
                                fs.unlinkSync(outPath);
                                fs.renameSync(finalPath, outPath);
                            } catch (e) {
                                serverLog('WARN', `[VIDE] Error mezclando audio: ${e.message}`);
                            }
                        }

                        // Burn subtitles if enabled
                        if (srtPath && fs.existsSync(srtPath)) {
                            const subbedPath = path.join(tmpDir, 'vide_subtitled.mp4');
                            try {
                                const srtEscaped = escapeFfmpegPath(srtPath);
                                ffmpeg(['-y', '-i', outPath, '-vf', `subtitles=filename='${srtEscaped}'`, '-c:a', 'copy', subbedPath]);
                                fs.unlinkSync(outPath);
                                fs.renameSync(subbedPath, outPath);
                                steps.push('✅ Subtítulos incrustados');
                            } catch (e) {
                                serverLog('WARN', `[VIDE] Error subtítulos FFmpeg: ${e.message}`);
                            }
                        }

                        const totalVideoTime = computeRealDuration(scenes);
                        steps.push(`✅ Video ensamblado: ${imageFiles.length} escenas, ${Math.round(totalVideoTime)}s total`);
                    }
                } catch (e) {
                    serverLog('ERROR', `[VIDE] Error FFmpeg: ${e.message}`);
                    steps.push(`❌ Error ensamblando: ${e.message}`);
                }

                // Return video
                if (fs.existsSync(outPath)) {
                    const videoBase64 = fs.readFileSync(outPath).toString('base64');
                    // Cleanup
                    fs.rmSync(tmpDir, { recursive: true, force: true });
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ status: 'success', video: `data:video/mp4;base64,${videoBase64}`, steps }));
                } else {
                    // Return steps only
                    const hasErrors = steps.some(s => s.includes('❌'));
                    const responseStatus = hasErrors ? 'error' : 'success';
                    const responseMessage = hasErrors ? 'El video no pudo generarse' : 'Proceso completado (sin video)';
                    fs.rmSync(tmpDir, { recursive: true, force: true });
                    res.writeHead(hasErrors ? 500 : 200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ status: responseStatus, message: responseMessage, steps }));
                }

            } catch (e) {
                serverLog('ERROR', `[VIDE] ${e.message}`);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'error', error: e.message }));
            }
        });
        return;
    }

    // ===== ViRe: VIDEO CON REMOTION (motor independiente de VIDE/FFmpeg) =====
    if (pathname === '/api/vire-produce' && req.method === 'POST') {
        let body = '';
        req.on('data', d => body += d);
        req.on('end', async () => {
            let tmpDir = null;
            try {
                const { empresa, sitio_web, logo_url, avatar_url, telefono, guion, style, voice, duration, format, enableMusic, enableVoice, estilo_visual_keywords, visual_style, brand_colors, image_source } = JSON.parse(body);
                const vozActiva = enableVoice !== false;
                serverLog('INFO', `[ViRe] Iniciando para: ${empresa}`);

                const vireDir = path.join(__dirname, '../SuitVidGenRemotion');
                const vireRenderScript = path.join(vireDir, 'scripts/render.js');
                if (!fs.existsSync(vireRenderScript)) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ status: 'error', error: `ViRe no está instalado (no se encontró ${vireRenderScript})` }));
                    return;
                }

                tmpDir = path.join(__dirname, `tmp_vire_${Date.now()}`);
                fs.mkdirSync(tmpDir, { recursive: true });

                // Los assets de audio (voz/música/sfx) deben quedar DENTRO de
                // SuitVidGenRemotion/public para poder referenciarse con
                // staticFile(), que rechaza rutas absolutas (ver ttsProvider.js,
                // que ya guarda las voces ahí) — tmpDir no sirve para esto.
                const virePublicDir = path.join(vireDir, 'public', 'generated');
                const toPublicRelative = (absPath) => path.relative(path.join(vireDir, 'public'), absPath).replace(/\\/g, '/');

                const { scenes, videoConfig } = parseGuionScenes(guion, duration, style);

                // Música de fondo opcional (mismo generador que usa VIDE)
                let musicRelPath = null;
                if (enableMusic) {
                    try {
                        const musicDir = path.join(virePublicDir, 'music');
                        fs.mkdirSync(musicDir, { recursive: true });
                        const musicFilePath = path.join(musicDir, `music_${Date.now()}.wav`);
                        const musicStyle = videoConfig.musica.estilo || style || 'energetic';
                        const bpm = videoConfig.musica.bpm || (musicStyle === 'energetic' ? 140 : musicStyle === 'relaxing' ? 80 : 100);
                        const musicDuration = videoConfig.duracion_total || parseInt(duration) || 30;
                        const musicScript = path.join(__dirname, '../SuitMusic/scripts/music.py');
                        spawnSync('python', [musicScript, '-o', musicFilePath, '-d', String(musicDuration), '-b', String(bpm), '-s', musicStyle], { timeout: 30000 });
                        if (fs.existsSync(musicFilePath)) musicRelPath = toPublicRelative(musicFilePath);
                    } catch (e) {
                        serverLog('WARN', `[ViRe] Música no generada: ${e.message}`);
                    }
                }

                // Genera (si aplica) el wav de sfx de una escena y devuelve su
                // ruta relativa a public/, o undefined si no hay sfx o falla.
                const sfxScript = path.join(__dirname, '../SuitMusic/scripts/sfx.py');
                const sfxDir = path.join(virePublicDir, 'sfx');
                function generarSfx(tipo, index) {
                    if (!tipo) return undefined;
                    try {
                        fs.mkdirSync(sfxDir, { recursive: true });
                        const sfxFilePath = path.join(sfxDir, `sfx_${Date.now()}_${index}.wav`);
                        const result = spawnSync('python', [sfxScript, '-o', sfxFilePath, '-t', tipo], { timeout: 10000 });
                        if (result.status === 0 && fs.existsSync(sfxFilePath)) return toPublicRelative(sfxFilePath);
                    } catch (e) {
                        serverLog('WARN', `[ViRe] sfx '${tipo}' no generado: ${e.message}`);
                    }
                    return undefined;
                }

                // Map guion scenes -> ViRe scene types.
                // Todas las escenas se renderizan como 'text' (imagen IA de
                // fondo + overlay acotado a 85% de ancho). Antes la primera y
                // última escena se forzaban a 'intro'/'outro': slides sin
                // imagen (IntroScene/OutroScene nunca leen image_prompt) que
                // además mostraban el `titulo` interno del guion ("Hook",
                // "Cierre"...) como texto gigante en pantalla, y el CTA del
                // outro no tenía maxWidth -> se salía del frame en escenas
                // largas. Viola además la regla de CLAUDE.md: los overlays de
                // contacto van sobre la imagen generada, nunca en un slide
                // aparte — por eso el teléfono/sitio va ahora pegado al
                // texto_overlay de la última escena en vez de en un outro.
                // Mejor esfuerzo para las fotos IA: el color exacto solo se puede
                // garantizar en el texto/fondo de Remotion (colors abajo), una foto
                // generada solo puede acercarse al tono vía palabras en el prompt.
                const colorPromptHint = brand_colors
                    ? `color palette: ${[brand_colors.accent, brand_colors.background, brand_colors.ink].filter(Boolean).join(', ')}, `
                    : '';

                const vireScenes = scenes.map((s, i) => {
                    const isLast = i === scenes.length - 1;
                    const voice_text = vozActiva ? (s.body || s.title || '') : undefined;
                    const sfx_file = generarSfx(s.sfx, i);
                    let texto_overlay = s.texto_overlay || s.title || undefined;

                    if (isLast && (telefono || sitio_web)) {
                        const contacto = [telefono, sitio_web].filter(Boolean).join(' · ');
                        texto_overlay = texto_overlay ? `${texto_overlay} · ${contacto}` : contacto;
                    }

                    return {
                        type: 'text',
                        duration: s.duracion || 5,
                        animation: s.animacion === 'fade' ? 'fade_in' : 'slide_up',
                        visual_style: visual_style || undefined,
                        brand_colors: brand_colors || undefined,
                        body: s.body || '',
                        // Solo lo lee RankingTarjetasScene (content_shape: "lista" del
                        // estilo elegido) — parseGuionScenes ya preserva este campo si
                        // la IA lo generó (ver construirPromptGuion en script.js).
                        items: s.items || undefined,
                        icono: s.icono || undefined,
                        icono_animacion: s.icono_animacion || undefined,
                        // Mismo fix que VIDE: el estilo visual se antepone aquí en vez de
                        // depender de que la IA lo haya aplicado bien dentro de "visual".
                        image_prompt: (estilo_visual_keywords ? `${estilo_visual_keywords}, ` : '')
                            + colorPromptHint
                            + (s.visual || `${s.title || ''} ${s.body || ''}`.substring(0, 200)),
                        // Imagen ya aprobada en modo "revisar por escena" — generateAllImages()
                        // en imageProvider.js ya prioriza esto sobre image_prompt, no regenera.
                        image_url: s.image_url || undefined,
                        voice_text,
                        sfx_file,
                        texto_overlay,
                        // Igual que VIDE (CLAUDE.md: overlays como miniatura sobre la imagen,
                        // nunca slide aparte) — se mandan tal cual (data: URI o URL http ya
                        // resuelta desde el cliente), Remotion las carga directo, sin descargarlas
                        // a disco: <Img>/staticFile solo hace falta para archivos locales nuevos.
                        logo_url: logo_url || undefined,
                        avatar_url: avatar_url || undefined,
                    };
                });

                const fmtMap = { Post: 'post', Reel: 'story', Story: 'story', Banner: 'custom' };
                const vireFmt = fmtMap[format] || 'story';
                const vireFps = videoConfig.fps || 24;

                const vireScript = {
                    format: vireFmt,
                    width: 1080,
                    height: vireFmt === 'post' ? 1080 : vireFmt === 'custom' ? 1200 : 1920,
                    fps: vireFps,
                    empresa: empresa || '',
                    tema: 'vide',
                    voice: { provider: 'edge_tts', voice: voice || 'es-MX-DaliaNeural', speed: 1.0 },
                    background_music: musicRelPath || undefined,
                    subtitles: { enabled: true, style: 'classic' },
                    image_source: image_source || 'ia',
                    scenes: vireScenes,
                };

                const vireScriptPath = path.join(tmpDir, 'vire_script.json');
                const vireOutputPath = path.join(tmpDir, 'vire_output.mp4');
                fs.writeFileSync(vireScriptPath, JSON.stringify(vireScript, null, 2));

                serverLog('INFO', `[ViRe] 🎬 Renderizando (${vireScenes.length} escenas, formato ${vireFmt})...`);

                // spawn (no spawnSync): la generación de imágenes + el render de
                // Remotion pueden tardar varios minutos, y spawnSync congelaría
                // TODO el event loop del servidor (no solo esta request) — con
                // spawn el servidor sigue atendiendo /api/vire-status mientras
                // corre. render.js reporta avance real por stdout (líneas
                // ##VIRE_PROGRESS##, ver reportProgress en render.js).
                limpiarVireJobsViejos();
                const jobId = crypto.randomUUID();
                const job = {
                    id: jobId,
                    stage: 'starting',
                    percent: 0,
                    voiceTotal: 0,
                    imageTotal: 0,
                    images: [],
                    error: null,
                    videoPath: null,
                    tmpDir,
                    child: null,
                    createdAt: Date.now(),
                };
                vireJobs.set(jobId, job);

                const child = spawn('node', [
                    vireRenderScript,
                    '--guion', vireScriptPath,
                    '--output', vireOutputPath,
                    '--empresa', empresa || 'ViRe',
                    '--auto'
                ], { cwd: vireDir });
                job.child = child;

                let stdoutBuf = '';
                let stderrTail = '';
                const PROGRESS_MARKER = '##VIRE_PROGRESS##';
                child.stdout.on('data', (chunk) => {
                    stdoutBuf += chunk.toString();
                    const lines = stdoutBuf.split('\n');
                    stdoutBuf = lines.pop();
                    for (const line of lines) {
                        const idx = line.indexOf(PROGRESS_MARKER);
                        if (idx === -1) continue;
                        try {
                            const data = JSON.parse(line.slice(idx + PROGRESS_MARKER.length));
                            job.stage = data.stage;
                            if (data.stage === 'voices') job.voiceTotal = data.total;
                            if (data.stage === 'images') {
                                job.imageTotal = data.total;
                                job.images.push({ index: data.current - 1, url: data.url, prompt: data.prompt });
                            }
                            if (data.stage === 'render') job.percent = data.percent;
                        } catch (_) { /* línea de progreso corrupta, se ignora */ }
                    }
                });
                child.stderr.on('data', (chunk) => {
                    stderrTail = (stderrTail + chunk.toString()).slice(-4000);
                });
                child.on('error', (err) => {
                    job.stage = 'error';
                    job.error = `No se pudo iniciar el render: ${err.message}`;
                    serverLog('ERROR', `[ViRe] spawn falló (job ${jobId}): ${err.message}`);
                });
                child.on('close', (code) => {
                    if (job.stage === 'cancelled') return;
                    if (code === 0 && fs.existsSync(vireOutputPath)) {
                        job.stage = 'done';
                        job.percent = 100;
                        job.videoPath = vireOutputPath;
                        serverLog('INFO', `[ViRe] ✅ Video renderizado (job ${jobId})`);
                    } else {
                        const tail = stderrTail.split('\n').slice(-15).join('\n').trim();
                        job.stage = 'error';
                        job.error = `ViRe falló: ${tail.substring(0, 500)}`;
                        serverLog('ERROR', `[ViRe] ❌ Render falló (exit ${code}, job ${jobId}): ${tail.substring(0, 800)}`);
                        if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true, force: true });
                    }
                });

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'accepted', jobId }));
            } catch (e) {
                serverLog('ERROR', `[ViRe] ${e.message}`);
                if (tmpDir && fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true, force: true });
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'error', error: e.message }));
            }
        });
        return;
    }

    // 📋 BRIEF REAL de una empresa, ya parseado — mismo mecanismo que usa
    // "Solo Imagen sin guion" (fetchEmpresaRow + parseBrief), expuesto aparte
    // para que "Generar JSON" (VIDE/ViRe) también lo use en vez de depender
    // SOLO de que el nicho real coincida con la lista fija de <select> de
    // Asistente IA — un nicho específico ("CBD Funcional de Espectro
    // Completo") casi nunca va a existir ahí, y el match fallaba en silencio.
    if (pathname === '/api/empresa-brief' && req.method === 'GET') {
        const empresa = parsedUrl.searchParams.get('empresa') || '';
        (async () => {
            try {
                if (!empresa) throw new Error('empresa es requerida');
                const empresaRow = await fetchEmpresaRow(empresa);
                const briefRaw = (empresaRow && (empresaRow.logo_url || empresaRow.tipo_negocio || empresaRow.tiponegocio)) || '';
                const brief = parseBrief(briefRaw, empresaRow);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'success', data: brief }));
            } catch (e) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'error', error: e.message }));
            }
        })();
        return;
    }

    // 🖥️ COMFY QUICK PREVIEW — botón "Comfy" en Datos/Negocio: genera UNA
    // imagen de prueba con SuitComfy/ComfyUI local, armando el prompt solo con
    // datos reales de la empresa (industria/nicho/giro/color_tema) — no pasa
    // por el wizard de VIDE/ViRe, es una acción aislada de prueba rápida.
    // generarImagenComfy() (arriba) ya nunca tira excepción (devuelve null si
    // ComfyUI/SuitComfy no responden, ver ADR-031) — acá solo se traduce ese
    // null en un 503 con mensaje accionable, nunca en un crash del server.
    if (pathname === '/api/comfy/quick-preview' && req.method === 'POST') {
        let body = '';
        req.on('data', d => body += d);
        req.on('end', async () => {
            try {
                const { empresa } = JSON.parse(body);
                if (!empresa) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ status: 'error', error: 'empresa es requerida' }));
                }
                const empresaRow = await fetchEmpresaRow(empresa);
                const briefRaw = (empresaRow && (empresaRow.logo_url || empresaRow.tipo_negocio || empresaRow.tiponegocio)) || '';
                const brief = parseBrief(briefRaw, empresaRow);
                const colorTema = (empresaRow && empresaRow.color_tema) || '';
                const descriptores = [brief.industria, brief.nicho, brief.giro_especifico].filter(Boolean).join(', ');

                const prompt = `cinematic photorealistic advertising photograph for a ${descriptores || 'local'} business` +
                    (colorTema ? `, color palette inspired by ${colorTema}` : '') +
                    `, professional studio lighting, high detail, no text, no watermark, no logos`;

                serverLog('INFO', `[Comfy] Quick preview para "${empresa}": ${prompt}`);
                const imgPath = await generarImagenComfy(prompt, 768, 768);
                if (!imgPath) {
                    res.writeHead(503, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({
                        status: 'error',
                        error: 'ComfyUI/SuitComfy no responde. Abrí ComfyUI Desktop y confirmá que SuitComfy esté corriendo en :3012 (ver ADR-031).'
                    }));
                }
                const b64 = fs.readFileSync(imgPath).toString('base64');
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'success', image: `data:image/png;base64,${b64}`, prompt }));
            } catch (e) {
                serverLog('ERROR', `[Comfy] quick-preview: ${e.message}`);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'error', error: e.message }));
            }
        });
        return;
    }

    // 🖼️ COMFY POSTER — flujo completo "Quote-Flow": frase + categoría (banco
    // cerrado, ver POSTER_CATEGORIES) -> escena fotorrealista con ComfyUI ->
    // overlay de tipografía/franja/insignia con SuitComfy/quote-flow-poster.js
    // (SD1.5 no puede escribir texto, por eso van separados — ver ADR-031/032).
    // El color de acento usa color_tema de la empresa si es un hex válido,
    // si no cae al default de la categoría — nunca bloquea por dato faltante.
    // El póster compuesto se arma en un archivo temporal y se borra apenas se
    // lee (mismo criterio que quick-preview: no ensucia ninguna galería).
    if (pathname === '/api/comfy/poster' && req.method === 'POST') {
        let body = '';
        req.on('data', d => body += d);
        req.on('end', async () => {
            let tmpPath = null;
            try {
                const { empresa, frase, categoria } = JSON.parse(body);
                if (!frase || !frase.trim()) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ status: 'error', error: 'La frase es requerida' }));
                }
                const cat = POSTER_CATEGORIES[categoria] || POSTER_CATEGORIES.conocimiento;

                let accent = cat.accent;
                if (empresa) {
                    const empresaRow = await fetchEmpresaRow(empresa);
                    const colorTema = empresaRow && empresaRow.color_tema;
                    if (colorTema && /^#[0-9a-fA-F]{6}$/.test(colorTema)) accent = colorTema;
                }

                const lines = splitFraseEnLineas(frase);
                const prompt = `cinematic photorealistic HDR photo, ${cat.escenario}, high contrast, dramatic shadows, no text, no watermark`;

                serverLog('INFO', `[Comfy] Generando póster "${categoria || 'conocimiento'}" para "${empresa || '(sin empresa)'}": "${frase}"`);
                const imgPath = await generarImagenComfy(prompt, 768, 1024);
                if (!imgPath) {
                    res.writeHead(503, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({
                        status: 'error',
                        error: 'ComfyUI/SuitComfy no responde. Abrí ComfyUI Desktop y confirmá que SuitComfy esté corriendo en :3012 (ver ADR-031).'
                    }));
                }

                tmpPath = path.join(os.tmpdir(), `suitcampanas-poster-${Date.now()}.png`);
                await composePoster({
                    backgroundPath: imgPath,
                    outputPath: tmpPath,
                    spec: { W: 768, H: 1024, accent, lines, destino: cat.destino, badge: cat.badge, icons: cat.icons }
                });

                const b64 = fs.readFileSync(tmpPath).toString('base64');
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'success', image: `data:image/png;base64,${b64}` }));
            } catch (e) {
                serverLog('ERROR', `[Comfy] poster: ${e.message}`);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'error', error: e.message }));
            } finally {
                if (tmpPath && fs.existsSync(tmpPath)) fs.unlink(tmpPath, () => {});
            }
        });
        return;
    }

    // 🖼️ SOLO IMAGEN — una pieza estática (foto de fondo + overlay del
    // template elegido: Paper, Pinterest Ad, etc.) sin voz/música/video.
    // Reusa el mismo guion/estilo/marca que VIDE y ViRe (comparten el switch
    // "Solo Imagen"), pero renderiza UN frame vía Remotion en vez del video
    // completo — mucho más rápido (sin voces, sin encode de video). Solo la
    // primera escena del guion se usa; el resto se ignora si hay más de una.
    if (pathname === '/api/vire-still' && req.method === 'POST') {
        let body = '';
        req.on('data', d => body += d);
        req.on('end', async () => {
            let tmpDir = null;
            try {
                const { empresa, sitio_web, logo_url, avatar_url, telefono, guion, tema, nicho, industria, estilo_visual_keywords, visual_style, brand_colors, image_source, content_shape, item_count } = JSON.parse(body);
                serverLog('INFO', `[ViReStill] Generando imagen para: ${empresa}`);

                const vireDir = path.join(__dirname, '../SuitVidGenRemotion');
                const vireRenderScript = path.join(vireDir, 'scripts/render.js');
                if (!fs.existsSync(vireRenderScript)) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ status: 'error', error: `ViRe no está instalado (no se encontró ${vireRenderScript})` }));
                    return;
                }

                tmpDir = path.join(__dirname, `tmp_virestill_${Date.now()}`);
                fs.mkdirSync(tmpDir, { recursive: true });

                let s;
                if (guion && guion.trim()) {
                    const { scenes } = parseGuionScenes(guion, 5, '');
                    if (!scenes.length) throw new Error('El guion no tiene contenido para generar una imagen');
                    s = scenes[0];
                } else {
                    // Sin guion pegado/generado: lee el Brief real de la empresa
                    // (mismo vector que generateMediaPlan() — ADR-026: vive en
                    // logo_url, con fallback a tipo_negocio para tenants viejos)
                    // y la IA arma el copy de UNA sola pieza al vuelo. Así "Solo
                    // Imagen" no obliga a pasar antes por Generar Plan de Medios
                    // ni por Generar JSON.
                    serverLog('INFO', `[ViReStill] Sin guion, generando desde el Brief de ${empresa}...`);
                    const empresaRow = await fetchEmpresaRow(empresa);
                    const briefRaw = (empresaRow && (empresaRow.logo_url || empresaRow.tipo_negocio || empresaRow.tiponegocio)) || '';
                    const brief = parseBrief(briefRaw, empresaRow);
                    if (!brief.industria && industria) brief.industria = industria;
                    if (!brief.nicho && nicho) brief.nicho = nicho;
                    if (tema) brief.tema_solicitado = tema;
                    if (!brief.producto && !brief.industria && !brief.nicho && !tema) {
                        throw new Error('No hay guion ni Brief guardado para esta empresa — escribe contenido o completa el Brief primero');
                    }

                    if (content_shape === 'lista') {
                        // Estilos tipo infografía/ranking (video_subestilos.parametros_visuales
                        // .content_shape === "lista", ej. "Ranking en Tarjetas") necesitan N
                        // puntos reales, no una sola frase — y tienen que sonar investigados
                        // sobre ESTE negocio puntual, no una plantilla ("El 87% de..." que
                        // sirve para cualquier competidor del rubro fue el fallo real detectado).
                        const N = Math.max(3, Math.min(8, parseInt(item_count, 10) || 5));
                        const systemPromptLista = `Eres un copywriter/investigador publicitario. A partir del BRIEF REAL de un negocio (no un genérico de su rubro), genera el contenido de una infografía tipo ranking/lista de EXACTAMENTE ${N} puntos para redes sociales.

Debes sonar como si hubieras investigado a fondo ESTE negocio puntual: usa su producto, nicho, audiencia, objetivo, tono y prueba social (todo lo que venga en el brief) para inventar ${N} puntos específicos y creíbles — razones, pasos, señales, mitos vs. realidad, tips o beneficios, el ángulo que mejor calce con el objetivo del brief. PROHIBIDO usar plantillas vacías tipo "El X% de las personas que prueban Y..." — cada punto debe mencionar o implicar algo propio de ESTE negocio, nunca una generalidad que serviría para cualquier competidor del mismo rubro.

Responde EXCLUSIVAMENTE con un objeto JSON válido:
{
  "titulo": string, titular corto y llamativo para el ranking completo,
  "items": [ { "icono": un emoji relacionado, "titulo_item": string corto (máx 6 palabras), "subtitulo_item": string de una frase con el detalle concreto } ] — EXACTAMENTE ${N} elementos,
  "visual": string en inglés describiendo SOLO una foto o textura de fondo simple y genérica (sin texto, sin íconos, sin gráficos — el diseño lo dibuja el sistema, no la foto)
}`;
                        const userContent = `Empresa: ${empresa}\nBrief:\n${JSON.stringify(brief, null, 2)}\n\nGenera exactamente ${N} items.`;
                        const pieza = await callAIJson(systemPromptLista, userContent, 0.7);
                        s = { title: pieza.titulo, items: (Array.isArray(pieza.items) ? pieza.items : []).slice(0, N), visual: pieza.visual };
                    } else {
                        const systemPrompt = 'Eres un copywriter publicitario. A partir del brief de un negocio, genera el contenido de UNA sola pieza gráfica publicitaria (no un guion de video, no una campaña completa). Responde EXCLUSIVAMENTE con un objeto JSON válido: {"titulo": string corto tipo hook/titular, "body": string breve de 1 frase (puede incluir una cifra u oferta concreta si el brief la sugiere), "visual": string en inglés describiendo la foto/escena de fondo para un generador de imágenes IA, "icono": UNA sola palabra clave en inglés (no un emoji, no una frase — se busca en un catálogo real de íconos vectoriales, ej. "clock", "leaf", "heart") que represente el concepto central de la pieza, o null si ninguno aporta, "icono_animacion": "rotar"|"flotar"|"pulsar"|"rebotar"|null (rotar=proceso/tiempo, flotar=calma/naturaleza, pulsar=alerta/urgencia, rebotar=energía/logro — elige según lo que el ícono representa, o null si no hay ícono)}.';
                        const userContent = `Empresa: ${empresa}\nBrief:\n${JSON.stringify(brief, null, 2)}`;
                        const pieza = await callAIJson(systemPrompt, userContent, 0.7);
                        s = { title: pieza.titulo, body: pieza.body, visual: pieza.visual, icono: pieza.icono || undefined, icono_animacion: pieza.icono_animacion || undefined };
                    }
                }

                // Mismo criterio que /api/vire-produce: el color exacto solo se
                // garantiza en el overlay de Remotion (brand_colors abajo); la
                // foto IA solo puede acercarse al tono vía palabras en el prompt.
                const colorPromptHint = brand_colors
                    ? `color palette: ${[brand_colors.accent, brand_colors.background, brand_colors.ink].filter(Boolean).join(', ')}, `
                    : '';
                let texto_overlay = s.texto_overlay || s.title || undefined;
                if (telefono || sitio_web) {
                    const contacto = [telefono, sitio_web].filter(Boolean).join(' · ');
                    texto_overlay = texto_overlay ? `${texto_overlay} · ${contacto}` : contacto;
                }

                const vireScript = {
                    format: 'story',
                    width: 1080,
                    height: 1920,
                    fps: 24,
                    empresa: empresa || '',
                    tema: 'still',
                    voice: { provider: 'none' },
                    subtitles: { enabled: false },
                    image_source: image_source || 'ia',
                    scenes: [{
                        type: 'text',
                        duration: 5,
                        animation: 'fade_in',
                        visual_style: visual_style || undefined,
                        brand_colors: brand_colors || undefined,
                        body: s.body || '',
                        items: s.items || undefined,
                        icono: s.icono || undefined,
                        icono_animacion: s.icono_animacion || undefined,
                        image_prompt: (estilo_visual_keywords ? `${estilo_visual_keywords}, ` : '')
                            + colorPromptHint
                            + (s.visual || `${s.title || ''} ${s.body || ''}`.substring(0, 200)),
                        image_url: s.image_url || undefined,
                        texto_overlay,
                        logo_url: logo_url || undefined,
                        avatar_url: avatar_url || undefined,
                    }],
                };

                const vireScriptPath = path.join(tmpDir, 'vire_script.json');
                const outputPngPath = path.join(tmpDir, 'still.png');
                fs.writeFileSync(vireScriptPath, JSON.stringify(vireScript, null, 2));

                serverLog('INFO', `[ViReStill] Renderizando frame único...`);
                await new Promise((resolve, reject) => {
                    const child = spawn('node', [
                        vireRenderScript,
                        '--guion', vireScriptPath,
                        '--output', outputPngPath,
                        '--empresa', empresa || 'ViRe',
                        '--still'
                    ], { cwd: vireDir });
                    let stderrTail = '';
                    const timer = setTimeout(() => {
                        child.kill();
                        reject(new Error('Timeout generando la imagen (90s)'));
                    }, 90000);
                    child.stderr.on('data', (d) => { stderrTail = (stderrTail + d.toString()).slice(-2000); });
                    child.on('error', (err) => { clearTimeout(timer); reject(err); });
                    child.on('close', (code) => {
                        clearTimeout(timer);
                        if (code === 0) resolve(); else reject(new Error(stderrTail || `render.js salió con código ${code}`));
                    });
                });

                if (!fs.existsSync(outputPngPath)) throw new Error('No se generó el archivo de imagen');
                const imgBase64 = fs.readFileSync(outputPngPath).toString('base64');
                fs.rmSync(tmpDir, { recursive: true, force: true });
                tmpDir = null;

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'success', image: `data:image/png;base64,${imgBase64}` }));
            } catch (e) {
                serverLog('ERROR', `[ViReStill] ${e.message}`);
                if (tmpDir && fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true, force: true });
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'error', error: e.message }));
            }
        });
        return;
    }

    // ViRe: estado de un job en curso (polling desde el front-end)
    if (pathname === '/api/vire-status' && req.method === 'GET') {
        const jobId = parsedUrl.searchParams.get('jobId');
        const job = vireJobs.get(jobId);
        if (!job) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'error', error: 'Job no encontrado (¿expiró?)' }));
            return;
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'ok',
            stage: job.stage,
            percent: job.percent,
            voiceTotal: job.voiceTotal,
            imageTotal: job.imageTotal,
            images: job.images,
            done: job.stage === 'done',
            error: job.error,
        }));
        return;
    }

    // ViRe: sirve el mp4 ya renderizado de un job (stream, no base64 — evita
    // duplicar ~33% de tamaño en el JSON y permite <video> nativo)
    if (pathname === '/api/vire-result' && req.method === 'GET') {
        const jobId = parsedUrl.searchParams.get('jobId');
        const job = vireJobs.get(jobId);
        if (!job || job.stage !== 'done' || !job.videoPath || !fs.existsSync(job.videoPath)) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'error', error: 'Video no disponible' }));
            return;
        }
        // El <video> de Chrome siempre pide un Range al cargar el src; si se
        // ignora y se responde 200 con el archivo completo, el reproductor se
        // queda cargando indefinidamente en vez de reproducir (confirmado en
        // pruebas de navegador) — hay que servir 206 Partial Content real.
        // Cross-Origin-Resource-Policy explícito: el servidor manda COEP
        // credentialless global (línea ~568) para otra feature — sin CORP en
        // esta respuesta, el <video> se queda "stalled" para siempre sin
        // ningún error visible (confirmado en pruebas de navegador reales).
        const fileSize = fs.statSync(job.videoPath).size;
        const range = req.headers.range;
        if (range) {
            const match = /bytes=(\d*)-(\d*)/.exec(range);
            const start = match[1] ? parseInt(match[1], 10) : 0;
            const end = match[2] ? parseInt(match[2], 10) : fileSize - 1;
            res.writeHead(206, {
                'Content-Type': 'video/mp4',
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': end - start + 1,
                'Cross-Origin-Resource-Policy': 'cross-origin',
            });
            fs.createReadStream(job.videoPath, { start, end }).pipe(res);
        } else {
            res.writeHead(200, { 'Content-Type': 'video/mp4', 'Accept-Ranges': 'bytes', 'Content-Length': fileSize, 'Cross-Origin-Resource-Policy': 'cross-origin' });
            fs.createReadStream(job.videoPath).pipe(res);
        }
        return;
    }

    // ViRe: cancela un job en curso (mata el proceso hijo)
    if (pathname === '/api/vire-cancel' && req.method === 'POST') {
        let body = '';
        req.on('data', d => body += d);
        req.on('end', () => {
            let jobId;
            try { ({ jobId } = JSON.parse(body)); } catch (_) { /* body vacío/mal formado */ }
            const job = vireJobs.get(jobId);
            if (job && job.child && job.stage !== 'done' && job.stage !== 'error') {
                job.child.kill();
                job.stage = 'cancelled';
                if (job.tmpDir && fs.existsSync(job.tmpDir)) fs.rmSync(job.tmpDir, { recursive: true, force: true });
                serverLog('INFO', `[ViRe] Job ${jobId} cancelado por el usuario`);
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'ok' }));
        });
        return;
    }

    // 🎨 ESTILOS VISUALES ENDPOINT (VIDE)
    if (pathname === '/api/estilos-visuales' && req.method === 'GET') {
        const empresa = parsedUrl.searchParams.get('empresa') || 'ALL';
        (async () => {
            try {
                const { data: cats, error: errCats } = await supabaseAdmin
                    .from('video_categorias_estilo')
                    .select('*')
                    .or(`id_empresa.eq.${empresa},id_empresa.eq.ALL`)
                    .eq('activo', true)
                    .order('id');
                if (errCats) throw errCats;
                const ids = cats.map(c => c.id);
                const { data: subs, error: errSubs } = await supabaseAdmin
                    .from('video_subestilos')
                    .select('*')
                    .in('id_categoria', ids)
                    .or(`id_empresa.eq.${empresa},id_empresa.eq.ALL`)
                    .eq('activo', true)
                    .order('id');
                if (errSubs) throw errSubs;
                const estilos = cats.map(c => ({
                    ...c,
                    subestilos: (subs || []).filter(s => s.id_categoria === c.id)
                }));
                res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'max-age=300' });
                res.end(JSON.stringify({ status: 'success', data: estilos }));
            } catch (e) {
                serverLog('ERROR', `[ESTILOS] ${e.message}`);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'error', error: e.message }));
            }
        })();
        return;
    }

    // 🎨✨ DIRECTOR DE ESTILO IA — genera un sub-estilo nuevo a partir de una
    // referencia en texto (o inventado si viene vacía) y lo persiste como
    // video_subestilos real, para que quede disponible en el selector normal
    // y alimente approveMediaPlan()/construirPromptGuion() sin tocar ese código.
    if (pathname === '/api/estilos-visuales/generar-ia' && req.method === 'POST') {
        let body = '';
        req.on('data', d => body += d);
        req.on('end', () => {
            (async () => {
                try {
                    const { empresa, nicho, tema, referencia, imagen_base64, imagen_mime } = JSON.parse(body);
                    if (!empresa) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ status: 'error', error: 'empresa es requerida' }));
                        return;
                    }

                    // Si viene una imagen de referencia, un modelo con visión la
                    // describe en texto primero — de ahí para abajo es EXACTAMENTE
                    // el mismo flujo que una referencia escrita a mano, para no
                    // duplicar la lógica de CAMP-STYLEDIRECTOR.
                    let referenciaFinal = referencia || '';
                    if (imagen_base64) {
                        serverLog('INFO', '[ESTILOS-IA] Describiendo imagen de referencia con modelo de visión...');
                        const descripcionImagen = await describirImagenReferencia(imagen_base64, imagen_mime || 'image/jpeg');
                        referenciaFinal = referenciaFinal
                            ? `${referenciaFinal}\n\nDescripción visual de la imagen de referencia:\n${descripcionImagen}`
                            : descripcionImagen;
                    }

                    const prompt = await loadPromptById('CAMP-STYLEDIRECTOR');

                    // Sin esto la IA no tiene memoria de sus propias generaciones
                    // anteriores y repite la misma idea obvia del nicho cada vez
                    // (ej. "Robots de Cocina Futuristas" x7 para Noe Thermomix) —
                    // se le pasa el catálogo real (de esta empresa + el compartido)
                    // para que evite proponer una variación menor de algo que ya existe.
                    const { data: existentes } = await supabaseAdmin
                        .from('video_subestilos')
                        .select('nombre, descripcion')
                        .or(`id_empresa.eq.${empresa},id_empresa.eq.ALL`)
                        .eq('activo', true);
                    const estilosExistentesStr = (existentes || [])
                        .map(s => `- ${s.nombre}${s.descripcion ? `: ${s.descripcion}` : ''}`)
                        .join('\n') || '(ninguno todavía)';

                    const userContent = `Nicho: ${nicho || '(no especificado)'}\nTema: ${tema || '(no especificado)'}\nReferencia del usuario: ${referenciaFinal || '(vacía — inventa un estilo original coherente con el nicho)'}\n\nEstilos que YA existen en el catálogo (no propongas una variación menor de estos, cambia de ángulo):\n${estilosExistentesStr}\n\nGenera el estilo visual como JSON válido.`;
                    const estilo = await callAIJson(prompt, userContent, 0.9);

                    // Auto-provisiona la categoría "Generado con IA" de esta empresa si
                    // no existe todavía — "si no existe, que ocurra la magia" también
                    // aplica a la categoría, no solo al sub-estilo.
                    const CAT_SLUG = 'ia-generado';
                    let { data: cat } = await supabaseAdmin
                        .from('video_categorias_estilo')
                        .select('*')
                        .eq('slug', CAT_SLUG)
                        .eq('id_empresa', empresa)
                        .maybeSingle();
                    if (!cat) {
                        const { data: nuevaCat, error: errCat } = await supabaseAdmin
                            .from('video_categorias_estilo')
                            .insert({ slug: CAT_SLUG, nombre: '✨ Generado con IA', icono: '✨', id_empresa: empresa, activo: true })
                            .select()
                            .single();
                        if (errCat) throw errCat;
                        cat = nuevaCat;
                    }

                    // Sufijo de timestamp: evita colisión de slug entre generaciones
                    // sucesivas sin depender de que la IA devuelva algo único.
                    const slugFinal = (estilo.slug || estilo.nombre || 'estilo-ia').toLowerCase()
                        .normalize('NFD').replace(/[̀-ͯ]/g, '')
                        .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') + '-' + Date.now().toString(36);

                    const { data: sub, error: errSub } = await supabaseAdmin
                        .from('video_subestilos')
                        .insert({
                            id_categoria: cat.id,
                            id_empresa: empresa,
                            slug: slugFinal,
                            nombre: estilo.nombre || 'Estilo IA',
                            descripcion: estilo.descripcion || '',
                            keywords_ia: estilo.keywords_ia || '',
                            activo: true
                        })
                        .select()
                        .single();
                    if (errSub) throw errSub;

                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        status: 'success',
                        data: { id: sub.id, cat: cat.slug, sub: sub.slug, nombre: sub.nombre, keywords: sub.keywords_ia }
                    }));
                } catch (e) {
                    serverLog('ERROR', `[ESTILOS-IA] ${e.message}`);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ status: 'error', error: e.message }));
                }
            })();
        });
        return;
    }

    // 📊 TENDENCIAS DE ESTILOS ENDPOINT (director) — lee uso real por empresa
    if (pathname === '/api/tendencias-estilo' && req.method === 'GET') {
        const empresa = parsedUrl.searchParams.get('empresa') || 'ALL';
        (async () => {
            try {
                // Filtra por id_empresa de la propia tabla de tendencias (uso real de
                // ESTA empresa), no de video_subestilos (que siempre es 'ALL' porque
                // los sub-estilos son compartidos) — ese filtro nunca hubiera
                // encontrado nada para ninguna empresa real.
                const { data, error } = await supabaseAdmin
                    .from('video_tendencias_estilo')
                    .select(`
                        puntuacion, fecha, fuente,
                        id_subestilo,
                        video_subestilos!inner(id, nombre, slug, keywords_ia, id_categoria)
                    `)
                    .eq('id_empresa', empresa)
                    .gte('fecha', new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0])
                    .order('puntuacion', { ascending: false });
                if (error) throw error;
                res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'max-age=300' });
                res.end(JSON.stringify({ status: 'success', data: data || [] }));
            } catch (e) {
                serverLog('ERROR', `[TENDENCIAS] ${e.message}`);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'error', error: e.message }));
            }
        })();
        return;
    }

    // 📈 REGISTRAR USO REAL DE UN ESTILO (alimenta al Director — "tendencia" =
    // lo que esta empresa realmente elige/genera, no una señal externa)
    if (pathname === '/api/tendencias-estilo' && req.method === 'POST') {
        let body = '';
        req.on('data', d => body += d);
        req.on('end', () => {
            (async () => {
                try {
                    const { id_subestilo, empresa } = JSON.parse(body);
                    if (!id_subestilo || !empresa) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ status: 'error', error: 'id_subestilo y empresa son requeridos' }));
                        return;
                    }
                    const fecha = new Date().toISOString().split('T')[0];
                    const { data: existing } = await supabaseAdmin
                        .from('video_tendencias_estilo')
                        .select('id, puntuacion')
                        .eq('id_subestilo', id_subestilo)
                        .eq('id_empresa', empresa)
                        .eq('fecha', fecha)
                        .maybeSingle();
                    if (existing) {
                        await supabaseAdmin.from('video_tendencias_estilo').update({ puntuacion: existing.puntuacion + 1 }).eq('id', existing.id);
                    } else {
                        await supabaseAdmin.from('video_tendencias_estilo').insert({ id_subestilo, id_empresa: empresa, fecha, puntuacion: 1, fuente: 'uso_real' });
                    }
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ status: 'success' }));
                } catch (e) {
                    serverLog('ERROR', `[TENDENCIAS-POST] ${e.message}`);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ status: 'error', error: e.message }));
                }
            })();
        });
        return;
    }

    // 🎯 CATÁLOGO DE PATTERN INTERRUPTS (por nicho, con 'GENERAL' de respaldo)
    if (pathname === '/api/pattern-interrupts' && req.method === 'GET') {
        const nicho = parsedUrl.searchParams.get('nicho') || 'GENERAL';
        (async () => {
            try {
                const { data, error } = await supabaseAdmin
                    .from('video_pattern_interrupts')
                    .select('*')
                    .or(`nicho.eq.${nicho},nicho.eq.GENERAL`)
                    .eq('activo', true)
                    .order('id');
                if (error) throw error;
                res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'max-age=300' });
                res.end(JSON.stringify({ status: 'success', data: data || [] }));
            } catch (e) {
                serverLog('ERROR', `[PATTERN-INTERRUPTS] ${e.message}`);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'error', error: e.message }));
            }
        })();
        return;
    }

    // 📋 LOGS ENDPOINT
    if (pathname === '/api/logs') {
        res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' });
        res.end(JSON.stringify(logBuffer.slice(-100)));
        return;
    }

    // Static Files
    let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);
    
    // Security: prevent path traversal
    const normalizedBase = path.resolve(__dirname);
    const normalizedFile = path.resolve(filePath);
    if (!normalizedFile.startsWith(normalizedBase) && !normalizedFile.startsWith(path.resolve(__dirname, '..'))) {
        res.writeHead(403); res.end('Forbidden'); return;
    }

    fs.readFile(filePath, (err, content) => {
        if (err) {
            // Try parent directory for sibling projects (e.g. PresentacionesVid)
            const parentPath = path.join(__dirname, '..', pathname);
            fs.readFile(parentPath, (err2, content2) => {
                if (err2) { res.writeHead(404); res.end('Not Found'); }
                else {
                    const ext = path.extname(parentPath).toLowerCase();
                    const mimeTypes = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };
                    res.writeHead(200, {
                        'Content-Type': mimeTypes[ext] || 'application/octet-stream',
                        'Cross-Origin-Opener-Policy': 'same-origin',
                        'Cross-Origin-Embedder-Policy': 'credentialless'
                    });
                    res.end(content2);
                }
            });
        }
        else {
            const ext = path.extname(filePath).toLowerCase();
            const mimeTypes = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };
            res.writeHead(200, {
                'Content-Type': mimeTypes[ext] || 'application/octet-stream',
                'Cross-Origin-Opener-Policy': 'same-origin',
                'Cross-Origin-Embedder-Policy': 'credentialless'
            });
            res.end(content);
        }
    });
});

async function callOpenRouter(model, messages, temperature = 0.7) {
    try {
        const response = await fetch(`${OMNIROUTE_BASE}/v1/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'http://localhost:8000',
                'X-Title': 'SuitCampanas Content Manager',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            body: JSON.stringify({
                model: model,
                messages: messages,
                temperature: temperature,
                stream: false,
                // Sin este tope, el default del gateway puede cortar a mitad un
                // guion de varias escenas (JSON válido pero incompleto — visto en
                // vivo generando 5 escenas para Toño Toques v2, la respuesta se
                // cortaba justo después de "config"). 4096 da margen de sobra para
                // el guion más largo real del schema.
                max_tokens: 4096
            }),
            // Sin esto, una ruta "auto/*" de OmniRoute que reintenta varios
            // proveedores por su cuenta puede tardar 2-3 MINUTOS en fallar
            // ("Maximum combo retry limit reached") — visto en vivo probando el
            // fix de respaldo con 2 modelos: el segundo modelo (openrouter/free)
            // dejó el endpoint colgado varios minutos antes de caer a Ollama/LM
            // Studio. 25s es generoso para una respuesta real (las exitosas
            // tardan 1-3s en los logs) pero corta cualquier intento colgado
            // rápido, dejando que el loop de respaldo pruebe el siguiente modelo.
            signal: AbortSignal.timeout(25000)
        });

        const data = await response.json();

        if (!response.ok) {
            const msg = data.error ? (data.error.message || data.error) : `Error HTTP ${response.status}`;
            // .status adjunto al error: el texto del mensaje no siempre menciona
            // "429" literal (depende del proveedor detrás de OmniRoute), así que
            // detectar rate-limit por el código HTTP real es más confiable que
            // buscar la palabra en el string.
            const error = new Error(msg);
            error.status = response.status;
            throw error;
        }

        if (data.choices && data.choices[0]) {
            return data.choices[0].message.content;
        } else {
            throw new Error("Respuesta de IA vacía o malformada");
        }
    } catch (error) {
        throw error;
    }
}

// Fallback local (Ollama) para cuando se agota el cupo gratuito de OmniRoute.
// Modelo default elegido tras probar 3 opciones reales en esta máquina (ver
// tabla arriba): qwen2.5-coder es el único que respetó la semántica del schema
// de BriefMarker sin ser inviablemente lento (los modelos "thinking" no
// terminaron ni en 4 minutos). num_predict como techo de seguridad, no como
// límite esperado — la respuesta real (~300-600 tokens) queda muy por debajo.
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_FALLBACK_MODEL = process.env.OLLAMA_FALLBACK_MODEL || 'qwen2.5-coder:latest';

// callOllama usa http.request en vez de fetch: el fetch global de undici tiene
// headersTimeout de 300s, y con stream:false Ollama no envía headers hasta
// terminar de generar — un prompt de MediaPlanner en CPU-only supera los 5 min
// y muere con "fetch failed" aunque la generación vaya bien. http.request no
// tiene ese límite; solo el timeout propio (120s de techo para lo inesperado).
function callOllama(model, systemContent, userContent, temperature = 0.7) {
    return new Promise((resolve, reject) => {
        const url = new URL(`${OLLAMA_URL}/api/generate`);
        const payload = JSON.stringify({
            model, system: systemContent, prompt: userContent, stream: false,
            options: { temperature, num_predict: 2000 }
        });
        const req = (url.protocol === 'https:' ? https : http).request(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload)
            },
            timeout: 900000
        }, res => {
            let body = '';
            res.on('data', d => body += d);
            res.on('end', () => {
                let data;
                try { data = JSON.parse(body); }
                catch (e) { return reject(new Error('Respuesta de Ollama malformada (no es JSON)')); }
                if (res.statusCode !== 200) return reject(new Error(data.error || `Error HTTP ${res.statusCode}`));
                if (!data.response) return reject(new Error('Respuesta de Ollama vacía o malformada'));
                resolve(data.response);
            });
        });
        req.on('error', e => reject(e));
        req.on('timeout', () => req.destroy(new Error(`Timeout de Ollama (${OLLAMA_FALLBACK_MODEL}) tras 15 min`)));
        req.write(payload);
        req.end();
    });
}

// Respaldo real cuando pytrends/Reddit devuelven pocos resultados — antes era
// texto hardcodeado sobre paneles solares (dejado de otro cliente) que salía
// igual sin importar el nicho real buscado. Ahora es una llamada de IA de
// verdad, genérica, con el nicho/sub-nicho/región reales inyectados.
async function generateAITrendFallback(niche, subNiche, region) {
    const messages = [
        { role: 'system', content: 'Eres un investigador de tendencias de contenido para redes sociales. Respondes EXCLUSIVAMENTE con un array JSON válido, nada de texto fuera de él.' },
        { role: 'user', content: `Genera 5 ideas de tendencias ACTUALES y REALISTAS para el nicho/industria "${niche || 'general'}"${subNiche ? `, sub-nicho: "${subNiche}"` : ''}, región: ${region || 'México'}.
Deben ser específicas de ESE nicho — no genéricas ni de otro giro.
Responde SOLO: [{"titulo": "...", "descripcion": "...", "score": (60-95, número)}]` }
    ];
    const orModels = ["openrouter/free", "deepseek/deepseek-v4-flash"]
        .map(toOmniRouteId)
        .filter((v, i, a) => a.indexOf(v) === i);

    for (const m of orModels) {
        try {
            const result = await callOpenRouter(m, messages, 0.7);
            const jsonStr = result.trim().replace(/```json|```/g, '');
            const parsed = JSON.parse(jsonStr);
            if (Array.isArray(parsed)) {
                return parsed.map(t => ({ titulo: t.titulo, descripcion: t.descripcion || '', fuente: 'IA (respaldo)', score: t.score || 70 }));
            }
        } catch (e) {
            serverLog('WARN', `⚠️ [TRENDS_AI_FALLBACK] ${m}: ${e.message}`);
        }
    }
    return [];
}

async function callLocalLMS(prompt) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            model: "qwen/qwen2.5-vl-7b",
            messages: [{ role: "user", content: prompt }]
        });

        const options = {
            hostname: '127.0.0.1',
            port: 1234,
            path: '/v1/chat/completions',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            // Sin esto se quedaba pensando indefinido con un guion real grande
            // (11KB de prompt) — nunca fallaba, solo tardaba, así que el fallback
            // a Ollama (con un modelo mejor para JSON, ver OLLAMA_FALLBACK_MODEL)
            // nunca llegaba a intentarse. 120s es generoso para este modelo de 7B.
            timeout: 120000
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', d => data += d);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (json.choices && json.choices[0]) {
                        resolve(json.choices[0].message.content);
                    } else {
                        reject(new Error("Respuesta local incompleta"));
                    }
                } catch (e) { reject(new Error("Error parsing Local LMS JSON")); }
            });
        });
        req.on('error', e => reject(e));
        req.on('timeout', () => req.destroy(new Error('Timeout de LM Studio tras 120s')));
        req.write(postData);
        req.end();
    });
}

function fetchWithRedirects(url, callback) {
    const options = {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
    };

    https.get(url, options, (res) => {
        // Manejar Redirecciones (301, 302, 307, 308)
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            let nextUrl = res.headers.location;
            // Si la URL es relativa, unirla
            if (!nextUrl.startsWith('http')) {
                const origin = new URL(url).origin;
                nextUrl = new URL(nextUrl, origin).href;
            }
            serverLog('INFO', `↪️ Redireccionando a: ${nextUrl}`);
            return fetchWithRedirects(nextUrl, callback);
        }

        let data = '';
        res.on('data', d => data += d);
        res.on('end', () => {
            // Verificar si la respuesta parece HTML o texto plano en lugar de JSON
            const trimmed = data.trim();
            if (trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html') || !trimmed.startsWith('{')) {
                serverLog('WARN', "⚠️ [PROXY] Respuesta no válida (posible error de Google o Redirección):");
                serverLog('INFO', trimmed.substring(0, 500));
                
                const errorObj = { 
                    status: 'error', 
                    message: trimmed.includes('Not Found') ? 'URL de Google no válida o no publicada' : 'Respuesta errónea de Google',
                    raw: trimmed.substring(0, 100)
                };
                callback(JSON.stringify(errorObj), 200);
            } else {
                callback(data, res.statusCode);
            }
        });
    }).on('error', (e) => {
        serverLog('ERROR', "❌ [PROXY_ERROR]:", e.message);
        callback(JSON.stringify({ status: 'error', message: e.message }), 500);
    });
}



server.listen(PORT, () => {
    serverLog('INFO', `🚀 SuitCampanas Server (Puerto ${PORT}) - Multi-Model OpenRouter`);

    // Auto-sync de Prompts_IA cada 5 minutos
    setInterval(async () => {
        try {
            const syncUrl = GAS_URL + '?action=getAll';
            const gasData = await new Promise((resolve, reject) => {
                fetchWithRedirects(syncUrl, (body) => {
                    try { resolve(JSON.parse(body)); }
                    catch (e) { reject(new Error('GAS parse error: ' + body.substring(0, 200))); }
                });
            });
            const rows = gasData?.Prompts_IA || gasData?.data?.Prompts_IA || [];
            let count = 0;
            for (const row of rows) {
                if (!row.id_agente) continue;
                const { error } = await supabase
                    .from('Prompts_IA')
                    .upsert({
                        id_agente: row.id_agente,
                        id_empresa: row.id_empresa || 'GLOBAL',
                        nombre: row.nombre || '',
                        prompt_base: row.prompt_base || '',
                        habilitado: row.habilitado || 'TRUE',
                        nivel_acceso: row.nivel_acceso || '1',
                        recibe_files: row.recibe_files || 'FALSE'
                    }, { onConflict: 'id_agente,id_empresa' });
                if (!error) count++;
            }
            promptsCache = {};
            promptsLastSync = Date.now();
            serverLog('INFO', `[AUTO-SYNC] Prompts sincronizados: ${count}`);
        } catch (e) {
            serverLog('WARN', `[AUTO-SYNC] Error: ${e.message}`);
        }
    }, 5 * 60 * 1000);
});
