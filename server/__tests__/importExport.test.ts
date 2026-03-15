import { describe, it, expect, beforeEach } from 'vitest';
import { createDatabase } from '../db';
import Database from 'better-sqlite3';
import { createImportExportRouter } from '../routes/importExport';
import { createPromptsRouter } from '../routes/prompts';
import express from 'express';
import request from 'supertest';

function createApp(db: Database.Database) {
  const app = express();
  app.use(express.json());
  app.use('/api/prompts', createPromptsRouter(db));
  app.use('/api', createImportExportRouter(db));
  return app;
}

describe('Import/Export API', () => {
  let db: Database.Database;
  let app: express.Express;

  beforeEach(() => {
    db = createDatabase(':memory:');
    app = createApp(db);
  });

  it('GET /api/export returns all prompts as JSON', async () => {
    await request(app).post('/api/prompts').send({
      title: 'P1', content: 'C1', category_id: 1, tags: ['test'],
    });
    const res = await request(app).get('/api/export');
    expect(res.status).toBe(200);
    expect(res.body.prompts).toHaveLength(1);
    expect(res.body.prompts[0].title).toBe('P1');
    expect(res.body.prompts[0].tags).toContain('test');
    expect(res.body.prompts[0].category).toBe('Uncategorized');
  });

  it('POST /api/import imports new prompts', async () => {
    const res = await request(app).post('/api/import').send({
      prompts: [{
        title: 'Imported',
        content: 'Content',
        category: 'Coding',
        tags: ['new-tag'],
      }],
    });
    expect(res.status).toBe(200);
    expect(res.body.imported).toBe(1);
    expect(res.body.skipped).toBe(0);

    const list = await request(app).get('/api/prompts');
    expect(list.body.length).toBe(1);
  });

  it('POST /api/import skips duplicates by title', async () => {
    await request(app).post('/api/prompts').send({
      title: 'Existing', content: 'C1', category_id: 1, tags: [],
    });
    const res = await request(app).post('/api/import').send({
      prompts: [{ title: 'Existing', content: 'Different', category: 'Coding', tags: [] }],
    });
    expect(res.body.imported).toBe(0);
    expect(res.body.skipped).toBe(1);
  });
});
