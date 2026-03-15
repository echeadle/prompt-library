import { useCategories } from '../hooks/useCategories';
import { useTags } from '../hooks/useTags';
import { usePrompts } from '../hooks/usePrompts';
import { useAppContext } from '../context/AppContext';

export default function Sidebar() {
  const { data: categories = [] } = useCategories();
  const { data: tags = [] } = useTags();
  const { data: prompts = [] } = usePrompts();
  const {
    selectedCategory, setSelectedCategory,
    selectedTags, setSelectedTags,
    favoritesOnly, setFavoritesOnly,
  } = useAppContext();

  const categoryCount = (catId: number) =>
    prompts.filter((p) => p.category_id === catId).length;

  const toggleTag = (tagId: number) => {
    setSelectedTags(
      selectedTags.includes(tagId)
        ? selectedTags.filter((id) => id !== tagId)
        : [...selectedTags, tagId]
    );
  };

  return (
    <aside className="w-56 min-w-56 bg-slate-50 border-r border-slate-200 p-4 flex flex-col gap-5 overflow-y-auto">
      {/* Categories */}
      <div>
        <h3 className="text-xs font-semibold uppercase text-slate-400 tracking-wide mb-2">
          Categories
        </h3>
        <div className="flex flex-col gap-0.5">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-2.5 py-1.5 rounded-md text-left text-sm flex justify-between ${
              selectedCategory === null ? 'bg-indigo-100 text-indigo-800 font-medium' : 'hover:bg-slate-100'
            }`}
          >
            All Prompts
            <span className={selectedCategory === null ? 'text-indigo-500' : 'text-slate-400'}>
              {prompts.length}
            </span>
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id === selectedCategory ? null : cat.id)}
              className={`px-2.5 py-1.5 rounded-md text-left text-sm flex justify-between ${
                selectedCategory === cat.id ? 'bg-indigo-100 text-indigo-800 font-medium' : 'hover:bg-slate-100'
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                {cat.name}
              </span>
              <span className={selectedCategory === cat.id ? 'text-indigo-500' : 'text-slate-400'}>
                {categoryCount(cat.id)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div>
        <h3 className="text-xs font-semibold uppercase text-slate-400 tracking-wide mb-2">
          Tags
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <button
              key={tag.id}
              onClick={() => toggleTag(tag.id)}
              className={`px-2 py-0.5 rounded-full text-xs border ${
                selectedTags.includes(tag.id)
                  ? 'bg-indigo-100 border-indigo-300 text-indigo-700'
                  : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'
              }`}
            >
              {tag.name}
            </button>
          ))}
        </div>
      </div>

      {/* Favorites */}
      <div>
        <button
          onClick={() => setFavoritesOnly(!favoritesOnly)}
          className={`px-2.5 py-1.5 rounded-md text-left text-sm flex items-center gap-1.5 ${
            favoritesOnly ? 'bg-amber-50 text-amber-700 font-medium' : 'hover:bg-slate-100'
          }`}
        >
          <span className={favoritesOnly ? 'text-amber-500' : 'text-slate-300'}>★</span>
          Favorites
        </button>
      </div>
    </aside>
  );
}
