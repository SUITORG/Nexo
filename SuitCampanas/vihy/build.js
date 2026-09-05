#!/usr/bin/env node
/**
 * ViHy pilot: genera assets (imagen + audio) y compone un video de prueba
 * con HyperFrames para comparar con ViRe (Remotion).
 *
 * Uso: node vihy/build.js
 */
const fs = require('fs');
const path = require('path');
const https = require('https');
const { spawnSync } = require('child_process');

const ASSETS_DIR = path.join(__dirname, 'assets');
const OUTPUT_DIR = path.join(__dirname, 'output');
const POLLINATIONS_BASE = 'https://image.pollinations.ai/prompt';

// Guion café (mismo que tmp_vire_1785970184547)
const SCENES = [
  {
    id: 'intro',
    duration: 4,
    text: '',
    voiceText: '',
  },
  {
    id: 'main',
    duration: 8,
    text: 'Taza de café artesanal',
    voiceText: 'Disfruta de una taza de café artesanal, preparado con los mejores granos de la región.',
    imagePrompt: 'professional commercial photography, photorealistic, 8k, soft studio lighting, taza de café caliente humeando en mesa de madera con luz cálida y sombras suaves, ángulo ligeramente elevado, composición centrada con el café como punto focal, no text, no readable signage, no logos, no writing',
  },
  {
    id: 'outro',
    duration: 4,
    text: '¡Contáctanos!',
    voiceText: '¡Contáctanos!',
  },
];

function downloadImage(prompt, destPath, width = 1080, height = 1920) {
  return new Promise((resolve, reject) => {
    const seed = Math.floor(Math.random() * 1000000);
    const encoded = encodeURIComponent(prompt);
    const url = `${POLLINATIONS_BASE}/${encoded}?width=${width}&height=${height}&seed=${seed}&model=flux&nofeed=true&nojson=true`;
    console.log(`  📸 Descargando imagen...`);
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 60000 }, (res) => {
      if (res.statusCode === 200) {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const buf = Buffer.concat(chunks);
          if (buf.length > 100 && ((buf[0] === 0x89 && buf[1] === 0x50) || (buf[0] === 0xFF && buf[1] === 0xD8))) {
            fs.writeFileSync(destPath, buf);
            console.log(`  ✅ Imagen guardada: ${path.basename(destPath)} (${(buf.length / 1024).toFixed(0)} KB)`);
            resolve(destPath);
          } else {
            reject(new Error('Respuesta no es imagen válida'));
          }
        });
      } else {
        reject(new Error(`HTTP ${res.statusCode}`));
      }
    }).on('error', reject);
  });
}

function generateTTS(text, destPath, voice = 'es-MX-DaliaNeural') {
  if (!text) return null;
  console.log(`  🔊 Generando TTS: "${text.substring(0, 40)}..."`);
  const result = spawnSync('python', ['-m', 'edge_tts', '--voice', voice, '--text', text, '--write-media', destPath], { timeout: 30000 });
  if (result.status === 0 && fs.existsSync(destPath)) {
    console.log(`  ✅ Audio guardado: ${path.basename(destPath)}`);
    return destPath;
  }
  console.warn(`  ⚠️  Edge TTS falló, usando gTTS...`);
  // Fallback gTTS
  const gttsResult = spawnSync('python', ['-c', `from gtts import gTTS; gTTS("${text.replace(/"/g, '\\"')}", lang='es').save("${destPath.replace(/\\/g, '\\\\')}")`], { timeout: 30000 });
  if (gttsResult.status === 0 && fs.existsSync(destPath)) {
    console.log(`  ✅ Audio guardado (gTTS): ${path.basename(destPath)}`);
    return destPath;
  }
  return null;
}

function getAudioDurationMs(filePath) {
  const result = spawnSync('ffprobe', ['-v', 'quiet', '-print_format', 'json', '-show_format', filePath], { timeout: 10000 });
  if (result.status === 0) {
    try {
      const info = JSON.parse(result.stdout.toString());
      return Math.round(parseFloat(info.format.duration) * 1000);
    } catch (_) {}
  }
  return 4000; // fallback
}

