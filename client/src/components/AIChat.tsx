import { useState, useRef, useEffect } from 'react';
import AIMessage from './AIMessage';
import type { ChatMessage } from '../types';

interface Props {
  messages: ChatMessage[];
  isStreaming: boolean;
  error: string | null;
  actionLabel?: string;
  onSend: (content: string) => void;
  onUsePrompt: (content: string) => void;
}

export default function AIChat({ messages, isStreaming, error, actionLabel, onSend, onUsePrompt }: Props) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    onSend(input.trim());
    setInput('');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="text-center text-slate-400 text-sm mt-8">
            Describe what kind of prompt you need, or ask for help improving one.
          </div>
        )}
        {messages.map((msg, i) => (
          <AIMessage
            key={i}
            role={msg.role}
            content={msg.content}
            actionLabel={actionLabel}
            onUsePrompt={onUsePrompt}
          />
        ))}
        {isStreaming && messages[messages.length - 1]?.content === '' && (
          <div className="flex mb-3">
            <div className="bg-indigo-50 border border-indigo-100 rounded-lg px-3.5 py-2.5 text-sm text-slate-400">
              Thinking...
            </div>
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-3.5 py-2.5 text-sm text-red-600 mb-3">
            {error}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <form onSubmit={handleSubmit} className="border-t border-slate-200 p-3 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Describe what you need or ask for changes..."
          disabled={isStreaming}
          className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isStreaming || !input.trim()}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </form>
    </div>
  );
}
