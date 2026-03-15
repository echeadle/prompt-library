import { usePrompts } from '../hooks/usePrompts';
import { useAppContext } from '../context/AppContext';
import PromptCard from './PromptCard';
import type { PromptFilters } from '../types';

export default function PromptGrid() {
  const {
    selectedCategory, selectedTags, searchQuery,
    favoritesOnly, sortField, sortOrder, viewMode,
  } = useAppContext();

  const filters: PromptFilters = {
    ...(searchQuery && { q: searchQuery }),
    ...(selectedCategory && { category: selectedCategory }),
    ...(selectedTags.length === 1 && { tag: selectedTags[0] }),
    ...(favoritesOnly && { favorite: true }),
    sort: sortField,
    order: sortOrder,
  };

  const { data: prompts = [], isLoading } = usePrompts(filters);

  // Client-side filter for multiple tags (API supports one tag filter)
  const filtered = selectedTags.length > 1
    ? prompts.filter((p) =>
        selectedTags.every((tagId) => p.tags?.some((t) => t.id === tagId))
      )
    : prompts;

  if (isLoading) {
    return <div className="p-5 text-slate-400 text-sm">Loading...</div>;
  }

  if (filtered.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
        No prompts found. Create one to get started!
      </div>
    );
  }

  if (viewMode === 'list') {
    return (
      <div className="p-5 flex flex-col gap-2">
        {filtered.map((prompt) => (
          <PromptCard key={prompt.id} prompt={prompt} />
        ))}
      </div>
    );
  }

  return (
    <div className="p-5 grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
      {filtered.map((prompt) => (
        <PromptCard key={prompt.id} prompt={prompt} />
      ))}
    </div>
  );
}
