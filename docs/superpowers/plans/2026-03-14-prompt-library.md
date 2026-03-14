# Prompt Library Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local web app for saving, organizing, tagging, and searching AI prompts.

**Architecture:** Flat monorepo with Express API (port 3001) and React/Vite frontend (port 5173). SQLite database with FTS5 for search. Vite proxies API requests in dev. React Query for server state, Context for UI state.

**Tech Stack:** React, TypeScript, Vite, Tailwind CSS, Express, better-sqlite3, TanStack React Query, react-hot-toast, vitest, concurrently, tsx

---

## Chunk 1: Project Scaffolding & Database

### Task 1: Initialize project and install dependencies

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsconfig.server.json`
- Create: `vite.config.ts`
- Create: `client/index.html`
- Create: `client/src/main.tsx`
- Create: `client/src/App.tsx`
- Create: `data/.gitkeep`

- [ ] **Step 1: Initialize package.json**

```bash
npm init -y
```

- [ ] **Step 2: Install backend dependencies**

```bash
npm install express better-sqlite3 cors
npm install -D typescript @types/express @types/better-sqlite3 @types/cors tsx concurrently
```

- [ ] **Step 3: Install frontend dependencies**

```bash
npm install react react-dom @tanstack/react-query react-hot-toast
npm install -D @vitejs/plugin-react tailwindcss @tailwindcss/vite @types/react @types/react-dom vite
```

- [ ] **Step 4: Install test dependencies**

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom supertest @types/supertest
```

- [ ] **Step 5: Create tsconfig.json (base config)**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": ".",
    "paths": {
      "@shared/*": ["shared/*"]
    }
  },
  "include": ["client/src/**/*", "shared/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 6: Create tsconfig.server.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "outDir": "./dist/server",
    "baseUrl": ".",
    "paths": {
      "@shared/*": ["shared/*"]
    }
  },
  "include": ["server/**/*", "shared/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 7: Create vite.config.ts**

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  root: 'client',
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, 'shared'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
});
```

- [ ] **Step 8: Create client/index.html**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Prompt Library</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 9: Create client/src/main.tsx (minimal entry)**

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- [ ] **Step 10: Create client/src/App.tsx (placeholder)**

```tsx
export default function App() {
  return <div>Prompt Library</div>;
}
```

- [ ] **Step 11: Create data/.gitkeep**

```bash
mkdir -p data && touch data/.gitkeep
```

- [ ] **Step 12: Add scripts to package.json**

Update `package.json` scripts:
```json
{
  "type": "module",
  "scripts": {
    "dev": "concurrently \"npm run dev:server\" \"npm run dev:client\"",
    "dev:server": "tsx watch server/index.ts",
    "dev:client": "vite --config vite.config.ts",
    "build": "vite build --config vite.config.ts",
    "start": "tsx server/index.ts",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

- [ ] **Step 13: Commit**

```bash
git add -A
git commit -m "feat: initialize project with dependencies and config"
```

---

### Task 2: Shared types

**Files:**
- Create: `shared/types.ts`

- [ ] **Step 1: Create shared type definitions**

```ts
export interface Category {
  id: number;
  name: string;
  color: string;
}

export interface Tag {
  id: number;
  name: string;
}

export interface Prompt {
  id: number;
  title: string;
  content: string;
  description: string | null;
  category_id: number;
  is_favorite: number;
  created_at: string;
  updated_at: string;
  category?: Category;
  tags?: Tag[];
}

export interface PromptInput {
  title: string;
  content: string;
  description?: string;
  category_id: number;
  tags: string[];
}

export interface PromptFilters {
  q?: string;
  category?: number;
  tag?: number;
  favorite?: boolean;
  sort?: 'created_at' | 'updated_at' | 'title' | 'is_favorite';
  order?: 'asc' | 'desc';
}

export interface ImportResult {
  imported: number;
  skipped: number;
}
```

- [ ] **Step 2: Commit**

```bash
git add shared/types.ts
git commit -m "feat: add shared type definitions"
```

---

### Task 3: Database setup with schema, migrations, and seed data

**Files:**
- Create: `server/db.ts`

- [ ] **Step 1: Write the database test**

Create `server/__tests__/db.test.ts`:
```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { createDatabase } from '../db';
import Database from 'better-sqlite3';

describe('Database', () => {
  let db: Database.Database;

  beforeEach(() => {
    db = createDatabase(':memory:');
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run server/__tests__/db.test.ts
```
Expected: FAIL — `createDatabase` does not exist yet.

- [ ] **Step 3: Create server/db.ts**

```ts
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createDatabase(dbPath?: string): Database.Database {
  const resolvedPath = dbPath ?? path.join(__dirname, '..', 'data', 'prompts.db');
  const db = new Database(resolvedPath);

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
```

- [ ] **Step 4: Add vitest config for server tests**

Add to `package.json` (or create `vitest.config.ts`):
```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, 'shared'),
    },
  },
  test: {
    globals: true,
  },
});
```

- [ ] **Step 5: Run test to verify it passes**

```bash
npx vitest run server/__tests__/db.test.ts
```
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add server/db.ts server/__tests__/db.test.ts vitest.config.ts
git commit -m "feat: add database setup with schema, FTS5, and seed categories"
```

---

### Task 4: Express server entry point

**Files:**
- Create: `server/index.ts`

- [ ] **Step 1: Create server/index.ts (minimal, serves health check)**

```ts
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createDatabase } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors());
app.use(express.json());

// Initialize database
export const db = createDatabase();

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Serve static files in production
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));
app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;
```

- [ ] **Step 2: Verify dev server starts**

```bash
npx tsx server/index.ts
```
Expected: "Server running on http://localhost:3001". Ctrl+C to stop.

- [ ] **Step 3: Commit**

```bash
git add server/index.ts
git commit -m "feat: add Express server entry point with health check"
```

---

## Chunk 2: API Routes — Categories & Tags

### Task 5: Categories CRUD routes

**Files:**
- Create: `server/routes/categories.ts`
- Create: `server/__tests__/categories.test.ts`
- Modify: `server/index.ts` (register route)

- [ ] **Step 1: Write categories route tests**

Create `server/__tests__/categories.test.ts`:
```ts
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
    db = createDatabase(':memory:');
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
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run server/__tests__/categories.test.ts
```
Expected: FAIL — `createCategoriesRouter` does not exist.

- [ ] **Step 3: Create server/routes/categories.ts**

```ts
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run server/__tests__/categories.test.ts
```
Expected: PASS

- [ ] **Step 5: Register route in server/index.ts**

Add after the health check:
```ts
import { createCategoriesRouter } from './routes/categories.js';
// ...
app.use('/api/categories', createCategoriesRouter(db));
```

- [ ] **Step 6: Commit**

```bash
git add server/routes/categories.ts server/__tests__/categories.test.ts server/index.ts
git commit -m "feat: add categories CRUD API with tests"
```

---

### Task 6: Tags CRUD routes

**Files:**
- Create: `server/routes/tags.ts`
- Create: `server/__tests__/tags.test.ts`
- Modify: `server/index.ts` (register route)

- [ ] **Step 1: Write tags route tests**

Create `server/__tests__/tags.test.ts`:
```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { createDatabase } from '../db';
import Database from 'better-sqlite3';
import { createTagsRouter } from '../routes/tags';
import express from 'express';
import request from 'supertest';

