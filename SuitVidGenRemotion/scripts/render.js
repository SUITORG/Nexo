#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { bundle } = require('@remotion/bundler');
const { renderMedia, renderStill, selectComposition } = require('@remotion/renderer');
const { enableTailwind } = require('@remotion/tailwind-v4');
const { loadFromFile, applyDefaults } = require('./helpers/scriptLoader');
const { generateAllVoices } = require('./helpers/ttsProvider');
const { generateAllImages } = require('./helpers/imageProvider');
const { resolveAllIcons } = require('./helpers/iconProvider');

const PROJECT_DIR = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(PROJECT_DIR, 'public');
const AUDIO_DIR = path.join(PUBLIC_DIR, 'generated', 'audio');
const IMAGES_DIR = path.join(PUBLIC_DIR, 'generated', 'images');

// Línea reconocible en stdout para que local-server-node.js (que hace spawn de
// este script como hijo) parsee el avance real sin pipes/archivos nuevos.
function reportProgress(data) {
  console.log(`##VIRE_PROGRESS##${JSON.stringify(data)}`);
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { guion: null, output: null, empresa: null, auto: false, still: false };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--guion' && args[i + 1]) opts.guion = args[++i];
    else if (args[i] === '--output' && args[i + 1]) opts.output = args[++i];
    else if (args[i] === '--empresa' && args[i + 1]) opts.empresa = args[++i];
    else if (args[i] === '--auto') opts.auto = true;
    // --still: una sola imagen (frame fijo del template, sin voz/video) en vez
    // de renderizar el video completo — usado por /api/vire-still para el
    // switch "Solo Imagen" (VIDE/ViRe comparten el mismo botón/estilo).
    else if (args[i] === '--still') opts.still = true;
  }

  return opts;
}

async function main() {
  const opts = parseArgs();

  if (!opts.guion) {
    console.error('Uso: node render.js --guion <archivo.json> [--output video.mp4] [--empresa APE] [--auto]');
    process.exit(1);
  }

  console.log(`[ViRe] Cargando guion: ${opts.guion}`);
  let script = loadFromFile(opts.guion);
  script = applyDefaults(script);

  // --still: una sola pieza estática, no un video — se ignora todo menos la
  // primera escena (ya la llama así /api/vire-still, pero por si se invoca
  // el script a mano con un guion de varias escenas).
  if (opts.still) script.scenes = script.scenes.slice(0, 1);

  ensureDir(AUDIO_DIR);
  ensureDir(IMAGES_DIR);

  let sceneAudioFiles;
  if (opts.still) {
    sceneAudioFiles = script.scenes.map(() => null);
  } else {
    const totalVoices = script.scenes.filter(s => s.voice_text).length;
    console.log(`[ViRe] Generando voces (${totalVoices} escenas)...`);
    reportProgress({ stage: 'voices', total: totalVoices });
    sceneAudioFiles = await generateAllVoices(script.scenes, {
      outputDir: AUDIO_DIR,
      voice: script.voice?.voice || 'es-MX-DaliaNeural',
      speed: script.voice?.speed || 1.0,
    });
    const audioCount = sceneAudioFiles.filter(Boolean).length;
    console.log(`[ViRe] Voces generadas: ${audioCount}`);
  }

  const totalImages = script.scenes.filter(s => s.image_prompt).length;
  console.log(`[ViRe] Generando imágenes (${totalImages} escenas)...`);
  const sceneImageFiles = await generateAllImages(script.scenes, {
    width: script.width,
    height: script.height,
    outputDir: IMAGES_DIR,
    imageSource: script.image_source,
    onImage: ({ index, total, url, prompt }) => {
      reportProgress({ stage: 'images', current: index + 1, total, url, prompt });
    },
  });
  const imgCount = sceneImageFiles.filter(Boolean).length;
  console.log(`[ViRe] Imágenes generadas: ${imgCount}`);

  const totalIcons = script.scenes.filter(s => s.icono).length;
  console.log(`[ViRe] Resolviendo íconos (${totalIcons} escenas)...`);
  const sceneIcons = await resolveAllIcons(script.scenes);
  const iconSvgCount = sceneIcons.filter(r => r.icono_svg).length;
  console.log(`[ViRe] Íconos vectoriales resueltos: ${iconSvgCount}`);

  const enrichedScenes = script.scenes.map((scene, i) => ({
    ...scene,
    image_url: scene.image_url || sceneImageFiles[i] || undefined,
    image_prompt: undefined,
    icono: sceneIcons[i].icono,
    icono_svg: sceneIcons[i].icono_svg,
  }));

  const enrichedScript = {
    ...script,
    scenes: enrichedScenes,
    sceneAudioFiles,
  };

  const output = opts.output || (opts.still ? 'out/still.png' : 'out/output.mp4');
  const fps = script.fps || 30;

  console.log(`[ViRe] ${opts.still ? 'Renderizando imagen fija...' : 'Renderizando video...'}`);
  console.log(`  Composición: ViReVideo`);
  console.log(`  Escenas: ${script.scenes.length}`);
  console.log(`  FPS: ${fps}`);
  console.log(`  Resolución: ${script.width}x${script.height}`);
  console.log(`  Salida: ${output}`);

  const inputProps = { script: enrichedScript };

  try {
    console.log(`[ViRe] Empaquetando composición...`);
    const serveUrl = await bundle({
      entryPoint: path.join(PROJECT_DIR, 'src/index.ts'),
      webpackOverride: enableTailwind,
    });

    const composition = await selectComposition({ serveUrl, id: 'ViReVideo', inputProps });

    if (opts.still) {
      // Frame fijo, posterior a las animaciones de entrada de cualquier
      // template (bounce/draw terminan ~frame 44 en Paper/PinterestAd) — así
      // la imagen exportada se ve "asentada", no a mitad de una animación.
      await renderStill({
        composition,
        serveUrl,
        output,
        inputProps,
        frame: 50,
        imageFormat: 'png',
        overwrite: true,
      });
      console.log(`\n[ViRe] ✅ Imagen renderizada: ${output}`);
      return;
    }

    reportProgress({ stage: 'render', percent: 0 });
    await renderMedia({
      composition,
      serveUrl,
      codec: 'h264',
      outputLocation: output,
      inputProps,
      overwrite: true,
      timeoutInMilliseconds: 600000,
      onProgress: ({ progress }) => {
        reportProgress({ stage: 'render', percent: Math.round(progress * 100) });
      },
    });
    console.log(`\n[ViRe] ✅ Video renderizado: ${output}`);
  } catch (err) {
    console.error(`\n[ViRe] ❌ Error en render: ${err.message}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(`[ViRe] Error: ${err.message}`);
  process.exit(1);
});
