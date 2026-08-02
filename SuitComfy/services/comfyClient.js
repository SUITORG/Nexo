'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const COMFYUI_URL = process.env.COMFYUI_URL || 'http://127.0.0.1:8188';
const OUTPUT_DIR = process.env.COMFYUI_OUTPUT_DIR ||
  path.join(os.homedir(), 'AppData', 'Local', 'Comfy-Desktop', 'ComfyUI-Installs', 'ComfyUI', 'ComfyUI', 'output');

async function submitWorkflow(workflow) {
  const res = await fetch(`${COMFYUI_URL}/prompt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: workflow, client_id: 'suitcomfy' })
  });
  const data = await res.json();
  if (data.error) throw new Error(`ComfyUI: ${JSON.stringify(data.error)}`);
  return data.prompt_id;
}

async function waitForOutput(promptId, timeoutMs = 900000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const res = await fetch(`${COMFYUI_URL}/history/${promptId}`);
    const hist = await res.json();
    const entry = hist[promptId];
    if (entry) {
      if (entry.status && entry.status.status_str === 'error') {
        const msg = entry.status.messages
          ? entry.status.messages.map(m => (m[1] && m[1].message) || JSON.stringify(m[1])).join('; ')
          : 'run failed';
        throw new Error(`ComfyUI: ${msg}`);
      }
      const images = [];
      for (const out of Object.values(entry.outputs || {})) {
        for (const img of out.images || []) {
          images.push({ filename: img.filename, subfolder: img.subfolder || '', type: img.type || 'output' });
        }
      }
      if (images.length) return images;
    }
    await new Promise(r => setTimeout(r, 2000));
  }
  throw new Error('Timeout esperando a ComfyUI');
}

function resolveImagePath(img) {
  const base = img.type === 'temp' ? path.join(OUTPUT_DIR, '..', 'temp') : OUTPUT_DIR;
  return path.join(base, img.subfolder, img.filename);
}

async function isAlive() {
  try {
    const res = await fetch(`${COMFYUI_URL}/system_stats`, { signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch {
    return false;
  }
}

module.exports = { COMFYUI_URL, OUTPUT_DIR, submitWorkflow, waitForOutput, resolveImagePath, isAlive };
