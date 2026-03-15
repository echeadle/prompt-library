import { describe, it, expect } from 'vitest';
import { extractPromptBlock } from '../components/AIMessage';

describe('extractPromptBlock', () => {
  it('extracts content from prompt code block', () => {
    const text = 'Here is a prompt:\n```prompt\nYou are a helpful assistant.\n```\nEnjoy!';
    expect(extractPromptBlock(text)).toBe('You are a helpful assistant.');
  });

  it('returns null when no prompt block exists', () => {
    expect(extractPromptBlock('Just regular text')).toBeNull();
  });

  it('extracts multi-line prompt blocks', () => {
    const text = '```prompt\nLine 1\nLine 2\nLine 3\n```';
    expect(extractPromptBlock(text)).toBe('Line 1\nLine 2\nLine 3');
  });
});
