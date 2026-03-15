import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AppProvider } from './context/AppContext';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <div className="flex h-screen bg-white text-slate-800">
          <main className="flex-1 flex items-center justify-center text-slate-400">
            Prompt Library — UI coming next
          </main>
        </div>
        <Toaster position="bottom-right" />
      </AppProvider>
    </QueryClientProvider>
  );
}
