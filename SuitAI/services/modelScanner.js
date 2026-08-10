const https = require('https');
const http = require('http');

const CACHE_TTL = 60 * 60 * 1000;
let modelCache = { models: [], lastScan: 0, scanning: false };

const OPENROUTER_MODELS_URL = 'https://openrouter.ai/api/v1/models?max_price=0&sort=latency-low-to-high';
const OPENCODE_ZEN_MODELS_URL = 'https://opencode.ai/zen/v1/models';
const OMNIROUTE_BASE_URL = process.env.OMNIROUTE_BASE_URL || 'http://localhost:20128/v1';

function fetchJson(url, apiKey) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http;
    const opts = { headers: { 'Accept': 'application/json' } };
    if (apiKey) opts.headers['Authorization'] = `Bearer ${apiKey}`;
    proto.get(url, opts, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); }
        catch (e) { reject(new Error(`Failed to parse JSON from ${url}: ${e.message}`)); }
      });
    }).on('error', reject);
  });
}

function pingModel(endpoint, apiKey, modelId) {
  return new Promise((resolve) => {
    const body = JSON.stringify({
      model: modelId,
      messages: [{ role: 'user', content: 'hi' }],
      max_tokens: 1
    });
    const proto = endpoint.startsWith('https') ? https : http;
    const urlObj = new URL(endpoint);
    const opts = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(body)
      },
      timeout: 5000
    };
    const start = Date.now();
    const req = proto.request(opts, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        const latency = Date.now() - start;
        resolve({ ok: res.statusCode === 200, latency, statusCode: res.statusCode });
      });
    });
    req.on('timeout', () => { req.destroy(); resolve({ ok: false, latency: 5000, error: 'timeout' }); });
    req.on('error', (e) => resolve({ ok: false, latency: Date.now() - start, error: e.message }));
    req.write(body);
    req.end();
  });
}

function parseOpenRouterModels(data) {
  if (!data || !data.data) return [];
  return data.data
    .filter(m => {
      const p = m.pricing || {};
      const promptPrice = p.prompt !== undefined && p.prompt !== null ? parseFloat(p.prompt) : Infinity;
      const completionPrice = p.completion !== undefined && p.completion !== null ? parseFloat(p.completion) : Infinity;
      const isFree = (promptPrice === 0 && completionPrice === 0) || (promptPrice <= 0.00001 && completionPrice <= 0.00001);
      // descarta clasificadores/moderación/embeddings — no sirven para chat general
      const isNonChat = /safety|guard|moderation|embed|rerank/i.test(m.id || '');
      return isFree && !isNonChat;
    })
    .map(m => ({
      id: m.id,
      name: m.name || m.id,
      provider: 'openrouter',
      source: 'openrouter',
      endpoint: 'https://openrouter.ai/api/v1/chat/completions',
      context_length: m.context_length || 0,
      latency_ms: null,
      last_verified: null
    }));
}

function parseOpenCodeZenModels(data) {
  if (!data || !Array.isArray(data)) return [];
  return data
    .filter(m => {
      const id = (m.id || '').toLowerCase();
      return id.includes('free');
    })
    .map(m => ({
      id: m.id,
      name: m.name || m.id,
      provider: 'opencode-zen',
      source: 'opencode-zen',
      endpoint: 'https://opencode.ai/zen/v1/chat/completions',
      context_length: m.context_length || 0,
      latency_ms: null,
      last_verified: null
    }));
}

function parseOmniRouteModels(data) {
  if (!data || !Array.isArray(data.data)) return [];
  return data.data
    .filter(m => {
      if (m.type) return false; // descarta embedding/image/rerank/video, solo modelos de chat
      const idLower = (m.id || '').toLowerCase();
      const nameLower = (m.name || '').toLowerCase();
      return idLower.includes('free') || nameLower.includes('free') || nameLower.includes('🆓');
    })
    .map(m => ({
      id: m.id,
      name: m.name || m.id,
      provider: 'omniroute',
      source: 'omniroute',
      endpoint: `${OMNIROUTE_BASE_URL}/chat/completions`,
      context_length: m.context_length || 0,
      latency_ms: null,
      last_verified: null
    }));
}

