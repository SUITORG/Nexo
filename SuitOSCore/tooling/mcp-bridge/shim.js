#!/usr/bin/env node
/**
 * MCP Shim — generic MCP server launcher with secret injection.
 *
 * Usage:
 *   node shim.js --package @supabase/mcp-server
 *   node shim.js --package @modelcontextprotocol/server-github --env GITHUB_TOKEN=ghp_xxx
 *
 * Injects current process.env plus any --env KEY=val overrides into the
 * child MCP process. The MCP server package must be installed or available
 * via npx.
 */
require('dotenv').config();
const { spawnSync } = require('child_process');

const args = process.argv.slice(2);
let pkg = null;
const extraEnv = {};

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--package' && args[i + 1]) {
    pkg = args[i + 1];
    i++;
  } else if (args[i] === '--env' && args[i + 1]) {
    const parts = args[i + 1].split('=');
    if (parts.length >= 2) {
      extraEnv[parts[0]] = parts.slice(1).join('=');
    }
    i++;
  }
}

if (!pkg) {
  console.error('Usage: node shim.js --package <npm-package> [--env KEY=val ...]');
  process.exit(1);
}

const env = { ...process.env, ...extraEnv };

const result = spawnSync('npx', ['-y', pkg], {
  stdio: 'inherit',
  env
});

process.exit(result.status);
