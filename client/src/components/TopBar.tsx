import { useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext';

export default function TopBar() {
  const {
    searchQuery, setSearchQuery,
    viewMode, setViewMode,
    sortField, setSortField,
    sortOrder, setSortOrder,
    openSlideOut,
  } = useAppContext();

  const [localSearch, setLocalSearch] = useState(searchQuery);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setSearchQuery(localSearch), 300);
    return () => clearTimeout(timer);
  }, [localSearch, setSearchQuery]);

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
