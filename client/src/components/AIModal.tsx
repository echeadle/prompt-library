import { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { usePrompt, usePrompts } from '../hooks/usePrompts';
import { useCategories } from '../hooks/useCategories';
import { useTags } from '../hooks/useTags';
import { useAIChat } from '../hooks/useAIChat';
import { getAISettings } from '../api/ai';
import AIChat from './AIChat';
import AISettingsModal from './AISettingsModal';

export default function AIModal() {
  const { aiModal, closeAIModal, openSlideOut } = useAppContext();
  const [mode, setMode] = useState<'generate' | 'review'>(aiModal.mode);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);

  const { data: categories = [] } = useCategories();
  const { data: tags = [] } = useTags();
  const { data: prompts = [] } = usePrompts();
  const { data: reviewPrompt } = usePrompt(mode === 'review' ? aiModal.promptId : undefined);

  const context = {
    categories: categories.map((c) => c.name),
    tags: tags.map((t) => t.name),
    promptCount: prompts.length,
    ...(mode === 'review' && reviewPrompt
      ? {
          prompt: {
            title: reviewPrompt.title,
            content: reviewPrompt.content,
            category: reviewPrompt.category?.name ?? 'Uncategorized',
          },
        }
      : {}),
  };

  const { messages, isStreaming, error, sendMessage, abort, reset } = useAIChat({
    mode,
    context,
  });

  // Check API key on open
  useEffect(() => {
    if (!aiModal.open) return;
    setMode(aiModal.mode);
    getAISettings().then((s) => setHasApiKey(s.hasApiKey)).catch(() => setHasApiKey(false));
  }, [aiModal.open, aiModal.mode]);

  // Reset chat when mode changes
  useEffect(() => {
    reset();
  }, [mode, reset]);

  const handleClose = useCallback(() => {
    abort();
    closeAIModal();
  }, [abort, closeAIModal]);

  const handleUsePrompt = useCallback((content: string) => {
    handleClose();
    if (mode === 'generate') {
      openSlideOut('create', undefined, { content });
    } else if (mode === 'review' && aiModal.promptId) {
      openSlideOut('edit', aiModal.promptId, { content });
    }
  }, [mode, aiModal.promptId, handleClose, openSlideOut]);

  // Keyboard shortcut to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && aiModal.open) handleClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [aiModal.open, handleClose]);

  if (!aiModal.open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 z-50" onClick={handleClose} />

      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] max-h-[80vh] bg-white rounded-xl shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg">&#x2728;</span>
            <span className="font-semibold text-slate-800">AI Assistant</span>
          </div>

          {/* Mode tabs */}
          <div className="flex gap-1 bg-slate-100 rounded-lg p-0.5">
            <button
              onClick={() => setMode('generate')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                mode === 'generate'
                  ? 'bg-white shadow-sm text-indigo-600'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Generate
            </button>
            <button
              onClick={() => setMode('review')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                mode === 'review'
                  ? 'bg-white shadow-sm text-indigo-600'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Review
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSettingsOpen(true)}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100"
              title="AI Settings"
            >
              &#x2699;
            </button>
            <button
              onClick={handleClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100"
            >
              &#x2715;
            </button>
          </div>
        </div>

        {/* Context banner */}
        <div className="px-4 py-1.5 bg-slate-50 border-b border-slate-200 text-xs text-slate-400">
          {mode === 'review' && reviewPrompt
            ? `Reviewing: "${reviewPrompt.title}"`
            : `Library: ${prompts.length} prompts across ${categories.length} categories`}
        </div>

        {/* Body */}
        <div className="flex-1 min-h-[400px] max-h-[60vh] flex flex-col overflow-hidden">
          {hasApiKey === false ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8">
              <p className="text-slate-500 text-sm text-center">
                No API key configured. Add one in settings to start using the AI assistant.
              </p>
              <button
                onClick={() => setSettingsOpen(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
              >
                Open Settings
              </button>
            </div>
          ) : (
            <AIChat
              messages={messages}
              isStreaming={isStreaming}
              error={error}
              actionLabel={mode === 'review' ? 'Apply Changes' : 'Use This Prompt'}
              onSend={sendMessage}
              onUsePrompt={handleUsePrompt}
            />
          )}
        </div>
      </div>

      {/* Settings sub-modal */}
      <AISettingsModal
        open={settingsOpen}
        onClose={() => {
          setSettingsOpen(false);
          getAISettings().then((s) => setHasApiKey(s.hasApiKey)).catch(() => {});
        }}
      />
    </>
  );
}