async function scanOpenRouter() {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    const data = await fetchJson(OPENROUTER_MODELS_URL, apiKey);
    return parseOpenRouterModels(data);
  } catch (e) {
    console.error('[SCANNER] OpenRouter scan failed:', e.message);
    return [];
  }
}

async function scanOpenCodeZen() {
  try {
    const apiKey = process.env.OPENCODE_API_KEY;
    if (!apiKey) {
      console.warn('[SCANNER] No OPENCODE_API_KEY set, skipping OpenCode Zen scan');
      return [];
    }
    const data = await fetchJson(OPENCODE_ZEN_MODELS_URL, apiKey);
    return parseOpenCodeZenModels(data);
  } catch (e) {
    console.error('[SCANNER] OpenCode Zen scan failed:', e.message);
    return [];
  }
}

async function scanOmniRoute() {
  try {
    const apiKey = process.env.OMNIROUTE_API_KEY;
    const data = await fetchJson(`${OMNIROUTE_BASE_URL}/models`, apiKey);
    return parseOmniRouteModels(data);
  } catch (e) {
    console.error('[SCANNER] OmniRoute scan failed:', e.message);
    return [];
  }
}

async function verifyModels(models) {
  const results = [];
  for (const m of models) {
    const apiKey = m.source === 'openrouter'
      ? process.env.OPENROUTER_API_KEY
      : m.source === 'omniroute'
      ? process.env.OMNIROUTE_API_KEY
      : process.env.OPENCODE_API_KEY;
    if (!apiKey) { results.push({ ...m, latency_ms: null, last_verified: null }); continue; }
    const ping = await pingModel(m.endpoint, apiKey, m.id);
    results.push({
      ...m,
      latency_ms: ping.ok ? ping.latency : null,
      last_verified: ping.ok ? new Date().toISOString() : null
    });
  }
  return results.sort((a, b) => (a.latency_ms || 9999) - (b.latency_ms || 9999));
}

const FALLBACK_MODELS = [
  { id: 'google/gemini-flash-latest', provider: 'google', source: 'fallback', endpoint: null, context_length: 32000 },
  { id: 'meta-llama/llama-3.3-70b-instruct', provider: 'openrouter', source: 'openrouter', endpoint: 'https://openrouter.ai/api/v1/chat/completions', context_length: 128000 },
  { id: 'google/gemma-4-31b-it:free', provider: 'openrouter', source: 'openrouter', endpoint: 'https://openrouter.ai/api/v1/chat/completions', context_length: 32000 },
  { id: 'nvidia/nemotron-3-nano-30b-a3b:free', provider: 'openrouter', source: 'openrouter', endpoint: 'https://openrouter.ai/api/v1/chat/completions', context_length: 32000 }
];

async function scan(force) {
  if (modelCache.scanning) return modelCache.models;
  const now = Date.now();
  if (!force && modelCache.models.length > 0 && (now - modelCache.lastScan) < CACHE_TTL) {
    return modelCache.models;
  }
  modelCache.scanning = true;
  try {
    const [orModels, ocModels, omniModels] = await Promise.all([scanOpenRouter(), scanOpenCodeZen(), scanOmniRoute()]);
    let all = [...orModels, ...ocModels, ...omniModels];
    if (all.length === 0) {
      console.warn('[SCANNER] No free models found from any provider, using fallback');
      all = FALLBACK_MODELS;
    } else {
      all = await verifyModels(all);
    }
    modelCache.models = all;
    modelCache.lastScan = now;
    console.log(`[SCANNER] Scanned ${all.length} free models (${orModels.length} OR, ${ocModels.length} OCZ, ${omniModels.length} OmniRoute)`);
    return all;
  } finally {
    modelCache.scanning = false;
  }
}

function getCached() {
  return modelCache.models;
}

function clearCache() {
  modelCache = { models: [], lastScan: 0, scanning: false };
}

module.exports = { scan, getCached, clearCache, get lastScan() { return modelCache.lastScan; } };
