import { useUpdatePrompt } from '../hooks/usePrompts';
import { useAppContext } from '../context/AppContext';
import TagBadge from './TagBadge';
import type { Prompt } from '../types';

export default function PromptCard({ prompt }: { prompt: Prompt }) {
  const { openSlideOut } = useAppContext();
  const updatePrompt = useUpdatePrompt();

  const toggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    updatePrompt.mutate({ id: prompt.id, is_favorite: prompt.is_favorite ? 0 : 1 });
  };

  return (
    <div
      onClick={() => openSlideOut('view', prompt.id)}
      className="border border-slate-200 rounded-xl p-4 bg-white cursor-pointer hover:shadow-md transition-shadow"
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-semibold text-sm text-slate-800 truncate pr-2">{prompt.title}</h4>
        <button onClick={toggleFavorite} className="text-base shrink-0">
          {prompt.is_favorite ? (
            <span className="text-amber-400">★</span>
          ) : (
            <span className="text-slate-300 hover:text-amber-400">☆</span>
          )}
        </button>
      </div>

      {prompt.category && (
        <div className="mb-2">
          <span
            className="px-2 py-0.5 rounded text-[10px] font-medium"
            style={{
              backgroundColor: prompt.category.color + '20',
              color: prompt.category.color,
            }}
          >
            {prompt.category.name}
          </span>
        </div>
      )}

      <p className="text-xs text-slate-500 leading-relaxed mb-2.5 line-clamp-2">
        {prompt.content}
      </p>

      {prompt.tags && prompt.tags.length > 0 && (
        <div className="flex gap-1 flex-wrap">
          {prompt.tags.map((tag) => (
            <TagBadge key={tag.id} name={tag.name} />
          ))}
        </div>
      )}
    </div>
  );
}
