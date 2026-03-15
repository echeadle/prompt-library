# Prompt Library

A local web app for saving, organizing, and searching AI prompts — with a built-in AI assistant to help you create and improve them.

## Getting Started

```bash
# Install dependencies
npm install

# Start the app (API + frontend dev server)
npm run dev
```

Open **http://localhost:5173** in your browser. The database creates itself automatically on first run.

### Production Build

```bash
npm run build
npm start
```

### Running Tests

```bash
npm test
```

## Features

### Prompt Management
- Create, edit, and delete prompts with title, content, description, category, and tags
- Copy prompt content to clipboard with one click
- Mark prompts as favorites for quick access

### Organization
- **Categories** — Organize prompts into categories (Coding, Writing, Analysis, Image Gen, etc.)
- **Tags** — Add multiple tags per prompt with autocomplete and create-on-the-fly support
- **Favorites** — Star/unstar prompts and filter to show only favorites

### Search and Filter
- Full-text search across titles, content, descriptions, and tags (powered by SQLite FTS5)
- Filter by category, tag, or favorites
- Sort by date created, date updated, title, or favorites
- Grid and list view modes

### Import / Export
- Export prompts as JSON (respects current filters)
- Import prompts from JSON with duplicate detection (merge mode, never deletes)

### AI Assistant
- **Generate mode** — Describe what you need and the AI drafts a prompt for you
- **Review mode** — Get feedback and improvements on an existing prompt
- Conversational chat interface with streaming responses
- Supports **Anthropic (Claude)** and **OpenAI (GPT)** — switch providers in settings
- "Use This Prompt" / "Apply Changes" buttons auto-fill the create/edit form
- Library-aware — the AI knows your categories, tags, and prompt count for better suggestions
- Access via the top bar button, the "Review with AI" button on any prompt, or **Ctrl+Shift+A**

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, TanStack React Query
- **Backend**: Node.js, Express
- **Database**: SQLite via better-sqlite3 (FTS5 for search)
- **AI**: Direct API calls to Anthropic/OpenAI (no SDK dependencies)

## Project Structure

```
server/          # Express API + AI provider adapters
client/src/      # React app (components, hooks, context, API clients)
shared/          # TypeScript types shared between server and client
data/            # SQLite database (auto-created, gitignored)
docs/            # PRD, technical decisions, specs, implementation plans
```
