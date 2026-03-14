# AI Prompt Library — Technical Decisions

## Summary

| Decision | Choice |
|----------|--------|
| Detail/edit view | Slide-out panel |
| Content format | Plain text only |
| Categories | Seed defaults + user can add |
| Tag input | Combo input with autocomplete |
| Filter logic | AND (category + tag) |
| Design style | Clean minimal |
| Card preview | Title + 2-3 line snippet |
| Category delete policy | Move prompts to "Uncategorized" |
| Import mode | Merge/append only |
| Create prompt flow | Slide-out form (reuse detail panel) |
| State management | React Query + Context |

---

## Detail/Edit View — Slide-out Panel

Panel slides in from the right while the prompt list remains visible. Preserves browsing context, supports quick copy-and-move-on workflows, and degrades to full-width on small screens. The same slide-out component is reused for both viewing/editing existing prompts and creating new ones.

## Content Format — Plain Text

Simple textarea, no markdown rendering or rich text editing in v1. Keeps implementation lean and aligns with the PRD's non-goals. Can be upgraded to markdown with preview in a future version.

## Categories — Seed Defaults + User Can Add

Ship with sensible defaults (Coding, Writing, Analysis, Image Gen, etc.) so the app is usable immediately. Users can create, rename, and delete categories freely. Deleting a category moves its prompts to a default "Uncategorized" category.

## Tag Input — Combo Input with Autocomplete

Type-ahead search of existing tags with a dropdown. Press Enter or comma to create a new tag if no match exists. Prevents duplicates while keeping creation fast. Similar to GitHub issue label selection.

## Filter Logic — AND

Selecting a category and a tag shows only prompts matching both. More precise for narrowing down a large library.

## Design Style — Clean Minimal

Light background, subtle borders, generous whitespace, muted accent color. Professional and easy to scan. Inspired by tools like Notion and Linear.

## Card Preview — Title + 2-3 Line Snippet

Each card shows the title, category badge, tags, and a truncated snippet of prompt content. Enough to identify the prompt without opening the detail panel.

## Category Delete Policy — Move to "Uncategorized"

When a category is deleted, all its prompts are reassigned to a default "Uncategorized" category. No data is lost.

## Import Mode — Merge/Append Only

Imported prompts are added alongside existing ones. Duplicate detection by title to avoid exact copies. Never deletes existing data.

## State Management — React Query + Context

TanStack React Query for server state (API calls, caching, refetching). React Context for UI state (active filters, view mode). Clean separation of concerns with minimal boilerplate.
