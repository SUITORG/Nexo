require('dotenv').config();
require('child_process').spawnSync('npx', ['-y', '@supabase/mcp-server'], {
  stdio: 'inherit',
  env: process.env
});
