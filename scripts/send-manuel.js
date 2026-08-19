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
    const contacts = await client.getContacts();
    const manuel = contacts.find(c => {
      const name = (c.name || c.pushname || "").toLowerCase();
      return name.includes("manuel");
    });

    if (manuel) {
      console.log("FOUND:", manuel.id._serialized, manuel.name || manuel.pushname);
      await client.sendMessage(manuel.id._serialized, "Saludos buenas noches");
      console.log("SENT OK");
    } else {
      console.log("Manuel not found in contacts");
      const chats = await client.getChats();
      const found = chats.filter(c => (c.name || "").toLowerCase().includes("manuel"));
      if (found.length > 0) {
        console.log("Found in chats:", found[0].name);
        await client.sendMessage(found[0].id._serialized, "Saludos buenas noches");
        console.log("SENT OK");
      } else {
        console.log("No chat found either");
      }
    }
  } catch (e) {
    console.error("Error:", e.message);
  }

  client.destroy();
  process.exit(0);
});

client.initialize();
