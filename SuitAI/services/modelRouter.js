const https = require('https');
const http = require('http');
const scanner = require('./modelScanner');
const circuitBreaker = require('./circuitBreaker');

const FALLBACK_GEMINI_KEY = process.env.GEMINI_API_KEY;

function buildRequest(modelId, messages, apiKey) {
  const body = JSON.stringify({
    model: modelId,
    messages: messages.map(m => ({ role: m.role || 'user', content: m.content })),
    max_tokens: 2048,
    temperature: 0.7
  });
  return body;
}

function callDirectGoogle(messages) {
  return new Promise((resolve, reject) => {
    if (!FALLBACK_GEMINI_KEY) return reject(new Error('No GEMINI_API_KEY configured'));
    const prompt = messages[messages.length - 1].content;
    const postData = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 2048 }
    });
    const opts = {
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1/models/gemini-1.5-flash:generateContent?key=${FALLBACK_GEMINI_KEY}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) }
    };
    const start = Date.now();
    const req = https.request(opts, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode !== 200) return reject(new Error(`Gemini HTTP ${res.statusCode}: ${data}`));
        try {
          const json = JSON.parse(data);
          const text = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
          circuitBreaker.recordSuccess('google/gemini-1.5-flash', Date.now() - start);
          resolve({ model: 'google/gemini-1.5-flash', content: text, latency: Date.now() - start });
        } catch (e) {
          reject(new Error('Failed to parse Gemini response'));
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Gemini timeout')); });
    req.setTimeout(15000);
    req.write(postData);
    req.end();
  });
}

function callModel(endpoint, modelId, apiKey, messages) {
  return new Promise((resolve, reject) => {
    const body = buildRequest(modelId, messages, apiKey);
    const urlObj = new URL(endpoint);
    const proto = endpoint.startsWith('https') ? https : http;
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
      timeout: 30000
    };
    const start = Date.now();
    const req = proto.request(opts, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        const latency = Date.now() - start;
        if (res.statusCode !== 200) {
          circuitBreaker.recordFailure(modelId);
          return reject(new Error(`HTTP ${res.statusCode} from ${modelId}: ${data.slice(0, 200)}`));
        }
        try {
          const json = JSON.parse(data);
          const content = json.choices?.[0]?.message?.content || json.candidates?.[0]?.content?.parts?.[0]?.text || '';
          circuitBreaker.recordSuccess(modelId, latency);
          resolve({ model: modelId, content, latency });
        } catch (e) {
          circuitBreaker.recordFailure(modelId);
          reject(new Error(`Failed to parse response from ${modelId}: ${e.message}`));
        }
      });
    });
    req.on('error', (e) => { circuitBreaker.recordFailure(modelId); reject(e); });
    req.on('timeout', () => { req.destroy(); circuitBreaker.recordFailure(modelId); reject(new Error(`Timeout from ${modelId}`)); });
    req.setTimeout(30000);
    req.write(body);
    req.end();
  });
}

async function route(messages) {
  const models = await scanner.scan(false);
  const errors = [];

  const modelPriority = models.filter(m => m.latency_ms !== null)
    .sort((a, b) => a.latency_ms - b.latency_ms);

  const untested = models.filter(m => m.latency_ms === null && m.source !== 'fallback');
  const ordered = [...modelPriority, ...untested, ...models.filter(m => m.source === 'fallback')];

  for (const m of ordered) {
    if (!circuitBreaker.isAvailable(m.id)) {
      errors.push(`${m.id} (circuit open)`);
      continue;
    }
    if (m.source === 'fallback' && m.id === 'google/gemini-1.5-flash') {
      try {
        return await callDirectGoogle(messages);
      } catch (e) {
        errors.push(`google/gemini-1.5-flash: ${e.message}`);
        continue;
      }
    }
    const apiKey = m.source === 'openrouter'
      ? process.env.OPENROUTER_API_KEY
      : process.env.OPENCODE_API_KEY;
    if (!apiKey) { errors.push(`${m.id} (no API key)`); continue; }
    try {
      return await callModel(m.endpoint, m.id, apiKey, messages);
    } catch (e) {
      errors.push(`${m.id}: ${e.message}`);
      continue;
    }
  }

  try {
    return await callDirectGoogle(messages);
  } catch (e) {
    errors.push(`google/gemini-1.5-flash: ${e.message}`);
  }

  throw new Error(`All models failed:\n${errors.join('\n')}`);
}

module.exports = { route };
