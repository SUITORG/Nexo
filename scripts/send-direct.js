const { Client, LocalAuth } = require("whatsapp-web.js");
const path = require("path");
const os = require("os");

const DATA_DIR = path.join(os.homedir(), ".wappmcp", "profile");

console.log("Auth path:", DATA_DIR);

const client = new Client({
  authStrategy: new LocalAuth({ dataPath: DATA_DIR }),
  puppeteer: { headless: true, args: ["--no-sandbox"] }
});

client.on("qr", qr => console.log("QR:", qr));
client.on("ready", async () => {
  console.log("READY");

  try {
    const contacts = await client.getContacts();
    const roberto = contacts.find(c => {
      const name = (c.name || c.pushname || "").toLowerCase();
      const number = c.number || "";
      return name.includes("roberto") || number.includes("8110463721");
    });

    if (roberto) {
      console.log("FOUND:", roberto.id._serialized, roberto.name || roberto.pushname);
      await client.sendMessage(roberto.id._serialized, "Hola desde OpenCode!");
      console.log("SENT OK");
    } else {
      console.log("Roberto not found in contacts");
      const chats = await client.getChats();
      console.log("First 10 chats:", chats.slice(0, 10).map(c => c.name).join(", "));
    }
  } catch (e) {
    console.error("Error:", e.message);
  }

  client.destroy();
  process.exit(0);
});

client.on("auth_failure", msg => {
  console.error("AUTH FAILURE:", msg);
  process.exit(1);
});

client.initialize();
