#!/usr/bin/env node
const { spawn } = require('child_process');

const server = spawn('cmd.exe', ['/c', 'npx', '-y', '@mhrj/whatsapp-mcp'], {
  env: { ...process.env, WHATSAPP_TARGET_NUMBER: '528110463721@s.whatsapp.net' },
  stdio: ['pipe', 'pipe', 'pipe']
});

let buffer = '';
let callId = 0;

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
          console.log('\n=== CONNECT AGAIN ===');
          console.log(JSON.stringify(msg.result, null, 2));
        }
        if (msg.id === 4 && msg.result) {
          console.log('\n=== STATUS AGAIN ===');
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
  callId = 1;
  const connectMsg = {
    jsonrpc: '2.0',
    id: callId,
    method: 'tools/call',
    params: {
      name: 'connect',
      arguments: {}
    }
  };
  server.stdin.write(JSON.stringify(connectMsg) + '\n');
}, 2000);

// Send get_status after 10 seconds
setTimeout(() => {
  callId = 2;
  const statusMsg = {
    jsonrpc: '2.0',
    id: callId,
    method: 'tools/call',
    params: {
      name: 'get_status',
      arguments: {}
    }
  };
  server.stdin.write(JSON.stringify(statusMsg) + '\n');
}, 10000);

// Send connect again after 15 seconds
setTimeout(() => {
  callId = 3;
  const connectMsg = {
    jsonrpc: '2.0',
    id: callId,
    method: 'tools/call',
    params: {
      name: 'connect',
      arguments: {}
    }
  };
  server.stdin.write(JSON.stringify(connectMsg) + '\n');
}, 15000);

// Send get_status again after 20 seconds
setTimeout(() => {
  callId = 4;
  const statusMsg = {
    jsonrpc: '2.0',
    id: callId,
    method: 'tools/call',
    params: {
      name: 'get_status',
      arguments: {}
    }
  };
  server.stdin.write(JSON.stringify(statusMsg) + '\n');
}, 20000);

setTimeout(() => {
  server.kill();
  process.exit(0);
}, 30000);