import type { Prompt, PromptInput, PromptFilters, ImportResult } from '../types';

const BASE = '/api';

export async function fetchPrompts(filters: PromptFilters = {}): Promise<Prompt[]> {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  if (filters.category) params.set('category', String(filters.category));
  if (filters.tag) params.set('tag', String(filters.tag));
  if (filters.favorite) params.set('favorite', 'true');
  if (filters.sort) params.set('sort', filters.sort);
  if (filters.order) params.set('order', filters.order);

  const res = await fetch(`${BASE}/prompts?${params}`);
  if (!res.ok) throw new Error('Failed to fetch prompts');
  return res.json();
}

export async function fetchPrompt(id: number): Promise<Prompt> {
  const res = await fetch(`${BASE}/prompts/${id}`);
  if (!res.ok) throw new Error('Failed to fetch prompt');
  return res.json();
}

export async function createPrompt(input: PromptInput): Promise<Prompt> {
  const res = await fetch(`${BASE}/prompts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error('Failed to create prompt');
  return res.json();
}

export async function updatePrompt(id: number, input: Partial<PromptInput> & { is_favorite?: number }): Promise<Prompt> {
  const res = await fetch(`${BASE}/prompts/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error('Failed to update prompt');
  return res.json();
}

export async function deletePrompt(id: number): Promise<void> {
  const res = await fetch(`${BASE}/prompts/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete prompt');
}

export async function exportPrompts(filters: PromptFilters = {}): Promise<{ prompts: any[] }> {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  if (filters.category) params.set('category', String(filters.category));
  if (filters.tag) params.set('tag', String(filters.tag));
  if (filters.favorite) params.set('favorite', 'true');

  const res = await fetch(`${BASE}/export?${params}`);
  if (!res.ok) throw new Error('Failed to export');
  return res.json();
}

export async function importPrompts(data: { prompts: any[] }): Promise<ImportResult> {
  const res = await fetch(`${BASE}/import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to import');
  return res.json();
}
