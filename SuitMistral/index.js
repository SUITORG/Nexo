const express = require('express');
const { Mistral } = require('@mistralai/mistralai');

const app = express();
app.use(express.json());

const MISTRAL_KEY = process.env.MISTRAL_API_KEY || '';
const client = MISTRAL_KEY ? new Mistral({ apiKey: MISTRAL_KEY }) : null;

// In-memory history: Map<sessionId, Array<{role, content}>>
const sessions = new Map();
const MAX_HISTORY = 50;

// POST /api/mistral/chat — chat completion con historial
app.post('/api/mistral/chat', async (req, res) => {
  if (!client) return res.status(500).json({ error: 'MISTRAL_API_KEY no configurada' });

  const { message, sessionId = 'default', model = 'mistral-large-latest', systemPrompt } = req.body;
  if (!message) return res.status(400).json({ error: 'message requerido' });

  try {
    if (!sessions.has(sessionId)) sessions.set(sessionId, []);
    const history = sessions.get(sessionId);

    if (systemPrompt && history.length === 0) {
      history.push({ role: 'system', content: systemPrompt });
    }

    history.push({ role: 'user', content: message });

    if (history.length > MAX_HISTORY) {
      const hasSystem = history[0]?.role === 'system';
      const trimmed = hasSystem
        ? [history[0], ...history.slice(-(MAX_HISTORY - 1))]
        : history.slice(-MAX_HISTORY);
      sessions.set(sessionId, trimmed);
    }

    const response = await client.chat.complete({
      model,
      messages: sessions.get(sessionId),
    });

    const reply = response.choices[0].message.content;
    sessions.get(sessionId).push({ role: 'assistant', content: reply });

    res.json({ reply, sessionId, model, usage: response.usage });
  } catch (err) {
    console.error('[MISTRAL_ERROR]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/mistral/chat/history — limpiar historial de una sesión
app.delete('/api/mistral/chat/history', (req, res) => {
  const { sessionId = 'default' } = req.body;
  sessions.delete(sessionId);
  res.json({ success: true, sessionId });
});

// GET /api/mistral/models — listar modelos disponibles
app.get('/api/mistral/models', async (req, res) => {
  if (!client) return res.status(500).json({ error: 'MISTRAL_API_KEY no configurada' });

  try {
    const response = await client.models.list();
    res.json(response.data || response);
  } catch (err) {
    console.error('[MISTRAL_MODELS_ERROR]', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = app;
