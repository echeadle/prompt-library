import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchPrompts, fetchPrompt, createPrompt, updatePrompt, deletePrompt } from '../api/prompts';
import type { PromptFilters, PromptInput } from '../types';

export function usePrompts(filters: PromptFilters = {}) {
  return useQuery({
    queryKey: ['prompts', filters],
    queryFn: () => fetchPrompts(filters),
  });
}

export function usePrompt(id: number | undefined) {
  return useQuery({
    queryKey: ['prompt', id],
    queryFn: () => fetchPrompt(id!),
    enabled: !!id,
  });
}

export function useCreatePrompt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: PromptInput) => createPrompt(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompts'] });
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
  });
}

export function useUpdatePrompt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: { id: number } & Partial<PromptInput> & { is_favorite?: number }) =>
      updatePrompt(id, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['prompts'] });
      queryClient.invalidateQueries({ queryKey: ['prompt', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
  });
}

export function useDeletePrompt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deletePrompt(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompts'] });
    },
  });
}
