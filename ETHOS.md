# Ethos

## Why This Exists

StreamDeck was born out of frustration — and then out of determination.

We bought Mentra Live glasses for one reason: livestreaming. Day one, the built-in streaming app didn't work. Black screen on every platform. $300 hardware, and the flagship feature was broken.

Instead of waiting for a fix or returning the glasses, we built our own.

## What We Believe

**Hardware should work on day one.** When someone pays for a product, the core advertised feature should function. When it doesn't, the community should be empowered to fix it themselves.

**Open source is the answer.** MentraOS is open source, and that's exactly what made this possible. We used their SDK, their docs, their example repos — and built something that works. This is the promise of open-source hardware platforms: when the official app falls short, anyone can build a better one.

**Fix it, then share it.** We didn't just fix our own problem. We open-sourced the solution so every Mentra Live owner hitting the same black screen can stream on day one too.

**Keep it simple.** This app does one thing: stream from your Mentra glasses to wherever you want, in the right format, reliably. No bloat. No accounts. No subscriptions.

## The Technical Story

The built-in Mentra Streaming app sends video in non-standard resolutions (720x480, 960x540 — 3:2 aspect ratio) that platforms like X, YouTube, and Twitch reject or can't render. The RTMP transport layer shows "excellent" health, but the video never appears.

StreamDeck forces proper 1280x720 16:9 output at 30fps with correct encoding parameters. That's it. That's the fix.

## Our Commitment

- This project will always be free and open source
- We will always credit MentraOS and the Mentra team for building the platform that makes this possible
- We will contribute bug reports and findings back to the MentraOS community
- We welcome all contributors

---

*Built with Mentra Live glasses, MentraOS, and Claude Code.*
