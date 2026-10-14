const express = require('express');
const path = require('path');
const cfg = require('./config');
const { isConectado, onQr, onStatus } = require('./conexion');
const { listarGrupos, resolverGrupo } = require('./grupos');
const { listarPendientes, elegirArchivo } = require('./media');
const { publicar } = require('./publicar');
const { moverAEnviados } = require('./enviados');
const { log, err } = require('./logger');

let qrActual = null;
let estadoActual = { estado: 'iniciando', conectado: false, extra: '' };
let publicando = false;

onQr(qr => { qrActual = qr; });
onStatus(s => { estadoActual = s; });

function registrarHistorial(entry) {
  const c = cfg.load();
  c.historial = c.historial || [];
  c.historial.unshift({ ts: new Date().toISOString(), ...entry });
  if (c.historial.length > 200) c.historial = c.historial.slice(0, 200);
  cfg.save(c);
}

async function ejecutarPublicacion(opciones = {}) {
  if (publicando) throw new Error('Ya hay una publicación en curso');
  publicando = true;

  try {
    const config = cfg.load();
    const grupoId = opciones.grupoId || config.grupoId;
    const carpeta = opciones.carpeta || config.carpeta;
    const caption = opciones.caption !== undefined ? opciones.caption : config.caption;
    const historias = opciones.historias !== undefined ? opciones.historias : config.historias;
    const soloGrupo = opciones.soloGrupo || false;
    const soloHistorias = opciones.soloHistorias || false;

    const archivo = elegirArchivo(carpeta, { reciente: opciones.reciente, aleatorio: opciones.aleatorio });
    if (!archivo) {
      log('No hay archivos pendientes para publicar');
      return { ok: false, motivo: 'Sin archivos pendientes' };
    }

    const conGrupo = !soloHistorias;
    const conHist = historias && !soloGrupo;

    let grupo = null;
    if (conGrupo && grupoId) {
      grupo = await resolverGrupo(config.grupo, grupoId);
    }

    const resultados = await publicar(archivo, grupo?.id, caption, conHist, conGrupo);

    if (resultados.grupo || resultados.historias) {
      moverAEnviados(archivo, carpeta);
    }

    registrarHistorial({
      archivo: archivo.nombre,
      grupo: grupo?.nombre || '(sin grupo)',
      grupo_ok: resultados.grupo,
      historias_ok: resultados.historias,
      error: resultados.error
    });

    return { ok: true, archivo: archivo.nombre, grupo: grupo?.nombre, resultados };
  } finally {
    publicando = false;
  }
}

function crearPanel() {
  const app = express();
  app.use(express.json());
  app.use(express.static(path.join(__dirname, '..', 'panel')));

  app.get('/api/estado', (req, res) => {
    const config = cfg.load();
    res.json({
      conectado: isConectado(),
      estado: estadoActual.estado,
      extra: estadoActual.extra,
      qr: qrActual,
      config: {
        grupo: config.grupo,
        grupoId: config.grupoId,
        carpeta: config.carpeta,
        caption: config.caption,
        historias: config.historias,
        automatico: config.automatico,
        calendario: config.calendario
      },
      pendientes: listarPendientes(config.carpeta).map(a => ({ nombre: a.nombre, peso: a.peso, fecha: new Date(a.mtime).toISOString() })),
      historial: (config.historial || []).slice(0, 50),
      publicando
    });
  });

  app.post('/api/config', (req, res) => {
    const c = cfg.update(req.body);
    log('Config actualizada desde el panel');
    res.json({ ok: true, config: c });
  });

  app.post('/api/publicar', async (req, res) => {
    try {
      const r = await ejecutarPublicacion(req.body || {});
      res.json(r);
    } catch (e) {
      err('Error en publicar', e.message);
      res.status(500).json({ ok: false, error: e.message });
    }
  });

  app.post('/api/grupos', async (req, res) => {
    try {
      const grupos = await listarGrupos();
      res.json({ ok: true, grupos });
    } catch (e) {
      res.status(500).json({ ok: false, error: e.message });
    }
  });

  return app;
}

module.exports = { crearPanel, ejecutarPublicacion };
