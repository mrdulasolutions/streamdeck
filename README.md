# StreamDeck for MentraOS

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Built for MentraOS](https://img.shields.io/badge/built_for-MentraOS-4444ff.svg)](https://github.com/Mentra-Community/MentraOS)
[![GitHub stars](https://img.shields.io/github/stars/mrdulasolutions/streamdeck.svg?style=social)](https://github.com/mrdulasolutions/streamdeck/stargazers)
[![Last commit](https://img.shields.io/github/last-commit/mrdulasolutions/streamdeck.svg)](https://github.com/mrdulasolutions/streamdeck/commits/main)

A multi-destination RTMP streaming miniapp for Mentra Live smart glasses that ensures proper 16:9 output.

> **Why StreamDeck?**  
> Most glasses-first streaming tools were not built with strict 16:9 ingest requirements in mind. StreamDeck routes your Mentra Live camera feed through Mentra Cloud with rock-solid 16:9 presets, then fans it out to YouTube, Twitch, Kick, Restream, and more — so your viewers never see broken layouts or black bars again.

<!-- Demo: replace this with real screenshots or a GIF once you have them -->

## Demo

- _Screenshot of the StreamDeck webview UI (Home / Settings / Destinations)_
- _GIF of going live to YouTube + Twitch simultaneously_

---

## Table of contents

- [Why StreamDeck?](#why-streamdeck)
- [Features](#features)
- [Supported Platforms](#supported-platforms)
- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)
- [Star history](#star-history)

## Why StreamDeck?

The built-in Mentra streaming app can send video in non-standard aspect ratios that some platforms struggle to render. StreamDeck solves this by forcing proper 1280x720 (16:9) output through Mentra Cloud's managed streaming pipeline, giving you reliable streams on every major platform.

We built StreamDeck as an open-source contribution to the MentraOS ecosystem -- because the platform is open source, anyone can extend it.

## Features

- **True 16:9 output** -- Forces 1280x720, 854x480, or 640x360 resolution presets so platforms always receive a compatible stream
- **Multi-destination streaming** -- Stream to multiple platforms simultaneously through Mentra Cloud's managed RTMP fan-out
- **Live preview** -- HLS preview URL lets you monitor your stream in real time
- **Card-stack destination management** -- Add, remove, and configure destinations from a polished mobile webview UI
- **Platform logos and branding** -- Each destination card displays the platform's logo for quick identification
- **Stream title per destination** -- Set custom titles for each platform independently
- **Platform-specific guidance** -- Warnings for platforms like X and Instagram that require Restream for relay
- **Bottom navigation** -- Clean three-tab layout: Home, Settings, Destinations
- **No accounts or subscriptions** -- Just configure your stream keys and go live

## Supported Platforms

| Platform   | Method        | Notes                                      |
|------------|---------------|--------------------------------------------|
| YouTube    | Direct push   | RTMP to `a.rtmp.youtube.com/live2/`        |
| Twitch     | Direct push   | RTMP to `live.twitch.tv/app/`              |
| Kick       | Direct push   | RTMPS to Kick's ingest server              |
| Restream   | Direct push   | RTMP to `live.restream.io/live/`           |
| X (Twitter)| Via Restream  | No direct RTMP push; use Restream to relay |
| Instagram  | Via Restream  | No direct RTMP push; use Restream to relay |
| Custom     | Direct push   | Any RTMP/RTMPS endpoint you provide        |

## Quick Start

### Prerequisites

- [Bun](https://bun.sh) runtime installed
- A MentraOS developer account with a package name and API key
- Stream keys for your target platforms

### Setup

```bash
# Clone the repository
git clone https://github.com/mrdulasolutions/streamdeck.git
cd streamdeck

# Install dependencies
bun install
```

### Environment Variables

Create a `.env` file in the project root:

```env
PACKAGE_NAME=your-mentra-package-name
MENTRAOS_API_KEY=your-mentra-api-key
PORT=3000
```

### Development

```bash
# Start the dev server with hot reload
bun run dev

# Or start without hot reload
bun run start
```

The app will be available at `http://localhost:3000`.

For local development with Mentra Cloud, you can expose your local server via ngrok:

```bash
bun run tunnel
```

### Deploy to Railway

1. Push your repo to GitHub
2. Connect the repo to [Railway](https://railway.app)
3. Set the environment variables (`PACKAGE_NAME`, `MENTRAOS_API_KEY`, `PORT`) in Railway's dashboard
4. Railway will detect Bun and deploy automatically

See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for Fly.io and Docker recipes.

## Architecture

StreamDeck runs as an Express server built on the `@mentra/sdk` AppServer class. When a user opens the miniapp on their Mentra Live glasses, the SDK establishes a TPA session. The mobile webview (served via EJS templates) lets the user configure destinations and control the stream. When the user goes live, StreamDeck calls the SDK's managed streaming API, which sends the glasses' camera feed through Mentra Cloud. Mentra Cloud provides an HLS preview URL and simultaneously fans out the RTMP stream to all configured destinations with the correct 16:9 resolution and encoding parameters.

For a deeper dive (including the BLE → phone → cloud → RTMP pipeline), see [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Tech Stack

- **Runtime:** [Bun](https://bun.sh)
- **Framework:** [Express](https://expressjs.com)
- **Templating:** [EJS](https://ejs.co)
- **SDK:** [@mentra/sdk](https://www.npmjs.com/package/@mentra/sdk)
- **Hosting:** [Railway](https://railway.app)

## Troubleshooting

Common issues (black screen on platforms, preview problems, X/Instagram limitations, lockscreen behavior, etc.) are documented in [`docs/TROUBLESHOOTING.md`](docs/TROUBLESHOOTING.md).

If you hit something that isn’t covered there, please open an issue using the **Bug report** template.

## Roadmap

High-level ideas and future directions (voice commands, scene presets, auto-clips, analytics, etc.) live in [`ROADMAP.md`](ROADMAP.md).

## Contributing

Contributions are welcome -- bug fixes, new platform integrations, UI improvements, and documentation.

- Read [`CONTRIBUTING.md`](CONTRIBUTING.md) for setup, branch strategy, and PR process
- Check [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md) for expected behavior
- See [`SECURITY.md`](SECURITY.md) for how to report vulnerabilities privately

See [CONTRIBUTORS.md](CONTRIBUTORS.md) for the contributor list.

## License

MIT -- see [LICENSE](LICENSE) for details.

## Star history

Track how the project evolves over time:

[![Star History Chart](https://api.star-history.com/svg?repos=mrdulasolutions/streamdeck&type=Date)](https://star-history.com/#mrdulasolutions/streamdeck&Date)

## Credits

Built on [MentraOS](https://github.com/Mentra-Community/MentraOS), the open-source smart glasses operating system by [Mentra, Inc.](https://mentra.glass)

Built with [Claude Code](https://claude.ai) by Anthropic.
