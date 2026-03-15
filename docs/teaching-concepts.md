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

---

## Task 8: Import/Export API (`server/routes/importExport.ts`)

### 1. Portable Data Formats (IDs vs Names)

The export endpoint converts internal database IDs into human-readable names. Instead of `category_id: 2`, the JSON says `category: "Coding"`. This makes the export file **database-independent** — you could import it into a completely different database and it would still work, because the import endpoint looks up (or creates) categories by name.

### 2. Duplicate Detection on Import

The import endpoint checks `SELECT id FROM prompts WHERE title = ?` before inserting. If a match exists, it increments `skipped` and moves on. This is a simple deduplication strategy — it means you can safely import the same file twice without creating duplicates. The tradeoff: if you intentionally want two prompts with the same title, you'd need to rename one first.

### 3. Auto-Creating Categories on Import

When importing a prompt with `category: "Custom Category"`, the import checks if that category exists. If not, it creates one with a default gray color (`#94a3b8`). This makes imports self-contained — the JSON file doesn't need to include a separate categories section.

### 4. INSERT OR IGNORE for Junction Tables

Tag associations use `INSERT OR IGNORE INTO prompt_tags` instead of plain `INSERT`. Since `(prompt_id, tag_id)` is a primary key, a duplicate insert would normally throw an error. `OR IGNORE` silently skips duplicates. This is a defensive pattern that's useful when you can't guarantee uniqueness in your input data.

### 5. Transactional Batch Operations

The entire import is wrapped in `db.transaction()`. If importing 100 prompts and #50 fails, all 100 are rolled back — you won't end up with a half-imported dataset. Transactions also dramatically improve SQLite write performance for batch inserts (each individual insert would otherwise trigger a disk sync).

---

## Task 9: Seed Example Prompts (`server/db.ts`)

### 1. Seed Data vs Test Isolation

Seed data is great for production (users see example content on first run), but it breaks tests that assume an empty database. The fix: add an options parameter `{ seed?: boolean }` that defaults to `true` for production but lets tests pass `{ seed: false }`. This is a common pattern — **production defaults should be convenient, but test code needs control**.

### 2. Prepared Statements Outside Loops

Instead of calling `db.prepare('INSERT ...')` inside each loop iteration (which re-parses the SQL every time), we prepare statements once before the loop and reuse them. SQLite compiles SQL into bytecode — preparing once and running many times avoids redundant compilation. This is a micro-optimization that becomes significant with batch operations.

### 3. Options Object Pattern for Function Parameters

`createDatabase(dbPath?, { seed? })` uses the "options object" pattern: required/common params come first as positional args, optional config goes in a destructured object with defaults. This is more readable than positional booleans (what does `createDatabase(':memory:', false)` mean?) and extensible — you can add more options later without changing existing call sites.

---

## Task 11: API Client (`client/src/api/`)

### 1. API Client Pattern

Instead of calling `fetch('/api/prompts')` directly in every React component, we centralize all HTTP calls in dedicated files (`api/prompts.ts`, `api/categories.ts`, `api/tags.ts`). Benefits: if the API URL changes, you fix one file. If you need auth headers, add them in one place. Components only know "call `fetchPrompts()`", not how HTTP works.

### 2. Re-exporting Types

`client/src/types.ts` doesn't define types — it re-exports them from `shared/types.ts` with `export type { ... } from '...'`. This creates a clean import boundary: frontend code imports from `../types`, not `../../../shared/types`. If the shared types move or change structure, only this one re-export file needs updating.

### 3. URLSearchParams for Query Strings

Instead of manually building `?q=python&category=2`, we use the built-in `URLSearchParams` API. It handles encoding special characters (spaces, ampersands) correctly and only includes params that are actually set — no manual `if` chains to build the string.

---

## Task 12: React Query Hooks & App Context

### 1. Server State vs UI State

This app splits state into two categories managed by different tools:
- **Server state** (React Query) — data from the API: prompts, categories, tags. Needs fetching, caching, re-fetching, and error handling.
- **UI state** (React Context) — purely local: which category is selected, search query, view mode. Never sent to the server.

