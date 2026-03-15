import type { AIProvider } from './types.js';

export function createProvider(provider: string, apiKey: string, model: string): AIProvider {
  switch (provider) {
    case 'anthropic':
      // Will be implemented in Task 5
      throw new Error('Anthropic provider not yet implemented');
    case 'openai':
      // Will be implemented in Task 6
      throw new Error('OpenAI provider not yet implemented');
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

export type { AIProvider, ChatMessage } from './types.js';
