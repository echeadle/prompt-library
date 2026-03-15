import { createContext, useContext, useState, type ReactNode } from 'react';

interface SlideOutState {
  open: boolean;
  mode: 'view' | 'edit' | 'create';
  promptId?: number;
  prefill?: { content: string };
}

interface AIModalState {
  open: boolean;
  mode: 'generate' | 'review';
  promptId?: number;
}

interface AppState {
  selectedCategory: number | null;
  selectedTags: number[];
  searchQuery: string;
  favoritesOnly: boolean;
  viewMode: 'grid' | 'list';
  sortField: 'created_at' | 'updated_at' | 'title' | 'is_favorite';
  sortOrder: 'asc' | 'desc';
  slideOut: SlideOutState;
  aiModal: AIModalState;
}

interface AppContextType extends AppState {
  setSelectedCategory: (id: number | null) => void;
  setSelectedTags: (tags: number[]) => void;
  setSearchQuery: (q: string) => void;
  setFavoritesOnly: (v: boolean) => void;
  setViewMode: (mode: 'grid' | 'list') => void;
  setSortField: (field: AppState['sortField']) => void;
  setSortOrder: (order: 'asc' | 'desc') => void;
  openSlideOut: (mode: SlideOutState['mode'], promptId?: number, prefill?: { content: string }) => void;
  closeSlideOut: () => void;
  openAIModal: (mode: AIModalState['mode'], promptId?: number) => void;
  closeAIModal: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortField, setSortField] = useState<AppState['sortField']>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [slideOut, setSlideOut] = useState<SlideOutState>({ open: false, mode: 'view' });
  const [aiModal, setAIModal] = useState<AIModalState>({ open: false, mode: 'generate' });

  const openSlideOut = (mode: SlideOutState['mode'], promptId?: number, prefill?: { content: string }) => {
    setSlideOut({ open: true, mode, promptId, prefill });
  };

  const closeSlideOut = () => {
    setSlideOut({ open: false, mode: 'view' });
  };

  const openAIModal = (mode: AIModalState['mode'], promptId?: number) => {
    setAIModal({ open: true, mode, promptId });
  };

  const closeAIModal = () => {
    setAIModal({ open: false, mode: 'generate' });
  };

  return (
    <AppContext.Provider
      value={{
        selectedCategory, setSelectedCategory,
        selectedTags, setSelectedTags,
        searchQuery, setSearchQuery,
        favoritesOnly, setFavoritesOnly,
        viewMode, setViewMode,
        sortField, setSortField,
        sortOrder, setSortOrder,
        slideOut, openSlideOut, closeSlideOut,
        aiModal, openAIModal, closeAIModal,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}
