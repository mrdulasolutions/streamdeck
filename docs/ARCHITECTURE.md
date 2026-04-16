# Architecture

This document gives a high-level view of how StreamDeck connects Mentra Live smart glasses to RTMP destinations via Mentra Cloud and Railway.

---

## Overview

At a high level, the system looks like this:

1. **Glasses (Mentra Live)** — capture audio/video and run the miniapp shell
2. **BLE → Phone** — the glasses talk to the phone via Bluetooth Low Energy
3. **MentraOS companion app** — hosts the webview and forwards messages to Mentra Cloud
4. **StreamDeck backend (this repo)** — a Bun/Express app running on Railway (or locally)
5. **Mentra Cloud managed streaming** — turns the camera feed into HLS + RTMP fan-out
6. **RTMP destinations** — YouTube, Twitch, Kick, Restream, custom ingest, etc.

The core goal is to force a consistent 16:9 output (720p/480p/360p) so platforms never see strange aspect ratios or black bars.

---

## Data flow: glasses → BLE → phone → cloud → RTMP

1. **User opens StreamDeck miniapp on Mentra Live**  
   - MentraOS boots the miniapp defined by your `PACKAGE_NAME`
   - The `@mentra/sdk` creates a `TpaSession` between the glasses, the companion app, and this backend

2. **Webview loads on the phone**  
   - The companion app opens a mobile webview pointing at `/webview` on this server
   - `src/webview.ts` renders `src/views/webview.ejs` with:
     - Current user settings (resolution, saved destinations)
     - Any active managed stream status and preview URLs

3. **User configures destinations**  
   - In the webview UI, the user:
     - Adds platforms (YouTube, Twitch, X via Restream, Instagram via Restream, Kick, Restream, Custom)
     - Pastes RTMP server URLs and stream keys
     - Picks a resolution preset (720p, 480p, 360p — all 16:9)
   - The UI calls `POST /api/settings` to persist settings per user via `MentraStreamDeck.saveSettingsForUser`

4. **Preview mode**  
   - When the user taps the preview area:
     - The webview calls `POST /api/preview`
     - The backend calls `session.camera.startManagedStream()` **without** any restream destinations
     - Mentra Cloud starts a managed stream and returns preview URLs (HLS/DASH/WebRTC)
   - The webview:
     - Polls `/api/status` until `hlsUrl` is available
     - Connects an `<video>` element to the HLS feed using Hls.js or native HLS
     - Shows preview-only badges and keeps the phone awake via the Wake Lock API

5. **Go live (managed stream + RTMP fan-out)**  
   - When the user taps **Go Live**:
     - The UI builds a list of selected destinations (RTMP URL + stream key)
     - Calls `POST /api/go-live` with the indices of those destinations
   - The backend:
     - Validates the selected destinations
     - Builds `restreamDestinations` by concatenating RTMP base URL and stream key
     - Uses `session.camera.startManagedStream({ restreamDestinations, video, audio })`
       - `video` is derived from the 16:9 preset
       - `audio` uses sane defaults (AAC, 128kbps, echo cancellation, noise suppression)
     - Mentra Cloud:
       - Receives the glasses camera feed
       - Produces an **HLS preview** for the UI
       - Simultaneously forwards the RTMP feed to every configured destination

6. **Stopping the stream**  
   - When the user taps **Stop Stream**:
     - The webview calls `POST /api/stop`
     - The backend calls `session.camera.stopManagedStream()`
     - State is reset and the preview is torn down

---

## Components in this repo

### `src/index.ts` — App server and streaming orchestration

Key responsibilities:

- Extends `AppServer` from `@mentra/sdk`
- Validates required env vars (`PACKAGE_NAME`, `MENTRAOS_API_KEY`)
- Configures:
  - Port (default `3000`)
  - Public assets directory
- Tracks per-user state:
  - `UserPersistentSettings` (resolution + destinations)
  - `UserStreamState` (current managed stream status, URLs, active destinations)
- Provides methods called from the webview routes:
  - `getResolutionPresets` / `getPlatforms`
  - `getSettingsForUser` / `saveSettingsForUser`
  - `getStreamStateForUser`
  - `startPreviewForUser`
  - `goLiveForUser`
  - `stopStreamForUser`
- Subscribes to `camera.onManagedStreamStatus` to keep state and UI in sync

### `src/webview.ts` — Express routes for the mobile UI

Responsibilities:

- Adapts the generic `AppServer` instance into a `MentraStreamDeck`-aware router
- Sets up:
  - `GET /webview` — main UI
  - `GET /api/status` — current stream state and preview URLs
  - `POST /api/settings` — persist resolution + destinations
  - `POST /api/preview` — start preview-only managed stream
  - `POST /api/go-live` — start managed stream + RTMP fan-out
  - `POST /api/stop` — stop any active managed stream

### `src/views/webview.ejs` — StreamDeck UI

Responsibilities:

- Renders a mobile-first UI optimized for the Mentra companion app:
  - Preview area with HLS player
  - Live status + metrics (status, resolution, FPS, bitrate, uptime, health)
  - Destination summary chips
  - Go Live / Stop Stream button
  - Settings (resolution presets, stream parameters)
  - Destinations card stack (per-platform config, warnings, title hints)
  - Bottom navigation (Home / Settings / Destinations)
- Handles:
  - Local state for user destinations and resolution
  - API calls to the backend
  - HLS playback with retries
  - Wake Lock behavior to prevent lockscreen mid-stream

---

## Railway, Fly.io, and Docker

The app is a standard Bun + Express server that:

- Listens on a single HTTP port (configurable via `PORT`)
- Is stateless by design — per-user state lives in memory and is reconstructed with each session
- Relies only on environment variables for secrets (no local disk writes)

This makes it a good fit for:

- Railway (zero-config Bun deploy)
- Fly.io (Docker image + regional deploy)
- Any container-based host that can expose a public URL back to Mentra Cloud

See `DEPLOYMENT.md` for concrete deployment recipes.

