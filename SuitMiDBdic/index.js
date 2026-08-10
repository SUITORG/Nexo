const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname)));

const SUITAI_URL = process.env.SUITAI_URL || 'http://localhost:3010';

// Proxy hacia SuitAI (evita CORS: el navegador solo habla con este puerto)
app.post('/api/generar', async (req, res) => {
  const { prompt } = req.body || {};
  if (!prompt) return res.status(400).json({ error: 'prompt requerido' });
  try {
    const r = await fetch(`${SUITAI_URL}/api/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] })
    });
    const data = await r.json();
    if (!r.ok) return res.status(502).json({ error: data.error || 'SuitAI error' });
    res.json({ content: data.choices?.[0]?.message?.content || '', model: data.model });
  } catch (e) {
    res.status(502).json({ error: `No se pudo contactar a SuitAI (${SUITAI_URL}): ${e.message}` });
  }
});

// Main route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'dictionary.html'));
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    module: 'SuitDiccionario',
    port: 3013,
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3013;
app.listen(PORT, () => {
  console.log('');
  console.log('  ╔═══════════════════════════════════════════════════════════════╗');
  console.log('  ║                                                               ║');
  console.log('  ║   ███╗   ███╗██╗███████╗███████╗ ██████╗                    ║');
  console.log('  ║   ████╗ ████║██║██╔════╝██╔════╝██╔════╝                    ║');
  console.log('  ║   ██╔████╔██║██║███████╗█████╗  ██║                          ║');
  console.log('  ║   ██║╚██╔╝██║██║╚════██║██╔══╝  ██║                          ║');
  console.log('  ║   ██║ ╚═╝ ██║██║███████║███████╗╚██████╗                    ║');
  console.log('  ║   ╚═╝     ╚═╝╚═╝╚══════╝╚══════╝ ╚═════╝                   ║');
  console.log('  ║                                                               ║');
  console.log('  ║        DICCIONARIO INGLÉS → ESPAÑOL POR TEMAS                ║');
  console.log('  ║                                                               ║');
  console.log('  ╚═══════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`  Servidor ejecutándose en: http://localhost:${PORT}`);
  console.log('');
});

module.exports = app;