import type { AIProvider } from './types.js';

export function createOpenAIProvider(apiKey: string, model: string): AIProvider {
  return {
    async chat({ messages, systemPrompt, onToken, onDone, onError }) {
      const apiMessages = [
        { role: 'system' as const, content: systemPrompt },
        ...messages,
      ];

      let response: Response;
      try {
        response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages: apiMessages,
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
            if (data === '[DONE]') {
              onDone();
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                onToken(content);
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
