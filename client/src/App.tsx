import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AppProvider } from './context/AppContext';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <div className="flex h-screen bg-white text-slate-800">
          <Sidebar />
          <div className="flex-1 flex flex-col">
            <TopBar />
            <main className="flex-1 overflow-y-auto p-5 text-slate-400">
              Cards go here
            </main>
          </div>
        </div>
        <Toaster position="bottom-right" />
      </AppProvider>
    </QueryClientProvider>
  );
}
