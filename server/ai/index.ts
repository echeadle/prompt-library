import type { AIProvider } from './types.js';
import { createAnthropicProvider } from './anthropic.js';
import { createOpenAIProvider } from './openai.js';

export function createProvider(provider: string, apiKey: string, model: string): AIProvider {
  switch (provider) {
    case 'anthropic':
      return createAnthropicProvider(apiKey, model);
    case 'openai':
      return createOpenAIProvider(apiKey, model);
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

export type { AIProvider, ChatMessage } from './types.js';
