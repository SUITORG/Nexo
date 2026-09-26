require('dotenv').config({ path: require('path').join(__dirname, '..', '.env'), quiet: true });
require('child_process').spawnSync('npx -y telegram-bot-mcp-server', {
  stdio: 'inherit',
  shell: true,
  env: process.env
});
