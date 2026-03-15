import { useState, useEffect } from 'react';
import { useCategories } from '../hooks/useCategories';
import TagComboInput from './TagComboInput';
import type { Prompt } from '../types';

interface Props {
  prompt?: Prompt | null;
  prefill?: { content: string };
  onSubmit: (data: {
    title: string;
    content: string;
    description: string;
    category_id: number;
    tags: string[];
  }) => void;
  onCancel: () => void;
}

export default function PromptForm({ prompt, prefill, onSubmit, onCancel }: Props) {
  const { data: categories = [] } = useCategories();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState(1);
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    if (prompt) {
      setTitle(prompt.title);
      setContent(prompt.content);
      setDescription(prompt.description ?? '');
      setCategoryId(prompt.category_id);
      setTags(prompt.tags?.map((t) => t.name) ?? []);
    } else if (prefill) {
      setContent(prefill.content);
    }
  }, [prompt, prefill]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    onSubmit({
      title: title.trim(),
      content: content.trim(),
      description: description.trim(),
      category_id: categoryId,
      tags,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5">
      <div>
        <label className="text-xs font-semibold uppercase text-slate-400 tracking-wide mb-1 block">
          Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
          placeholder="Give your prompt a name"
        />
      </div>

      <div>
        <label className="text-xs font-semibold uppercase text-slate-400 tracking-wide mb-1 block">
          Category
        </label>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(Number(e.target.value))}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
        >
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-xs font-semibold uppercase text-slate-400 tracking-wide mb-1 block">
          Description <span className="text-slate-300">(optional)</span>
        </label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
          placeholder="What is this prompt for?"
        />
      </div>

      <div>
        <label className="text-xs font-semibold uppercase text-slate-400 tracking-wide mb-1 block">
          Prompt Content
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          rows={8}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 resize-y"
          placeholder="Write your prompt here..."
        />
      </div>

      <div>
        <label className="text-xs font-semibold uppercase text-slate-400 tracking-wide mb-1 block">
          Tags
        </label>
        <TagComboInput value={tags} onChange={setTags} />
      </div>

      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
        >
          {prompt ? 'Save Changes' : 'Create Prompt'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
