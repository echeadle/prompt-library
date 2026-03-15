import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createDatabase(dbPath?: string, { seed = true }: { seed?: boolean } = {}): Database.Database {
  const resolvedPath = dbPath ?? path.join(__dirname, '..', 'data', 'prompts.db');
  const db = new Database(resolvedPath);

  // WAL mode = better concurrent read performance
  // foreign_keys = enforce referential integrity
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      color TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS prompts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      description TEXT,
      category_id INTEGER NOT NULL DEFAULT 1,
      is_favorite INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS prompt_tags (
      prompt_id INTEGER NOT NULL,
      tag_id INTEGER NOT NULL,
      PRIMARY KEY (prompt_id, tag_id),
      FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
    );

    CREATE VIRTUAL TABLE IF NOT EXISTS prompts_fts USING fts5(
      title, content, description, tags
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // Seed categories if empty
  const count = db.prepare('SELECT COUNT(*) as count FROM categories').get() as { count: number };
  if (count.count === 0) {
    const insert = db.prepare('INSERT INTO categories (name, color) VALUES (?, ?)');
    const seeds = [
      ['Uncategorized', '#94a3b8'],
      ['Coding', '#3b82f6'],
      ['Writing', '#22c55e'],
      ['Analysis', '#f59e0b'],
      ['Image Gen', '#a855f7'],
      ['Brainstorming', '#ec4899'],
      ['Research', '#14b8a6'],
      ['Summarization', '#f97316'],
    ];
    const seedMany = db.transaction(() => {
      for (const [name, color] of seeds) {
        insert.run(name, color);
      }
    });
    seedMany();
  }

  // Seed example prompts if empty (skipped in tests)
  const promptCount = db.prepare('SELECT COUNT(*) as count FROM prompts').get() as { count: number };
  if (seed && promptCount.count === 0) {
    const seedPrompts = [
      {
        title: 'Python Code Reviewer',
        content: 'Review the following Python code for bugs, performance issues, and style.\n\nFocus on:\n- Logic errors and edge cases\n- Performance bottlenecks\n- PEP 8 compliance\n- Type hints where helpful\n\nCode:\n[paste code here]',
        description: 'Reviews Python code for bugs, performance, and style',
        category_id: 2, // Coding
        tags: ['python', 'debug', 'code-review'],
      },
      {
        title: 'Blog Post Outline',
        content: 'Generate a detailed blog post outline on the topic of [TOPIC].\n\nInclude:\n- An engaging hook/introduction\n- 5-7 main sections with subpoints\n- Key takeaways\n- A compelling conclusion with CTA',
        description: 'Creates structured blog post outlines',
        category_id: 3, // Writing
        tags: ['blog', 'creative', 'outline'],
      },
      {
        title: 'Data Analysis Helper',
        content: 'Analyze the following dataset and provide insights.\n\nFocus on:\n- Key trends and patterns\n- Outliers and anomalies\n- Correlations between variables\n- Actionable recommendations\n\nData:\n[paste data here]',
        description: 'Analyzes datasets and provides actionable insights',
        category_id: 4, // Analysis
        tags: ['data', 'analysis', 'few-shot'],
      },
      {
        title: 'Creative Image Prompt',
        content: 'Create a detailed image generation prompt for: [CONCEPT]\n\nInclude specifics about:\n- Style (photorealistic, illustration, watercolor, etc.)\n- Lighting and mood\n- Composition and framing\n- Color palette\n- Key details and textures',
        description: 'Generates detailed prompts for AI image generation',
        category_id: 5, // Image Gen
        tags: ['image', 'creative', 'midjourney'],
      },
    ];

    const insertPrompt = db.prepare(
      'INSERT INTO prompts (title, content, description, category_id) VALUES (?, ?, ?, ?)'
    );
    const insertTag = db.prepare('INSERT OR IGNORE INTO tags (name) VALUES (?)');
    const getTag = db.prepare('SELECT id FROM tags WHERE name = ?');
    const insertPromptTag = db.prepare('INSERT INTO prompt_tags (prompt_id, tag_id) VALUES (?, ?)');
    const insertFts = db.prepare(
      'INSERT INTO prompts_fts (rowid, title, content, description, tags) VALUES (?, ?, ?, ?, ?)'
    );

    const seedAll = db.transaction(() => {
      for (const sp of seedPrompts) {
        const result = insertPrompt.run(sp.title, sp.content, sp.description, sp.category_id);
        const promptId = result.lastInsertRowid as number;
        for (const tagName of sp.tags) {
          insertTag.run(tagName);
          const tag = getTag.get(tagName) as { id: number };
          insertPromptTag.run(promptId, tag.id);
        }
        insertFts.run(promptId, sp.title, sp.content, sp.description, sp.tags.join(' '));
      }
    });
    seedAll();
  }

  return db;
}