function createApp(db: Database.Database) {
  const app = express();
  app.use(express.json());
  app.use('/api/tags', createTagsRouter(db));
  return app;
}

describe('Tags API', () => {
  let db: Database.Database;
  let app: express.Express;

  beforeEach(() => {
    db = createDatabase(':memory:');
    app = createApp(db);
  });

  it('GET /api/tags returns empty initially', async () => {
    const res = await request(app).get('/api/tags');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('POST /api/tags creates a tag', async () => {
    const res = await request(app).post('/api/tags').send({ name: 'python' });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('python');
  });

  it('POST /api/tags normalizes to lowercase', async () => {
    const res = await request(app).post('/api/tags').send({ name: 'Python' });
    expect(res.body.name).toBe('python');
  });

  it('DELETE /api/tags/:id removes a tag', async () => {
    const created = await request(app).post('/api/tags').send({ name: 'test' });
    const res = await request(app).delete(`/api/tags/${created.body.id}`);
    expect(res.status).toBe(200);
    const list = await request(app).get('/api/tags');
    expect(list.body.length).toBe(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run server/__tests__/tags.test.ts
```

- [ ] **Step 3: Create server/routes/tags.ts**

```ts
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run server/__tests__/tags.test.ts
```

- [ ] **Step 5: Register route in server/index.ts**

```ts
import { createTagsRouter } from './routes/tags.js';
// ...
app.use('/api/tags', createTagsRouter(db));
```

- [ ] **Step 6: Commit**

```bash
git add server/routes/tags.ts server/__tests__/tags.test.ts server/index.ts
git commit -m "feat: add tags CRUD API with tests"
```

---

## Chunk 3: API Routes — Prompts

### Task 7: Prompts CRUD routes (create, read, update, delete)

**Files:**
- Create: `server/routes/prompts.ts`
- Create: `server/__tests__/prompts.test.ts`
- Modify: `server/index.ts` (register route)

- [ ] **Step 1: Write prompts route tests**

Create `server/__tests__/prompts.test.ts`:
```ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run server/__tests__/prompts.test.ts
```

- [ ] **Step 3: Create server/routes/prompts.ts**

```ts
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run server/__tests__/prompts.test.ts
```

- [ ] **Step 5: Register route in server/index.ts**

```ts
import { createPromptsRouter } from './routes/prompts.js';
// ...
app.use('/api/prompts', createPromptsRouter(db));
```

- [ ] **Step 6: Commit**

```bash
git add server/routes/prompts.ts server/__tests__/prompts.test.ts server/index.ts
git commit -m "feat: add prompts CRUD API with filters, FTS search, and tests"
```

---

### Task 8: Import/Export routes

**Files:**
- Create: `server/routes/importExport.ts`
- Create: `server/__tests__/importExport.test.ts`
- Modify: `server/index.ts` (register route)

- [ ] **Step 1: Write import/export tests**

Create `server/__tests__/importExport.test.ts`:
```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { createDatabase } from '../db';
import Database from 'better-sqlite3';
import { createImportExportRouter } from '../routes/importExport';
import { createPromptsRouter } from '../routes/prompts';
import express from 'express';
import request from 'supertest';

function createApp(db: Database.Database) {
  const app = express();
  app.use(express.json());
  app.use('/api/prompts', createPromptsRouter(db));
  app.use('/api', createImportExportRouter(db));
  return app;
}

describe('Import/Export API', () => {
  let db: Database.Database;
  let app: express.Express;

  beforeEach(() => {
    db = createDatabase(':memory:');
    app = createApp(db);
  });

  it('GET /api/export returns all prompts as JSON', async () => {
    await request(app).post('/api/prompts').send({
      title: 'P1', content: 'C1', category_id: 1, tags: ['test'],
    });
    const res = await request(app).get('/api/export');
    expect(res.status).toBe(200);
    expect(res.body.prompts).toHaveLength(1);
    expect(res.body.prompts[0].title).toBe('P1');
    expect(res.body.prompts[0].tags).toContain('test');
    expect(res.body.prompts[0].category).toBe('Uncategorized');
  });

  it('POST /api/import imports new prompts', async () => {
    const res = await request(app).post('/api/import').send({
      prompts: [{
        title: 'Imported',
        content: 'Content',
        category: 'Coding',
        tags: ['new-tag'],
      }],
    });
    expect(res.status).toBe(200);
    expect(res.body.imported).toBe(1);
    expect(res.body.skipped).toBe(0);

    const list = await request(app).get('/api/prompts');
    expect(list.body.length).toBe(1);
  });

  it('POST /api/import skips duplicates by title', async () => {
    await request(app).post('/api/prompts').send({
      title: 'Existing', content: 'C1', category_id: 1, tags: [],
    });
    const res = await request(app).post('/api/import').send({
      prompts: [{ title: 'Existing', content: 'Different', category: 'Coding', tags: [] }],
    });
    expect(res.body.imported).toBe(0);
    expect(res.body.skipped).toBe(1);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run server/__tests__/importExport.test.ts
```

- [ ] **Step 3: Create server/routes/importExport.ts**

```ts
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run server/__tests__/importExport.test.ts
```

- [ ] **Step 5: Register route in server/index.ts**

```ts
import { createImportExportRouter } from './routes/importExport.js';
// ...
app.use('/api', createImportExportRouter(db));
```

- [ ] **Step 6: Commit**

```bash
git add server/routes/importExport.ts server/__tests__/importExport.test.ts server/index.ts
git commit -m "feat: add import/export API with duplicate detection and tests"
```

---

### Task 9: Seed example prompts

**Files:**
- Modify: `server/db.ts`

- [ ] **Step 1: Add seed prompts to db.ts after category seeding**

Add inside `createDatabase`, after the category seeding block:
```ts
// Seed example prompts if empty
const promptCount = db.prepare('SELECT COUNT(*) as count FROM prompts').get() as { count: number };
if (promptCount.count === 0) {
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
```

- [ ] **Step 2: Run all backend tests to confirm nothing broke**

```bash
npx vitest run server/__tests__/
```

- [ ] **Step 3: Commit**

```bash
git add server/db.ts
git commit -m "feat: add seed example prompts for first-run experience"
```

---

## Chunk 4: Frontend Foundation

### Task 10: Tailwind CSS setup and base styles

**Files:**
- Create: `client/src/index.css`
- Modify: `client/src/main.tsx` (import CSS)

- [ ] **Step 1: Create client/src/index.css**

```css
@import "tailwindcss";
```

- [ ] **Step 2: Import CSS in main.tsx**

Add to top of `client/src/main.tsx`:
```ts
import './index.css';
```

- [ ] **Step 3: Verify Vite dev server starts with Tailwind**

```bash
npm run dev:client
```
Expected: Vite starts on port 5173, page shows "Prompt Library" with Tailwind reset applied.

- [ ] **Step 4: Commit**

```bash
git add client/src/index.css client/src/main.tsx
git commit -m "feat: add Tailwind CSS setup"
```

---

### Task 11: Shared types and API client

**Files:**
- Create: `client/src/types.ts`
- Create: `client/src/api/prompts.ts`
- Create: `client/src/api/categories.ts`
- Create: `client/src/api/tags.ts`

- [ ] **Step 1: Create client/src/types.ts (re-export shared types)**

```ts
export type {
  Prompt,
  PromptInput,
  PromptFilters,
  Category,
  Tag,
  ImportResult,
} from '../../shared/types';
```

- [ ] **Step 2: Create client/src/api/prompts.ts**

```ts
import type { Prompt, PromptInput, PromptFilters, ImportResult } from '../types';

const BASE = '/api';

export async function fetchPrompts(filters: PromptFilters = {}): Promise<Prompt[]> {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  if (filters.category) params.set('category', String(filters.category));
  if (filters.tag) params.set('tag', String(filters.tag));
  if (filters.favorite) params.set('favorite', 'true');
  if (filters.sort) params.set('sort', filters.sort);
  if (filters.order) params.set('order', filters.order);

  const res = await fetch(`${BASE}/prompts?${params}`);
  if (!res.ok) throw new Error('Failed to fetch prompts');
  return res.json();
}

export async function fetchPrompt(id: number): Promise<Prompt> {
  const res = await fetch(`${BASE}/prompts/${id}`);
  if (!res.ok) throw new Error('Failed to fetch prompt');
  return res.json();
}

export async function createPrompt(input: PromptInput): Promise<Prompt> {
  const res = await fetch(`${BASE}/prompts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error('Failed to create prompt');
  return res.json();
}

export async function updatePrompt(id: number, input: Partial<PromptInput> & { is_favorite?: number }): Promise<Prompt> {
  const res = await fetch(`${BASE}/prompts/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error('Failed to update prompt');
  return res.json();
}

export async function deletePrompt(id: number): Promise<void> {
  const res = await fetch(`${BASE}/prompts/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete prompt');
}

export async function exportPrompts(filters: PromptFilters = {}): Promise<{ prompts: any[] }> {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  if (filters.category) params.set('category', String(filters.category));
  if (filters.tag) params.set('tag', String(filters.tag));
  if (filters.favorite) params.set('favorite', 'true');

  const res = await fetch(`${BASE}/export?${params}`);
  if (!res.ok) throw new Error('Failed to export');
  return res.json();
}

export async function importPrompts(data: { prompts: any[] }): Promise<ImportResult> {
  const res = await fetch(`${BASE}/import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to import');
  return res.json();
}
```

- [ ] **Step 3: Create client/src/api/categories.ts**

```ts
import type { Category } from '../types';

const BASE = '/api';

export async function fetchCategories(): Promise<Category[]> {
  const res = await fetch(`${BASE}/categories`);
  if (!res.ok) throw new Error('Failed to fetch categories');
  return res.json();
}

export async function createCategory(name: string, color: string): Promise<Category> {
  const res = await fetch(`${BASE}/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, color }),
  });
  if (!res.ok) throw new Error('Failed to create category');
  return res.json();
}

export async function updateCategory(id: number, data: Partial<Category>): Promise<Category> {
  const res = await fetch(`${BASE}/categories/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update category');
  return res.json();
}

export async function deleteCategory(id: number): Promise<void> {
  const res = await fetch(`${BASE}/categories/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete category');
}
```

- [ ] **Step 4: Create client/src/api/tags.ts**

```ts
import type { Tag } from '../types';

const BASE = '/api';

export async function fetchTags(): Promise<Tag[]> {
  const res = await fetch(`${BASE}/tags`);
  if (!res.ok) throw new Error('Failed to fetch tags');
  return res.json();
}

export async function createTag(name: string): Promise<Tag> {
  const res = await fetch(`${BASE}/tags`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error('Failed to create tag');
  return res.json();
}

export async function deleteTag(id: number): Promise<void> {
  const res = await fetch(`${BASE}/tags/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete tag');
}
```

- [ ] **Step 5: Commit**

```bash
git add client/src/types.ts client/src/api/
git commit -m "feat: add API client functions for prompts, categories, and tags"
```

---

### Task 12: React Query hooks and App context

**Files:**
- Create: `client/src/hooks/usePrompts.ts`
- Create: `client/src/hooks/useCategories.ts`
- Create: `client/src/hooks/useTags.ts`
- Create: `client/src/context/AppContext.tsx`
- Modify: `client/src/main.tsx` (wrap with providers)
- Modify: `client/src/App.tsx` (wrap with providers)

- [ ] **Step 1: Create client/src/hooks/usePrompts.ts**

```tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchPrompts, fetchPrompt, createPrompt, updatePrompt, deletePrompt } from '../api/prompts';
import type { PromptFilters, PromptInput } from '../types';

export function usePrompts(filters: PromptFilters = {}) {
  return useQuery({
    queryKey: ['prompts', filters],
    queryFn: () => fetchPrompts(filters),
  });
}

export function usePrompt(id: number | undefined) {
  return useQuery({
    queryKey: ['prompt', id],
    queryFn: () => fetchPrompt(id!),
    enabled: !!id,
  });
}

export function useCreatePrompt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: PromptInput) => createPrompt(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompts'] });
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
  });
}

export function useUpdatePrompt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: { id: number } & Partial<PromptInput> & { is_favorite?: number }) =>
      updatePrompt(id, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['prompts'] });
      queryClient.invalidateQueries({ queryKey: ['prompt', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
  });
}

export function useDeletePrompt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deletePrompt(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompts'] });
    },
  });
}
```

- [ ] **Step 2: Create client/src/hooks/useCategories.ts**

```tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchCategories, createCategory, updateCategory, deleteCategory } from '../api/categories';

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name, color }: { name: string; color: string }) => createCategory(name, color),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number; name?: string; color?: string }) => updateCategory(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['prompts'] });
    },
  });
}
```

- [ ] **Step 3: Create client/src/hooks/useTags.ts**

```tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchTags, createTag, deleteTag } from '../api/tags';

