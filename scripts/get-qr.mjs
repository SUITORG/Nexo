import { spawn } from 'child_process';

const proc = spawn('npx', ['-y', '@kahflane/whatsapp-mcp'], {
  stdio: ['pipe', 'pipe', 'pipe'],
  env: {
    ...process.env,
    WA_PAIRING_NUMBER: '',
    WA_SYNC_FULL_HISTORY: 'true',
    WA_DAILY_CAP: '100',
    WA_DATA_DIR: require('path').join(require('os').homedir(), '.whatsapp-mcp'),
    WA_LOG_LEVEL: 'info'
  }
});

let buffer = '';
let initialized = false;

proc.stdout.on('data', (data) => {
  buffer += data.toString();
  const lines = buffer.split('\n');
  buffer = lines.pop() || '';
  
  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const msg = JSON.parse(line);
      
      if (msg.id === 1 && msg.result && !initialized) {
        initialized = true;
        // Send wa_get_login_qr tool call
        const req = JSON.stringify({
          jsonrpc: '2.0',
          id: 2,
          method: 'tools/call',
          params: { name: 'wa_get_login_qr', arguments: {} }
        });
        proc.stdin.write(req + '\n');
      }
      
      if (msg.id === 2 && msg.result) {
        const content = msg.result.content || [];
        for (const item of content) {
          if (item.type === 'text') {
            console.log('TEXT:', item.text);
          }
          if (item.type === 'image' || item.data) {
            console.log('IMAGE DATA available');
          }
        }
        
        // Also check for saved PNG
        const pngPath = require('path').join(require('os').homedir(), '.whatsapp-mcp', 'login-qr.png');
        if (require('fs').existsSync(pngPath)) {
          console.log('PNG saved at:', pngPath);
        }
        
        proc.kill();
        process.exit(0);
      }
      
      // Handle errors
      if (msg.id === 2 && msg.error) {
        console.error('Error:', JSON.stringify(msg.error));
        proc.kill();
        process.exit(1);
      }
    } catch (e) {
      // Not JSON yet, keep buffering
    }
  }
});

proc.stderr.on('data', (data) => {
  const str = data.toString();
  // Check for QR-related content in stderr
  if (str.includes('QR') || str.includes('qrcode') || str.includes('login') || str.includes('png') || str.includes('scan')) {
    console.log('STDERR:', str);
  }
});

proc.on('close', (code) => {
  if (!initialized) {
    console.log('Process exited before init');
  }
});

// Send initialize request
const initReq = JSON.stringify({
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {
    protocolVersion: '2024-11-05',
    capabilities: { tools: {} },
    clientInfo: { name: 'opencode', version: '1.0.0' }
  }
});
proc.stdin.write(initReq + '\n');

setTimeout(() => {
  console.log('Timeout');
  proc.kill();
  process.exit(1);
}, 30000);
