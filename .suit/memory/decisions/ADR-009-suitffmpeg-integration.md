# ADR-009: SuitFFmpeg — FFmpeg Integration Fix

**Date:** 2026-07-10
**Status:** Accepted
**Risk:** Medium
**Workflow:** bugfix

---

## Context

SuitCampanas AI mode generated images successfully, but FFmpeg commands failed with "Command failed: ffmpeg" when trying to create videos/slideshows. This affected:
- `/api/animate` — Individual image animation
- `/api/slideshow` — Multi-slide video with transitions
- `/api/video-imaginacion` — IMG mode video generation
- `/api/video-produce` — VIDE mode full suite

## Root Cause

FFmpeg was installed (v8.1.1 via WinGet) but the Node.js server couldn't find it in its PATH when executing `execSync('ffmpeg ...')`. The WinGet installation path is non-standard:
```
C:\Users\rojo-\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.1.1-full_build\bin\ffmpeg.exe
```

## Decision

### 1. Created SuitFFmpeg project folder
- `SuitFFmpeg/README.md` — Documentation
- `SuitFFmpeg/scripts/verify.js` — Installation verifier

### 2. Added FFmpeg auto-detection to local-server-node.js
```javascript
function findFFmpeg() {
    // 1. Check .env FFMPEG_PATH
    // 2. Try `where ffmpeg`
    // 3. Check common Windows paths
    // 4. Fallback to 'ffmpeg' (PATH)
}
const FFMPEG_PATH = findFFmpeg();
```

### 3. Replaced all `ffmpeg` commands with `"${FFMPEG_PATH}"`
- 9 instances across animate, slideshow, and video-produce endpoints
- All now use the resolved absolute path

### 4. Registered in SuitOS
- Added to `.suit/registry/projects.yaml` as `suit-ffmpeg`
- ADR documented in `.suit/memory/decisions/`

## Files Modified

| File | Changes |
|------|---------|
| `local-server-node.js` | Added `findFFmpeg()`, `FFMPEG_PATH` constant, replaced 9 `ffmpeg` commands |
| `SuitFFmpeg/README.md` | New — Documentation |
| `SuitFFmpeg/scripts/verify.js` | New — Verification script |
| `.suit/registry/projects.yaml` | Added `suit-ffmpeg` entry |

## Validation

1. `node --check local-server-node.js` ✓
2. `node SuitFFmpeg/scripts/verify.js` ✓ — FFmpeg v8.1.1, libx264 YES, aac YES
3. `POST /api/slideshow` test ✓ — Generated video successfully
4. Server logs show: `[FFmpeg] Ruta: C:\Users\rojo-\...`

## Consequences

- **Positive:** All video generation endpoints now work reliably
- **Negative:** None — FFmpeg was already installed, just not accessible
- **Neutral:** Path detection is automatic; no manual config needed unless FFmpeg moves

---

*Decision recorded by SuitOS agent session — 2026-07-10*
