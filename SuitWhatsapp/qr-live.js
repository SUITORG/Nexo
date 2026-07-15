#!/usr/bin/env node
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const server = spawn('cmd.exe', ['/c', 'npx', '-y', 'wweb-mcp'], {
  env: { ...process.env, WHATSAPP_TARGET_NUMBER: '528110463721@c.us' },
  stdio: ['pipe', 'pipe', 'pipe']
});

let buffer = '';
let qrFile = path.join(__dirname, 'qr.txt');

server.stdout.on('data', (data) => {
  buffer += data.toString();
  try {
    const lines = buffer.split('\n');
    buffer = lines.pop();
    for (const line of lines) {
      if (line.trim()) {
        const msg = JSON.parse(line);
        if (msg.id === 1 && msg.result) {
          // Write QR to file for easy access
          const content = JSON.stringify(msg.result, null, 2);
          fs.writeFileSync(qrFile, content, 'utf8');
          console.log('QR saved to qr.txt');
        }
      }
    }
  } catch (e) {}
});

server.stderr.on('data', (data) => {
  const text = data.toString();
  if (text.includes('QR code generated')) {
    console.log('=== QR CODE GENERATED ===');
    console.log(text.replace(/\[[\d;]*m/g, '').replace(/\u001b/g, ''));
  }
});

// Initialize
server.stdin.write(JSON.stringify({
  jsonrpc: '2.0',
  id: 0,
  method: 'initialize',
  params: {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'whatsapp-client', version: '1.0.0' }
  }
}) + '\n');

// Connect
setTimeout(() => {
  server.stdin.write(JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: { name: 'connect', arguments: {} }
  }) + '\n');
}, 2000);

// Keep alive for 3 minutes
setTimeout(() => {
  server.kill();
  process.exit(0);
}, 180000);

console.log('Server running for 3 minutes. Scan QR when it appears.');
