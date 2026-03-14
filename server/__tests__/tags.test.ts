import { describe, it, expect, beforeEach } from 'vitest';
import { createDatabase } from '../db';
import Database from 'better-sqlite3';
import { createTagsRouter } from '../routes/tags';
import express from 'express';
import request from 'supertest';

function createApp(db: Database.Database) {
  const app = express();
  app.use(express.json());
  app.use('/api/tags', createTagsRouter(db));
  return app;
}

describe('Tags API', () => {
  let db: Database.Database;
  let app: express.Express;

  beforeEach(() => {
    db = createDatabase(':memory:');
    app = createApp(db);
  });

  it('GET /api/tags returns empty initially', async () => {
    const res = await request(app).get('/api/tags');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('POST /api/tags creates a tag', async () => {
    const res = await request(app).post('/api/tags').send({ name: 'python' });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('python');
  });

  it('POST /api/tags normalizes to lowercase', async () => {
    const res = await request(app).post('/api/tags').send({ name: 'Python' });
    expect(res.body.name).toBe('python');
  });

  it('DELETE /api/tags/:id removes a tag', async () => {
    const created = await request(app).post('/api/tags').send({ name: 'test' });
    const res = await request(app).delete(`/api/tags/${created.body.id}`);
    expect(res.status).toBe(200);
    const list = await request(app).get('/api/tags');
    expect(list.body.length).toBe(0);
  });
});
