import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createAnthropicProvider } from '../ai/anthropic.js';
import { createOpenAIProvider } from '../ai/openai.js';

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('Anthropic provider', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('sends correct request format', async () => {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"Hello"}}\n\n'));
        controller.enqueue(encoder.encode('data: {"type":"message_stop"}\n\n'));
        controller.close();
      },
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      body: stream,
    });

    const tokens: string[] = [];
    let done = false;
    const provider = createAnthropicProvider('test-key', 'claude-sonnet-4-20250514');

    await provider.chat({
      messages: [{ role: 'user', content: 'Hi' }],
      systemPrompt: 'You are helpful.',
      onToken: (t) => tokens.push(t),
      onDone: () => { done = true; },
      onError: () => {},
    });

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toBe('https://api.anthropic.com/v1/messages');
    expect(opts.method).toBe('POST');
    const body = JSON.parse(opts.body);
    expect(body.model).toBe('claude-sonnet-4-20250514');
    expect(body.system).toBe('You are helpful.');
    expect(body.messages).toEqual([{ role: 'user', content: 'Hi' }]);
    expect(body.stream).toBe(true);
    expect(tokens).toEqual(['Hello']);
    expect(done).toBe(true);
  });

  it('calls onError for non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => '{"error":{"message":"Invalid API key"}}',
    });

    let errorMsg = '';
    const provider = createAnthropicProvider('bad-key', 'claude-sonnet-4-20250514');

    await provider.chat({
      messages: [{ role: 'user', content: 'Hi' }],
      systemPrompt: 'test',
      onToken: () => {},
      onDone: () => {},
      onError: (e) => { errorMsg = e; },
    });

    expect(errorMsg).toContain('Invalid API key');
  });
});

describe('OpenAI provider', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('sends correct request format', async () => {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n'));
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      },
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      body: stream,
    });

    const tokens: string[] = [];
    let done = false;
    const provider = createOpenAIProvider('test-key', 'gpt-4o');

    await provider.chat({
      messages: [{ role: 'user', content: 'Hi' }],
      systemPrompt: 'You are helpful.',
      onToken: (t) => tokens.push(t),
      onDone: () => { done = true; },
      onError: () => {},
    });

    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toBe('https://api.openai.com/v1/chat/completions');
    const body = JSON.parse(opts.body);
    expect(body.model).toBe('gpt-4o');
    expect(body.messages[0]).toEqual({ role: 'system', content: 'You are helpful.' });
    expect(body.messages[1]).toEqual({ role: 'user', content: 'Hi' });
    expect(body.stream).toBe(true);
    expect(tokens).toEqual(['Hello']);
    expect(done).toBe(true);
  });
});
