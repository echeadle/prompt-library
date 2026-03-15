import { useAppContext } from '../context/AppContext';
import { usePrompt, useCreatePrompt, useUpdatePrompt, useDeletePrompt } from '../hooks/usePrompts';
import PromptView from './PromptView';
import PromptForm from './PromptForm';
import toast from 'react-hot-toast';

export default function PromptSlideOut() {
  const { slideOut, closeSlideOut, openSlideOut } = useAppContext();
  const { data: prompt } = usePrompt(slideOut.promptId);
  const createPrompt = useCreatePrompt();
  const updatePrompt = useUpdatePrompt();
  const deletePrompt = useDeletePrompt();

  if (!slideOut.open) return null;

  const handleCreate = (data: any) => {
    createPrompt.mutate(data, {
      onSuccess: () => {
        toast.success('Prompt created!');
        closeSlideOut();
      },
      onError: () => toast.error('Failed to create prompt'),
    });
  };

  const handleUpdate = (data: any) => {
    if (!slideOut.promptId) return;
    updatePrompt.mutate({ id: slideOut.promptId, ...data }, {
      onSuccess: () => {
        toast.success('Prompt saved!');
        openSlideOut('view', slideOut.promptId);
      },
      onError: () => toast.error('Failed to save prompt'),
    });
  };

  const handleDelete = () => {
    if (!slideOut.promptId) return;
    deletePrompt.mutate(slideOut.promptId, {
      onSuccess: () => {
        toast.success('Prompt deleted');
        closeSlideOut();
      },
      onError: () => toast.error('Failed to delete prompt'),
    });
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-40"
        onClick={closeSlideOut}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-[420px] max-md:w-full bg-white border-l border-slate-200 shadow-xl z-50 flex flex-col">
        {/* Close button */}
        <button
          onClick={closeSlideOut}
          className="absolute top-3 right-3 p-1 text-slate-400 hover:text-slate-600 border border-slate-200 rounded-md z-10"
        >
          ✕
        </button>

        {slideOut.mode === 'create' && (
          <PromptForm
            prefill={slideOut.prefill}
            onSubmit={handleCreate}
            onCancel={closeSlideOut}
          />
        )}

        {slideOut.mode === 'edit' && prompt && (
          <PromptForm
            prompt={slideOut.prefill ? { ...prompt, content: slideOut.prefill.content } : prompt}
            onSubmit={handleUpdate}
            onCancel={() => openSlideOut('view', slideOut.promptId)}
          />
        )}

        {slideOut.mode === 'view' && prompt && (
          <PromptView
            prompt={prompt}
            onEdit={() => openSlideOut('edit', slideOut.promptId)}
            onDelete={handleDelete}
          />
        )}
      </div>
    </>
  );
}
