const state = new Map();

const CONSECUTIVE_FAIL_LIMIT = 3;
const COOLDOWN_MS = 5 * 60 * 1000;
const MAX_HISTORY = 100;

function recordSuccess(modelId, latencyMs) {
  if (!state.has(modelId)) state.set(modelId, { failures: 0, cooldownUntil: 0, history: [] });
  const s = state.get(modelId);
  s.failures = 0;
  s.cooldownUntil = 0;
  s.history.push({ ok: true, latency: latencyMs, at: Date.now() });
  if (s.history.length > MAX_HISTORY) s.history = s.history.slice(-MAX_HISTORY);
}

function recordFailure(modelId) {
  if (!state.has(modelId)) state.set(modelId, { failures: 0, cooldownUntil: 0, history: [] });
  const s = state.get(modelId);
  s.failures++;
  s.history.push({ ok: false, latency: null, at: Date.now() });
  if (s.history.length > MAX_HISTORY) s.history = s.history.slice(-MAX_HISTORY);
  if (s.failures >= CONSECUTIVE_FAIL_LIMIT) {
    s.cooldownUntil = Date.now() + COOLDOWN_MS;
    console.warn(`[CIRCUIT] ${modelId} tripped — cooling down until ${new Date(s.cooldownUntil).toISOString()}`);
  }
}

function isAvailable(modelId) {
  const s = state.get(modelId);
  if (!s) return true;
  if (s.cooldownUntil > Date.now()) return false;
  return true;
}

function getStatus(modelId) {
  const s = state.get(modelId);
  if (!s) return { available: true, failures: 0, cooldownUntil: 0, cooldownRemaining: 0 };
  return {
    available: s.cooldownUntil <= Date.now(),
    failures: s.failures,
    cooldownUntil: s.cooldownUntil,
    cooldownRemaining: Math.max(0, s.cooldownUntil - Date.now())
  };
}

function getAllStatus() {
  const result = {};
  for (const [id, s] of state) {
    result[id] = {
      available: s.cooldownUntil <= Date.now(),
      failures: s.failures,
      cooldownUntil: s.cooldownUntil,
      successRate: s.history.length > 0
        ? (s.history.filter(h => h.ok).length / s.history.length * 100).toFixed(1) + '%'
        : 'N/A'
    };
  }
  return result;
}

module.exports = { recordSuccess, recordFailure, isAvailable, getStatus, getAllStatus };
