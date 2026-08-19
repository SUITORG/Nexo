import { spawn } from 'child_process';
import { homedir } from 'os';
import { join } from 'path';

const DATA_DIR = join(homedir(), '.wappmcp');

const proc = spawn('cmd.exe', ['/c', 'npx', 'wappmcp', 'mcp'], {
  stdio: ['pipe', 'pipe', 'pipe'],
  env: { ...process.env, WAPPMCP_DATA_DIR: DATA_DIR }
});

let buf = '';
let initialized = false;
let pending = {};

proc.stdout.on('data', (data) => {
  buf += data.toString();
  const lines = buf.split('\n');
  buf = lines.pop() || '';
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
    const req = JSON.stringify({ jsonrpc: '2.0', id, method, params });
    proc.stdin.write(req + '\n');
    setTimeout(() => { delete pending[id]; reject(new Error('timeout')); }, 15000);
  });
}

async function main() {
  // Initialize
  const init = await send('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: { tools: {} },
    clientInfo: { name: 'opencode', version: '1.0.0' }
  });
  initialized = true;

  // Send notificated
  await send('notifications/initialized', {});

  // Search for Roberto
  const search = await send('tools/call', {
    name: 'whatsapp_search_contacts',
    arguments: { query: 'roberto' }
  });
  console.log('SEARCH:', JSON.stringify(search, null, 2));

  // If found, send message
  if (search?.result?.content?.[0]?.text) {
    const data = JSON.parse(search.result.content[0].text);
    if (data.length > 0) {
      const contact = data[0];
      console.log('CONTACT:', JSON.stringify(contact, null, 2));
      
      const sendRes = await send('tools/call', {
        name: 'whatsapp_send_message',
        arguments: { chatId: contact.id, message: 'Hola desde OpenCode' }
      });
      console.log('SEND:', JSON.stringify(sendRes, null, 2));
    }
  }

  proc.kill();
  process.exit(0);
}

main().catch(e => { console.error(e); proc.kill(); process.exit(1); });
