export interface Category {
  id: number;
  name: string;
  color: string;
}

export interface Tag {
  id: number;
  name: string;
}

export interface Prompt {
  id: number;
  title: string;
  content: string;
  description: string | null;
  category_id: number;
  is_favorite: number;
  created_at: string;
  updated_at: string;
  category?: Category;
  tags?: Tag[];
}

export interface PromptInput {
  title: string;
  content: string;
  description?: string;
  category_id: number;
  tags: string[];
}

export interface PromptFilters {
  q?: string;
  category?: number;
  tag?: number;
  favorite?: boolean;
  sort?: 'created_at' | 'updated_at' | 'title' | 'is_favorite';
  order?: 'asc' | 'desc';
}

export interface ImportResult {
  imported: number;
  skipped: number;
}