async function main() {
  console.log('🎬 ViHy Pilot — Generando video de prueba con HyperFrames\n');

  fs.mkdirSync(ASSETS_DIR, { recursive: true });
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // 1. Generar imagen de la escena principal
  const mainScene = SCENES[1];
  const imagePath = path.join(ASSETS_DIR, 'cafe.jpg');
  if (!fs.existsSync(imagePath)) {
    await downloadImage(mainScene.imagePrompt, imagePath);
  } else {
    console.log(`  📸 Imagen ya existe: ${path.basename(imagePath)}`);
  }

  // 2. Generar audios TTS
  const audioFiles = [];
  for (const scene of SCENES) {
    if (scene.voiceText) {
      const audioPath = path.join(ASSETS_DIR, `voice_${scene.id}.mp3`);
      if (!fs.existsSync(audioPath)) {
        generateTTS(scene.voiceText, audioPath);
      } else {
        console.log(`  🔊 Audio ya existe: ${path.basename(audioPath)}`);
      }
      audioFiles.push({ scene: scene.id, path: audioPath });
    }
  }

  // 3. Obtener duraciones de audio
  const durations = {};
  for (const af of audioFiles) {
    durations[af.scene] = getAudioDurationMs(af.path);
  }

  // 4. Crear composición HyperFrames
  const totalDuration = SCENES.reduce((sum, s) => sum + s.duration, 0);
  const mainStart = SCENES[0].duration;
  const outroStart = mainStart + SCENES[1].duration;
  const audioRelPath = (p) => path.relative(__dirname, p).replace(/\\/g, '/');

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=1080, height=1920">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { width: 1080px; height: 1920px; overflow: hidden; font-family: system-ui, -apple-system, sans-serif; }
    .scene { position: absolute; inset: 0; display: flex; flex-direction: column; justify-content: center; align-items: center; }
    .bg-cafe { background: linear-gradient(180deg, #1a0e08 0%, #2d1810 50%, #0f0a07 100%); }
    .bg-dark { background: linear-gradient(180deg, #0a1628 0%, #162038 50%, #0a1628 100%); }
    .cafe-img { width: 100%; height: 100%; object-fit: cover; position: absolute; inset: 0; }
    .cafe-gradient { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.1) 45%, rgba(0,0,0,0.65) 100%); }
    .title { position: relative; z-index: 2; color: #fff; font-size: 56px; font-weight: 800; text-align: center; text-shadow: 0 4px 20px rgba(0,0,0,0.5); padding: 0 60px; }
    .cta { position: relative; z-index: 2; color: #fff; font-size: 64px; font-weight: 800; text-align: center; text-shadow: 0 4px 20px rgba(0,0,0,0.5); }
    .logo { position: absolute; top: 80px; left: 50%; transform: translateX(-50%); z-index: 3; width: 120px; height: 120px; background: linear-gradient(135deg, #7c3aed, #a78bfa); border-radius: 24px; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 48px; font-weight: 800; box-shadow: 0 8px 32px rgba(124,58,237,0.4); }
    .subtitle { position: relative; z-index: 2; color: rgba(255,255,255,0.7); font-size: 32px; text-align: center; margin-top: 20px; text-shadow: 0 2px 10px rgba(0,0,0,0.3); }
    .badge { position: absolute; bottom: 40px; right: 40px; z-index: 3; background: rgba(255,255,255,0.15); backdrop-filter: blur(10px); padding: 12px 24px; border-radius: 12px; color: #fff; font-size: 24px; font-weight: 600; }
  </style>
</head>
<body>
  <div data-composition-id="vihy-cafe" data-start="0" data-duration="${totalDuration}" data-width="1080" data-height="1920">

    <!-- ESCENA 1: Intro (4s) -->
    <div class="scene bg-dark" data-start="0" data-duration="${SCENES[0].duration}">
      <div class="logo">V</div>
      <div class="title" style="margin-top: 40px;">Café Artesanal</div>
      <div class="subtitle">Calidad que se siente en cada sorbo</div>
    </div>

    <!-- ESCENA 2: Producto (8s) — imagen realista con gradiente -->
    <div class="scene" data-start="${mainStart}" data-duration="${SCENES[1].duration}">
      <img class="cafe-img" src="${audioRelPath(imagePath)}" />
      <div class="cafe-gradient"></div>
      <div class="title">${mainScene.text}</div>
    </div>

    <!-- ESCENA 3: Outro (4s) — CTA -->
    <div class="scene bg-dark" data-start="${outroStart}" data-duration="${SCENES[2].duration}">
      <div class="cta">${SCENES[2].text}</div>
      <div class="subtitle" style="margin-top: 30px;">grupoevasol.com</div>
    </div>

    <!-- Audio de voz -->
    ${audioFiles.map(af => `<audio data-start="${SCENES.find(s => s.id === af.scene)?.id === 'intro' ? 0 : SCENES.filter(s => s.id !== 'intro').reduce((sum, s, i) => { const idx = SCENES.indexOf(s); return idx <= SCENES.findIndex(x => x.id === af.scene) ? sum : sum + s.duration; }, 0)}" src="${audioRelPath(af.path)}" />`).join('\n    ')}

  </div>
</body>
</html>`;

  const compositionPath = path.join(__dirname, 'composition.html');
  fs.writeFileSync(compositionPath, html);
  console.log(`\n📄 Composición creada: vihy/composition.html`);

  // 5. Renderizar con HyperFrames
  console.log(`\n🎥 Renderizando con HyperFrames...`);
  const outputPath = path.join(OUTPUT_DIR, 'vihy_cafe.mp4');
  const renderResult = spawnSync('npx', ['hyperframes', 'render', 'composition.html', '--output', outputPath], {
    cwd: __dirname,
    timeout: 120000,
    stdio: 'inherit',
  });

  if (renderResult.status === 0 && fs.existsSync(outputPath)) {
    console.log(`\n✅ Video ViHy renderizado: ${outputPath}`);
  } else {
    console.log(`\n⚠️  Render falló o no disponible. La composición HTML está lista para preview en navegador.`);
    console.log(`   Abre vihy/composition.html en Chrome para ver la composición.`);
  }

  // 6. Crear página de comparación
  const compareHtml = createComparisonPage(outputPath);
  const comparePath = path.join(__dirname, 'compare.html');
  fs.writeFileSync(comparePath, compareHtml);
  console.log(`\n📊 Página de comparación: vihy/compare.html`);
  console.log(`   Abre compare.html en tu navegador para ver ViRe vs ViHy lado a lado.`);
}

function createComparisonPage(vihyPath) {
  const vireRelative = '../tmp_vire_1785970184547/vire_output.mp4';
  const vihyRelative = path.relative(__dirname, vihyPath).replace(/\\/g, '/');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ViRe vs ViHy — Comparación</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      background: #0f172a;
      color: #e2e8f0;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px 20px;
    }
    h1 {
      font-size: 32px;
      font-weight: 800;
      margin-bottom: 8px;
      background: linear-gradient(135deg, #7c3aed, #a78bfa);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .subtitle {
      color: #94a3b8;
      font-size: 16px;
      margin-bottom: 40px;
    }
    .container {
      display: flex;
      gap: 40px;
      max-width: 1200px;
      width: 100%;
      justify-content: center;
      flex-wrap: wrap;
    }
    .player {
      background: #1e293b;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0,0,0,0.4);
      flex: 1;
      max-width: 400px;
      min-width: 300px;
    }
    .player-header {
      padding: 20px 24px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .badge-re {
      background: linear-gradient(135deg, #ef4444, #f97316);
      padding: 6px 16px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 700;
      color: #fff;
    }
    .badge-hy {
      background: linear-gradient(135deg, #7c3aed, #06b6d4);
      padding: 6px 16px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 700;
      color: #fff;
    }
    .player-title {
      font-size: 18px;
      font-weight: 600;
    }
    .player video {
      width: 100%;
      display: block;
      background: #000;
    }
    .player-info {
      padding: 16px 24px;
      border-top: 1px solid #334155;
      font-size: 14px;
      color: #94a3b8;
      line-height: 1.6;
    }
    .player-info strong {
      color: #e2e8f0;
    }
    .controls {
      margin-top: 30px;
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
      justify-content: center;
    }
    .btn {
      padding: 12px 28px;
      border: none;
      border-radius: 10px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn:hover { transform: translateY(-2px); }
    .btn-play {
      background: linear-gradient(135deg, #7c3aed, #a78bfa);
      color: #fff;
    }
    .btn-play:hover { box-shadow: 0 8px 24px rgba(124,58,237,0.4); }
    .btn-sync {
      background: #334155;
      color: #e2e8f0;
    }
    .btn-sync:hover { background: #475569; }
    .notes {
      margin-top: 40px;
      max-width: 800px;
      background: #1e293b;
      border-radius: 12px;
      padding: 24px;
      border-left: 4px solid #7c3aed;
    }
    .notes h3 {
      font-size: 18px;
      margin-bottom: 12px;
      color: #a78bfa;
    }
    .notes ul {
      list-style: none;
      padding: 0;
    }
    .notes li {
      padding: 8px 0;
      border-bottom: 1px solid #334155;
      color: #cbd5e1;
    }
    .notes li:last-child { border-bottom: none; }
    .notes code {
      background: #334155;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 13px;
      color: #7c3aed;
    }
  </style>
</head>
<body>
  <h1>ViRe vs ViHy</h1>
  <p class="subtitle">Remotion vs HyperFrames — Mismo guion, misma imagen, diferente render</p>

  <div class="container">
    <div class="player" id="vire">
      <div class="player-header">
        <span class="badge-re">ViRe</span>
        <span class="player-title">Remotion (React)</span>
      </div>
      <video id="video-re" src="${vireRelative}" loop playsinline></video>
      <div class="player-info">
        <strong>Stack:</strong> React + TypeScript + Remotion<br>
        <strong>Rendering:</strong> Remotion Renderer (custom)<br>
        <strong>Componentes:</strong> TextScene.tsx, IntroScene.tsx, OutroScene.tsx<br>
        <strong>Imagen:</strong> Pollinations (sin model param)
      </div>
    </div>

    <div class="player" id="vihy">
      <div class="player-header">
        <span class="badge-hy">ViHy</span>
        <span class="player-title">HyperFrames (HTML)</span>
      </div>
      <video id="video-hy" src="${vihyRelative}" loop playsinline></video>
      <div class="player-info">
        <strong>Stack:</strong> HTML + CSS (vanilla)<br>
        <strong>Rendering:</strong> Headless Chrome + FFmpeg<br>
        <strong>Componentes:</strong> composition.html (data-* attrs)<br>
        <strong>Imagen:</strong> Pollinations (model=flux, photorealistic)
      </div>
    </div>
  </div>

  <div class="controls">
    <button class="btn btn-play" onclick="playBoth()">▶ Play Both</button>
    <button class="btn btn-sync" onclick="syncPlay()">↻ Sync</button>
    <button class="btn btn-sync" onclick="pauseBoth()">⏸ Pause</button>
  </div>

  <div class="notes">
    <h3>Lo que cambia</h3>
    <ul>
      <li><strong>ViRe</strong> usa React components + Remotion bundler. La imagen se renderiza a <code>opacity: 0.25</code> como fondo.</li>
      <li><strong>ViHy</strong> usa HTML puro + CSS. La imagen se muestra completa con gradiente oscuro solo detrás del texto.</li>
      <li><strong>Imagen:</strong> ViHy usa <code>model=flux</code> + prefijo "professional commercial photography". ViRe no.</li>
      <li><strong>Render:</strong> ViRe necesita Remotion Studio/bundler. ViHy necesita solo Chrome + FFmpeg.</li>
      <li><strong>Preview:</strong> ViHy puedes abrir <code>composition.html</code> en cualquier navegador.</li>
    </ul>
  </div>

  <script>
    function playBoth() {
      document.getElementById('video-re').play();
      document.getElementById('video-hy').play();
    }
    function pauseBoth() {
      document.getElementById('video-re').pause();
      document.getElementById('video-hy').pause();
    }
    function syncPlay() {
      const re = document.getElementById('video-re');
      const hy = document.getElementById('video-hy');
      re.currentTime = 0;
      hy.currentTime = 0;
      re.play();
      hy.play();
    }
  </script>
</body>
</html>`;
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
