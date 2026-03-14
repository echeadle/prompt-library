import { describe, it, expect, beforeEach } from 'vitest';
import { createDatabase } from '../db';
import Database from 'better-sqlite3';
import { createPromptsRouter } from '../routes/prompts';
import express from 'express';
import request from 'supertest';

function createApp(db: Database.Database) {
  const app = express();
  app.use(express.json());
  app.use('/api/prompts', createPromptsRouter(db));
  return app;
}

describe('Prompts API', () => {
  let db: Database.Database;
  let app: express.Express;

  beforeEach(() => {
    db = createDatabase(':memory:');
    app = createApp(db);
  });

  it('POST /api/prompts creates a prompt with tags', async () => {
    const res = await request(app).post('/api/prompts').send({
      title: 'Test Prompt',
      content: 'Do the thing',
      description: 'A test',
      category_id: 2,
      tags: ['python', 'debug'],
    });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Test Prompt');
    expect(res.body.tags).toHaveLength(2);
    expect(res.body.tags.map((t: any) => t.name)).toContain('python');
  });

  it('GET /api/prompts returns all prompts', async () => {
    await request(app).post('/api/prompts').send({
      title: 'P1', content: 'C1', category_id: 1, tags: [],
    });
    const res = await request(app).get('/api/prompts');
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
  });

  it('GET /api/prompts/:id returns prompt with tags', async () => {
    const created = await request(app).post('/api/prompts').send({
      title: 'P1', content: 'C1', category_id: 2, tags: ['test'],
    });
    const res = await request(app).get(`/api/prompts/${created.body.id}`);
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('P1');
    expect(res.body.tags).toHaveLength(1);
    expect(res.body.category.name).toBe('Coding');
  });

  it('PUT /api/prompts/:id updates prompt and tags', async () => {
    const created = await request(app).post('/api/prompts').send({
      title: 'P1', content: 'C1', category_id: 1, tags: ['old'],
    });
    const res = await request(app).put(`/api/prompts/${created.body.id}`).send({
      title: 'Updated', content: 'New content', category_id: 2, tags: ['new'],
    });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Updated');
    expect(res.body.tags.map((t: any) => t.name)).toEqual(['new']);
  });

  it('DELETE /api/prompts/:id removes prompt', async () => {
    const created = await request(app).post('/api/prompts').send({
      title: 'P1', content: 'C1', category_id: 1, tags: [],
    });
    const res = await request(app).delete(`/api/prompts/${created.body.id}`);
    expect(res.status).toBe(200);
    const list = await request(app).get('/api/prompts');
    expect(list.body.length).toBe(0);
  });

  it('GET /api/prompts?category=2 filters by category', async () => {
    await request(app).post('/api/prompts').send({ title: 'A', content: 'C', category_id: 1, tags: [] });
    await request(app).post('/api/prompts').send({ title: 'B', content: 'C', category_id: 2, tags: [] });
    const res = await request(app).get('/api/prompts?category=2');
    expect(res.body.length).toBe(1);
    expect(res.body[0].title).toBe('B');
  });

  it('GET /api/prompts?favorite=true filters favorites', async () => {
    const created = await request(app).post('/api/prompts').send({ title: 'A', content: 'C', category_id: 1, tags: [] });
    db.prepare('UPDATE prompts SET is_favorite = 1 WHERE id = ?').run(created.body.id);
    await request(app).post('/api/prompts').send({ title: 'B', content: 'C', category_id: 1, tags: [] });
    const res = await request(app).get('/api/prompts?favorite=true');
    expect(res.body.length).toBe(1);
    expect(res.body[0].title).toBe('A');
  });

  it('GET /api/prompts?q=search uses FTS', async () => {
    await request(app).post('/api/prompts').send({ title: 'Python helper', content: 'Helps with python', category_id: 1, tags: [] });
    await request(app).post('/api/prompts').send({ title: 'Writing tips', content: 'Blog writing', category_id: 1, tags: [] });
    const res = await request(app).get('/api/prompts?q=python');
    expect(res.body.length).toBe(1);
    expect(res.body[0].title).toBe('Python helper');
  });
});
