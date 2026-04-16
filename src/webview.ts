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
    const streamStatus = userId ? streamApp.getStreamStatusForUser(userId) : null;
    const platforms = streamApp.getPlatforms();
    const presets = streamApp.getResolutionPresets();
    const activeIndex = userId ? streamApp.getActiveStreamIndexForUser(userId) : -1;
    const managedStatus = userId ? streamApp.getManagedStreamStatusForUser(userId) : null;
    res.render('webview', { userId, settings, streamStatus, platforms, presets, activeIndex, managedStatus });
  });

  // Poll stream status
  app.get('/api/status', (req: AuthenticatedRequest, res: any) => {
    const userId = req.authUserId;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });
    res.json({
      streamStatus: streamApp.getStreamStatusForUser(userId),
      managedStreamStatus: streamApp.getManagedStreamStatusForUser(userId),
      settings: streamApp.getSettingsForUser(userId),
      activeIndex: streamApp.getActiveStreamIndexForUser(userId),
    });
  });

  // Save all settings (platforms + resolution)
  app.post('/api/settings', (req: AuthenticatedRequest, res: any) => {
    const userId = req.authUserId;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });
    const { resolution, platforms } = req.body as { resolution: ResolutionPreset; platforms: PlatformConfig[] };
    const validResolutions: ResolutionPreset[] = ['720p', '480p', '360p'];
    const res_key = validResolutions.includes(resolution) ? resolution : '720p';
    streamApp.saveSettingsForUser(userId, { resolution: res_key, platforms: platforms || [] });
    res.json({ success: true });
  });

  // Start stream to a specific platform by index
  app.post('/api/start', async (req: AuthenticatedRequest, res: any) => {
    const userId = req.authUserId;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });
    const { platformIndex } = req.body;
    if (platformIndex === undefined || platformIndex < 0) return res.status(400).json({ error: 'platformIndex required' });
    try {
      await streamApp.startStreamForUser(userId, platformIndex);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Stop stream
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

  // Start managed stream (preview)
  app.post('/api/start-managed', async (req: AuthenticatedRequest, res: any) => {
    const userId = req.authUserId;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });
    try {
      const urls = await streamApp.startManagedStreamForUser(userId);
      res.json({ success: true, urls });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Stop managed stream
  app.post('/api/stop-managed', async (req: AuthenticatedRequest, res: any) => {
    const userId = req.authUserId;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });
    try {
      await streamApp.stopManagedStreamForUser(userId);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });
}
