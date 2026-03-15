// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppProvider } from '../context/AppContext';
import PromptCard from '../components/PromptCard';
import type { Prompt } from '../types';

const mockPrompt: Prompt = {
  id: 1,
  title: 'Test Prompt',
  content: 'This is the prompt content for testing purposes',
  description: 'A test description',
  category_id: 2,
  is_favorite: 0,
  created_at: '2026-03-14',
  updated_at: '2026-03-14',
  category: { id: 2, name: 'Coding', color: '#3b82f6' },
  tags: [{ id: 1, name: 'python' }, { id: 2, name: 'debug' }],
};

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <AppProvider>{ui}</AppProvider>
    </QueryClientProvider>
  );
}

describe('PromptCard', () => {
  it('renders title, category, and tags', () => {
    renderWithProviders(<PromptCard prompt={mockPrompt} />);
    expect(screen.getByText('Test Prompt')).toBeInTheDocument();
    expect(screen.getByText('Coding')).toBeInTheDocument();
    expect(screen.getByText('python')).toBeInTheDocument();
    expect(screen.getByText('debug')).toBeInTheDocument();
  });

  it('renders content preview', () => {
    renderWithProviders(<PromptCard prompt={mockPrompt} />);
    expect(screen.getByText(/This is the prompt content/)).toBeInTheDocument();
  });

  it('shows empty star when not favorited', () => {
    renderWithProviders(<PromptCard prompt={mockPrompt} />);
    expect(screen.getByText('☆')).toBeInTheDocument();
  });

  it('shows filled star when favorited', () => {
    const fav = { ...mockPrompt, is_favorite: 1 };
    renderWithProviders(<PromptCard prompt={fav} />);
    expect(screen.getByText('★')).toBeInTheDocument();
  });
});
