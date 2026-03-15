// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TagComboInput from '../components/TagComboInput';

function renderWithQuery(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

describe('TagComboInput', () => {
  it('renders with placeholder when empty', () => {
    const onChange = vi.fn();
    renderWithQuery(<TagComboInput value={[]} onChange={onChange} />);
    expect(screen.getByPlaceholderText('Add tags...')).toBeInTheDocument();
  });

  it('renders existing tags as pills', () => {
    const onChange = vi.fn();
    renderWithQuery(<TagComboInput value={['python', 'debug']} onChange={onChange} />);
    expect(screen.getByText('python')).toBeInTheDocument();
    expect(screen.getByText('debug')).toBeInTheDocument();
  });

  it('adds a tag on Enter', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithQuery(<TagComboInput value={[]} onChange={onChange} />);
    const input = screen.getByPlaceholderText('Add tags...');
    await user.type(input, 'newtag{Enter}');
    expect(onChange).toHaveBeenCalledWith(['newtag']);
  });

  it('removes a tag when x is clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithQuery(<TagComboInput value={['python', 'debug']} onChange={onChange} />);
    const removeButtons = screen.getAllByText('×');
    await user.click(removeButtons[0]);
    expect(onChange).toHaveBeenCalledWith(['debug']);
  });
});
