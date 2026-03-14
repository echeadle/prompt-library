import { Router } from 'express';
import Database from 'better-sqlite3';

export function createTagsRouter(db: Database.Database): Router {
  const router = Router();

  router.get('/', (_req, res) => {
    const tags = db.prepare('SELECT * FROM tags ORDER BY name').all();
    res.json(tags);
  });

  router.post('/', (req, res) => {
    const name = req.body.name?.toLowerCase().trim();
    if (!name) return res.status(400).json({ error: 'name is required' });
    try {
      const result = db.prepare('INSERT INTO tags (name) VALUES (?)').run(name);
      const tag = db.prepare('SELECT * FROM tags WHERE id = ?').get(result.lastInsertRowid);
      res.status(201).json(tag);
    } catch (err: any) {
      if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        const existing = db.prepare('SELECT * FROM tags WHERE name = ?').get(name);
        return res.status(200).json(existing);
      }
      throw err;
    }
  });

  router.delete('/:id', (req, res) => {
    const { id } = req.params;
    const tag = db.prepare('SELECT * FROM tags WHERE id = ?').get(id);
    if (!tag) return res.status(404).json({ error: 'Tag not found' });
    db.prepare('DELETE FROM tags WHERE id = ?').run(id);
    res.json({ success: true });
  });

  return router;
}
