const { Client, LocalAuth } = require("whatsapp-web.js");
const path = require("path");
const os = require("os");

const DATA_DIR = path.join(os.homedir(), ".wappmcp", "profile");

const client = new Client({
  authStrategy: new LocalAuth({ dataPath: DATA_DIR }),
  puppeteer: { headless: true, args: ["--no-sandbox"] }
});

client.on("ready", async () => {
  try {
    const chats = await client.getChats();
    chats.sort((a, b) => b.timestamp - a.timestamp);

    // Show last 3 chats with their last message
    for (let i = 0; i < Math.min(5, chats.length); i++) {
      const chat = chats[i];
      const msgs = await chat.fetchMessages({ limit: 1 });
      const last = msgs[0];
      if (last) {
        const isGroup = chat.id._serialized.endsWith("@g.us");
        const sender = last.fromMe ? "Yo" : (last.author || "Alguien");
        console.log(`[${isGroup ? "GRUPO" : "PRIV"}] ${chat.name || chat.id._serialized}`);
        console.log(`  ${sender}: ${last.body || "(media/sticker)"}`);
        console.log(`  ${new Date(last.timestamp * 1000).toLocaleString()}`);
        console.log("");
      }
    }
  } catch (e) {
    console.error("Error:", e.message);
  }
  client.destroy();
  process.exit(0);
});

client.initialize();
