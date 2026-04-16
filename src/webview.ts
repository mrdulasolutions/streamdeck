import { AppServer, AuthenticatedRequest } from '@mentra/sdk';
import express from 'express';
import path from 'path';
import { MentraStreamDeck, ResolutionPreset, PlatformConfig, UserPersistentSettings } from './index';

export function setupExpressRoutes(serverInstance: AppServer): void {
  const app = serverInstance.getExpressApp();
  const streamApp = serverInstance as MentraStreamDeck;

  app.set('view engine', 'ejs');
  app.engine('ejs', require('ejs').__express);
  app.set('views', path.join(__dirname, 'views'));
  app.use(express.json() as any);

  // Main webview page
  app.get('/webview', (req: AuthenticatedRequest, res: any) => {
    const userId = req.authUserId;
    const settings = userId ? streamApp.getSettingsForUser(userId) : { resolution: '720p' as ResolutionPreset, platforms: [] };
    const streamState = userId ? streamApp.getStreamStateForUser(userId) : null;
    const platforms = streamApp.getPlatforms();
    const presets = streamApp.getResolutionPresets();
    res.render('webview', { userId, settings, streamState, platforms, presets });
  });

  // Poll status
  app.get('/api/status', (req: AuthenticatedRequest, res: any) => {
    const userId = req.authUserId;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });
    res.json(streamApp.getStreamStateForUser(userId));
  });

  // Save settings
  app.post('/api/settings', (req: AuthenticatedRequest, res: any) => {
    const userId = req.authUserId;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });
    const { resolution, platforms } = req.body as { resolution: ResolutionPreset; platforms: PlatformConfig[] };
    const validResolutions: ResolutionPreset[] = ['720p', '480p', '360p'];
    const res_key = validResolutions.includes(resolution) ? resolution : '720p';
    streamApp.saveSettingsForUser(userId, { resolution: res_key, platforms: platforms || [] });
    res.json({ success: true });
  });

  // Start preview only
  app.post('/api/preview', async (req: AuthenticatedRequest, res: any) => {
    const userId = req.authUserId;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });
    try {
      const urls = await streamApp.startPreviewForUser(userId);
      res.json({ success: true, urls });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Go live (managed + restream destinations)
  app.post('/api/go-live', async (req: AuthenticatedRequest, res: any) => {
    const userId = req.authUserId;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });
    const { platformIndices } = req.body;
    if (!platformIndices || !Array.isArray(platformIndices) || platformIndices.length === 0) {
      return res.status(400).json({ error: 'Select at least one destination' });
    }
    try {
      const urls = await streamApp.goLiveForUser(userId, platformIndices);
      res.json({ success: true, urls });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Stop everything
  app.post('/api/stop', async (req: AuthenticatedRequest, res: any) => {
    const userId = req.authUserId;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });
    try {
      await streamApp.stopStreamForUser(userId);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });
}
