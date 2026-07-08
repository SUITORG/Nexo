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

  const encoded = encodeURIComponent(prompt);
  const url = `${POLLINATIONS_BASE}/${encoded}?width=${width}&height=${height}&nofeed=true&nojson=true`;

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
  const results = [];
  for (const scene of scenes) {
    if (scene.image_url) {
      results.push(scene.image_url);
    } else if (scene.image_prompt) {
      const imgUrl = await generateImage(scene.image_prompt, options);
      results.push(imgUrl);
    } else {
      results.push(null);
    }
  }
  return results;
}

module.exports = { generateImage, generateAllImages };
