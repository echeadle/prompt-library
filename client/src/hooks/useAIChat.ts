import { useState, useCallback, useRef } from 'react';
import { sendAIMessage } from '../api/ai';
import type { ChatMessage, AIChatRequest } from '../types';

interface UseAIChatOptions {
  mode: 'generate' | 'review';
  context?: AIChatRequest['context'];
}

export function useAIChat({ mode, context }: UseAIChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    const userMessage: ChatMessage = { role: 'user', content };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsStreaming(true);
    setError(null);

    // Add empty assistant message that will be built up via streaming
    const assistantMessage: ChatMessage = { role: 'assistant', content: '' };
    setMessages([...updatedMessages, assistantMessage]);

    const abortController = new AbortController();
    abortRef.current = abortController;

    await sendAIMessage(
      { messages: updatedMessages, mode, context },
      (token) => {
        assistantMessage.content += token;
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { ...assistantMessage };
          return next;
        });
      },
      () => {
        setIsStreaming(false);
        abortRef.current = null;
      },
      (err) => {
        setError(err);
        setIsStreaming(false);
        abortRef.current = null;
      },
      abortController.signal,
    );
  }, [messages, mode, context]);

  const abort = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setIsStreaming(false);
    setError(null);
  }, []);

  return { messages, isStreaming, error, sendMessage, abort, reset };
}
