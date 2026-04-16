# StreamDeck Roadmap

This is a living roadmap for StreamDeck. It is intentionally ambitious — not everything here is promised, but it shows the direction we’d like to head as the MentraOS ecosystem grows.

Contributions are welcome on any of these fronts.

---

## Voice and hands-free control

- **Voice commands for core actions**
  - “Go live”, “Stop stream”, “Start preview”, “Switch to 480p”, etc.
- **Destination toggles via voice**
  - “Go live to YouTube and Twitch only”
- **On-glasses overlays**
  - Subtle status indicators in the glasses UI when a voice command is accepted or rejected

---

## Scene presets and layouts

- **Scene presets**
  - Predefined bundles of resolution, bitrate, and destinations (e.g. “IRL low bandwidth”, “Studio high quality”)
- **Fast switching**
  - Switch between presets without stopping the stream where the platform allows it
- **Per-platform overrides**
  - Slightly different titles or descriptions per preset/destination

---

## Auto-clips and highlights

- **Automatic clip markers**
  - Let the user tap a “Highlight” button or send a voice command to mark interesting moments
- **Clip generation hooks**
  - Webhooks or callbacks that third-party tools can use to generate vertical clips for short-form platforms
- **Mentra Cloud integration**
  - Explore tighter integration with any future clip/highlight APIs provided by Mentra Cloud

---

## Analytics and health insights

- **Per-destination health indicators**
  - Packet loss, reconnect attempts, keyframe interval sanity checks (where exposed)
- **Historical sessions**
  - List of recent streams with durations, average bitrate and destinations
- **Export hooks**
  - Simple JSON exports for creators who want to wire this into their own dashboards

---

## Advanced multi-destination behavior

- **Per-destination throttling**
  - Ability to temporarily pause forwarding to a single destination without stopping the main managed stream
- **Failover logic**
  - Automatically mute/disable destinations that repeatedly fail, while keeping others live
- **Template-based RTMP presets**
  - Pre-set templates for common platforms that can be updated centrally

---

## Developer experience

- **Richer test coverage**
  - Unit tests for managed stream orchestration and per-platform configuration
- **Sample integrations**
  - Example configs for common creator workflows (e.g. “YouTube main + Twitch alt”, “Restream relay + custom RTMP backup”)
- **MentraOS examples**
  - Minimal example apps that show how to embed StreamDeck-like behavior into other miniapps

---

## How to influence the roadmap

- Open a **Feature request** issue and:
  - Describe your use case in detail
  - Explain why it matters for MentraOS creators
  - Note any constraints (bandwidth, battery, hardware, etc.)

We’ll prioritize features that:

- Make streaming more reliable from real-world glasses
- Respect MentraOS hardware constraints
- Benefit a broad set of creators, not just niche workflows

