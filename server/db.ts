import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createDatabase(dbPath?: string): Database.Database {
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

  return db;
}
