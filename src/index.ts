import {
  AppServer,
  TpaSession,
  RtmpStreamStatus,
  ManagedStreamStatus,
  GlassesToCloudMessageType,
  CloudToAppMessageType,
  AuthenticatedRequest,
} from '@mentra/sdk';
import { setupExpressRoutes } from './webview';
import path from 'path';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const PACKAGE_NAME = process.env.PACKAGE_NAME;
const MENTRAOS_API_KEY = process.env.MENTRAOS_API_KEY;

// Resolution presets — all 16:9 for platform compatibility
const RESOLUTION_PRESETS = {
  '720p': { width: 1280, height: 720, bitrate: 2500000, frameRate: 30 },
  '480p': { width: 854, height: 480, bitrate: 1500000, frameRate: 30 },
  '360p': { width: 640, height: 360, bitrate: 800000, frameRate: 30 },
} as const;

type ResolutionPreset = keyof typeof RESOLUTION_PRESETS;

// Platform definitions with default RTMP URLs
const PLATFORMS: Record<string, { name: string; icon: string; defaultUrl: string }> = {
  x: { name: 'X (Twitter)', icon: '𝕏', defaultUrl: 'rtmp://va.pscp.tv:80/x/' },
  youtube: { name: 'YouTube', icon: '▶', defaultUrl: 'rtmp://a.rtmp.youtube.com/live2/' },
  twitch: { name: 'Twitch', icon: '⬡', defaultUrl: 'rtmp://live.twitch.tv/app/' },
  instagram: { name: 'Instagram', icon: '◎', defaultUrl: 'rtmps://live-upload.instagram.com:443/rtmp/' },
  kick: { name: 'Kick', icon: 'K', defaultUrl: 'rtmps://fa723fc1b171.global-contribute.live-video.net/app/' },
  custom: { name: 'Custom', icon: '+', defaultUrl: '' },
};

interface PlatformConfig {
  platformId: string;
  rtmpUrl: string;
  streamKey: string;
  streamTitle: string;
  enabled: boolean;
}

interface StreamUrls {
  hlsUrl?: string;
  dashUrl?: string;
  webrtcUrl?: string;
  streamId?: string;
  previewUrl?: string;
}

interface UserStreamState {
  resolution: ResolutionPreset;
  platforms: PlatformConfig[];
  streamStatus: string; // 'stopped' | 'initializing' | 'active' | 'error'
  streamUrls: StreamUrls | null;
  managedStreamStatus: ManagedStreamStatus | null;
  session: TpaSession;
  activePlatformIndices: number[]; // which platforms are being streamed to
}

interface UserPersistentSettings {
  resolution: ResolutionPreset;
  platforms: PlatformConfig[];
}

class MentraStreamDeck extends AppServer {
  private activeUserStates: Map<string, UserStreamState> = new Map();
  private persistentUserSettings: Map<string, UserPersistentSettings> = new Map();

  constructor() {
    if (!PACKAGE_NAME || !MENTRAOS_API_KEY) {
      throw new Error('PACKAGE_NAME and MENTRAOS_API_KEY must be set in .env');
    }
    super({
      packageName: PACKAGE_NAME,
      apiKey: MENTRAOS_API_KEY,
      port: PORT,
      publicDir: path.join(__dirname, '../public'),
    });
    setupExpressRoutes(this);
  }

  // --- Public API for webview routes ---

  public getResolutionPresets() {
    return RESOLUTION_PRESETS;
  }

  public getPlatforms() {
    return PLATFORMS;
  }

  public saveSettingsForUser(userId: string, settings: UserPersistentSettings): void {
    this.persistentUserSettings.set(userId, settings);
    const state = this.activeUserStates.get(userId);
    if (state) {
      state.resolution = settings.resolution;
      state.platforms = settings.platforms;
    }
  }

  public getSettingsForUser(userId: string): UserPersistentSettings {
    return this.persistentUserSettings.get(userId) || {
      resolution: '720p',
      platforms: [],
    };
  }

  public getStreamStateForUser(userId: string) {
    const state = this.activeUserStates.get(userId);
    return {
      status: state?.streamStatus || 'stopped',
      urls: state?.streamUrls || null,
      managedStatus: state?.managedStreamStatus || null,
      activePlatformIndices: state?.activePlatformIndices || [],
    };
  }

  // Start preview only (managed stream, no restream destinations)
  public async startPreviewForUser(userId: string): Promise<StreamUrls> {
    const state = this.activeUserStates.get(userId);
    if (!state) throw new Error('No active session');

    state.session.layouts.showTextWall('Starting preview...');
    const urls = await state.session.camera.startManagedStream();
    state.streamUrls = urls;
    state.streamStatus = 'initializing';
    return urls;
  }

