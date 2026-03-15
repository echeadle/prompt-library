import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchTags, createTag, deleteTag } from '../api/tags';

export function useTags() {
  return useQuery({
    queryKey: ['tags'],
    queryFn: fetchTags,
  });
}

export function useCreateTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => createTag(name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tags'] }),
  });
}

export function useDeleteTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteTag(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tags'] }),
  });
}
