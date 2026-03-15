interface Props {
  role: 'user' | 'assistant';
  content: string;
  actionLabel?: string;
  onUsePrompt?: (content: string) => void;
}

function extractPromptBlock(text: string): string | null {
  const match = text.match(/```prompt\n([\s\S]*?)```/);
  return match ? match[1].trim() : null;
}

export default function AIMessage({ role, content, actionLabel = 'Use This Prompt', onUsePrompt }: Props) {
  const isAssistant = role === 'assistant';
  const promptBlock = isAssistant ? extractPromptBlock(content) : null;

  return (
    <div className={`flex ${isAssistant ? '' : 'justify-end'} mb-3`}>
      <div
        className={`max-w-[85%] rounded-lg px-3.5 py-2.5 text-sm leading-relaxed ${
          isAssistant
            ? 'bg-indigo-50 text-slate-700 border border-indigo-100'
            : 'bg-slate-700 text-white'
        }`}
      >
        <div className="whitespace-pre-wrap">{content}</div>
        {promptBlock && onUsePrompt && (
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => onUsePrompt(promptBlock)}
              className="px-3 py-1 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700"
            >
              {actionLabel}
            </button>
            <button
              onClick={() => navigator.clipboard.writeText(promptBlock)}
              className="px-3 py-1 bg-slate-200 text-slate-600 rounded text-xs hover:bg-slate-300"
            >
              Copy
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export { extractPromptBlock };
