# Troubleshooting

Common issues and how to debug them when using StreamDeck with Mentra Live glasses.

---

## Black screen on the destination platform

**Symptoms**

- You see “Live” on YouTube/Twitch/etc., but the video is black or stuck on the loading spinner.

**Likely causes**

- The ingest platform is receiving a non-16:9 resolution it doesn’t like
- Bitrate or codec parameters are outside the platform’s supported ranges
- The stream key is invalid or expired

**What to try**

1. **Confirm the resolution preset**
   - In the StreamDeck Settings tab, make sure you are using one of:
     - `720p` — 1280x720 @ 30fps
     - `480p` — 854x480 @ 30fps
     - `360p` — 640x360 @ 30fps
   - Avoid any custom resolution routes; StreamDeck is designed to keep everything strictly 16:9.

2. **Check the destination preview**
   - For YouTube and Twitch, open the studio/creator preview page
   - Confirm the incoming resolution matches your preset

3. **Rotate destinations**
   - Try disabling all destinations except one (e.g. YouTube)
   - If a single platform works but multi-destination doesn’t, check whether an endpoint is misconfigured or failing hard

4. **Verify stream keys**
   - Regenerate the stream key on the platform
   - Paste it into the relevant destination card again and save

---

## Preview issues in the mobile UI

### Preview never starts (stuck on “Waiting for stream...”)

**Possible causes**

- Managed stream couldn’t start due to SDK or network issues
- HLS URL was never returned from Mentra Cloud

**What to try**

1. Tap the preview to stop it, then start again
2. Check your backend logs on Railway/Fly.io for errors around `startManagedStream`
3. Confirm `PACKAGE_NAME` and `MENTRAOS_API_KEY` are correct and match the miniapp you’re launching

### Preview works, but lags far behind the live feed

HLS preview will always have a few seconds of delay compared to the actual RTMP stream.

- This is expected; HLS uses segment buffering
- Check the actual destination platform’s preview if you need a closer-to-live view

---

## Lockscreen / phone going to sleep mid-stream

StreamDeck attempts to keep the phone awake while previewing or streaming using the [Screen Wake Lock API](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API).

If your phone still sleeps:

- Ensure the companion app has the necessary permissions to prevent sleep
- Try keeping the app in the foreground and avoid switching away for long periods
- Some Android OEMs may aggressively kill backgrounded webviews; behavior can vary by device

---

## X (Twitter) and Instagram limitations

### X (Twitter)

- X does **not** provide a simple, public RTMP API for creating new broadcasts
- In many cases you must:
  - Create a broadcast first in **Media Studio**, then plug the stream key into StreamDeck  
  - Or route through **Restream**, which handles the X integration for you

If you push directly to X and see nothing:

- Double-check that a broadcast is active and associated with your stream key
- Consider using Restream as the destination instead, then let Restream handle X

### Instagram

- Instagram’s official apps do not expose a stable, documented RTMP API
- Typical patterns involve:
  - Starting a Live in the Instagram app to obtain a one-time stream key
  - Or using Restream or other third-party tools that bridge to Instagram

If your Instagram destination never shows a feed:

- Verify that the stream key has not expired
- Consider using Restream as the fan-out service and managing Instagram from there

---

## Direct push vs relay (Restream)

If you want X/Instagram in your mix:

- The most reliable setup is:
  - StreamDeck → Restream (single RTMP destination)
  - Restream → YouTube / Twitch / X / Instagram / etc.

This:

- Lets Restream handle platform-specific quirks
- Keeps StreamDeck focused on delivering a clean, 16:9 feed to a single, well-behaved endpoint

---

## Debugging from logs

If something still isn’t working:

1. Tail your server logs (Railway/Fly.io log dashboard)
2. Look for:
   - Errors from `startManagedStream` or `stopManagedStream`
   - Exceptions thrown in `goLiveForUser` due to missing RTMP URLs or stream keys
3. Add targeted logging around any new code you introduce, especially:
   - Destination URL construction
   - Platform-specific branches

If you suspect a bug in StreamDeck itself, file an issue using the **Bug report** template and attach anonymized logs (with stream keys and API keys removed).

