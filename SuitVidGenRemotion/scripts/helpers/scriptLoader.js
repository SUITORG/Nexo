const fs = require('fs');
const path = require('path');

function validateScript(script) {
  if (!script.scenes || !Array.isArray(script.scenes) || script.scenes.length === 0) {
    throw new Error('Script must have at least one scene');
  }
  const validTypes = ['intro', 'text', 'product', 'outro'];
  for (const s of script.scenes) {
    if (!validTypes.includes(s.type)) {
      throw new Error(`Invalid scene type: ${s.type}`);
    }
    if (!s.duration || s.duration <= 0) {
      throw new Error(`Scene must have positive duration`);
    }
  }
  return true;
}

function loadFromFile(filePath) {
  const absPath = path.resolve(filePath);
  const raw = fs.readFileSync(absPath, 'utf-8');
  const script = JSON.parse(raw);
  validateScript(script);
  return script;
}

function applyDefaults(script) {
  return {
    format: script.format || 'custom',
    width: script.width || 1080,
    height: script.height || 1920,
    fps: script.fps || 30,
    subtitles: script.subtitles || { enabled: true, style: 'classic' },
    voice: script.voice || { provider: 'edge_tts', voice: 'es-MX-DaliaNeural' },
    background_music: script.background_music,
    scenes: script.scenes || [],
  };
}

module.exports = { loadFromFile, validateScript, applyDefaults };
