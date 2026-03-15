import toast from 'react-hot-toast';
import TagBadge from './TagBadge';
import type { Prompt } from '../types';

interface Props {
  prompt: Prompt;
  onEdit: () => void;
  onDelete: () => void;
}

export default function PromptView({ prompt, onEdit, onDelete }: Props) {
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(prompt.content);
      toast.success('Copied to clipboard!');
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleDelete = () => {
    if (window.confirm(`Delete "${prompt.title}"? This cannot be undone.`)) {
      onDelete();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-3 border-b border-slate-200 flex justify-between items-center">
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="px-3 py-1.5 bg-indigo-600 text-white rounded-md text-xs font-medium hover:bg-indigo-700"
          >
            Edit
          </button>
          <button
            onClick={copyToClipboard}
            className="px-3 py-1.5 border border-slate-200 text-indigo-600 rounded-md text-xs hover:bg-slate-50"
          >
            Copy
          </button>
          <button
            onClick={handleDelete}
            className="px-3 py-1.5 border border-slate-200 text-red-500 rounded-md text-xs hover:bg-red-50"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5">
        <h3 className="text-xl font-semibold text-slate-800 mb-1">{prompt.title}</h3>

        <div className="flex items-center gap-2 mb-4">
          {prompt.category && (
            <span
              className="px-2.5 py-0.5 rounded text-xs font-medium"
              style={{
                backgroundColor: prompt.category.color + '20',
                color: prompt.category.color,
              }}
            >
              {prompt.category.name}
            </span>
          )}
          <span className={`cursor-pointer ${prompt.is_favorite ? 'text-amber-400' : 'text-slate-300'}`}>
            {prompt.is_favorite ? '★' : '☆'}
          </span>
        </div>

        {prompt.description && (
          <div className="mb-4">
            <h4 className="text-xs font-semibold uppercase text-slate-400 tracking-wide mb-1">Description</h4>
            <p className="text-sm text-slate-600 leading-relaxed">{prompt.description}</p>
          </div>
        )}

        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <h4 className="text-xs font-semibold uppercase text-slate-400 tracking-wide">Prompt</h4>
            <button
              onClick={copyToClipboard}
              className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] text-slate-500 hover:bg-slate-200"
            >
              📋 Copy
            </button>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
            {prompt.content}
          </div>
        </div>

        {prompt.tags && prompt.tags.length > 0 && (
          <div className="mb-4">
            <h4 className="text-xs font-semibold uppercase text-slate-400 tracking-wide mb-1.5">Tags</h4>
            <div className="flex gap-1.5 flex-wrap">
              {prompt.tags.map((tag) => (
                <TagBadge key={tag.id} name={tag.name} />
              ))}
            </div>
          </div>
        )}

        <div className="text-xs text-slate-400 flex gap-4">
          <span>Created: {new Date(prompt.created_at).toLocaleDateString()}</span>
          <span>Updated: {new Date(prompt.updated_at).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}
