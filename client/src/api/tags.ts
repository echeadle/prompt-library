import type { Tag } from '../types';

const BASE = '/api';

export async function fetchTags(): Promise<Tag[]> {
  const res = await fetch(`${BASE}/tags`);
  if (!res.ok) throw new Error('Failed to fetch tags');
  return res.json();
}

export async function createTag(name: string): Promise<Tag> {
  const res = await fetch(`${BASE}/tags`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error('Failed to create tag');
  return res.json();
}

export async function deleteTag(id: number): Promise<void> {
  const res = await fetch(`${BASE}/tags/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete tag');
}
