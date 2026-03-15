import type { AISettings, AISettingsInput, AIChatRequest } from '../types';

const BASE = '/api';

export async function getAISettings(): Promise<AISettings> {
  const res = await fetch(`${BASE}/ai/settings`);
  if (!res.ok) throw new Error('Failed to fetch AI settings');
  return res.json();
}

export async function updateAISettings(input: AISettingsInput): Promise<void> {
  const res = await fetch(`${BASE}/ai/settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error('Failed to update AI settings');
}

export async function sendAIMessage(
  request: AIChatRequest,
  onToken: (token: string) => void,
  onDone: () => void,
  onError: (error: string) => void,
  signal?: AbortSignal,
): Promise<void> {
  let response: Response;
  try {
    response = await fetch(`${BASE}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      signal,
    });
  } catch (err) {
    if (signal?.aborted) return;
    onError(`Network error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    return;
  }

  if (!response.ok) {
    const data = await response.json().catch(() => ({ error: 'Request failed' }));
    onError(data.error ?? `Error (${response.status})`);
    return;
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        try {
          const parsed = JSON.parse(line.slice(6));
          if (parsed.type === 'token') onToken(parsed.content);
          else if (parsed.type === 'done') onDone();
          else if (parsed.type === 'error') onError(parsed.content);
        } catch {
          // Skip malformed lines
        }
      }
    }
  } catch (err) {
    if (signal?.aborted) return;
    onError(`Stream error: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}
