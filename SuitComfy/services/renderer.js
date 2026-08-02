'use strict';

const { execFile } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const FFMPEG = process.env.FFMPEG_PATH || 'ffmpeg';

function run(args) {
  return new Promise((resolve, reject) => {
    execFile(FFMPEG, args, { maxBuffer: 128 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) reject(new Error(stderr || err.message));
      else resolve(stdout);
    });
  });
}

function zoompanExpr(index, duration, fps) {
  const frames = Math.round(duration * fps);
  const zoomIn = index % 2 === 0;
  return {
    z: zoomIn ? 'min(zoom+0.0015,1.3)' : 'max(zoom-0.0015,1.0)',
    d: frames,
    x: 'iw/2-(iw/zoom/2)',
    y: 'ih/2-(ih/zoom/2)'
  };
}

async function renderVideo(imagePaths, opts = {}) {
  const duration = opts.duration || 4;
  const transition = opts.transition || 1;
  const width = opts.width || 1280;
  const height = opts.height || 720;
  const fps = opts.fps || 25;
  const outputPath = opts.outputPath;
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'suitcomfy-'));

  try {
    const clips = [];
    for (let i = 0; i < imagePaths.length; i++) {
      const z = zoompanExpr(i, duration, fps);
      const clip = path.join(workDir, `clip_${i}.mp4`);
      await run([
        '-y', '-i', imagePaths[i],
        '-vf',
        `scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},` +
        `zoompan=z='${z.z}':x='${z.x}':y='${z.y}':d=${z.d}:s=${width}x${height}:fps=${fps}`,
        '-t', String(duration),
        '-c:v', 'libx264', '-preset', 'medium', '-pix_fmt', 'yuv420p',
        clip
      ]);
      clips.push(clip);
    }

    if (clips.length === 1) {
      fs.copyFileSync(clips[0], outputPath);
      return outputPath;
    }

    const inputs = [];
    const filterParts = [];
    let last = '0';
    for (let i = 0; i < clips.length; i++) {
      inputs.push('-i', clips[i]);
      if (i === 0) continue;
      const offset = i * (duration - transition);
      const out = `v${i}`;
      filterParts.push(`[${last}][${i}]xfade=transition=fade:duration=${transition}:offset=${offset}[${out}]`);
      last = out;
    }
    const total = (clips.length * duration) - ((clips.length - 1) * transition);
    await run([
      '-y', ...inputs,
      '-filter_complex', filterParts.join(';'),
      '-map', `[${last}]`,
      '-t', String(total),
      '-c:v', 'libx264', '-preset', 'medium', '-pix_fmt', 'yuv420p',
      outputPath
    ]);
    return outputPath;
  } finally {
    fs.rmSync(workDir, { recursive: true, force: true });
  }
}

module.exports = { renderVideo };
