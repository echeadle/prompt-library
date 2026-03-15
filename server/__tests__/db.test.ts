import { describe, it, expect, beforeEach } from 'vitest';
import { createDatabase } from '../db';
import Database from 'better-sqlite3';

describe('Database', () => {
  let db: Database.Database;

  beforeEach(() => {
    db = createDatabase(':memory:', { seed: false });
  });

  it('creates all tables', () => {
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
      .all() as { name: string }[];
    const names = tables.map((t) => t.name);
    expect(names).toContain('categories');
    expect(names).toContain('prompts');
    expect(names).toContain('tags');
    expect(names).toContain('prompt_tags');
  });

  it('seeds default categories', () => {
    const cats = db.prepare('SELECT * FROM categories ORDER BY id').all() as { id: number; name: string }[];
    expect(cats.length).toBeGreaterThanOrEqual(8);
    expect(cats[0].name).toBe('Uncategorized');
  });

  it('has FTS5 virtual table', () => {
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='prompts_fts'")
      .all();
    expect(tables.length).toBe(1);
  });
});