This separation prevents the common mistake of storing server data in `useState` and manually keeping it in sync.

### 2. Query Keys and Cache Invalidation

React Query caches data by a `queryKey` like `['prompts', { category: 2 }]`. When a mutation succeeds (e.g., creating a prompt), we call `invalidateQueries({ queryKey: ['prompts'] })` — this tells React Query "all queries starting with 'prompts' are stale, re-fetch them." The UI updates automatically without manually updating arrays in state.

### 3. The `enabled` Option

`usePrompt(id)` passes `enabled: !!id` — this tells React Query "don't run this query if `id` is undefined." This is how you handle conditional fetching: the hook exists and is always called (React rules of hooks), but the fetch only fires when there's actually an ID to look up.

### 4. Provider Pattern

The app wraps everything in nested providers: `QueryClientProvider > AppProvider > components`. This is the **provider pattern** — it makes data available to any component in the tree without passing props through intermediaries. `useAppContext()` throws an error if called outside the provider, which catches wiring bugs early.

### 5. Context with Multiple `useState` Calls

`AppContext` manages 7+ pieces of state with individual `useState` calls rather than a single `useReducer`. This is fine for simple state where each piece changes independently. If the state transitions became complex (e.g., "selecting a category should also clear the search"), `useReducer` would be better — but here, simplicity wins.

---

## Task 13: Sidebar Component (`client/src/components/Sidebar.tsx`)

### 1. Conditional Tailwind Classes with Ternaries

Tailwind has no built-in "active" or "selected" variant. Instead, you use JavaScript ternaries to swap class strings: `selectedCategory === cat.id ? 'bg-indigo-100 text-indigo-800' : 'hover:bg-slate-100'`. The selected state gets highlight colors; the unselected state gets a subtle hover. This pattern repeats throughout the app.

### 2. Inline `style` for Dynamic Values

Category colors come from the database, so they can't be Tailwind classes (Tailwind generates classes at build time, not runtime). The colored dots use `style={{ backgroundColor: cat.color }}` instead. Rule of thumb: use Tailwind for fixed design tokens, inline styles for truly dynamic values.

### 3. Toggle Selection Pattern

Categories toggle: clicking the already-selected category deselects it (`cat.id === selectedCategory ? null : cat.id`). Tags use array add/remove. These are common UI patterns — single-select toggle vs multi-select toggle.

---

## Task 14: TopBar Component (`client/src/components/TopBar.tsx`)

### 1. Debouncing User Input

Typing in the search box updates `localSearch` instantly (responsive UI), but the actual API search (`setSearchQuery`) only fires after 300ms of inactivity. The `useEffect` cleanup function (`return () => clearTimeout(timer)`) cancels pending timers when the input changes. Without debouncing, every keystroke would trigger a network request — wasteful and potentially causing UI flicker as results flash in and out.

### 2. Local State Synced to Global State