export function useTags() {
  return useQuery({
    queryKey: ['tags'],
    queryFn: fetchTags,
  });
}

export function useCreateTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => createTag(name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tags'] }),
  });
}

export function useDeleteTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteTag(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tags'] }),
  });
}
```

- [ ] **Step 4: Create client/src/context/AppContext.tsx**

```tsx
import { createContext, useContext, useState, type ReactNode } from 'react';

interface SlideOutState {
  open: boolean;
  mode: 'view' | 'edit' | 'create';
  promptId?: number;
}

interface AppState {
  selectedCategory: number | null;
  selectedTags: number[];
  searchQuery: string;
  favoritesOnly: boolean;
  viewMode: 'grid' | 'list';
  sortField: 'created_at' | 'updated_at' | 'title' | 'is_favorite';
  sortOrder: 'asc' | 'desc';
  slideOut: SlideOutState;
}

interface AppContextType extends AppState {
  setSelectedCategory: (id: number | null) => void;
  setSelectedTags: (tags: number[]) => void;
  setSearchQuery: (q: string) => void;
  setFavoritesOnly: (v: boolean) => void;
  setViewMode: (mode: 'grid' | 'list') => void;
  setSortField: (field: AppState['sortField']) => void;
  setSortOrder: (order: 'asc' | 'desc') => void;
  openSlideOut: (mode: SlideOutState['mode'], promptId?: number) => void;
  closeSlideOut: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortField, setSortField] = useState<AppState['sortField']>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [slideOut, setSlideOut] = useState<SlideOutState>({ open: false, mode: 'view' });

  const openSlideOut = (mode: SlideOutState['mode'], promptId?: number) => {
    setSlideOut({ open: true, mode, promptId });
  };

  const closeSlideOut = () => {
    setSlideOut({ open: false, mode: 'view' });
  };

  return (
    <AppContext.Provider
      value={{
        selectedCategory, setSelectedCategory,
        selectedTags, setSelectedTags,
        searchQuery, setSearchQuery,
        favoritesOnly, setFavoritesOnly,
        viewMode, setViewMode,
        sortField, setSortField,
        sortOrder, setSortOrder,
        slideOut, openSlideOut, closeSlideOut,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}
```

- [ ] **Step 5: Update client/src/App.tsx with providers**

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AppProvider } from './context/AppContext';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <div className="flex h-screen bg-white text-slate-800">
          <main className="flex-1 flex items-center justify-center text-slate-400">
            Prompt Library — UI coming next
          </main>
        </div>
        <Toaster position="bottom-right" />
      </AppProvider>
    </QueryClientProvider>
  );
}
```

- [ ] **Step 6: Verify full dev setup works**

```bash
npm run dev
```
Expected: Both servers start. Opening http://localhost:5173 shows placeholder text. Opening http://localhost:3001/api/health returns `{"status":"ok"}`.

- [ ] **Step 7: Commit**

```bash
git add client/src/hooks/ client/src/context/ client/src/App.tsx
git commit -m "feat: add React Query hooks, AppContext, and provider setup"
```

---

## Chunk 5: Frontend UI Components

### Task 13: Sidebar component

**Files:**
- Create: `client/src/components/Sidebar.tsx`
- Modify: `client/src/App.tsx` (add Sidebar)

- [ ] **Step 1: Create client/src/components/Sidebar.tsx**

```tsx
import { useCategories } from '../hooks/useCategories';
import { useTags } from '../hooks/useTags';
import { usePrompts } from '../hooks/usePrompts';
import { useAppContext } from '../context/AppContext';

export default function Sidebar() {
  const { data: categories = [] } = useCategories();
  const { data: tags = [] } = useTags();
  const { data: prompts = [] } = usePrompts();
  const {
    selectedCategory, setSelectedCategory,
    selectedTags, setSelectedTags,
    favoritesOnly, setFavoritesOnly,
  } = useAppContext();

  const categoryCount = (catId: number) =>
    prompts.filter((p) => p.category_id === catId).length;

  const toggleTag = (tagId: number) => {
    setSelectedTags(
      selectedTags.includes(tagId)
        ? selectedTags.filter((id) => id !== tagId)
        : [...selectedTags, tagId]
    );
  };

  return (
    <aside className="w-56 min-w-56 bg-slate-50 border-r border-slate-200 p-4 flex flex-col gap-5 overflow-y-auto">
      {/* Categories */}
      <div>
        <h3 className="text-xs font-semibold uppercase text-slate-400 tracking-wide mb-2">
          Categories
        </h3>
        <div className="flex flex-col gap-0.5">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-2.5 py-1.5 rounded-md text-left text-sm flex justify-between ${
              selectedCategory === null ? 'bg-indigo-100 text-indigo-800 font-medium' : 'hover:bg-slate-100'
            }`}
          >
            All Prompts
            <span className={selectedCategory === null ? 'text-indigo-500' : 'text-slate-400'}>
              {prompts.length}
            </span>
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id === selectedCategory ? null : cat.id)}
              className={`px-2.5 py-1.5 rounded-md text-left text-sm flex justify-between ${
                selectedCategory === cat.id ? 'bg-indigo-100 text-indigo-800 font-medium' : 'hover:bg-slate-100'
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                {cat.name}
              </span>
              <span className={selectedCategory === cat.id ? 'text-indigo-500' : 'text-slate-400'}>
                {categoryCount(cat.id)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div>
        <h3 className="text-xs font-semibold uppercase text-slate-400 tracking-wide mb-2">
          Tags
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <button
              key={tag.id}
              onClick={() => toggleTag(tag.id)}
              className={`px-2 py-0.5 rounded-full text-xs border ${
                selectedTags.includes(tag.id)
                  ? 'bg-indigo-100 border-indigo-300 text-indigo-700'
                  : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'
              }`}
            >
              {tag.name}
            </button>
          ))}
        </div>
      </div>

      {/* Favorites */}
      <div>
        <button
          onClick={() => setFavoritesOnly(!favoritesOnly)}
          className={`px-2.5 py-1.5 rounded-md text-left text-sm flex items-center gap-1.5 ${
            favoritesOnly ? 'bg-amber-50 text-amber-700 font-medium' : 'hover:bg-slate-100'
          }`}
        >
          <span className={favoritesOnly ? 'text-amber-500' : 'text-slate-300'}>★</span>
          Favorites
        </button>
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: Add Sidebar to App.tsx**

```tsx
import Sidebar from './components/Sidebar';
// In the return:
<div className="flex h-screen bg-white text-slate-800">
  <Sidebar />
  <main className="flex-1 flex items-center justify-center text-slate-400">
    Content area
  </main>
</div>
```

- [ ] **Step 3: Verify sidebar renders with seed data**

```bash
npm run dev
```
Open http://localhost:5173. Sidebar should show categories with counts and tag pills.

- [ ] **Step 4: Commit**

```bash
git add client/src/components/Sidebar.tsx client/src/App.tsx
git commit -m "feat: add Sidebar component with categories, tags, and favorites filter"
```

---

### Task 14: TopBar component

**Files:**
- Create: `client/src/components/TopBar.tsx`
- Modify: `client/src/App.tsx`

- [ ] **Step 1: Create client/src/components/TopBar.tsx**

```tsx
import { useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext';

export default function TopBar() {
  const {
    searchQuery, setSearchQuery,
    viewMode, setViewMode,
    sortField, setSortField,
    sortOrder, setSortOrder,
    openSlideOut,
  } = useAppContext();

  const [localSearch, setLocalSearch] = useState(searchQuery);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setSearchQuery(localSearch), 300);
    return () => clearTimeout(timer);
  }, [localSearch, setSearchQuery]);

  return (
    <div className="px-5 py-3 border-b border-slate-200 flex items-center gap-3">
      {/* Search */}
      <div className="flex-1 relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
        <input
          type="text"
          placeholder="Search prompts..."
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300"
        />
      </div>

      {/* View Toggle */}
      <div className="flex gap-0.5 bg-slate-100 rounded-md p-0.5">
        <button
          onClick={() => setViewMode('grid')}
          className={`px-2 py-1 rounded text-xs ${viewMode === 'grid' ? 'bg-white shadow-sm font-medium' : 'text-slate-500'}`}
        >
          Grid
        </button>
        <button
          onClick={() => setViewMode('list')}
          className={`px-2 py-1 rounded text-xs ${viewMode === 'list' ? 'bg-white shadow-sm font-medium' : 'text-slate-500'}`}
        >
          List
        </button>
      </div>

      {/* Sort */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-slate-400">Sort:</span>
        <select
          value={sortField}
          onChange={(e) => setSortField(e.target.value as any)}
          className="text-xs border border-slate-200 rounded-md px-2 py-1 bg-white"
        >
          <option value="created_at">Newest</option>
          <option value="updated_at">Recently Updated</option>
          <option value="title">Title A-Z</option>
          <option value="is_favorite">Favorites First</option>
        </select>
        <button
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          className="text-xs text-slate-400 hover:text-slate-600 px-1"
        >
          {sortOrder === 'asc' ? '↑' : '↓'}
        </button>
      </div>

      {/* New Prompt */}
      <button
        onClick={() => openSlideOut('create')}
        className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
      >
        + New Prompt
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Add TopBar to App.tsx layout**

```tsx
import TopBar from './components/TopBar';
// Update layout:
<div className="flex h-screen bg-white text-slate-800">
  <Sidebar />
  <div className="flex-1 flex flex-col">
    <TopBar />
    <main className="flex-1 overflow-y-auto p-5 text-slate-400">
      Cards go here
    </main>
  </div>
</div>
```

- [ ] **Step 3: Verify TopBar renders**

```bash
npm run dev
```

- [ ] **Step 4: Commit**

```bash
git add client/src/components/TopBar.tsx client/src/App.tsx
git commit -m "feat: add TopBar with search, view toggle, sort, and new prompt button"
```

---

### Task 15: PromptCard and grid/list views

**Files:**
- Create: `client/src/components/TagBadge.tsx`
- Create: `client/src/components/PromptCard.tsx`
- Create: `client/src/components/PromptGrid.tsx`
- Modify: `client/src/App.tsx`

- [ ] **Step 1: Create client/src/components/TagBadge.tsx**

```tsx
export default function TagBadge({ name }: { name: string }) {
  return (
    <span className="px-1.5 py-0.5 bg-slate-100 rounded-full text-[10px] text-slate-500">
      {name}
    </span>
  );
}
```

- [ ] **Step 2: Create client/src/components/PromptCard.tsx**

```tsx
import { useUpdatePrompt } from '../hooks/usePrompts';
import { useAppContext } from '../context/AppContext';
import TagBadge from './TagBadge';
import type { Prompt } from '../types';

export default function PromptCard({ prompt }: { prompt: Prompt }) {
  const { openSlideOut } = useAppContext();
  const updatePrompt = useUpdatePrompt();

  const toggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    updatePrompt.mutate({ id: prompt.id, is_favorite: prompt.is_favorite ? 0 : 1 });
  };

  return (
    <div
      onClick={() => openSlideOut('view', prompt.id)}
      className="border border-slate-200 rounded-xl p-4 bg-white cursor-pointer hover:shadow-md transition-shadow"
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-semibold text-sm text-slate-800 truncate pr-2">{prompt.title}</h4>
        <button onClick={toggleFavorite} className="text-base shrink-0">
          {prompt.is_favorite ? (
            <span className="text-amber-400">★</span>
          ) : (
            <span className="text-slate-300 hover:text-amber-400">☆</span>
          )}
        </button>
      </div>

      {prompt.category && (
        <div className="mb-2">
          <span
            className="px-2 py-0.5 rounded text-[10px] font-medium"
            style={{
              backgroundColor: prompt.category.color + '20',
              color: prompt.category.color,
            }}
          >
            {prompt.category.name}
          </span>
        </div>
      )}

      <p className="text-xs text-slate-500 leading-relaxed mb-2.5 line-clamp-2">
        {prompt.content}
      </p>

      {prompt.tags && prompt.tags.length > 0 && (
        <div className="flex gap-1 flex-wrap">
          {prompt.tags.map((tag) => (
            <TagBadge key={tag.id} name={tag.name} />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create client/src/components/PromptGrid.tsx**

```tsx
import { usePrompts } from '../hooks/usePrompts';
import { useAppContext } from '../context/AppContext';
import PromptCard from './PromptCard';
import type { PromptFilters } from '../types';

export default function PromptGrid() {
  const {
    selectedCategory, selectedTags, searchQuery,
    favoritesOnly, sortField, sortOrder, viewMode,
  } = useAppContext();

  const filters: PromptFilters = {
    ...(searchQuery && { q: searchQuery }),
    ...(selectedCategory && { category: selectedCategory }),
    ...(selectedTags.length === 1 && { tag: selectedTags[0] }),
    ...(favoritesOnly && { favorite: true }),
    sort: sortField,
    order: sortOrder,
  };

  const { data: prompts = [], isLoading } = usePrompts(filters);

  // Client-side filter for multiple tags (API supports one tag filter)
  const filtered = selectedTags.length > 1
    ? prompts.filter((p) =>
        selectedTags.every((tagId) => p.tags?.some((t) => t.id === tagId))
      )
    : prompts;

  if (isLoading) {
    return <div className="p-5 text-slate-400 text-sm">Loading...</div>;
  }

  if (filtered.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
        No prompts found. Create one to get started!
      </div>
    );
  }

  if (viewMode === 'list') {
    return (
      <div className="p-5 flex flex-col gap-2">
        {filtered.map((prompt) => (
          <PromptCard key={prompt.id} prompt={prompt} />
        ))}
      </div>
    );
  }

  return (
    <div className="p-5 grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
      {filtered.map((prompt) => (
        <PromptCard key={prompt.id} prompt={prompt} />
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Add PromptGrid to App.tsx**

```tsx
import PromptGrid from './components/PromptGrid';
// Replace the <main> placeholder:
<main className="flex-1 overflow-y-auto">
  <PromptGrid />
</main>
```

- [ ] **Step 5: Verify cards render with seed data**

```bash
npm run dev
```
Expected: Card grid shows the 4 seed prompts with titles, category badges, previews, and tags.

- [ ] **Step 6: Commit**

```bash
git add client/src/components/TagBadge.tsx client/src/components/PromptCard.tsx client/src/components/PromptGrid.tsx client/src/App.tsx
git commit -m "feat: add PromptCard, PromptGrid, and TagBadge components"
```

---

## Chunk 6: Slide-Out Panel (View, Edit, Create)

### Task 16: TagComboInput component

**Files:**
- Create: `client/src/components/TagComboInput.tsx`

- [ ] **Step 1: Create client/src/components/TagComboInput.tsx**

```tsx
import { useState, useRef } from 'react';
import { useTags } from '../hooks/useTags';

interface Props {
  value: string[];
  onChange: (tags: string[]) => void;
}

export default function TagComboInput({ value, onChange }: Props) {
  const [input, setInput] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { data: allTags = [] } = useTags();

  const filtered = allTags.filter(
    (t) => t.name.includes(input.toLowerCase()) && !value.includes(t.name)
  );

  const addTag = (name: string) => {
    const normalized = name.toLowerCase().trim();
    if (normalized && !value.includes(normalized)) {
      onChange([...value, normalized]);
    }
    setInput('');
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  const removeTag = (name: string) => {
    onChange(value.filter((t) => t !== name));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ',') && input.trim()) {
      e.preventDefault();
      addTag(input);
    }
    if (e.key === 'Backspace' && !input && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  };

  return (
    <div className="relative">
      <div className="flex flex-wrap gap-1.5 p-2 border border-slate-200 rounded-lg bg-white min-h-[40px]">
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-xs"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="text-indigo-400 hover:text-indigo-600"
            >
              ×
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? 'Add tags...' : ''}
          className="flex-1 min-w-[80px] text-sm outline-none bg-transparent"
        />
      </div>

      {showDropdown && input && filtered.length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-32 overflow-y-auto">
          {filtered.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => addTag(tag.name)}
              className="w-full text-left px-3 py-1.5 text-sm hover:bg-slate-50"
            >
              {tag.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/TagComboInput.tsx
git commit -m "feat: add TagComboInput with autocomplete and keyboard support"
```

---

### Task 17: PromptForm component (create/edit)

**Files:**
- Create: `client/src/components/PromptForm.tsx`

- [ ] **Step 1: Create client/src/components/PromptForm.tsx**

```tsx
import { useState, useEffect } from 'react';
import { useCategories } from '../hooks/useCategories';
import TagComboInput from './TagComboInput';
import type { Prompt } from '../types';

interface Props {
  prompt?: Prompt | null;
  onSubmit: (data: {
    title: string;
    content: string;
    description: string;
    category_id: number;
    tags: string[];
  }) => void;
  onCancel: () => void;
}

export default function PromptForm({ prompt, onSubmit, onCancel }: Props) {
  const { data: categories = [] } = useCategories();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState(1);
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    if (prompt) {
      setTitle(prompt.title);
      setContent(prompt.content);
      setDescription(prompt.description ?? '');
      setCategoryId(prompt.category_id);
      setTags(prompt.tags?.map((t) => t.name) ?? []);
    }
  }, [prompt]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    onSubmit({
      title: title.trim(),
      content: content.trim(),
      description: description.trim(),
      category_id: categoryId,
      tags,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5">
      <div>
        <label className="text-xs font-semibold uppercase text-slate-400 tracking-wide mb-1 block">
          Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
          placeholder="Give your prompt a name"
        />
      </div>

      <div>
        <label className="text-xs font-semibold uppercase text-slate-400 tracking-wide mb-1 block">
          Category
        </label>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(Number(e.target.value))}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
        >
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-xs font-semibold uppercase text-slate-400 tracking-wide mb-1 block">
          Description <span className="text-slate-300">(optional)</span>
        </label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
          placeholder="What is this prompt for?"
        />
      </div>

      <div>
        <label className="text-xs font-semibold uppercase text-slate-400 tracking-wide mb-1 block">
          Prompt Content
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          rows={8}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 resize-y"
          placeholder="Write your prompt here..."
        />
      </div>

      <div>
        <label className="text-xs font-semibold uppercase text-slate-400 tracking-wide mb-1 block">
          Tags
        </label>
        <TagComboInput value={tags} onChange={setTags} />
      </div>

      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
        >
          {prompt ? 'Save Changes' : 'Create Prompt'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/PromptForm.tsx
git commit -m "feat: add PromptForm component for create and edit modes"
```

---

### Task 18: PromptView component (read-only detail)

**Files:**
- Create: `client/src/components/PromptView.tsx`

- [ ] **Step 1: Create client/src/components/PromptView.tsx**

```tsx
import toast from 'react-hot-toast';
import TagBadge from './TagBadge';
import type { Prompt } from '../types';

interface Props {
  prompt: Prompt;
  onEdit: () => void;
  onDelete: () => void;
}

export default function PromptView({ prompt, onEdit, onDelete }: Props) {
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(prompt.content);
      toast.success('Copied to clipboard!');
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleDelete = () => {
    if (window.confirm(`Delete "${prompt.title}"? This cannot be undone.`)) {
      onDelete();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-3 border-b border-slate-200 flex justify-between items-center">
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="px-3 py-1.5 bg-indigo-600 text-white rounded-md text-xs font-medium hover:bg-indigo-700"
          >
            Edit
          </button>
          <button
            onClick={copyToClipboard}
            className="px-3 py-1.5 border border-slate-200 text-indigo-600 rounded-md text-xs hover:bg-slate-50"
          >
            Copy
          </button>
          <button
            onClick={handleDelete}
            className="px-3 py-1.5 border border-slate-200 text-red-500 rounded-md text-xs hover:bg-red-50"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5">
        <h3 className="text-xl font-semibold text-slate-800 mb-1">{prompt.title}</h3>

        <div className="flex items-center gap-2 mb-4">
          {prompt.category && (
            <span
              className="px-2.5 py-0.5 rounded text-xs font-medium"
              style={{
                backgroundColor: prompt.category.color + '20',
                color: prompt.category.color,
              }}
            >
              {prompt.category.name}
            </span>
          )}
          <span className={`cursor-pointer ${prompt.is_favorite ? 'text-amber-400' : 'text-slate-300'}`}>
            {prompt.is_favorite ? '★' : '☆'}
          </span>
        </div>

        {prompt.description && (
          <div className="mb-4">
            <h4 className="text-xs font-semibold uppercase text-slate-400 tracking-wide mb-1">Description</h4>
            <p className="text-sm text-slate-600 leading-relaxed">{prompt.description}</p>
          </div>
        )}

        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <h4 className="text-xs font-semibold uppercase text-slate-400 tracking-wide">Prompt</h4>
            <button
              onClick={copyToClipboard}
              className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] text-slate-500 hover:bg-slate-200"
            >
              📋 Copy
            </button>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
            {prompt.content}
          </div>
        </div>

        {prompt.tags && prompt.tags.length > 0 && (
          <div className="mb-4">
            <h4 className="text-xs font-semibold uppercase text-slate-400 tracking-wide mb-1.5">Tags</h4>
            <div className="flex gap-1.5 flex-wrap">
              {prompt.tags.map((tag) => (
                <TagBadge key={tag.id} name={tag.name} />
              ))}
            </div>
          </div>
        )}

        <div className="text-xs text-slate-400 flex gap-4">
          <span>Created: {new Date(prompt.created_at).toLocaleDateString()}</span>
          <span>Updated: {new Date(prompt.updated_at).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/PromptView.tsx
git commit -m "feat: add PromptView component with copy-to-clipboard and delete confirmation"
```

---

### Task 19: PromptSlideOut container

**Files:**
- Create: `client/src/components/PromptSlideOut.tsx`
- Modify: `client/src/App.tsx`

- [ ] **Step 1: Create client/src/components/PromptSlideOut.tsx**

```tsx
import { useAppContext } from '../context/AppContext';
import { usePrompt, useCreatePrompt, useUpdatePrompt, useDeletePrompt } from '../hooks/usePrompts';
import PromptView from './PromptView';
import PromptForm from './PromptForm';
import toast from 'react-hot-toast';

export default function PromptSlideOut() {
  const { slideOut, closeSlideOut, openSlideOut } = useAppContext();
  const { data: prompt } = usePrompt(slideOut.promptId);
  const createPrompt = useCreatePrompt();
  const updatePrompt = useUpdatePrompt();
  const deletePrompt = useDeletePrompt();

  if (!slideOut.open) return null;

  const handleCreate = (data: any) => {
    createPrompt.mutate(data, {
      onSuccess: () => {
        toast.success('Prompt created!');
        closeSlideOut();
      },
      onError: () => toast.error('Failed to create prompt'),
    });
  };

  const handleUpdate = (data: any) => {
    if (!slideOut.promptId) return;
    updatePrompt.mutate({ id: slideOut.promptId, ...data }, {
      onSuccess: () => {
        toast.success('Prompt saved!');
        openSlideOut('view', slideOut.promptId);
      },
      onError: () => toast.error('Failed to save prompt'),
    });
  };

  const handleDelete = () => {
    if (!slideOut.promptId) return;
    deletePrompt.mutate(slideOut.promptId, {
      onSuccess: () => {
        toast.success('Prompt deleted');
        closeSlideOut();
      },
      onError: () => toast.error('Failed to delete prompt'),
    });
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-40"
        onClick={closeSlideOut}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-[420px] max-md:w-full bg-white border-l border-slate-200 shadow-xl z-50 flex flex-col">
        {/* Close button */}
        <button
          onClick={closeSlideOut}
          className="absolute top-3 right-3 p-1 text-slate-400 hover:text-slate-600 border border-slate-200 rounded-md z-10"
        >
          ✕
        </button>

        {slideOut.mode === 'create' && (
          <PromptForm onSubmit={handleCreate} onCancel={closeSlideOut} />
        )}

        {slideOut.mode === 'edit' && prompt && (
          <PromptForm
            prompt={prompt}
            onSubmit={handleUpdate}
            onCancel={() => openSlideOut('view', slideOut.promptId)}
          />
        )}

        {slideOut.mode === 'view' && prompt && (
          <PromptView
            prompt={prompt}
            onEdit={() => openSlideOut('edit', slideOut.promptId)}
            onDelete={handleDelete}
          />
        )}
      </div>
    </>
  );
}
```

- [ ] **Step 2: Add PromptSlideOut to App.tsx**

```tsx
import PromptSlideOut from './components/PromptSlideOut';
// Add after the main layout div, before </AppProvider>:
<PromptSlideOut />
```

- [ ] **Step 3: Verify full flow works**

```bash
npm run dev
```
Test: click a card → slide-out opens in view mode → click Edit → form appears → click Cancel → back to view → click Copy → toast shows → close panel → click "New Prompt" → create form appears.

- [ ] **Step 4: Commit**

```bash
git add client/src/components/PromptSlideOut.tsx client/src/App.tsx
git commit -m "feat: add PromptSlideOut with view, edit, and create modes"
```

---

## Chunk 7: Import/Export & Final Polish

### Task 20: Import/Export UI

**Files:**
- Modify: `client/src/components/TopBar.tsx` (add export/import buttons)

- [ ] **Step 1: Add import/export to TopBar**

Add to TopBar.tsx, after the "New Prompt" button:
```tsx
import { exportPrompts, importPrompts } from '../api/prompts';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';

// Inside TopBar component:
const queryClient = useQueryClient();

const handleExport = async () => {
  try {
    const data = await exportPrompts({
      ...(searchQuery && { q: searchQuery }),
      ...(selectedCategory && { category: selectedCategory }),
      ...(favoritesOnly && { favorite: true }),
    });
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'prompts-export.json';
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${data.prompts.length} prompts`);
  } catch {
    toast.error('Export failed');
  }
};

const handleImport = () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const result = await importPrompts(data);
      toast.success(`Imported ${result.imported}, skipped ${result.skipped}`);
      queryClient.invalidateQueries({ queryKey: ['prompts'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    } catch {
      toast.error('Import failed — check file format');
    }
  };
  input.click();
};
```

Add buttons to the JSX:
```tsx
<button onClick={handleExport} className="px-3 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50">
  Export
</button>
<button onClick={handleImport} className="px-3 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50">
  Import
</button>
```

- [ ] **Step 2: Test import/export manually**

Export prompts → check JSON file → import it back → should show "skipped" count.

- [ ] **Step 3: Commit**

```bash
git add client/src/components/TopBar.tsx
git commit -m "feat: add import/export buttons to TopBar"
```

---

## Chunk 8: Tests

### Task 21: Additional backend test coverage

**Files:**
- Modify: `server/__tests__/prompts.test.ts`
- Modify: `server/__tests__/importExport.test.ts`

- [ ] **Step 1: Add tag filter, sort, and error-handling tests to prompts.test.ts**

Append to the `describe('Prompts API')` block:
```ts
  it('GET /api/prompts?tag=X filters by tag', async () => {
    await request(app).post('/api/prompts').send({ title: 'A', content: 'C', category_id: 1, tags: ['python'] });
    await request(app).post('/api/prompts').send({ title: 'B', content: 'C', category_id: 1, tags: ['rust'] });
    const pythonTag = db.prepare("SELECT id FROM tags WHERE name = 'python'").get() as { id: number };
    const res = await request(app).get(`/api/prompts?tag=${pythonTag.id}`);
    expect(res.body.length).toBe(1);
    expect(res.body[0].title).toBe('A');
  });

  it('GET /api/prompts?sort=title&order=asc sorts by title', async () => {
    await request(app).post('/api/prompts').send({ title: 'Zebra', content: 'C', category_id: 1, tags: [] });
    await request(app).post('/api/prompts').send({ title: 'Apple', content: 'C', category_id: 1, tags: [] });
    const res = await request(app).get('/api/prompts?sort=title&order=asc');
    expect(res.body[0].title).toBe('Apple');
    expect(res.body[1].title).toBe('Zebra');
  });

  it('POST /api/prompts returns 400 without title', async () => {
    const res = await request(app).post('/api/prompts').send({ content: 'C', category_id: 1, tags: [] });
    expect(res.status).toBe(400);
  });

  it('GET /api/prompts/:id returns 404 for missing prompt', async () => {
    const res = await request(app).get('/api/prompts/999');
    expect(res.status).toBe(404);
  });

  it('PUT /api/prompts/:id returns 404 for missing prompt', async () => {
    const res = await request(app).put('/api/prompts/999').send({ title: 'X', content: 'Y', category_id: 1, tags: [] });
    expect(res.status).toBe(404);
  });
```

- [ ] **Step 2: Add category auto-creation test to importExport.test.ts**

Append to the `describe('Import/Export API')` block:
```ts
  it('POST /api/import creates new categories automatically', async () => {
    const res = await request(app).post('/api/import').send({
      prompts: [{ title: 'New Cat Prompt', content: 'C', category: 'BrandNewCategory', tags: [] }],
    });
    expect(res.body.imported).toBe(1);
    const cat = db.prepare("SELECT * FROM categories WHERE name = 'BrandNewCategory'").get();
    expect(cat).toBeDefined();
  });
```

- [ ] **Step 3: Run all backend tests**

```bash
npx vitest run server/__tests__/
```
Expected: All pass.

- [ ] **Step 4: Commit**

```bash
git add server/__tests__/
git commit -m "test: add tag filter, sort, error handling, and import category tests"
```

---

### Task 22: Frontend component tests

**Files:**
- Create: `client/src/__tests__/setup.ts`
- Create: `client/src/__tests__/PromptCard.test.tsx`
- Create: `client/src/__tests__/TagComboInput.test.tsx`
- Modify: `vitest.config.ts` (add jsdom environment for client tests)

- [ ] **Step 1: Update vitest.config.ts for frontend tests**

```ts
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, 'shared'),
    },
  },
  test: {
    globals: true,
    setupFiles: ['client/src/__tests__/setup.ts'],
    environmentMatchGlobs: [
      ['client/**', 'jsdom'],
      ['server/**', 'node'],
    ],
  },
});
```

- [ ] **Step 2: Create client/src/__tests__/setup.ts**

```ts
import '@testing-library/jest-dom';
```

- [ ] **Step 3: Create client/src/__tests__/PromptCard.test.tsx**

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppProvider } from '../context/AppContext';
import PromptCard from '../components/PromptCard';
import type { Prompt } from '../types';

const mockPrompt: Prompt = {
  id: 1,
  title: 'Test Prompt',
  content: 'This is the prompt content for testing purposes',
  description: 'A test description',
  category_id: 2,
  is_favorite: 0,
  created_at: '2026-03-14',
  updated_at: '2026-03-14',
  category: { id: 2, name: 'Coding', color: '#3b82f6' },
  tags: [{ id: 1, name: 'python' }, { id: 2, name: 'debug' }],
};

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <AppProvider>{ui}</AppProvider>
    </QueryClientProvider>
  );
}

describe('PromptCard', () => {
  it('renders title, category, and tags', () => {
    renderWithProviders(<PromptCard prompt={mockPrompt} />);
    expect(screen.getByText('Test Prompt')).toBeInTheDocument();
    expect(screen.getByText('Coding')).toBeInTheDocument();
    expect(screen.getByText('python')).toBeInTheDocument();
    expect(screen.getByText('debug')).toBeInTheDocument();
  });

  it('renders content preview', () => {
    renderWithProviders(<PromptCard prompt={mockPrompt} />);
    expect(screen.getByText(/This is the prompt content/)).toBeInTheDocument();
  });

  it('shows empty star when not favorited', () => {
    renderWithProviders(<PromptCard prompt={mockPrompt} />);
    expect(screen.getByText('☆')).toBeInTheDocument();
  });

  it('shows filled star when favorited', () => {
    const fav = { ...mockPrompt, is_favorite: 1 };
    renderWithProviders(<PromptCard prompt={fav} />);
    expect(screen.getByText('★')).toBeInTheDocument();
  });
});
```

