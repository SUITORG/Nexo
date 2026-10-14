const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '..', 'config.json');

function load() {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  } catch (_) {
    const def = {
      grupo: '', grupoId: '', carpeta: './media', caption: '',
      historias: true, automatico: false,
      calendario: { dias: [], fechas: [] },
      historial: []
    };
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(def, null, 2));
    return def;
  }
}

function save(cfg) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2));
}

function update(partial) {
  const cfg = load();
  Object.assign(cfg, partial);
  save(cfg);
  return cfg;
}

module.exports = { load, save, update };
