import { describe, it, expect } from 'vitest';
import { buildSystemPrompt } from '../ai/systemPrompts.js';

describe('buildSystemPrompt', () => {
  it('builds generate mode prompt with context', () => {
    const result = buildSystemPrompt('generate', {
      categories: ['Coding', 'Writing'],
      tags: ['python', 'blog'],
      promptCount: 5,
    });
    expect(result).toContain('prompt engineering expert');
    expect(result).toContain('Coding, Writing');
    expect(result).toContain('5 existing prompts');
    expect(result).toContain('python, blog');
    expect(result).toContain('```prompt');
  });

  it('builds review mode prompt with prompt context', () => {
    const result = buildSystemPrompt('review', {
      prompt: { title: 'Test Prompt', content: 'Test content', category: 'Coding' },
      categories: ['Coding'],
      tags: ['test'],
      promptCount: 1,
    });
    expect(result).toContain('reviewing and improving');
    expect(result).toContain('Title: Test Prompt');
    expect(result).toContain('Test content');
    expect(result).toContain('Category: Coding');
  });

  it('handles missing context gracefully', () => {
    const result = buildSystemPrompt('generate');
    expect(result).toContain('prompt engineering expert');
    expect(result).toContain('none');
  });
});