- [ ] **Step 4: Create client/src/__tests__/TagComboInput.test.tsx**

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TagComboInput from '../components/TagComboInput';

function renderWithQuery(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

describe('TagComboInput', () => {
  it('renders with placeholder when empty', () => {
    const onChange = vi.fn();
    renderWithQuery(<TagComboInput value={[]} onChange={onChange} />);
    expect(screen.getByPlaceholderText('Add tags...')).toBeInTheDocument();
  });

  it('renders existing tags as pills', () => {
    const onChange = vi.fn();
    renderWithQuery(<TagComboInput value={['python', 'debug']} onChange={onChange} />);
    expect(screen.getByText('python')).toBeInTheDocument();
    expect(screen.getByText('debug')).toBeInTheDocument();
  });

  it('adds a tag on Enter', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithQuery(<TagComboInput value={[]} onChange={onChange} />);
    const input = screen.getByPlaceholderText('Add tags...');
    await user.type(input, 'newtag{Enter}');
    expect(onChange).toHaveBeenCalledWith(['newtag']);
  });

  it('removes a tag when x is clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithQuery(<TagComboInput value={['python', 'debug']} onChange={onChange} />);
    const removeButtons = screen.getAllByText('×');
    await user.click(removeButtons[0]);
    expect(onChange).toHaveBeenCalledWith(['debug']);
  });
});
```

- [ ] **Step 5: Run all tests (backend + frontend)**

```bash
npx vitest run
```
Expected: All pass.

- [ ] **Step 6: Commit**

```bash
git add vitest.config.ts client/src/__tests__/
git commit -m "test: add frontend component tests for PromptCard and TagComboInput"
```

---

### Task 23: Run all tests and final verification

- [ ] **Step 1: Run all tests (backend + frontend)**

```bash
npx vitest run
```
Expected: All tests pass.

- [ ] **Step 2: Manual smoke test**

```bash
npm run dev
```
Verify all features:
- [ ] Cards render with seed data
- [ ] Search filters prompts
- [ ] Category filter works
- [ ] Tag filter works
- [ ] Favorites toggle works
- [ ] Grid/list view toggle works
- [ ] Sort options work
- [ ] Click card → slide-out view mode
- [ ] Edit prompt → save → view updates
- [ ] Create new prompt → appears in grid
- [ ] Delete prompt with confirmation
- [ ] Copy to clipboard shows toast
- [ ] Export downloads JSON
- [ ] Import loads prompts
- [ ] Responsive: slide-out goes full-width on narrow viewport

- [ ] **Step 3: Final commit and push**

```bash
git add -A
git commit -m "chore: final verification — all features working"
git push
```
