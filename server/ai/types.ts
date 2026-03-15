import type { ChatMessage } from '../../shared/types.js';

export type { ChatMessage };

export interface AIProvider {
  chat(params: {
    messages: ChatMessage[];
    systemPrompt: string;
    onToken: (token: string) => void;
    onDone: () => void;
    onError: (error: string) => void;
  }): Promise<void>;
}
