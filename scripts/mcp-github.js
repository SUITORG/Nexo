require('dotenv').config({ path: require('path').join(__dirname, '..', '.env'), quiet: true });
require('child_process').spawnSync('npx -y @modelcontextprotocol/server-github', {
  stdio: 'inherit',
  shell: true,
  env: process.env
});
