const { spawn } = require('child_process');

const server = spawn('cmd.exe', ['/c', 'npx', '-y', 'wweb-mcp'], {
  env: { ...process.env, WHATSAPP_TARGET_NUMBER: '528110463721@c.us' },
  stdio: ['pipe', 'pipe', 'pipe']
});

let buffer = '';

server.stdout.on('data', (data) => {
  buffer += data.toString();
  try {
    const lines = buffer.split('\n');
    buffer = lines.pop();
    for (const line of lines) {
      if (line.trim()) {
        const msg = JSON.parse(line);
        console.log('RECV:', JSON.stringify(msg, null, 2));
        if (msg.id === 1 && msg.result) {
          console.log('\n=== CONNECT RESULT ===');
          console.log(JSON.stringify(msg.result, null, 2));
        }
        if (msg.id === 2 && msg.result) {
          console.log('\n=== STATUS ===');
          console.log(JSON.stringify(msg.result, null, 2));
        }
        if (msg.id === 3 && msg.result) {
          console.log('\n=== GET QR ===');
          console.log(JSON.stringify(msg.result, null, 2));
        }
      }
    }
  } catch (e) {
    console.log('Raw:', data.toString());
  }
});

server.stderr.on('data', (data) => {
  console.error('STDERR:', data.toString());
});

// Send initialize
const initMsg = {
  jsonrpc: '2.0',
  id: 0,
  method: 'initialize',
  params: {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'test-client', version: '1.0.0' }
  }
};
server.stdin.write(JSON.stringify(initMsg) + '\n');

// Send connect tool call
setTimeout(() => {
  const connectMsg = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: {
      name: 'connect',
      arguments: {}
    }
  };
  server.stdin.write(JSON.stringify(connectMsg) + '\n');
}, 1000);

// Send get_status after 10 seconds
setTimeout(() => {
  const statusMsg = {
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/call',
    params: {
      name: 'get_status',
      arguments: {}
    }
  };
  server.stdin.write(JSON.stringify(statusMsg) + '\n');
}, 10000);

// Send get_qr_code after 15 seconds
setTimeout(() => {
  const qrMsg = {
    jsonrpc: '2.0',
    id: 3,
    method: 'tools/call',
    params: {
      name: 'get_qr_code',
      arguments: {}
    }
  };
  server.stdin.write(JSON.stringify(qrMsg) + '\n');
}, 15000);

setTimeout(() => {
  server.kill();
  process.exit(0);
}, 30000);