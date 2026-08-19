# ADR-008: SuitCampanas Security & History Fix

**Date:** 2026-07-10
**Status:** Accepted
**Risk:** Medium
**Workflow:** bugfix + feature (hybrid)

---

## Context

SuitCampanas (puerto 8000) had multiple security vulnerabilities and architectural issues:
1. Hardcoded secrets in client-side code (token, Google API keys)
2. Shared AI model state across concurrent users (race condition)
3. Path traversal vulnerability in `/api/bdpv/open`
4. Campaign history only in Google Sheets (no Supabase)
5. Inconsistent error response formats
6. Unicode corruption in models-config.js

## Decision

### Fase 1: Security Fixes

#### 1.1 Secrets removed from client
- **Before:** `script.js:7` had `TOKEN: 'SUITORG_SECURE_TOKEN_2026'`, `DRIVE_API_KEY`, `DRIVE_CLIENT_ID` hardcoded
- **After:** New endpoint `GET /api/config/client` serves public config from `.env`. Frontend loads config async at startup.
- **Files:** `script.js:4-27`, `local-server-node.js:97-106`

#### 1.2 Model state isolated per-request
- **Before:** `local-server-node.js:707` mutated global `activeModel` — any user could change model for all users
- **After:** `const requestModel = (reqModel && MODELS[reqModel]) ? reqModel : activeModel;` — per-request, no global mutation
- **File:** `local-server-node.js:706-707`

#### 1.3 Path traversal blocked
- **Before:** `/api/bdpv/open` accepted any `filePath` from client
- **After:** Validates path resolves within `__dirname/presentations/` directory
- **File:** `local-server-node.js:872-898`

#### 1.4 Error format consistent
- **Before:** `res.writeHead(400); res.end('Invalid JSON')` (plain text)
- **After:** `res.end(JSON.stringify({ status: 'error', message: 'Invalid JSON' }))` (JSON)
- **File:** `local-server-node.js:750`

### Fase 2: Dual History (Supabase + GAS)

#### 2.1 Dual-write on save
- **Before:** Form submit only sent to GAS via `no-cors`
- **After:** Sends to GAS first, then to Supabase `/api/campanas` POST (non-blocking)
- **File:** `script.js:616-680`

#### 2.2 Dual-read with fallback
- **Before:** `fetchHistory()` only read from GAS
- **After:** Tries Supabase `/api/campanas` first, falls back to GAS `/api/history`
- **File:** `script.js:1213-1252`

#### 2.3 Supabase endpoint enhanced
- **Before:** `/api/campanas` POST only saved basic fields
- **After:** Accepts `contenido`, `modo`, `plataforma`, `metadata` via `upsert`
- **File:** `local-server-node.js:241-272`

### Fase 3: Minor Fixes

- **Unicode:** `models-config.js:34` — `"Meta最新"` → `"Meta (latest)"`
- **Null checks:** `fetchHistory()` now checks `refreshHistoryBtn` exists before `.classList`
- **HTML token:** Removed hardcoded `value="SUITORG_SECURE_TOKEN_2026"` from input

## Files Modified

| File | Changes | Lines touched |
|------|---------|---------------|
| `script.js` | Removed secrets, dual-write/read, null checks | ~80 lines |
| `local-server-node.js` | Config endpoint, model isolation, path guard, error format, enhanced campanas POST | ~50 lines |
| `models-config.js` | Unicode fix | 1 line |
| `index.html` | Token input cleared | 1 line |

## Rollback

Backup created at `SuitCampanas/._backup/` with original versions of:
- `script.js`
- `local-server-node.js`
- `models-config.js`
- `index.html`

To restore: `cp ._backup/* .`

## Validation

1. `node --check script.js` ✓
2. `node --check local-server-node.js` ✓
3. `node --check models-config.js` ✓
4. All 8 mode handlers intact: Ai, BD, BDPR, IMG, BDSMT, BDPV, ViRe, VIDE
5. All generation paths preserved: BDPV, BDPR, BDSMT, AI (main)
6. No breaking changes to existing buttons

## Consequences

- **Positive:** Secrets no longer exposed in client, model race condition fixed, path traversal blocked, history now in Supabase with GAS fallback
- **Negative:** Token field is now empty by default (user must enter it)
- **Neutral:** GAS still works as fallback, no migration needed

---

*Decision recorded by SuitOS agent session — 2026-07-10*
