import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AppProvider, useAppContext } from './context/AppContext';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import PromptGrid from './components/PromptGrid';
import PromptSlideOut from './components/PromptSlideOut';
import AIModal from './components/AIModal';

const queryClient = new QueryClient();

function KeyboardShortcuts() {
  const { openAIModal, aiModal } = useAppContext();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        if (!aiModal.open) openAIModal('generate');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [openAIModal, aiModal.open]);

  return null;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <KeyboardShortcuts />
        <div className="flex h-screen bg-white text-slate-800">
          <Sidebar />
          <div className="flex-1 flex flex-col">
            <TopBar />
            <main className="flex-1 overflow-y-auto">
              <PromptGrid />
            </main>
          </div>
        </div>
        <PromptSlideOut />
        <AIModal />
        <Toaster position="bottom-right" />
      </AppProvider>
    </QueryClientProvider>
  );
}
