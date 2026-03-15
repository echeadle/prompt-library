import { Router } from 'express';
import Database from 'better-sqlite3';
import { createProvider } from '../ai/index.js';
import { buildSystemPrompt } from '../ai/systemPrompts.js';

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

  // POST /api/ai/chat — SSE streaming
  router.post('/chat', async (req, res) => {
    const { messages, mode, context } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages array is required' });
    }
    if (!mode || !['generate', 'review'].includes(mode)) {
      return res.status(400).json({ error: 'mode must be "generate" or "review"' });
    }

    const provider = getSetting(db, 'ai_provider');
    const apiKey = getSetting(db, 'ai_api_key');
    const model = getSetting(db, 'ai_model');

    if (!apiKey) {
      return res.status(400).json({ error: 'No API key configured. Please set one in Settings.' });
    }

    const systemPrompt = buildSystemPrompt(mode, context);

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    try {
      const ai = createProvider(provider, apiKey, model);
      await ai.chat({
        messages,
        systemPrompt,
        onToken: (token) => {
          res.write(`data: ${JSON.stringify({ type: 'token', content: token })}\n\n`);
        },
        onDone: () => {
          res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
          res.end();
        },
        onError: (error) => {
          res.write(`data: ${JSON.stringify({ type: 'error', content: error })}\n\n`);
          res.end();
        },
      });
    } catch (err) {
      res.write(`data: ${JSON.stringify({ type: 'error', content: err instanceof Error ? err.message : 'Unknown error' })}\n\n`);
      res.end();
    }
  });

  return router;
}

export { getSetting };
