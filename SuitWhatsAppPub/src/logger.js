const fs = require('fs');
const path = require('path');
const pino = require('pino')({ level: 'silent' });

const LOGS = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(LOGS)) fs.mkdirSync(LOGS, { recursive: true });

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(path.join(LOGS, 'app.log'), line + '\n');
}

function err(msg, extra) {
  const line = `[${new Date().toISOString()}] ERROR: ${msg}${extra ? ' | ' + extra : ''}`;
  console.error('❌', line);
  fs.appendFileSync(path.join(LOGS, 'errors.log'), line + '\n');
}

module.exports = { log, err, pino };
