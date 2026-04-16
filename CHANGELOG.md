# Changelog

All notable changes to StreamDeck for MentraOS are documented in this file.

## [1.0.0] - 2026-04-16

### Added

- **Restream as a first-class destination** -- Restream can now be added directly alongside YouTube, Twitch, Kick, and Custom RTMP
- **Platform logos on destination cards** -- Each card displays the platform's official logo for quick visual identification
- **Image fallbacks** -- Graceful fallback when a platform logo fails to load
- **Managed streaming via Mentra Cloud** -- Streams route through Mentra Cloud for simultaneous HLS preview and multi-destination RTMP fan-out
- **Card-stack destination management** -- Swipeable card UI for adding, configuring, and removing stream destinations
- **Platform-specific warnings** -- X (Twitter) and Instagram cards display guidance that direct push is not supported and Restream should be used as a relay
- **Stream title per destination** -- Each destination card has its own stream title field
- **Multi-destination simultaneous streaming** -- Go live to multiple platforms at once with a single tap
- **Resolution presets** -- 720p, 480p, and 360p options, all enforcing 16:9 aspect ratio
- **Live preview** -- HLS preview URL available while streaming
- **Bottom navigation UI** -- Three-tab mobile webview layout: Home, Settings, Destinations
- **Express + EJS webview** -- Polished mobile-first UI served to the Mentra Live glasses companion app
- **MentraOS SDK integration** -- Built on `@mentra/sdk` AppServer with full TPA session lifecycle management
- **Railway deployment support** -- Production-ready with environment variable configuration
- **MIT License** -- Open source from day one
