const scanner = require('../services/modelScanner');
const circuitBreaker = require('../services/circuitBreaker');
const router = require('../services/modelRouter');

function health(req, res) {
  const models = scanner.getCached();
  res.json({
    status: 'ok',
    module: 'SuitAI',
    scannedModels: models.length,
    cachedUntil: models.length > 0 ? new Date(scanner.lastScan + 3600000).toISOString() : null
  });
}

async function listModels(req, res) {
  try {
    const force = req.query.force === 'true';
    const models = await scanner.scan(force);
    const result = models.map(m => {
      const cb = circuitBreaker.getStatus(m.id);
      return {
        id: m.id,
        provider: m.provider,
        source: m.source,
        latency_ms: m.latency_ms,
        last_verified: m.last_verified,
        context_length: m.context_length,
        available: cb.available,
        circuit_failures: cb.failures
      };
    });
    res.json({ models: result, count: result.length, cache: { lastScan: scanner.lastScan } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function refreshModels(req, res) {
  try {
    scanner.clearCache();
    const models = await scanner.scan(true);
    res.json({ models: models.length, message: 'Cache refreshed' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function chat(req, res) {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array required' });
  }
  try {
    const result = await router.route(messages);
    res.json({
      choices: [{ message: { content: result.content, role: 'assistant' } }],
      model: result.model,
      latency_ms: result.latency
    });
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
}

function circuitStatus(req, res) {
  const status = circuitBreaker.getAllStatus();
  res.json({ models: status });
}

module.exports = { health, listModels, refreshModels, chat, circuitStatus };
