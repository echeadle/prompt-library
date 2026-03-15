import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAppContext } from '../context/AppContext';
import { exportPrompts, importPrompts } from '../api/prompts';
import toast from 'react-hot-toast';

export default function TopBar() {
  const {
    searchQuery, setSearchQuery,
    selectedCategory,
    favoritesOnly,
    viewMode, setViewMode,
    sortField, setSortField,
    sortOrder, setSortOrder,
    openSlideOut,
  } = useAppContext();
  const queryClient = useQueryClient();

  const [localSearch, setLocalSearch] = useState(searchQuery);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setSearchQuery(localSearch), 300);
    return () => clearTimeout(timer);
  }, [localSearch, setSearchQuery]);

  const handleExport = async () => {
    try {
      const data = await exportPrompts({
        ...(searchQuery && { q: searchQuery }),
        ...(selectedCategory && { category: selectedCategory }),
        ...(favoritesOnly && { favorite: true }),
      });
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'prompts-export.json';
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${data.prompts.length} prompts`);
    } catch {
      toast.error('Export failed');
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        const result = await importPrompts(data);
        toast.success(`Imported ${result.imported}, skipped ${result.skipped}`);
        queryClient.invalidateQueries({ queryKey: ['prompts'] });
        queryClient.invalidateQueries({ queryKey: ['categories'] });
        queryClient.invalidateQueries({ queryKey: ['tags'] });
      } catch {
        toast.error('Import failed — check file format');
      }
    };
    input.click();
  };

  return (
    <div className="px-5 py-3 border-b border-slate-200 flex items-center gap-3">
      {/* Search */}
      <div className="flex-1 relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
        <input
          type="text"
          placeholder="Search prompts..."
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300"
        />
      </div>

      {/* View Toggle */}
      <div className="flex gap-0.5 bg-slate-100 rounded-md p-0.5">
        <button
          onClick={() => setViewMode('grid')}
          className={`px-2 py-1 rounded text-xs ${viewMode === 'grid' ? 'bg-white shadow-sm font-medium' : 'text-slate-500'}`}
        >
          Grid
        </button>
        <button
          onClick={() => setViewMode('list')}
          className={`px-2 py-1 rounded text-xs ${viewMode === 'list' ? 'bg-white shadow-sm font-medium' : 'text-slate-500'}`}
        >
          List
        </button>
      </div>

      {/* Sort */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-slate-400">Sort:</span>
        <select
          value={sortField}
          onChange={(e) => setSortField(e.target.value as any)}
          className="text-xs border border-slate-200 rounded-md px-2 py-1 bg-white"
        >
          <option value="created_at">Newest</option>
          <option value="updated_at">Recently Updated</option>
          <option value="title">Title A-Z</option>
          <option value="is_favorite">Favorites First</option>
        </select>
        <button
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          className="text-xs text-slate-400 hover:text-slate-600 px-1"
        >
          {sortOrder === 'asc' ? '↑' : '↓'}
        </button>
      </div>

      {/* Import/Export */}
      <button onClick={handleExport} className="px-3 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50">
        Export
      </button>
      <button onClick={handleImport} className="px-3 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50">
        Import
      </button>

      {/* New Prompt */}
      <button
        onClick={() => openSlideOut('create')}
        className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
      >
        + New Prompt
      </button>
    </div>
  );
}
