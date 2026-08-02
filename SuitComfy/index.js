'use strict';

const express = require('express');
const fs = require('fs');
const path = require('path');

const comfy = require('./services/comfyClient');
const { renderVideo } = require('./services/renderer');

const app = express();
const PORT = process.env.PORT || 3012;
const WORKFLOW_PATH = path.join(__dirname, 'workflows', 'txt2img-lcm.json');
const OUT_DIR = path.join(__dirname, 'output');

app.use(express.json());

fs.mkdirSync(OUT_DIR, { recursive: true });

function loadWorkflow(params) {
  const wf = JSON.parse(fs.readFileSync(WORKFLOW_PATH, 'utf8'));
  wf['3'].inputs.text = params.prompt;
  wf['4'].inputs.text = params.negative || '';
  wf['5'].inputs.width = params.width || 768;
  wf['5'].inputs.height = params.height || 768;
  wf['5'].inputs.batch_size = params.batch_size || 1;
  wf['6'].inputs.steps = params.steps || 8;
  wf['6'].inputs.cfg = params.cfg || 1.8;
  wf['6'].inputs.seed = params.seed || 1;
  return wf;
}

async function generateImages(params) {
  const wf = loadWorkflow(params);
  const promptId = await comfy.submitWorkflow(wf);
  const images = await comfy.waitForOutput(promptId);
  return images.map(img => ({ ...img, filePath: comfy.resolveImagePath(img) }));
}

app.get('/api/health', async (req, res) => {
  res.json({ ok: true, comfy: await comfy.isAlive(), port: PORT });
});

app.post('/api/image', async (req, res) => {
  try {
    const { prompt } = req.body || {};
    if (!prompt) return res.status(400).json({ error: 'prompt es requerido' });
    const images = await generateImages(req.body);
    res.json({ images: images.map(i => ({ filename: i.filename, path: i.filePath })) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/video', async (req, res) => {
  try {
    const b = req.body || {};
    if (!b.prompt) return res.status(400).json({ error: 'prompt es requerido' });
    const count = Math.min(b.count || 4, 12);
    const seedBase = b.seed || 1;

    const imagePaths = [];
    for (let i = 0; i < count; i++) {
      const images = await generateImages({ ...b, seed: seedBase + i, batch_size: 1 });
      imagePaths.push(images[0].filePath);
    }

    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputPath = path.join(OUT_DIR, `video_${stamp}.mp4`);
    await renderVideo(imagePaths, {
      outputPath,
      duration: b.duration || 4,
      transition: b.transition || 1,
      width: b.width || 1280,
      height: b.height || 720
    });

    res.json({ video: outputPath, frames: imagePaths });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/', (req, res) => {
  res.type('html').send(`<!doctype html><meta charset="utf8"><title>SuitComfy</title>
<h1>SuitComfy</h1>
<p>POST <code>/api/image</code> o <code>/api/video</code> con JSON: <code>{ "prompt": "...", "steps": 8, "cfg": 1.8, "count": 4 }</code></p>
<p>ComfyUI: ${comfy.COMFYUI_URL} | Flujo: workflows/txt2img-lcm.json (realisticVision + LCM-LoRA)</p>`);
});

module.exports = app;

if (require.main === module) {
  app.listen(PORT, () => console.log(`[SuitComfy] http://127.0.0.1:${PORT}`));
}
