import { Router } from 'express';
import Database from 'better-sqlite3';

export function createImportExportRouter(db: Database.Database): Router {
  const router = Router();

  // GET /api/export
  router.get('/export', (req, res) => {
    const { q, category, tag, favorite } = req.query;

    let query = `
      SELECT p.*, c.name as category_name
      FROM prompts p
      JOIN categories c ON p.category_id = c.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (q) {
      query = `
        SELECT p.*, c.name as category_name
        FROM prompts p
        JOIN categories c ON p.category_id = c.id
        JOIN prompts_fts fts ON fts.rowid = p.id
        WHERE prompts_fts MATCH ?
      `;
      params.push(String(q));
    }
    if (category) {
      query += ' AND p.category_id = ?';
      params.push(Number(category));
    }
    if (tag) {
      query += ' AND p.id IN (SELECT prompt_id FROM prompt_tags WHERE tag_id = ?)';
      params.push(Number(tag));
    }
    if (favorite === 'true') {
      query += ' AND p.is_favorite = 1';
    }

    const prompts = db.prepare(query).all(...params) as any[];

    const exported = prompts.map((p) => {
      const tags = db.prepare(`
        SELECT t.name FROM tags t
        JOIN prompt_tags pt ON t.id = pt.tag_id
        WHERE pt.prompt_id = ?
      `).all(p.id) as { name: string }[];

      return {
        title: p.title,
        content: p.content,
        description: p.description,
        category: p.category_name,
        is_favorite: p.is_favorite === 1,
        tags: tags.map((t) => t.name),
        created_at: p.created_at,
        updated_at: p.updated_at,
      };
    });

    res.json({ prompts: exported });
  });

  // POST /api/import
  router.post('/import', (req, res) => {
    const { prompts } = req.body;
    if (!Array.isArray(prompts)) {
      return res.status(400).json({ error: 'prompts array is required' });
    }

    let imported = 0;
    let skipped = 0;

    const importAll = db.transaction(() => {
      for (const p of prompts) {
        // Check duplicate by title
        const existing = db.prepare('SELECT id FROM prompts WHERE title = ?').get(p.title);
        if (existing) {
          skipped++;
          continue;
        }

        // Get or create category
        let categoryId = 1;
        if (p.category) {
          let cat = db.prepare('SELECT id FROM categories WHERE name = ?').get(p.category) as { id: number } | undefined;
          if (!cat) {
            const result = db.prepare('INSERT INTO categories (name, color) VALUES (?, ?)').run(p.category, '#94a3b8');
            categoryId = result.lastInsertRowid as number;
          } else {
            categoryId = cat.id;
          }
        }

        // Insert prompt
        const result = db.prepare(
          'INSERT INTO prompts (title, content, description, category_id, is_favorite) VALUES (?, ?, ?, ?, ?)'
        ).run(p.title, p.content, p.description ?? null, categoryId, p.is_favorite ? 1 : 0);

        const promptId = result.lastInsertRowid as number;

        // Handle tags
        const tagNames: string[] = p.tags ?? [];
        for (const tagName of tagNames) {
          const normalized = tagName.toLowerCase().trim();
          if (!normalized) continue;
          let tag = db.prepare('SELECT id FROM tags WHERE name = ?').get(normalized) as { id: number } | undefined;
          if (!tag) {
            const tagResult = db.prepare('INSERT INTO tags (name) VALUES (?)').run(normalized);
            tag = { id: tagResult.lastInsertRowid as number };
          }
          db.prepare('INSERT OR IGNORE INTO prompt_tags (prompt_id, tag_id) VALUES (?, ?)').run(promptId, tag.id);
        }

        // Insert into FTS
        const tagText = tagNames.map(t => t.toLowerCase().trim()).join(' ');
        db.prepare('INSERT INTO prompts_fts (rowid, title, content, description, tags) VALUES (?, ?, ?, ?, ?)')
          .run(promptId, p.title, p.content, p.description ?? '', tagText);

        imported++;
      }
    });

    importAll();
    res.json({ imported, skipped });
  });

  return router;
}
