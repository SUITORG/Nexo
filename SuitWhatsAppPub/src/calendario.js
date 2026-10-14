const { log } = require('./logger');

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

function debePublicar(calendario) {
  if (!calendario || !calendario.dias?.length) return { publica: false, motivo: 'Sin días configurados en el calendario' };

  const ahora = new Date();
  const tz = 'America/Monterrey';
  const horaLocal = ahora.toLocaleTimeString('es-MX', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false });
  const diaActual = ahora.toLocaleDateString('es-MX', { timeZone: tz, weekday: 'long' }).toLowerCase();
  const fechaActual = ahora.toLocaleDateString('sv-SE', { timeZone: tz });

  for (const dia of calendario.dias) {
    const d = dia.toLowerCase();
    const partes = d.split(' ');
    const diaSemana = partes[0];
    const hora = partes[1] || '00:00';

    if (diaSemana === diaActual && horaLocal >= hora) {
      return { publica: true, motivo: `Calendario: ${diaActual} ${horaLocal} ≥ ${hora}` };
    }
  }

  for (const fecha of (calendario.fechas || [])) {
    const partes = fecha.split(' ');
    const f = partes[0];
    const hora = partes[1] || '00:00';

    if (f === fechaActual && horaLocal >= hora) {
      return { publica: true, motivo: `Fecha exacta: ${fechaActual} ${horaLocal} ≥ ${hora}` };
    }
  }

  return { publica: false, motivo: `Hoy (${diaActual} ${horaLocal}) no toca publicar según el calendario` };
}

function proximaPublicacion(calendario) {
  if (!calendario || !calendario.dias?.length) return null;
  const ahora = new Date();
  const tz = 'America/Monterrey';

  let mejor = null;
  for (const dia of calendario.dias) {
    const partes = dia.split(' ');
    const diaSemana = partes[0];
    const hora = partes[1] || '00:00';
    const [h, m] = hora.split(':').map(Number);

    const idxDia = DIAS.indexOf(diaSemana);
    if (idxDia < 0) continue;

    const hoyIdx = ahora.toLocaleDateString('es-MX', { timeZone: tz, weekday: 'long' });
    const hoyDiaIdx = DIAS.indexOf(hoyIdx.toLowerCase());
    const hoyHora = ahora.toLocaleTimeString('es-MX', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false });
    const [ah, am] = hoyHora.split(':').map(Number);

    let diasHasta = (idxDia - hoyDiaIdx + 7) % 7;
    if (diasHasta === 0 && (ah > h || (ah === h && am >= m))) diasHasta = 7;

    const prox = new Date(ahora);
    prox.setDate(prox.getDate() + diasHasta);
    prox.setHours(h, m, 0, 0);

    if (!mejor || prox < mejor) mejor = prox;
  }

  return mejor;
}

module.exports = { debePublicar, proximaPublicacion, DIAS };
