const TelegramBot = require('node-telegram-bot-api');

const MAIN_MENU = {
  reply_markup: {
    keyboard: [
      [{ text: '🏠 Habitaciones disponibles' }],
      [{ text: '💰 Precios' }, { text: '📍 Ubicación' }],
      [{ text: '📞 Quiero que me contacten' }],
      [{ text: '❓ Ayuda' }]
    ],
    resize_keyboard: true,
    one_time_keyboard: false
  }
};

const CONTACT_KEYBOARD = {
  reply_markup: {
    keyboard: [
      [{ text: '📱 Compartir mi teléfono', request_contact: true }],
      [{ text: '🔙 Volver al menú' }]
    ],
    resize_keyboard: true,
    one_time_keyboard: false
  }
};

function sendMainMenu(bot, chatId, text) {
  bot.sendMessage(chatId, text || '¿En qué puedo ayudarte?', MAIN_MENU);
}

function sendContactPrompt(bot, chatId) {
  bot.sendMessage(chatId,
    'Para que un asesor te contacte, comparte tu número con el botón de abajo o escríbeme tu nombre y teléfono.',
    CONTACT_KEYBOARD
  );
}

function sendBackMenu(bot, chatId, text) {
  return {
    reply_markup: {
      keyboard: [[{ text: '🔙 Volver al menú' }]],
      resize_keyboard: true,
      one_time_keyboard: false
    }
  };
}

module.exports = { MAIN_MENU, CONTACT_KEYBOARD, sendMainMenu, sendContactPrompt, sendBackMenu };
