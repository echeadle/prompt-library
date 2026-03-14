# AI Prompt Library — Design Specification

## Overview

A local web application for saving, organizing, tagging, and searching AI prompts. Runs entirely on one machine with no external dependencies or accounts. Single-user, no auth.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + TypeScript + Vite |
| Styling | Tailwind CSS |
| Client State | TanStack React Query (server) + React Context (UI) |
| Backend | Node.js + Express |
| Database | SQLite via better-sqlite3 |
| Search | SQLite FTS5 |
| Error UX | react-hot-toast |
| Dev Runner | concurrently |

## Architecture

Flat monorepo with a single `package.json`. Server and client live in separate directories with shared types.

```
prompt-library/
├── server/              # Express API (runs via tsx)
│   ├── index.ts         # Entry point, middleware, static serving
│   ├── db.ts            # SQLite connection, schema, migrations, seed data
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
│   │   ├── api/              # API client functions (fetch wrappers)
│   │   ├── components/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── TopBar.tsx
│   │   │   ├── PromptCard.tsx
│   │   │   ├── PromptSlideOut.tsx
│   │   │   ├── PromptForm.tsx
│   │   │   ├── PromptView.tsx
│   │   │   ├── TagBadge.tsx
│   │   │   └── TagComboInput.tsx
│   │   ├── hooks/            # React Query hooks + custom hooks
│   │   ├── context/          # AppContext (filters, view mode, slide-out state)
│   │   └── types.ts
│   └── index.html
├── shared/
│   └── types.ts              # Interfaces shared by server + client
├── data/                     # SQLite DB (gitignored)
├── package.json
├── tsconfig.json
├── tsconfig.server.json
└── vite.config.ts
```

### Dev Setup

- `npm run dev` uses `concurrently` to run Express (port 3001) and Vite (port 5173)
- Vite proxies `/api/*` requests to Express
- Express uses `tsx` for TypeScript execution

### Production Build

- `npm run build` compiles the React app to `dist/`
- `npm start` runs Express, which serves the built static files from `dist/` and the API

## Data Model

### Tables

**categories**
| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT |
| name | TEXT | UNIQUE NOT NULL |
| color | TEXT | NOT NULL (hex color) |

**prompts**
| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT |
| title | TEXT | NOT NULL |
| content | TEXT | NOT NULL |
| description | TEXT | |
| category_id | INTEGER | FK → categories(id), NOT NULL, DEFAULT 1 |
| is_favorite | INTEGER | DEFAULT 0 |
| created_at | TEXT | DEFAULT CURRENT_TIMESTAMP |
| updated_at | TEXT | DEFAULT CURRENT_TIMESTAMP |

**tags**
| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT |
| name | TEXT | UNIQUE NOT NULL |

**prompt_tags**
| Column | Type | Constraints |
|--------|------|-------------|
| prompt_id | INTEGER | FK → prompts(id) ON DELETE CASCADE |
| tag_id | INTEGER | FK → tags(id) ON DELETE CASCADE |
| | | PRIMARY KEY (prompt_id, tag_id) |

**prompts_fts** (FTS5 virtual table)
- Indexes: title, content, description, tags (space-separated tag names denormalized into the FTS row)
- Kept in sync via triggers on prompts insert/update/delete
- Tag text is denormalized into FTS on insert/update so full-text search covers tags too

### Seed Data

