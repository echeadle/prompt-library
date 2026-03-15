import { useState, useEffect } from 'react';
import { getAISettings, updateAISettings } from '../api/ai';
import toast from 'react-hot-toast';

const MODELS: Record<string, { label: string; value: string }[]> = {
  anthropic: [
    { label: 'Claude Sonnet 4', value: 'claude-sonnet-4-20250514' },
    { label: 'Claude Opus 4', value: 'claude-opus-4-20250514' },
  ],
  openai: [
    { label: 'GPT-4o', value: 'gpt-4o' },
    { label: 'GPT-4o Mini', value: 'gpt-4o-mini' },
  ],
};

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function AISettingsModal({ open, onClose }: Props) {
  const [provider, setProvider] = useState('anthropic');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('claude-sonnet-4-20250514');
  const [hasExistingKey, setHasExistingKey] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    getAISettings().then((settings) => {
      setProvider(settings.provider);
      setModel(settings.model);
      setHasExistingKey(settings.hasApiKey);
      setApiKey('');
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, [open]);

  const handleProviderChange = (newProvider: string) => {
    setProvider(newProvider);
    setModel(MODELS[newProvider]?.[0]?.value ?? '');
  };

  const handleSave = async () => {
    try {
      await updateAISettings({
        provider,
        model,
        ...(apiKey ? { apiKey } : {}),
      });
      toast.success('AI settings saved');
      onClose();
    } catch {
      toast.error('Failed to save settings');
    }
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-[60]" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] bg-white rounded-xl shadow-2xl z-[70] p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-slate-800">AI Settings</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">&times;</button>
        </div>

        {loading ? (
          <div className="text-center text-slate-400 py-8">Loading...</div>
        ) : (
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-semibold uppercase text-slate-400 tracking-wide mb-1 block">
                Provider
              </label>
              <select
                value={provider}
                onChange={(e) => handleProviderChange(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
              >
                <option value="anthropic">Anthropic (Claude)</option>
                <option value="openai">OpenAI (GPT)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase text-slate-400 tracking-wide mb-1 block">
                API Key
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={hasExistingKey ? '••••••••••• (saved)' : 'Enter your API key'}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase text-slate-400 tracking-wide mb-1 block">
                Model
              </label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
              >
                {(MODELS[provider] ?? []).map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>

            {/* Note: "Test connection" button deferred to follow-up task */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
              >
                Save
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
