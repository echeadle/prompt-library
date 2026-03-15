import { describe, it, expect, beforeEach } from 'vitest';
import { createDatabase } from '../db.js';
import Database from 'better-sqlite3';

describe('settings table', () => {
  let db: Database.Database;

  beforeEach(() => {
    db = createDatabase(':memory:', { seed: false });
  });

  it('creates settings table', () => {
    const tables = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='settings'"
    ).all();
    expect(tables).toHaveLength(1);
  });

  it('stores and retrieves a setting', () => {
    db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('ai_provider', 'anthropic');
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('ai_provider') as { value: string };
    expect(row.value).toBe('anthropic');
  });

  it('enforces unique keys via upsert', () => {
    db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('ai_provider', 'anthropic');
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('ai_provider', 'openai');
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('ai_provider') as { value: string };
    expect(row.value).toBe('openai');
  });
});
