/* Genera iconos PNG de la PWA sin dependencias (zlib del stdlib) — node SuitPoke/scripts/gen-iconos.js */
'use strict';
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

function crc32(buf) {
  let c, crc = 0xFFFFFFFF;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xFF;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function chunk(tipo, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(tipo), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

function png(size, pintar) {
  const px = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const [r, g, b, a] = pintar(x, y, size);
    const i = (y * size + x) * 4;
    px[i] = r; px[i + 1] = g; px[i + 2] = b; px[i + 3] = a;
  }
  // filas con filtro 0
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    px.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8-bit RGBA
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

// Diseño: fondo degradado índigo→cian oscuro, cartas (2 rectángulos inclinados simulados) y diamante central
function pintar(x, y, s) {
  const t = y / s;
  let r = Math.round(20 + 30 * t), g = Math.round(16 + 60 * t), b = Math.round(60 + 120 * t);
  const cx = s / 2, cy = s / 2;
  const dx = Math.abs(x - cx), dy = Math.abs(y - cy);
  // cartas: dos rectángulos simétricos
  const margen = s * 0.18, ancho = s * 0.24, alto = s * 0.5;
  const enCartaIzq = x > margen && x < margen + ancho && y > (s - alto) / 2 && y < (s + alto) / 2;
  const enCartaDer = x > s - margen - ancho && x < s - margen && y > (s - alto) / 2 && y < (s + alto) / 2;
  if (enCartaIzq || enCartaDer) return [250, 245, 235, 255];
  // diamante central
  if (dx + dy < s * 0.14) return [255, 214, 0, 255];
  // esquinas redondeadas: fuera => transparente
  const rr = s * 0.14;
  const qx = Math.max(rr - x, x - (s - rr), 0);
  const qy = Math.max(rr - y, y - (s - rr), 0);
  if (qx * qx + qy * qy > rr * rr) return [0, 0, 0, 0];
  return [r, g, b, 255];
}

const dir = path.join(__dirname, '..');
[192, 512].forEach(sz => {
  fs.writeFileSync(path.join(dir, 'icon-' + sz + '.png'), png(sz, pintar));
  console.log('icon-' + sz + '.png ok');
});
