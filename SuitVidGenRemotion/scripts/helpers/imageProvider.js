const https = require('https');
const fs = require('fs');
const path = require('path');

const POLLINATIONS_BASE = 'https://image.pollinations.ai/prompt';
const PEXELS_API_KEY = process.env.PEXELS_API_KEY;

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
