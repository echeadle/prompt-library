import { describe, it, expect, beforeEach } from 'vitest';
import { createDatabase } from '../db';
import Database from 'better-sqlite3';
import { createCategoriesRouter } from '../routes/categories';
import express from 'express';
import request from 'supertest';

function createApp(db: Database.Database) {
  const app = express();
  app.use(express.json());
  app.use('/api/categories', createCategoriesRouter(db));
  return app;
}

describe('Categories API', () => {
  let db: Database.Database;
  let app: express.Express;

  beforeEach(() => {
    db = createDatabase(':memory:', { seed: false });
    app = createApp(db);
  });

  it('GET /api/categories returns seeded categories', async () => {
    const res = await request(app).get('/api/categories');
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(8);
    expect(res.body[0].name).toBe('Uncategorized');
  });

  it('POST /api/categories creates a new category', async () => {
    const res = await request(app)
      .post('/api/categories')
      .send({ name: 'Testing', color: '#ff0000' });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Testing');
  });

  it('PUT /api/categories/:id updates a category', async () => {
    const res = await request(app)
      .put('/api/categories/2')
      .send({ name: 'Coding Updated', color: '#0000ff' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Coding Updated');
  });

  it('DELETE /api/categories/:id deletes and reassigns prompts', async () => {
    // Insert a prompt in category 2
    db.prepare(
      'INSERT INTO prompts (title, content, category_id) VALUES (?, ?, ?)'
    ).run('Test', 'Content', 2);

    const res = await request(app).delete('/api/categories/2');
    expect(res.status).toBe(200);

    // Prompt should now be in category 1 (Uncategorized)
    const prompt = db.prepare('SELECT category_id FROM prompts WHERE title = ?').get('Test') as { category_id: number };
    expect(prompt.category_id).toBe(1);
  });

  it('DELETE /api/categories/1 is rejected (protected)', async () => {
    const res = await request(app).delete('/api/categories/1');
    expect(res.status).toBe(400);
  });
});
