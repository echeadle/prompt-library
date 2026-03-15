import { Router } from 'express';
import Database from 'better-sqlite3';

const DEFAULTS: Record<string, string> = {
  ai_provider: 'anthropic',
  ai_model: 'claude-sonnet-4-20250514',
};

function getSetting(db: Database.Database, key: string): string {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined;
  return row?.value ?? DEFAULTS[key] ?? '';
}

function setSetting(db: Database.Database, key: string, value: string): void {
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value);
}

export function createAIRouter(db: Database.Database): Router {
  const router = Router();

  // GET /api/ai/settings
  router.get('/settings', (_req, res) => {
    const provider = getSetting(db, 'ai_provider');
    const model = getSetting(db, 'ai_model');
    const apiKey = getSetting(db, 'ai_api_key');

    res.json({
      provider,
      model,
      hasApiKey: apiKey.length > 0,
    });
  });

  // PUT /api/ai/settings
  router.put('/settings', (req, res) => {
    const { provider, apiKey, model } = req.body;

    if (provider) setSetting(db, 'ai_provider', provider);
    if (apiKey) setSetting(db, 'ai_api_key', apiKey);
    if (model) setSetting(db, 'ai_model', model);

    res.json({ success: true });
  });

  return router;
}

export { getSetting };
