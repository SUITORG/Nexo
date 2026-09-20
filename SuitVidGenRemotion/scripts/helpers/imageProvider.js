const https = require('https');
const fs = require('fs');
const path = require('path');

const POLLINATIONS_BASE = 'https://image.pollinations.ai/prompt';
const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
// Imagen local real vía SuitComfy (../../SuitComfy, wrapper propio puerto 3012
// -> ComfyUI/Comfy-Desktop :8188). CPU-only en esta máquina: ~1-2 min por
// imagen, por eso el timeout es mucho más largo que Pollinations/Pexels.
const COMFY_WRAPPER_URL = process.env.COMFY_WRAPPER_URL || 'http://127.0.0.1:3012';

async function generateImageComfy(prompt, width, height) {
  try {
    const res = await fetch(`${COMFY_WRAPPER_URL}/api/image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, width, height }),
      signal: AbortSignal.timeout(150000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const imgPath = data.images?.[0]?.path;
    if (!imgPath || !fs.existsSync(imgPath)) throw new Error('SuitComfy no devolvió una imagen válida');
    const buf = fs.readFileSync(imgPath);
    return `data:image/png;base64,${buf.toString('base64')}`;
  } catch (e) {
    console.warn(`[Comfy] No se pudo generar imagen (¿está corriendo SuitComfy en :3012 y ComfyUI en :8188?): ${e.message}`);
    return null;
  }
}

function checkUrl(url) {
  return new Promise((resolve) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 5000 }, (res) => {
      resolve(res.statusCode === 200);
      res.resume();
    }).on('error', () => resolve(false));
  });
}

// Respaldo cuando Pollinations no responde — mismo helper que usa VIDE
// (local-server-node.js), foto de stock real en vez de dejar la escena sin
// imagen. query recortada a pocas palabras: Pexels busca mejor así.
async function searchPexels(query, width, height) {
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
    console.warn(`Pexels search failed: ${e.message}`);
    return null;
  }
}

// Mismo criterio que searchPexels — fuente de stock alternativa, requiere
// UNSPLASH_ACCESS_KEY en .env (gratis en unsplash.com/developers).
async function searchUnsplash(query, width, height) {
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
    console.warn(`Unsplash search failed: ${e.message}`);
    return null;
  }
}

// Wikimedia Commons: API pública, sin key. El licenciamiento varía por archivo
// (CC0, CC-BY, CC-BY-SA...) — normalmente exige atribución, que este pipeline
// no agrega automáticamente. "filetype:bitmap" filtra SVG/PDF (diagramas,
// íconos) para quedarse con fotos reales.
async function searchWikimedia(query, width, height) {
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
    console.warn(`Wikimedia search failed: ${e.message}`);
    return null;
  }
}

async function generateImage(prompt, options = {}) {
  const { width = 1080, height = 1920, imageSource } = options;
  if (!prompt) return null;

  if (imageSource === 'pexels') {
    // Selector manual: ni se intenta Pollinations, va directo a la foto de stock.
    const pexelsUrl = await searchPexels(prompt, width, height);
    if (pexelsUrl) return pexelsUrl;
    console.warn(`Pexels sin resultado para "${prompt.slice(0, 30)}...", using placeholder`);
    return null;
  }

  if (imageSource === 'unsplash') {
    const unsplashUrl = await searchUnsplash(prompt, width, height);
    if (unsplashUrl) return unsplashUrl;
    console.warn(`Unsplash sin resultado para "${prompt.slice(0, 30)}...", using placeholder`);
    return null;
  }

  if (imageSource === 'wikimedia') {
    const wikimediaUrl = await searchWikimedia(prompt, width, height);
    if (wikimediaUrl) return wikimediaUrl;
    console.warn(`Wikimedia sin resultado para "${prompt.slice(0, 30)}...", using placeholder`);
    return null;
  }

  if (imageSource === 'comfy') {
    const comfyUrl = await generateImageComfy(prompt, width, height);
    if (comfyUrl) return comfyUrl;
    const pexelsUrl = await searchPexels(prompt, width, height);
    if (pexelsUrl) {
      console.warn(`SuitComfy no disponible, usando foto de stock de Pexels`);
      return pexelsUrl;
    }
    return null;
  }

  // ViRe: orientar Pollinations hacia foto realista en vez de su default
  // "AI genérico". Flux es el modelo fotográfico; el prefijo de estilo es el
  // mismo que ya usa el flujo VIDE (local-server-node.js) y el sufijo evita
  // texto inventado que los modelos de difusión no saben renderizar.
  const fullPrompt = 'professional commercial photography, photorealistic, 8k, soft studio lighting, ' + prompt + ', no text, no readable signage, no logos, no writing';
  const seed = Math.floor(Math.random() * 1000000);
  const encoded = encodeURIComponent(fullPrompt);
  const url = `${POLLINATIONS_BASE}/${encoded}?width=${width}&height=${height}&seed=${seed}&model=flux&nofeed=true&nojson=true`;

  if (process.env.VIRE_IMAGE_PROVIDER === 'kie') {
    return null;
  }

  const ok = await checkUrl(url);
  if (ok) {
    return url;
  }

  const pexelsUrl = await searchPexels(prompt, width, height);
  if (pexelsUrl) {
    console.warn(`Pollinations unavailable for "${prompt.slice(0, 30)}...", using Pexels stock photo`);
    return pexelsUrl;
  }

  console.warn(`Pollinations unavailable for "${prompt.slice(0, 30)}...", using placeholder`);
  return null;
}

async function generateAllImages(scenes, options = {}) {
  const { onImage, ...genOptions } = options;
  const total = scenes.length;
  const results = [];
  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    let imgUrl = null;
    if (scene.image_url) {
      imgUrl = scene.image_url;
    } else if (scene.image_prompt) {
      imgUrl = await generateImage(scene.image_prompt, genOptions);
    }
    results.push(imgUrl);
    if (onImage) onImage({ index: i, total, url: imgUrl, prompt: scene.image_prompt || null });
  }
  return results;
}

module.exports = { generateImage, generateAllImages };