**Categories** (seeded on first run):
1. Uncategorized (#94a3b8) — protected, cannot be deleted
2. Coding (#3b82f6)
3. Writing (#22c55e)
4. Analysis (#f59e0b)
5. Image Gen (#a855f7)
6. Brainstorming (#ec4899)
7. Research (#14b8a6)
8. Summarization (#f97316)

**Example prompts**: 3-5 seed prompts across different categories for first-run experience.

## API Design

### Endpoints

| Method | Route | Action |
|--------|-------|--------|
| GET | /api/prompts | List prompts (with filters) |
| GET | /api/prompts/:id | Get single prompt with tags |
| POST | /api/prompts | Create prompt (with tags) |
| PUT | /api/prompts/:id | Update prompt (with tags) |
| DELETE | /api/prompts/:id | Delete prompt |
| GET | /api/categories | List all categories |
| POST | /api/categories | Create category |
| PUT | /api/categories/:id | Update category |
| DELETE | /api/categories/:id | Delete category (reassign prompts to Uncategorized) |
| GET | /api/tags | List all tags |
| POST | /api/tags | Create tag |
| DELETE | /api/tags/:id | Delete tag |
| GET | /api/export | Export prompts as JSON (accepts same filter params as GET /api/prompts) |
| POST | /api/import | Import prompts from JSON (merge/append) |

### GET /api/prompts Query Params

| Param | Type | Description |
|-------|------|-------------|
| q | string | Full-text search via FTS5 |
| category | number | Filter by category_id |
| tag | number | Filter by tag_id |
| favorite | boolean | Filter favorites only |
| sort | string | created_at, updated_at, title, is_favorite |
| order | string | asc, desc |

Filters combine with AND logic. FTS query uses `MATCH` against `prompts_fts`.

### Key Behaviors

- **POST /api/prompts**: Accepts `{ title, content, description?, category_id, tags: string[] }`. Creates new tags if they don't exist. Returns the created prompt with tags.
- **PUT /api/prompts/:id**: Same shape. Replaces the prompt's tag set (delete all prompt_tags for this id, re-insert).
- **DELETE /api/categories/:id**: Rejects if id=1 (Uncategorized). Otherwise, updates all prompts with this category_id to 1, then deletes the category.
- **POST /api/import**: Accepts `{ prompts: [...] }`. For each prompt, checks if a prompt with the same title exists — skips if so, inserts if not. Creates missing categories and tags as needed. Returns count of imported vs skipped.

## Frontend Design

### UI Layout

Three-panel layout:
- **Sidebar** (220px, left): Category list with prompt counts, tag cloud, favorites filter
- **Top bar**: Search input (debounced 300ms), grid/list view toggle, sort dropdown, "New Prompt" button
- **Main area**: Responsive card grid (`auto-fill, minmax(280px, 1fr)`) or list view

### Design Style

Clean minimal: light background (#ffffff), subtle borders (#e2e8f0), generous whitespace, indigo accent (#4f46e5). Category badges use distinct colors. Tags are pill-shaped with neutral background.

### Prompt Cards

Each card displays:
- Title (bold, truncated to 1 line)
- Category badge (colored)
- Content preview (2-3 lines, CSS line-clamp)
- Tags (pills)
- Favorite star (toggle on click without opening slide-out)

### Slide-Out Panel

Opens from the right (420px width), list remains visible with dimmed overlay. On small screens (<768px), the panel expands to full width. Three modes sharing the same component:

**View mode**: Read-only display with Edit, Copy, Delete action buttons in header. Delete shows a confirmation dialog before executing. Prompt content in a styled box with its own Copy button (uses `navigator.clipboard.writeText`, shows success toast). Shows description, tags, timestamps.

**Edit mode**: Fields become inputs/textareas. Tag field becomes TagComboInput. Save/Cancel buttons replace action bar.

**Create mode**: Empty form, same layout as edit. Triggered by "New Prompt" button.

### Tag Combo Input

Autocomplete input for tag selection:
- Type to filter existing tags (dropdown appears)
- Press Enter or comma to add the typed value as a new tag
- Tags appear as removable pills above the input
- Case-insensitive matching, stored lowercase

### Component Tree

```
App
├── QueryClientProvider
│   └── AppProvider (context)
│       ├── Sidebar
│       ├── TopBar
│       ├── PromptGrid / PromptList
│       └── PromptSlideOut
│           ├── PromptView
│           └── PromptForm (with TagComboInput)
```

### State Management

**React Query** — server state:
- `usePrompts(filters)` — fetches prompt list, keyed by filter params
- `usePrompt(id)` — fetches single prompt
- `useCategories()` — fetches category list
- `useTags()` — fetches tag list
- Mutation hooks with automatic cache invalidation

**AppContext** — UI state:
- `selectedCategory: number | null`
- `selectedTags: number[]`
- `searchQuery: string`
- `favoritesOnly: boolean`
- `viewMode: 'grid' | 'list'`
- `sortField: 'created_at' | 'updated_at' | 'title' | 'is_favorite'`
- `sortOrder: 'asc' | 'desc'`
- `slideOut: { open: boolean; mode: 'view' | 'edit' | 'create'; promptId?: number }`

### Error Handling

Toast notifications via react-hot-toast:
- Success: "Prompt saved", "Prompt deleted", "Exported N prompts"
- Error: "Failed to save prompt", "Network error", etc.
- Auto-dismiss after 3 seconds

## Testing

**Backend (vitest)**:
- Route handler tests with in-memory SQLite
- CRUD operations, filter/search queries, import/export
- Edge cases: delete category with prompts, duplicate import titles

**Frontend (vitest + React Testing Library)**:
- Component tests: card click opens slide-out, form validation, tag combo input
- Hook tests: React Query integration with mocked API

**No E2E tests in v1.** Manual testing is sufficient for a local single-user app.

## Non-Goals (v1)

- No authentication
- No cloud sync
- No AI features (auto-tagging, suggestions)
- No version history
- No markdown rendering
- No E2E tests
