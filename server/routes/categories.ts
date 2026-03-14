import { Router } from 'express';
import Database from 'better-sqlite3';

export function createCategoriesRouter(db: Database.Database): Router {
  const router = Router();

  // GET all categories
  router.get('/', (_req, res) => {
    const categories = db.prepare('SELECT * FROM categories ORDER BY id').all();
    res.json(categories);
  });

  // POST create category
  router.post('/', (req, res) => {
    const { name, color } = req.body;
    if (!name || !color) {
      return res.status(400).json({ error: 'name and color are required' });
    }
    try {
      const result = db
        .prepare('INSERT INTO categories (name, color) VALUES (?, ?)')
        .run(name, color);
      const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastInsertRowid);
      res.status(201).json(category);
    } catch (err: any) {
      if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        return res.status(409).json({ error: 'Category already exists' });
      }
      throw err;
    }
  });

  // PUT update category
  router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { name, color } = req.body;
    db.prepare('UPDATE categories SET name = COALESCE(?, name), color = COALESCE(?, color) WHERE id = ?')
      .run(name, color, id);
    const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
    if (!category) return res.status(404).json({ error: 'Category not found' });
    res.json(category);
  });

  // DELETE category (reassign prompts to Uncategorized)
  router.delete('/:id', (req, res) => {
    const { id } = req.params;
    if (Number(id) === 1) {
      return res.status(400).json({ error: 'Cannot delete Uncategorized category' });
    }
    const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
    if (!category) return res.status(404).json({ error: 'Category not found' });

    const deleteCategory = db.transaction(() => {
      db.prepare('UPDATE prompts SET category_id = 1 WHERE category_id = ?').run(id);
      db.prepare('DELETE FROM categories WHERE id = ?').run(id);
    });
    deleteCategory();
    res.json({ success: true });
  });

  return router;
}
