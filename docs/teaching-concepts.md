# Teaching Concepts

Concepts learned while building the Prompt Library, organized by task.

---

## Task 7: Prompts CRUD API (`server/routes/prompts.ts`)

### 1. Many-to-Many Relationships

Prompts and tags are connected through a **junction table** (`prompt_tags`). Neither table "owns" the other — instead, a third table holds pairs of IDs linking them. The `setPromptTags` helper manages this by doing a "delete all, re-insert" pattern, which is simple and works well for small datasets.

### 2. Auto-Creating Related Records

`getOrCreateTags` uses an "upsert-like" pattern: check if the tag exists, create it if not. This means the frontend can just send tag names as strings without worrying about tag IDs. It's a common pattern when you want a frictionless UI but still want normalized data in the database.

### 3. FTS (Full-Text Search) Sync

SQLite's FTS5 is a separate virtual table that mirrors data from the main table. Every time a prompt or its tags change, the FTS index must be updated too. This is a manual sync — you delete the old FTS row and re-insert the new one. The tradeoff: slightly more write complexity for dramatically faster search queries.

### 4. Dynamic Query Building

The GET `/api/prompts` endpoint constructs SQL conditionally based on which filters are present. The `WHERE 1=1` trick lets you append `AND ...` clauses without worrying about whether it's the first condition — every filter just adds `AND p.column = ?`. This avoids messy string logic to handle commas and WHERE placement.

### 5. Database Transactions

Create and update use `db.transaction()` to wrap multiple SQL statements. This ensures the prompt and its tags are always in sync — if any part fails, everything rolls back. Without transactions, you could end up with a prompt that has no tags, or orphaned tag associations.

### 6. COALESCE for Partial Updates

The PUT endpoint uses `COALESCE(?, existing_column)` in the UPDATE statement. This means: "use the new value if provided, otherwise keep the old value." It allows partial updates — you can send just `{ is_favorite: 1 }` without needing to resend the title, content, etc.
