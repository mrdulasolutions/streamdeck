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
  x: { name: 'X (Twitter)', icon: '𝕏', defaultUrl: 'rtmp://live.x.com/app/' },
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
  enabled: boolean;
}

interface UserStreamState {
  resolution: ResolutionPreset;
  platforms: PlatformConfig[];
  streamStatus: RtmpStreamStatus;
  managedStreamStatus: ManagedStreamStatus | null;
  session: TpaSession;
  activeStreamIndex: number; // which platform is currently streaming (-1 = none)
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

  private stoppedStatus(): RtmpStreamStatus {
    return {
      type: GlassesToCloudMessageType.RTMP_STREAM_STATUS,
      status: 'stopped',
      timestamp: new Date(),
    };
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

  public getStreamStatusForUser(userId: string): RtmpStreamStatus {
    return this.activeUserStates.get(userId)?.streamStatus || this.stoppedStatus();
  }

  public getManagedStreamStatusForUser(userId: string): ManagedStreamStatus | null {
    return this.activeUserStates.get(userId)?.managedStreamStatus || null;
  }

  public getActiveStreamIndexForUser(userId: string): number {
    return this.activeUserStates.get(userId)?.activeStreamIndex ?? -1;
  }

  public async startStreamForUser(userId: string, platformIndex: number): Promise<void> {
    const state = this.activeUserStates.get(userId);
    if (!state) throw new Error('No active session');

    const settings = this.getSettingsForUser(userId);
    const platform = settings.platforms[platformIndex];
    if (!platform) throw new Error('Platform not found');
    if (!platform.rtmpUrl || !platform.streamKey) throw new Error('RTMP URL and stream key required');

    const fullUrl = platform.rtmpUrl.endsWith('/')
      ? platform.rtmpUrl + platform.streamKey
      : platform.rtmpUrl + '/' + platform.streamKey;

    const preset = RESOLUTION_PRESETS[settings.resolution];
    const platformName = PLATFORMS[platform.platformId]?.name || 'Custom';

    state.session.layouts.showTextWall(`Starting ${settings.resolution} stream to ${platformName}...`);
    state.activeStreamIndex = platformIndex;

    await state.session.camera.startStream({
      rtmpUrl: fullUrl,
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
  }

  public async stopStreamForUser(userId: string): Promise<void> {
    const state = this.activeUserStates.get(userId);
    if (!state) throw new Error('No active session');

    state.session.layouts.showTextWall('Stopping stream...');
    state.activeStreamIndex = -1;
    await state.session.camera.stopStream();
  }

  public async startManagedStreamForUser(userId: string): Promise<any> {
    const state = this.activeUserStates.get(userId);
    if (!state) throw new Error('No active session');

    state.session.layouts.showTextWall('Starting managed stream...');
    const urls = await state.session.camera.startManagedStream();
    state.managedStreamStatus = {
      type: CloudToAppMessageType.MANAGED_STREAM_STATUS,
      status: 'initializing',
      hlsUrl: urls.hlsUrl,
      dashUrl: urls.dashUrl,
      webrtcUrl: urls.webrtcUrl,
      streamId: urls.streamId,
      timestamp: new Date(),
    };
    return urls;
  }

  public async stopManagedStreamForUser(userId: string): Promise<void> {
    const state = this.activeUserStates.get(userId);
    if (!state) throw new Error('No active session');

    state.session.layouts.showTextWall('Stopping managed stream...');
    await state.session.camera.stopManagedStream();
  }

  // --- Session lifecycle ---

  protected async onSession(session: TpaSession, sessionId: string, userId: string): Promise<void> {
    console.log(`Session started: ${sessionId} for user ${userId}`);

    const settings = this.getSettingsForUser(userId);
    const state: UserStreamState = {
      resolution: settings.resolution,
      platforms: settings.platforms,
      streamStatus: this.stoppedStatus(),
      managedStreamStatus: null,
      session,
      activeStreamIndex: -1,
    };
    this.activeUserStates.set(userId, state);

    session.layouts.showTextWall('StreamDeck ready. Open the webview to configure.');

    const cleanup = [
      session.camera.onStreamStatus((status: RtmpStreamStatus) => {
        console.log(`Stream status [${userId}]: ${status.status}`);
        const s = this.activeUserStates.get(userId);
        if (s) {
          s.streamStatus = { ...status, timestamp: new Date() };
          switch (status.status) {
            case 'initializing':
              session.layouts.showTextWall('Stream initializing...');
              break;
            case 'active':
              session.layouts.showTextWall('LIVE');
              break;
            case 'error':
              session.layouts.showTextWall(`Stream error: ${status.errorDetails}`);
              s.activeStreamIndex = -1;
              break;
            case 'stopped':
              session.layouts.showTextWall('Stream stopped');
              s.activeStreamIndex = -1;
              break;
          }
        }
      }),

      session.camera.onManagedStreamStatus((status: ManagedStreamStatus) => {
        console.log(`Managed stream status [${userId}]: ${status.status}`);
        const s = this.activeUserStates.get(userId);
        if (s) {
          s.managedStreamStatus = { ...status, timestamp: new Date() };
          if (status.status === 'stopped') s.managedStreamStatus = null;
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
export type { ResolutionPreset, PlatformConfig, UserPersistentSettings };
