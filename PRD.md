# AI Prompt Library — Product Requirements Document

## Overview

A local web application for saving, organizing, tagging, and searching your best AI prompts. Runs entirely on your machine with no external dependencies or accounts required.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + TypeScript + Vite |
| Styling | Tailwind CSS |
| State/Data | SQLite via better-sqlite3 |
| Client State | TanStack React Query + React Context |
| Backend | Node.js + Express |
| Search | Full-text search (SQLite FTS5) |

**Why this stack:**
- SQLite = zero setup, single-file database, portable backups
- React + Vite = fast dev experience, modern tooling
- React Query = handles server state (API calls, caching, refetching); React Context = handles UI state (active filters, view mode)
- Express = lightweight API layer
- All runs locally with `npm run dev`

---

## Core Features

### 1. Prompt Management (CRUD)
- **Create** a prompt with: title, content (plain text), description (optional), category, tags
- **View** prompt in a clean, readable layout with copy-to-clipboard
- **Edit** any prompt field inline
- **Delete** with confirmation
- Prompt content is **plain text only** — no markdown rendering or rich text editing in v1

### 2. Organization
- **Categories** — each prompt belongs to one category. App ships with seeded defaults (Coding, Writing, Analysis, Image Gen, etc.) and users can create, rename, and delete categories freely
- **Category deletion** — deleting a category moves its prompts to a default "Uncategorized" category (no data loss)
- **Tags** — each prompt can have multiple tags (e.g., "python", "creative", "few-shot"). Tag input uses a **combo input with autocomplete** — type to search existing tags, press Enter/comma to create new ones. Prevents duplicates while keeping creation fast
- **Favorites** — star/unstar prompts for quick access

### 3. Search & Filter
- **Full-text search** across title, content, description, and tags
- **Filter by** category, tag, or favorites — category + tag filters combine with **AND logic** (selecting "Coding" + "python" shows only coding prompts tagged python)
- **Sort by** date created, date modified, title (A-Z), or favorites-first

### 4. UI Layout
- **Design style** — clean minimal aesthetic: light background, subtle borders, generous whitespace, muted accent color (inspired by Notion/Linear)
- **Sidebar** — category list + tag cloud for quick filtering
- **Main area** — prompt cards in a grid or list view (toggle). Each card shows **title, category badge, tags, and a 2-3 line content preview**
- **Top bar** — search input, "New Prompt" button, view toggle
- **Detail panel** — click a prompt card to open a **slide-out panel** from the right. List remains visible for context. The same slide-out is reused for creating new prompts ("New Prompt" button opens it in create mode)

### 5. Import / Export
- **Export** all prompts (or filtered set) as JSON
- **Import** prompts from a JSON file — **merge/append only** (imported prompts are added alongside existing ones, with duplicate detection by title to avoid exact copies). Never deletes existing data
- Enables backup and sharing between machines

---

## Data Model

### Prompt
| Field | Type | Notes |
|-------|------|-------|
| id | INTEGER | Primary key, auto-increment |
| title | TEXT | Required |
| content | TEXT | Required — the actual prompt |
| description | TEXT | Optional — what it's for |
| category_id | INTEGER | FK to categories |
| is_favorite | BOOLEAN | Default false |
| created_at | DATETIME | Auto-set |
| updated_at | DATETIME | Auto-set on change |

### Category
| Field | Type | Notes |
|-------|------|-------|
| id | INTEGER | Primary key |
| name | TEXT | Unique, required |
| color | TEXT | Hex color for UI badge |

### Tag
| Field | Type | Notes |
|-------|------|-------|
| id | INTEGER | Primary key |
| name | TEXT | Unique, required |

### PromptTag (join table)
| Field | Type |
|-------|------|
| prompt_id | INTEGER FK |
| tag_id | INTEGER FK |

---

## API Endpoints

| Method | Route | Action |
|--------|-------|--------|
| GET | /api/prompts | List all (with query/filter params) |
| GET | /api/prompts/:id | Get one prompt |
| POST | /api/prompts | Create prompt |
| PUT | /api/prompts/:id | Update prompt |
| DELETE | /api/prompts/:id | Delete prompt |
| GET | /api/categories | List categories |
| POST | /api/categories | Create category |
| PUT | /api/categories/:id | Update category |
| DELETE | /api/categories/:id | Delete category |
| GET | /api/tags | List tags |
| POST | /api/tags | Create tag |
| DELETE | /api/tags/:id | Delete tag |
| GET | /api/export | Export prompts as JSON |
| POST | /api/import | Import prompts from JSON |

**Query params for GET /api/prompts:**
- `q` — full-text search
- `category` — filter by category id
- `tag` — filter by tag id
- `favorite` — filter favorites only
- `sort` — created_at | updated_at | title
- `order` — asc | desc

---

## Project Structure

```
prompt-library/
├── server/
│   ├── index.ts          # Express app entry
│   ├── db.ts             # SQLite connection + migrations
│   ├── routes/
│   │   ├── prompts.ts
│   │   ├── categories.ts
│   │   ├── tags.ts
│   │   └── importExport.ts
│   └── types.ts
├── client/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── api/           # API client functions
│   │   ├── components/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── TopBar.tsx
│   │   │   ├── PromptCard.tsx
│   │   │   ├── PromptSlideOut.tsx   # Shared slide-out for view/edit/create
│   │   │   ├── PromptForm.tsx
│   │   │   ├── TagBadge.tsx
│   │   │   └── TagComboInput.tsx  # Autocomplete tag selector
│   │   ├── hooks/          # Custom React hooks
│   │   └── types.ts
│   └── index.html
├── data/                   # SQLite DB file lives here
├── package.json
├── tsconfig.json
├── vite.config.ts
└── PRD.md
```

---

## Implementation Plan

### Phase 1 — Foundation
1. Initialize project (package.json, TypeScript, Vite config)
2. Set up SQLite database with schema + migrations
3. Build Express API with all CRUD endpoints
4. Verify API works with manual testing

### Phase 2 — Frontend Core
5. Scaffold React app with Tailwind
6. Build layout: sidebar, top bar, main content area
7. Build prompt list view (cards grid + list toggle)
8. Build prompt create/edit form (slide-out panel)
9. Wire up API calls

### Phase 3 — Search & Organization
10. Implement full-text search (FTS5)
11. Category and tag filtering in sidebar
12. Favorites toggle
13. Sort controls

### Phase 4 — Polish
14. Copy-to-clipboard on prompts
15. Import/export functionality
16. Responsive design tweaks
17. Seed some example prompts for first run

---

## Non-Goals (for v1)
- No user authentication (local app, single user)
- No cloud sync
- No AI-powered features (auto-tagging, prompt suggestions)
- No version history on prompts
- No markdown rendering in prompt content

---

## How to Run

```bash
npm install
npm run dev        # Starts both Express API + Vite dev server
```

Database is created automatically on first run at `data/prompts.db`.
