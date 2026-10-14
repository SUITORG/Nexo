const path = require('path');
const fs = require('fs');
const makeWASocket = require('@whiskeysockets/baileys').default;
const { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const { log, err, pino } = require('./logger');

const AUTH_DIR = path.join(__dirname, '..', 'auth');

let sock = null;
let qrCallbacks = [];
let statusCallbacks = [];
let connected = false;

function onQr(cb) { qrCallbacks.push(cb); }
function onStatus(cb) { statusCallbacks.push(cb); }

function emitQr(qr) { qrCallbacks.forEach(cb => cb(qr)); }
function emitStatus(state, extra) {
  const s = { estado: state, extra: extra || '', conectado: connected };
  statusCallbacks.forEach(cb => cb(s));
}

async function connect() {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version } = await fetchLatestBaileysVersion();

  sock = makeWASocket({
    version,
    auth: state,
    logger: pino,
    printQRInTerminal: false,
    browser: ['WhatsApp Pub (SuitOrg)', 'Chrome', '1.0.0']
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      log('QR generado — escanea con tu WhatsApp personal');
      emitStatus('qr', qr);
      emitQr(qr);
    }

    if (connection === 'open') {
      connected = true;
      log('✅ WhatsApp conectado');
      emitStatus('conectado');
    }

    if (connection === 'close') {
      connected = false;
      const code = lastDisconnect?.error?.output?.statusCode;
      const isLoggedOut = code === DisconnectReason.loggedOut;
      const isRecoverable = code !== DisconnectReason.loggedOut && code !== DisconnectReason.badSession;

      if (isLoggedOut) {
        err('Sesión cerrada — borra ./auth/ y vuelve a escanear el QR');
        emitStatus('deslogueado', 'Borra ./auth/ y reinicia para escanear QR nuevo');
      } else if (isRecoverable) {
        log('Conexión perdida — reconectando en 3s…');
        emitStatus('reconectando', 'Reintentando en 3 segundos');
        setTimeout(() => connect().catch(e => err('Fallo al reconectar', e.message)), 3000);
      } else {
        err('Sesión inválida — borra ./auth/ y vuelve a escanear', `code=${code}`);
        emitStatus('error', 'Borra ./auth/ y reinicia');
      }
    }
  });

  return sock;
}

function getSock() {
  if (!sock || !connected) return null;
  return sock;
}

function isConectado() { return connected; }

module.exports = { connect, getSock, isConectado, onQr, onStatus };
