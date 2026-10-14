const fs = require('fs');
const path = require('path');
const { log, err } = require('./logger');

function moverAEnviados(archivo, carpeta) {
  const dir = path.resolve(carpeta || './media');
  const enviadosDir = path.join(dir, 'enviados');
  if (!fs.existsSync(enviadosDir)) fs.mkdirSync(enviadosDir, { recursive: true });

  const nombre = path.basename(archivo.nombre);
  const base = path.parse(nombre).name;
  const ext = path.parse(nombre).ext;
  let destino = path.join(enviadosDir, nombre);

  if (fs.existsSync(destino)) {
    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    destino = path.join(enviadosDir, `${base}_${ts}${ext}`);
  }

  try {
    fs.renameSync(archivo.ruta, destino);
    log(`📁 Movido a enviados: ${path.basename(destino)}`);
    return destino;
  } catch (e) {
    err(`No se pudo mover ${archivo.nombre} a enviados`, e.message);
    throw e;
  }
}

module.exports = { moverAEnviados };