  // Go live: managed stream WITH restream destinations (preview + RTMP simultaneously)
  public async goLiveForUser(userId: string, platformIndices: number[]): Promise<StreamUrls> {
    const state = this.activeUserStates.get(userId);
    if (!state) throw new Error('No active session');

    const settings = this.getSettingsForUser(userId);
    const preset = RESOLUTION_PRESETS[settings.resolution];

    // Build restream destinations from selected platforms
    const restreamDestinations = platformIndices.map(i => {
      const p = settings.platforms[i];
      if (!p || !p.rtmpUrl || !p.streamKey) throw new Error(`Platform ${i} not configured`);
      const plat = PLATFORMS[p.platformId] || PLATFORMS.custom;
      const fullUrl = p.rtmpUrl.endsWith('/')
        ? p.rtmpUrl + p.streamKey
        : p.rtmpUrl + '/' + p.streamKey;
      return { url: fullUrl, name: plat.name };
    });

    if (restreamDestinations.length === 0) throw new Error('No destinations selected');

    console.log(`[GoLive] ${restreamDestinations.length} destination(s):`, JSON.stringify(restreamDestinations));
    const names = restreamDestinations.map(d => d.name).join(', ');
    state.session.layouts.showTextWall(`Going live to ${names}...`);
    state.activePlatformIndices = platformIndices;
    state.streamStatus = 'initializing';

    // Stop existing managed stream first if running (preview)
    try { await state.session.camera.stopManagedStream(); } catch (e) { /* ignore */ }

    // Start managed stream with restream destinations
    // This gives us HLS preview URL AND forwards to all RTMP destinations
    const urls = await state.session.camera.startManagedStream({
      restreamDestinations,
      video: {
        width: preset.width,
        height: preset.height,
        bitrate: preset.bitrate,
        frameRate: preset.frameRate,
      },
      audio: {
        bitrate: 128000,
        sampleRate: 44100,
        echoCancellation: true,
        noiseSuppression: true,
      },
    });

    state.streamUrls = urls;
    return urls;
  }

  // Stop everything (preview or live)
  public async stopStreamForUser(userId: string): Promise<void> {
    const state = this.activeUserStates.get(userId);
    if (!state) throw new Error('No active session');

    state.session.layouts.showTextWall('Stopping stream...');
    try { await state.session.camera.stopManagedStream(); } catch (e) { /* ignore */ }
    state.streamStatus = 'stopped';
    state.streamUrls = null;
    state.activePlatformIndices = [];
  }

  // --- Session lifecycle ---

  protected async onSession(session: TpaSession, sessionId: string, userId: string): Promise<void> {
    console.log(`Session started: ${sessionId} for user ${userId}`);

    const settings = this.getSettingsForUser(userId);
    const state: UserStreamState = {
      resolution: settings.resolution,
      platforms: settings.platforms,
      streamStatus: 'stopped',
      streamUrls: null,
      managedStreamStatus: null,
      session,
      activePlatformIndices: [],
    };
    this.activeUserStates.set(userId, state);

    session.layouts.showTextWall('StreamDeck ready.');

    const cleanup = [
      session.camera.onManagedStreamStatus((status: ManagedStreamStatus) => {
        console.log(`Stream status [${userId}]: ${status.status}`, (status as any).outputs ? `| Outputs: ${JSON.stringify((status as any).outputs)}` : '');
        const s = this.activeUserStates.get(userId);
        if (s) {
          s.managedStreamStatus = { ...status, timestamp: new Date() };
          s.streamStatus = status.status;
          if (status.hlsUrl) s.streamUrls = { ...s.streamUrls, hlsUrl: status.hlsUrl };
          if (status.dashUrl) s.streamUrls = { ...s.streamUrls, dashUrl: status.dashUrl };
          if (status.webrtcUrl) s.streamUrls = { ...s.streamUrls, webrtcUrl: status.webrtcUrl };

          switch (status.status) {
            case 'active':
              session.layouts.showTextWall('LIVE');
              break;
            case 'error':
              session.layouts.showTextWall(`Error: ${(status as any).message || 'unknown'}`);
              s.activePlatformIndices = [];
              break;
            case 'stopped':
              session.layouts.showTextWall('Stream stopped');
              s.activePlatformIndices = [];
              s.streamUrls = null;
              break;
          }
        }
      }),

      session.events.onDisconnected(() => {
        console.log(`Session ${sessionId} disconnected for ${userId}`);
        this.activeUserStates.delete(userId);
      }),

      session.events.onError((error) => {
        console.error(`Session error [${userId}]:`, error);
      }),
    ];

    cleanup.forEach((handler) => {
      if (handler && typeof handler === 'function') {
        this.addCleanupHandler(handler);
      }
    });
  }
}

const app = new MentraStreamDeck();
app.start().catch(console.error);

export { MentraStreamDeck };
export type { ResolutionPreset, PlatformConfig, UserPersistentSettings, StreamUrls };
