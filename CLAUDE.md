# Prompt Library

Local web app for saving, organizing, and searching AI prompts.

## Docs

- **PRD + technical decisions**: `docs/PRD.md`, `docs/DECISIONS.md`
- Read these before starting any implementation work

## Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: SQLite via better-sqlite3 (FTS5 for search)
- **Client state**: TanStack React Query (server state) + React Context (UI state)

## Project Structure

```
server/          # Express API
client/src/      # React app
data/            # SQLite DB (gitignored)
docs/            # PRD, decisions, reference docs
```

## Commands

```bash
npm install      # Install dependencies
npm run dev      # Start Express API + Vite dev server
```

## Conventions

- TypeScript strict mode
- API routes under `/api/`
- Database auto-creates on first run at `data/prompts.db`
- Plain text prompt content (no markdown rendering)
- Do not commit `data/*.db` or `node_modules/`
