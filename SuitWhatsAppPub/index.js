const { connect, onQr, onStatus, isConectado } = require('./src/conexion');
const { crearPanel, ejecutarPublicacion } = require('./src/panel');
const { debePublicar, proximaPublicacion } = require('./src/calendario');
const cfg = require('./src/config');
const { log, err } = require('./src/logger');
const QRCode = require('qrcode-terminal');

const PORT = process.env.PORT || 3019;
const args = process.argv.slice(2);
const cmd = args[0];

// CLI flags
const flags = {};
for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith('--')) {
    const key = args[i].replace('--', '');
    if (i + 1 < args.length && !args[i + 1].startsWith('--')) {
      flags[key] = args[i + 1];
      i++;
    } else {
      flags[key] = true;
    }
  }
}

async function main() {
  // Comando: publicar-ya
  if (cmd === 'publicar-ya') {
    log('Publicando ahora (ignora calendario)…');
    await connect();
    await new Promise(r => setTimeout(r, 5000));

    if (!isConectado()) {
      err('No se pudo conectar a WhatsApp');
      process.exit(1);
    }

    const resultado = await ejecutarPublicacion({
      grupoId: flags['grupo-id'] || undefined,
      caption: flags.caption || undefined,
      soloGrupo: flags['sin-estado'] || false,
      soloHistorias: flags['solo-estado'] || false,
      reciente: flags.reciente || false,
      aleatorio: flags.aleatorio || false
    });

    if (resultado.ok) {
      log(`✅ Publicación completada: ${resultado.archivo}`);
      process.exit(0);
    } else {
      err(resultado.motivo || 'No se pudo publicar');
      process.exit(1);
    }
  }

  // Modo panel (default)
  log('Iniciando SuitWhatsAppPub…');
  const config = cfg.load();

  // Actualizar config con flags de CLI si se dieron
  if (flags.grupo) cfg.update({ grupo: flags.grupo });
  if (flags['grupo-id']) cfg.update({ grupoId: flags['grupo-id'] });
  if (flags.carpeta) cfg.update({ carpeta: flags.carpeta });

  onQr(qr => {
    log('Escanea este QR con tu WhatsApp personal:');
    QRCode.generate(qr, { small: true });
  });

  onStatus(s => {
    if (s.estado === 'deslogueado') {
      err('Sesión cerrada. Borra ./auth/ y reinicia.');
    }
  });

  await connect();

  // Panel web
  const app = crearPanel();
  app.listen(PORT, () => {
    log(`Panel en http://localhost:${PORT}`);
    log(`WhatsApp: ${isConectado() ? 'conectado' : 'esperando QR'}`);
  });

  // Modo automático: chequear calendario cada 60s
  if (config.automatico) {
    log('Modo automático ACTIVO — chequeando calendario cada 60s');
    setInterval(async () => {
      if (!isConectado()) return;
      const c = cfg.load();
      if (!c.automatico) return;

      const r = debePublicar(c.calendario);
      if (r.publica) {
        log(`⏰ Toca publicar: ${r.motivo}`);
        try {
          const resultado = await ejecutarPublicacion({});
          if (resultado.ok) log(`✅ Auto-publicación OK: ${resultado.archivo}`);
        } catch (e) {
          err('Error en auto-publicación', e.message);
        }
      }
    }, 60000);
  }
}

main().catch(e => {
  err('Error fatal', e.message);
  process.exit(1);
});
