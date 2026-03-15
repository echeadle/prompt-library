import type { AIProvider } from './types.js';

export function createAnthropicProvider(apiKey: string, model: string): AIProvider {
  return {
    async chat({ messages, systemPrompt, onToken, onDone, onError }) {
      let response: Response;
      try {
        response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model,
            max_tokens: 4096,
            system: systemPrompt,
            messages,
            stream: true,
          }),
        });
      } catch (err) {
        onError(`Network error: ${err instanceof Error ? err.message : 'Unknown error'}`);
        return;
      }

      if (!response.ok) {
        const text = await response.text();
        try {
          const parsed = JSON.parse(text);
          onError(parsed.error?.message ?? `API error (${response.status})`);
        } catch {
          onError(`API error (${response.status}): ${text}`);
        }
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
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                onToken(parsed.delta.text);
              }
            } catch {
              // Skip malformed JSON lines
            }
          }
        }
      } catch (err) {
        onError(`Stream error: ${err instanceof Error ? err.message : 'Unknown error'}`);
        return;
      }

      onDone();
    },
  };
}
