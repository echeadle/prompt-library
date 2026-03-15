We're building the AI Prompt Library app. All docs are in docs/ and the
implementation plans are in docs/superpowers/plans/.

Completed so far:
- All original 23 tasks DONE (project scaffolding, shared types, database, Express
  server, categories/tags/prompts CRUD routes, import/export routes, seed data,
  Tailwind setup, API client, React Query hooks, AppContext, Sidebar, TopBar,
  PromptCard/PromptGrid, TagComboInput, PromptForm, PromptView, PromptSlideOut,
  import/export UI, backend tests, frontend tests, final verification)
- AI Assistant feature DONE (20 tasks on feat/ai-assistant branch):
  - Settings table + API routes (GET/PUT provider, model, API key)
  - Anthropic + OpenAI streaming provider adapters (direct fetch, no SDK)
  - Chat SSE endpoint with system prompt builder (generate + review modes)
  - AI API client with fetch+ReadableStream SSE parsing
  - useAIChat hook with streaming, abort, reset
  - AppContext extended with AI modal state + prefill support
  - PromptForm/SlideOut updated for prefill data flow
  - AIMessage, AIChat, AISettingsModal, AIModal components
  - TopBar AI button, PromptView "Review with AI" button, Ctrl+Shift+A shortcut
- 56 tests passing (40 backend + 16 frontend)
- Production build working (99 modules)
- All committed to git (feat/ai-assistant branch, not yet merged to main)

Next steps could be:
- Merge feat/ai-assistant branch to main
- Add "Test connection" button to AI settings (deferred from v1)
- Push to remote
- UI polish or additional features

I'm learning as we go — please explain concepts step by step before writing code.
