const fs = require('fs');
const path = require('path');
const { err } = require('./logger');

const VALIDAS = ['.jpg', '.jpeg', '.png', '.webp', '.mp4'];
const MAX_IMG = 16 * 1024 * 1024;
const MAX_VID = 64 * 1024 * 1024;

function listarPendientes(carpeta) {
  const dir = path.resolve(carpeta || './media');
  const enviados = path.join(dir, 'enviados');

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    return [];
  }

  const files = fs.readdirSync(dir)
    .filter(f => {
      const full = path.join(dir, f);
      if (!fs.statSync(full).isFile()) return false;
      if (full.startsWith(enviados)) return false;
      const ext = path.extname(f).toLowerCase();
      return VALIDAS.includes(ext);
    })
    .map(f => {
      const full = path.join(dir, f);
      const stat = fs.statSync(full);
      return {
        nombre: f,
        ruta: full,
        ext: path.extname(f).toLowerCase(),
        peso: stat.size,
        mtime: stat.mtimeMs
      };
    })
    .sort((a, b) => a.mtime - b.mtime);

  return files;
}

function elegirArchivo(carpeta, opciones = {}) {
  let pendientes = listarPendientes(carpeta);
  if (pendientes.length === 0) return null;

  if (opciones.reciente) pendientes.sort((a, b) => b.mtime - a.mtime);
  if (opciones.aleatorio) pendientes.sort(() => Math.random() - 0.5);

  const archivo = pendientes[0];

  const ext = archivo.ext;
  const esVideo = ext === '.mp4';
  const maxPeso = esVideo ? MAX_VID : MAX_IMG;

  if (archivo.peso > maxPeso) {
    err(`Archivo demasiado grande: ${archivo.nombre} (${(archivo.peso / 1024 / 1024).toFixed(1)} MB, máx ${(maxPeso / 1024 / 1024).toFixed(0)} MB)`);
    return null;
  }

  return archivo;
}

function validarArchivo(ruta) {
  if (!fs.existsSync(ruta)) {
    err(`Archivo no existe: ${ruta}`);
    return false;
  }
  const ext = path.extname(ruta).toLowerCase();
  if (!VALIDAS.includes(ext)) {
    err(`Extensión no válida: ${ext} (${ruta}). Válidas: ${VALIDAS.join(', ')}`);
    return false;
  }
  return true;
}

module.exports = { listarPendientes, elegirArchivo, validarArchivo, VALIDAS };
