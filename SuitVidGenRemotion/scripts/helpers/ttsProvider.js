const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');

const TTS_BASE = 'https://translate.google.com/translate_tts';
const MAX_CHARS = 180;

function downloadTTS(text, lang, speed, destPath) {
  return new Promise((resolve, reject) => {
    const params = new URLSearchParams({
      ie: 'UTF-8',
      q: text,
      tl: lang || 'es',
      client: 'tw-ob',
      ttsspeed: speed != null ? String(speed) : '1',
    });
    const url = `${TTS_BASE}?${params.toString()}`;

    const file = fs.createWriteStream(destPath);
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode === 200) {
        res.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve(destPath);
        });
      } else {
        res.resume();
        reject(new Error(`TTS HTTP ${res.statusCode}`));
      }
    }).on('error', (err) => {
      fs.unlink(destPath, () => {});
      reject(err);
    });
  });
}

async function generateVoice(text, options = {}) {
  if (!text) return null;

  const {
    lang = 'es',
    speed = 1.0,
    outputDir,
    index = 0,
  } = options;

  // Cache key must depend on content (text+lang+speed), not just scene index:
  // with an index-only key, a stale audio file from a previous unrelated
  // guion is silently reused for the "same" scene position on every render.
  const contentHash = crypto.createHash('md5').update(`${text}|${lang}|${speed}`).digest('hex').slice(0, 10);
  const fileName = `voice_${index}_${contentHash}.mp3`;
  const destPath = outputDir ? path.join(outputDir, fileName) : null;

  if (destPath && fs.existsSync(destPath)) {
    const relPath = path.relative(
      path.resolve(__dirname, '../../public'),
      destPath
    ).replace(/\\/g, '/');
    return { file: relPath, durationMs: 0 };
  }

  try {
    const chunks = [];
    let remaining = text;
    while (remaining.length > 0) {
      let chunk = remaining.slice(0, MAX_CHARS);
      const lastSpace = chunk.lastIndexOf(' ');
      if (remaining.length > MAX_CHARS && lastSpace > 0) {
        chunk = remaining.slice(0, lastSpace);
      }
      chunks.push(chunk);
      remaining = remaining.slice(chunk.length);
    }

    if (destPath) {
      const tempFiles = [];
      for (let i = 0; i < chunks.length; i++) {
        const tempFile = destPath.replace('.mp3', `_part${i}.mp3`);
        await downloadTTS(chunks[i], lang, speed, tempFile);
        tempFiles.push(tempFile);
      }

      if (chunks.length === 1) {
        fs.renameSync(tempFiles[0], destPath);
      } else {
        const { Buffer } = require('buffer');
        const buffers = tempFiles.map((f) => fs.readFileSync(f));
        fs.writeFileSync(destPath, Buffer.concat(buffers));
        tempFiles.forEach((f) => fs.unlinkSync(f));
      }
    }

    const relPath = destPath
      ? path.relative(path.resolve(__dirname, '../../public'), destPath).replace(/\\/g, '/')
      : null;

    const charsPerSecond = 15;
    const estimatedDurationMs = Math.round((text.length / charsPerSecond) * 1000);

    return { file: relPath, durationMs: estimatedDurationMs };
  } catch (err) {
    console.warn(`TTS failed for "${text.slice(0, 40)}...": ${err.message}`);
    return null;
  }
}

async function generateAllVoices(scenes, options = {}) {
  const results = [];
  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    const voiceText = scene.voice_text;
    if (voiceText) {
      const result = await generateVoice(voiceText, { ...options, index: i });
      results.push(result?.file || null);
    } else {
      results.push(null);
    }
  }
  return results;
}

module.exports = { generateVoice, generateAllVoices };
