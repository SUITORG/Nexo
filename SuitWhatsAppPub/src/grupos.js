const { getSock, isConectado } = require('./conexion');
const { log, err } = require('./logger');

async function listarGrupos() {
  if (!isConectado()) throw new Error('No conectado — escanea el QR primero');
  const sock = getSock();
  const groups = await sock.groupFetchAllParticipating();
  return Object.values(groups).map(g => ({
    id: g.id,
    nombre: g.subject,
    participantes: g.participants?.length || 0
  }));
}

async function buscarGrupo(nombre) {
  const grupos = await listarGrupos();
  const exacto = grupos.find(g => g.nombre.toLowerCase() === nombre.toLowerCase());
  if (exacto) return { exacto: true, grupo: exacto };

  const parecidos = grupos
    .filter(g => g.nombre.toLowerCase().includes(nombre.toLowerCase()) ||
                 nombre.toLowerCase().includes(g.nombre.toLowerCase()))
    .slice(0, 10);

  return { exacto: false, parecidos, total: grupos.length };
}

async function resolverGrupo(cfgGrupo, cfgGrupoId) {
  if (cfgGrupoId) {
    const grupos = await listarGrupos();
    const g = grupos.find(x => x.id === cfgGrupoId);
    if (!g) throw new Error(`No existe grupo con ID ${cfgGrupoId}. Lista de tus grupos:\n` +
      grupos.slice(0, 10).map(x => `  ${x.id} → ${x.nombre}`).join('\n'));
    return g;
  }

  if (!cfgGrupo) throw new Error('No hay grupo configurado. Usa --grupo "Nombre" o configúralo en el panel.');

  const r = await buscarGrupo(cfgGrupo);
  if (r.exacto) return r.grupo;

  if (r.parecidos.length === 1) return r.parecidos[0];

  if (r.parecidos.length > 1) {
    throw new Error(`Varios grupos parecidos a "${cfgGrupo}":\n` +
      r.parecidos.map(g => `  ${g.id} → ${g.nombre} (${g.participantes} participantes)`).join('\n') +
      '\nUsa --grupo-id para elegir uno.');
  }

  throw new Error(`No encontré ningún grupo parecido a "${cfgGrupo}". Tienes ${r.total} grupos.`);
}

module.exports = { listarGrupos, buscarGrupo, resolverGrupo };
