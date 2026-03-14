import { Router } from 'express';
import Database from 'better-sqlite3';

export function createPromptsRouter(db: Database.Database): Router {
  const router = Router();

  // Helper: get or create tags, return tag ids
  function getOrCreateTags(tagNames: string[]): number[] {
    const ids: number[] = [];
    for (const name of tagNames) {
      const normalized = name.toLowerCase().trim();
      if (!normalized) continue;
      let tag = db.prepare('SELECT id FROM tags WHERE name = ?').get(normalized) as { id: number } | undefined;
      if (!tag) {
        const result = db.prepare('INSERT INTO tags (name) VALUES (?)').run(normalized);
        ids.push(result.lastInsertRowid as number);
      } else {
        ids.push(tag.id);
      }
    }
    return ids;
  }

  // Helper: set tags for a prompt (replace all)
  function setPromptTags(promptId: number, tagNames: string[]) {
    db.prepare('DELETE FROM prompt_tags WHERE prompt_id = ?').run(promptId);
    const tagIds = getOrCreateTags(tagNames);
    const insert = db.prepare('INSERT INTO prompt_tags (prompt_id, tag_id) VALUES (?, ?)');
    for (const tagId of tagIds) {
      insert.run(promptId, tagId);
    }
    // Update FTS tags column
    const tagText = tagNames.map(t => t.toLowerCase().trim()).join(' ');
    const prompt = db.prepare('SELECT title, content, description FROM prompts WHERE id = ?').get(promptId) as any;
    if (prompt) {
      db.prepare('DELETE FROM prompts_fts WHERE rowid = ?').run(promptId);
      db.prepare('INSERT INTO prompts_fts (rowid, title, content, description, tags) VALUES (?, ?, ?, ?, ?)')
        .run(promptId, prompt.title, prompt.content, prompt.description ?? '', tagText);
    }
  }

  // Helper: get prompt with category and tags
  function getPromptById(id: number) {
    const prompt = db.prepare(`
      SELECT p.*, c.name as category_name, c.color as category_color
      FROM prompts p
      JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `).get(id) as any;
    if (!prompt) return null;

    const tags = db.prepare(`
      SELECT t.* FROM tags t
      JOIN prompt_tags pt ON t.id = pt.tag_id
      WHERE pt.prompt_id = ?
      ORDER BY t.name
    `).all(prompt.id);

    return {
      ...prompt,
      category: { id: prompt.category_id, name: prompt.category_name, color: prompt.category_color },
      tags,
      category_name: undefined,
      category_color: undefined,
    };
  }

  // GET all prompts with filters
  router.get('/', (req, res) => {
    const { q, category, tag, favorite, sort = 'created_at', order = 'desc' } = req.query;

    let query: string;
    const params: any[] = [];

    if (q) {
      query = `
        SELECT p.*, c.name as category_name, c.color as category_color
        FROM prompts p
        JOIN categories c ON p.category_id = c.id
        JOIN prompts_fts fts ON fts.rowid = p.id
        WHERE prompts_fts MATCH ?
      `;
      params.push(String(q));
    } else {
      query = `
        SELECT p.*, c.name as category_name, c.color as category_color
        FROM prompts p
        JOIN categories c ON p.category_id = c.id
        WHERE 1=1
      `;
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

    const allowedSorts = ['created_at', 'updated_at', 'title', 'is_favorite'];
    const sortCol = allowedSorts.includes(String(sort)) ? String(sort) : 'created_at';
    const sortOrder = order === 'asc' ? 'ASC' : 'DESC';
    query += ` ORDER BY p.${sortCol} ${sortOrder}`;

    const prompts = db.prepare(query).all(...params) as any[];

    // Attach tags to each prompt
    const result = prompts.map((p) => {
      const tags = db.prepare(`
        SELECT t.* FROM tags t
        JOIN prompt_tags pt ON t.id = pt.tag_id
        WHERE pt.prompt_id = ?
      `).all(p.id);
      return {
        ...p,
        category: { id: p.category_id, name: p.category_name, color: p.category_color },
        tags,
        category_name: undefined,
        category_color: undefined,
      };
    });

    res.json(result);
  });

  // GET single prompt
  router.get('/:id', (req, res) => {
    const prompt = getPromptById(Number(req.params.id));
    if (!prompt) return res.status(404).json({ error: 'Prompt not found' });
    res.json(prompt);
  });

  // POST create prompt
  router.post('/', (req, res) => {
    const { title, content, description, category_id, tags = [] } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: 'title and content are required' });
    }

    const createPrompt = db.transaction(() => {
      const result = db.prepare(
        'INSERT INTO prompts (title, content, description, category_id) VALUES (?, ?, ?, ?)'
      ).run(title, content, description ?? null, category_id ?? 1);

      const promptId = result.lastInsertRowid as number;
      setPromptTags(promptId, tags);
      return getPromptById(promptId);
    });

    const prompt = createPrompt();
    res.status(201).json(prompt);
  });

  // PUT update prompt
  router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { title, content, description, category_id, tags, is_favorite } = req.body;

    const existing = db.prepare('SELECT * FROM prompts WHERE id = ?').get(Number(id));
    if (!existing) return res.status(404).json({ error: 'Prompt not found' });

    const updatePrompt = db.transaction(() => {
      db.prepare(`
        UPDATE prompts SET
          title = COALESCE(?, title),
          content = COALESCE(?, content),
          description = COALESCE(?, description),
          category_id = COALESCE(?, category_id),
          is_favorite = COALESCE(?, is_favorite),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(title, content, description, category_id, is_favorite, id);

      if (tags !== undefined) {
        setPromptTags(Number(id), tags);
      }
      return getPromptById(Number(id));
    });

    const prompt = updatePrompt();
    res.json(prompt);
  });

  // DELETE prompt
  router.delete('/:id', (req, res) => {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM prompts WHERE id = ?').get(Number(id));
    if (!existing) return res.status(404).json({ error: 'Prompt not found' });

    db.prepare('DELETE FROM prompts_fts WHERE rowid = ?').run(Number(id));
    db.prepare('DELETE FROM prompts WHERE id = ?').run(Number(id));
    res.json({ success: true });
  });

  return router;
}
