const fs = require('fs');
const path = require('path');
const { getSock, isConectado } = require('./conexion');
const { log, err } = require('./logger');

async function enviarGrupo(grupoId, archivo, caption) {
  if (!isConectado()) throw new Error('No conectado');
  const sock = getSock();
  const ext = path.extname(archivo.nombre).toLowerCase();
  const esVideo = ext === '.mp4';

  const content = esVideo
    ? { video: { url: archivo.ruta }, caption: caption || '', mimetype: 'video/mp4' }
    : { image: { url: archivo.ruta }, caption: caption || '' };

  await sock.sendMessage(grupoId, content);
  log(`✅ Publicado en el grupo: ${archivo.nombre}`);
}

async function enviarHistorias(archivo) {
  if (!isConectado()) throw new Error('No conectado');
  const sock = getSock();
  const ext = path.extname(archivo.nombre).toLowerCase();
  const esVideo = ext === '.mp4';

  const content = esVideo
    ? { video: { url: archivo.ruta }, mimetype: 'video/mp4' }
    : { image: { url: archivo.ruta } };

  await sock.sendMessage('status@broadcast', content, {
    statusBroadcastType: 'status',
    mediaListen: false
  });
  log(`✅ Publicado en Historias: ${archivo.nombre}`);
}

async function publicar(archivo, grupoId, caption, conHistorias, conGrupo) {
  const resultados = { grupo: false, historias: false, error: null };

  try {
    if (conGrupo && grupoId) {
      await enviarGrupo(grupoId, archivo, caption);
      resultados.grupo = true;
    }
    if (conHistorias) {
      await enviarHistorias(archivo);
      resultados.historias = true;
    }
  } catch (e) {
    resultados.error = e.message;
    err(`Error al publicar ${archivo.nombre}`, e.message);
  }

  return resultados;
}

module.exports = { enviarGrupo, enviarHistorias, publicar };
