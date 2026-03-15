import { useState, useRef } from 'react';
import { useTags } from '../hooks/useTags';

interface Props {
  value: string[];
  onChange: (tags: string[]) => void;
}

export default function TagComboInput({ value, onChange }: Props) {
  const [input, setInput] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { data: allTags = [] } = useTags();

  const filtered = allTags.filter(
    (t) => t.name.includes(input.toLowerCase()) && !value.includes(t.name)
  );

  const addTag = (name: string) => {
    const normalized = name.toLowerCase().trim();
    if (normalized && !value.includes(normalized)) {
      onChange([...value, normalized]);
    }
    setInput('');
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  const removeTag = (name: string) => {
    onChange(value.filter((t) => t !== name));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ',') && input.trim()) {
      e.preventDefault();
      addTag(input);
    }
    if (e.key === 'Backspace' && !input && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  };

  return (
    <div className="relative">
      <div className="flex flex-wrap gap-1.5 p-2 border border-slate-200 rounded-lg bg-white min-h-[40px]">
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-xs"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="text-indigo-400 hover:text-indigo-600"
            >
              ×
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? 'Add tags...' : ''}
          className="flex-1 min-w-[80px] text-sm outline-none bg-transparent"
        />
      </div>

      {showDropdown && input && filtered.length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-32 overflow-y-auto">
          {filtered.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => addTag(tag.name)}
              className="w-full text-left px-3 py-1.5 text-sm hover:bg-slate-50"
            >
              {tag.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
