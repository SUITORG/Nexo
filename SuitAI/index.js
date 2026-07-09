const express = require('express');
const api = require('./handlers/api');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3010;

setTimeout(async () => {
  try {
    const scanner = require('./services/modelScanner');
    await scanner.scan(true);
    console.log(`[SuitAI] Initial model scan complete — ${scanner.getCached().length} models cached`);
  } catch (e) {
    console.error('[SuitAI] Initial scan failed:', e.message);
  }
}, 1000);

app.get('/api/ai/health', api.health);
app.get('/api/ai/models', api.listModels);
app.post('/api/ai/models/refresh', api.refreshModels);
app.post('/api/ai/chat', api.chat);
app.get('/api/ai/circuit', api.circuitStatus);

app.listen(PORT, () => {
  console.log(`SuitAI running on port ${PORT}`);
});

module.exports = app;
