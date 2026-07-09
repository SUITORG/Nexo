const { spawn } = require("child_process");
const path = require("path");
const os = require("os");

const DATA_DIR = path.join(os.homedir(), ".wappmcp");

const proc = spawn("cmd.exe", ["/c", "npx", "wappmcp", "mcp"], {
  stdio: ["pipe", "pipe", "pipe"],
  env: { ...process.env, WAPPMCP_DATA_DIR: DATA_DIR }
});

let buf = "";
let pending = {};

proc.stdout.on("data", (d) => {
  buf += d.toString();
  const lines = buf.split("\n");
  buf = lines.pop() || "";
  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const msg = JSON.parse(line);
      if (msg.id && pending[msg.id]) {
        pending[msg.id](msg);
        delete pending[msg.id];
      }
    } catch (e) {}
  }
});

function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = Date.now() + Math.random();
    pending[id] = resolve;
    proc.stdin.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n");
    setTimeout(() => { delete pending[id]; reject(new Error("timeout")); }, 20000);
  });
}

(async () => {
  try {
    const init = await send("initialize", {
      protocolVersion: "2024-11-05",
      capabilities: { tools: {} },
      clientInfo: { name: "opencode", version: "1.0.0" }
    });
    console.log("INIT:", JSON.stringify(init?.result?.serverInfo || init));

    await send("notifications/initialized", {});

    // List tools first to verify
    const toolsRes = await send("tools/list", {});
    const tools = toolsRes?.result?.tools || [];
    console.log("TOOLS:", tools.map(t => t.name).join(", "));

    // Search for Roberto
    const searchRes = await send("tools/call", {
      name: "whatsapp_search_contacts",
      arguments: { query: "roberto" }
    });
    const searchText = searchRes?.result?.content?.[0]?.text || "[]";
    console.log("SEARCH:", searchText);
    const data = JSON.parse(searchText);

    if (data.length > 0) {
      const contact = data[0];
      console.log("FOUND:", contact.id, contact.name || contact.pushname || contact.number);
      const sendRes = await send("tools/call", {
        name: "whatsapp_send_message",
        arguments: { chatId: contact.id, message: "Hola desde OpenCode!" }
      });
      console.log("SENT:", JSON.stringify(sendRes.result || sendRes.error));
    } else {
      // Try listing chats
      const chatsRes = await send("tools/call", {
        name: "whatsapp_list_chats",
        arguments: {}
      });
      console.log("CHATS:", chatsRes?.result?.content?.[0]?.text || "no chats");
    }
  } catch (e) {
    console.error("ERROR:", e.message);
  }

  proc.kill();
  process.exit(0);
})();
