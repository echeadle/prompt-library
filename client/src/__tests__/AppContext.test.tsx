// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, act } from '@testing-library/react';
import { AppProvider, useAppContext } from '../context/AppContext';

function TestComponent() {
  const ctx = useAppContext();
  return (
    <div>
      <span data-testid="mode">{ctx.slideOut.mode}</span>
      <span data-testid="open">{String(ctx.slideOut.open)}</span>
      <span data-testid="prefill">{ctx.slideOut.prefill?.content ?? 'none'}</span>
      <span data-testid="ai-open">{String(ctx.aiModal.open)}</span>
      <span data-testid="ai-mode">{ctx.aiModal.mode}</span>
      <button data-testid="open-create" onClick={() => ctx.openSlideOut('create', undefined, { content: 'prefilled content' })}>Open Create</button>
      <button data-testid="open-ai" onClick={() => ctx.openAIModal('generate')}>Open AI</button>
      <button data-testid="close-ai" onClick={() => ctx.closeAIModal()}>Close AI</button>
    </div>
  );
}

describe('AppContext', () => {
  it('passes prefill data through openSlideOut', () => {
    const { getByTestId } = render(
      <AppProvider><TestComponent /></AppProvider>
    );

    act(() => getByTestId('open-create').click());
    expect(getByTestId('prefill').textContent).toBe('prefilled content');
    expect(getByTestId('mode').textContent).toBe('create');
  });

  it('manages AI modal state', () => {
    const { getByTestId } = render(
      <AppProvider><TestComponent /></AppProvider>
    );

    expect(getByTestId('ai-open').textContent).toBe('false');
    act(() => getByTestId('open-ai').click());
    expect(getByTestId('ai-open').textContent).toBe('true');
    expect(getByTestId('ai-mode').textContent).toBe('generate');
    act(() => getByTestId('close-ai').click());
    expect(getByTestId('ai-open').textContent).toBe('false');
  });
});
