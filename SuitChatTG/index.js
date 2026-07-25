require('dotenv').config();
const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const telegram = require('./handlers/telegram');
const path = require('path');

const PORT = process.env.PORT || 3011;
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const ID_EMPRESA = process.env.DEFAULT_ID_EMPRESA || 'ROOMMATENL';
const BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME || '';

if (!TELEGRAM_TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN no configurado. Crea un bot en @BotFather y agrégalo a .env');
  process.exit(1);
}

const app = express();
app.use(express.json());

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });
telegram.setup(bot, ID_EMPRESA);

if (BOT_USERNAME) {
  console.log(`🤖 SuitChatTG — Bot @${BOT_USERNAME} iniciado para ${ID_EMPRESA}`);
} else {
  console.log(`🤖 SuitChatTG — Bot iniciado para ${ID_EMPRESA}`);
  console.log('💡 Sugerencia: define TELEGRAM_BOT_USERNAME en .env para generar deep links');
}
console.log(`📡 Polling en puerto ${PORT}`);

app.get('/api/health', (req, res) => {
  const sessions = telegram.getSession();
  res.json({ status: 'ok', empresa: ID_EMPRESA, bot_username: BOT_USERNAME, chats_activos: sessions.size });
});

app.get('/api/sessions', (req, res) => {
  const sessions = telegram.getSession();
  const summary = {};
  for (const [chatId, session] of sessions) {
    summary[chatId] = {
      empresa: session.idEmpresa,
      mensajes: session.msgCount,
      tiene_lead: !!session.leadData.nombre,
      tiene_telefono: !!session.leadData.telefono
    };
  }
  res.json({ chats_activos: sessions.size, sesiones: summary });
});

app.get('/api/link', (req, res) => {
  const idEmpresa = req.query.id_empresa || ID_EMPRESA;
  if (!BOT_USERNAME) {
    return res.status(400).json({ error: 'TELEGRAM_BOT_USERNAME no configurado en .env' });
  }
  const link = `https://t.me/${BOT_USERNAME}?start=${idEmpresa}`;
  res.json({ bot_username: BOT_USERNAME, empresa: idEmpresa, link });
});

app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log(`🌐 Servidor Express en http://localhost:${PORT}`);
  if (BOT_USERNAME) {
    console.log(`🔗 Deep link: https://t.me/${BOT_USERNAME}?start=${ID_EMPRESA}`);
  }
});

module.exports = app;
