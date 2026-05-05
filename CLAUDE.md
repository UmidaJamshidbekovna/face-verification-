# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Vite dev server on port 3000 (host-bound, so reachable on LAN/tunnels for mobile/Telegram testing).
- `npm run build` — production build to `dist/`.
- `npm run preview` — serve the built bundle.

There is no test runner, linter, or formatter configured.

## Environment

Copy `.env.example` to `.env` and set:
- `VITE_API_BASE` — backend base URL. Defaults to `http://173.249.19.250:8000` in `vite.config.js`.
- `VITE_API_KEY` — optional; sent as the `API-Key` header if set.

The dev server proxies `/liveness/*` to `VITE_API_BASE`, but in the app `apiUrl()` prepends `VITE_API_BASE` directly, so requests go cross-origin in dev rather than through the proxy. Keep this in mind when debugging CORS — the proxy block currently isn't in the request path for production-style env wiring.

## Architecture

Single-component Vue 3 SPA designed to run as a **Telegram Mini App** for face liveness verification. All logic, template, and styles live in `src/App.vue` (~800 lines) — there is no router, no store, and no component decomposition. UI strings are in Uzbek.

### Screen state machine

`screen` advances through: `instructions` → `challenge` → `success` | `error`. Within `challenge`, `phase` cycles: `searching` (waiting for face) → `preparing` (3-2-1 countdown) → `recording` (3s frame capture) → `verifying` (backend poll) → `passed`. The `statusKey`/`statusText` computed props derive the visible status pill from `phase` + `faceReady`.

**Terminal-success invariant:** once a flow completes, `verifiedFinal` is set and `cancel()`, `resetToInstructions()`, and `startFlow()` all short-circuit back to the success screen. Do not introduce paths that bypass this — re-running verification after success is intentionally disabled.

### Face detection (client-side gating)

MediaPipe `FaceDetector` (`@mediapipe/tasks-vision`) runs in a `setTimeout(80ms)` loop. WASM and TFLite model are loaded from public CDNs (`cdn.jsdelivr.net`, `storage.googleapis.com/mediapipe-models`) — offline use will fail. GPU delegate is tried first, falls back to CPU, then to a "pretend face is ready" graceful degradation so the flow can still proceed if MediaPipe init fails entirely.

`faceReady` requires exactly one face, centered (within ideal box), at acceptable distance (bbox width 30–95% of `videoWidth*0.55`). The detector is `markRaw`'d to keep Vue reactivity off the heavy native object.

### Best-frame capture

`processDetections()` opportunistically saves a JPEG dataURL to `bestFrame` whenever the face is steady (`phase !== 'recording'`) and detection score beats the prior best (with a 350ms throttle). This frame becomes the success-screen profile picture. The video is mirrored (`scaleX(-1)`) for display and on the saved image.

### Backend protocol

Three endpoints, async task pattern:
1. `POST /liveness/challenge/` → `{ challenge_id, challenge_type }`. Frontend retries up to 5x to avoid repeating a `challenge_type` already used in this session (`usedChallengeTypes`).
2. `POST /liveness/verify/` with `{ challenge_id, frames: [dataURL, ...] }` → `{ task_id }`. Frames are captured every 200ms during the 3s recording window.
3. `GET /liveness/result/{task_id}/` polled up to 30× at 1s intervals. Treated as done when `status` ∈ {completed, failed, success, error} or `result != null`. Pass condition: `result.is_live ?? result.success`.

Challenge types and their UI titles/short labels are mapped in `TITLES`, `SHORT_LABELS`, and `ARROW` constants at the top of the `<script>` block. Add a new challenge type by extending all three (and `ARROW` only if it's a directional motion).

### Telegram integration

`window.Telegram?.WebApp` is consulted for:
- `HapticFeedback.impactOccurred` on key transitions (`haptic()` helper, fails silently outside Telegram).
- `sendData(...)` + `close()` in `finish()` to return the verification result to the bot and close the mini-app.

Outside Telegram, `finish()` is effectively a no-op and the user stays on the success screen — this is deliberate.

### Flow control

- `TOTAL_STEPS = 1` is a single constant; multi-step flows are wired (progress bar, `currentStep`) but currently only one challenge runs per session.
- `armNoFaceTimer()` shows the "Yuz topilmadi" error after 15s without `faceReady`.
- `waitForFaceReady()` polls every 120ms, 30s timeout.
- All async paths re-check `this.screen === 'challenge'` before continuing because the user can cancel mid-flow.
