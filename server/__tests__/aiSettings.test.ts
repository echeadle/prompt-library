import { describe, it, expect, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { createDatabase } from '../db.js';
import { createAIRouter } from '../routes/ai.js';
import Database from 'better-sqlite3';

describe('AI settings routes', () => {
  let app: express.Express;
  let db: Database.Database;

  beforeEach(() => {
    db = createDatabase(':memory:', { seed: false });
    app = express();
    app.use(express.json());
    app.use('/api/ai', createAIRouter(db));
  });

  describe('GET /api/ai/settings', () => {
    it('returns defaults when no settings exist', async () => {
      const res = await request(app).get('/api/ai/settings');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        provider: 'anthropic',
        model: 'claude-sonnet-4-20250514',
        hasApiKey: false,
      });
    });

    it('never returns the actual API key', async () => {
      db.prepare("INSERT INTO settings (key, value) VALUES ('ai_api_key', 'sk-secret-123')").run();
      const res = await request(app).get('/api/ai/settings');
      expect(res.body.hasApiKey).toBe(true);
      expect(res.body).not.toHaveProperty('apiKey');
      expect(JSON.stringify(res.body)).not.toContain('sk-secret-123');
    });
  });

  describe('PUT /api/ai/settings', () => {
    it('saves provider and model', async () => {
      const res = await request(app)
        .put('/api/ai/settings')
        .send({ provider: 'openai', model: 'gpt-4o' });
      expect(res.status).toBe(200);

      const get = await request(app).get('/api/ai/settings');
      expect(get.body.provider).toBe('openai');
      expect(get.body.model).toBe('gpt-4o');
    });

    it('saves API key', async () => {
      await request(app)
        .put('/api/ai/settings')
        .send({ apiKey: 'sk-test-key' });

      const get = await request(app).get('/api/ai/settings');
      expect(get.body.hasApiKey).toBe(true);
    });

    it('allows partial updates', async () => {
      await request(app).put('/api/ai/settings').send({ provider: 'openai' });
      await request(app).put('/api/ai/settings').send({ model: 'gpt-4o-mini' });

      const get = await request(app).get('/api/ai/settings');
      expect(get.body.provider).toBe('openai');
      expect(get.body.model).toBe('gpt-4o-mini');
    });
  });
});