The search input keeps its own `useState` (`localSearch`) separate from the global `searchQuery` in AppContext. This is a common pattern when you need immediate UI responsiveness but delayed side effects. The local state updates on every keystroke (so the input feels snappy), while the global state only updates after debouncing (so the API isn't hammered).

### 3. Flexbox Layout Composition

The App layout uses nested flexbox: the outer `flex` puts Sidebar and content side-by-side, the inner `flex-col` stacks TopBar and main content vertically. `flex-1` makes elements fill remaining space. `overflow-y-auto` on `<main>` means only the content area scrolls — the sidebar and top bar stay fixed. This is the standard "dashboard layout" pattern.

---

## Task 15: PromptCard & PromptGrid (`client/src/components/`)

### 1. Event Propagation Control (`stopPropagation`)

The whole card is clickable (opens detail view), but the favorite star button lives inside the card. Without `e.stopPropagation()`, clicking the star would also trigger the card's `onClick`. `stopPropagation` stops the event from "bubbling up" to parent elements — a fundamental DOM concept you'll use whenever interactive elements are nested.

### 2. CSS `line-clamp` for Text Truncation

`line-clamp-2` limits the content preview to exactly 2 lines with an ellipsis. Under the hood, it uses `-webkit-line-clamp` with `overflow: hidden`. This is much cleaner than JavaScript-based truncation and handles variable-width text correctly.

### 3. Hex Color Opacity Trick

`prompt.category.color + '20'` appends `20` to a hex color like `#3b82f6`, making it `#3b82f620`. In 8-digit hex, the last two digits are opacity (00=transparent, FF=opaque). `20` is about 12.5% opacity — creating a subtle tinted background from any color without needing rgba() conversion.

### 4. Responsive CSS Grid with `auto-fill` and `minmax`

`grid-cols-[repeat(auto-fill,minmax(280px,1fr))]` is a powerful one-liner: create as many columns as fit, each at least 280px wide, growing equally to fill space. On a wide screen you get 4 columns; on a narrow screen, 1. No media queries needed — the grid adapts automatically.

### 5. Conditional Object Spread for Filters

`...(searchQuery && { q: searchQuery })` only adds the `q` property to the filters object when `searchQuery` is truthy. This is cleaner than building the object with `if` statements and avoids sending empty filter params to the API.

---

## Task 16: TagComboInput (`client/src/components/TagComboInput.tsx`)

### 1. `useRef` for Imperative DOM Access

React is declarative (you describe what the UI should look like), but sometimes you need to imperatively tell the browser to do something — like focus an input. `useRef<HTMLInputElement>(null)` creates a stable reference to the DOM element. After adding a tag, `inputRef.current?.focus()` puts the cursor back in the input. Without `useRef`, there's no way to call `.focus()`.

### 2. Focus/Blur Timing with Dropdowns

This is a classic UI challenge: clicking a dropdown item triggers `onBlur` on the input (hiding the dropdown) *before* `onClick` on the button fires. Two techniques solve this: (1) `onBlur` uses `setTimeout(fn, 200)` to delay hiding, giving the click time to fire. (2) Dropdown buttons use `onMouseDown` with `e.preventDefault()` to prevent the blur from happening at all. Both are needed for reliable behavior.

### 3. Controlled Component Pattern

The parent owns the data via `value`/`onChange` props — TagComboInput doesn't store the tag list internally. This makes the component reusable: the parent decides what happens when tags change (e.g., updating form state). The component only manages its own transient UI state (the text input and dropdown visibility).

---

## Task 17: PromptForm (`client/src/components/PromptForm.tsx`)

### 1. Dual-Mode Forms (Create vs Edit)

One component handles both creating and editing. When `prompt` is passed, `useEffect` populates the fields (edit mode). When it's null, fields start empty (create mode). The submit button text adapts: `prompt ? 'Save Changes' : 'Create Prompt'`. This avoids duplicating form UI for two nearly identical use cases.

### 2. `e.preventDefault()` on Form Submit

Browsers default to submitting forms via HTTP (full page reload). `e.preventDefault()` stops this, letting us handle submission in JavaScript with `fetch()`. This is required in every SPA form — without it, your React app would reload and lose all state.

### 3. `type="button"` vs Default `type="submit"`

Buttons inside a `<form>` default to `type="submit"`. The Cancel button uses `type="button"` to prevent accidentally submitting the form when the user wants to cancel. A subtle but important detail that causes real bugs if missed.

---

## Task 18: PromptView (`client/src/components/PromptView.tsx`)

### 1. Clipboard API (`navigator.clipboard`)

`navigator.clipboard.writeText()` is the modern way to copy text. It returns a Promise (can fail if the tab isn't focused or permissions are denied), so wrap in try/catch and show feedback with toast notifications. The old `document.execCommand('copy')` approach is deprecated.

### 2. `whitespace-pre-wrap` for Multi-Line Content

By default, HTML collapses all whitespace (newlines, tabs, multiple spaces) into single spaces. `whitespace-pre-wrap` preserves line breaks and whitespace while still wrapping long lines. Essential for displaying prompt content that has intentional formatting.

### 3. Callback Props for Separation of Concerns

PromptView doesn't handle mutations (edit, delete). It receives `onEdit` and `onDelete` callbacks and just calls them when the user acts. The parent component (PromptSlideOut, coming next) handles the actual API calls. This keeps PromptView a pure display component — easier to test and reason about.
