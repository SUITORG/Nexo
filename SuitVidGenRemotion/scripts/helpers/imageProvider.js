const https = require('https');
const fs = require('fs');
const path = require('path');

const POLLINATIONS_BASE = 'https://image.pollinations.ai/prompt';

function checkUrl(url) {
  return new Promise((resolve) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 5000 }, (res) => {
      resolve(res.statusCode === 200);
      res.resume();
    }).on('error', () => resolve(false));
  });
}

async function generateImage(prompt, options = {}) {
  const { width = 1080, height = 1920 } = options;
  if (!prompt) return null;

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
